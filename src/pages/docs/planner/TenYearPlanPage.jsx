import DocsLayout from "../DocsLayout";
import { DocsHeader, Section, Subsection, Callout, Table, NextSteps } from "../DocsComponents";

export default function TenYearPlanPage() {
  return (
    <DocsLayout>
      <DocsHeader
        title="10-Year Financial Plan"
        subtitle="Project revenue, expenses, cash flow, and profitability over 10 years with realistic yield curves and break-even analysis."
      />

      <Section title="Overview">
        <p>
          The 10-Year Plan view is your complete financial forecast from vineyard establishment through mature production. It shows year-by-year revenue, costs, profit/loss, and cumulative cash flow to help you understand when the operation becomes self-sustaining.
        </p>
        <p>
          The planner uses industry-standard yield ramp models (25%, 50%, 75%, 100% over Years 1-4) and accounts for financing costs, depreciation, and working capital needs. All projections are based on your Design tab layout and Financial Inputs assumptions.
        </p>
      </Section>

      <Section title="Projection Components">
        <Subsection title="Revenue Model">
          <p>
            Annual revenue is calculated from yield and pricing assumptions:
          </p>
          <div className="bg-gray-50 rounded p-4 font-mono text-sm mb-3">
            Revenue = Acres × Yield per Acre × Yield % × Price per Unit
          </div>
          <p>
            The yield percentage follows a realistic maturation curve:
          </p>
          <Table
            headers={["Year", "Yield %", "Rationale"]}
            rows={[
              ["Year 0", "0%", "Establishment only - no harvest"],
              ["Year 1", "0%", "First growing season - vines too young"],
              ["Year 2", "25%", "Light first crop - cluster thinning recommended"],
              ["Year 3", "50%", "Half crop - vines still developing"],
              ["Year 4", "75%", "Near-full crop - approaching maturity"],
              ["Year 5+", "100%", "Full production - mature vines"],
            ]}
          />
          <Callout type="tip" title="Conservative Estimates">
            The planner uses conservative yield ramps. In ideal conditions, some vineyards reach 75% yield by Year 3, but budget for the standard curve to avoid cash flow surprises.
          </Callout>
        </Subsection>

        <Subsection title="Operating Costs by Year">
          <p>
            Operating expenses are categorized and scale with production:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Year 0:</strong> Site prep, installation, first year maintenance = 100% establishment cost</li>
            <li><strong>Year 1:</strong> Pruning, spraying, irrigation, weed control = 60-70% of mature operating cost</li>
            <li><strong>Year 2:</strong> Young vine maintenance + light harvest = 75-85% of mature cost</li>
            <li><strong>Year 3+:</strong> Full operating costs as crop size increases</li>
          </ul>
          <p className="text-sm text-gray-600 mt-3">
            Operating costs include: labor, sprays, fertilizer, water, equipment fuel, maintenance, and overhead.
          </p>
        </Subsection>

        <Subsection title="Fixed Costs">
          <p>
            Annual expenses that don't vary with production:
          </p>
          <Table
            headers={["Fixed Cost", "Timing", "Notes"]}
            rows={[
              ["Property Tax", "Years 1-10", "Based on assessed land value"],
              ["Insurance", "Years 1-10", "Liability, crop, equipment coverage"],
              ["Utilities", "Years 1-10", "Power, water base fees"],
              ["Loan Payments", "Years 1-10+", "Land, development, equipment debt service"],
            ]}
          />
        </Subsection>

        <Subsection title="Depreciation">
          <p>
            The planner tracks depreciation for tax planning (not shown in cash flow):
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Trellis System:</strong> 15-year straight-line depreciation</li>
            <li><strong>Irrigation System:</strong> 10-year straight-line depreciation</li>
            <li><strong>Equipment:</strong> 5-7 year MACRS depreciation</li>
            <li><strong>Buildings:</strong> 20-39 year straight-line (depends on type)</li>
          </ul>
          <Callout type="note" title="Tax Deductions">
            Depreciation reduces taxable income but doesn't affect cash flow. Consult a CPA about Section 179 expensing and bonus depreciation for immediate deductions.
          </Callout>
        </Subsection>
      </Section>

      <Section title="Key Metrics">
        <Subsection title="Annual Profit/Loss">
          <p>
            Net income or loss for each year:
          </p>
          <div className="bg-gray-50 rounded p-4 font-mono text-sm mb-3">
            Profit = Revenue - Operating Costs - Fixed Costs - Depreciation - Interest
          </div>
          <p>
            Expect negative profit (losses) in Years 0-2, break-even or small profit in Year 3, and positive profit in Years 4+.
          </p>
        </Subsection>

        <Subsection title="Cumulative Cash Flow">
          <p>
            Running total of all cash in and out over time:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Year 0:</strong> Deeply negative (all investment, no revenue)</li>
            <li><strong>Years 1-3:</strong> Cumulative losses grow as operating costs exceed revenue</li>
            <li><strong>Year 4-6:</strong> Losses slow, approach breakeven</li>
            <li><strong>Year 7+:</strong> Cumulative cash flow turns positive, begins recovery of initial investment</li>
          </ul>
          <p className="text-sm text-gray-600 mt-3">
            The cumulative cash flow graph shows when you've recovered your initial capital and start earning true profit.
          </p>
        </Subsection>

        <Subsection title="Break-Even Analysis">
          <p>
            The planner calculates two break-even points:
          </p>
          <Table
            headers={["Break-Even Type", "Definition", "Typical Timeline"]}
            rows={[
              ["Operating Break-Even", "Revenue covers annual operating costs", "Year 3-4"],
              ["Cash Flow Break-Even", "Cumulative cash flow turns positive (recovered initial investment)", "Year 7-12"],
            ]}
          />
          <Callout type="warning" title="Long Payback Period">
            Vineyard investments typically take 10-15 years to fully recover initial capital. This is normal for agricultural perennials. If your model shows break-even sooner than Year 6, double-check your revenue assumptions—they may be too optimistic.
          </Callout>
        </Subsection>

        <Subsection title="Return on Investment (ROI)">
          <p>
            10-year cumulative return as percentage of initial investment:
          </p>
          <div className="bg-gray-50 rounded p-4 font-mono text-sm mb-3">
            ROI = (Total Profit Over 10 Years ÷ Initial Investment) × 100%
          </div>
          <p>
            Healthy vineyard ROI targets by Year 10:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Bulk Grape Sales:</strong> 30-60% ROI over 10 years</li>
            <li><strong>Wholesale Wine:</strong> 50-100% ROI over 10 years</li>
            <li><strong>DTC Wine Sales:</strong> 80-150% ROI over 10 years</li>
          </ul>
          <p className="text-sm text-gray-600 mt-3">
            These ROI figures assume mature production by Year 5 and stable pricing. Market volatility and weather risks can significantly impact actual returns.
          </p>
        </Subsection>
      </Section>

      <Section title="Chart Visualizations">
        <Subsection title="Revenue & Expense Stacked Area Chart">
          <p>
            Visual comparison of annual revenue vs. total expenses:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Green area = Revenue (grows as yield increases)</li>
            <li>Red area = Total expenses (high in Year 0, stabilizes in operating years)</li>
            <li>Gap between areas = Annual profit or loss</li>
          </ul>
          <p className="text-sm text-gray-600 mt-3">
            Watch for the crossover point where green exceeds red—that's operating break-even.
          </p>
        </Subsection>

        <Subsection title="Cumulative Cash Flow Line Chart">
          <p>
            Shows the running total of cash position over 10 years:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Starts deeply negative in Year 0 (investment outflow)</li>
            <li>Continues downward in Years 1-2 (losses accumulate)</li>
            <li>Flattens in Years 3-4 (approaching operating break-even)</li>
            <li>Begins climbing in Years 5+ (positive cash flow)</li>
            <li>Crosses zero axis at cash flow break-even (investment recovered)</li>
          </ul>
          <Callout type="tip" title="The Valley of Death">
            The low point in cumulative cash flow (usually Year 2-3) is called the "valley of death." This is your maximum capital requirement—ensure you have financing to cover this peak negative position.
          </Callout>
        </Subsection>

        <Subsection title="Profit Margin by Year">
          <p>
            Bar chart showing profit margin percentage:
          </p>
          <div className="bg-gray-50 rounded p-4 font-mono text-sm mb-3">
            Profit Margin = (Net Profit ÷ Revenue) × 100%
          </div>
          <p>
            Mature vineyard profit margin targets:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Bulk Grapes:</strong> 20-40% margin (low overhead, commodity pricing)</li>
            <li><strong>Wholesale Wine:</strong> 15-30% margin (production costs reduce margin)</li>
            <li><strong>DTC Wine:</strong> 35-60% margin (high price, high labor/marketing cost)</li>
          </ul>
        </Subsection>

        <Subsection title="Cash Reserve Projection">
          <p>
            The planner shows recommended cash reserves by year to maintain operational safety:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Years 0-2:</strong> 24 months operating expenses (pre-revenue period)</li>
            <li><strong>Years 3-4:</strong> 12 months operating expenses (low revenue period)</li>
            <li><strong>Years 5+:</strong> 6 months operating expenses (established business)</li>
          </ul>
          <p className="text-sm text-gray-600 mt-3">
            Lenders often require proof of reserves before approving development loans. Budget for these reserves in your initial capital raise.
          </p>
        </Subsection>
      </Section>

      <Section title="Sensitivity Analysis">
        <Subsection title="Price Sensitivity">
          <p>
            How changes in grape/wine price affect profitability:
          </p>
          <Table
            headers={["Price Change", "Impact on 10-Year Profit", "Impact on Break-Even"]}
            rows={[
              ["-20%", "Profit reduced 40-60%", "Delayed 2-4 years"],
              ["-10%", "Profit reduced 20-30%", "Delayed 1-2 years"],
              ["+10%", "Profit increased 25-35%", "Accelerated 1-2 years"],
              ["+20%", "Profit increased 50-70%", "Accelerated 2-3 years"],
            ]}
          />
          <Callout type="warning" title="Price Risk">
            Grape and wine prices fluctuate 15-30% year-to-year based on regional supply/demand. Always model at conservative (below-average) pricing to ensure viability during down markets.
          </Callout>
        </Subsection>

        <Subsection title="Yield Sensitivity">
          <p>
            How changes in yield affect cash flow:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>-25% yield:</strong> Break-even delayed 2-3 years, 10-year profit reduced 30-40%</li>
            <li><strong>-10% yield:</strong> Break-even delayed 1 year, 10-year profit reduced 12-18%</li>
            <li><strong>+10% yield:</strong> Break-even accelerated 6-12 months, profit increased 15-20%</li>
          </ul>
          <p className="text-sm text-gray-600 mt-3">
            Weather events (frost, hail, extreme heat) can reduce yields 20-100% in a single year. Crop insurance mitigates this risk.
          </p>
        </Subsection>

        <Subsection title="Cost Overrun Scenarios">
          <p>
            What happens if establishment costs exceed budget:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>+10% cost overrun:</strong> 10-year ROI reduced 5-8%</li>
            <li><strong>+25% cost overrun:</strong> 10-year ROI reduced 15-20%, may need additional capital</li>
            <li><strong>+50% cost overrun:</strong> Project viability at risk, ROI cut in half</li>
          </ul>
          <Callout type="tip" title="Build in Contingency">
            Always add 15-20% contingency to Year 0 cost estimates. Unexpected site conditions, weather delays, and supply chain issues cause overruns in 70%+ of vineyard projects.
          </Callout>
        </Subsection>
      </Section>

      <Section title="Using the 10-Year Plan for Decision Making">
        <Subsection title="Financing Justification">
          <p>
            Use the 10-year projection to support loan applications:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Show lenders conservative revenue assumptions</li>
            <li>Demonstrate understanding of cash flow timing</li>
            <li>Prove ability to service debt from Year 4+ cash flow</li>
            <li>Justify reserve requirements with year-by-year needs</li>
          </ul>
        </Subsection>

        <Subsection title="Go/No-Go Decision">
          <p>
            Evaluate project viability before committing capital:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Red Flags:</strong> Negative cumulative cash flow through Year 10, operating break-even after Year 5</li>
            <li><strong>Marginal:</strong> Break-even Year 6-8, ROI below 30% at Year 10</li>
            <li><strong>Healthy:</strong> Break-even Year 4-5, ROI above 50% at Year 10</li>
            <li><strong>Strong:</strong> Break-even Year 3-4, ROI above 80% at Year 10</li>
          </ul>
        </Subsection>

        <Subsection title="Phasing Decisions">
          <p>
            If initial capital is limited, use the plan to model phased development:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Plant 50% of acreage in Year 0</li>
            <li>Use Year 2-3 revenue to fund second phase planting</li>
            <li>Compare total 10-year profit: phased vs. full development</li>
          </ul>
          <p className="text-sm text-gray-600 mt-3">
            Phasing reduces peak capital requirement by 40-50% but delays full production revenue by 2-3 years.
          </p>
        </Subsection>

        <Subsection title="Exit Planning">
          <p>
            Understand vineyard value over time for sale or refinancing:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Years 0-2:</strong> Value = establishment cost - depreciation (likely below cost)</li>
            <li><strong>Years 3-5:</strong> Value = cash flow multiple (2-4× annual profit) or cost basis</li>
            <li><strong>Years 6+:</strong> Value = 5-8× annual profit for mature, producing vineyards</li>
          </ul>
        </Subsection>
      </Section>

      <Callout type="note" title="Plan vs. Reality">
        Financial projections are models, not guarantees. Weather, market conditions, pests/disease, and management skill all impact actual results. Use the 10-year plan as a roadmap, but update it annually with actual performance data.
      </Callout>

      <NextSteps
        links={[
          {
            title: "Vineyard Setup",
            description: "See detailed Year 0 investment breakdown",
            href: "/docs/planner/vineyard-setup",
          },
          {
            title: "Financial Inputs",
            description: "Adjust revenue, cost, and financing assumptions",
            href: "/docs/planner/financial-inputs",
          },
          {
            title: "Formulas & Calculations",
            description: "Understand the math behind the projections",
            href: "/docs/planner/formulas",
          },
        ]}
      />
    </DocsLayout>
  );
}
