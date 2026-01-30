import React from 'react';
import { TrendingUp, Calendar, Droplet, Clock, Target } from 'lucide-react';
import { DocsHeader, Section, Subsection, Callout, Table } from '../DocsComponents';
import DocsLayout from '../DocsLayout';

export default function DashboardPage() {
  return (
    <DocsLayout>
    <div className="max-w-4xl">
      <DocsHeader
        title="Dashboard"
        subtitle="Vineyard overview and key metrics at a glance"
      />

      <Section title="Overview">
        <p className="text-gray-700 leading-relaxed mb-4">
          The Dashboard provides a high-level overview of your vineyard operations. See key metrics,
          upcoming tasks, recent activity, weather conditions, and alerts all in one place to help you
          stay on top of daily management decisions.
        </p>
      </Section>

      <Section title="Summary Cards">
        <p className="text-gray-700 leading-relaxed mb-4">
          The top of the dashboard displays summary metrics:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-emerald-600" />
              <h4 className="font-semibold text-gray-900">Total Acres</h4>
            </div>
            <p className="text-sm text-gray-600">Combined acreage of all your vineyard blocks.</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <h4 className="font-semibold text-gray-900">Active Tasks</h4>
            </div>
            <p className="text-sm text-gray-600">Number of tasks currently in progress or pending.</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Droplet className="w-5 h-5 text-emerald-600" />
              <h4 className="font-semibold text-gray-900">Irrigation Status</h4>
            </div>
            <p className="text-sm text-gray-600">Current water deficit and next scheduled irrigation.</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-emerald-600" />
              <h4 className="font-semibold text-gray-900">Upcoming Events</h4>
            </div>
            <p className="text-sm text-gray-600">Tasks and events scheduled for the next 7 days.</p>
          </div>
        </div>
      </Section>

      <Section title="Recent Activity">
        <p className="text-gray-700 leading-relaxed mb-4">
          The activity feed shows recent actions across your vineyard:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
          <li>Completed tasks with timestamps and assigned users</li>
          <li>Spray applications and irrigation events</li>
          <li>Field sample entries and harvest records</li>
          <li>Equipment maintenance and team member activity</li>
        </ul>
      </Section>

      <Section title="Weather Widget">
        <p className="text-gray-700 leading-relaxed mb-4">
          The dashboard includes a weather summary showing:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
          <li>Current temperature and conditions</li>
          <li>7-day forecast preview</li>
          <li>Rainfall totals for the week</li>
          <li>Frost and heat alerts when applicable</li>
        </ul>
        <Callout type="tip" title="Weather Details">
          Click the weather widget to access the full{' '}
          <a href="/docs/operations/weather" className="text-emerald-600 hover:text-emerald-700 font-medium">
            Weather Dashboard
          </a>{' '}
          with hourly forecasts, GDD accumulation, and spray condition planning.
        </Callout>
      </Section>

      <Section title="Alerts & Notifications">
        <p className="text-gray-700 leading-relaxed mb-4">
          The dashboard highlights items needing attention:
        </p>
        <Table
          headers={['Alert Type', 'Description']}
          rows={[
            ['Overdue Tasks', 'Tasks past their due date'],
            ['Irrigation Needed', 'Blocks with high water deficit'],
            ['Spray Intervals', 'Upcoming spray re-application dates'],
            ['Weather Warnings', 'Frost, heat, or wind advisories'],
            ['Equipment Service', 'Maintenance reminders'],
          ]}
        />
      </Section>

      <Section title="Quick Actions">
        <p className="text-gray-700 leading-relaxed mb-4">
          Common tasks are available directly from the dashboard:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
          <li><strong>Add Task:</strong> Create a new task quickly</li>
          <li><strong>Log Irrigation:</strong> Record a completed irrigation event</li>
          <li><strong>Add Spray Record:</strong> Log a chemical application</li>
          <li><strong>View Calendar:</strong> Jump to the full calendar view</li>
        </ul>
      </Section>

      <Section title="Related Documentation">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <a href="/docs/operations/tasks" className="block p-4 bg-white border border-gray-200 rounded-lg hover:border-emerald-300 hover:shadow-md transition-all">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-emerald-600" />
              <h4 className="font-semibold text-gray-900">Task Management</h4>
            </div>
            <p className="text-sm text-gray-600">Create and track vineyard tasks</p>
          </a>
          <a href="/docs/operations/calendar" className="block p-4 bg-white border border-gray-200 rounded-lg hover:border-emerald-300 hover:shadow-md transition-all">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-5 h-5 text-emerald-600" />
              <h4 className="font-semibold text-gray-900">Calendar View</h4>
            </div>
            <p className="text-sm text-gray-600">See all events on the calendar</p>
          </a>
        </div>
      </Section>
    </div>
    </DocsLayout>
  );
}
