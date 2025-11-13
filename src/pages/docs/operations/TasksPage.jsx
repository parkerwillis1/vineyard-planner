import DocsLayout from "../DocsLayout";
import { DocsHeader, Section, Subsection, Callout, Table, NextSteps } from "../DocsComponents";

export default function TasksPage() {
  return (
    <DocsLayout>
      <DocsHeader
        title="Task Management"
        subtitle="Organize vineyard operations with kanban boards, assignments, scheduling, and progress tracking."
      />

      <Callout type="note" title="Beta v1.0">
        Task Management is ready to use. We're actively improving features based on user feedback.
      </Callout>

      <Section title="Overview">
        <p>
          Task Management helps you organize and track all vineyard operations—from pruning and canopy management to spray applications and harvest prep. Assign tasks to team members, set priorities, monitor progress, and ensure nothing falls through the cracks.
        </p>
        <p>
          Choose between list view for detailed task tracking or kanban board for visual workflow management. Filter by season, block, type, or team member to focus on what matters most.
        </p>
      </Section>

      <Section title="Creating Tasks">
        <Subsection title="Task Properties">
          <p>
            Each task includes the following information:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Title:</strong> Short description of the task</li>
            <li><strong>Type:</strong> Category of work (see task types below)</li>
            <li><strong>Status:</strong> Current workflow state (draft, scheduled, in progress, etc.)</li>
            <li><strong>Priority:</strong> Low, Normal, High, or Urgent</li>
            <li><strong>Due Date:</strong> Target completion date</li>
            <li><strong>Assigned To:</strong> Team member responsible for completion</li>
            <li><strong>Season:</strong> Growing season the task belongs to</li>
            <li><strong>Blocks:</strong> Which vineyard blocks this task applies to (multi-select)</li>
            <li><strong>Instructions:</strong> Detailed steps or guidance for completing the task</li>
            <li><strong>Notes:</strong> Additional context, observations, or completion notes</li>
            <li><strong>Estimated Hours:</strong> Expected time to complete</li>
            <li><strong>Actual Hours:</strong> Time actually spent (logged upon completion)</li>
          </ul>
        </Subsection>

        <Subsection title="Task Types">
          <p>
            Tasks are organized into categories matching vineyard operations:
          </p>
          <Table
            headers={["Task Type", "Use Cases"]}
            rows={[
              ["Vine Operations", "General vineyard work not covered by other categories"],
              ["Spray Prep", "Prepare spray equipment, mix chemicals, calibrate sprayers"],
              ["Irrigation", "Set up irrigation, check emitters, monitor flow rates"],
              ["Harvest Prep", "Prepare bins, organize logistics, ready equipment"],
              ["Maintenance", "Equipment repairs, trellis fixes, infrastructure work"],
              ["Admin", "Record-keeping, compliance reporting, documentation"],
              ["Scouting", "Monitor pest pressure, disease, vine health, maturity"],
              ["Pruning", "Winter pruning, suckering, shoot thinning"],
              ["Canopy Management", "Leaf pulling, shoot positioning, hedging, topping"],
              ["Weed Control", "Cultivation, mowing, herbicide application"],
              ["Fertilization", "Soil amendments, foliar feeds, compost application"],
              ["Other", "Custom operations not fitting standard categories"],
            ]}
          />
        </Subsection>

        <Subsection title="Quick Task Creation">
          <p>
            Click "Add Task" to open the task creation modal. Fill in the required fields (title, type, status) and optionally add details like assignment, blocks, and instructions. Tasks default to "Draft" status and current season.
          </p>
        </Subsection>
      </Section>

      <Section title="Task Statuses">
        <Subsection title="Workflow States">
          <p>
            Tasks move through a defined workflow from planning to completion:
          </p>
          <Table
            headers={["Status", "Icon", "Meaning"]}
            rows={[
              ["Draft", "○", "Task being planned - not yet scheduled"],
              ["Scheduled", "📅", "Task planned with due date - ready to start"],
              ["In Progress", "⟳", "Team member actively working on task"],
              ["Needs Review", "⚠", "Completed but requires manager approval"],
              ["Done", "✓", "Task completed and verified"],
              ["Blocked", "⊗", "Cannot proceed - waiting on dependency or issue"],
              ["Archived", "📦", "Historical task - removed from active view"],
            ]}
          />
        </Subsection>

        <Subsection title="Status Transitions">
          <p>
            Typical task workflow:
          </p>
          <ol className="list-decimal list-inside space-y-2 ml-4">
            <li><strong>Draft:</strong> Manager creates task, fills in details</li>
            <li><strong>Scheduled:</strong> Task assigned, due date set, ready for team</li>
            <li><strong>In Progress:</strong> Team member starts work</li>
            <li><strong>Needs Review:</strong> Work complete, awaiting manager sign-off</li>
            <li><strong>Done:</strong> Approved and closed</li>
          </ol>
          <p className="text-sm text-gray-600 mt-3">
            Use "Blocked" status for tasks waiting on equipment, weather, or other dependencies.
          </p>
        </Subsection>

        <Subsection title="Quick Complete">
          <p>
            In list view, click the checkmark icon next to any task to instantly mark it as "Done" without opening the full task drawer.
          </p>
        </Subsection>
      </Section>

      <Section title="Views">
        <Subsection title="List View">
          <p>
            List view displays tasks in a sortable, filterable table with key information at a glance:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Task title with color-coded status indicator</li>
            <li>Type badge</li>
            <li>Priority level</li>
            <li>Assigned team member with avatar</li>
            <li>Due date (highlights overdue tasks in red)</li>
            <li>Block tags showing where task applies</li>
            <li>Quick action buttons (complete, edit, delete)</li>
          </ul>
          <p className="text-sm text-gray-600 mt-3">
            List view supports pagination (20 tasks per page) and is ideal for managers tracking many tasks across the vineyard.
          </p>
        </Subsection>

        <Subsection title="Kanban Board">
          <p>
            Kanban view organizes tasks into columns by status, providing a visual workflow:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Columns for each status (Draft, Scheduled, In Progress, etc.)</li>
            <li>Drag and drop tasks between columns to update status</li>
            <li>Task cards show title, type, priority, assignee, and due date</li>
            <li>Color-coded priority borders (red = urgent, orange = high, blue = normal, gray = low)</li>
            <li>Count badges showing number of tasks in each column</li>
          </ul>
          <Callout type="tip" title="Best Practice">
            Use kanban view during daily standup meetings to move tasks through the workflow and identify bottlenecks.
          </Callout>
        </Subsection>

        <Subsection title="Calendar View">
          <p>
            Switch to Calendar view to see tasks plotted on a monthly or weekly calendar. Tasks appear on their due dates with color coding by status. Click any task to view details or reschedule by dragging to a new date.
          </p>
          <p className="text-sm text-gray-600 mt-3">
            Calendar view also shows harvest loads, spray applications, and irrigation events for complete operation visibility.
          </p>
        </Subsection>
      </Section>

      <Section title="Filters">
        <Subsection title="Available Filters">
          <p>
            Narrow down the task list using multiple filter options:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Season:</strong> Show only tasks for selected growing season</li>
            <li><strong>Current Season Only:</strong> Default filter - hides past season tasks</li>
            <li><strong>Status:</strong> Filter by workflow state</li>
            <li><strong>Type:</strong> Show only specific task categories</li>
            <li><strong>Priority:</strong> Filter by urgency level</li>
            <li><strong>Block:</strong> Show tasks assigned to specific blocks</li>
            <li><strong>Assigned To:</strong> View tasks for specific team members</li>
            <li><strong>Show Completed:</strong> Include or hide done/archived tasks</li>
            <li><strong>Search:</strong> Text search across title, instructions, and notes</li>
          </ul>
          <p className="text-sm text-gray-600 mt-3">
            Filters apply to both list and kanban views. Click "Clear Filters" to reset.
          </p>
        </Subsection>

        <Subsection title="Default Filters">
          <p>
            By default, the system shows:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Current season tasks only</li>
            <li>Active tasks (completed and archived hidden)</li>
            <li>All types, priorities, and blocks</li>
          </ul>
          <p className="text-sm text-gray-600 mt-3">
            This keeps the view focused on actionable work without historical clutter.
          </p>
        </Subsection>
      </Section>

      <Section title="Task Assignment">
        <Subsection title="Assigning to Team Members">
          <p>
            Assign tasks to specific team members from the task creation/edit drawer. Only team members with vineyard access appear in the assignment dropdown.
          </p>
        </Subsection>

        <Subsection title="Team Member Views">
          <p>
            Use the "Assigned To" filter to see tasks for a specific person. This is useful for:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Printing daily work lists for crew members</li>
            <li>Reviewing individual workload balance</li>
            <li>Tracking task completion by employee</li>
          </ul>
        </Subsection>

        <Subsection title="Unassigned Tasks">
          <p>
            Tasks without an assignee are shown in a special "Unassigned" category. Use this to identify work that still needs crew allocation.
          </p>
        </Subsection>
      </Section>

      <Section title="Task Statistics">
        <Subsection title="Dashboard Metrics">
          <p>
            At the top of the task management screen, view summary statistics:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Total active tasks</li>
            <li>Tasks by status (scheduled, in progress, needs review)</li>
            <li>Overdue task count</li>
            <li>Completion rate for current season</li>
            <li>Average time to complete tasks</li>
          </ul>
        </Subsection>

        <Subsection title="Performance Tracking">
          <p>
            Compare estimated vs. actual hours to improve future task planning. Track which task types take longer than expected and adjust time estimates accordingly.
          </p>
        </Subsection>
      </Section>

      <Section title="Seasons">
        <Subsection title="Season-Based Organization">
          <p>
            Tasks are organized by growing season (typically calendar year for Northern Hemisphere vineyards). This allows you to:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Archive previous season tasks while keeping them searchable</li>
            <li>Plan next season operations in advance</li>
            <li>Compare year-over-year task completion rates</li>
            <li>Generate seasonal reports for labor planning</li>
          </ul>
        </Subsection>

        <Subsection title="Active Season">
          <p>
            One season is marked as "active" - this is the default season for new tasks. When creating tasks, they automatically default to the active season unless you manually select a different one.
          </p>
        </Subsection>
      </Section>

      <Callout type="tip" title="Integration with Other Features">
        Tasks automatically link to spray records, irrigation schedules, and harvest tracking. For example, creating a spray application in Spray Records can auto-generate "Spray Prep" and "Equipment Cleanup" tasks.
      </Callout>

      <NextSteps
        links={[
          {
            title: "Team Management",
            description: "Invite team members and assign roles",
            href: "/docs/operations/team",
          },
          {
            title: "Calendar View",
            description: "View all vineyard activities in calendar format",
            href: "/docs/operations/calendar",
          },
          {
            title: "Spray Records",
            description: "Track chemical applications and compliance",
            href: "/docs/operations/spray",
          },
        ]}
      />
    </DocsLayout>
  );
}
