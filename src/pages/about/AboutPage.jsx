import { Link } from "react-router-dom";
import { Sprout, TrendingUp, Users, Target, Heart, Lightbulb, CheckCircle } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-vine-green-600 via-vine-green-500 to-teal-500 py-24 sm:py-32">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-white/20 backdrop-blur-sm rounded-full mb-6">
            <Sprout className="w-8 h-8 text-white" strokeWidth={1.5} />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl mb-6">
            Our Story
          </h1>
          <p className="mt-4 text-xl leading-8 text-white/90 max-w-2xl mx-auto">
            Built by vineyard dreamers, for vineyard dreamers. We're turning vineyard planning from overwhelming to achievable.
          </p>
        </div>
      </section>

      {/* Why We Started Section */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-vine-green-100 text-vine-green-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <Heart className="w-4 h-4" strokeWidth={1.5} />
              The Beginning
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">Why We Started This</h2>
            <div className="space-y-4 text-lg text-gray-600 leading-relaxed">
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
          </div>
          <div className="bg-gradient-to-br from-vine-green-50 to-teal-50 rounded-2xl p-8 sm:p-12">
            <div className="space-y-6">
              <StatItem number="$0" label="Cost to start planning" />
              <StatItem number="10 min" label="To create your first projection" />
              <StatItem number="100%" label="Transparent calculations" />
            </div>
          </div>
        </div>
      </section>

      {/* What We're Building Section */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-teal-100 text-teal-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <Target className="w-4 h-4" strokeWidth={1.5} />
              Our Roadmap
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">What We're Building</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We're focused on creating tools that grow with you—from planning to planting to producing.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl p-8 shadow-sm border-2 border-vine-green-500">
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0 w-12 h-12 bg-vine-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-vine-green-600" strokeWidth={1.5} />
                </div>
                <div>
                  <span className="inline-block px-3 py-1 bg-vine-green-100 text-vine-green-700 text-xs font-semibold rounded-full mb-2">
                    Available Now
                  </span>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Financial Planning</h3>
                </div>
              </div>
              <p className="text-gray-600 leading-relaxed">
                Answer the fundamental question: "What will this cost, and when will it pay off?" Model different
                scenarios, compare strategies, and generate projections that lenders will take seriously.
              </p>
            </div>
            <div className="bg-white rounded-xl p-8 shadow-sm border-2 border-gray-200">
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0 w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                  <Lightbulb className="w-6 h-6 text-teal-600" strokeWidth={1.5} />
                </div>
                <div>
                  <span className="inline-block px-3 py-1 bg-teal-100 text-teal-700 text-xs font-semibold rounded-full mb-2">
                    In Development
                  </span>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Operations Tools</h3>
                </div>
              </div>
              <p className="text-gray-600 leading-relaxed">
                Track spray schedules, monitor soil conditions, manage compliance documents, and handle day-to-day
                vineyard management. Creating a seamless transition from planning to operations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Who This Is For Section */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-vine-green-100 text-vine-green-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
            <Users className="w-4 h-4" strokeWidth={1.5} />
            Who We Help
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Who This Is For</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Whether you're starting from scratch or growing an existing operation, we're here to help you plan smarter.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 gap-6">
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
      <section className="bg-gradient-to-br from-gray-50 to-vine-green-50/30 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-teal-100 text-teal-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <TrendingUp className="w-4 h-4" strokeWidth={1.5} />
              Our Philosophy
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Our Approach</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We're not trying to be everything to everyone. We're focused on solving real problems for vineyard planners.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <ValueCard
              title="Real-World Data"
              description="USDA reports, university research, and actual vineyard operations inform our models."
            />
            <ValueCard
              title="100% Transparent"
              description="See exactly where every number comes from and adjust it for your specific situation."
            />
            <ValueCard
              title="Practical Outputs"
              description="Lender-ready reports and actionable insights, not just pretty visualizations."
            />
            <ValueCard
              title="Accessible Pricing"
              description="Core planning tools are free because we remember what it's like to start out."
            />
          </div>
          <div className="bg-white rounded-xl p-8 sm:p-10 shadow-sm max-w-4xl mx-auto">
            <p className="text-lg text-gray-600 leading-relaxed text-center">
              We're still early. Things will evolve, features will be added, and we'll make mistakes along
              the way. But we're committed to building something genuinely useful for the vineyard community.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative bg-gradient-to-br from-vine-green-600 via-vine-green-500 to-teal-500 py-20 sm:py-24 overflow-hidden">
        {/* Decorative background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>

        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to Start Planning?
          </h2>
          <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
            See if your vineyard idea can work financially. Get started in minutes—no sign-up required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/planner"
              className="inline-flex items-center justify-center rounded-lg bg-white px-8 py-4 text-base font-semibold text-vine-green-600 shadow-lg hover:bg-vine-green-50 transition-all hover:scale-105"
            >
              Open the Planner
              <TrendingUp className="ml-2 w-5 h-5" strokeWidth={1.5} />
            </Link>
            <Link
              to="/products"
              className="inline-flex items-center justify-center rounded-lg bg-vine-green-700 px-8 py-4 text-base font-semibold text-white shadow-lg hover:bg-vine-green-800 transition-all"
            >
              View All Tools
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatItem({ number, label }) {
  return (
    <div className="text-center py-6 border-b border-vine-green-200 last:border-0">
      <div className="text-4xl sm:text-5xl font-bold text-vine-green-600 mb-2">{number}</div>
      <div className="text-sm sm:text-base text-gray-600 font-medium">{label}</div>
    </div>
  );
}

function PersonaCard({ title, description }) {
  return (
    <div className="bg-white p-6 sm:p-8 rounded-xl border-2 border-gray-200 hover:border-vine-green-500 transition-all hover:shadow-lg group">
      <div className="w-12 h-12 bg-vine-green-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-vine-green-500 transition-colors">
        <CheckCircle className="w-6 h-6 text-vine-green-600 group-hover:text-white" strokeWidth={1.5} />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
}

function ValueCard({ title, description }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <h4 className="text-lg font-bold text-gray-900 mb-2">{title}</h4>
      <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
}