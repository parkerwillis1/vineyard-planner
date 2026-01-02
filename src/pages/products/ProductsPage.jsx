import { Link } from "react-router-dom";
import { useState } from "react";
import {
  Calculator,
  LayoutGrid,
  TrendingUp,
  DollarSign,
  FileText,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Target,
  Zap,
  Clock,
  Shield,
  Users,
  MapPin,
  Satellite,
  Calendar,
  Droplet,
  Wind,
  Tractor,
  Activity,
  Layers
} from "lucide-react";
import { useAuth } from "@/auth/AuthContext";

export default function ProductsPage() {
  const { user } = useAuth();
  const [selectedTool, setSelectedTool] = useState('planner'); // 'planner' or 'operations'

  // Theme colors based on selected tool
  const getThemeColor = (shade) => {
    const themes = {
      planner: {
        50: 'teal-50',
        100: 'teal-100',
        200: 'teal-200',
        500: 'teal-500',
        600: 'teal-600',
        700: 'teal-700',
        hex: '#14b8a6'
      },
      operations: {
        50: '[#e8ebf0]',
        100: '[#d1d7e1]',
        200: '[#a3afc3]',
        500: '[#1a2844]',
        600: '[#141d30]',
        700: '[#0f1621]',
        hex: '#141d30'
      },
      production: {
        50: '[#fae8ed]',
        100: '[#f5d1db]',
        200: '[#eba3b7]',
        500: '[#9d2f52]',
        600: '[#81243f]',
        700: '[#651d32]',
        hex: '#81243f'
      }
    };
    return themes[selectedTool][shade];
  };

  return (
    <div className="relative">
      {/* Tool Selector - At the very top */}
      <section className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-6 py-3">
          <div className="flex justify-center gap-3">
            <button
              onClick={() => setSelectedTool('planner')}
              className={`px-6 py-2 text-sm font-semibold transition-all border ${
                selectedTool === 'planner'
                  ? 'border-black bg-gray-800 text-white hover:bg-gray-700'
                  : 'border-black text-gray-900 hover:bg-gray-100'
              }`}
            >
              Financial Planner
            </button>
            <button
              onClick={() => setSelectedTool('operations')}
              className={`px-6 py-2 text-sm font-semibold transition-all border ${
                selectedTool === 'operations'
                  ? 'border-black bg-gray-800 text-white hover:bg-gray-700'
                  : 'border-black text-gray-900 hover:bg-gray-100'
              }`}
            >
              Vineyard Operations
            </button>
            <button
              onClick={() => setSelectedTool('production')}
              className={`px-6 py-2 text-sm font-semibold transition-all border ${
                selectedTool === 'production'
                  ? 'border-black bg-gray-800 text-white hover:bg-gray-700'
                  : 'border-black text-gray-900 hover:bg-gray-100'
              }`}
            >
              Winery Production
            </button>
          </div>
        </div>
      </section>

      {/* Hero Section */}
      <section className={`relative overflow-hidden ${
        selectedTool === 'planner'
          ? 'bg-gradient-to-br from-teal-600 via-teal-700 to-teal-800'
          : selectedTool === 'operations'
          ? 'bg-gradient-to-br from-[#1a2844] via-[#141d30] to-[#0f1621]'
          : 'bg-gradient-to-br from-[#9d2f52] via-[#81243f] to-[#651d32]'
      }`}>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>

        <div className="relative mx-auto max-w-7xl px-6 py-24 sm:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 mb-6">
              <Sparkles className="w-4 h-4 text-white" />
              <span className="text-sm font-semibold text-white">
                {selectedTool === 'planner'
                  ? 'Professional Vineyard Planning Tools'
                  : selectedTool === 'operations'
                  ? 'Vineyard Operations Management'
                  : 'Winery Production Management'}
              </span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
              {selectedTool === 'planner'
                ? 'Complete vineyard financial planning'
                : selectedTool === 'operations'
                ? 'Streamline your vineyard operations'
                : 'Professional winery production tracking'}
            </h1>
            <p className="mt-6 text-xl leading-8 text-white/90">
              {selectedTool === 'planner'
                ? 'From financial planning to vineyard design—everything you need to plan, finance, and execute your vineyard project.'
                : selectedTool === 'operations'
                ? 'Manage blocks, track tasks, monitor spray programs, and optimize your vineyard operations from one central platform.'
                : 'Track harvest, manage fermentation, create blends, and monitor inventory across your entire winery operation.'}
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                to={user ? (selectedTool === 'planner' ? "/planner" : selectedTool === 'operations' ? "/vineyard" : "/production") : "/signup"}
                className={`group inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-bold shadow-xl hover:bg-gray-50 transition-all hover:scale-105 ${
                  selectedTool === 'planner'
                    ? 'text-teal-700'
                    : selectedTool === 'operations'
                    ? 'text-[#141d30]'
                    : 'text-[#81243f]'
                }`}
              >
                {user ? `Go to ${selectedTool === 'planner' ? 'Planner' : selectedTool === 'operations' ? 'Operations' : 'Production'}` : "Start Free Trial"}
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
              {selectedTool === 'planner' && (
                <>
                  <div>
                    <div className="text-3xl font-bold text-white">10 min</div>
                    <div className="text-sm text-white/80 mt-1">Average setup time</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-white">30 years</div>
                    <div className="text-sm text-white/80 mt-1">Financial projections</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-white">100%</div>
                    <div className="text-sm text-white/80 mt-1">Lender-ready reports</div>
                  </div>
                </>
              )}
              {selectedTool === 'operations' && (
                <>
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
                </>
              )}
              {selectedTool === 'production' && (
                <>
                  <div>
                    <div className="text-3xl font-bold text-white">Full</div>
                    <div className="text-sm text-white/80 mt-1">Cellar visibility</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-white">Smart</div>
                    <div className="text-sm text-white/80 mt-1">Blend calculator</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-white">Complete</div>
                    <div className="text-sm text-white/80 mt-1">Inventory control</div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
            {selectedTool === 'planner' && (
              <>
                <BenefitCard
                  icon={Target}
                  iconColor="teal"
                  title="Accurate Projections"
                  description="Industry-standard calculations based on real-world vineyard data and financial formulas."
                />
                <BenefitCard
                  icon={Zap}
                  iconColor="teal"
                  title="Save Time"
                  description="Build comprehensive business plans in minutes instead of weeks with spreadsheets."
                />
                <BenefitCard
                  icon={Clock}
                  iconColor="teal"
                  title="Instant Updates"
                  description="Change any assumption and see all calculations update automatically in real-time."
                />
                <BenefitCard
                  icon={Shield}
                  iconColor="teal"
                  title="Secure & Private"
                  description="Your data is encrypted and backed up. Export or delete your plans anytime."
                />
              </>
            )}

            {selectedTool === 'operations' && (
              <>
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
              </>
            )}

            {selectedTool === 'production' && (
              <>
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
                  title="Data Security"
                  description="Your fermentation logs, chemistry, and blend trials are encrypted and backed up automatically."
                />
              </>
            )}
          </div>
        </div>
      </section>

      {/* Main Features Section */}
      <section id="features" className="bg-gradient-to-b from-gray-50 to-white py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              {selectedTool === 'planner'
                ? 'Powerful tools designed for vineyard planning'
                : 'Comprehensive vineyard operations management'}
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              {selectedTool === 'planner'
                ? 'Every feature you need to plan, finance, and execute your vineyard project'
                : 'Track activities, monitor health, and optimize your vineyard performance'}
            </p>
          </div>

          <div className="space-y-24">
            {/* Planner Features */}
            {selectedTool === 'planner' && (
              <>
                {/* Feature 1: Financial Planning */}
                <FeatureShowcase
              reverse={false}
              icon={Calculator}
              iconColor="teal"
              eyebrow="Financial Planning"
              title="Build detailed 10-30 year projections"
              description="Create professional financial models that lenders and investors will trust. Our calculator handles complex vineyard economics including yield curves, revenue timing, establishment costs, and ongoing operations."
              features={[
                "Customizable yield curves (year 1-30)",
                "Bottled wine or bulk grape sales models",
                "Establishment vs. operating cost tracking",
                "Break-even analysis and ROI calculations",
                "Cash flow projections with debt service",
                "Per-acre economics breakdown"
              ]}
              demoComponent={<FinancialPlanningDemo />}
              ctaText="Try the Financial Calculator"
              ctaLink={user ? "/planner" : "/signup"}
              selectedTool={selectedTool}
              selectedTool={selectedTool}
            />

            {/* Feature 2: Vineyard Layout */}
            <FeatureShowcase
              reverse={true}
              icon={LayoutGrid}
              iconColor="vine-green"
              eyebrow="Vineyard Design"
              title="Design your vineyard layout with precision"
              selectedTool={selectedTool}
              description="Configure every detail of your vineyard design from vine spacing to row orientation. Our calculator automatically determines materials needed, installation costs, and optimal layout for your terrain."
              features={[
                "Flexible vine spacing (4×8' to 8×12')",
                "Rectangular or custom plot shapes",
                "North-South or East-West row orientation",
                "Auto-calculate trellis materials needed",
                "Irrigation system component planning",
                "Fencing perimeter cost estimates"
              ]}
              demoComponent={<VineyardLayoutDemo />}
              ctaText="Design Your Vineyard"
              ctaLink={user ? "/planner" : "/signup"}
              selectedTool={selectedTool}
            />

            {/* Feature 3: Loan Planning */}
            <FeatureShowcase
              reverse={false}
              icon={DollarSign}
              iconColor="teal"
              eyebrow="Financing Tools"
              title="Model USDA, FSA, and commercial loans"
              description="Compare multiple loan scenarios with accurate payment calculations. Track debt service, calculate loan-to-cost ratios, and identify equity gaps before you approach lenders."
              features={[
                "USDA FSA loan modeling (7-year terms)",
                "Commercial bank loan options",
                "Equipment financing calculations",
                "LTC and LTV ratio tracking",
                "Monthly debt service projections",
                "Equity gap identification"
              ]}
              demoComponent={<LoanPlanningDemo />}
              ctaText="Model Your Financing"
              ctaLink={user ? "/planner" : "/signup"}
              selectedTool={selectedTool}
            />

            {/* Feature 4: Reports */}
            <FeatureShowcase
              reverse={true}
              icon={FileText}
              iconColor="vine-green"
              eyebrow="Professional Reports"
              title="Export lender-ready PDF reports"
              description="Generate polished, professional reports with charts, tables, and detailed breakdowns. Perfect for bank presentations, investor pitches, or your own records."
              features={[
                "Year 0 establishment cost breakdown",
                "10-30 year financial projections table",
                "Visual charts and graphs",
                "Material costs and quantities",
                "Loan amortization schedules",
                "Break-even and ROI analysis"
              ]}
              demoComponent={<ReportDemo />}
              ctaText="See Report Examples"
              ctaLink={user ? "/planner" : "/signup"}
              selectedTool={selectedTool}
            />
              </>
            )}

            {/* Operations Features */}
            {selectedTool === 'operations' && (
              <>
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
              selectedTool={selectedTool}
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
              selectedTool={selectedTool}
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
              selectedTool={selectedTool}
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
              selectedTool={selectedTool}
                />
              </>
            )}

            {/* Production (Winery) Features */}
            {selectedTool === 'production' && (
              <>
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
              selectedTool={selectedTool}
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
              selectedTool={selectedTool}
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
              selectedTool={selectedTool}
                />

                {/* Feature 4: Aging & Bottling */}
                <FeatureShowcase
                  reverse={true}
                  eyebrow="Cellar Management"
                  title="Manage aging and bottling operations"
                  description="Track wine through aging in barrels and tanks with QR code labels for instant mobile access. Monitor rackings, additions, and plan bottling operations."
                  features={[
                    "Barrel and tank inventory management",
                    "QR code barrel labels with detail tracking",
                    "Racking and topping logging",
                    "Sulfite and additive tracking",
                    "Barrel aging timeline monitoring",
                    "Bottling readiness alerts"
                  ]}
                  demoComponent={<AgingBottlingDemo />}
                  ctaText="Manage Your Cellar"
                  ctaLink={user ? "/production" : "/signup"}
              selectedTool={selectedTool}
                />
              </>
            )}
          </div>
        </div>
      </section>

      {/* How It Compares Section */}
      <section className="bg-gradient-to-br from-teal-50 to-vine-green-50 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              {selectedTool === 'planner' && 'Why vineyard owners choose us over spreadsheets'}
              {selectedTool === 'operations' && 'Why growers choose us over legacy farm software'}
              {selectedTool === 'production' && 'Why winemakers choose us over enterprise winery software'}
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              {selectedTool === 'planner' && 'Purpose-built for vineyard financial planning'}
              {selectedTool === 'operations' && 'Modern vineyard management without the complexity'}
              {selectedTool === 'production' && 'Powerful cellar management without the enterprise price tag'}
            </p>
          </div>

          <div className="mx-auto max-w-5xl">
            <div className="overflow-hidden rounded-2xl bg-white shadow-xl">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="py-4 px-6 text-left text-sm font-bold text-gray-900">Feature</th>
                    <th className={`py-4 px-6 text-center text-sm font-bold ${
                      selectedTool === 'planner' ? 'text-teal-700' :
                      selectedTool === 'operations' ? 'text-[#141d30]' :
                      'text-[#81243f]'
                    }`}>
                      {selectedTool === 'planner' ? 'Vineyard Planner' :
                       selectedTool === 'operations' ? 'Vineyard Operations' :
                       'Winery Production'}
                    </th>
                    <th className="py-4 px-6 text-center text-sm font-bold text-gray-500">
                      {selectedTool === 'planner' && 'Spreadsheets'}
                      {selectedTool === 'operations' && 'Legacy Software'}
                      {selectedTool === 'production' && 'Enterprise Solutions'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {selectedTool === 'planner' && (
                    <>
                      <ComparisonRow
                        feature="Setup time"
                        us="10 minutes"
                        them="Hours to days"
                        usWins={true}
                      />
                      <ComparisonRow
                        feature="Vineyard layout calculator"
                        us={true}
                        them={false}
                        usWins={true}
                      />
                      <ComparisonRow
                        feature="Automatic calculations"
                        us={true}
                        them="Manual formulas"
                        usWins={true}
                      />
                      <ComparisonRow
                        feature="Loan modeling"
                        us="Built-in tools"
                        them="Manual setup"
                        usWins={true}
                      />
                      <ComparisonRow
                        feature="Error risk"
                        us="Minimal"
                        them="High"
                        usWins={true}
                      />
                      <ComparisonRow
                        feature="Professional reports"
                        us="One-click PDF"
                        them="Manual formatting"
                        usWins={true}
                      />
                      <ComparisonRow
                        feature="Cloud backup"
                        us={true}
                        them={false}
                        usWins={true}
                      />
                      <ComparisonRow
                        feature="Multiple scenarios"
                        us="Unlimited plans"
                        them="Duplicate files"
                        usWins={true}
                      />
                    </>
                  )}

                  {selectedTool === 'operations' && (
                    <>
                      <ComparisonRow
                        feature="Pricing"
                        us="$29-79/month"
                        them="$200-500+/month"
                        usWins={true}
                      />
                      <ComparisonRow
                        feature="Setup time"
                        us="Same day"
                        them="Weeks of training"
                        usWins={true}
                      />
                      <ComparisonRow
                        feature="User interface"
                        us="Modern & intuitive"
                        them="Complex & outdated"
                        usWins={true}
                      />
                      <ComparisonRow
                        feature="Mobile experience"
                        us="Mobile-first design"
                        them="Desktop-only or clunky mobile"
                        usWins={true}
                      />
                      <ComparisonRow
                        feature="Feature bloat"
                        us="Vineyard-focused tools"
                        them="One-size-fits-all agriculture"
                        usWins={true}
                      />
                      <ComparisonRow
                        feature="Updates & features"
                        us="Frequent improvements"
                        them="Slow development cycles"
                        usWins={true}
                      />
                      <ComparisonRow
                        feature="Customer support"
                        us="Direct founder access"
                        them="Ticket system delays"
                        usWins={true}
                      />
                      <ComparisonRow
                        feature="Contract terms"
                        us="Cancel anytime"
                        them="Annual contracts"
                        usWins={true}
                      />
                    </>
                  )}

                  {selectedTool === 'production' && (
                    <>
                      <ComparisonRow
                        feature="Pricing"
                        us="$79-149/month"
                        them="$500-2000+/month"
                        usWins={true}
                      />
                      <ComparisonRow
                        feature="Implementation"
                        us="Start tracking immediately"
                        them="Months of setup & consulting"
                        usWins={true}
                      />
                      <ComparisonRow
                        feature="Mobile cellar access"
                        us="QR code barrel scanning"
                        them="Desktop-dependent"
                        usWins={true}
                      />
                      <ComparisonRow
                        feature="User experience"
                        us="Intuitive, modern interface"
                        them="Complex ERP-style menus"
                        usWins={true}
                      />
                      <ComparisonRow
                        feature="Small winery focus"
                        us="Built for 1-5K case producers"
                        them="Designed for large operations"
                        usWins={true}
                      />
                      <ComparisonRow
                        feature="Blend calculator"
                        us="Instant predicted chemistry"
                        them="Basic or non-existent"
                        usWins={true}
                      />
                      <ComparisonRow
                        feature="Training required"
                        us="Learn as you go"
                        them="Days of mandatory training"
                        usWins={true}
                      />
                      <ComparisonRow
                        feature="Flexibility"
                        us="Cancel anytime"
                        them="Long-term contracts"
                        usWins={true}
                      />
                    </>
                  )}
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
                to={user ? "/planner" : "/signup"}
                className="group inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-bold text-teal-700 shadow-xl hover:bg-teal-50 transition-all hover:scale-105"
              >
                {user ? "Go to Your Planner" : "Get Started Free"}
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
    'teal': 'bg-gradient-to-br from-teal-500 to-teal-600',
    'vine-green': 'bg-gradient-to-br from-vine-green-500 to-vine-green-600',
    'navy': 'bg-gradient-to-br from-[#1a2844] to-[#141d30]',
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
function FeatureShowcase({ reverse, icon: Icon, iconColor, eyebrow, title, description, features, demoComponent, ctaText, ctaLink, selectedTool }) {
  const iconColorClasses = {
    'teal': 'bg-gradient-to-br from-teal-500 to-teal-600',
    'vine-green': 'bg-gradient-to-br from-vine-green-500 to-vine-green-600',
    'navy': 'bg-gradient-to-br from-[#1a2844] to-[#141d30]',
    'burgundy': 'bg-gradient-to-br from-[#9d2f52] to-[#81243f]'
  };

  // Dynamic theme colors
  const themeColors = {
    planner: {
      badge: 'bg-teal-100 text-teal-700',
      check: 'text-teal-500',
      button: 'bg-gradient-to-r from-teal-600 to-teal-700'
    },
    operations: {
      badge: 'bg-[#d1d7e1] text-[#141d30]',
      check: 'text-[#141d30]',
      button: 'bg-gradient-to-r from-[#1a2844] to-[#141d30]'
    },
    production: {
      badge: 'bg-[#f5d1db] text-[#81243f]',
      check: 'text-[#81243f]',
      button: 'bg-gradient-to-r from-[#9d2f52] to-[#81243f]'
    }
  };

  const colors = themeColors[selectedTool || 'planner'];

  return (
    <div className={`grid grid-cols-1 gap-12 lg:grid-cols-2 items-center ${reverse ? 'lg:flex-row-reverse' : ''}`}>
      <div className={reverse ? 'lg:order-2' : ''}>
        {Icon && (
          <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${iconColorClasses[iconColor]} mb-6`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        )}
        <div className={`inline-block rounded-full px-3 py-1 text-xs font-semibold mb-4 ml-3 ${colors.badge}`}>
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
              <CheckCircle2 className={`w-5 h-5 mt-0.5 flex-shrink-0 ${colors.check}`} />
              <span className="text-gray-700">{feature}</span>
            </li>
          ))}
        </ul>
        <Link
          to={ctaLink}
          className={`inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white shadow-md hover:shadow-lg transition-all hover:scale-105 ${colors.button}`}
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

// Demo components (placeholders with visual representations)
function FinancialPlanningDemo() {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-gray-50 to-white p-8 shadow-xl border-2 border-gray-200">
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
          <span className="text-sm font-semibold text-gray-700">10-Year Revenue Projection</span>
          <BarChart3 className="w-5 h-5 text-teal-600" />
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Year 1-3</span>
            <span className="font-semibold text-gray-900">$0</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-gradient-to-r from-red-400 to-red-500 h-2 rounded-full" style={{ width: '0%' }}></div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Year 4-5</span>
            <span className="font-semibold text-gray-900">$45,000/yr</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-2 rounded-full" style={{ width: '35%' }}></div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Year 6-10</span>
            <span className="font-semibold text-gray-900">$125,000/yr</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-gradient-to-r from-teal-500 to-vine-green-500 h-2 rounded-full" style={{ width: '100%' }}></div>
          </div>
        </div>
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">Break-Even</span>
            <span className="text-lg font-bold text-teal-600">Year 7</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function VineyardLayoutDemo() {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-vine-green-50 to-teal-50 p-8 shadow-xl border-2 border-vine-green-200">
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-vine-green-200">
          <span className="text-sm font-semibold text-gray-700">Vineyard Configuration</span>
          <LayoutGrid className="w-5 h-5 text-vine-green-600" />
        </div>

        {/* Satellite view with actual field mapping */}
        <div className="relative bg-white rounded-lg overflow-hidden border-2 border-vine-green-200 shadow-lg">
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
            <span className="font-semibold text-vine-green-700">7,260</span>
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

function LoanPlanningDemo() {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-gray-50 to-white p-8 shadow-xl border-2 border-gray-200">
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
          <span className="text-sm font-semibold text-gray-700">Financing Summary</span>
          <DollarSign className="w-5 h-5 text-teal-600" />
        </div>

        <div className="space-y-4">
          <div className="bg-teal-50 rounded-lg p-4 border border-teal-200">
            <div className="text-xs font-semibold text-teal-700 mb-2">USDA FSA Loan</div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900">$350,000</span>
              <span className="text-sm text-gray-600">@ 4.5% / 7 years</span>
            </div>
            <div className="mt-2 text-sm text-gray-700">
              Monthly payment: <span className="font-semibold">$4,850</span>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="text-xs font-semibold text-gray-700 mb-2">Equipment Loan</div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900">$75,000</span>
              <span className="text-sm text-gray-600">@ 6.0% / 5 years</span>
            </div>
            <div className="mt-2 text-sm text-gray-700">
              Monthly payment: <span className="font-semibold">$1,450</span>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-700">Loan-to-Cost Ratio</span>
              <span className="text-lg font-bold text-teal-600">85%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Equity Required</span>
              <span className="font-semibold text-gray-900">$75,000</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReportDemo() {
  return (
    <div className="rounded-2xl bg-white p-8 shadow-2xl border-2 border-gray-200">
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-4 border-b-2 border-gray-900">
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Vineyard Business Plan</div>
            <div className="text-lg font-bold text-gray-900 mt-1">Financial Summary Report</div>
          </div>
          <FileText className="w-6 h-6 text-gray-400" />
        </div>

        <div className="space-y-3 text-sm">
          <div className="bg-gray-50 rounded p-3">
            <div className="font-semibold text-gray-900 mb-1">📊 Year 0 Investment</div>
            <div className="text-gray-600">Complete cost breakdown with charts</div>
          </div>
          <div className="bg-gray-50 rounded p-3">
            <div className="font-semibold text-gray-900 mb-1">📈 10-Year Projections</div>
            <div className="text-gray-600">Revenue, costs, and cash flow analysis</div>
          </div>
          <div className="bg-gray-50 rounded p-3">
            <div className="font-semibold text-gray-900 mb-1">🎯 ROI Analysis</div>
            <div className="text-gray-600">Break-even timeline and returns</div>
          </div>
          <div className="bg-gray-50 rounded p-3">
            <div className="font-semibold text-gray-900 mb-1">💰 Loan Details</div>
            <div className="text-gray-600">Amortization and debt service</div>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <button className="w-full rounded-lg bg-gradient-to-r from-teal-600 to-vine-green-600 px-4 py-2.5 text-sm font-bold text-white hover:shadow-lg transition-shadow">
            Export as PDF
          </button>
        </div>
      </div>
    </div>
  );
}

// Demo components for Operations features
function NDVIDemo() {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-8 shadow-2xl border-2 border-blue-500/20">
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-white/20">
          <div>
            <span className="text-sm font-semibold text-blue-200">Vegetation Vigor Trends</span>
            <div className="text-xs text-blue-300 mt-1">Powered by Sentinel-2 Satellites</div>
          </div>
          <Satellite className="w-5 h-5 text-blue-400" />
        </div>

        {/* NDVI Example Image */}
        <div className="rounded-lg overflow-hidden border-2 border-white/20">
          <img
            src="/NDVI_Example.png"
            alt="NDVI Vegetation Health Monitoring"
            className="w-full h-auto"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
            <div className="text-xs text-blue-200 mb-1">Resolution</div>
            <div className="font-semibold text-white">10m / 5 days</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
            <div className="text-xs text-blue-200 mb-1">Data Source</div>
            <div className="font-semibold text-white">Sentinel-2</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
            <div className="text-xs text-blue-200 mb-1">ET Data</div>
            <div className="font-semibold text-white">Daily</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
            <div className="text-xs text-blue-200 mb-1">Coverage</div>
            <div className="font-semibold text-white">All Fields</div>
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
          <span className="text-sm font-semibold text-gray-700">Active Tasks</span>
          <Calendar className="w-5 h-5 text-vine-green-600" />
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
          <span className="text-sm font-semibold text-gray-700">Vineyard Analytics Dashboard</span>
          <BarChart3 className="w-5 h-5 text-teal-600" />
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

function HarvestIntakeDemo() {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-gray-50 to-white p-8 shadow-xl border-2 border-gray-200">
      <div className="space-y-6">
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
        <div className="flex items-center justify-between pb-3 border-b border-gray-200">
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
        <div className="pb-3 border-b border-gray-200">
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
        <div className="pb-3 border-b border-gray-200">
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

// Comparison table row
function ComparisonRow({ feature, us, them, usWins }) {
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
