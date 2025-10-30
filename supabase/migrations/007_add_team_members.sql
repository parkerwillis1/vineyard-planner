-- =====================================================
-- TEAM MEMBERS & ROLE-BASED ACCESS
-- =====================================================

-- User roles enumeration
CREATE TYPE user_role AS ENUM (
  'owner',      -- Full access, can manage team
  'admin',      -- Full access to operations
  'manager',    -- Can create/assign tasks, view all
  'employee'    -- Can view/update assigned tasks only
);

-- Team members table
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL, -- owner's user_id

  -- Member info
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'employee',

  -- Employment details
  job_title TEXT,
  hourly_rate NUMERIC,
  phone TEXT,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  invited_at TIMESTAMPTZ DEFAULT now(),
  joined_at TIMESTAMPTZ,

  -- Permissions
  can_view_costs BOOLEAN DEFAULT FALSE,
  can_manage_blocks BOOLEAN DEFAULT FALSE,
  can_manage_tasks BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Each user can only be in an org once
  UNIQUE(organization_id, email)
);

CREATE INDEX idx_team_members_user_id ON team_members(user_id);
CREATE INDEX idx_team_members_organization_id ON team_members(organization_id);
CREATE INDEX idx_team_members_email ON team_members(email);
CREATE INDEX idx_team_members_role ON team_members(role);
CREATE INDEX idx_team_members_is_active ON team_members(is_active) WHERE is_active = TRUE;

-- RLS Policies
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Users can view team members in their organization
CREATE POLICY "Users can view team members in their org" ON team_members
  FOR SELECT USING (
    organization_id = auth.uid() OR
    user_id = auth.uid()
  );

-- Only owners/admins can insert team members
CREATE POLICY "Owners/admins can insert team members" ON team_members
  FOR INSERT WITH CHECK (
    organization_id = auth.uid()
  );

-- Only owners/admins can update team members
CREATE POLICY "Owners/admins can update team members" ON team_members
  FOR UPDATE USING (
    organization_id = auth.uid()
  );

-- Only owners can delete team members
CREATE POLICY "Owners can delete team members" ON team_members
  FOR DELETE USING (
    organization_id = auth.uid()
  );

-- Trigger for updated_at
CREATE TRIGGER update_team_members_updated_at
  BEFORE UPDATE ON team_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE team_members IS 'Team members and their roles within an organization';
COMMENT ON COLUMN team_members.organization_id IS 'The user_id of the organization owner';
COMMENT ON COLUMN team_members.role IS 'Access level: owner, admin, manager, employee';

-- =====================================================
-- UPDATE TASKS RLS FOR TEAM ACCESS
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can insert own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete own tasks" ON tasks;

-- New policies supporting team access
CREATE POLICY "Users can view tasks in their org" ON tasks
  FOR SELECT USING (
    user_id = auth.uid() OR  -- Owner of the task
    auth.uid() = ANY(assignees) OR  -- Assigned to the task
    EXISTS (  -- Part of the org as admin/manager
      SELECT 1 FROM team_members
      WHERE team_members.user_id = auth.uid()
      AND team_members.organization_id = tasks.user_id
      AND team_members.role IN ('admin', 'manager')
      AND team_members.is_active = TRUE
    )
  );

CREATE POLICY "Users can insert tasks in their org" ON tasks
  FOR INSERT WITH CHECK (
    user_id = auth.uid() OR  -- Creating own task
    EXISTS (  -- Part of org with permission
      SELECT 1 FROM team_members
      WHERE team_members.user_id = auth.uid()
      AND team_members.organization_id = user_id
      AND team_members.can_manage_tasks = TRUE
      AND team_members.is_active = TRUE
    )
  );

CREATE POLICY "Users can update tasks in their org" ON tasks
  FOR UPDATE USING (
    user_id = auth.uid() OR  -- Owner
    auth.uid() = ANY(assignees) OR  -- Assigned
    EXISTS (  -- Manager in org
      SELECT 1 FROM team_members
      WHERE team_members.user_id = auth.uid()
      AND team_members.organization_id = tasks.user_id
      AND team_members.role IN ('admin', 'manager')
      AND team_members.is_active = TRUE
    )
  );

CREATE POLICY "Users can delete own tasks" ON tasks
  FOR DELETE USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.user_id = auth.uid()
      AND team_members.organization_id = tasks.user_id
      AND team_members.role IN ('admin', 'manager')
      AND team_members.is_active = TRUE
    )
  );
