-- Fix: Reset free tier users to only have 'planner' module
UPDATE subscriptions
SET modules = ARRAY['planner']::TEXT[]
WHERE tier = 'free'
  AND modules != ARRAY['planner']::TEXT[];

-- Show updated subscriptions
SELECT 
  s.user_id,
  u.email,
  s.tier,
  s.modules,
  s.status
FROM subscriptions s
JOIN auth.users u ON u.id = s.user_id
ORDER BY s.updated_at DESC
LIMIT 10;
