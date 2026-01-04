-- Update tier CHECK constraint to match new tier IDs
-- Old tiers: free, starter, professional, enterprise
-- New tiers: free, professional, estate, enterprise

-- Drop old constraint
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_tier_check;

-- Add new constraint with updated tier IDs
ALTER TABLE subscriptions
ADD CONSTRAINT subscriptions_tier_check
CHECK (tier IN ('free', 'professional', 'estate', 'enterprise'));

-- Note: If you have existing 'starter' tier subscriptions, run this first:
-- UPDATE subscriptions SET tier = 'professional' WHERE tier = 'starter';
