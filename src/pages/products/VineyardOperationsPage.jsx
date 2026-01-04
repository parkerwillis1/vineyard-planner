import { Link } from "react-router-dom";
import {
  BarChart3,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Target,
  Zap,
  Clock,
  Shield,
  MapPin,
  Satellite,
  Calendar,
  LayoutGrid,
  Users
} from "lucide-react";
import { useAuth } from "@/auth/AuthContext";

export default function VineyardOperationsPage() {
  const { user } = useAuth();

  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1a2844] via-[#141d30] to-[#0f1621]">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>

        <div className="relative mx-auto max-w-7xl px-6 py-24 sm:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 mb-6">
              <Sparkles className="w-4 h-4 text-white" />
              <span className="text-sm font-semibold text-white">
                Vineyard Operations Management
              </span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
              Streamline your vineyard operations
            </h1>
            <p className="mt-6 text-xl leading-8 text-white/90">
              Manage blocks, track tasks, monitor spray programs, and optimize your vineyard operations from one central platform.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                to={user ? "/pricing?startTrial=true" : "/signup?redirect=/pricing&startTrial=true"}
                className="group inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-bold text-[#141d30] shadow-xl hover:bg-gray-50 transition-all hover:scale-105"
              >
                {user ? "Start 2-Week Free Trial" : "Start 2-Week Free Trial"}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="#features"
                className="text-base font-semibold leading-7 text-white hover:text-white/80 transition-colors"
              >
                See features below <span aria-hidden="true">↓</span>
              </a>
            </div>

            {/* Quick stats */}
            <div className="mt-16 grid grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold text-white">Real-time</div>
                <div className="text-sm text-white/80 mt-1">Block monitoring</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white">Unlimited</div>
                <div className="text-sm text-white/80 mt-1">Task tracking</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white">360°</div>
                <div className="text-sm text-white/80 mt-1">Vineyard insights</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
            <BenefitCard
              icon={Target}
              iconColor="navy"
              title="Vineyard-Specific"
              description="Built exclusively for grape growers, not general agriculture. Tools designed for vineyard workflows."
            />
            <BenefitCard
              icon={Zap}
              iconColor="navy"
              title="Mobile-First"
              description="Access block maps, spray logs, and task lists from your phone while working in the vineyard."
            />
            <BenefitCard
              icon={Clock}
              iconColor="navy"
              title="Real-Time Sync"
              description="Your entire team sees updates instantly. No more phone calls or text message coordination."
            />
            <BenefitCard
              icon={Shield}
              iconColor="navy"
              title="Cloud Backup"
              description="Never lose critical vineyard records to weather, fire, or hardware failure. Always accessible."
            />
          </div>
        </div>
      </section>

      {/* Main Features Section */}
      <section id="features" className="bg-gradient-to-b from-gray-50 to-white py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Comprehensive vineyard operations management
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Track activities, monitor health, and optimize your vineyard performance
            </p>
          </div>

          <div className="space-y-24">
            {/* Feature 1: Satellite Monitoring */}
            <FeatureShowcase
              reverse={false}
              icon={Satellite}
              iconColor="navy"
              eyebrow="Satellite Monitoring"
              title="Track vegetation health from space"
              description="Monitor your vineyard's performance with satellite-based NDVI vegetation tracking and evapotranspiration (ET) data. Identify stress early and optimize irrigation with real satellite data updated every 5 days."
              features={[
                "NDVI vegetation vigor tracking (10m resolution)",
                "Daily ET evapotranspiration measurements",
                "Historical trends and comparisons",
                "Early stress detection before visible symptoms",
                "Monthly progression throughout growing season",
                "Field-by-field performance analysis"
              ]}
              demoComponent={<NDVIDemo />}
              ctaText="Explore Satellite Features"
              ctaLink={user ? "/vineyard" : "/signup"}
            />

            {/* Feature 2: Field Mapping */}
            <FeatureShowcase
              reverse={true}
              icon={MapPin}
              iconColor="navy"
              eyebrow="Field Mapping"
              title="Map and monitor all your fields"
              description="Draw custom field boundaries on satellite maps, track field metrics, and monitor performance across your entire vineyard. Visualize your operation with interactive maps and data overlays."
              features={[
                "Draw custom field boundaries on maps",
                "Track acres, varietals, and planting dates",
                "View satellite imagery and terrain",
                "Monitor field-specific metrics",
                "Compare performance across fields",
                "Historical data and analytics"
              ]}
              demoComponent={<VineyardLayoutDemo />}
              ctaText="Start Mapping Fields"
              ctaLink={user ? "/vineyard" : "/signup"}
            />

            {/* Feature 3: Task & Team Management */}
            <FeatureShowcase
              reverse={false}
              icon={Calendar}
              iconColor="navy"
              title="Organize work and manage your team"
              description="Assign tasks to team members, track completion status, and manage daily operations across your vineyard. Keep everyone coordinated with calendar views and progress tracking."
              eyebrow="Operations Management"
              features={[
                "Assign tasks to crew members",
                "Track task status and completion",
                "Calendar view of all activities",
                "Labor hour tracking by field",
                "Irrigation and spray logging",
                "Harvest quality documentation"
              ]}
              demoComponent={<TaskManagementDemo />}
              ctaText="Manage Operations"
              ctaLink={user ? "/vineyard" : "/signup"}
            />

            {/* Feature 4: Analytics Dashboard */}
            <FeatureShowcase
              reverse={true}
              icon={BarChart3}
              iconColor="navy"
              eyebrow="Analytics & Insights"
              title="Make data-driven decisions"
              description="Comprehensive analytics dashboard with vegetation vigor trends, water usage analysis, yield tracking, and field performance comparisons. Turn your data into actionable insights."
              features={[
                "Vegetation vigor trends over time",
                "Water usage and ET analysis",
                "Yield production by field",
                "Grape quality metrics (Brix, pH, acidity)",
                "Field performance comparisons",
                "Cost analysis and tracking"
              ]}
              demoComponent={<AnalyticsDemo />}
              ctaText="View Analytics Features"
              ctaLink={user ? "/vineyard" : "/signup"}
            />
          </div>
        </div>
      </section>

      {/* How It Compares Section */}
      <section className="bg-gradient-to-br from-teal-50 to-vine-green-50 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Why growers choose us over legacy farm software
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Modern vineyard management without the complexity
            </p>
          </div>

          <div className="mx-auto max-w-5xl">
            <div className="overflow-hidden rounded-2xl bg-white shadow-xl">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="py-4 px-6 text-left text-sm font-bold text-gray-900">Feature</th>
                    <th className="py-4 px-6 text-center text-sm font-bold text-[#141d30]">
                      Trellis Operations
                    </th>
                    <th className="py-4 px-6 text-center text-sm font-bold text-gray-500">
                      Legacy Software
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <ComparisonRow
                    feature="Pricing"
                    us="$29-79/month"
                    them="$200-500+/month"
                  />
                  <ComparisonRow
                    feature="Setup time"
                    us="Same day"
                    them="Weeks of training"
                  />
                  <ComparisonRow
                    feature="User interface"
                    us="Modern & intuitive"
                    them="Complex & outdated"
                  />
                  <ComparisonRow
                    feature="Mobile experience"
                    us="Mobile-first design"
                    them="Desktop-only or clunky mobile"
                  />
                  <ComparisonRow
                    feature="Feature bloat"
                    us="Vineyard-focused tools"
                    them="One-size-fits-all agriculture"
                  />
                  <ComparisonRow
                    feature="Updates & features"
                    us="Frequent improvements"
                    them="Slow development cycles"
                  />
                  <ComparisonRow
                    feature="Customer support"
                    us="Direct founder access"
                    them="Ticket system delays"
                  />
                  <ComparisonRow
                    feature="Contract terms"
                    us="Cancel anytime"
                    them="Annual contracts"
                  />
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative bg-gradient-to-r from-vine-green-600 to-teal-600 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>

        <div className="relative mx-auto max-w-7xl px-6 py-24 sm:py-32">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to start planning your vineyard?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-teal-50">
              Join vineyard owners who are making smarter, data-driven decisions with professional planning tools.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                to={user ? "/vineyard" : "/signup"}
                className="group inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-bold text-teal-700 shadow-xl hover:bg-teal-50 transition-all hover:scale-105"
              >
                {user ? "Go to Operations" : "Get Started Free"}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/pricing"
                className="text-base font-semibold leading-7 text-white hover:text-teal-100 transition-colors"
              >
                View pricing <span aria-hidden="true">→</span>
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="mt-12 flex items-center justify-center gap-8 text-teal-100">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-sm">Free to start</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-sm">No credit card</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-sm">Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// Component for benefit cards
function BenefitCard({ icon: Icon, iconColor, title, description }) {
  const iconColorClasses = {
    'navy': 'bg-gradient-to-br from-[#1a2844] to-[#141d30]'
  };

  return (
    <div className="text-center">
      <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl ${iconColorClasses[iconColor]} mb-4`}>
        <Icon className="w-7 h-7 text-white" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
}

// Component for feature showcases
function FeatureShowcase({ reverse, icon: Icon, iconColor, eyebrow, title, description, features, demoComponent, ctaText, ctaLink }) {
  const iconColorClasses = {
    'navy': 'bg-gradient-to-br from-[#1a2844] to-[#141d30]'
  };

  return (
    <div className={`grid grid-cols-1 gap-12 lg:grid-cols-2 items-center ${reverse ? 'lg:flex-row-reverse' : ''}`}>
      <div className={reverse ? 'lg:order-2' : ''}>
        {Icon && (
          <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${iconColorClasses[iconColor]} mb-6`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        )}
        <div className="inline-block rounded-full px-3 py-1 text-xs font-semibold mb-4 ml-3 bg-[#d1d7e1] text-[#141d30]">
          {eyebrow}
        </div>
        <h3 className="text-3xl font-bold tracking-tight text-gray-900 mb-4">
          {title}
        </h3>
        <p className="text-lg text-gray-600 mb-6 leading-relaxed">
          {description}
        </p>
        <ul className="space-y-3 mb-8">
          {features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0 text-[#141d30]" />
              <span className="text-gray-700">{feature}</span>
            </li>
          ))}
        </ul>
        <Link
          to={ctaLink}
          className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white shadow-md hover:shadow-lg transition-all hover:scale-105 bg-gradient-to-r from-[#1a2844] to-[#141d30]"
        >
          {ctaText}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      <div className={reverse ? 'lg:order-1' : ''}>
        {demoComponent}
      </div>
    </div>
  );
}

