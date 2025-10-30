-- =====================================================
-- ORGANIZATION/TENANT SYSTEM
-- =====================================================

-- Organizations (Vineyards/Companies)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Contact info
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  phone TEXT,
  email TEXT,

  -- Settings
  default_hourly_rate NUMERIC,
  timezone TEXT DEFAULT 'America/Los_Angeles',

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_organizations_owner_id ON organizations(owner_id);

-- Organization Members
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Member info
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'member')),

  -- Employment details
  job_title TEXT,
  hourly_rate NUMERIC,
  phone TEXT,
  avatar_url TEXT,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  invited_at TIMESTAMPTZ DEFAULT now(),
  joined_at TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,

  -- Permissions (for granular control)
  can_view_costs BOOLEAN DEFAULT FALSE,
  can_manage_team BOOLEAN DEFAULT FALSE,
  can_manage_blocks BOOLEAN DEFAULT FALSE,
  can_manage_tasks BOOLEAN DEFAULT TRUE,
  can_approve_tasks BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(organization_id, email)
);

CREATE INDEX idx_organization_members_org_id ON organization_members(organization_id);
CREATE INDEX idx_organization_members_user_id ON organization_members(user_id);
CREATE INDEX idx_organization_members_email ON organization_members(email);
CREATE INDEX idx_organization_members_role ON organization_members(role);

-- =====================================================
-- SECURITY DEFINER FUNCTIONS (Prevent RLS Recursion)
-- =====================================================

-- Check if user is an active member of an organization
CREATE OR REPLACE FUNCTION is_organization_member(org_id UUID, check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = org_id
    AND user_id = check_user_id
    AND is_active = TRUE
  );
END;
$$;

-- Check if user is an admin with team management permission
CREATE OR REPLACE FUNCTION is_organization_admin(org_id UUID, check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = org_id
    AND user_id = check_user_id
    AND role = 'admin'
    AND can_manage_team = TRUE
    AND is_active = TRUE
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION is_organization_member(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_organization_admin(UUID, UUID) TO authenticated;

-- RLS Policies
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Simplified: Only owners can directly query organizations table
-- This prevents circular dependency with organization_members
CREATE POLICY "Owners can view their organizations" ON organizations
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Owners can update their organizations" ON organizations
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Users can create organizations" ON organizations
  FOR INSERT WITH CHECK (owner_id = auth.uid());

-- Organization Members RLS
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Members can view other members in their organization
-- Uses security definer function to avoid self-referencing recursion
CREATE POLICY "Members can view org members" ON organization_members
  FOR SELECT USING (
    -- User is viewing their own membership record
    user_id = auth.uid() OR
    -- User is the owner of the organization
    EXISTS (
      SELECT 1 FROM organizations
      WHERE organizations.id = organization_members.organization_id
      AND organizations.owner_id = auth.uid()
    ) OR
    -- User is a member of the same organization (uses security definer function)
    is_organization_member(organization_members.organization_id, auth.uid())
  );

-- Admins can manage members (insert, update, delete)
-- Uses security definer function to avoid self-referencing recursion
CREATE POLICY "Admins can manage members" ON organization_members
  FOR ALL USING (
    -- User is the organization owner
    EXISTS (
      SELECT 1 FROM organizations
      WHERE organizations.id = organization_members.organization_id
      AND organizations.owner_id = auth.uid()
    ) OR
    -- User is an admin with team management permission (uses security definer function)
    is_organization_admin(organization_members.organization_id, auth.uid())
  );

-- Triggers
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organization_members_updated_at
  BEFORE UPDATE ON organization_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE organizations IS 'Vineyards/companies that own vineyard operations';
COMMENT ON TABLE organization_members IS 'Team members within an organization with roles and permissions';
COMMENT ON COLUMN organization_members.role IS 'Access level: admin (full access), manager (ops + reports), member (assigned tasks only)';

-- =====================================================
-- UPDATE EXISTING TABLES TO USE ORGANIZATIONS
-- =====================================================

-- Add organization_id to tasks
ALTER TABLE tasks ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX idx_tasks_organization_id ON tasks(organization_id);

-- Add organization_id to vineyard_blocks
ALTER TABLE vineyard_blocks ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX idx_vineyard_blocks_organization_id ON vineyard_blocks(organization_id);

-- Add organization_id to seasons
ALTER TABLE seasons ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX idx_seasons_organization_id ON seasons(organization_id);

-- =====================================================
-- UPDATE TASKS RLS FOR ORGANIZATION-BASED ACCESS
-- =====================================================

-- Drop old policies
DROP POLICY IF EXISTS "Users can view tasks in their org" ON tasks;
DROP POLICY IF EXISTS "Users can insert tasks in their org" ON tasks;
DROP POLICY IF EXISTS "Users can update tasks in their org" ON tasks;
DROP POLICY IF EXISTS "Users can delete own tasks" ON tasks;

-- New organization-based policies
CREATE POLICY "Members can view org tasks" ON tasks
  FOR SELECT USING (
    user_id = auth.uid() OR
    auth.uid() = ANY(assignees) OR
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = tasks.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.is_active = TRUE
    )
  );

CREATE POLICY "Members can create tasks" ON tasks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.can_manage_tasks = TRUE
      AND organization_members.is_active = TRUE
    )
  );

CREATE POLICY "Members can update tasks" ON tasks
  FOR UPDATE USING (
    user_id = auth.uid() OR
    auth.uid() = ANY(assignees) OR
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = tasks.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('admin', 'manager')
      AND organization_members.is_active = TRUE
    )
  );

CREATE POLICY "Admins can delete tasks" ON tasks
  FOR DELETE USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = tasks.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('admin', 'manager')
      AND organization_members.is_active = TRUE
    )
  );

-- =====================================================
-- HELPER FUNCTION: GET USER'S PRIMARY ORGANIZATION
-- =====================================================
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  org_id UUID;
BEGIN
  -- First check if user owns an organization
  SELECT id INTO org_id
  FROM organizations
  WHERE owner_id = auth.uid()
  LIMIT 1;

  -- If not owner, check if they're a member
  IF org_id IS NULL THEN
    SELECT organization_id INTO org_id
    FROM organization_members
    WHERE user_id = auth.uid()
    AND is_active = TRUE
    LIMIT 1;
  END IF;

  RETURN org_id;
END;
$$;
