-- Add archived_at field to fermentation_logs table
ALTER TABLE fermentation_logs
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS fermentation_logs_archived_at_idx ON fermentation_logs(archived_at);
