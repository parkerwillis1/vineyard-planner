-- Check current subscription for the user
SELECT 
  s.user_id,
  u.email,
  s.tier,
  s.modules,
  s.status
FROM subscriptions s
JOIN auth.users u ON u.id = s.user_id
WHERE u.email = 'parkerwillis34@gmail.com';