// Demo components
function NDVIDemo() {
  return (
    <div className="rounded-2xl bg-white p-8 shadow-xl border-2 border-gray-200">
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
          <div>
            <span className="text-sm font-semibold text-gray-900">Vegetation Vigor Trends</span>
            <div className="text-xs text-gray-600 mt-1">Powered by Sentinel-2 Satellites</div>
          </div>
          <Satellite className="w-5 h-5 text-[#141d30]" />
        </div>

        {/* NDVI Example Image */}
        <div className="rounded-lg overflow-hidden border-2 border-blue-200">
          <img
            src="/NDVI_Example.png"
            alt="NDVI Vegetation Health Monitoring"
            className="w-full h-auto"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <div className="text-xs text-blue-700 mb-1">Resolution</div>
            <div className="font-semibold text-gray-900">10m / 5 days</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <div className="text-xs text-blue-700 mb-1">Data Source</div>
            <div className="font-semibold text-gray-900">Sentinel-2</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <div className="text-xs text-blue-700 mb-1">ET Data</div>
            <div className="font-semibold text-gray-900">Daily</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <div className="text-xs text-blue-700 mb-1">Coverage</div>
            <div className="font-semibold text-gray-900">All Fields</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function VineyardLayoutDemo() {
  return (
    <div className="rounded-2xl bg-white p-8 shadow-xl border-2 border-gray-200">
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
          <span className="text-sm font-semibold text-gray-900">Vineyard Configuration</span>
          <LayoutGrid className="w-5 h-5 text-[#141d30]" />
        </div>

        {/* Satellite view with actual field mapping */}
        <div className="relative bg-white rounded-lg overflow-hidden border-2 border-blue-200 shadow-lg">
          <img
            src="/Field_Map_1.png"
            alt="Vineyard field mapping with satellite imagery"
            className="w-full h-auto"
          />
        </div>

        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Plot Size</span>
            <span className="font-semibold text-gray-900">10 acres</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Vine Spacing</span>
            <span className="font-semibold text-gray-900">6' × 10'</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Total Vines</span>
            <span className="font-semibold text-blue-700">7,260</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Row Orientation</span>
            <span className="font-semibold text-gray-900">North-South</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function TaskManagementDemo() {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-gray-50 to-white p-8 shadow-xl border-2 border-gray-200">
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
          <span className="text-sm font-semibold text-gray-900">Active Tasks</span>
          <Calendar className="w-5 h-5 text-[#141d30]" />
        </div>

        <div className="space-y-3">
          <div className="bg-vine-green-50 border-l-4 border-vine-green-500 rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="font-semibold text-gray-900">Spray Vineyard Block A</div>
              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-semibold">In Progress</span>
            </div>
            <div className="text-sm text-gray-600 mb-2">Apply fungicide to prevent powdery mildew</div>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                Assigned to: John D.
              </span>
              <span>Due: Today</span>
            </div>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="font-semibold text-gray-900">Irrigation - Block C</div>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-semibold">Scheduled</span>
            </div>
            <div className="text-sm text-gray-600 mb-2">Run irrigation for 4 hours based on ET data</div>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                Assigned to: Sarah M.
              </span>
              <span>Due: Tomorrow</span>
            </div>
          </div>

          <div className="bg-gray-50 border-l-4 border-gray-300 rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="font-semibold text-gray-900">Harvest Quality Check</div>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">Done</span>
            </div>
            <div className="text-sm text-gray-600 mb-2">Sample Brix levels across all blocks</div>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>Completed: Yesterday</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AnalyticsDemo() {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-gray-50 to-white p-8 shadow-xl border-2 border-gray-200">
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
          <span className="text-sm font-semibold text-gray-900">Vineyard Analytics Dashboard</span>
          <BarChart3 className="w-5 h-5 text-[#141d30]" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
            <div className="text-xs font-semibold text-green-700 mb-1">Avg NDVI</div>
            <div className="text-2xl font-bold text-gray-900">0.68</div>
            <div className="text-xs text-green-600 mt-1">↑ +0.08 from last month</div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-4 border border-blue-200">
            <div className="text-xs font-semibold text-blue-700 mb-1">Water Usage</div>
            <div className="text-2xl font-bold text-gray-900">42,500</div>
            <div className="text-xs text-blue-600 mt-1">gallons this week</div>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-4 border border-amber-200">
            <div className="text-xs font-semibold text-amber-700 mb-1">Est. Yield</div>
            <div className="text-2xl font-bold text-gray-900">4.2</div>
            <div className="text-xs text-amber-600 mt-1">tons per acre</div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
            <div className="text-xs font-semibold text-purple-700 mb-1">Avg Brix</div>
            <div className="text-2xl font-bold text-gray-900">24.2°</div>
            <div className="text-xs text-purple-600 mt-1">across all blocks</div>
          </div>
        </div>

        <div className="pt-2">
          <div className="text-xs font-semibold text-gray-700 mb-3">Field Performance Comparison</div>
          <div className="space-y-2">
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-600">Block A</span>
                <span className="font-semibold text-gray-900">NDVI: 0.72</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full" style={{ width: '90%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-600">Block B</span>
                <span className="font-semibold text-gray-900">NDVI: 0.65</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-gradient-to-r from-yellow-500 to-amber-500 h-2 rounded-full" style={{ width: '75%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-600">Block C</span>
                <span className="font-semibold text-gray-900">NDVI: 0.68</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-gradient-to-r from-teal-500 to-cyan-500 h-2 rounded-full" style={{ width: '82%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Comparison table row
function ComparisonRow({ feature, us, them }) {
  return (
    <tr className="hover:bg-gray-50">
      <td className="py-4 px-6 text-sm text-gray-700">{feature}</td>
      <td className="py-4 px-6 text-center">
        {typeof us === 'boolean' ? (
          us ? (
            <CheckCircle2 className="w-5 h-5 text-teal-600 mx-auto" />
          ) : (
            <span className="text-gray-400">—</span>
          )
        ) : (
          <span className="text-sm font-semibold text-teal-700">{us}</span>
        )}
      </td>
      <td className="py-4 px-6 text-center">
        {typeof them === 'boolean' ? (
          them ? (
            <CheckCircle2 className="w-5 h-5 text-gray-400 mx-auto" />
          ) : (
            <span className="text-gray-400">—</span>
          )
        ) : (
          <span className="text-sm text-gray-500">{them}</span>
        )}
      </td>
    </tr>
  );
}
