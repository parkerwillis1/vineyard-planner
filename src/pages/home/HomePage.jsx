import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 to-white">
        <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-7xl">
              Plan. Grow. Prosper.
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Professional vineyard planning and financial modeling tools. 
              Transform your vision into a profitable reality with data-driven insights.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                to="/planner"
                className="rounded-md bg-vine-green-500 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                Start Planning
              </Link>
              <Link
                to="/docs"
                className="text-base font-semibold leading-7 text-gray-900 hover:text-vine-green-500"
              >
                Learn more <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="mx-auto max-w-7xl px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-vine-green-500">Everything you need</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Built for vineyard entrepreneurs
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-7xl">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <Feature
              title="Vineyard Design"
              description="Calculate optimal vine spacing, trellis systems, and material requirements for your specific terrain."
            />
            <Feature
              title="Financial Projections"
              description="Multi-year cash flow analysis with break-even modeling and ROI calculations."
            />
            <Feature
              title="Cost Breakdown"
              description="Detailed establishment and operating cost estimates from site prep to harvest."
            />
            <Feature
              title="Scenario Planning"
              description="Compare different pricing strategies, acreage sizes, and sales models."
            />
            <Feature
              title="Loan Modeling"
              description="Integrate USDA and commercial financing options into your projections."
            />
            <Feature
              title="Export & Share"
              description="Generate professional reports to share with lenders, partners, and advisors."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-vine-green-500">
        <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to start your vineyard?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-blue-100">
              Join hundreds of aspiring vineyard owners who have used Vine Pioneer to turn their dreams into profitable businesses.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                to="/planner"
                className="rounded-md bg-white px-6 py-3 text-base font-semibold text-vine-green-500 shadow-sm hover:bg-vine-green-50"
              >
                Get started
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Feature({ title, description }) {
  return (
    <div className="relative pl-9">
      <div className="text-base font-semibold leading-7 text-gray-900">
        <div className="absolute left-0 top-0 flex h-6 w-6 items-center justify-center rounded-lg bg-blue-600">
          <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        {title}
      </div>
      <p className="mt-2 text-base leading-7 text-gray-600">{description}</p>
    </div>
  );
}