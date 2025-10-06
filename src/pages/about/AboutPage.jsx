import { Link } from "react-router-dom";

export default function AboutPage() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-blue-50 to-white py-20">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            About Vine Pioneer
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Empowering vineyard entrepreneurs with professional planning tools and financial insights.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
            <p className="text-lg text-gray-600 mb-4">
              Starting a vineyard is a dream for many, but the complexity of planning, financing, 
              and operations can be overwhelming. Vine Pioneer was created to bridge that gap.
            </p>
            <p className="text-lg text-gray-600 mb-4">
              We provide comprehensive vineyard planning software that helps aspiring vintners 
              transform their vision into a viable business plan with accurate financial projections, 
              detailed cost analysis, and scenario modeling.
            </p>
            <p className="text-lg text-gray-600">
              Whether you're planning your first acre or expanding an existing operation, 
              Vine Pioneer gives you the data-driven insights needed to make informed decisions.
            </p>
          </div>
          <div className="bg-blue-50 rounded-2xl p-8">
            <div className="space-y-6">
              <Stat number="10+" label="Years of Vineyard Data" />
              <Stat number="500+" label="Users Planning Vineyards" />
              <Stat number="$50M+" label="In Projected Investments" />
            </div>
          </div>
        </div>
      </section>

      {/* What We Do Section */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">What We Do</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <ServiceCard
              title="Vineyard Design"
              description="Calculate optimal vine spacing, row layout, and material requirements based on your specific acreage and terrain."
            />
            <ServiceCard
              title="Financial Modeling"
              description="Multi-year cash flow projections with break-even analysis, ROI calculations, and loan integration."
            />
            <ServiceCard
              title="Cost Planning"
              description="Detailed establishment and operating cost estimates from site preparation through harvest and production."
            />
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Our Values</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <ValueCard
            title="Accuracy"
            description="We use real-world data from USDA, industry reports, and working vineyards to ensure our models reflect actual costs and yields."
          />
          <ValueCard
            title="Transparency"
            description="Every calculation is visible and adjustable. You're not working with a black box—you see exactly where every number comes from."
          />
          <ValueCard
            title="Accessibility"
            description="Professional-grade vineyard planning shouldn't require hiring expensive consultants. We make it available to everyone."
          />
          <ValueCard
            title="Continuous Improvement"
            description="We regularly update our models with the latest industry data and incorporate feedback from real users."
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 py-16">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to Start Planning?
          </h2>
          <p className="text-lg text-blue-100 mb-8">
            Join hundreds of aspiring vineyard owners who have used Vine Pioneer to turn their dreams into reality.
          </p>
          <Link
            to="/planner"
            className="inline-block rounded-md bg-white px-8 py-3 text-base font-semibold text-blue-600 shadow-sm hover:bg-blue-50"
          >
            Get Started Free
          </Link>
        </div>
      </section>
    </div>
  );
}

function Stat({ number, label }) {
  return (
    <div className="text-center">
      <div className="text-4xl font-bold text-blue-600">{number}</div>
      <div className="mt-2 text-sm text-gray-600">{label}</div>
    </div>
  );
}

function ServiceCard({ title, description }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-xl font-semibold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function ValueCard({ title, description }) {
  return (
    <div className="bg-white p-6 rounded-lg border-l-4 border-blue-600">
      <h3 className="text-xl font-semibold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}