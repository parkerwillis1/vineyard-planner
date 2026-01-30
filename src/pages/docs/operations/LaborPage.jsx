import React from 'react';
import { Users, CheckCircle2 } from 'lucide-react';
import { DocsHeader, Section, Subsection, Callout, Table } from '../DocsComponents';
import DocsLayout from '../DocsLayout';

export default function LaborPage() {
  return (
    <DocsLayout>
    <div className="max-w-4xl">
      <DocsHeader
        title="Labor Tracking"
        subtitle="Track hours, costs, and productivity"
      />

      <Section title="Overview">
        <p className="text-gray-700 leading-relaxed mb-4">
          The Labor Tracking module helps you record work hours, calculate labor costs, analyze
          productivity, and generate payroll reports. Track your team's time by task, block, or
          activity type to understand where labor is spent and optimize operations.
        </p>
      </Section>

      <Section title="Time Entry Methods">
        <p className="text-gray-700 leading-relaxed mb-4">
          Record labor hours in several ways:
        </p>

        <Subsection title="Task-Based Entry">
          <p className="text-gray-700 leading-relaxed mb-4">
            Link time to specific tasks:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
            <li>When completing a task, log hours worked</li>
            <li>Assign hours to specific team members</li>
            <li>Time automatically categorizes by task type</li>
          </ul>
        </Subsection>

        <Subsection title="Direct Time Entry">
          <p className="text-gray-700 leading-relaxed mb-4">
            Enter time without a linked task:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
            <li>Select worker and date</li>
            <li>Enter hours (or start/end times)</li>
            <li>Choose activity category</li>
            <li>Optionally assign to a block</li>
          </ul>
        </Subsection>

        <Subsection title="Crew Time Entry">
          <p className="text-gray-700 leading-relaxed mb-4">
            Record time for multiple workers at once:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
            <li>Select a crew or multiple workers</li>
            <li>Enter shared hours and activity</li>
            <li>System creates individual entries for each worker</li>
          </ul>
        </Subsection>
      </Section>

      <Section title="Activity Categories">
        <Table
          headers={['Category', 'Examples']}
          rows={[
            ['Pruning', 'Dormant pruning, summer pruning, suckering'],
            ['Canopy Management', 'Shoot thinning, leaf pulling, hedging'],
            ['Pest/Disease', 'Spraying, scouting, trap monitoring'],
            ['Irrigation', 'System checks, repairs, scheduling'],
            ['Harvest', 'Picking, hauling, sorting'],
            ['General Farm', 'Mowing, weed control, fence repair'],
            ['Equipment', 'Maintenance, repairs, operation'],
            ['Administrative', 'Meetings, training, planning'],
          ]}
        />
      </Section>

      <Section title="Pay Rates">
        <p className="text-gray-700 leading-relaxed mb-4">
          Configure pay rates for accurate cost tracking:
        </p>
        <Table
          headers={['Rate Type', 'Description']}
          rows={[
            ['Standard Hourly', 'Base hourly rate for regular work'],
            ['Overtime', 'Rate for hours over 8/day or 40/week'],
            ['Piece Rate', 'Per-unit rate (e.g., per vine pruned)'],
            ['Premium', 'Higher rate for skilled tasks or conditions'],
            ['Flat Rate', 'Fixed payment regardless of hours'],
          ]}
        />
        <Callout type="note" title="Worker Pay Rates">
          Set default pay rates on each team member's profile. You can override rates for
          specific time entries when needed.
        </Callout>
      </Section>

      <Section title="Labor Reports">
        <p className="text-gray-700 leading-relaxed mb-4">
          Generate detailed labor reports:
        </p>

        <Subsection title="Payroll Report">
          <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
            <li>Total hours by worker for a pay period</li>
            <li>Regular vs. overtime breakdown</li>
            <li>Gross pay calculations</li>
            <li>Export to CSV for payroll software</li>
          </ul>
        </Subsection>

        <Subsection title="Cost by Block">
          <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
            <li>Labor hours and cost for each vineyard block</li>
            <li>Cost per acre comparison</li>
            <li>Activity breakdown by block</li>
          </ul>
        </Subsection>

        <Subsection title="Activity Analysis">
          <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
            <li>Total hours by activity category</li>
            <li>Cost distribution across activities</li>
            <li>Year-over-year comparison</li>
          </ul>
        </Subsection>

        <Subsection title="Productivity Metrics">
          <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
            <li>Vines pruned per hour by worker</li>
            <li>Acres completed per labor hour</li>
            <li>Harvest rate (tons picked per crew hour)</li>
          </ul>
        </Subsection>
      </Section>

      <Section title="Cost Analysis">
        <p className="text-gray-700 leading-relaxed mb-4">
          Understand your labor costs:
        </p>
        <Table
          headers={['Metric', 'Calculation', 'Use']}
          rows={[
            ['Cost per Acre', 'Total labor ÷ acres managed', 'Budgeting, benchmarking'],
            ['Cost per Ton', 'Harvest labor ÷ tons produced', 'Yield efficiency'],
            ['Labor % of Revenue', 'Labor cost ÷ grape revenue', 'Profitability analysis'],
            ['Hours per Acre', 'Total hours ÷ acres', 'Staffing planning'],
          ]}
        />
        <Callout type="tip" title="Compare to Budget">
          Link your actual labor costs to your Financial Planner projections to see how
          reality compares to your original assumptions.
        </Callout>
      </Section>

      <Section title="Seasonal Planning">
        <p className="text-gray-700 leading-relaxed mb-4">
          Use historical data to plan staffing:
        </p>
        <Table
          headers={['Season', 'Key Activities', 'Typical Labor Need']}
          rows={[
            ['Winter (Dec-Feb)', 'Dormant pruning', 'High - 80-100 hrs/acre'],
            ['Spring (Mar-May)', 'Shoot thinning, suckering', 'Moderate - 20-40 hrs/acre'],
            ['Summer (Jun-Aug)', 'Canopy, spray, irrigation', 'Low-Moderate - 10-20 hrs/acre'],
            ['Fall (Sep-Nov)', 'Harvest, post-harvest', 'High - varies by yield'],
          ]}
        />
      </Section>

      <Section title="Best Practices">
        <ul className="space-y-3 text-gray-700">
          <li className="flex items-start gap-3">
            <span className="text-emerald-600 font-bold mt-1">•</span>
            <span><strong>Daily Logging:</strong> Enter time at the end of each day for accuracy</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-emerald-600 font-bold mt-1">•</span>
            <span><strong>Link to Tasks:</strong> Associate time with tasks for better reporting</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-emerald-600 font-bold mt-1">•</span>
            <span><strong>Track by Block:</strong> Assign work to specific blocks to analyze cost per acre</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-emerald-600 font-bold mt-1">•</span>
            <span><strong>Review Weekly:</strong> Check entries weekly to catch errors before payroll</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-emerald-600 font-bold mt-1">•</span>
            <span><strong>Analyze Trends:</strong> Compare labor costs year-over-year to identify efficiencies</span>
          </li>
        </ul>
      </Section>

      <Section title="Related Documentation">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <a href="/docs/operations/team" className="block p-4 bg-white border border-gray-200 rounded-lg hover:border-emerald-300 hover:shadow-md transition-all">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-emerald-600" />
              <h4 className="font-semibold text-gray-900">Team Management</h4>
            </div>
            <p className="text-sm text-gray-600">Set up workers and pay rates</p>
          </a>
          <a href="/docs/operations/tasks" className="block p-4 bg-white border border-gray-200 rounded-lg hover:border-emerald-300 hover:shadow-md transition-all">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <h4 className="font-semibold text-gray-900">Task Management</h4>
            </div>
            <p className="text-sm text-gray-600">Link labor to tasks</p>
          </a>
        </div>
      </Section>
    </div>
    </DocsLayout>
  );
}
