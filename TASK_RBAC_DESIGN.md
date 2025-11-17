# Task RBAC Design Document

## Overview
This document defines the Role-Based Access Control (RBAC) model for tasks in the Vineyard Planner application.

---

## 1. Role Definitions

### Admin
**Full system access** - Can see and manage everything

**Permissions:**
- ✅ View ALL tasks (created by anyone, assigned to anyone)
- ✅ Create tasks and assign to anyone
- ✅ Edit ANY task (title, description, dates, assignments, status, etc.)
- ✅ Delete ANY task
- ✅ Reassign ANY task
- ✅ View all cost information
- ✅ Manage team members (add/remove/edit roles)
- ✅ Manage vineyard blocks
- ✅ Approve tasks

**Use Cases:**
- Vineyard owner (Parker Willis)
- Operations director
- Full-access administrator

---

### Manager
**Broad operational visibility** - Can see team activities and their own work

**Permissions:**
- ✅ View tasks:
  - Tasks assigned to them
  - Tasks they created
  - Tasks assigned to members on their team (see "Team Concept" below)
  - Optionally: All tasks (depending on organization preference - see "Configuration" below)
- ✅ Create tasks and assign to their team members
- ✅ Edit tasks within their scope:
  - Tasks they created
  - Tasks assigned to them
  - Tasks assigned to their team members
- ✅ Update status, assignments, and due dates for tasks within scope
- ✅ Reassign tasks within their team
- ⚠️ View costs (depends on `can_view_costs` permission)
- ❌ Cannot delete tasks (unless they created them)
- ❌ Cannot manage team members
- ❌ Cannot approve tasks (unless they have `can_approve_tasks` permission)

**Use Cases:**
- Vineyard manager
- Operations supervisor
- Team lead

---

### Member
**Limited visibility** - Only sees their own work

**Permissions:**
- ✅ View tasks:
  - Tasks assigned to them
  - Tasks they created (even if assigned to someone else)
- ✅ Update status on tasks assigned to them
- ✅ Add notes/comments to their tasks
- ✅ Log time on their tasks
- ⚠️ Create tasks (depends on `can_manage_tasks` permission)
- ❌ Cannot view other members' private tasks
- ❌ Cannot reassign tasks
- ❌ Cannot delete tasks
- ❌ Cannot view costs (unless `can_view_costs` is enabled)
- ❌ Cannot edit task details (only status updates)

**Use Cases:**
- Vineyard worker
- Seasonal employee
- Contractor
- Field crew member

---

## 2. Team Concept

### Option A: Manager-Based Teams (RECOMMENDED)
Each manager has a set of members they supervise.

**Implementation:**
- Add `manager_id` column to `organization_members` table
- A member can have one manager (or null for direct reports to admin)
- Managers can see all tasks for members where `manager_id = their_member_id`

**Pros:**
- Simple, clear hierarchy
- Easy to implement
- Matches most vineyard organizational structures

**Cons:**
- Limited to single-manager hierarchy
- Can't handle matrix organizations

**Database Schema:**
```sql
ALTER TABLE organization_members
  ADD COLUMN manager_id UUID REFERENCES organization_members(id) ON DELETE SET NULL;
```

---

### Option B: Team-Based Groups
Create explicit "teams" that members belong to, managers oversee teams.

**Implementation:**
- Create `teams` table
- Create `team_members` junction table
- Link managers to teams

**Pros:**
- More flexible
- Supports complex org structures
- Members can be on multiple teams

**Cons:**
- More complex to implement
- May be overkill for typical vineyard operations

**Database Schema:**
```sql
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  manager_id UUID REFERENCES organization_members(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES organization_members(id) ON DELETE CASCADE,
  UNIQUE(team_id, member_id)
);
```

---

### Option C: Project/Block-Based Visibility
Visibility based on which vineyard blocks a user has access to.

**Implementation:**
- Link members to specific vineyard blocks
- Tasks are visible based on which blocks they involve

**Pros:**
- Natural fit for vineyard operations
- Location-based access control

**Cons:**
- Doesn't handle admin/cross-block tasks well
- Complex for multi-block tasks

---

### **RECOMMENDATION: Option A - Manager-Based Teams**
For most vineyard operations, a simple manager-member hierarchy is sufficient and easy to understand.

---

## 3. Database Schema Changes

### Required Migrations

