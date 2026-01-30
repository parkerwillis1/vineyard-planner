import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative bg-black py-24 sm:py-32 overflow-hidden">
        {/* Background Image with Grayscale */}
        <div
          className="absolute inset-0 bg-cover"
          style={{
            backgroundImage: 'url(/vineyardsunset.jpg)',
            backgroundPosition: 'center 30%',
            filter: 'grayscale(100%)',
          }}
        />
        {/* Dark Overlay for Text Readability */}
        <div className="absolute inset-0 bg-black/60" />

        {/* Content */}
        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl mb-6">
            Our Story
          </h1>
          <p className="mt-4 text-xl leading-8 text-gray-300 max-w-2xl mx-auto">
            Why we built tools for vineyard dreamers
          </p>
        </div>
      </section>

      {/* Main Story Section */}
      <section className="mx-auto max-w-3xl px-6 py-20">
        <div className="prose prose-lg max-w-none">
          <div className="space-y-8 text-lg text-gray-700 leading-relaxed">
            <p className="text-2xl font-semibold text-black">
              It started with a dream and a lot of spreadsheets.
            </p>

            <p>
              Like many of you reading this, I fell in love with the idea of owning a vineyard. The romance of
              working the land, the satisfaction of producing something tangible, the deep connection to place
              and season. But when I sat down to actually plan it out, I hit a wall.
            </p>

            <p>
              The reality check came fast: How much would this actually cost? What kind of returns could I expect?
              When would I break even? How many vines per acre? What about irrigation, trellis systems, equipment?
              Every question led to ten more questions.
            </p>

            <p>
              I spent weeks, honestly months, building spreadsheets. Hunting down cost estimates from different
              regions. Reading USDA reports. Calling equipment suppliers. Trying to piece together something that
              resembled a real financial plan. The information was out there, scattered across dozens of sources,
              but there was no single place that brought it all together.
            </p>

            <p>
              Even worse, I had no idea if my numbers were right. Was I underestimating costs? Being too optimistic
              about yields? Making rookie mistakes that would sink the whole project? I considered hiring a
              consultant, but the quotes I got were $5,000-$15,000 just for a feasibility study. That felt like
              a lot to spend before I even knew if this was viable.
            </p>

            <p>
              So I kept building my spreadsheets, second-guessing every formula, and wondering if there was a
              better way.
            </p>

            <div className="border-l-4 border-black pl-6 my-8">
              <p className="text-xl italic text-gray-900">
                "There had to be a tool that understood vineyards specifically, not just generic farm calculators, but
                was accessible to regular people with vineyard dreams."
              </p>
            </div>

            <p>
              That's when I decided to build it myself. Not just for me, but for everyone else wrestling with the
              same questions. People who have land and a vision but need to know if the numbers work. People who
              want to understand the economics before they commit hundreds of thousands of dollars.
            </p>

            <p>
              Trellis is the tool I wish I'd had. It handles the tedious calculations, organizes the costs,
              incorporates real industry data, and lets you focus on the exciting part: designing your future
              vineyard. You can model different scenarios, compare strategies, and see exactly where your money
              goes, all in a fraction of the time it took me with spreadsheets.
            </p>

            <p>
              We're still early. We're adding features, refining calculations, and learning from the community.
              But the core mission remains the same: making vineyard planning accessible, transparent, and actually
              useful for people who are serious about turning their vineyard dreams into reality.
            </p>

            <p className="text-xl font-semibold text-black pt-8">
              If you're where I was, excited about the possibility but overwhelmed by the planning, I hope this
              tool helps you take that first step with confidence.
            </p>
          </div>
        </div>
      </section>

      {/* Simple About Info */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-3xl px-6">
          <div className="bg-white border-2 border-black p-10 rounded-lg">
            <h2 className="text-2xl font-bold text-black mb-6">What We're Building</h2>
            <div className="space-y-6 text-gray-700">
              <div>
                <h3 className="font-bold text-black mb-2">Financial Planning Tools (Available Now)</h3>
                <p>
                  Comprehensive vineyard planning calculators that help you model costs, revenues, and projections.
                  From land acquisition to harvest, track every expense and revenue stream over 30 years.
                </p>
              </div>
              <div>
                <h3 className="font-bold text-black mb-2">Operations Management (Available Now)</h3>
                <p>
                  Tools for day-to-day vineyard operations including field mapping, task management, irrigation
                  tracking, and satellite monitoring. Bringing the same level of detail to operations as we do
                  to planning.
                </p>
              </div>
              <div>
                <h3 className="font-bold text-black mb-2">Wine Production (In Development)</h3>
                <p>
                  Complete production tracking from crush to bottle. Monitor fermentation temperatures, track barrel aging, log additives and adjustments, and maintain detailed batch records for compliance and quality control.
                </p>
              </div>
              <div>
                <h3 className="font-bold text-black mb-2">Inventory Management (In Development)</h3>
                <p>
                  Real-time inventory tracking across your entire operation. Manage incoming grape purchases, track wine lots through production stages, monitor bottle stock levels, and automate reorder alerts for supplies and materials.
                </p>
              </div>
              <div>
                <h3 className="font-bold text-black mb-2">Sales & Distribution (In Development)</h3>
                <p>
                  Integrated CRM and order management system. Handle direct-to-consumer sales, manage wine club memberships and shipments, track distributor relationships, and generate sales reports to understand your revenue streams.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative bg-black py-20 sm:py-24">
        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to Start Planning Your Vineyard?
          </h2>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            See if your vineyard idea can work financially. Get started in minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/planner"
              className="inline-flex items-center justify-center rounded-lg bg-white px-8 py-4 text-base font-semibold text-black hover:bg-gray-100 transition-all"
            >
              Open the Planner
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link
              to="/products"
              className="inline-flex items-center justify-center rounded-lg border-2 border-white px-8 py-4 text-base font-semibold text-white hover:bg-white hover:text-black transition-all"
            >
              View All Tools
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
