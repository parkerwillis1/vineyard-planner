import DocsLayout from "../DocsLayout";
import { DocsHeader, Section, Callout, Steps, NextSteps } from "../DocsComponents";
import { Calculator, Sprout } from "lucide-react";

export default function QuickStartPage() {
  const steps = [
    {
      title: "Set Your Projection Timeline",
      description: "Use the 'Years' input at the top right to set your planning horizon (1-30 years). Most vineyard business plans use 10-15 years to capture full maturation and profitability.",
    },
    {
      title: "Design Your Vineyard Layout",
      description: "In the Design tab, configure vine spacing (standard options from 4×8' to 8×12'), choose your plot shape (rectangle, square, or custom ratio), set row orientation for optimal sun exposure, and let the calculator determine total vines needed, row count, and material requirements.",
    },
    {
      title: "Input Core Financial Parameters",
      description: "Enter your acreage, land cost per acre, building/winery construction costs. Choose your sales strategy: bottled wine (direct-to-consumer or wholesale) or bulk grape sales to other wineries. Each strategy has different revenue models and capital requirements.",
    },
    {
      title: "Configure Establishment Costs",
      description: "Toggle setup items (site preparation, trellis systems, irrigation, vine stock, fencing) and customize per-acre costs. The Design tab auto-calculates trellis and irrigation costs based on your vineyard dimensions.",
    },
    {
      title: "Add Operating Cost Details",
      description: "Customize annual operating costs including pre-planting, planting, cultural operations (pruning, canopy management, pest control), harvest and hauling, assessments, overhead, equipment operations, and marketing.",
    },
    {
      title: "Model Your Financing",
      description: "Add equipment purchases with financing terms (tractors, sprayers, harvesters). Include loans (USDA FSA Microloans, Farm Ownership loans, commercial LOCs) with accurate interest rates and terms. The model calculates monthly payments and total debt service.",
    },
    {
      title: "Review Projections and Refine",
      description: "Jump to Vineyard Setup to see Year 0 investment breakdown, then Projection tab for year-by-year cash flow. Review break-even timeline, cumulative profitability, and adjust assumptions until your model reflects realistic scenarios.",
    },
  ];

  return (
    <DocsLayout>
      <DocsHeader
        title="Quick Start Guide"
        subtitle="Create your first vineyard financial projection in under 10 minutes."
      />

      <Callout type="tip" title="New to Vine Pioneer?">
        This guide walks you through creating your first financial plan using the Vineyard Planner tool. You'll go from zero to a complete 10-year projection with detailed cost breakdowns and revenue forecasts.
      </Callout>

      <Section title="Getting Started">
        <p>
          The Vineyard Planner helps you answer the fundamental question: <strong>"What will this vineyard cost, and when will it become profitable?"</strong>
        </p>
        <p>
          You'll configure vineyard dimensions, establishment costs, operating expenses, and revenue assumptions. The tool automatically generates multi-year financial projections based on industry-standard yield curves and cost models.
        </p>
      </Section>

      <Section title="Step-by-Step Setup">
        <Steps steps={steps} />
      </Section>

      <Section title="What You'll Get">
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calculator className="w-5 h-5 text-blue-600" />
              </div>
              <h4 className="font-semibold text-gray-900">10-Year Financial Model</h4>
            </div>
            <p className="text-sm text-gray-600">
              Year-by-year breakdown of revenue, costs, cash flow, and cumulative profitability with automatic yield curve modeling.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Sprout className="w-5 h-5 text-green-600" />
              </div>
              <h4 className="font-semibold text-gray-900">Establishment Budget</h4>
            </div>
            <p className="text-sm text-gray-600">
              Complete Year 0 setup costs including land, site prep, trellis, irrigation, vines, and infrastructure.
            </p>
          </div>
        </div>
      </Section>

      <Callout type="note" title="Save Your Work">
        Sign up for a free account to save your plans, create multiple scenarios, and export reports. No credit card required.
      </Callout>

      <NextSteps
        links={[
          {
            title: "Core Concepts",
            description: "Understand key vineyard planning terminology and financial concepts",
            href: "/docs/getting-started/concepts",
          },
          {
            title: "Design Tab Reference",
            description: "Deep dive into vineyard layout configuration and material calculations",
            href: "/docs/planner/design",
          },
          {
            title: "Financial Formulas",
            description: "See exactly how revenue, costs, and profitability are calculated",
            href: "/docs/planner/formulas",
          },
          {
            title: "Best Practices",
            description: "Tips for creating accurate, lender-ready financial projections",
            href: "/docs/planner/best-practices",
          },
        ]}
      />
    </DocsLayout>
  );
}
