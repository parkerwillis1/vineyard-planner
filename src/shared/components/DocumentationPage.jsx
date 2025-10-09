import { Link } from "react-router-dom";
import { useState } from "react";

export default function DocumentationPage() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-vine-green-50 to-white py-20">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Documentation
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Everything you need to master vineyard financial planning and modeling.
          </p>
        </div>
      </section>

      {/* Quick Start Guide */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">🚀 Quick Start Guide</h2>
        <div className="bg-vine-green-50 rounded-2xl p-8 mb-12">
          <ol className="space-y-4">
            <Step 
              number="1" 
              title="Set Your Timeline"
              description="Choose your projection period (1-30 years) using the Years input at the top right."
            />
            <Step 
              number="2" 
              title="Design Your Vineyard"
              description="Configure vine spacing, plot shape, and material requirements in the Design tab."
            />
            <Step 
              number="3" 
              title="Enter Financial Data"
              description="Input acreage, costs, pricing, and choose between bottled wine or bulk grape sales."
            />
            <Step 
              number="4" 
              title="Configure Setup Costs"
              description="Toggle setup items (trellis, irrigation, fencing) and adjust per-acre costs."
            />
            <Step 
              number="5" 
              title="Add Financing"
              description="Include equipment purchases and loans with custom rates and terms."
            />
            <Step 
              number="6" 
              title="Review Projections"
              description="Analyze break-even timeline, cash flow, and profitability in the projection tabs."
            />
          </ol>
        </div>
      </section>

      {/* Tab-by-Tab Reference */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">📋 Feature Guide</h2>
          <div className="grid grid-cols-1 gap-6">
            <FeatureSection
              title="Design Tab"
              description="Plan your vineyard layout with precision"
              features={[
                "Calculate optimal vine spacing patterns",
                "Choose vineyard shape (rectangle, square, custom)",
                "Set length-to-width ratio for your plot",
                "Configure row orientation for sun exposure",
                "Auto-calculate total vines, rows, and material needs"
              ]}
            />
            <FeatureSection
              title="Financial Inputs Tab"
              description="Configure all financial parameters"
              features={[
                "Core parameters: acreage, pricing, and sales strategy",
                "Setup costs: land, building, site preparation",
                "Operating costs: pre-planting, planting, cultural operations",
                "Equipment and loan financing options",
                "Permits, licenses, and insurance"
              ]}
            />
            <FeatureSection
              title="Vineyard Setup Tab"
              description="Visualize Year 0 establishment costs"
              features={[
                "Visual breakdown of initial investment",
                "Interactive cost cards by category",
                "Financing summary with loan details",
                "Net capital required calculation",
                "Per-acre cost analysis"
              ]}
            />
            <FeatureSection
              title="Projection Tab"
              description="Multi-year financial forecasting"
              features={[
                "Year-by-year revenue and cost projections",
                "Break-even analysis and timeline",
                "Cumulative cash flow tracking",
                "Interactive charts and data tables",
                "Yield maturation curves (years 1-6+)"
              ]}
            />
            <FeatureSection
              title="Details Tab"
              description="Deep-dive analytics and insights"
              features={[
                "Comprehensive cost breakdown analysis",
                "Bottle economics and pricing strategies",
                "Profitability metrics and ROI calculations",
                "Lender ratios (LTC, LTV, DSCR)",
                "Scenario sensitivity analysis"
              ]}
            />
          </div>
        </div>
      </section>

      {/* Key Concepts */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">💡 Key Concepts</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <ConceptCard
            title="Sales Strategies"
            content={
              <>
                <p className="mb-3"><strong>Bottle Wine:</strong> Grow, vinify, and sell your own branded wine. Higher margins but requires winery infrastructure and licensing.</p>
                <p><strong>Bulk Grapes:</strong> Sell all grape yields to other wineries. Lower revenue per ton but simpler operations and less capital required.</p>
              </>
            }
          />
          <ConceptCard
            title="Break-Even Timeline"
            content={
              <p>The year when cumulative cash flow turns positive. Typical vineyards break even in years 6-10, depending on financing, costs, and pricing strategy.</p>
            }
          />
          <ConceptCard
            title="Yield Maturation"
            content={
              <p>Vines don't produce full yields immediately. Years 1-3: zero production. Year 4: 1 ton/acre. Year 5: 2.5 tons/acre. Year 6+: full production (3.5 tons/acre average).</p>
            }
          />
          <ConceptCard
            title="Lender Ratios"
            content={
              <>
                <p className="mb-2"><strong>LTC (Loan-to-Cost):</strong> Total loans ÷ total project cost</p>
                <p className="mb-2"><strong>LTV (Loan-to-Value):</strong> Total loans ÷ (land + improvements)</p>
                <p>Lenders typically want LTC below 80% and LTV below 75%.</p>
              </>
            }
          />
        </div>
      </section>

      {/* Financial Formulas */}
      <section className="bg-vine-green-50 py-16">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">📊 Financial Formulas</h2>
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormulaCard
                name="Bottle Production"
                formula="Acres × Tons/acre × 756 bottles/ton"
              />
              <FormulaCard
                name="Wine Revenue"
                formula="Bottles Sold × Bottle Price"
              />
              <FormulaCard
                name="Grape Revenue"
                formula="Tons Sold × Price per Ton"
              />
              <FormulaCard
                name="Net Profit"
                formula="Revenue − Total Costs"
              />
              <FormulaCard
                name="Cumulative Cash Flow"
                formula="Σ Net Profit (Year 0 through Year N)"
              />
              <FormulaCard
                name="Break-Even Year"
                formula="First year where Cumulative CF ≥ 0"
              />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">❓ Frequently Asked Questions</h2>
        <div className="space-y-4">
          <FAQItem
            question="Why is my break-even year showing '>10'?"
            answer="Your annual operating costs plus debt service exceed your revenue at full production. Try reducing costs, increasing bottle price, or adjusting your financing structure."
          />
          <FAQItem
            question="How accurate are the default cost estimates?"
            answer="Our defaults are based on USDA data and industry averages for small-to-medium vineyards. However, costs vary significantly by region, soil type, and local labor rates. Always customize inputs for your specific situation."
          />
          <FAQItem
            question="Can I model a phased expansion?"
            answer="Yes! Use the 'Setup Year' field to delay vineyard establishment, or create multiple plans to compare different timing scenarios."
          />
          <FAQItem
            question="What's included in 'Operating Cost'?"
            answer="All recurring annual expenses: pruning, fertilizer, spraying, harvest labor, irrigation, utilities, insurance, property taxes, and general overhead. Equipment financing and debt service are calculated separately."
          />
          <FAQItem
            question="How do I save my plan?"
            answer="Click the green 'Save' button in the top right. If you're signed in, your plan is automatically saved to your account and accessible from 'My Plans'."
          />
          <FAQItem
            question="Can I export my financial projections?"
            answer="Yes! You can copy the projection table data and paste it into Excel or Google Sheets. A formal PDF export feature is coming soon."
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-vine-green-600 py-16">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to Start Planning?
          </h2>
          <p className="text-lg text-vine-green-100 mb-8">
            Use these tools to create a comprehensive financial model for your vineyard.
          </p>
          <Link
            to="/planner"
            className="inline-block rounded-md bg-white px-8 py-3 text-base font-semibold text-vine-green-600 shadow-sm hover:bg-vine-green-50"
          >
            Open Planner
          </Link>
        </div>
      </section>
    </div>
  );
}

// Helper Components
function Step({ number, title, description }) {
  return (
    <li className="flex gap-4">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-vine-green-600 text-white flex items-center justify-center font-bold">
        {number}
      </div>
      <div>
        <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </div>
    </li>
  );
}

function FeatureSection({ title, description, features }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 mb-4">{description}</p>
      <ul className="space-y-2">
        {features.map((feature, idx) => (
          <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
            <span className="text-vine-green-600 mt-0.5">✓</span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ConceptCard({ title, content }) {
  return (
    <div className="bg-white p-6 rounded-lg border-l-4 border-vine-green-600">
      <h3 className="text-xl font-semibold text-gray-900 mb-3">{title}</h3>
      <div className="text-gray-600">{content}</div>
    </div>
  );
}

function FormulaCard({ name, formula }) {
  return (
    <div className="border-l-4 border-vine-green-600 pl-4">
      <div className="font-semibold text-gray-900 mb-1">{name}</div>
      <code className="text-sm text-gray-600 bg-gray-50 px-2 py-1 rounded">{formula}</code>
    </div>
  );
}

function FAQItem({ question, answer }) {
  const [open, setOpen] = useState(false);
  
  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50"
      >
        <span className="font-semibold text-gray-900">{question}</span>
        <span className="text-vine-green-600 text-xl">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="px-6 pb-4 text-gray-600">
          {answer}
        </div>
      )}
    </div>
  );
}