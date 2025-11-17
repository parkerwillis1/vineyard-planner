# Task RBAC Implementation Guide

This guide walks you through implementing role-based access control for tasks in your Vineyard Planner application.

---

## Quick Start

### What This Does
After implementation, your task system will have proper role-based visibility:

- **Admin (you - Parker Willis)**: See ALL tasks (current behavior maintained)
- **Manager**: See own tasks + created tasks + team member tasks
- **Member**: See only assigned tasks + own created tasks

---

## Implementation Steps

### Phase 1: Database Migration (5 minutes)

**What this does:** Updates your database schema and RLS policies to support role-based access.

**Steps:**
1. Go to your Supabase dashboard → SQL Editor
2. Open the file `supabase-migrations/add_task_rbac.sql`
3. Copy the entire contents
4. Paste into a new SQL query in Supabase
5. Click "Run"
6. ✅ Verify: You should see "Success. No rows returned"

**What changed:**
- Added `manager_id` column to `organization_members` table
- Added `visibility` column to `tasks` table
- Updated RLS policies to enforce role-based access
- Added helper function `get_user_team_members()`

**Rollback:** If something goes wrong, see the "Rollback Plan" section in `TASK_RBAC_DESIGN.md`

---

### Phase 2: Test Database Changes (5 minutes)

**Verify RLS is working:**

1. In Supabase SQL Editor, run this query to check your current role:
```sql
SELECT
  om.full_name,
  om.role,
  om.email,
  o.name as organization
FROM organization_members om
JOIN organizations o ON o.id = om.organization_id
WHERE om.user_id = auth.uid();
```

2. Check that you're listed as an 'admin' role

3. Count visible tasks before and after:
```sql
-- This should show all tasks (you're admin)
SELECT COUNT(*) FROM tasks;
```

4. Test manager visibility (optional - if you have a manager in your org):
```sql
-- Simulate being a manager (replace MANAGER_USER_ID)
SELECT COUNT(*)
FROM tasks
WHERE EXISTS (
  SELECT 1 FROM organization_members om
  WHERE om.organization_id = tasks.organization_id
  AND om.user_id = 'MANAGER_USER_ID'::uuid
  AND om.role = 'manager'
  AND om.is_active = TRUE
);
```

---

### Phase 3: Update API Layer (10 minutes)

**What this does:** Removes the incorrect `user_id` filter so RLS policies can properly control access.

**File to edit:** `src/shared/lib/vineyardApi.js`

**Change 1: Update listTasks() function (line ~993)**

**OLD CODE:**
```javascript
export async function listTasks(filters = {}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: null };

  let query = supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)  // ❌ REMOVE THIS LINE
    .is('archived_at', null)
    .order('due_date', { ascending: true });

  // ... rest of function
}
```

**NEW CODE:**
```javascript
export async function listTasks(filters = {}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: null };

  // RLS policies now control visibility - no need to filter by user_id
  let query = supabase
    .from('tasks')
    .select('*')
    .is('archived_at', null)
    .order('due_date', { ascending: true });

  // Apply filters
  if (filters.seasonId) {
    query = query.eq('season_id', filters.seasonId);
  }
  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  if (filters.type) {
    query = query.eq('type', filters.type);
  }
  if (filters.blockId) {
    query = query.contains('blocks', [filters.blockId]);
  }

  // NEW: Additional filters for role-based access
  if (filters.assignedTo) {
    query = query.eq('assigned_to', filters.assignedTo);
  }
  if (filters.createdBy) {
    query = query.eq('created_by', filters.createdBy);
  }

  return query;
}
```

**Change 2: Add helper function for getting team members**

Add this new function to `vineyardApi.js` (after the `listOrganizationMembers` function around line 1520):

```javascript
// =====================================================
// TEAM MANAGEMENT (RBAC)
// =====================================================

/**
 * Get team members managed by the current user
 * - Admins see all org members
 * - Managers see their direct reports
 * - Members see nobody (only themselves)
 */
export async function getMyTeamMembers() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: null };

  // Get current user's member record
  const { data: currentMember } = await supabase
    .from('organization_members')
    .select('id, role, organization_id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  if (!currentMember) {
    return { data: [], error: null };
  }

  // If admin, return all members in organization
  if (currentMember.role === 'admin') {
    return supabase
      .from('organization_members')
      .select('*')
      .eq('organization_id', currentMember.organization_id)
      .eq('is_active', true)
      .order('full_name', { ascending: true });
  }

  // If manager, return direct reports
  if (currentMember.role === 'manager') {
    return supabase
      .from('organization_members')
      .select('*')
      .eq('manager_id', currentMember.id)
      .eq('is_active', true)
      .order('full_name', { ascending: true });
  }

  // Members see no team (only themselves)
  return { data: [], error: null };
}
```

---

### Phase 4: Test the Changes (5 minutes)

**Test as Admin (you):**

1. Refresh your app
2. Go to Operations > Tasks
3. You should see **ALL tasks** (same as before)
4. Create a new task and assign it to someone
5. ✅ Verify: You can still see all tasks

**Test as Manager (if you have one):**

