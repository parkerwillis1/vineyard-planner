-- Rate Limiting Table for Sentinel Hub Proxy
-- Implements a simple token bucket algorithm

CREATE TABLE IF NOT EXISTS api_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  identifier TEXT NOT NULL, -- user_id or IP hash as fallback
  bucket_key TEXT NOT NULL, -- e.g., 'sentinel-hub:process', 'sentinel-hub:catalog'
  tokens_remaining INTEGER NOT NULL DEFAULT 60,
  last_refill TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(identifier, bucket_key)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup
  ON api_rate_limits(identifier, bucket_key);

CREATE INDEX IF NOT EXISTS idx_rate_limits_refill
  ON api_rate_limits(last_refill);

-- Rate limit configuration by tier
CREATE TABLE IF NOT EXISTS rate_limit_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier TEXT NOT NULL UNIQUE, -- 'free', 'starter', 'professional', 'enterprise'
  bucket_key TEXT NOT NULL,
  max_tokens INTEGER NOT NULL,        -- Max bucket size
  refill_rate INTEGER NOT NULL,       -- Tokens added per minute
  refill_interval_seconds INTEGER NOT NULL DEFAULT 60,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(tier, bucket_key)
);

-- Insert default rate limit configs
INSERT INTO rate_limit_config (tier, bucket_key, max_tokens, refill_rate, refill_interval_seconds) VALUES
  ('free', 'sentinel-hub:process', 10, 2, 60),        -- 10 max, 2/min refill
  ('free', 'sentinel-hub:catalog', 30, 5, 60),        -- 30 max, 5/min refill
  ('starter', 'sentinel-hub:process', 30, 5, 60),     -- 30 max, 5/min refill
  ('starter', 'sentinel-hub:catalog', 60, 10, 60),    -- 60 max, 10/min refill
  ('professional', 'sentinel-hub:process', 60, 10, 60), -- 60 max, 10/min refill
  ('professional', 'sentinel-hub:catalog', 120, 20, 60), -- 120 max, 20/min refill
  ('enterprise', 'sentinel-hub:process', 120, 30, 60),   -- 120 max, 30/min refill
  ('enterprise', 'sentinel-hub:catalog', 300, 60, 60)    -- 300 max, 60/min refill
ON CONFLICT (tier, bucket_key) DO UPDATE SET
  max_tokens = EXCLUDED.max_tokens,
  refill_rate = EXCLUDED.refill_rate;

-- Function to check and consume rate limit tokens
-- Returns: { allowed: boolean, tokens_remaining: int, retry_after_seconds: int }
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_identifier TEXT,
  p_bucket_key TEXT,
  p_tier TEXT DEFAULT 'free',
  p_tokens_to_consume INTEGER DEFAULT 1
)
RETURNS JSONB AS $$
DECLARE
  v_config rate_limit_config%ROWTYPE;
  v_limit api_rate_limits%ROWTYPE;
  v_now TIMESTAMPTZ := NOW();
  v_seconds_since_refill NUMERIC;
  v_tokens_to_add INTEGER;
  v_new_tokens INTEGER;
  v_retry_after INTEGER;
BEGIN
  -- Get config for this tier and bucket
  SELECT * INTO v_config
  FROM rate_limit_config
  WHERE tier = p_tier AND bucket_key = p_bucket_key;

  -- Use free tier defaults if no config found
  IF v_config.id IS NULL THEN
    v_config.max_tokens := 10;
    v_config.refill_rate := 2;
    v_config.refill_interval_seconds := 60;
  END IF;

  -- Get or create rate limit record
  INSERT INTO api_rate_limits (identifier, bucket_key, tokens_remaining, last_refill)
  VALUES (p_identifier, p_bucket_key, v_config.max_tokens, v_now)
  ON CONFLICT (identifier, bucket_key) DO NOTHING;

  SELECT * INTO v_limit
  FROM api_rate_limits
  WHERE identifier = p_identifier AND bucket_key = p_bucket_key
  FOR UPDATE;

  -- Calculate tokens to add based on time elapsed
  v_seconds_since_refill := EXTRACT(EPOCH FROM (v_now - v_limit.last_refill));
  v_tokens_to_add := FLOOR(v_seconds_since_refill / v_config.refill_interval_seconds * v_config.refill_rate);

  -- Add tokens (capped at max)
  v_new_tokens := LEAST(v_limit.tokens_remaining + v_tokens_to_add, v_config.max_tokens);

  -- Update last refill time if we added tokens
  IF v_tokens_to_add > 0 THEN
    UPDATE api_rate_limits
    SET tokens_remaining = v_new_tokens, last_refill = v_now
    WHERE id = v_limit.id;
    v_limit.tokens_remaining := v_new_tokens;
  END IF;

  -- Check if we have enough tokens
  IF v_limit.tokens_remaining >= p_tokens_to_consume THEN
    -- Consume tokens
    UPDATE api_rate_limits
    SET tokens_remaining = tokens_remaining - p_tokens_to_consume
    WHERE id = v_limit.id;

    RETURN jsonb_build_object(
      'allowed', true,
      'tokens_remaining', v_limit.tokens_remaining - p_tokens_to_consume,
      'retry_after_seconds', 0
    );
  ELSE
    -- Calculate retry after
    v_retry_after := CEIL(
      (p_tokens_to_consume - v_limit.tokens_remaining) *
      v_config.refill_interval_seconds / v_config.refill_rate
    );

    RETURN jsonb_build_object(
      'allowed', false,
      'tokens_remaining', v_limit.tokens_remaining,
      'retry_after_seconds', v_retry_after
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Grant execute to service role (edge functions use service role)
GRANT EXECUTE ON FUNCTION check_rate_limit TO service_role;
GRANT ALL ON api_rate_limits TO service_role;
GRANT SELECT ON rate_limit_config TO service_role;

-- RLS for rate limits (users can see their own)
ALTER TABLE api_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rate limits" ON api_rate_limits
  FOR SELECT USING (user_id = auth.uid() OR identifier = auth.uid()::text);

-- Cleanup function for old rate limit entries
CREATE OR REPLACE FUNCTION cleanup_rate_limits()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  WITH deleted AS (
    DELETE FROM api_rate_limits
    WHERE last_refill < NOW() - INTERVAL '24 hours'
    RETURNING 1
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
