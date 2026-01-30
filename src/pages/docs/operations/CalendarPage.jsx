import DocsLayout from "../DocsLayout";
import { DocsHeader, Section, Subsection, Callout, Table, NextSteps } from "../DocsComponents";

export default function CalendarPage() {
  return (
    <DocsLayout>
      <DocsHeader
        title="Calendar View"
        subtitle="Visualize tasks, irrigation schedules, spray applications, and harvest activities on a month-by-month calendar with drag-and-drop planning."
      />

      <Callout type="note" title="Beta v1.0">
        Calendar View is ready to use for task scheduling and timeline visualization. We're actively adding features based on user feedback.
      </Callout>

      <Section title="Overview">
        <p>
          The Calendar View provides a visual timeline of all vineyard activities across blocks and team members. See irrigation schedules, spray applications, pruning tasks, harvest dates, and team assignments in a single monthly or weekly view.
        </p>
        <p>
          The calendar integrates with Tasks, Irrigation, Spray Records, and Team Management to provide a unified scheduling interface. Any changes made in the calendar automatically update the source modules.
        </p>
      </Section>

      <Section title="Calendar Views">
        <Subsection title="Month View">
          <p>
            The default calendar layout showing a full month at a glance:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Task Pills:</strong> Color-coded task cards showing title, assignee, and block</li>
            <li><strong>Multi-Day Events:</strong> Tasks spanning multiple days show as continuous bars</li>
            <li><strong>Event Stacking:</strong> Multiple events on same day stack vertically</li>
            <li><strong>Quick Add:</strong> Click any date to create a new task</li>
          </ul>
        </Subsection>

        <Subsection title="Week View">
          <p>
            Detailed 7-day view with hourly granularity (useful for harvest logistics):
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Shows tasks by hour (e.g., "7:00 AM - Pick Block A")</li>
            <li>Crew assignment visibility for time-based scheduling</li>
            <li>Hourly irrigation schedules with start/stop times</li>
            <li>Weather overlay showing forecast for each day</li>
          </ul>
        </Subsection>

        <Subsection title="Day View">
          <p>
            Single-day detailed view for complex harvest days:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Timeline view with minute-level precision</li>
            <li>Load scheduling (e.g., "8:00 AM - Load 1: Block A, 3 tons")</li>
            <li>Crew assignments and equipment allocation</li>
            <li>Real-time status updates (completed vs. pending)</li>
          </ul>
        </Subsection>

        <Subsection title="Agenda View">
          <p>
            List-style view of upcoming tasks sorted chronologically:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Shows next 7, 14, or 30 days in list format</li>
            <li>Expandable task details with notes and completion status</li>
            <li>Filter by block, team member, or task type</li>
            <li>Useful for mobile devices and print-friendly task lists</li>
          </ul>
        </Subsection>
      </Section>

      <Section title="Event Types">
        <Subsection title="Task Events">
          <p>
            Tasks from Task Management appear on the calendar with visual indicators:
          </p>
          <Table
            headers={["Task Type", "Color", "Icon"]}
            rows={[
              ["Pruning", "Blue", "Scissors icon"],
              ["Canopy Management", "Green", "Leaf icon"],
              ["Spraying", "Orange", "Spray icon"],
              ["Irrigation", "Teal", "Droplet icon"],
              ["Harvest", "Purple", "Grape cluster icon"],
              ["Equipment Maintenance", "Gray", "Wrench icon"],
            ]}
          />
        </Subsection>

        <Subsection title="Irrigation Schedules">
          <p>
            Scheduled irrigation events from Irrigation Management:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Recurring Events:</strong> Show as repeating patterns (e.g., every 3 days)</li>
            <li><strong>Duration Display:</strong> Shows hours irrigating (e.g., "4.5 hrs")</li>
            <li><strong>Block Grouping:</strong> Multiple blocks on same schedule show grouped</li>
            <li><strong>Completion Status:</strong> Past events marked complete, future events pending</li>
          </ul>
        </Subsection>

        <Subsection title="Spray Applications">
          <p>
            Spray records from Spray Management with PHI/REI tracking:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Application Date:</strong> When spray occurred</li>
            <li><strong>Re-Entry Interval:</strong> Shaded period showing when block is locked</li>
            <li><strong>Pre-Harvest Interval:</strong> Days until harvest allowed</li>
            <li><strong>Chemical Name:</strong> Product applied (hover for details)</li>
          </ul>
          <Callout type="warning" title="PHI Lock Visualization">
            Blocks with active PHI restrictions show red overlay on calendar through the restricted period. Attempting to schedule harvest during PHI displays a warning.
          </Callout>
        </Subsection>

        <Subsection title="Harvest Events">
          <p>
            Harvest loads and berry sampling activities:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Harvest Loads:</strong> Scheduled pick dates with estimated tons</li>
            <li><strong>Berry Samples:</strong> Maturity sampling dates (Brix, pH, TA tests)</li>
            <li><strong>Ready-to-Pick Estimates:</strong> Auto-calculated from sample progression</li>
            <li><strong>Weather Integration:</strong> Shows forecast for planned harvest dates</li>
          </ul>
        </Subsection>

        <Subsection title="Weather Events">
          <p>
            Weather forecast and historical data overlays:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>7-Day Forecast:</strong> Temperature, precipitation, wind</li>
            <li><strong>Frost Warnings:</strong> Highlighted dates with frost risk</li>
            <li><strong>Rain Events:</strong> Precipitation amounts and timing</li>
            <li><strong>Heat Waves:</strong> Days exceeding 95°F marked for irrigation planning</li>
          </ul>
        </Subsection>
      </Section>

      <Section title="Drag-and-Drop Scheduling">
        <Subsection title="Rescheduling Tasks">
          <p>
            Move tasks to different dates with simple drag-and-drop:
          </p>
          <ol className="list-decimal list-inside space-y-2 ml-4">
            <li>Click and hold on task card</li>
            <li>Drag to new date</li>
            <li>Release to reschedule</li>
            <li>Task automatically updates in Task Management</li>
          </ol>
          <Callout type="tip" title="Batch Rescheduling">
            Hold Shift and click multiple tasks, then drag to move all selected tasks by the same offset. Useful for weather delays affecting multiple operations.
          </Callout>
        </Subsection>

        <Subsection title="Extending Task Duration">
          <p>
            Adjust multi-day tasks by dragging the end date:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Hover over end of task bar</li>
            <li>Cursor changes to resize icon</li>
            <li>Drag right to extend, left to shorten</li>
            <li>Updates task duration and reassigns labor hours</li>
          </ul>
        </Subsection>

        <Subsection title="Quick Task Creation">
          <p>
            Create new tasks directly from calendar:
          </p>
          <ol className="list-decimal list-inside space-y-2 ml-4">
            <li>Click on any date cell</li>
            <li>Task creation modal appears with date pre-filled</li>
            <li>Select block, task type, assignee</li>
            <li>Add notes and save</li>
            <li>Task appears immediately on calendar</li>
          </ol>
        </Subsection>

        <Subsection title="Copying Tasks">
          <p>
            Duplicate recurring tasks across weeks or blocks:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Right-click task → "Duplicate"</li>
            <li>Select new date and block</li>
            <li>Task copies with all properties</li>
            <li>Useful for weekly spray rotations or sampling</li>
          </ul>
        </Subsection>
      </Section>

      <Section title="Filtering & Display Options">
        <Subsection title="Filter by Block">
          <p>
            Show only tasks for specific vineyard blocks:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Dropdown selector lists all active blocks</li>
            <li>Multi-select to show multiple blocks</li>
            <li>Useful for focus on harvest timing across similar varieties</li>
          </ul>
        </Subsection>

        <Subsection title="Filter by Task Type">
          <p>
            Show only specific activity categories:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Toggle checkboxes for: Pruning, Spraying, Irrigation, Harvest, etc.</li>
            <li>Hide irrigation to see only manual tasks</li>
            <li>Show only harvest activities during picking season</li>
          </ul>
        </Subsection>

        <Subsection title="Filter by Assignee">
          <p>
            View tasks assigned to specific team members:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Select team member from dropdown</li>
            <li>Shows only their assigned tasks</li>
            <li>Useful for individual crew member schedules</li>
            <li>Export to PDF for printed crew schedules</li>
          </ul>
        </Subsection>

        <Subsection title="Completion Status">
          <p>
            Toggle visibility of completed vs. pending tasks:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Show Completed:</strong> Display finished tasks with checkmark overlay</li>
            <li><strong>Hide Completed:</strong> Clean view showing only pending work</li>
            <li><strong>Overdue Highlight:</strong> Past-due tasks show in red</li>
          </ul>
        </Subsection>
      </Section>

      <Section title="Task Details Panel">
        <Subsection title="Quick View">
          <p>
            Click any calendar event to open details sidebar:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Task Info:</strong> Name, block, dates, priority</li>
            <li><strong>Assignee:</strong> Team member responsible</li>
            <li><strong>Status:</strong> Pending, In Progress, Completed</li>
            <li><strong>Notes:</strong> Task description and instructions</li>
            <li><strong>Weather:</strong> Forecast for scheduled date</li>
          </ul>
        </Subsection>

        <Subsection title="Quick Edit">
          <p>
            Make changes without leaving calendar view:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Change assignee from dropdown</li>
            <li>Update status (mark complete)</li>
            <li>Add notes or observations</li>
            <li>Reschedule with date picker</li>
            <li>Delete task (with confirmation)</li>
          </ul>
        </Subsection>

        <Subsection title="Related Events">
          <p>
            See related tasks and dependencies:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Spray applications affecting the same block</li>
            <li>PHI/REI restrictions blocking harvest</li>
            <li>Prior tasks in sequence (e.g., thinning before harvest)</li>
          </ul>
        </Subsection>
      </Section>

      <Section title="Printing & Export">
        <Subsection title="Print Calendar">
          <p>
            Generate printable crew schedules:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Click "Print" button in calendar header</li>
            <li>Select date range (week, month, custom)</li>
            <li>Choose filters (specific blocks, task types, crew)</li>
            <li>Generates clean PDF for printing</li>
          </ul>
        </Subsection>

        <Subsection title="Export to CSV">
          <p>
            Download task list as spreadsheet:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Export → CSV format</li>
            <li>Includes: Date, Block, Task, Assignee, Status, Notes</li>
            <li>Import into Excel, Google Sheets, or other tools</li>
            <li>Useful for payroll, compliance records, or reporting</li>
          </ul>
        </Subsection>

        <Subsection title="iCal Sync (Coming Soon)">
          <p>
            Sync Trellis calendar with external calendar apps:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Generate iCal feed URL</li>
            <li>Subscribe in Google Calendar, Apple Calendar, Outlook</li>
            <li>Tasks appear on personal calendar</li>
            <li>Updates automatically as tasks change</li>
          </ul>
          <Callout type="note" title="Roadmap">
            iCal sync is planned for Q2 2025. Email support@trellisag.com to join the beta test list.
          </Callout>
        </Subsection>
      </Section>

      <Section title="Mobile Calendar">
        <Subsection title="Responsive Design">
          <p>
            Calendar adapts for mobile and tablet screens:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Mobile:</strong> Defaults to Agenda view (list format)</li>
            <li><strong>Tablet:</strong> Shows week view with vertical scrolling</li>
            <li><strong>Touch Gestures:</strong> Swipe to navigate weeks, tap to view details</li>
          </ul>
        </Subsection>

        <Subsection title="Field Updates">
          <p>
            Update task status from the vineyard:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Open calendar on mobile device</li>
            <li>Tap task to open details</li>
            <li>Mark complete, add notes, attach photos</li>
            <li>Changes sync immediately to desktop</li>
          </ul>
        </Subsection>
      </Section>

      <Section title="Calendar Integration">
        <Subsection title="Auto-Population from Modules">
          <p>
            Calendar automatically pulls events from:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Task Management:</strong> All assigned tasks</li>
            <li><strong>Irrigation Management:</strong> Scheduled and completed irrigation events</li>
            <li><strong>Spray Records:</strong> Application dates, PHI/REI periods</li>
            <li><strong>Field Management:</strong> Harvest sample dates</li>
          </ul>
        </Subsection>

        <Subsection title="Two-Way Sync">
          <p>
            Changes in calendar update source modules and vice versa:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Reschedule task in calendar → updates Task Management</li>
            <li>Mark task complete in Task Management → updates calendar</li>
            <li>Create irrigation schedule → appears on calendar immediately</li>
            <li>No duplicate entry needed</li>
          </ul>
        </Subsection>
      </Section>

      <Section title="Best Practices">
        <Subsection title="Weekly Planning Routine">
          <p>
            Use calendar every Monday to plan the week ahead:
          </p>
          <ol className="list-decimal list-inside space-y-2 ml-4">
            <li>Review upcoming tasks for next 7 days</li>
            <li>Check weather forecast and adjust outdoor tasks</li>
            <li>Assign crew to specific tasks</li>
            <li>Verify no PHI/REI conflicts with planned harvest</li>
            <li>Print weekly schedule for crew</li>
          </ol>
        </Subsection>

        <Subsection title="Harvest Season Scheduling">
          <p>
            During harvest, use daily view for logistics:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Schedule pick times to avoid heat (early morning)</li>
            <li>Coordinate haul truck arrival times</li>
            <li>Track multiple loads per day with time slots</li>
            <li>Monitor weather for rain delays</li>
          </ul>
        </Subsection>

        <Subsection title="Color Coding Consistency">
          <p>
            Use consistent color scheme across all tasks:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Blue = Canopy work (pruning, hedging, thinning)</li>
            <li>Green = Plant health (nutrition, cover crops)</li>
            <li>Orange = Pest/disease management (sprays)</li>
            <li>Teal = Irrigation</li>
            <li>Purple = Harvest</li>
            <li>Gray = Equipment/infrastructure</li>
          </ul>
        </Subsection>
      </Section>

      <Callout type="tip" title="Calendar as Command Center">
        Successful vineyard managers use the Calendar View as their daily command center—checking it every morning to see what needs to happen today, who's doing it, and what weather might impact the schedule.
      </Callout>

      <NextSteps
        links={[
          {
            title: "Task Management",
            description: "Create and assign vineyard tasks",
            href: "/docs/operations/tasks",
          },
          {
            title: "Irrigation Management",
            description: "Schedule irrigation and view on calendar",
            href: "/docs/operations/irrigation",
          },
          {
            title: "Team Management",
            description: "Manage crew assignments and availability",
            href: "/docs/operations/team",
          },
        ]}
      />
    </DocsLayout>
  );
}