1. Create a test manager account (or use an existing one)
2. Set their role to 'manager' in Supabase:
```sql
UPDATE organization_members
SET role = 'manager'
WHERE email = 'manager@example.com';
```
3. Log in as that manager
4. ✅ Verify: They should only see:
   - Tasks assigned to them
   - Tasks they created
   - Tasks assigned to their team members (if any)

**Test as Member:**

1. Create a test member account
2. Set their role to 'member':
```sql
UPDATE organization_members
SET role = 'member'
WHERE email = 'member@example.com';
```
3. Create a task and assign it to them
4. Log in as that member
5. ✅ Verify: They should only see:
   - Tasks assigned to them
   - Tasks they created (if they have can_manage_tasks permission)

---

### Phase 5: Set Up Manager Hierarchy (Optional)

**What this does:** Allows managers to see tasks assigned to their team members.

**Steps:**

1. Go to Supabase SQL Editor
2. Run this query to assign team members to a manager:

```sql
-- Example: Make "Jane Smith" report to manager "John Doe"
UPDATE organization_members
SET manager_id = (
  SELECT id FROM organization_members
  WHERE email = 'john.doe@example.com'
)
WHERE email = 'jane.smith@example.com';
```

3. ✅ Verify: John (manager) can now see Jane's tasks

**UI for this (future enhancement):**
- Add a "Manager" dropdown in Settings > Team Members
- Admins can assign managers to team members
- See `TASK_RBAC_DESIGN.md` section 6 for frontend implementation ideas

---

## What Changed for Each Role

### Admin (Your Current Experience)
✅ **No change** - You still see all tasks
✅ Can create, edit, delete, reassign any task
✅ Can see all cost information

### Manager (New Behavior)
- ✅ Sees tasks assigned to them
- ✅ Sees tasks they created
- ✅ Sees tasks assigned to their team members
- ❌ Cannot see tasks for other managers' teams
- ⚠️ Can edit tasks within their scope
- ⚠️ Can delete tasks they created (not all tasks)

### Member (New Behavior)
- ✅ Sees tasks assigned to them
- ✅ Sees tasks they created (if they have can_manage_tasks permission)
- ❌ Cannot see other members' tasks
- ⚠️ Can update status on their tasks
- ❌ Cannot reassign or delete tasks

---

## Troubleshooting

### Issue: "I can't see any tasks!"

**Diagnosis:**
- Check your role:
```sql
SELECT role FROM organization_members WHERE user_id = auth.uid();
```

**Solution:**
- If you're the owner, make sure you're also an admin member:
```sql
SELECT * FROM organization_members WHERE email = 'your@email.com';
```
- If missing, run the migration `011_fix_tasks_rls_owner.sql` which adds owners as admin members

---

### Issue: "Member can see all tasks (they shouldn't!)"

**Diagnosis:**
- Old RLS policies might still be active

**Solution:**
```sql
-- List all policies on tasks table
SELECT * FROM pg_policies WHERE tablename = 'tasks';

-- Should show only these 4 policies:
-- 1. task_select_rbac
-- 2. task_insert_rbac
-- 3. task_update_rbac
-- 4. task_delete_rbac

-- If you see old policies, drop them:
DROP POLICY IF EXISTS "Members can view org tasks" ON tasks;
DROP POLICY IF EXISTS "Users can view own and assigned tasks" ON tasks;
```

---

### Issue: "Manager can't see their team's tasks"

**Diagnosis:**
- Manager might not have team members assigned

**Check:**
```sql
-- Check if manager has team members
SELECT
  manager.full_name as manager_name,
  member.full_name as team_member_name,
  member.email
FROM organization_members manager
LEFT JOIN organization_members member ON member.manager_id = manager.id
WHERE manager.email = 'manager@example.com';
```

**Solution:**
- Assign team members to the manager (see Phase 5 above)

---

## Next Steps (Optional Enhancements)

1. **Frontend Filters**: Add role-based filter UI in task list
   - "My Tasks", "My Team's Tasks", "All Tasks" (admin only)

2. **Manager Assignment UI**: Add dropdown in Settings > Team to assign managers

3. **Task Visibility Selector**: Add visibility dropdown when creating tasks
   - "Private", "Team" (default), "Organization"

4. **Permissions Audit**: Review each team member's permissions
   - `can_manage_tasks`, `can_view_costs`, etc.

5. **Notification Rules**: Notify managers when their team's tasks need attention

See `TASK_RBAC_DESIGN.md` for detailed implementation guides for these enhancements.

---

## Support

If you encounter issues:

1. Check `TASK_RBAC_DESIGN.md` Section 7 "Edge Cases & Solutions"
2. Review RLS policies in Supabase dashboard
3. Check browser console for errors
4. Verify migration ran successfully in Supabase SQL Editor history

---

## Summary

✅ **Database migration** adds role-based access control
✅ **API update** removes incorrect user_id filter
✅ **RLS policies** enforce visibility at database level
✅ **Backward compatible** - existing data unaffected
✅ **Safe to rollback** if needed

**Total implementation time:** ~25 minutes
**Recommended test time:** ~15 minutes
**Risk level:** Low (backward compatible, easy rollback)

---

**You're all set!** Your task system now has proper role-based access control. Admins see everything, managers see their team's work, and members see only their assigned tasks.
