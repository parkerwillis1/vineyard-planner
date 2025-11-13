import DocsLayout from "./DocsLayout";
import { DocsHeader, Section, Callout } from "./DocsComponents";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

export default function FAQPage() {
  const faqs = [
    {
      category: "Getting Started",
      questions: [
        {
          q: "Do I need an account to use the Financial Planner?",
          a: "No! The Financial Planner is completely free to use without signing up. However, creating a free account lets you save your plans, create multiple scenarios, and export reports.",
        },
        {
          q: "How accurate are the financial projections?",
          a: "Our models are based on USDA data, university viticulture research, and real vineyard operations. However, actual results vary by region, varietals, weather, market conditions, and management practices. Always verify assumptions with local experts and customize inputs for your specific situation.",
        },
        {
          q: "Can I use this for existing vineyards or only new plantings?",
          a: "Both! You can model new vineyards from scratch or use the planner to forecast expansion scenarios, compare bottling vs. bulk sales strategies, or analyze replanting decisions for existing operations.",
        },
      ],
    },
    {
      category: "Financial Planning",
      questions: [
        {
          q: "What's included in establishment costs?",
          a: "Establishment costs (Year 0) include land acquisition, site preparation, trellis systems, irrigation infrastructure, vine stock, fencing, buildings/winery construction, and initial equipment purchases. Typical range: $15,000-$40,000 per acre.",
        },
        {
          q: "How does the yield curve work?",
          a: "Year 1-2: No production (vines establishing). Year 3: First light crop (~25% of mature yield). Year 4-5: Increasing yields (50-75%). Year 6+: Full production (3-5 tons/acre for most varieties). You can customize these assumptions in the Financial Inputs tab.",
        },
        {
          q: "When should I expect to break even?",
          a: "Most vineyards break even (cumulative cash flow turns positive) in Year 7-12 depending on production model (bulk vs. bottling), debt load, operating costs, and grape/wine prices. Bulk sales break even faster but with lower long-term margins.",
        },
        {
          q: "What is Debt Service Coverage Ratio (DSCR)?",
          a: "DSCR = Net Operating Income ÷ Annual Debt Payments. Banks typically require DSCR ≥ 1.25 (income is 125% of debt obligations). Below 1.0 means you cannot cover debt payments from operations. The planner calculates this automatically in the 10-Year Plan tab.",
        },
      ],
    },
    {
      category: "Vineyard Operations",
      questions: [
        {
          q: "Is the Operations module available now?",
          a: "The Vineyard Operations module is currently in beta. Sign up for early access to try block management, irrigation scheduling, task management, and analytics before general availability.",
        },
        {
          q: "How does satellite monitoring work?",
          a: "We integrate with Sentinel-2 satellite imagery to provide NDVI (Normalized Difference Vegetation Index) maps of your vineyard. NDVI shows vegetation health and can identify stress zones, irrigation issues, or disease pressure before visible to the naked eye.",
        },
        {
          q: "Can I connect soil sensors and weather stations?",
          a: "Yes! The Operations module supports integrations with common agricultural hardware including soil moisture sensors, weather stations, and irrigation flow meters. See the Hardware Integration documentation for supported devices.",
        },
      ],
    },
    {
      category: "Pricing & Billing",
      questions: [
        {
          q: "Is the Financial Planner really free forever?",
          a: "Yes! Core financial planning tools are 100% free with no credit card required. You can save unlimited plans, create scenarios, and export reports. Vineyard Operations features require a paid subscription (Starter tier and above).",
        },
        {
          q: "What's included in each pricing tier?",
          a: "Free tier: Financial Planner only. Starter ($29/mo): Operations tools, 50 acres, 2 team members. Professional ($79/mo): Unlimited acres, 10 team members, analytics. Enterprise (custom): White-label, API access, dedicated support. See /products for full details.",
        },
        {
          q: "Can I cancel anytime?",
          a: "Absolutely. Cancel anytime with no penalties. Your data is always yours—export at any time. Downgrading to the free tier preserves your financial plans; Operations data is archived (read-only) until you resubscribe.",
        },
      ],
    },
    {
      category: "Technical",
      questions: [
        {
          q: "Is my data secure?",
          a: "Yes. All data is encrypted in transit (HTTPS) and at rest (AES-256). Hosted on Supabase with SOC 2 compliance. We never sell your data. You own your plans and can export/delete at any time.",
        },
        {
          q: "Can I export my financial projections?",
          a: "Yes! Export to PDF for loan applications, or CSV for Excel analysis. All charts and tables export with full fidelity. Coming soon: Direct integration with QuickBooks and FarmBooks.",
        },
        {
          q: "Do you have an API?",
          a: "API access is available on Enterprise plans for custom integrations, white-label deployments, and programmatic data import/export. Contact us for API documentation.",
        },
      ],
    },
  ];

  return (
    <DocsLayout>
      <DocsHeader
        title="Frequently Asked Questions"
        subtitle="Quick answers to common questions about Vine Pioneer."
      />

      <Callout type="tip" title="Still have questions?">
        Can't find what you're looking for? Email us at{" "}
        <a href="mailto:support@vinepioneer.com" className="text-vine-green-600 underline">
          support@vinepioneer.com
        </a>{" "}
        or use the in-app chat.
      </Callout>

      {faqs.map((category, index) => (
        <Section key={index} title={category.category}>
          <div className="space-y-4">
            {category.questions.map((faq, qIndex) => (
              <FAQItem key={qIndex} question={faq.q} answer={faq.a} />
            ))}
          </div>
        </Section>
      ))}
    </DocsLayout>
  );
}

function FAQItem({ question, answer }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <span className="font-semibold text-gray-900 pr-4">{question}</span>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${
            isOpen ? "transform rotate-180" : ""
          }`}
        />
      </button>
      {isOpen && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <p className="text-gray-700 leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}
