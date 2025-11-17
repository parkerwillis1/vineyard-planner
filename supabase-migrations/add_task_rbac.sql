-- =====================================================
-- TASK RBAC: Role-Based Access Control for Tasks
-- =====================================================
-- This migration implements a comprehensive RBAC system for tasks
-- with three roles: Admin, Manager, and Member
--
-- Admin: Full access to all tasks
-- Manager: Can see own tasks + team tasks + created tasks
-- Member: Can only see assigned tasks + own created tasks
--
-- See TASK_RBAC_DESIGN.md for full documentation
-- =====================================================

-- ============================================================
-- STEP 1: ADD MANAGER HIERARCHY
-- ============================================================

-- Add manager_id column to establish manager-member relationships
ALTER TABLE organization_members
  ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES organization_members(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_organization_members_manager_id
  ON organization_members(manager_id);

COMMENT ON COLUMN organization_members.manager_id IS
  'Manager who supervises this member. NULL means they report directly to admin/owner.';

-- ============================================================
-- STEP 2: ADD TASK VISIBILITY SETTINGS (OPTIONAL)
-- ============================================================

-- Add visibility column to tasks for future enhancement
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'team'
    CHECK (visibility IN ('private', 'team', 'organization'));

CREATE INDEX IF NOT EXISTS idx_tasks_visibility ON tasks(visibility);

COMMENT ON COLUMN tasks.visibility IS
  'Controls who can see this task:
  - private: only creator and assignee
  - team: creator, assignee, and their managers (default)
  - organization: all organization members';

-- ============================================================
-- STEP 3: UPDATE RLS POLICIES FOR ROLE-BASED ACCESS
-- ============================================================

-- Drop old task policies
DROP POLICY IF EXISTS "Members can view org tasks" ON tasks;
DROP POLICY IF EXISTS "Users can view own and assigned tasks" ON tasks;
DROP POLICY IF EXISTS "task_select_policy" ON tasks;
DROP POLICY IF EXISTS "Members can create tasks" ON tasks;
DROP POLICY IF EXISTS "task_insert_policy" ON tasks;
DROP POLICY IF EXISTS "Members can update tasks" ON tasks;
DROP POLICY IF EXISTS "task_update_policy" ON tasks;
DROP POLICY IF EXISTS "Admins can delete tasks" ON tasks;
DROP POLICY IF EXISTS "task_delete_policy" ON tasks;

-- ============================================================
-- NEW SELECT POLICY: Role-based task visibility
-- ============================================================
CREATE POLICY "task_select_rbac" ON tasks
  FOR SELECT USING (
    -- Organization owner can see everything
    EXISTS (
      SELECT 1 FROM organizations
      WHERE organizations.id = tasks.organization_id
      AND organizations.owner_id = auth.uid()
    )
    OR
    -- Admins can see everything in their org
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = tasks.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role = 'admin'
      AND organization_members.is_active = TRUE
    )
    OR
    -- Managers can see:
    -- 1. Tasks assigned to them
    -- 2. Tasks they created
    -- 3. Tasks assigned to their team members
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = tasks.organization_id
      AND om.user_id = auth.uid()
      AND om.role = 'manager'
      AND om.is_active = TRUE
      AND (
        -- Tasks assigned to the manager
        tasks.assigned_to = om.id
        OR
        -- Tasks created by the manager
        tasks.created_by = om.user_id
        OR
        -- Tasks assigned to team members (members who report to this manager)
        tasks.assigned_to IN (
          SELECT team_member.id
          FROM organization_members team_member
          WHERE team_member.manager_id = om.id
          AND team_member.is_active = TRUE
        )
      )
    )
    OR
    -- Members can see:
    -- 1. Tasks assigned to them
    -- 2. Tasks they created
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = tasks.organization_id
      AND om.user_id = auth.uid()
      AND om.role = 'member'
      AND om.is_active = TRUE
      AND (
        -- Tasks assigned to the member
        tasks.assigned_to = om.id
        OR
        -- Tasks created by the member
        tasks.created_by = om.user_id
      )
    )
    OR
    -- Everyone can see organization-wide tasks (if visibility is set)
    (
      tasks.visibility = 'organization'
      AND EXISTS (
        SELECT 1 FROM organization_members
        WHERE organization_members.organization_id = tasks.organization_id
        AND organization_members.user_id = auth.uid()
        AND organization_members.is_active = TRUE
      )
    )
  );

-- ============================================================
-- NEW INSERT POLICY: Who can create tasks
-- ============================================================
CREATE POLICY "task_insert_rbac" ON tasks
  FOR INSERT WITH CHECK (
    -- Organization owner can create tasks
    EXISTS (
      SELECT 1 FROM organizations
      WHERE organizations.id = organization_id
      AND organizations.owner_id = auth.uid()
    )
    OR
    -- Members with can_manage_tasks permission
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.can_manage_tasks = TRUE
      AND organization_members.is_active = TRUE
    )
  );

