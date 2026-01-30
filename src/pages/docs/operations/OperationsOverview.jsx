import { Link } from "react-router-dom";
import DocsLayout from "../DocsLayout";
import { DocsHeader, Section, FeatureGrid, Callout } from "../DocsComponents";
import { Map, Droplet, ListTodo, Users, BarChart3, Cpu } from "lucide-react";

export default function OperationsOverview() {
  const features = [
    {
      icon: <Map className="w-6 h-6 text-emerald-600" />,
      title: "Field Management",
      description: "Map every vineyard field with satellite imagery, track plantings, varietals, and manage field-level data with NDVI zone mapping.",
      link: "/docs/operations/blocks",
    },
    {
      icon: <Droplet className="w-6 h-6 text-blue-600" />,
      title: "Irrigation System",
      description: "Schedule irrigation based on ET calculations, monitor flow rates, and track water usage across all blocks.",
      link: "/docs/operations/irrigation",
    },
    {
      icon: <ListTodo className="w-6 h-6 text-purple-600" />,
      title: "Task Management",
      description: "Create spray schedules, assign field tasks, track compliance requirements, and manage seasonal operations.",
      link: "/docs/operations/tasks",
    },
    {
      icon: <Users className="w-6 h-6 text-orange-600" />,
      title: "Team Management",
      description: "Invite team members, assign role-based permissions, and collaborate on vineyard operations.",
      link: "/docs/operations/team",
    },
    {
      icon: <BarChart3 className="w-6 h-6 text-teal-600" />,
      title: "Analytics Dashboard",
      description: "Visualize brix levels, pH, acidity from field samples. Track performance metrics and generate reports.",
      link: "/docs/operations/analytics",
    },
    {
      icon: <Cpu className="w-6 h-6 text-gray-600" />,
      title: "Hardware Integration",
      description: "Connect soil sensors, weather stations, and flow meters for real-time field monitoring.",
      link: "/docs/operations/hardware",
    },
  ];

  return (
    <DocsLayout>
      <DocsHeader
        title="Vineyard Operations"
        subtitle="Manage blocks, irrigation, tasks, and teams with satellite monitoring and real-time analytics."
      />

      <Callout type="note" title="Beta v1.0">
        Vineyard Operations is ready to use. We're actively improving features based on user feedback.
      </Callout>

      <Section title="Overview">
        <p>
          Once you've planned your vineyard and secured financing, the Operations module helps you manage day-to-day vineyard activities—from planting to harvest and beyond.
        </p>
        <p>
          Track every block with satellite imagery, schedule irrigation based on real ET data, manage spray programs and compliance records, coordinate team tasks, and analyze field samples to optimize quality and yield.
        </p>
        <p>
          Unlike generic farm management software, our tools are built specifically for viticulture—understanding brix curves, veraison timing, canopy management cycles, and the seasonal rhythms of grapegrowing.
        </p>
      </Section>

      <Section title="Key Features">
        <FeatureGrid features={features} />
      </Section>

      <Section title="How It Works">
        <div className="space-y-6">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-vine-green-100 text-vine-green-700 rounded-full flex items-center justify-center font-bold text-sm">
              1
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Map Your Vineyard</h4>
              <p className="text-sm text-gray-600">
                Import your vineyard plan from the Vineyard Planner or create blocks from scratch. Draw boundaries on satellite imagery, assign varietals, and track planting details for each block.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-vine-green-100 text-vine-green-700 rounded-full flex items-center justify-center font-bold text-sm">
              2
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Schedule Operations</h4>
              <p className="text-sm text-gray-600">
                Create spray programs, irrigation schedules, and cultural operation tasks. Assign to team members with due dates and compliance tracking.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-vine-green-100 text-vine-green-700 rounded-full flex items-center justify-center font-bold text-sm">
              3
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Monitor in Real-Time</h4>
              <p className="text-sm text-gray-600">
                Connect soil sensors and weather stations for live field data. Use NDVI satellite imagery to identify stress zones and optimize irrigation.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-vine-green-100 text-vine-green-700 rounded-full flex items-center justify-center font-bold text-sm">
              4
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Analyze Performance</h4>
              <p className="text-sm text-gray-600">
                Log field samples (brix, pH, acidity), track yield by block, and generate reports for harvest planning and quality decisions.
              </p>
            </div>
          </div>
        </div>
      </Section>

      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-8 border border-emerald-100 my-12">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
            <Map className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Seamless Transition from Planning to Operations</h3>
            <p className="text-gray-700 mb-4 leading-relaxed">
              Your vineyard design from the Vineyard Planner automatically flows into Operations—blocks, acreage, varietals, and infrastructure are ready to go on Day 1.
            </p>
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
            >
              Get Early Access →
            </Link>
          </div>
        </div>
      </div>
    </DocsLayout>
  );
}
