import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-vine-green-50 to-white">
        <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-8 inline-flex items-center rounded-full bg-vine-green-100 px-4 py-2 text-sm font-semibold text-vine-green-800">
              🌱 Free Vineyard Planning Tools
            </div>
            <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-7xl">
              Plan Your Vineyard with Confidence
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Build detailed financial projections, design your vineyard layout, and model different scenarios—all in one place. No spreadsheets required.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                to="/planner"
                className="rounded-md bg-vine-green-600 px-8 py-3 text-base font-semibold text-white shadow-sm hover:bg-vine-green-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vine-green-600"
              >
                Open Planner
              </Link>
              <Link
                to="/docs"
                className="text-base font-semibold leading-7 text-gray-900 hover:text-vine-green-600"
              >
                View Documentation <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute left-1/2 top-0 -z-10 -translate-x-1/2 blur-3xl" aria-hidden="true">
          <div className="aspect-[1155/678] w-[72.1875rem] bg-gradient-to-tr from-vine-green-200 to-emerald-200 opacity-30" 
               style={{clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)'}}
          />
        </div>
      </section>

      {/* What You Can Do Section */}
      <section className="mx-auto max-w-7xl px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-2xl lg:text-center mb-16">
          <h2 className="text-base font-semibold leading-7 text-vine-green-600">What You Can Build</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Everything needed for your vineyard business plan
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Create professional financial models that lenders and investors will respect. 
            Our tools handle the complex calculations so you can focus on your vision.
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-7xl">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
            <FeatureCard
              icon="🎨"
              title="Design Your Vineyard Layout"
              description="Configure vine spacing from 4×8' to 8×12', set your plot shape and dimensions, choose row orientation for optimal sun exposure."
              details={[
                "Auto-calculate total vines needed",
                "Determine trellis materials required",
                "Plan irrigation system components",
                "Estimate fencing perimeter costs"
              ]}
            />
            
            <FeatureCard
              icon="💰"
              title="Model Your Finances"
              description="Build detailed 10-30 year financial projections with year-by-year revenue, costs, and cash flow analysis."
              details={[
                "Choose bottled wine or bulk grape sales",
                "Set pricing and yield assumptions",
                "Track establishment and operating costs",
                "Calculate break-even timeline and ROI"
              ]}
            />

            <FeatureCard
              icon="🏦"
              title="Plan Your Financing"
              description="Model USDA FSA loans, commercial bank loans, and equipment financing with accurate payment calculations."
              details={[
                "Compare multiple loan scenarios",
                "Calculate LTC and LTV ratios",
                "Track monthly debt service payments",
                "Identify equity gaps and funding needs"
              ]}
            />

            <FeatureCard
              icon="📊"
              title="Analyze Different Scenarios"
              description="Test various strategies by adjusting key variables and instantly seeing how they impact profitability."
              details={[
                "Compare price points and their effects",
                "Model different acreage sizes",
                "Test various cost assumptions",
                "Evaluate financing structures"
              ]}
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-gray-50 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl lg:text-center mb-16">
            <h2 className="text-base font-semibold leading-7 text-vine-green-600">Simple Process</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              From idea to business plan in minutes
            </p>
          </div>

          <div className="mx-auto max-w-5xl">
            <div className="space-y-8">
              <ProcessStep
                number="1"
                title="Design Your Vineyard"
                description="Start by configuring your vineyard layout—vine spacing, plot dimensions, and row orientation. The calculator automatically determines materials needed."
              />
              <ProcessStep
                number="2"
                title="Input Your Financials"
                description="Enter your acreage, land costs, and choose your sales strategy (bottled wine or bulk grapes). Customize establishment and operating costs."
              />
              <ProcessStep
                number="3"
                title="Add Financing Details"
                description="Model your equipment purchases and loans with accurate terms. The system calculates payments and tracks your debt service."
              />
              <ProcessStep
                number="4"
                title="Review & Refine"
                description="See your complete 10-year projection with break-even analysis, ROI calculations, and detailed cost breakdowns. Adjust assumptions until your model is perfect."
              />
            </div>
          </div>
        </div>
      </section>

      {/* Example Outputs Section */}
      <section className="mx-auto max-w-7xl px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-2xl lg:text-center mb-16">
          <h2 className="text-base font-semibold leading-7 text-vine-green-600">Professional Output</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Generate lender-ready reports
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <OutputCard
            title="Year 0 Investment"
            description="Complete breakdown of establishment costs with visual charts and per-acre analysis."
            stats={["Land & Improvements", "Setup & Materials", "Financing Summary"]}
          />
          <OutputCard
            title="10-Year Projections"
            description="Year-by-year financial details with revenue, costs, and cumulative cash flow tracking."
            stats={["Break-Even Timeline", "ROI Calculation", "Profitability Charts"]}
          />
          <OutputCard
            title="Detailed Analysis"
            description="Deep dive into costs, production, lender ratios, and bottle economics."
            stats={["Cost Breakdowns", "LTC/LTV Ratios", "Sensitivity Analysis"]}
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-vine-green-600">
        <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to start planning?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-vine-green-50">
              Our free planner gives you everything you need to create a professional vineyard business plan. 
              No credit card required.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                to="/planner"
                className="rounded-md bg-white px-8 py-3 text-base font-semibold text-vine-green-600 shadow-sm hover:bg-vine-green-50"
              >
                Open Planner Now
              </Link>
              <Link
                to="/docs"
                className="text-base font-semibold leading-7 text-white hover:text-vine-green-100"
              >
                Read the Docs <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description, details }) {
  return (
    <div className="relative bg-white rounded-2xl border-2 border-gray-200 p-8 hover:border-vine-green-300 transition-colors">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600 mb-6">{description}</p>
      <ul className="space-y-2">
        {details.map((detail, idx) => (
          <li key={idx} className="flex items-start gap-3 text-sm text-gray-600">
            <span className="text-vine-green-600 font-bold mt-0.5">→</span>
            <span>{detail}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ProcessStep({ number, title, description }) {
  return (
    <div className="flex gap-6">
      <div className="flex-shrink-0">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-vine-green-600 text-xl font-bold text-white">
          {number}
        </div>
      </div>
      <div className="flex-1">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function OutputCard({ title, description, stats }) {
  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-vine-green-300 transition-colors">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">{title}</h3>
      <p className="text-sm text-gray-600 mb-6">{description}</p>
      <div className="space-y-2">
        {stats.map((stat, idx) => (
          <div key={idx} className="flex items-center gap-2 text-sm">
            <div className="h-1.5 w-1.5 rounded-full bg-vine-green-600"></div>
            <span className="text-gray-700">{stat}</span>
          </div>
        ))}
      </div>
    </div>
  );
}