import { Link } from "react-router-dom";
import DocsLayout from "../DocsLayout";
import { DocsHeader, Section, FeatureGrid, Callout, NextSteps } from "../DocsComponents";
import { LayoutGrid, DollarSign, Sprout, TrendingUp, FileText, Settings } from "lucide-react";

export default function PlannerOverview() {
  const features = [
    {
      icon: <LayoutGrid className="w-6 h-6 text-blue-600" />,
      title: "Design Tab",
      description: "Configure vineyard layout, vine spacing, trellis systems, and irrigation infrastructure with automatic material cost calculations.",
      link: "/docs/planner/design",
    },
    {
      icon: <DollarSign className="w-6 h-6 text-green-600" />,
      title: "Financial Inputs",
      description: "Set land costs, construction budgets, establishment expenses, and operating costs with industry-standard defaults.",
      link: "/docs/planner/financial-inputs",
    },
    {
      icon: <Sprout className="w-6 h-6 text-emerald-600" />,
      title: "Vineyard Setup",
      description: "View complete Year 0 investment breakdown including land acquisition, site preparation, and infrastructure costs.",
      link: "/docs/planner/vineyard-setup",
    },
    {
      icon: <TrendingUp className="w-6 h-6 text-purple-600" />,
      title: "10-Year Plan",
      description: "Analyze year-by-year revenue, costs, cash flow, and cumulative profitability with automatic yield curve modeling.",
      link: "/docs/planner/ten-year-plan",
    },
    {
      icon: <FileText className="w-6 h-6 text-orange-600" />,
      title: "Details Tab",
      description: "Deep dive into equipment purchases, loan terms, and detailed cost assumptions for each year of your projection.",
      link: "/docs/planner/details",
    },
    {
      icon: <Settings className="w-6 h-6 text-gray-600" />,
      title: "Financial Formulas",
      description: "Understand exactly how revenue, costs, yield curves, and lender ratios are calculated behind the scenes.",
      link: "/docs/planner/formulas",
    },
  ];

  return (
    <DocsLayout>
      <DocsHeader
        title="Vineyard Planner"
        subtitle="Create professional 10-year financial projections for your vineyard with detailed cost modeling and revenue forecasting."
      />

      <Callout type="success" title="Free Forever">
        The Vineyard Planner is 100% free with no credit card required. Save unlimited plans, create multiple scenarios, and export reports to PDF.
      </Callout>

      <Section title="Overview">
        <p>
          The Vineyard Planner helps you answer the fundamental question every vineyard investor needs to know: <strong>"What will this cost, and when will it become profitable?"</strong>
        </p>
        <p>
          Built on industry-standard data from USDA reports, university viticulture research, and real vineyard operations, the planner provides realistic financial projections that lenders trust and investors can act on.
        </p>
        <p>
          Unlike generic farm calculators, our tool understands the unique economics of vineyards—multi-year establishment timelines, yield curve progression, trellis and irrigation systems, and the capital intensity of estate bottling versus bulk grape sales.
        </p>
      </Section>

      <Section title="Key Features">
        <FeatureGrid features={features} />
      </Section>

      <Section title="What You'll Get">
        <div className="space-y-4">
          <div className="flex gap-4 pb-4 border-b border-gray-200">
            <div className="flex-shrink-0 w-8 h-8 bg-vine-green-100 text-vine-green-700 rounded-full flex items-center justify-center font-bold text-sm">
              1
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Complete Establishment Budget</h4>
              <p className="text-sm text-gray-600">
                Itemized Year 0 costs including land, site prep, trellis, irrigation, vine stock, fencing, and buildings. Know exactly what you need to raise before breaking ground.
              </p>
            </div>
          </div>

          <div className="flex gap-4 pb-4 border-b border-gray-200">
            <div className="flex-shrink-0 w-8 h-8 bg-vine-green-100 text-vine-green-700 rounded-full flex items-center justify-center font-bold text-sm">
              2
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">10-Year Cash Flow Projections</h4>
              <p className="text-sm text-gray-600">
                Year-by-year breakdown of revenue (modeled on realistic yield curves), operating costs, debt service, and net cash flow. See when you'll break even and achieve profitability.
              </p>
            </div>
          </div>

          <div className="flex gap-4 pb-4 border-b border-gray-200">
            <div className="flex-shrink-0 w-8 h-8 bg-vine-green-100 text-vine-green-700 rounded-full flex items-center justify-center font-bold text-sm">
              3
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Lender-Ready Metrics</h4>
              <p className="text-sm text-gray-600">
                Debt Service Coverage Ratio (DSCR), cumulative cash position, ROI timelines, and other key metrics banks want to see. Export professional reports for loan applications.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-vine-green-100 text-vine-green-700 rounded-full flex items-center justify-center font-bold text-sm">
              4
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Scenario Modeling</h4>
              <p className="text-sm text-gray-600">
                Create multiple plans to compare bottling vs. bulk sales, different grape varieties, financing structures, and acreage options. Make data-driven decisions before committing capital.
              </p>
            </div>
          </div>
        </div>
      </Section>

      <div className="bg-gradient-to-br from-blue-50 to-teal-50 rounded-2xl p-8 border border-blue-100 my-12">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Ready to start planning?</h3>
            <p className="text-gray-700 mb-4 leading-relaxed">
              Follow our Quick Start Guide to create your first financial projection in under 10 minutes.
            </p>
            <Link
              to="/docs/getting-started/quick-start"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Quick Start Guide →
            </Link>
          </div>
        </div>
      </div>

      <NextSteps
        links={[
          {
            title: "Design Tab Reference",
            description: "Configure vineyard layout and calculate material costs",
            href: "/docs/planner/design",
          },
          {
            title: "Financial Inputs Reference",
            description: "Set up costs, revenue assumptions, and financing terms",
            href: "/docs/planner/financial-inputs",
          },
          {
            title: "Best Practices",
            description: "Tips for creating accurate, lender-ready projections",
            href: "/docs/planner/best-practices",
          },
          {
            title: "Financial Formulas",
            description: "See exactly how calculations work under the hood",
            href: "/docs/planner/formulas",
          },
        ]}
      />
    </DocsLayout>
  );
}
