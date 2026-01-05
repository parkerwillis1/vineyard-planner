-- Create subscriptions for existing users who don't have one
-- This fixes the 406 error for users created before the trigger was set up

INSERT INTO public.subscriptions (user_id, tier, modules, status)
SELECT id, 'free', ARRAY['planner']::TEXT[], 'active'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.subscriptions)
ON CONFLICT (user_id) DO NOTHING;

-- Show results
SELECT
  u.email,
  s.tier,
  s.modules,
  s.status
FROM auth.users u
LEFT JOIN public.subscriptions s ON u.id = s.user_id
ORDER BY u.created_at DESC;
