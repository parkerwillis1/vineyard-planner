-- =====================================================
-- COMPLETE FIX FOR RLS INFINITE RECURSION
-- =====================================================
-- This fixes the self-referencing recursion in organization_members

-- First, create security definer functions to check membership
-- These functions bypass RLS to avoid recursion

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

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Owners can view their organizations" ON organizations;
DROP POLICY IF EXISTS "Members can view org members" ON organization_members;
DROP POLICY IF EXISTS "Admins can manage members" ON organization_members;

-- =====================================================
-- FIXED ORGANIZATIONS POLICIES (NO CIRCULAR REFERENCE)
-- =====================================================

-- Only owners can directly query organizations table
CREATE POLICY "Owners can view their organizations" ON organizations
  FOR SELECT USING (owner_id = auth.uid());

-- =====================================================
-- FIXED ORGANIZATION_MEMBERS POLICIES (NO RECURSION)
-- =====================================================

-- Members can view other members in their organization
-- Uses security definer function to avoid recursion
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
    -- User is a member of the same organization (using security definer function)
    is_organization_member(organization_members.organization_id, auth.uid())
  );

-- Admins can manage members (insert, update, delete)
-- Uses security definer function to avoid recursion
CREATE POLICY "Admins can manage members" ON organization_members
  FOR ALL USING (
    -- User is the organization owner
    EXISTS (
      SELECT 1 FROM organizations
      WHERE organizations.id = organization_members.organization_id
      AND organizations.owner_id = auth.uid()
    ) OR
    -- User is an admin with team management permission (using security definer function)
    is_organization_admin(organization_members.organization_id, auth.uid())
  );

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION is_organization_member(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_organization_admin(UUID, UUID) TO authenticated;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Test queries (uncomment to test):
-- SELECT * FROM organizations WHERE owner_id = auth.uid();
-- SELECT * FROM organization_members;
-- SELECT is_organization_member('your-org-id'::uuid, auth.uid());