-- ============================================================
-- NEW UPDATE POLICY: Who can edit tasks
-- ============================================================
CREATE POLICY "task_update_rbac" ON tasks
  FOR UPDATE USING (
    -- Organization owner can update anything
    EXISTS (
      SELECT 1 FROM organizations
      WHERE organizations.id = tasks.organization_id
      AND organizations.owner_id = auth.uid()
    )
    OR
    -- Admins can update anything in their org
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = tasks.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role = 'admin'
      AND organization_members.is_active = TRUE
    )
    OR
    -- Managers can update:
    -- 1. Tasks they created
    -- 2. Tasks assigned to them
    -- 3. Tasks assigned to their team members
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = tasks.organization_id
      AND om.user_id = auth.uid()
      AND om.role = 'manager'
      AND om.is_active = TRUE
      AND (
        tasks.created_by = om.user_id
        OR
        tasks.assigned_to = om.id
        OR
        tasks.assigned_to IN (
          SELECT team_member.id
          FROM organization_members team_member
          WHERE team_member.manager_id = om.id
          AND team_member.is_active = TRUE
        )
      )
    )
    OR
    -- Members can update tasks assigned to them (status, notes, time logs)
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = tasks.organization_id
      AND om.user_id = auth.uid()
      AND om.role = 'member'
      AND om.is_active = TRUE
      AND tasks.assigned_to = om.id
    )
  );

-- ============================================================
-- NEW DELETE POLICY: Who can delete tasks
-- ============================================================
CREATE POLICY "task_delete_rbac" ON tasks
  FOR DELETE USING (
    -- Organization owner can delete anything
    EXISTS (
      SELECT 1 FROM organizations
      WHERE organizations.id = tasks.organization_id
      AND organizations.owner_id = auth.uid()
    )
    OR
    -- Admins can delete anything in their org
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = tasks.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role = 'admin'
      AND organization_members.is_active = TRUE
    )
    OR
    -- Managers can delete tasks they created
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = tasks.organization_id
      AND om.user_id = auth.uid()
      AND om.role = 'manager'
      AND om.is_active = TRUE
      AND tasks.created_by = om.user_id
    )
  );

-- ============================================================
-- STEP 4: ADD ORGANIZATION SETTINGS (OPTIONAL)
-- ============================================================

-- Add optional configuration for organizations
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS task_visibility_default TEXT DEFAULT 'team'
    CHECK (task_visibility_default IN ('private', 'team', 'organization'));

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS managers_see_all_tasks BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN organizations.task_visibility_default IS
  'Default visibility level for new tasks: private, team, or organization';

COMMENT ON COLUMN organizations.managers_see_all_tasks IS
  'If TRUE, managers can see all tasks in the organization (like admins). If FALSE, managers only see their team tasks.';

-- ============================================================
-- STEP 5: HELPER FUNCTIONS
-- ============================================================

-- Function to get a user's team members (for managers)
CREATE OR REPLACE FUNCTION get_user_team_members(check_user_id UUID)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  role TEXT,
  email TEXT,
  job_title TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_member_id UUID;
  user_role TEXT;
  user_org_id UUID;
BEGIN
  -- Get the user's organization member record
  SELECT om.id, om.role, om.organization_id
  INTO user_member_id, user_role, user_org_id
  FROM organization_members om
  WHERE om.user_id = check_user_id
  AND om.is_active = TRUE
  LIMIT 1;

  -- If user is not a member, return empty
  IF user_member_id IS NULL THEN
    RETURN;
  END IF;

  -- If admin, return all active members in organization
  IF user_role = 'admin' THEN
    RETURN QUERY
    SELECT om.id, om.full_name, om.role, om.email, om.job_title
    FROM organization_members om
    WHERE om.organization_id = user_org_id
    AND om.is_active = TRUE
    ORDER BY om.full_name;
    RETURN;
  END IF;

  -- If manager, return direct reports
  IF user_role = 'manager' THEN
    RETURN QUERY
    SELECT om.id, om.full_name, om.role, om.email, om.job_title
    FROM organization_members om
    WHERE om.manager_id = user_member_id
    AND om.is_active = TRUE
    ORDER BY om.full_name;
    RETURN;
  END IF;

  -- Members see no team (only themselves)
  RETURN;
END;
$$;

GRANT EXECUTE ON FUNCTION get_user_team_members(UUID) TO authenticated;

COMMENT ON FUNCTION get_user_team_members IS
  'Returns the team members that a user manages or can see based on their role';

-- ============================================================
-- STEP 6: UPDATE COMMENTS AND DOCUMENTATION
-- ============================================================

COMMENT ON POLICY "task_select_rbac" ON tasks IS
  'Role-based task visibility:
  - Admin: sees all tasks
  - Manager: sees own tasks + created tasks + team tasks
  - Member: sees assigned tasks + own created tasks';

COMMENT ON POLICY "task_insert_rbac" ON tasks IS
  'Users with can_manage_tasks permission can create tasks';

COMMENT ON POLICY "task_update_rbac" ON tasks IS
  'Role-based task editing:
  - Admin: can edit all tasks
  - Manager: can edit own/created/team tasks
  - Member: can edit tasks assigned to them';

COMMENT ON POLICY "task_delete_rbac" ON tasks IS
  'Role-based task deletion:
  - Admin: can delete all tasks
  - Manager: can delete tasks they created
  - Member: cannot delete tasks';

-- ============================================================
-- MIGRATION COMPLETE
-- ============================================================

-- Migration adds:
-- 1. manager_id column to organization_members (establishes hierarchy)
-- 2. visibility column to tasks (for optional visibility control)
-- 3. New RLS policies that enforce role-based access
-- 4. Organization settings for default behavior
-- 5. Helper function to get team members

-- Next steps:
-- 1. Update API layer to remove user_id filter from listTasks()
-- 2. Update frontend with role-based filters and permissions
-- 3. Add UI for setting manager assignments in Team Settings
-- 4. Test all three roles thoroughly

-- See TASK_RBAC_DESIGN.md for complete documentation
