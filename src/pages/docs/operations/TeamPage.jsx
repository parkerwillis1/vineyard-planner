import DocsLayout from "../DocsLayout";
import { DocsHeader, Section, Subsection, Callout, Table, NextSteps } from "../DocsComponents";

export default function TeamPage() {
  return (
    <DocsLayout>
      <DocsHeader
        title="Team Management"
        subtitle="Invite team members, assign roles, and collaborate on vineyard operations with permission-based access control."
      />

      <Callout type="note" title="Beta v1.0">
        Team Management is ready to use. We're actively improving features based on user feedback.
      </Callout>

      <Section title="Overview">
        <p>
          Team Management allows you to build your vineyard operations team by inviting employees, contractors, and managers. Assign role-based permissions to control who can view financial data, manage tasks, edit blocks, or access specific features.
        </p>
        <p>
          Set up your organization profile with logo, location, and description, then invite team members via email. Track active invitations, manage member access, and ensure everyone has the right level of permissions for their role.
        </p>
      </Section>

      <Section title="Organization Setup">
        <Subsection title="Organization Profile">
          <p>
            Configure your organization's profile to personalize the platform for your team:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Organization Name:</strong> Your vineyard or winery name (e.g., "Smith Family Vineyards")</li>
            <li><strong>Logo:</strong> Upload a logo image (displayed in team dashboard and member views)</li>
            <li><strong>Location:</strong> City, state, or region (e.g., "Napa Valley, CA")</li>
            <li><strong>Description:</strong> Brief overview of your operation</li>
          </ul>
          <p className="text-sm text-gray-600 mt-3">
            Organization details are visible to all team members and appear in task assignments, reports, and shared documents.
          </p>
        </Subsection>

        <Subsection title="Editing Organization Details">
          <p>
            Admins can update organization information by clicking "Edit Organization" in the Team Management dashboard. Changes are immediately visible to all team members.
          </p>
        </Subsection>
      </Section>

      <Section title="Team Roles">
        <Subsection title="Role-Based Permissions">
          <p>
            Vine Pioneer uses three permission levels to control feature access:
          </p>
          <Table
            headers={["Role", "Icon", "Permissions"]}
            rows={[
              ["Admin", "👑", "Full access - manage team, view costs/financials, access all features, edit organization settings"],
              ["Manager", "🛡️", "Manage operations, create/assign tasks, view reports, edit blocks and schedules, no financial access"],
              ["Member", "👤", "View and complete assigned tasks, log work hours, no administrative or financial access"],
            ]}
          />
        </Subsection>

        <Subsection title="Admin Capabilities">
          <p>
            Admin role is typically reserved for vineyard owners, partners, or office managers who need full system access. Admins can:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Invite and remove team members</li>
            <li>Change member roles and permissions</li>
            <li>View financial data including budgets, costs, and profitability</li>
            <li>Manage subscription and billing settings</li>
            <li>Edit organization profile and branding</li>
            <li>Access all vineyard blocks, tasks, and reports</li>
            <li>Configure integrations and API keys</li>
          </ul>
        </Subsection>

        <Subsection title="Manager Capabilities">
          <p>
            Managers are field supervisors, vineyard managers, or lead growers who coordinate daily operations. Managers can:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Create and assign tasks to team members</li>
            <li>Edit vineyard blocks (add, update, delete)</li>
            <li>Manage irrigation schedules and spray applications</li>
            <li>View and edit harvest tracking</li>
            <li>Access operational reports (yield, labor, task completion)</li>
            <li>Cannot view financial data, costs, or budgets</li>
            <li>Cannot invite or remove team members</li>
          </ul>
          <Callout type="tip" title="Best Practice">
            Use Manager role for trusted employees who run field operations but don't need visibility into business financials.
          </Callout>
        </Subsection>

        <Subsection title="Member Capabilities">
          <p>
            Members are field workers, seasonal employees, or contractors with limited access. Members can:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>View tasks assigned to them</li>
            <li>Mark tasks complete and log hours worked</li>
            <li>Add notes to task completion records</li>
            <li>View blocks they're working on</li>
            <li>Cannot create tasks, edit blocks, or view other team members' tasks</li>
            <li>Cannot access reports or analytics</li>
          </ul>
        </Subsection>
      </Section>

      <Section title="Inviting Team Members">
        <Subsection title="Sending Invitations">
          <p>
            To invite a new team member:
          </p>
          <ol className="list-decimal list-inside space-y-2 ml-4">
            <li>Click "Invite Team Member" in the Team dashboard</li>
            <li>Enter their email address</li>
            <li>Enter their full name</li>
            <li>Select their role (Admin, Manager, or Member)</li>
            <li>Optionally add phone number and notes</li>
            <li>Click "Send Invitation"</li>
          </ol>
          <p className="text-sm text-gray-600 mt-3">
            The system sends an email invitation with a signup link. Invitations expire after 7 days.
          </p>
        </Subsection>

        <Subsection title="Invitation Status">
          <p>
            Track invitation status for each team member:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Pending:</strong> Invitation sent but not yet accepted</li>
            <li><strong>Active:</strong> User has accepted invitation and created account</li>
            <li><strong>Expired:</strong> Invitation not accepted within 7 days (resend to reactivate)</li>
          </ul>
        </Subsection>

        <Subsection title="Resending Invitations">
          <p>
            If a team member doesn't receive or loses their invitation email, click "Resend Invitation" next to their name to send a fresh link.
          </p>
        </Subsection>
      </Section>

      <Section title="Managing Team Members">
        <Subsection title="Editing Member Details">
          <p>
            Admins can update any team member's information:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Change role (promote/demote)</li>
            <li>Update name, email, or phone number</li>
            <li>Add or edit notes about the member</li>
            <li>Deactivate or remove access</li>
          </ul>
          <Callout type="warning" title="Permission Changes">
            When you change a member's role, their access updates immediately. Downgrading from Admin to Manager will revoke financial data access right away.
          </Callout>
        </Subsection>

        <Subsection title="Removing Team Members">
          <p>
            To remove a team member, click the trash icon next to their name and confirm the deletion. Removing a member:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Revokes their access to the vineyard operations</li>
            <li>Preserves historical task assignments and completion records</li>
            <li>Unassigns them from future scheduled tasks</li>
            <li>Does not delete their user account (they can still access other vineyards)</li>
          </ul>
        </Subsection>

        <Subsection title="Deactivating vs. Removing">
          <p>
            If you want to temporarily suspend a member's access (e.g., seasonal worker between seasons), consider changing their role to a lower permission level instead of fully removing them. This preserves their login and task history.
          </p>
        </Subsection>
      </Section>

      <Section title="Team Dashboard">
        <Subsection title="Member List View">
          <p>
            The Team dashboard displays all organization members with:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Member name and avatar</li>
            <li>Role badge with color coding (purple = admin, blue = manager, green = member)</li>
            <li>Contact information (email, phone)</li>
            <li>Status indicator (active, pending invitation)</li>
            <li>Join date</li>
            <li>Quick action buttons (edit, remove)</li>
          </ul>
        </Subsection>

        <Subsection title="Organization Overview">
          <p>
            At the top of the Team page, view your organization profile card with logo, name, location, and description. Click "Edit Organization" to update details.
          </p>
        </Subsection>
      </Section>

      <Section title="Permissions Reference">
        <Subsection title="Feature Access by Role">
          <Table
            headers={["Feature", "Admin", "Manager", "Member"]}
            rows={[
              ["View Vineyard Planner (financials)", "✓", "✗", "✗"],
              ["Manage Blocks", "✓", "✓", "✗"],
              ["Create/Assign Tasks", "✓", "✓", "✗"],
              ["Complete Assigned Tasks", "✓", "✓", "✓"],
              ["Manage Irrigation", "✓", "✓", "✗"],
              ["Record Spray Applications", "✓", "✓", "✗"],
              ["Track Harvest Loads", "✓", "✓", "✗"],
              ["View Reports & Analytics", "✓", "✓", "✗"],
              ["Invite/Remove Team Members", "✓", "✗", "✗"],
              ["Edit Organization Settings", "✓", "✗", "✗"],
              ["Manage Subscription/Billing", "✓", "✗", "✗"],
            ]}
          />
        </Subsection>

        <Subsection title="Data Visibility">
          <p>
            Members can only see data relevant to their work:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Members:</strong> Only see tasks assigned to them and blocks they're working on</li>
            <li><strong>Managers:</strong> See all operational data but no financial information</li>
            <li><strong>Admins:</strong> See everything including costs, budgets, and profitability</li>
          </ul>
        </Subsection>
      </Section>

      <Callout type="note" title="Multi-Vineyard Access">
        Team members can belong to multiple vineyard organizations. When they log in, they'll see all vineyards they have access to and can switch between them from the navigation menu.
      </Callout>

      <NextSteps
        links={[
          {
            title: "Task Management",
            description: "Assign tasks to team members and track completion",
            href: "/docs/operations/tasks",
          },
          {
            title: "Block Management",
            description: "Set up vineyard blocks and GPS boundaries",
            href: "/docs/operations/blocks",
          },
          {
            title: "Calendar View",
            description: "View team schedules and task assignments",
            href: "/docs/operations/calendar",
          },
        ]}
      />
    </DocsLayout>
  );
}
