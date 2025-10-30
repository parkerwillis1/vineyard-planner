-- =====================================================
-- FIX RLS INFINITE RECURSION
-- =====================================================
-- This script fixes the circular dependency between
-- organizations and organization_members RLS policies

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view their own organizations" ON organizations;
DROP POLICY IF EXISTS "Members can view org members" ON organization_members;
DROP POLICY IF EXISTS "Admins can manage members" ON organization_members;

-- =====================================================
-- FIXED ORGANIZATIONS POLICIES (NO CIRCULAR REFERENCE)
-- =====================================================

-- Simplified: Only owners can directly query organizations table
-- Members access organization data through the API functions
CREATE POLICY "Owners can view their organizations" ON organizations
  FOR SELECT USING (owner_id = auth.uid());

-- Keep existing UPDATE and INSERT policies (they're fine)
-- DROP POLICY IF EXISTS "Owners can update their organizations" ON organizations;
-- DROP POLICY IF EXISTS "Users can create organizations" ON organizations;

-- =====================================================
-- FIXED ORGANIZATION_MEMBERS POLICIES
-- =====================================================

-- Members can view other members in their organization
-- This checks organizations table but organizations no longer checks members (no recursion)
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
    -- User is a member of the same organization
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
      AND om.is_active = TRUE
    )
  );

-- Admins can manage members (insert, update, delete)
CREATE POLICY "Admins can manage members" ON organization_members
  FOR ALL USING (
    -- User is the organization owner
    EXISTS (
      SELECT 1 FROM organizations
      WHERE organizations.id = organization_members.organization_id
      AND organizations.owner_id = auth.uid()
    ) OR
    -- User is an admin with team management permission
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
      AND om.role = 'admin'
      AND om.can_manage_team = TRUE
      AND om.is_active = TRUE
    )
  );

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Uncomment these to test after running the migration:
-- SELECT * FROM organizations WHERE owner_id = auth.uid();
-- SELECT * FROM organization_members;
