import DocsLayout from "../DocsLayout";
import { DocsHeader, Section, Subsection, Callout, Table, NextSteps } from "../DocsComponents";

export default function FinancialInputsPage() {
  return (
    <DocsLayout>
      <DocsHeader
        title="Financial Inputs"
        subtitle="Set land costs, construction budgets, revenue assumptions, and operating expenses with industry-standard defaults."
      />

      <Section title="Overview">
        <p>
          Financial Inputs is where you define all the money coming in and going out of your vineyard operation. Set conservative, realistic numbers here—your 10-year projections are only as good as your assumptions.
        </p>
        <p>
          The planner provides industry averages as starting points, but you should adjust based on your region, grape variety, and business model (bottled wine vs. bulk grape sales).
        </p>
      </Section>

      <Section title="Land Acquisition">
        <Subsection title="Land Cost per Acre">
          <p>
            Purchase price per acre for vineyard-suitable land. Varies dramatically by region:
          </p>
          <Table
            headers={["Region", "Typical Range", "Premium AVAs"]}
            rows={[
              ["Napa Valley, CA", "$100,000-$300,000/ac", "$500,000+/ac"],
              ["Sonoma County, CA", "$50,000-$150,000/ac", "$250,000+/ac"],
              ["Central Coast, CA", "$25,000-$75,000/ac", "$150,000+/ac"],
              ["Oregon Willamette", "$15,000-$50,000/ac", "$100,000+/ac"],
              ["Washington Columbia", "$10,000-$30,000/ac", "$75,000+/ac"],
            ]}
          />
          <Callout type="warning" title="Don't Overpay">
            Land cost is your biggest upfront expense and doesn't generate returns for 3-5 years. Be conservative—overpaying for land can sink vineyard profitability permanently.
          </Callout>
        </Subsection>

        <Subsection title="Down Payment & Financing">
          <p>
            Most vineyard land purchases require 25-40% down payment. The planner calculates:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Total land cost (acres × cost per acre)</li>
            <li>Down payment amount (% of total)</li>
            <li>Financed amount (remaining balance)</li>
            <li>Monthly payment based on interest rate and term</li>
          </ul>
        </Subsection>
      </Section>

      <Section title="Buildings & Infrastructure">
        <Subsection title="Winery Construction">
          <p>
            If planning to bottle wine (vs. selling bulk grapes), budget for winery facility:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Crush Pad & Cellar:</strong> $200-$500 per sq ft</li>
            <li><strong>Tasting Room:</strong> $300-$600 per sq ft (higher finish quality)</li>
            <li><strong>Barrel Storage:</strong> $100-$200 per sq ft (basic warehouse)</li>
            <li><strong>Office & Lab:</strong> $150-$300 per sq ft</li>
          </ul>
          <p className="text-sm text-gray-600 mt-3">
            Small estate winery (2,000-5,000 case production): $500,000-$2,000,000 total construction
          </p>
        </Subsection>

        <Subsection title="Equipment Barn">
          <p>
            Covered storage for tractors, sprayers, and implements. Budget $25,000-$100,000 for 30×60 to 50×80 foot pole barn.
          </p>
        </Subsection>

        <Subsection title="Utilities">
          <p>
            Power, water, septic, and road improvements:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>3-phase power install: $10,000-$50,000 (depends on distance)</li>
            <li>Well drilling: $15,000-$75,000 (depth and flow rate dependent)</li>
            <li>Septic system: $15,000-$40,000</li>
            <li>Road paving/grading: $5-$15 per linear foot</li>
          </ul>
        </Subsection>
      </Section>

      <Section title="Revenue Model">
        <Subsection title="Sales Strategy">
          <p>
            Choose your business model—this fundamentally changes cash flow and profitability:
          </p>
          <Table
            headers={["Strategy", "Revenue per Ton", "Pros", "Cons"]}
            rows={[
              ["Bulk Grapes", "$1,500-$4,000/ton", "Fast cash, low risk, no winery needed", "Lowest margin, market price volatility"],
              ["Wholesale Wine", "$8-$25/bottle", "Medium margin, stable contracts", "Requires winery, slim margins after production costs"],
              ["DTC (Direct-to-Consumer)", "$25-$75/bottle", "Highest margin, brand control", "High labor, tasting room required, slow ramp"],
            ]}
          />
        </Subsection>

        <Subsection title="Price per Ton (Bulk Grapes)">
          <p>
            If selling fruit to wineries, set expected price per ton by variety and quality:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Napa Cabernet:</strong> $3,000-$8,000/ton (premium AVAs higher)</li>
            <li><strong>Sonoma Pinot Noir:</strong> $2,500-$6,000/ton</li>
            <li><strong>Central Coast Chardonnay:</strong> $1,200-$2,500/ton</li>
            <li><strong>Commodity varieties:</strong> $800-$1,500/ton</li>
          </ul>
          <p className="text-sm text-gray-600 mt-3">
            Check USDA NASS Grape Crush Reports for regional pricing data.
          </p>
        </Subsection>

        <Subsection title="Price per Bottle (Wine Sales)">
          <p>
            For estate bottling, set wholesale and/or DTC retail prices:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Production cost (wine only): $3-$8/bottle</li>
            <li>Wholesale price: 2-3× production cost</li>
            <li>DTC retail price: 2-3× wholesale price</li>
          </ul>
        </Subsection>

        <Subsection title="Yield Assumptions">
          <p>
            Expected tons per acre at full maturity (typically Year 5+):
          </p>
          <Table
            headers={["Grape Type", "Typical Yield", "Premium Yield"]}
            rows={[
              ["Cabernet Sauvignon", "3-4 tons/acre", "2-3 tons/acre (quality focus)"],
              ["Pinot Noir", "2.5-3.5 tons/acre", "1.5-2.5 tons/acre"],
              ["Chardonnay", "3-5 tons/acre", "2.5-4 tons/acre"],
              ["Sauvignon Blanc", "3-5 tons/acre", "2.5-4 tons/acre"],
            ]}
          />
          <Callout type="tip" title="Yield Curve">
            The planner automatically models a realistic yield ramp: Year 1 = 0%, Year 2 = 25%, Year 3 = 50%, Year 4 = 75%, Year 5+ = 100%.
          </Callout>
        </Subsection>
      </Section>

      <Section title="Operating Costs">
        <Subsection title="Annual Vineyard Expenses">
          <p>
            Set expected per-acre costs for ongoing operations:
          </p>
          <Table
            headers={["Expense Category", "Typical Range"]}
            rows={[
              ["Pruning & Canopy Management", "$800-$1,500/acre"],
              ["Pest & Disease Control (sprays)", "$400-$800/acre"],
              ["Irrigation & Water", "$200-$500/acre"],
              ["Fertilization & Soil Amendments", "$150-$400/acre"],
              ["Weed Control", "$200-$400/acre"],
              ["Harvest & Hauling", "$300-$600/acre"],
              ["Frost Protection (if needed)", "$200-$1,000/acre"],
              ["Overhead (insurance, taxes, admin)", "$500-$1,200/acre"],
            ]}
          />
          <p className="text-sm text-gray-600 mt-3">
            Total annual vineyard operating cost: $2,750-$6,400/acre (highly variable by region and practices)
          </p>
        </Subsection>

        <Subsection title="Winery Production Costs">
          <p>
            If bottling wine, add production expenses:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Winemaking labor: $2-$5 per bottle</li>
            <li>Barrels (if aging): $0.50-$2 per bottle</li>
            <li>Bottling, labels, corks: $1-$3 per bottle</li>
            <li>Compliance & testing: $0.25-$0.75 per bottle</li>
            <li>Marketing & sales: $2-$8 per bottle (DTC higher)</li>
          </ul>
        </Subsection>

        <Subsection title="Labor">
          <p>
            Separate labor into categories for accurate forecasting:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Vineyard Manager:</strong> $50,000-$90,000/year (full-time)</li>
            <li><strong>Seasonal Field Labor:</strong> $18-$25/hour</li>
            <li><strong>Winemaker:</strong> $60,000-$120,000/year (if bottling)</li>
            <li><strong>Tasting Room Staff:</strong> $16-$22/hour + commission</li>
          </ul>
        </Subsection>
      </Section>

      <Section title="Equipment & Machinery">
        <Subsection title="Essential Equipment">
          <p>
            Major equipment purchases typically occur in Years 0-2:
          </p>
          <Table
            headers={["Equipment", "New Cost", "Used Cost"]}
            rows={[
              ["Tractor (50-70 HP)", "$35,000-$60,000", "$15,000-$30,000"],
              ["Sprayer (airblast)", "$25,000-$50,000", "$10,000-$25,000"],
              ["Mower/Cultivator", "$8,000-$15,000", "$3,000-$8,000"],
              ["ATV/UTV", "$12,000-$25,000", "$6,000-$15,000"],
              ["Harvest Bins (50)", "$5,000-$10,000", "$2,000-$5,000"],
            ]}
          />
        </Subsection>

        <Subsection title="Financing Equipment">
          <p>
            Equipment loans available through:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>USDA FSA Microloan:</strong> Up to $50,000, 5-7 years, competitive rates</li>
            <li><strong>Commercial Equipment Loan:</strong> 5-7 year term, 5-8% interest</li>
            <li><strong>Dealer Financing:</strong> Often 0% for 24-36 months (seasonal promotions)</li>
          </ul>
        </Subsection>
      </Section>

      <Callout type="warning" title="Avoid Underestimating Costs">
        Most vineyard failures happen because of cost overruns, not revenue shortfalls. Add 20% contingency to all cost estimates, especially for first-time growers.
      </Callout>

      <NextSteps
        links={[
          {
            title: "Design Tab",
            description: "Calculate material costs for trellis and irrigation",
            href: "/docs/planner/design",
          },
          {
            title: "Vineyard Setup",
            description: "See Year 0 investment breakdown",
            href: "/docs/planner/vineyard-setup",
          },
          {
            title: "10-Year Plan",
            description: "View cash flow projections based on your inputs",
            href: "/docs/planner/ten-year-plan",
          },
        ]}
      />
    </DocsLayout>
  );
}