```sql
-- ============================================================
-- MIGRATION: Add Manager Hierarchy and Task Visibility Fields
-- ============================================================

-- Step 1: Add manager_id to organization_members
ALTER TABLE organization_members
  ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES organization_members(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_organization_members_manager_id
  ON organization_members(manager_id);

-- Step 2: Add task visibility metadata (optional)
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'team'
    CHECK (visibility IN ('private', 'team', 'organization'));

-- Visibility levels:
-- 'private' = only creator and assignee can see
-- 'team' = creator, assignee, and their managers can see
-- 'organization' = all org members can see

CREATE INDEX IF NOT EXISTS idx_tasks_visibility ON tasks(visibility);

-- Step 3: Add created_by if not exists (audit trail)
-- (already exists in schema)

COMMENT ON COLUMN organization_members.manager_id IS
  'Manager who supervises this member. NULL means they report directly to admin/owner.';

COMMENT ON COLUMN tasks.visibility IS
  'Controls who can see this task: private (creator+assignee only), team (+ managers), organization (all members)';
```

---

## 4. RLS Policy Design

### New RLS Policies for Tasks Table

```sql
-- ============================================================
-- DROP OLD POLICIES
-- ============================================================
DROP POLICY IF EXISTS "Members can view org tasks" ON tasks;
DROP POLICY IF EXISTS "Users can view own and assigned tasks" ON tasks;

-- ============================================================
-- NEW ROLE-BASED POLICIES
-- ============================================================

-- ============================================================
-- SELECT POLICY: Role-based task visibility
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
  );

-- ============================================================
-- INSERT POLICY: Who can create tasks
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
-- UPDATE POLICY: Who can edit tasks
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
-- DELETE POLICY: Who can delete tasks
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
```

---

## 5. API Layer Changes

### vineyardApi.js - Update listTasks()

**Current code** (line 993-1022):
```javascript
export async function listTasks(filters = {}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: null };

  let query = supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)  // ❌ PROBLEM: Only shows tasks created by user
    .is('archived_at', null)
    .order('due_date', { ascending: true });

  // ... filters
  return query;
}
```

**New implementation:**
```javascript
export async function listTasks(filters = {}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: null };

  // Get user's role
  const { data: userRole } = await getCurrentUserRole();

  // Base query - RLS policies will handle visibility
  // No need to filter by user_id anymore!
  let query = supabase
    .from('tasks')
    .select('*')
    .is('archived_at', null)
    .order('due_date', { ascending: true });

  // Apply additional filters
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

  // NEW: Role-specific filters
  if (filters.assignedTo) {
    query = query.eq('assigned_to', filters.assignedTo);
  }
  if (filters.createdBy) {
    query = query.eq('created_by', filters.createdBy);
  }

  return query;
}
```

### New API Helper Functions

```javascript
// Get current user's role and permissions
export async function getCurrentUserRole() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: null };

  // Check if user owns an organization
  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('owner_id', user.id)
    .single();

  if (org) {
    return {
      data: {
        role: 'admin',
        organization_id: org.id,
        can_view_costs: true,
        can_manage_team: true,
        can_manage_blocks: true,
        can_manage_tasks: true,
        can_approve_tasks: true
      },
      error: null
    };
  }

  // Check if user is an organization member
  const { data: member, error } = await supabase
    .from('organization_members')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  if (error && error.code !== 'PGRST116') {
    return { data: null, error };
  }

  return { data: member, error: null };
}

// Get team members managed by current user (for managers)
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

  if (!currentMember || currentMember.role === 'member') {
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
  return supabase
    .from('organization_members')
    .select('*')
    .eq('manager_id', currentMember.id)
    .eq('is_active', true)
    .order('full_name', { ascending: true });
}
```

---

## 6. Frontend Changes

### Task List UI - Add Role-Based Filters

**New filter options based on role:**

```javascript
// Admin sees:
- All Tasks
- My Tasks (assigned to me)
- Created by Me
- Filter by Team Member (dropdown)
- Filter by Status
- Filter by Type
- Filter by Block

// Manager sees:
- All Tasks (team scope)
- My Tasks
- Created by Me
- My Team's Tasks
- Filter by Team Member (dropdown - only their team)
- Filter by Status
- Filter by Type
- Filter by Block

// Member sees:
- My Tasks (assigned to me)
- Created by Me
- Filter by Status
- Filter by Type
- (No team member filter)
```

### TaskDrawer/TaskModal - Role-Based Edit Restrictions

