import { Link } from "react-router-dom";

export default function AboutPage() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-vine-green-50 to-white py-20">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            About Vine Pioneer
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Built by vineyard dreamers, for vineyard dreamers.
          </p>
        </div>
      </section>

      {/* Why We Started Section */}
      <section className="mx-auto max-w-4xl px-6 py-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">Why We Started This</h2>
        <div className="prose prose-lg text-gray-600 space-y-4">
          <p>
            We started Vine Pioneer because we were frustrated. Planning a vineyard meant wrestling with 
            complex spreadsheets, hunting down cost estimates from dozens of sources, and trying to figure 
            out if our numbers made any sense. We wanted to know: could this actually work financially?
          </p>
          <p>
            The existing tools were either too simple (generic farm calculators that didn't understand 
            viticulture) or too expensive (consultant fees running into thousands of dollars). We needed 
            something in between—something that understood the unique economics of vineyards but was 
            accessible to regular people with big dreams.
          </p>
          <p>
            So we built it. Vine Pioneer is the tool we wish we'd had when we were planning our own 
            vineyard projects. It handles the tedious calculations, organizes the costs, and lets you 
            focus on the exciting part: designing your future vineyard.
          </p>
        </div>
      </section>

      {/* What We're Building Section */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">What We're Building</h2>
          <div className="space-y-6 text-gray-600">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Right Now: Financial Planning</h3>
              <p className="text-lg">
                Our current focus is helping you answer the fundamental question: "What will this cost, 
                and when will it pay off?" The planner lets you model different scenarios, compare strategies, 
                and generate projections that lenders will take seriously.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Coming Soon: Operations Tools</h3>
              <p className="text-lg">
                Once you've planted your vineyard, you'll need different tools—tracking spray schedules, 
                monitoring soil conditions, managing compliance documents. We're building these next, 
                creating a seamless transition from planning to day-to-day operations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Who This Is For Section */}
      <section className="mx-auto max-w-4xl px-6 py-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">Who This Is For</h2>
        <div className="space-y-8">
          <PersonaCard
            title="First-Time Vineyard Owners"
            description="You have land, a vision, and maybe some winemaking knowledge—but the business side feels overwhelming. You need to know what this will really cost and whether it can work financially."
          />
          <PersonaCard
            title="Aspiring Grape Growers"
            description="You want to grow grapes for other wineries but need to understand the economics: how much to plant, what yields to expect, and when you'll break even on your investment."
          />
          <PersonaCard
            title="Existing Operations Planning Expansion"
            description="You already have a vineyard and you're considering adding acreage, switching from bulk to bottling, or trying a different business model. You need to model the scenarios before committing."
          />
          <PersonaCard
            title="Anyone Pitching to Lenders"
            description="Whether it's USDA FSA loans or commercial financing, you need professional projections that show you've done your homework and understand the numbers."
          />
        </div>
      </section>

      {/* Our Approach Section */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Approach</h2>
          <div className="prose prose-lg text-gray-600 space-y-4">
            <p>
              We're not trying to be everything to everyone. We're focused on building tools that solve 
              real problems for people planning and operating vineyards. That means:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Using real-world data from USDA reports, university extension services, and actual vineyard operations</li>
              <li>Making every calculation transparent—you can see where the numbers come from and adjust them for your situation</li>
              <li>Focusing on practical outputs like lender-ready reports and actionable insights, not just pretty charts</li>
              <li>Keeping it free for the core planning tools because we remember what it's like to be starting out</li>
            </ul>
            <p>
              We're still early. Things will evolve, features will be added, and we'll make mistakes along 
              the way. But we're committed to building something genuinely useful for the vineyard community.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-vine-green-500 py-16">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to Start Planning?
          </h2>
          <p className="text-lg text-vine-green-50 mb-8">
            See if your vineyard idea can work financially. No sign-up required.
          </p>
          <Link
            to="/planner"
            className="inline-block rounded-md bg-white px-8 py-3 text-base font-semibold text-vine-green-500 shadow-sm hover:bg-vine-green-50"
          >
            Open the Planner
          </Link>
        </div>
      </section>
    </div>
  );
}

function PersonaCard({ title, description }) {
  return (
    <div className="bg-white p-6 rounded-lg border-l-4 border-vine-green-500">
      <h3 className="text-xl font-semibold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
}