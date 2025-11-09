-- Add archived_at columns to tables for soft delete functionality

-- Add archived_at to harvest_field_samples (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'harvest_field_samples') THEN
    ALTER TABLE harvest_field_samples ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
    COMMENT ON COLUMN harvest_field_samples.archived_at IS 'Timestamp when the sample was archived (soft delete)';
    CREATE INDEX IF NOT EXISTS idx_harvest_field_samples_archived_at ON harvest_field_samples(archived_at) WHERE archived_at IS NULL;
  END IF;
END $$;

-- Add archived_at to field_attachments (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'field_attachments') THEN
    ALTER TABLE field_attachments ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
    COMMENT ON COLUMN field_attachments.archived_at IS 'Timestamp when the attachment was archived (soft delete)';
    CREATE INDEX IF NOT EXISTS idx_field_attachments_archived_at ON field_attachments(archived_at) WHERE archived_at IS NULL;
  END IF;
END $$;

-- Add archived_at to tasks (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tasks') THEN
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
    COMMENT ON COLUMN tasks.archived_at IS 'Timestamp when the task was archived (soft delete)';
    CREATE INDEX IF NOT EXISTS idx_tasks_archived_at ON tasks(archived_at) WHERE archived_at IS NULL;
  END IF;
END $$;

-- Add archived_at to vineyard_blocks (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'vineyard_blocks') THEN
    ALTER TABLE vineyard_blocks ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
    COMMENT ON COLUMN vineyard_blocks.archived_at IS 'Timestamp when the block was archived (soft delete)';
    CREATE INDEX IF NOT EXISTS idx_vineyard_blocks_archived_at ON vineyard_blocks(archived_at) WHERE archived_at IS NULL;
  END IF;
END $$;