```javascript
// Example permission check in TaskDrawer
const canEditTask = () => {
  if (userRole.role === 'admin') return true;
  if (userRole.role === 'manager') {
    // Can edit if: created by them, assigned to them, or assigned to team member
    return task.created_by === user.id ||
           task.assigned_to === userRole.id ||
           teamMemberIds.includes(task.assigned_to);
  }
  if (userRole.role === 'member') {
    // Can only update status if assigned to them
    return task.assigned_to === userRole.id;
  }
  return false;
};

const canDeleteTask = () => {
  if (userRole.role === 'admin') return true;
  if (userRole.role === 'manager') return task.created_by === user.id;
  return false;
};

const canReassignTask = () => {
  if (userRole.role === 'admin') return true;
  if (userRole.role === 'manager') {
    return task.created_by === user.id ||
           task.assigned_to === userRole.id ||
           teamMemberIds.includes(task.assigned_to);
  }
  return false;
};
```

### Team Member Settings UI

**New section in Settings > Team Members:**
```
For each team member row, admins/managers can set:
- Manager dropdown (select which manager they report to)
- This creates the manager_id link
```

---

## 7. Edge Cases & Solutions

### Edge Case 1: User Role Changes
**Scenario:** A manager is demoted to member. What happens to tasks they created or were assigned?

**Solution:**
- **Tasks remain visible** to their former team members via the new manager
- **Task ownership doesn't change** - `created_by` stays the same
- **Current assignments remain** - tasks assigned to them stay assigned
- **Future visibility changes** - they can now only see tasks assigned to them
- **No data loss** - all historical task data is preserved

**Implementation:**
- When role changes, run a notification/warning: "This user has X active tasks assigned to Y team members"
- Option to reassign all their team's tasks to a new manager
- Audit log the role change

---

### Edge Case 2: Manager Leaves/Is Deleted
**Scenario:** A manager is deactivated or deleted. What happens to their team members?

**Solution:**
- **Team members' manager_id becomes NULL** (via ON DELETE SET NULL)
- **Admins automatically see these "orphaned" members**
- **UI shows warning:** "X team members have no manager"
- **Prompt admin to assign a new manager**

**Implementation:**
```sql
-- Already handled by foreign key:
manager_id UUID REFERENCES organization_members(id) ON DELETE SET NULL
```

---

### Edge Case 3: Shared/Public Tasks
**Scenario:** Need a task visible to everyone in the organization (e.g., "Harvest Party on Friday")

**Solution:**
- **Use `visibility` column:**
  - `private` = only creator + assignee
  - `team` = creator + assignee + managers (default)
  - `organization` = everyone in org

**Implementation:**
- Add to RLS policy:
```sql
OR
-- Everyone can see organization-wide tasks
(tasks.visibility = 'organization' AND EXISTS (
  SELECT 1 FROM organization_members
  WHERE organization_members.organization_id = tasks.organization_id
  AND organization_members.user_id = auth.uid()
  AND organization_members.is_active = TRUE
))
```

---

### Edge Case 4: Unassigned Tasks
**Scenario:** Task is created but not assigned to anyone yet

**Solution:**
- **Creator can always see their tasks** (covered in RLS)
- **Admins can see all tasks** (covered in RLS)
- **Managers can see unassigned tasks they created**

**No special handling needed** - existing policies cover this.

---

### Edge Case 5: Multi-Manager Approval Workflows
**Scenario:** Task needs approval from multiple managers

**Solution:**
- **Use `can_approve_tasks` permission** + task status workflow
- **Status flow:** `draft` → `needs_review` → `approved` → `scheduled` → `in_progress` → `done`
- **Only users with `can_approve_tasks` can transition** `needs_review` → `approved`

**Implementation:**
- Frontend: Show "Request Approval" button for task creators
- Frontend: Show "Approve" button only for users with `can_approve_tasks`
- Backend: Validate status transitions based on permissions

---

### Edge Case 6: Cross-Organization Users
**Scenario:** User is a member of multiple organizations (consultant, contractor)

**Solution:**
- **Already supported** - users can be members of multiple organizations
- **Context switching** - UI should show current organization
- **Tasks are scoped** to organization_id, so no cross-contamination

**Implementation:**
- Add organization selector in header (if user is in multiple orgs)
- Store selected org in local state/context
- Filter all queries by selected organization_id

---

### Edge Case 7: Task Assignment to Non-Existent Member
**Scenario:** Try to assign task to a member who has been deleted/deactivated

**Solution:**
- **Foreign key constraint** prevents invalid assignments:
```sql
FOREIGN KEY (assigned_to) REFERENCES organization_members(id) ON DELETE SET NULL
```
- **If member is deleted**, assigned_to becomes NULL
- **If member is deactivated**, task remains assigned but they can't see it (is_active check in RLS)

**Frontend:**
- Task assignment dropdown only shows `is_active = TRUE` members
- Show warning if task assigned to inactive member

---

## 8. Configuration Options

### Organization-Level Settings
Add optional settings to the `organizations` table for flexibility:

