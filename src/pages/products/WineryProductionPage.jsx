import { Link } from "react-router-dom";
import {
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Target,
  Zap,
  Clock,
  Shield,
  Grape,
  Thermometer,
  Droplets,
  Wine,
  Barrel,
  FileText,
  ClipboardList,
  Activity,
  FlaskConical,
  Wifi
} from "lucide-react";
import { useAuth } from "@/auth/AuthContext";

export default function WineryProductionPage() {
  const { user } = useAuth();

  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#9d2f52] via-[#81243f] to-[#651d32]">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>

        <div className="relative mx-auto max-w-7xl px-6 py-24 sm:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 mb-6">
              <Sparkles className="w-4 h-4 text-white" />
              <span className="text-sm font-semibold text-white">
                Wine Production Management
              </span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
              Professional winery production tracking
            </h1>
            <p className="mt-6 text-xl leading-8 text-white/90">
              Track harvest, manage fermentation, create blends, monitor with IoT sensors, and stay compliant with automatic TTB reporting.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                to={user ? "/pricing?startTrial=true" : "/signup?redirect=/pricing&startTrial=true"}
                className="group inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-bold text-[#81243f] shadow-xl hover:bg-gray-50 transition-all hover:scale-105"
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
            <div className="mt-16 grid grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold text-white">Full</div>
                <div className="text-sm text-white/80 mt-1">Cellar visibility</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white">Smart</div>
                <div className="text-sm text-white/80 mt-1">Blend calculator</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white">TTB</div>
                <div className="text-sm text-white/80 mt-1">Compliance built-in</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white">IoT</div>
                <div className="text-sm text-white/80 mt-1">Sensor monitoring</div>
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
              iconColor="burgundy"
              title="Small Winery Focus"
              description="Built for boutique producers making 1-5K cases. Not bloated enterprise software you'll never fully use."
            />
            <BenefitCard
              icon={Zap}
              iconColor="burgundy"
              title="Start Today"
              description="No consultants, no training sessions. Intuitive interface means you can start tracking lots immediately."
            />
            <BenefitCard
              icon={Clock}
              iconColor="burgundy"
              title="Cellar Mobility"
              description="QR code barrel labels let you access lot details, chemistry, and history from your phone in the cellar."
            />
            <BenefitCard
              icon={Shield}
              iconColor="burgundy"
              title="TTB Compliant"
              description="Automatic Form 5120.17 generation with transaction logging. Stay audit-ready without the paperwork."
            />
          </div>
        </div>
      </section>

      {/* Main Features Section */}
      <section id="features" className="bg-gradient-to-b from-gray-50 to-white py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need to run your winery
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              From harvest intake to bottling, with TTB compliance and real-time monitoring built in
            </p>
          </div>

          <div className="space-y-24">
            {/* Feature 1: Harvest Intake */}
            <FeatureShowcase
              reverse={false}
              eyebrow="Harvest Management"
              title="Track harvest from field to cellar"
              description="Record grape deliveries, measure quality metrics, and create production lots from harvest data. Capture Brix, pH, TA, and other critical measurements at intake."
              features={[
                "Log harvest batches by field and varietal",
                "Record Brix, pH, TA, and quality metrics",
                "Create production lots automatically",
                "Track tonnage and payment calculations",
                "Document harvest dates and conditions",
                "Quality analysis and reporting"
              ]}
              demoComponent={<HarvestIntakeDemo />}
              ctaText="Explore Winery Tools"
              ctaLink={user ? "/production" : "/signup"}
            />

            {/* Feature 2: Fermentation Tracking */}
            <FeatureShowcase
              reverse={true}
              eyebrow="Fermentation"
              title="Monitor fermentation progress"
              description="Track temperature, Brix, and fermentation status for all active lots. Log daily readings, track yeast additions, and record punch-downs and pump-overs."
              features={[
                "Daily fermentation tracking",
                "Temperature and Brix monitoring",
                "Yeast and nutrient additions logging",
                "Punch-down and pump-over logging",
                "Fermentation completion alerts",
                "Historical fermentation charts"
              ]}
              demoComponent={<FermentationDemo />}
              ctaText="See Fermentation Features"
              ctaLink={user ? "/production" : "/signup"}
            />

            {/* Feature 3: Blending Calculator */}
            <FeatureShowcase
              reverse={false}
              eyebrow="Blending"
              title="Create custom blends with precision"
              description="Design wine blends with our intelligent calculator. Preview chemistry, track varietal composition, and manage blend components across your cellar."
              features={[
                "Multi-component blend calculator",
                "Predicted chemistry calculations",
                "Varietal composition tracking",
                "Volume and percentage management",
                "Blend history and versioning",
                "Container assignment and tracking"
              ]}
              demoComponent={<BlendingDemo />}
              ctaText="Try Blending Tools"
              ctaLink={user ? "/production" : "/signup"}
            />

            {/* Feature 4: Aging Operations */}
            <FeatureShowcase
              reverse={true}
              eyebrow="Cellar Management"
              title="Track aging in barrels and tanks"
              description="Monitor wine through aging with QR code labels for instant mobile access. Track rackings, additions, and barrel inventory across your cellar."
              features={[
                "Barrel and tank inventory management",
                "QR code barrel labels with detail tracking",
                "Racking and topping logging",
                "Sulfite and additive tracking",
                "Barrel aging timeline monitoring",
                "Visual barrel room mapping"
              ]}
              demoComponent={<AgingBottlingDemo />}
              ctaText="Manage Your Cellar"
              ctaLink={user ? "/production" : "/signup"}
            />

            {/* Feature 5: Bottling Operations */}
            <FeatureShowcase
              reverse={false}
              eyebrow="Bottling"
              title="Plan and execute bottling runs"
              description="Streamline bottling operations with our smart bottling calculator. Calculate case yields, track packaging materials, and manage bottling schedules with precision."
              features={[
                "Bottling calculator with case yield projections",
                "Packaging material tracking",
                "Bottling schedule and planning",
                "Label and closure inventory",
                "Case production tracking",
                "Cost per case calculations"
              ]}
              demoComponent={<BottlingDemo />}
              ctaText="Optimize Bottling"
              ctaLink={user ? "/production" : "/signup"}
            />

            {/* Feature 6: TTB Compliance */}
            <FeatureShowcase
              reverse={true}
              eyebrow="Compliance"
              title="TTB reporting made simple"
              description="Stay compliant with automatic TTB Form 5120.17 generation. Track all reportable transactions, maintain accurate records, and generate monthly, quarterly, or annual reports with one click."
              features={[
                "Automatic Form 5120.17 report generation",
                "Complete transaction logging by tax class",
                "Bulk and bottled wine tracking",
                "Transfers, removals, and losses documentation",
                "Winery registration management",
                "Export reports for filing"
              ]}
              demoComponent={<TTBComplianceDemo />}
              ctaText="Simplify Compliance"
              ctaLink={user ? "/production" : "/signup"}
            />

            {/* Feature 7: IoT Sensors */}
            <FeatureShowcase
              reverse={false}
              eyebrow="Smart Monitoring"
              title="Real-time fermentation monitoring"
              description="Connect IoT temperature sensors to monitor fermentation around the clock. Get alerts for temperature excursions, track readings over time, and never miss a critical moment."
              features={[
                "WiFi and Bluetooth sensor support",
                "Real-time temperature tracking",
                "Automatic fermentation logging",
                "Customizable alert thresholds",
                "Historical temperature charts",
                "Multiple sensor types supported"
              ]}
              demoComponent={<SensorDemo />}
              ctaText="Connect Sensors"
              ctaLink={user ? "/production" : "/signup"}
            />

            {/* Feature 8: Lab Analysis */}
            <FeatureShowcase
              reverse={true}
              eyebrow="Lab & Analysis"
              title="Track wine chemistry and analytics"
              description="Record lab results, track chemistry over time, and make data-driven decisions about your wine. From pH and TA to free SO2 and volatile acidity, keep all your analysis in one place."
              features={[
                "Complete chemistry tracking",
                "pH, TA, SO2, and VA logging",
                "Analysis history by lot",
                "Chemistry trend visualization",
                "Production analytics dashboard",
                "Export lab reports"
              ]}
              demoComponent={<LabAnalysisDemo />}
              ctaText="Track Chemistry"
              ctaLink={user ? "/production" : "/signup"}
            />
          </div>
        </div>
      </section>

      {/* How It Compares Section */}
      <section className="bg-gradient-to-br from-teal-50 to-vine-green-50 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Why winemakers choose us over enterprise winery software
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Powerful cellar management without the enterprise price tag
            </p>
          </div>

          <div className="mx-auto max-w-5xl">
            <div className="overflow-hidden rounded-2xl bg-white shadow-xl">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="py-4 px-6 text-left text-sm font-bold text-gray-900">Feature</th>
                    <th className="py-4 px-6 text-center text-sm font-bold text-[#81243f]">
                      Trellis Production
                    </th>
                    <th className="py-4 px-6 text-center text-sm font-bold text-gray-500">
                      Enterprise Solutions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <ComparisonRow
                    feature="Pricing"
                    us="$79-149/month"
                    them="$500-2000+/month"
                  />
                  <ComparisonRow
                    feature="Implementation"
                    us="Start tracking immediately"
                    them="Months of setup & consulting"
                  />
                  <ComparisonRow
                    feature="TTB compliance"
                    us="Automatic Form 5120.17"
                    them="Manual export & formatting"
                  />
                  <ComparisonRow
                    feature="Mobile cellar access"
                    us="QR code barrel scanning"
                    them="Desktop-dependent"
                  />
                  <ComparisonRow
                    feature="IoT sensors"
                    us="Built-in fermentation monitoring"
                    them="Separate system/add-on"
                  />
                  <ComparisonRow
                    feature="User experience"
                    us="Intuitive, modern interface"
                    them="Complex ERP-style menus"
                  />
                  <ComparisonRow
                    feature="Small winery focus"
                    us="Built for 1-5K case producers"
                    them="Designed for large operations"
                  />
                  <ComparisonRow
                    feature="Blend calculator"
                    us="Instant predicted chemistry"
                    them="Basic or non-existent"
                  />
                  <ComparisonRow
                    feature="Training required"
                    us="Learn as you go"
                    them="Days of mandatory training"
                  />
                  <ComparisonRow
                    feature="Flexibility"
                    us="Cancel anytime"
                    them="Long-term contracts"
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
                to={user ? "/production" : "/signup"}
                className="group inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-bold text-teal-700 shadow-xl hover:bg-teal-50 transition-all hover:scale-105"
              >
                {user ? "Go to Production" : "Get Started Free"}
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
    'burgundy': 'bg-gradient-to-br from-[#9d2f52] to-[#81243f]'
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
function FeatureShowcase({ reverse, eyebrow, title, description, features, demoComponent, ctaText, ctaLink }) {
  return (
    <div className={`grid grid-cols-1 gap-12 lg:grid-cols-2 items-center ${reverse ? 'lg:flex-row-reverse' : ''}`}>
      <div className={reverse ? 'lg:order-2' : ''}>
        <div className="inline-block rounded-full px-3 py-1 text-xs font-semibold mb-4 bg-[#f5d1db] text-[#81243f]">
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
              <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0 text-[#81243f]" />
              <span className="text-gray-700">{feature}</span>
            </li>
          ))}
        </ul>
        <Link
          to={ctaLink}
          className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white shadow-md hover:shadow-lg transition-all hover:scale-105 bg-gradient-to-r from-[#9d2f52] to-[#81243f]"
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
function HarvestIntakeDemo() {
  return (
    <div className="rounded-2xl bg-white p-8 shadow-xl border-2 border-gray-200">
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
          <span className="text-sm font-semibold text-gray-900">Harvest Tracking</span>
          <Grape className="w-5 h-5 text-[#81243f]" />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-500 mb-2">Today's Harvest</div>
            <div className="text-4xl font-bold text-gray-900">12.6 tons</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500 mb-2">Avg Brix</div>
            <div className="text-3xl font-bold text-[#81243f]">24.1°</div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Brix Distribution Chart */}
          <div>
            <div className="text-sm font-semibold text-gray-700 mb-3">Brix Distribution by Varietal</div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Cab Sauv (4.2t)</span>
                  <span className="font-medium">24.5°</span>
                </div>
                <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-300 to-gray-200"></div>
                  <div className="absolute left-0 h-full bg-[#81243f] rounded-full" style={{ width: '82%' }}></div>
                  <div className="absolute h-full border-l-2 border-gray-800" style={{ left: '80%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Pinot Noir (2.8t)</span>
                  <span className="font-medium">23.2°</span>
                </div>
                <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-300 to-gray-200"></div>
                  <div className="absolute left-0 h-full bg-[#81243f] rounded-full" style={{ width: '77%' }}></div>
                  <div className="absolute h-full border-l-2 border-gray-800" style={{ left: '80%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Chardonnay (5.6t)</span>
                  <span className="font-medium">24.8°</span>
                </div>
                <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-300 to-gray-200"></div>
                  <div className="absolute left-0 h-full bg-[#81243f] rounded-full" style={{ width: '83%' }}></div>
                  <div className="absolute h-full border-l-2 border-gray-800" style={{ left: '80%' }}></div>
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-500 mt-3 text-right">Target: 24° Brix</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FermentationDemo() {
  return (
    <div className="rounded-2xl bg-white p-8 shadow-xl border-2 border-gray-200">
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
          <span className="text-sm font-semibold text-gray-900">Fermentation Monitoring</span>
          <Thermometer className="w-5 h-5 text-[#81243f]" />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold text-gray-900">Lot 03 - Cab Sauvignon</span>
          <span className="text-sm text-gray-500">Day 6 of 12</span>
        </div>

        {/* Temperature and Brix Curve */}
        <div className="relative h-64 bg-gradient-to-b from-gray-50 to-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-500 mb-3">12-Day Fermentation Timeline</div>

          {/* Chart with axes */}
          <div className="relative h-36 mx-12 mb-8">
            {/* Y-axis labels - Left (Brix) */}
            <div className="absolute -left-10 inset-y-0 flex flex-col justify-between text-xs text-gray-500">
              <span>25°</span>
              <span>18°</span>
              <span>12°</span>
              <span>5°</span>
              <span>0°</span>
            </div>

            {/* Y-axis labels - Right (Temp) */}
            <div className="absolute -right-12 inset-y-0 flex flex-col justify-between text-xs text-gray-500 text-right">
              <span>85°F</span>
              <span>80°F</span>
              <span>75°F</span>
              <span>70°F</span>
              <span>65°F</span>
            </div>

            {/* Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between">
              <div className="border-t border-gray-200"></div>
              <div className="border-t border-gray-200"></div>
              <div className="border-t border-gray-200"></div>
              <div className="border-t border-gray-200"></div>
              <div className="border-t border-gray-200"></div>
            </div>

            {/* Brix curve - realistic descending curve (starts high, drops steadily) */}
            <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
              <path
                d="M 0,8 Q 16,10 25,20 Q 33,32 42,48 Q 50,62 58,72 Q 67,80 75,86 Q 83,90 92,93 L 100,95"
                fill="none"
                stroke="#81243f"
                strokeWidth="2.5"
                vectorEffect="non-scaling-stroke"
              />
              {/* Current point marker */}
              <circle cx="50" cy="62" r="3" fill="#81243f" />
            </svg>

            {/* Temp curve - realistic bell curve (rises, peaks mid-ferment, then drops) */}
            <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
              <path
                d="M 0,75 Q 12,68 25,50 Q 33,38 42,28 Q 50,22 58,25 Q 67,30 75,42 Q 83,55 92,68 L 100,75"
                fill="none"
                stroke="#141d30"
                strokeWidth="2.5"
                strokeDasharray="5 3"
                vectorEffect="non-scaling-stroke"
              />
              {/* Current point marker */}
              <circle cx="50" cy="22" r="3" fill="#141d30" />
            </svg>

            {/* X-axis labels */}
            <div className="absolute -bottom-6 inset-x-0 flex justify-between text-xs text-gray-500">
              <span>Day 0</span>
              <span>Day 3</span>
              <span className="font-semibold text-gray-700">Day 6</span>
              <span>Day 9</span>
              <span>Day 12</span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex gap-6 text-sm justify-center">
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-[#81243f]"></div>
              <span className="text-gray-600">Brix (sugar level)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-[#141d30] border-t-2 border-dashed"></div>
              <span className="text-gray-600">Temperature</span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-100">
            <div className="text-sm text-gray-500 mb-1">pH</div>
            <div className="text-2xl font-bold text-gray-900">3.62</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-100">
            <div className="text-sm text-gray-500 mb-1">TA</div>
            <div className="text-2xl font-bold text-gray-900">6.4</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-100">
            <div className="text-sm text-gray-500 mb-1">Vol</div>
            <div className="text-2xl font-bold text-gray-900">850 gal</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BlendingDemo() {
  return (
    <div className="rounded-2xl bg-white p-8 shadow-xl border-2 border-gray-200">
      <div className="space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
          <span className="text-sm font-semibold text-gray-900">Blend Calculator</span>
          <Droplets className="w-5 h-5 text-[#81243f]" />
        </div>

        <div>
          <span className="text-lg font-semibold text-gray-900">Blend Preview - Estate Red</span>
        </div>

        <div className="space-y-4">
          <div className="space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-base text-gray-900">Cabernet Sauvignon</span>
              <span className="text-base font-medium text-gray-900">65%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div className="bg-[#81243f] h-3 rounded-full" style={{ width: '65%' }}></div>
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-base text-gray-900">Merlot</span>
              <span className="text-base font-medium text-gray-900">25%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div className="bg-[#81243f] h-3 rounded-full" style={{ width: '25%' }}></div>
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-base text-gray-900">Petit Verdot</span>
              <span className="text-base font-medium text-gray-900">10%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div className="bg-[#81243f] h-3 rounded-full" style={{ width: '10%' }}></div>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-200 mt-4">
            <div className="text-sm font-semibold text-gray-700 mb-3">Predicted Chemistry</div>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-gray-500 mb-1">pH</div>
                <div className="text-xl font-bold text-gray-900">3.68</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-gray-500 mb-1">TA</div>
                <div className="text-xl font-bold text-gray-900">6.2 g/L</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-gray-500 mb-1">ABV</div>
                <div className="text-xl font-bold text-gray-900">14.1%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AgingBottlingDemo() {
  return (
    <div className="rounded-2xl bg-white p-8 shadow-xl border-2 border-gray-200">
      <div className="space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
          <span className="text-sm font-semibold text-gray-900">Barrel Tracking</span>
          <Barrel className="w-5 h-5 text-[#81243f]" />
        </div>

        <div>
          <span className="text-lg font-semibold text-gray-900">Barrel Room A - Visual Map</span>
          <div className="text-sm text-gray-500 mt-1">72 barrels • 95% capacity</div>
        </div>

        {/* Barrel Map Grid */}
        <div className="bg-gradient-to-br from-gray-50 to-white p-4 rounded-lg border border-gray-200">
          <div className="grid grid-cols-12 gap-1">
            {/* Row 1 - Cab Sauv */}
            {[...Array(12)].map((_, i) => (
              <div key={`r1-${i}`} className="aspect-square rounded-sm bg-[#81243f] opacity-90" title="2024 Cab Sauv"></div>
            ))}
            {/* Row 2 - Cab Sauv */}
            {[...Array(12)].map((_, i) => (
              <div key={`r2-${i}`} className="aspect-square rounded-sm bg-[#81243f] opacity-90"></div>
            ))}
            {/* Row 3 - Pinot Noir */}
            {[...Array(12)].map((_, i) => (
              <div key={`r3-${i}`} className="aspect-square rounded-sm bg-[#a13d5d] opacity-80"></div>
            ))}
            {/* Row 4 - Chardonnay */}
            {[...Array(12)].map((_, i) => (
              <div key={`r4-${i}`} className="aspect-square rounded-sm bg-[#d4a574] opacity-70"></div>
            ))}
            {/* Row 5 - Chardonnay */}
            {[...Array(12)].map((_, i) => (
              <div key={`r5-${i}`} className="aspect-square rounded-sm bg-[#d4a574] opacity-70"></div>
            ))}
            {/* Row 6 - Mixed/Empty */}
            {[...Array(9)].map((_, i) => (
              <div key={`r6-${i}`} className="aspect-square rounded-sm bg-[#141d30] opacity-60"></div>
            ))}
            {[...Array(3)].map((_, i) => (
              <div key={`r6-e-${i}`} className="aspect-square rounded-sm border border-gray-300 bg-white"></div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-sm bg-[#81243f]"></div>
            <span className="text-gray-600">Red (24 bbls)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-sm bg-[#a13d5d]"></div>
            <span className="text-gray-600">Pinot (12 bbls)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-sm bg-[#d4a574]"></div>
            <span className="text-gray-600">White (24 bbls)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-sm bg-[#141d30]"></div>
            <span className="text-gray-600">Blend (9 bbls)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function BottlingDemo() {
  return (
    <div className="rounded-2xl bg-white p-8 shadow-xl border-2 border-gray-200">
      <div className="space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
          <span className="text-sm font-semibold text-gray-900">Bottling Operations</span>
          <Wine className="w-5 h-5 text-[#81243f]" />
        </div>

        <div>
          <span className="text-lg font-semibold text-gray-900">Bottling Calculator - 2024 Estate Cab</span>
          <div className="text-sm text-gray-500 mt-1">Schedule bottling run</div>
        </div>

        {/* Source Volume */}
        <div className="bg-gradient-to-br from-gray-50 to-white p-4 rounded-lg border border-gray-200">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500 mb-2">Source Volume</div>
              <div className="text-3xl font-bold text-gray-900">850 gal</div>
              <div className="text-xs text-gray-500 mt-1">12 barrels</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-2">Bottle Size</div>
              <div className="text-2xl font-bold text-gray-900">750ml</div>
              <div className="text-xs text-gray-500 mt-1">Standard</div>
            </div>
          </div>
        </div>

        {/* Case Yield Calculation */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-gray-200">
            <span className="text-sm font-semibold text-gray-700">Projected Yield</span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-teal-50 rounded-lg p-4 text-center border border-teal-200">
              <div className="text-sm text-teal-700 mb-1">Total Bottles</div>
              <div className="text-2xl font-bold text-teal-900">4,312</div>
            </div>
            <div className="bg-[#f5d1db] rounded-lg p-4 text-center border border-[#81243f]/20">
              <div className="text-sm text-[#81243f] mb-1">Total Cases</div>
              <div className="text-2xl font-bold text-[#81243f]">359</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-200">
              <div className="text-sm text-gray-600 mb-1">Cost/Case</div>
              <div className="text-2xl font-bold text-gray-900">$42.50</div>
            </div>
          </div>

          {/* Material Requirements */}
          <div className="mt-4 pt-3 border-t border-gray-200">
            <div className="text-sm font-semibold text-gray-700 mb-3">Materials Needed</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Bottles (750ml)</span>
                <span className="font-medium text-gray-900">4,312 units</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Corks</span>
                <span className="font-medium text-gray-900">4,312 units</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Capsules</span>
                <span className="font-medium text-gray-900">4,312 units</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Cases (12-bottle)</span>
                <span className="font-medium text-gray-900">359 units</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TTBComplianceDemo() {
  return (
    <div className="rounded-2xl bg-white p-8 shadow-xl border-2 border-gray-200">
      <div className="space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
          <span className="text-sm font-semibold text-gray-900">TTB Form 5120.17</span>
          <FileText className="w-5 h-5 text-[#81243f]" />
        </div>

        <div>
          <span className="text-lg font-semibold text-gray-900">Report of Wine Premises Operations</span>
          <div className="text-sm text-gray-500 mt-1">January 2025 • Monthly Report</div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="text-sm text-gray-500 mb-1">Bulk Produced</div>
            <div className="text-2xl font-bold text-gray-900">2,450 gal</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="text-sm text-gray-500 mb-1">Bulk On Hand</div>
            <div className="text-2xl font-bold text-gray-900">8,720 gal</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="text-sm text-gray-500 mb-1">Bottled Produced</div>
            <div className="text-2xl font-bold text-gray-900">1,280 gal</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="text-sm text-gray-500 mb-1">Bottled On Hand</div>
            <div className="text-2xl font-bold text-gray-900">3,450 gal</div>
          </div>
        </div>

        {/* Tax Class Breakdown */}
        <div className="pt-3 border-t border-gray-200">
          <div className="text-sm font-semibold text-gray-700 mb-3">By Tax Class</div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Table Wine (Still)</span>
              <span className="font-medium text-gray-900">6,820 gal</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Sparkling Wine</span>
              <span className="font-medium text-gray-900">420 gal</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600">Dessert Wine</span>
              <span className="font-medium text-gray-900">180 gal</span>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          <span className="text-xs text-gray-500">42 transactions logged</span>
          <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">Ready to File</span>
        </div>
      </div>
    </div>
  );
}

function SensorDemo() {
  return (
    <div className="rounded-2xl bg-white p-8 shadow-xl border-2 border-gray-200">
      <div className="space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
          <span className="text-sm font-semibold text-gray-900">Temperature Sensors</span>
          <Wifi className="w-5 h-5 text-[#81243f]" />
        </div>

        <div>
          <span className="text-lg font-semibold text-gray-900">Active Fermentation Monitoring</span>
          <div className="text-sm text-gray-500 mt-1">4 sensors online</div>
        </div>

        {/* Sensor Cards */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-white rounded-lg border border-green-200">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <div>
                <div className="text-sm font-medium text-gray-900">Tank 1 - Cab Sauv</div>
                <div className="text-xs text-gray-500">Updated 2 min ago</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-gray-900">72°F</div>
              <div className="text-xs text-green-600">In range</div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-amber-50 to-white rounded-lg border border-amber-200">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
              <div>
                <div className="text-sm font-medium text-gray-900">Tank 2 - Pinot Noir</div>
                <div className="text-xs text-gray-500">Updated 5 min ago</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-amber-600">78°F</div>
              <div className="text-xs text-amber-600">High temp alert</div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-white rounded-lg border border-green-200">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <div>
                <div className="text-sm font-medium text-gray-900">Tank 3 - Chardonnay</div>
                <div className="text-xs text-gray-500">Updated 1 min ago</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-gray-900">58°F</div>
              <div className="text-xs text-green-600">In range</div>
            </div>
          </div>
        </div>

        {/* Mini Chart */}
        <div className="pt-3 border-t border-gray-200">
          <div className="text-sm font-semibold text-gray-700 mb-3">Tank 1 - Last 24 Hours</div>
          <div className="relative h-16 bg-gray-50 rounded-lg overflow-hidden">
            <svg className="w-full h-full" preserveAspectRatio="none">
              <path
                d="M 0,40 Q 10,38 20,35 Q 30,30 40,28 Q 50,25 60,24 Q 70,22 80,24 Q 90,26 100,28"
                fill="none"
                stroke="#81243f"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
            <div className="absolute inset-x-0 bottom-0 flex justify-between text-xs text-gray-400 px-2">
              <span>12am</span>
              <span>6am</span>
              <span>12pm</span>
              <span>6pm</span>
              <span>Now</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LabAnalysisDemo() {
  return (
    <div className="rounded-2xl bg-white p-8 shadow-xl border-2 border-gray-200">
      <div className="space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
          <span className="text-sm font-semibold text-gray-900">Wine Analysis</span>
          <FlaskConical className="w-5 h-5 text-[#81243f]" />
        </div>

        <div>
          <span className="text-lg font-semibold text-gray-900">2024 Estate Cab - Lab Results</span>
          <div className="text-sm text-gray-500 mt-1">Analysis from Jan 15, 2025</div>
        </div>

        {/* Chemistry Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-200">
            <div className="text-sm text-gray-500 mb-1">pH</div>
            <div className="text-2xl font-bold text-gray-900">3.62</div>
            <div className="text-xs text-green-600 mt-1">Normal</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-200">
            <div className="text-sm text-gray-500 mb-1">TA</div>
            <div className="text-2xl font-bold text-gray-900">6.4</div>
            <div className="text-xs text-gray-500 mt-1">g/L</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-200">
            <div className="text-sm text-gray-500 mb-1">ABV</div>
            <div className="text-2xl font-bold text-gray-900">14.2%</div>
            <div className="text-xs text-gray-500 mt-1">vol</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-200">
            <div className="text-sm text-gray-500 mb-1">Free SO₂</div>
            <div className="text-2xl font-bold text-gray-900">28</div>
            <div className="text-xs text-green-600 mt-1">ppm</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-200">
            <div className="text-sm text-gray-500 mb-1">Total SO₂</div>
            <div className="text-2xl font-bold text-gray-900">85</div>
            <div className="text-xs text-gray-500 mt-1">ppm</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-200">
            <div className="text-sm text-gray-500 mb-1">VA</div>
            <div className="text-2xl font-bold text-gray-900">0.42</div>
            <div className="text-xs text-green-600 mt-1">g/L</div>
          </div>
        </div>

        {/* Analysis History */}
        <div className="pt-3 border-t border-gray-200">
          <div className="text-sm font-semibold text-gray-700 mb-3">pH Trend (Last 6 Analyses)</div>
          <div className="flex items-end justify-between h-12 gap-2">
            <div className="flex-1 bg-[#81243f]/20 rounded-t" style={{ height: '60%' }}></div>
            <div className="flex-1 bg-[#81243f]/30 rounded-t" style={{ height: '65%' }}></div>
            <div className="flex-1 bg-[#81243f]/40 rounded-t" style={{ height: '70%' }}></div>
            <div className="flex-1 bg-[#81243f]/50 rounded-t" style={{ height: '68%' }}></div>
            <div className="flex-1 bg-[#81243f]/60 rounded-t" style={{ height: '72%' }}></div>
            <div className="flex-1 bg-[#81243f] rounded-t" style={{ height: '75%' }}></div>
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-2">
            <span>Oct</span>
            <span>Nov</span>
            <span>Dec</span>
            <span>Jan</span>
            <span>Feb</span>
            <span>Mar</span>
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
