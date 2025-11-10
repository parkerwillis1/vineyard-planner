-- Update tasks to support team member assignment

-- Add assigned_to column if it doesn't exist
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS assigned_to UUID;

-- Add assigned_by column if it doesn't exist
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS assigned_by UUID;

-- Drop existing foreign key constraints (if they exist)
ALTER TABLE tasks
  DROP CONSTRAINT IF EXISTS tasks_assigned_to_fkey,
  DROP CONSTRAINT IF EXISTS tasks_assigned_by_fkey;

-- Add foreign key for assigned_to to reference organization_members
ALTER TABLE tasks
  ADD CONSTRAINT tasks_assigned_to_fkey
    FOREIGN KEY (assigned_to) REFERENCES organization_members(id) ON DELETE SET NULL;

-- Add foreign key for assigned_by to reference auth.users
ALTER TABLE tasks
  ADD CONSTRAINT tasks_assigned_by_fkey
    FOREIGN KEY (assigned_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Update RLS policies to allow viewing tasks assigned to you
DROP POLICY IF EXISTS "Users can view own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can view assigned tasks" ON tasks;
DROP POLICY IF EXISTS "Users can view their own tasks" ON tasks;

-- Users can view tasks they created OR tasks assigned to their team members
CREATE POLICY "Users can view own and assigned tasks" ON tasks
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR
    assigned_to IN (
      SELECT id FROM organization_members WHERE user_id = auth.uid()
    )
  );