```sql
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS task_visibility_default TEXT DEFAULT 'team'
    CHECK (task_visibility_default IN ('private', 'team', 'organization'));

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS managers_see_all_tasks BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN organizations.managers_see_all_tasks IS
  'If TRUE, managers can see all tasks in the organization (like admins). If FALSE, managers only see their team tasks.';
```

**Use case:** Some small vineyards may want managers to see everything, others want strict team boundaries.

---

## 9. Migration Plan

### Phase 1: Database Schema (Breaking Change)
1. Run migration to add `manager_id` to organization_members
2. Run migration to add `visibility` to tasks
3. Update RLS policies

**Downtime:** ~5 minutes
**User Impact:** Users will be logged out, need to refresh

---

### Phase 2: API Layer (Non-Breaking)
1. Update `listTasks()` to remove user_id filter
2. Add `getCurrentUserRole()` helper
3. Add `getMyTeamMembers()` helper

**Downtime:** None
**User Impact:** None (RLS handles old API calls)

---

### Phase 3: Frontend (Rolling Update)
1. Update Task List with role-based filters
2. Update TaskDrawer with permission checks
3. Add Manager Assignment UI in Team Settings

**Downtime:** None
**User Impact:** Gradual feature rollout

---

### Phase 4: Data Cleanup (Optional)
1. Review existing tasks for proper assignments
2. Notify admins of any orphaned tasks
3. Set default managers for existing members

---

## 10. Testing Checklist

### Admin Testing
- [ ] Can see all tasks (created by anyone, assigned to anyone)
- [ ] Can create tasks and assign to any member
- [ ] Can edit any task
- [ ] Can delete any task
- [ ] Can reassign any task
- [ ] Can see cost information on all tasks

### Manager Testing
- [ ] Can see tasks assigned to them
- [ ] Can see tasks they created
- [ ] Can see tasks assigned to their team members
- [ ] Cannot see tasks for other managers' teams
- [ ] Can create tasks and assign to their team
- [ ] Can edit tasks within their scope
- [ ] Can update status/dates for team tasks
- [ ] Can reassign tasks within their team
- [ ] Cannot delete tasks (unless they created them)

### Member Testing
- [ ] Can see tasks assigned to them
- [ ] Can see tasks they created
- [ ] Cannot see other members' tasks
- [ ] Can update status on their tasks
- [ ] Cannot reassign tasks
- [ ] Cannot delete tasks
- [ ] Cannot see cost information (unless permission granted)

### Edge Case Testing
- [ ] Role change: Manager → Member (loses team visibility)
- [ ] Role change: Member → Manager (gains team visibility)
- [ ] Manager deletion (team members become orphans)
- [ ] Task assigned to inactive member (becomes unassigned)
- [ ] Unassigned task visibility
- [ ] Organization-wide task visibility
- [ ] Multiple organizations (context switching)

---

## 11. Rollback Plan

If issues arise:

### Quick Rollback (Restore Old Behavior)
```sql
-- Temporarily make all tasks visible to all org members (old behavior)
DROP POLICY IF EXISTS "task_select_rbac" ON tasks;

CREATE POLICY "task_select_temp_all" ON tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = tasks.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.is_active = TRUE
    )
  );
```

### Full Rollback
1. Revert RLS policies to previous version
2. Revert API changes (restore user_id filter)
3. Revert frontend (remove role-based filters)
4. Keep schema changes (manager_id, visibility) - they're non-breaking

---

## 12. Future Enhancements

### Possible Additions
1. **Task Delegation** - Managers can delegate approval authority
2. **Custom Roles** - Create custom roles beyond admin/manager/member
3. **Department-Based Teams** - Group by department instead of manager
4. **Block-Based Permissions** - Restrict visibility by vineyard block access
5. **Task Templates by Role** - Different task templates available based on role
6. **Notification Rules** - Role-based notification preferences
7. **Audit Log** - Track who viewed/edited tasks for compliance

---

## Summary

This RBAC design provides:
- ✅ Clear role separation (Admin, Manager, Member)
- ✅ Manager-based team hierarchy
- ✅ Secure RLS policies at database level
- ✅ API layer that respects roles
- ✅ Frontend permission checks
- ✅ Handles edge cases gracefully
- ✅ Configurable organization settings
- ✅ Backward compatible migration path
- ✅ Comprehensive testing plan
- ✅ Clear rollback procedure

**Next Steps:**
1. Review this design with stakeholders
2. Decide on team concept (Option A, B, or C)
3. Implement Phase 1 (Database schema + RLS)
4. Test thoroughly in staging environment
5. Roll out to production
