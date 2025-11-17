import React from 'react';
import { Shield, Eye, Edit, Trash2, Users, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import DocsLayout from '../DocsLayout';

export default function TaskPermissionsPage() {
  return (
    <DocsLayout>
      <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Task Permissions & Hierarchy</h1>
        <p className="text-xl text-gray-600">
          Understand how task visibility and permissions work based on user roles and team structure.
        </p>
      </div>

      {/* Overview Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Shield className="w-6 h-6 text-blue-600" />
          Overview
        </h2>
        <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-6">
          <p className="text-gray-800 leading-relaxed">
            Vineyard Planner uses a <strong>role-based access control system</strong> to manage who can see and edit tasks.
            This ensures that team members only see tasks relevant to their work, while managers can oversee their teams,
            and administrators have full visibility.
          </p>
        </div>
      </section>

      {/* Three Roles */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">User Roles</h2>

        {/* Admin Role */}
        <div className="mb-8 bg-gradient-to-r from-purple-50 to-purple-100 border-l-4 border-purple-600 p-6 rounded-r-lg">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-purple-600 text-white p-2 rounded-lg">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Admin</h3>
          </div>
          <p className="text-gray-700 mb-4">
            Full system access with complete control over all tasks and team management.
          </p>

          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-gray-800"><strong>View ALL tasks</strong> - See every task regardless of who created it or who it's assigned to</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-gray-800"><strong>Create & assign tasks</strong> - Create tasks and assign them to any team member</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-gray-800"><strong>Edit any task</strong> - Modify title, description, dates, assignments, and status</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-gray-800"><strong>Delete any task</strong> - Remove or archive tasks as needed</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-gray-800"><strong>Reassign tasks</strong> - Move tasks between team members</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-gray-800"><strong>View costs</strong> - See all labor, material, and equipment costs</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-gray-800"><strong>Manage team</strong> - Add, remove, and edit team members</span>
            </div>
          </div>

          <div className="mt-4 bg-white p-4 rounded-lg border border-purple-200">
            <p className="text-sm text-gray-600">
              <strong>Who should be an Admin:</strong> Vineyard owner, operations director, or full-access administrator
            </p>
          </div>
        </div>

        {/* Manager Role */}
        <div className="mb-8 bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-600 p-6 rounded-r-lg">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-blue-600 text-white p-2 rounded-lg">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Manager</h3>
          </div>
          <p className="text-gray-700 mb-4">
            Broad operational visibility with the ability to oversee their team's work.
          </p>

          <div className="space-y-3 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Eye className="w-5 h-5 text-blue-600" />
                <strong className="text-gray-900">Can View:</strong>
              </div>
              <ul className="ml-7 space-y-1 text-gray-800">
                <li>• Tasks assigned to them</li>
                <li>• Tasks they created</li>
                <li>• <strong>Tasks assigned to their team members</strong></li>
              </ul>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Edit className="w-5 h-5 text-blue-600" />
                <strong className="text-gray-900">Can Edit:</strong>
              </div>
              <ul className="ml-7 space-y-1 text-gray-800">
                <li>• Tasks they created</li>
                <li>• Tasks assigned to them</li>
                <li>• Tasks assigned to their team members</li>
                <li>• Update status, assignments, and due dates within their scope</li>
              </ul>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="w-5 h-5 text-gray-600" />
                <strong className="text-gray-900">Restrictions:</strong>
              </div>
              <ul className="ml-7 space-y-1 text-gray-800">
                <li>• Cannot see other managers' team tasks</li>
                <li>• Can only delete tasks they created</li>
                <li>• Cannot manage team members (unless given permission)</li>
              </ul>
            </div>
          </div>

          <div className="mt-4 bg-white p-4 rounded-lg border border-blue-200">
            <p className="text-sm text-gray-600">
              <strong>Who should be a Manager:</strong> Vineyard manager, operations supervisor, or team lead
            </p>
          </div>
        </div>

        {/* Member Role */}
        <div className="mb-8 bg-gradient-to-r from-green-50 to-green-100 border-l-4 border-green-600 p-6 rounded-r-lg">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-green-600 text-white p-2 rounded-lg">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Member</h3>
          </div>
          <p className="text-gray-700 mb-4">
            Limited visibility focused on their own assigned work.
          </p>

          <div className="space-y-3 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Eye className="w-5 h-5 text-green-600" />
                <strong className="text-gray-900">Can View:</strong>
              </div>
              <ul className="ml-7 space-y-1 text-gray-800">
                <li>• Tasks assigned to them</li>
                <li>• Tasks they created (if they have task creation permission)</li>
              </ul>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Edit className="w-5 h-5 text-green-600" />
                <strong className="text-gray-900">Can Edit:</strong>
              </div>
              <ul className="ml-7 space-y-1 text-gray-800">
                <li>• Update status on tasks assigned to them</li>
                <li>• Add notes and comments to their tasks</li>
                <li>• Log time on their tasks</li>
              </ul>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="w-5 h-5 text-gray-600" />
                <strong className="text-gray-900">Restrictions:</strong>
              </div>
              <ul className="ml-7 space-y-1 text-gray-800">
                <li>• Cannot see other members' private tasks</li>
                <li>• Cannot reassign tasks</li>
                <li>• Cannot delete tasks</li>
                <li>• Cannot view costs (unless permission granted)</li>
                <li>• Cannot edit task details (only status updates)</li>
              </ul>
            </div>
          </div>

          <div className="mt-4 bg-white p-4 rounded-lg border border-green-200">
            <p className="text-sm text-gray-600">
              <strong>Who should be a Member:</strong> Vineyard worker, seasonal employee, contractor, or field crew
            </p>
          </div>
        </div>
      </section>

      {/* Team Hierarchy */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Users className="w-6 h-6 text-blue-600" />
          Team Hierarchy
        </h2>

        <p className="text-gray-700 mb-6">
          The system uses a <strong>manager-based hierarchy</strong> where each team member can report to one manager.
          This determines which tasks managers can see and oversee.
        </p>

        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h3 className="font-bold text-gray-900 mb-4">How It Works:</h3>

          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="bg-purple-100 text-purple-700 rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                1
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Each member has a manager</h4>
                <p className="text-gray-600">
                  In Settings → Team Members, you can assign a manager to each team member. This creates the reporting structure.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-purple-100 text-purple-700 rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                2
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Managers see their team's tasks</h4>
                <p className="text-gray-600">
                  When a task is assigned to a team member, their manager can automatically see and manage that task.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-purple-100 text-purple-700 rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                3
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Admins see everything</h4>
                <p className="text-gray-600">
                  Administrators bypass the hierarchy and can see all tasks across all teams.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Example Hierarchy */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h3 className="font-bold text-gray-900 mb-4">Example Hierarchy:</h3>
          <div className="font-mono text-sm">
            <div className="mb-2 flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-600" />
              <span className="font-bold text-purple-700">Peter Parker (Admin)</span>
              <span className="text-gray-500">- sees all tasks</span>
            </div>
            <div className="ml-6 space-y-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-blue-700">John Doe (Manager)</span>
                <span className="text-gray-500">- sees own + created + team tasks</span>
              </div>
              <div className="ml-10 space-y-1">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-green-600" />
                  <span className="text-green-700">Jane Smith (Member)</span>
                  <span className="text-gray-500">- sees only assigned tasks</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-green-600" />
                  <span className="text-green-700">Bob Johnson (Member)</span>
                  <span className="text-gray-500">- sees only assigned tasks</span>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4">
                <Users className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-blue-700">Sarah Lee (Manager)</span>
                <span className="text-gray-500">- sees own + created + team tasks</span>
              </div>
              <div className="ml-10 space-y-1">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-green-600" />
                  <span className="text-green-700">Mike Chen (Member)</span>
                  <span className="text-gray-500">- sees only assigned tasks</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-300">
            <p className="text-sm text-gray-600">
              <strong>In this example:</strong> John can see Jane and Bob's tasks. Sarah can see Mike's tasks.
              But John cannot see Mike's tasks, and Sarah cannot see Jane or Bob's tasks. Parker sees everything.
            </p>
          </div>
        </div>
      </section>

      {/* Permissions Comparison */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Permissions Comparison</h2>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white shadow-sm rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-gray-100">
                <th className="text-left p-4 font-semibold text-gray-900 border-b border-gray-200">Permission</th>
                <th className="text-center p-4 font-semibold text-gray-900 border-b border-gray-200">
                  <div className="flex flex-col items-center gap-1">
                    <Shield className="w-5 h-5 text-purple-600" />
                    <span>Admin</span>
                  </div>
                </th>
                <th className="text-center p-4 font-semibold text-gray-900 border-b border-gray-200">
                  <div className="flex flex-col items-center gap-1">
                    <Users className="w-5 h-5 text-blue-600" />
                    <span>Manager</span>
                  </div>
                </th>
                <th className="text-center p-4 font-semibold text-gray-900 border-b border-gray-200">
                  <div className="flex flex-col items-center gap-1">
                    <Users className="w-5 h-5 text-green-600" />
                    <span>Member</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="p-4 text-gray-700">View all tasks</td>
                <td className="p-4 text-center"><CheckCircle className="w-5 h-5 text-green-600 mx-auto" /></td>
                <td className="p-4 text-center"><XCircle className="w-5 h-5 text-red-400 mx-auto" /></td>
                <td className="p-4 text-center"><XCircle className="w-5 h-5 text-red-400 mx-auto" /></td>
              </tr>
              <tr className="border-b border-gray-100 bg-gray-50">
                <td className="p-4 text-gray-700">View team tasks</td>
                <td className="p-4 text-center"><CheckCircle className="w-5 h-5 text-green-600 mx-auto" /></td>
                <td className="p-4 text-center"><CheckCircle className="w-5 h-5 text-green-600 mx-auto" /></td>
                <td className="p-4 text-center"><XCircle className="w-5 h-5 text-red-400 mx-auto" /></td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="p-4 text-gray-700">View assigned tasks</td>
                <td className="p-4 text-center"><CheckCircle className="w-5 h-5 text-green-600 mx-auto" /></td>
                <td className="p-4 text-center"><CheckCircle className="w-5 h-5 text-green-600 mx-auto" /></td>
                <td className="p-4 text-center"><CheckCircle className="w-5 h-5 text-green-600 mx-auto" /></td>
              </tr>
              <tr className="border-b border-gray-100 bg-gray-50">
                <td className="p-4 text-gray-700">Create tasks</td>
                <td className="p-4 text-center"><CheckCircle className="w-5 h-5 text-green-600 mx-auto" /></td>
                <td className="p-4 text-center"><CheckCircle className="w-5 h-5 text-green-600 mx-auto" /></td>
                <td className="p-4 text-center"><AlertCircle className="w-5 h-5 text-yellow-500 mx-auto" title="If permission granted" /></td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="p-4 text-gray-700">Edit any task</td>
                <td className="p-4 text-center"><CheckCircle className="w-5 h-5 text-green-600 mx-auto" /></td>
                <td className="p-4 text-center"><XCircle className="w-5 h-5 text-red-400 mx-auto" /></td>
                <td className="p-4 text-center"><XCircle className="w-5 h-5 text-red-400 mx-auto" /></td>
              </tr>
              <tr className="border-b border-gray-100 bg-gray-50">
                <td className="p-4 text-gray-700">Edit team tasks</td>
                <td className="p-4 text-center"><CheckCircle className="w-5 h-5 text-green-600 mx-auto" /></td>
                <td className="p-4 text-center"><CheckCircle className="w-5 h-5 text-green-600 mx-auto" /></td>
                <td className="p-4 text-center"><XCircle className="w-5 h-5 text-red-400 mx-auto" /></td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="p-4 text-gray-700">Update task status</td>
                <td className="p-4 text-center"><CheckCircle className="w-5 h-5 text-green-600 mx-auto" /></td>
                <td className="p-4 text-center"><CheckCircle className="w-5 h-5 text-green-600 mx-auto" /></td>
                <td className="p-4 text-center"><CheckCircle className="w-5 h-5 text-green-600 mx-auto" /></td>
              </tr>
              <tr className="border-b border-gray-100 bg-gray-50">
                <td className="p-4 text-gray-700">Delete any task</td>
                <td className="p-4 text-center"><CheckCircle className="w-5 h-5 text-green-600 mx-auto" /></td>
                <td className="p-4 text-center"><XCircle className="w-5 h-5 text-red-400 mx-auto" /></td>
                <td className="p-4 text-center"><XCircle className="w-5 h-5 text-red-400 mx-auto" /></td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="p-4 text-gray-700">Delete own tasks</td>
                <td className="p-4 text-center"><CheckCircle className="w-5 h-5 text-green-600 mx-auto" /></td>
                <td className="p-4 text-center"><CheckCircle className="w-5 h-5 text-green-600 mx-auto" /></td>
                <td className="p-4 text-center"><XCircle className="w-5 h-5 text-red-400 mx-auto" /></td>
              </tr>
              <tr className="border-b border-gray-100 bg-gray-50">
                <td className="p-4 text-gray-700">Reassign tasks</td>
                <td className="p-4 text-center"><CheckCircle className="w-5 h-5 text-green-600 mx-auto" /></td>
                <td className="p-4 text-center"><CheckCircle className="w-5 h-5 text-green-600 mx-auto" /></td>
                <td className="p-4 text-center"><XCircle className="w-5 h-5 text-red-400 mx-auto" /></td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="p-4 text-gray-700">View costs</td>
                <td className="p-4 text-center"><CheckCircle className="w-5 h-5 text-green-600 mx-auto" /></td>
                <td className="p-4 text-center"><AlertCircle className="w-5 h-5 text-yellow-500 mx-auto" title="If permission granted" /></td>
                <td className="p-4 text-center"><AlertCircle className="w-5 h-5 text-yellow-500 mx-auto" title="If permission granted" /></td>
              </tr>
              <tr className="bg-gray-50">
                <td className="p-4 text-gray-700">Manage team</td>
                <td className="p-4 text-center"><CheckCircle className="w-5 h-5 text-green-600 mx-auto" /></td>
                <td className="p-4 text-center"><AlertCircle className="w-5 h-5 text-yellow-500 mx-auto" title="If permission granted" /></td>
                <td className="p-4 text-center"><XCircle className="w-5 h-5 text-red-400 mx-auto" /></td>
              </tr>
            </tbody>
          </table>

          <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Yes</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-400" />
              <span>No</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-500" />
              <span>Optional (permission required)</span>
            </div>
          </div>
        </div>
      </section>

      {/* Setting Up Hierarchy */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Setting Up the Hierarchy</h2>

        <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-6">
          <h3 className="font-bold text-gray-900 mb-2">For Administrators:</h3>
          <ol className="list-decimal ml-5 space-y-2 text-gray-700">
            <li>Go to <strong>Settings → Team Members</strong></li>
            <li>For each team member, click <strong>Edit</strong></li>
            <li>In the <strong>Manager</strong> dropdown, select who this person reports to</li>
            <li>Click <strong>Save</strong></li>
          </ol>
        </div>

        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6">
          <h3 className="font-bold text-gray-900 mb-2">Important Notes:</h3>
          <ul className="list-disc ml-5 space-y-1 text-gray-700">
            <li>Each member can only have <strong>one manager</strong></li>
            <li>Members who report directly to the owner/admin should have <strong>no manager assigned</strong></li>
            <li>Managers can have their own manager, creating multi-level hierarchies</li>
            <li>Changing a member's manager immediately updates which tasks their new/old manager can see</li>
          </ul>
        </div>
      </section>

      {/* Common Scenarios */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Common Scenarios</h2>

        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="font-bold text-gray-900 mb-2">Scenario: "I'm a manager but I can't see my team's tasks"</h3>
            <p className="text-gray-700 mb-3">
              <strong>Solution:</strong> Check that team members have you set as their manager in Settings → Team Members.
              Only members who report to you will have their tasks visible to you.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="font-bold text-gray-900 mb-2">Scenario: "I'm a member and I can't see a task someone mentioned"</h3>
            <p className="text-gray-700 mb-3">
              <strong>Reason:</strong> As a member, you can only see tasks assigned to you or tasks you created.
              If the task is assigned to someone else, you won't see it unless your manager shares the details with you.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="font-bold text-gray-900 mb-2">Scenario: "We need a task everyone can see"</h3>
            <p className="text-gray-700 mb-3">
              <strong>Solution:</strong> When creating the task, you can set the visibility to "Organization"
              (coming soon feature). For now, consider assigning it to multiple people or posting it in a shared communication channel.
            </p>
          </div>
        </div>
      </section>

      {/* Security Note */}
      <section className="mb-12">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            Security & Privacy
          </h2>
          <p className="text-gray-700 leading-relaxed">
            Task visibility is enforced at the <strong>database level</strong> using Row Level Security (RLS) policies.
            This means that even if someone tries to access data directly through the API, the database will only return
            tasks they have permission to see. Your task data is secure and private based on your role and team structure.
          </p>
        </div>
      </section>

      {/* Next Steps */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Next Steps</h2>
        <div className="space-y-3">
          <a href="/docs/operations/team" className="block bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:shadow-md transition-all">
            <h3 className="font-bold text-gray-900 mb-1">Learn about Team Management →</h3>
            <p className="text-gray-600 text-sm">Add team members, set roles, and configure permissions</p>
          </a>
          <a href="/docs/operations/tasks" className="block bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:shadow-md transition-all">
            <h3 className="font-bold text-gray-900 mb-1">Learn about Task Management →</h3>
            <p className="text-gray-600 text-sm">Create, assign, and track vineyard tasks</p>
          </a>
        </div>
      </section>
      </div>
    </DocsLayout>
  );
}
