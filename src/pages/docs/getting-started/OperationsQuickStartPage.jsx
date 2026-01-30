import DocsLayout from "../DocsLayout";
import { DocsHeader, Section, Callout, Steps, NextSteps } from "../DocsComponents";
import { Grape, MapPin, ListChecks, Users, Cloud, Droplets } from "lucide-react";

export default function OperationsQuickStartPage() {
  const steps = [
    {
      title: "Add Your First Field",
      description: "Go to Field Management and click 'Add Field'. Enter the field name, variety (e.g., Cabernet Sauvignon), acreage, and planting date. Add GPS coordinates or draw the field on the map for satellite imagery features.",
    },
    {
      title: "Set Up Your Team",
      description: "Navigate to Team Management and invite team members by email. Assign roles (Admin, Manager, Member) to control what each person can see and do. Managers can oversee their direct reports' tasks.",
    },
    {
      title: "Create Your First Task",
      description: "Go to Task Management and click 'New Task'. Enter a title (e.g., 'Spray Block A'), select the block, set priority and due date, and assign to a team member. They'll receive a notification.",
    },
    {
      title: "Configure Weather Integration",
      description: "In Weather Dashboard, enter your vineyard's coordinates or select a nearby weather station. You'll see current conditions, 7-day forecast, Growing Degree Days (GDD), and spray condition alerts.",
    },
    {
      title: "Set Up Irrigation Tracking",
      description: "In Irrigation Management, connect OpenET for satellite-based evapotranspiration data (optional). Record irrigation events by selecting the block, entering duration and flow rate. View water balance recommendations.",
    },
    {
      title: "Log Your First Spray Record",
      description: "Go to Spray Records and click 'Add Application'. Select the block, chemical used, rate, and conditions. The system tracks PHI/REI intervals and generates compliance reports.",
    },
    {
      title: "Explore the Dashboard",
      description: "Return to the Dashboard to see your operation at a glance: upcoming tasks, weather alerts, active team members, and quick access to all features.",
    },
  ];

  return (
    <DocsLayout>
      <DocsHeader
        title="Vineyard Operations Quick Start"
        subtitle="Get your vineyard management system up and running in minutes."
      />

      <Callout type="tip" title="What You'll Accomplish">
        By the end of this guide, you'll have your first block mapped, team invited, tasks assigned,
        and be tracking weather and irrigation data for your vineyard.
      </Callout>

      <Section title="Getting Started">
        <p>
          Vineyard Operations is your central hub for managing day-to-day vineyard activities.
          Track blocks, assign tasks, monitor weather, log spray applications, and coordinate your team—all in one place.
        </p>
        <p>
          This quick start guide walks you through the essential setup steps to get your vineyard
          digitized and your team collaborating effectively.
        </p>
      </Section>

      <Section title="Step-by-Step Setup">
        <Steps steps={steps} />
      </Section>

      <Section title="Key Features">
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-emerald-600" />
              </div>
              <h4 className="font-semibold text-gray-900">Block Mapping</h4>
            </div>
            <p className="text-sm text-gray-600">
              Map every block with variety, clone, rootstock, and planting info. View NDVI satellite imagery for precision management.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <ListChecks className="w-5 h-5 text-blue-600" />
              </div>
              <h4 className="font-semibold text-gray-900">Task Management</h4>
            </div>
            <p className="text-sm text-gray-600">
              Create, assign, and track tasks with priorities, due dates, and automatic notifications for your team.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Cloud className="w-5 h-5 text-amber-600" />
              </div>
              <h4 className="font-semibold text-gray-900">Weather Integration</h4>
            </div>
            <p className="text-sm text-gray-600">
              Real-time conditions, GDD tracking, spray window alerts, and frost warnings for better timing decisions.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
                <Droplets className="w-5 h-5 text-cyan-600" />
              </div>
              <h4 className="font-semibold text-gray-900">Irrigation Tracking</h4>
            </div>
            <p className="text-sm text-gray-600">
              Log irrigation events, track ET data from satellites, and get water balance recommendations.
            </p>
          </div>
        </div>
      </Section>

      <Callout type="note" title="Need Hardware Integration?">
        Connect weather stations, soil sensors, and other IoT devices for real-time data.
        See the Hardware Integration documentation for setup instructions.
      </Callout>

      <NextSteps
        links={[
          {
            title: "Field Management",
            description: "Learn how to create and manage vineyard fields with all their attributes",
            href: "/docs/operations/blocks",
          },
          {
            title: "Task Management",
            description: "Master task creation, assignment, and team coordination",
            href: "/docs/operations/tasks",
          },
          {
            title: "Spray Records",
            description: "Track chemical applications for compliance and analysis",
            href: "/docs/operations/spray",
          },
          {
            title: "Hardware Integration",
            description: "Connect sensors and IoT devices for real-time monitoring",
            href: "/docs/operations/hardware",
          },
        ]}
      />
    </DocsLayout>
  );
}
