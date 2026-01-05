-- Diagnostic and fix for 406 error
-- This script checks and fixes the subscriptions table configuration

-- 1. Check if subscriptions table exists and show its structure
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'subscriptions'
ORDER BY ordinal_position;

-- 2. Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'subscriptions';

-- 3. Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'subscriptions';

-- 4. Create subscription for current test user if missing
DO $$
BEGIN
  -- Create subscriptions for any users without one
  INSERT INTO public.subscriptions (user_id, tier, modules, status)
  SELECT id, 'free', ARRAY['planner']::TEXT[], 'active'
  FROM auth.users
  WHERE id NOT IN (SELECT user_id FROM public.subscriptions)
  ON CONFLICT (user_id) DO NOTHING;
END $$;

-- 5. Show all subscriptions
SELECT user_id, tier, modules, status, trial_ends_at
FROM public.subscriptions;
