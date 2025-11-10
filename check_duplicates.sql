-- Check for duplicate irrigation events
SELECT 
  event_date,
  block_id,
  schedule_id,
  COUNT(*) as event_count
FROM irrigation_events
WHERE source = 'schedule'
GROUP BY event_date, block_id, schedule_id
HAVING COUNT(*) > 1
ORDER BY event_date DESC
LIMIT 20;
