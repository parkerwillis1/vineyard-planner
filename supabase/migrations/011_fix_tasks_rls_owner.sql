-- =====================================================
-- FIX TASKS RLS TO ALLOW ORGANIZATION OWNERS
-- =====================================================

-- Drop the old task INSERT policies
DROP POLICY IF EXISTS "Members can create tasks" ON tasks;
DROP POLICY IF EXISTS "Users can insert own tasks" ON tasks;
DROP POLICY IF EXISTS "Members and owners can create tasks" ON tasks;

-- Create new policy that allows both owners and members to insert tasks
CREATE POLICY "task_insert_policy" ON tasks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM organizations
      WHERE organizations.id = organization_id
      AND organizations.owner_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.can_manage_tasks = TRUE
      AND organization_members.is_active = TRUE
    )
  );

-- =====================================================
-- DATA MIGRATION: ADD EXISTING OWNERS AS MEMBERS
-- =====================================================

-- Add all organization owners as admin members if they don't already exist
-- Use ON CONFLICT DO NOTHING to make this idempotent
INSERT INTO organization_members (
  organization_id,
  user_id,
  email,
  full_name,
  role,
  job_title,
  can_view_costs,
  can_manage_team,
  can_manage_blocks,
  can_manage_tasks,
  can_approve_tasks,
  is_active,
  joined_at
)
SELECT
  o.id,
  o.owner_id,
  COALESCE(o.email, u.email),
  COALESCE(SPLIT_PART(COALESCE(o.email, u.email), '@', 1), 'Owner'),
  'admin'::TEXT,
  'Owner',
  TRUE,
  TRUE,
  TRUE,
  TRUE,
  TRUE,
  TRUE,
  o.created_at
FROM organizations o
JOIN auth.users u ON u.id = o.owner_id
ON CONFLICT (organization_id, email) DO NOTHING;

COMMENT ON POLICY "task_insert_policy" ON tasks IS 'Allows organization owners and members with task management permission to create tasks';
