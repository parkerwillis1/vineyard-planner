import DocsLayout from "../DocsLayout";
import { DocsHeader, Section, Subsection, Callout, Table, NextSteps } from "../DocsComponents";

export default function VineyardSetupPage() {
  return (
    <DocsLayout>
      <DocsHeader
        title="Vineyard Setup (Year 0)"
        subtitle="Understand the complete investment breakdown for vineyard establishment, including land preparation, materials, installation, and infrastructure."
      />

      <Section title="Overview">
        <p>
          The Vineyard Setup view shows your Year 0 capital investment—everything you need to purchase and install before your first growing season. This is your total startup cost before revenue begins.
        </p>
        <p>
          The planner breaks down costs into major categories: land acquisition, site preparation, trellis materials, irrigation systems, installation labor, equipment, and buildings. Each category shows itemized costs per acre and total investment.
        </p>
      </Section>

      <Section title="Investment Categories">
        <Subsection title="Land Acquisition">
          <p>
            The largest upfront expense for most vineyard projects:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Purchase Price:</strong> Acres × cost per acre</li>
            <li><strong>Down Payment:</strong> Percentage paid upfront (typically 25-40%)</li>
            <li><strong>Financed Amount:</strong> Remaining balance for land loan</li>
            <li><strong>Closing Costs:</strong> Title, escrow, surveys (2-4% of purchase price)</li>
          </ul>
          <p className="text-sm text-gray-600 mt-3">
            Land cost is shown separately from operating capital in the breakdown. Most lenders require separate financing for land vs. development.
          </p>
        </Subsection>

        <Subsection title="Site Preparation">
          <p>
            Preparing raw land for vineyard planting:
          </p>
          <Table
            headers={["Task", "Cost per Acre", "Notes"]}
            rows={[
              ["Land Clearing", "$500-$2,000", "Remove trees, brush, rocks"],
              ["Deep Ripping", "$200-$500", "Break hardpan for root penetration"],
              ["Grading & Contouring", "$800-$3,000", "Erosion control, drainage"],
              ["Soil Amendments", "$400-$1,200", "Lime, compost, gypsum"],
              ["Cover Crop Establishment", "$100-$300", "Prevent erosion, build soil"],
            ]}
          />
          <Callout type="tip" title="Site Prep Timing">
            Most site prep should occur 6-12 months before planting to allow soil to settle and cover crops to establish. Don't rush this—proper site prep prevents drainage and erosion problems for 30+ years.
          </Callout>
        </Subsection>

        <Subsection title="Trellis Materials">
          <p>
            The planner auto-calculates trellis material costs based on your vineyard layout, spacing, and system type:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>End Posts:</strong> Heavy-duty 4×4 or 6×6 pressure-treated posts for row ends</li>
            <li><strong>Line Posts:</strong> Standard posts every 20-30 feet along rows</li>
            <li><strong>Trellis Wire:</strong> High-tensile galvanized wire (12.5 or 14 gauge)</li>
            <li><strong>Hardware:</strong> Clips, staples, wire ties, tensioners, springs</li>
            <li><strong>Earth Anchors:</strong> Ground screws for end post stabilization</li>
          </ul>
          <p className="text-sm text-gray-600 mt-3">
            Material quantities are calculated from your vineyard design: rows × length × post spacing. Costs update automatically when you change spacing or acreage.
          </p>
        </Subsection>

        <Subsection title="Irrigation System">
          <p>
            Complete drip irrigation infrastructure costs:
          </p>
          <Table
            headers={["Component", "Cost Range", "Details"]}
            rows={[
              ["Main Line (PVC)", "$1,500-$3,000/acre", "2-3 inch supply pipe"],
              ["Lateral Lines (drip tape)", "$800-$1,500/acre", "Runs along each vine row"],
              ["Emitters", "$400-$800/acre", "Pressure-compensating drippers"],
              ["Filtration System", "$2,000-$8,000", "Sand/screen filters (depends on water source)"],
              ["Pump & Pressure Tank", "$3,000-$12,000", "Sized for acreage and flow rate"],
              ["Valves & Fittings", "$500-$1,200/acre", "Zone valves, backflow prevention"],
              ["Controller & Automation", "$1,000-$5,000", "Programmable irrigation timer"],
            ]}
          />
          <Callout type="note" title="Water Source">
            Irrigation costs assume an existing well or water supply. Well drilling ($15,000-$75,000) is listed separately under infrastructure if needed.
          </Callout>
        </Subsection>

        <Subsection title="Vines & Planting">
          <p>
            Vine material and planting labor:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Vine Cost:</strong> $3-$8 per vine (grafted, certified disease-free)</li>
            <li><strong>Shipping:</strong> $0.25-$0.75 per vine (refrigerated transport)</li>
            <li><strong>Planting Labor:</strong> $0.50-$1.50 per vine</li>
            <li><strong>Grow Tubes (optional):</strong> $1-$2 per vine for protection</li>
          </ul>
          <p className="text-sm text-gray-600 mt-3">
            Total vine count is calculated from acres and spacing. For 10 acres at 6×10 spacing: 726 vines/acre × 10 acres = 7,260 vines = $21,780-$58,080 vine cost alone.
          </p>
        </Subsection>

        <Subsection title="Installation Labor">
          <p>
            Skilled labor to install trellis and irrigation systems:
          </p>
          <Table
            headers={["Task", "Labor Cost", "Timeline"]}
            rows={[
              ["Post Installation", "$1,200-$2,500/acre", "2-4 weeks for 10 acres"],
              ["Wire Stringing", "$600-$1,200/acre", "1-2 weeks for 10 acres"],
              ["Irrigation Assembly", "$800-$1,800/acre", "2-3 weeks for 10 acres"],
              ["System Testing", "$200-$500 flat", "2-3 days"],
            ]}
          />
          <Callout type="warning" title="DIY vs. Contractor">
            Installation labor can be reduced 50-70% if you do it yourself, but budget 3-5× more time. Skilled crews install faster and with fewer mistakes. For first-time growers, hire professionals for irrigation—mistakes are expensive.
          </Callout>
        </Subsection>

        <Subsection title="Equipment Purchases">
          <p>
            Essential machinery for vineyard operations:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Tractor (50-70 HP):</strong> $35,000-$60,000 new, $15,000-$30,000 used</li>
            <li><strong>Sprayer (airblast):</strong> $25,000-$50,000 new, $10,000-$25,000 used</li>
            <li><strong>Mower/Cultivator:</strong> $8,000-$15,000 new, $3,000-$8,000 used</li>
            <li><strong>ATV/UTV:</strong> $12,000-$25,000 new, $6,000-$15,000 used</li>
            <li><strong>Hand Tools & Supplies:</strong> $2,000-$5,000 (pruners, shovels, bins, etc.)</li>
          </ul>
          <p className="text-sm text-gray-600 mt-3">
            Equipment can be financed separately from land/development. Used equipment saves 40-60% but verify condition and service history.
          </p>
        </Subsection>

        <Subsection title="Buildings & Infrastructure">
          <p>
            Permanent structures and utilities:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Equipment Barn:</strong> $25,000-$100,000 (30×60 to 50×80 pole barn)</li>
            <li><strong>Well Drilling:</strong> $15,000-$75,000 (depth and flow rate dependent)</li>
            <li><strong>3-Phase Power:</strong> $10,000-$50,000 (distance from transformer)</li>
            <li><strong>Road Improvements:</strong> $5-$15 per linear foot</li>
            <li><strong>Fencing:</strong> $3-$8 per linear foot (deer exclusion)</li>
          </ul>
        </Subsection>
      </Section>

      <Section title="Breakdown Views">
        <Subsection title="Total Investment Summary">
          <p>
            The top of the Vineyard Setup view shows your total Year 0 capital requirement:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Land Cost:</strong> Total land purchase price</li>
            <li><strong>Development Cost:</strong> All vineyard establishment expenses</li>
            <li><strong>Equipment Cost:</strong> Machinery and tools</li>
            <li><strong>Total Investment:</strong> Sum of all categories</li>
          </ul>
        </Subsection>

        <Subsection title="Per-Acre Breakdown">
          <p>
            Toggle to per-acre view to compare costs against industry benchmarks:
          </p>
          <Table
            headers={["Category", "Typical Range per Acre"]}
            rows={[
              ["Site Prep", "$1,000-$5,000"],
              ["Trellis Materials", "$3,000-$7,000"],
              ["Irrigation System", "$3,000-$6,000"],
              ["Vines & Planting", "$3,000-$8,000"],
              ["Labor (installation)", "$2,500-$5,500"],
              ["Total Development", "$12,500-$31,500"],
            ]}
          />
          <p className="text-sm text-gray-600 mt-3">
            Industry average for complete vineyard development: $15,000-$25,000 per acre (excluding land). Premium regions with steep slopes or difficult access can exceed $40,000/acre.
          </p>
        </Subsection>

        <Subsection title="Material vs. Labor Split">
          <p>
            The planner shows what percentage of your budget goes to materials vs. labor:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Materials:</strong> Typically 55-65% of development cost</li>
            <li><strong>Labor:</strong> Typically 35-45% of development cost</li>
          </ul>
          <Callout type="tip" title="DIY Savings">
            If you install trellis and irrigation yourself, you can save 30-40% of total development cost. However, add 20-30% to material costs for waste and learning curve mistakes.
          </Callout>
        </Subsection>
      </Section>

      <Section title="Financing Year 0 Investment">
        <Subsection title="Capital Sources">
          <p>
            Most vineyard projects use a combination of funding sources:
          </p>
          <Table
            headers={["Source", "Typical Amount", "Use Case"]}
            rows={[
              ["Personal Savings", "20-40% of total", "Down payments, cash reserves"],
              ["Land Loan", "60-75% of land cost", "Long-term (15-30 year) land financing"],
              ["Development Loan", "50-80% of dev cost", "Construction/ag development loan"],
              ["Equipment Financing", "70-90% of equipment", "5-7 year equipment loan"],
              ["USDA FSA Loan", "Up to $600,000", "Beginning farmer, favorable terms"],
            ]}
          />
        </Subsection>

        <Subsection title="Cash Reserve Requirement">
          <p>
            Lenders typically require 12-24 months of operating expenses in cash reserves before funding development loans. For a 10-acre vineyard with $4,000/acre annual costs:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Annual operating cost: 10 acres × $4,000 = $40,000</li>
            <li>12-month reserve: $40,000</li>
            <li>24-month reserve: $80,000</li>
          </ul>
          <p className="text-sm text-gray-600 mt-3">
            This reserve covers operations during the 3-5 year period before vines reach full production and positive cash flow.
          </p>
        </Subsection>

        <Subsection title="Return on Investment Timeline">
          <p>
            Vineyard investment timeline to profitability:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Year 0:</strong> 100% capital outflow, no revenue</li>
            <li><strong>Year 1:</strong> Maintenance costs, no harvest</li>
            <li><strong>Year 2:</strong> First small crop (25% of full yield)</li>
            <li><strong>Year 3:</strong> 50% yield, may reach operating breakeven</li>
            <li><strong>Year 4:</strong> 75% yield, positive cash flow likely</li>
            <li><strong>Year 5+:</strong> Full production, debt service paydown</li>
          </ul>
          <Callout type="warning" title="Long-Term Investment">
            Vineyards are 30-50 year assets but take 5-7 years to reach full ROI. Don't expect quick returns. Budget for 3-5 years of negative cash flow before the operation becomes self-sustaining.
          </Callout>
        </Subsection>
      </Section>

      <Section title="Cost Reduction Strategies">
        <Subsection title="Phase Development">
          <p>
            If capital is limited, phase your vineyard development:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Year 0:</strong> Plant 5 acres, basic equipment</li>
            <li><strong>Year 2:</strong> Plant additional 5 acres after first crop revenue</li>
            <li><strong>Year 3:</strong> Upgrade equipment from initial cash flow</li>
          </ul>
          <p className="text-sm text-gray-600 mt-3">
            Phasing reduces initial capital requirement by 40-50% but delays full production revenue.
          </p>
        </Subsection>

        <Subsection title="Used Equipment">
          <p>
            Buying quality used equipment can save $30,000-$80,000:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Used tractor: Save $15,000-$30,000 vs. new</li>
            <li>Used sprayer: Save $10,000-$25,000 vs. new</li>
            <li>Used implements: Save $5,000-$15,000 vs. new</li>
          </ul>
          <Callout type="tip" title="Equipment Inspection">
            Always have used equipment inspected by a mechanic before purchase. Major repairs (transmission, hydraulics, engine) can cost $5,000-$15,000 and wipe out savings.
          </Callout>
        </Subsection>

        <Subsection title="DIY Installation">
          <p>
            Installing trellis and irrigation yourself saves $2,000-$4,000 per acre but requires:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>3-5 months of labor (vs. 6-8 weeks for contractors)</li>
            <li>Tool purchases ($1,000-$3,000 for post driver, etc.)</li>
            <li>Learning curve with 10-20% material waste</li>
            <li>Physical ability to dig, lift, and work in all weather</li>
          </ul>
        </Subsection>
      </Section>

      <Callout type="note" title="Industry Benchmark">
        The average all-in cost for vineyard establishment (land, development, equipment) in California premium regions is $75,000-$150,000 per acre. Washington and Oregon: $40,000-$80,000 per acre. Adjust your expectations based on region and quality tier.
      </Callout>

      <NextSteps
        links={[
          {
            title: "Financial Inputs",
            description: "Set costs, revenue, and operating expense assumptions",
            href: "/docs/planner/financial-inputs",
          },
          {
            title: "10-Year Plan",
            description: "View cash flow projections and break-even analysis",
            href: "/docs/planner/ten-year-plan",
          },
          {
            title: "Design Tab",
            description: "Calculate vineyard layout and material costs",
            href: "/docs/planner/design",
          },
        ]}
      />
    </DocsLayout>
  );
}
