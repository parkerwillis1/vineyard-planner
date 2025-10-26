import { Link } from "react-router-dom";
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
  Users
} from "lucide-react";
import { useAuth } from "@/auth/AuthContext";

export default function ProductsPage() {
  const { user } = useAuth();

  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-teal-600 via-vine-green-600 to-teal-700 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl"></div>

        <div className="relative mx-auto max-w-7xl px-6 py-24 sm:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 mb-6">
              <Sparkles className="w-4 h-4 text-white" />
              <span className="text-sm font-semibold text-white">Professional Vineyard Planning Tools</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
              Everything you need to plan a profitable vineyard
            </h1>
            <p className="mt-6 text-xl leading-8 text-teal-50">
              Powerful financial modeling, vineyard design, and loan planning tools that help you secure funding and make data-driven decisions.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                to={user ? "/planner" : "/signup"}
                className="group inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-bold text-teal-700 shadow-xl hover:bg-teal-50 transition-all hover:scale-105"
              >
                {user ? "Go to Planner" : "Start Planning Free"}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="#features"
                className="text-base font-semibold leading-7 text-white hover:text-teal-100 transition-colors"
              >
                See features below <span aria-hidden="true">↓</span>
              </a>
            </div>

            {/* Quick stats */}
            <div className="mt-16 grid grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold text-white">10 min</div>
                <div className="text-sm text-teal-100 mt-1">Average setup time</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white">30 years</div>
                <div className="text-sm text-teal-100 mt-1">Financial projections</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white">100%</div>
                <div className="text-sm text-teal-100 mt-1">Lender-ready reports</div>
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
              iconColor="teal"
              title="Accurate Projections"
              description="Industry-standard calculations based on real-world vineyard data and financial formulas."
            />
            <BenefitCard
              icon={Zap}
              iconColor="vine-green"
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
              iconColor="vine-green"
              title="Secure & Private"
              description="Your data is encrypted and backed up. Export or delete your plans anytime."
            />
          </div>
        </div>
      </section>

      {/* Main Features Section */}
      <section id="features" className="bg-gradient-to-b from-gray-50 to-white py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Powerful tools designed for vineyard owners
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Every feature you need to plan, finance, and execute your vineyard project
            </p>
          </div>

          <div className="space-y-24">
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
            />

            {/* Feature 2: Vineyard Layout */}
            <FeatureShowcase
              reverse={true}
              icon={LayoutGrid}
              iconColor="vine-green"
              eyebrow="Vineyard Design"
              title="Design your vineyard layout with precision"
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
            />
          </div>
        </div>
      </section>

      {/* How It Compares Section */}
      <section className="bg-gradient-to-br from-teal-50 to-vine-green-50 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Why vineyard owners choose us over spreadsheets
            </h2>
          </div>

          <div className="mx-auto max-w-5xl">
            <div className="overflow-hidden rounded-2xl bg-white shadow-xl">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="py-4 px-6 text-left text-sm font-bold text-gray-900">Feature</th>
                    <th className="py-4 px-6 text-center text-sm font-bold text-teal-700">Vineyard Planner</th>
                    <th className="py-4 px-6 text-center text-sm font-bold text-gray-500">Spreadsheets</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
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
    'vine-green': 'bg-gradient-to-br from-vine-green-500 to-vine-green-600'
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
    'teal': 'bg-gradient-to-br from-teal-500 to-teal-600',
    'vine-green': 'bg-gradient-to-br from-vine-green-500 to-vine-green-600'
  };

  return (
    <div className={`grid grid-cols-1 gap-12 lg:grid-cols-2 items-center ${reverse ? 'lg:flex-row-reverse' : ''}`}>
      <div className={reverse ? 'lg:order-2' : ''}>
        <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${iconColorClasses[iconColor]} mb-6`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="inline-block rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold text-teal-700 mb-4 ml-3">
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
              <CheckCircle2 className="w-5 h-5 text-teal-500 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">{feature}</span>
            </li>
          ))}
        </ul>
        <Link
          to={ctaLink}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-vine-green-600 px-6 py-3 text-sm font-bold text-white shadow-md hover:shadow-lg transition-all hover:scale-105"
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

        {/* Visual grid representation */}
        <div className="bg-white rounded-lg p-4 border border-vine-green-200">
          <div className="grid grid-cols-8 gap-1">
            {Array.from({ length: 64 }).map((_, i) => (
              <div
                key={i}
                className={`h-6 rounded ${i % 8 === 0 || i % 8 === 7 ? 'bg-gray-300' : 'bg-vine-green-400'}`}
              />
            ))}
          </div>
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
