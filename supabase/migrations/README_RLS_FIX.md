# RLS Infinite Recursion Fix

## The Problem

The original RLS (Row Level Security) policies for the organizations system had a **self-referencing recursion** issue:

The `organization_members` table's SELECT policy was checking `organization_members` within itself:

```sql
-- ❌ THIS CAUSES INFINITE RECURSION
CREATE POLICY "Members can view org members" ON organization_members
  FOR SELECT USING (
    -- This EXISTS clause queries organization_members INSIDE the organization_members policy
    EXISTS (
      SELECT 1 FROM organization_members om  -- ❌ Self-reference!
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
    )
  );
```

When PostgreSQL tries to evaluate this policy, it creates infinite recursion because checking if you can view a row requires checking if you can view another row, which requires checking if you can view another row... forever!

## The Solution

Use **SECURITY DEFINER functions** that bypass RLS when checking membership:

```sql
-- ✅ Security definer function bypasses RLS
CREATE OR REPLACE FUNCTION is_organization_member(org_id UUID, check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER  -- This is the key - bypasses RLS
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

-- ✅ Now the policy uses the function instead of direct query
CREATE POLICY "Members can view org members" ON organization_members
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (...) OR
    is_organization_member(organization_members.organization_id, auth.uid())  -- ✅ No recursion!
  );
```

## How to Fix Your Database

### If you already ran `008_add_organizations.sql` and are getting the recursion error:

**Run this fix script:**
```
supabase/migrations/009_fix_rls_recursion_complete.sql
```

**Steps:**
1. Go to your **Supabase Dashboard**
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the entire contents of `009_fix_rls_recursion_complete.sql`
5. Paste into the SQL Editor
6. Click **Run**
7. Refresh your Team Management page

### If you haven't run anything yet (fresh setup):

**Just run the updated main migration:**
```
supabase/migrations/008_add_organizations.sql
```

The file has been updated to include the security definer functions from the start, so you won't encounter the recursion issue.

## What the Fix Does

1. **Creates two security definer functions:**
   - `is_organization_member(org_id, user_id)` - Checks if user is an active member
   - `is_organization_admin(org_id, user_id)` - Checks if user is an admin with team management permission

2. **Updates RLS policies to use these functions** instead of directly querying `organization_members`

3. **Grants execute permission** to authenticated users so they can call these functions

## Security Notes

- `SECURITY DEFINER` functions run with the permissions of the function creator (the database owner), not the calling user
- This is safe here because:
  - The functions only check membership status (boolean return)
  - They don't expose sensitive data
  - They're used within RLS policies that still enforce proper access control
  - They're only callable by authenticated users (via GRANT)

## Testing

After running the fix, test that it works:

```sql
-- Should return your organization
SELECT * FROM organizations WHERE owner_id = auth.uid();

-- Should return all members you have permission to see
SELECT * FROM organization_members;

-- Should return true if you're a member
SELECT is_organization_member('your-org-id'::uuid, auth.uid());
```

## Files Updated

- ✅ `008_add_organizations.sql` - Main migration (updated with security definer functions)
- ✅ `009_fix_rls_recursion_complete.sql` - Fix script for existing databases
- ✅ `TeamManagement.jsx` - Enhanced error detection and user-friendly instructions
