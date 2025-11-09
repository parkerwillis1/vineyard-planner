-- Drop and recreate irrigation_schedules table to ensure all columns exist
DROP TABLE IF EXISTS irrigation_schedules CASCADE;

-- Create irrigation_schedules table for recurring irrigation schedules
CREATE TABLE irrigation_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  block_id UUID NOT NULL REFERENCES vineyard_blocks(id) ON DELETE CASCADE,

  -- Schedule timing
  start_date DATE NOT NULL,
  end_date DATE,
  start_time TIME NOT NULL,
  stop_time TIME NOT NULL,

  -- Irrigation parameters
  flow_rate_gpm DECIMAL(10, 2) NOT NULL,
  irrigation_method TEXT NOT NULL DEFAULT 'Drip',

  -- Frequency settings
  frequency_type TEXT NOT NULL CHECK (frequency_type IN ('daily', 'weekly', 'custom')),
  times_per_day INTEGER NOT NULL DEFAULT 1 CHECK (times_per_day >= 1 AND times_per_day <= 10),
  days_of_week INTEGER[] NOT NULL DEFAULT ARRAY[0,1,2,3,4,5,6], -- 0=Sunday, 6=Saturday

  -- Status and metadata
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_irrigation_schedules_block_id ON irrigation_schedules(block_id);
CREATE INDEX idx_irrigation_schedules_user_id ON irrigation_schedules(user_id);
CREATE INDEX idx_irrigation_schedules_active ON irrigation_schedules(is_active);

-- Enable RLS
ALTER TABLE irrigation_schedules ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own schedules" ON irrigation_schedules;
DROP POLICY IF EXISTS "Users can insert their own schedules" ON irrigation_schedules;
DROP POLICY IF EXISTS "Users can update their own schedules" ON irrigation_schedules;
DROP POLICY IF EXISTS "Users can delete their own schedules" ON irrigation_schedules;

-- RLS Policies
CREATE POLICY "Users can view their own schedules"
  ON irrigation_schedules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own schedules"
  ON irrigation_schedules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own schedules"
  ON irrigation_schedules FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own schedules"
  ON irrigation_schedules FOR DELETE
  USING (auth.uid() = user_id);

-- Add source field to irrigation_events table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'irrigation_events' AND column_name = 'source'
  ) THEN
    ALTER TABLE irrigation_events ADD COLUMN source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'schedule', 'webhook'));
  END IF;
END $$;

-- Add schedule_id field to irrigation_events table for linking
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'irrigation_events' AND column_name = 'schedule_id'
  ) THEN
    ALTER TABLE irrigation_events ADD COLUMN schedule_id UUID REFERENCES irrigation_schedules(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for schedule_id (separate from column creation)
CREATE INDEX IF NOT EXISTS idx_irrigation_events_schedule_id ON irrigation_events(schedule_id);


