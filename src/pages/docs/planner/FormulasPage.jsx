import DocsLayout from "../DocsLayout";
import { DocsHeader, Section, Subsection, Callout, Table, NextSteps } from "../DocsComponents";

export default function FormulasPage() {
  return (
    <DocsLayout>
      <DocsHeader
        title="Formulas & Calculations"
        subtitle="Understand the mathematical models, industry formulas, and financial calculations powering the Vineyard Planner."
      />

      <Section title="Overview">
        <p>
          The Vineyard Planner uses industry-standard viticulture formulas, agricultural finance models, and real-world data from UC Davis, USDA, and commercial vineyard operators. This page documents every calculation so you can verify accuracy and understand assumptions.
        </p>
        <p>
          All formulas are transparent—no black boxes. If you disagree with a default value or assumption, you can override it in Financial Inputs.
        </p>
      </Section>

      <Section title="Vineyard Layout Calculations">
        <Subsection title="Vines per Acre">
          <p>
            Calculate vine density from row and vine spacing:
          </p>
          <div className="bg-gray-50 rounded p-4 font-mono text-sm mb-3">
            Vines per Acre = 43,560 sq ft ÷ (Row Spacing ft × Vine Spacing ft)
          </div>
          <p>
            Where 43,560 = square feet in one acre.
          </p>
          <p className="text-sm text-gray-700 mt-3">
            <strong>Example:</strong> 6 ft vine spacing × 10 ft row spacing
          </p>
          <div className="bg-gray-50 rounded p-4 font-mono text-sm mb-3">
            43,560 ÷ (6 × 10) = 43,560 ÷ 60 = 726 vines/acre
          </div>
        </Subsection>

        <Subsection title="Total Vine Count">
          <p>
            Total vines needed for entire vineyard:
          </p>
          <div className="bg-gray-50 rounded p-4 font-mono text-sm mb-3">
            Total Vines = Plantable Acres × Vines per Acre
          </div>
          <p className="text-sm text-gray-700 mt-3">
            <strong>Example:</strong> 10 acres × 726 vines/acre = 7,260 total vines
          </p>
        </Subsection>

        <Subsection title="GPS Polygon Area">
          <p>
            Calculate acreage from GPS coordinates using spherical geometry:
          </p>
          <div className="bg-gray-50 rounded p-4 font-mono text-sm mb-3">
            Area (acres) = Polygon Area (sq meters) ÷ 4,046.86
          </div>
          <p>
            Where 4,046.86 = square meters per acre. Polygon area calculated using Google Maps Geometry library's spherical area function (accounts for Earth's curvature).
          </p>
        </Subsection>

        <Subsection title="Row Count & Length">
          <p>
            Estimated row count from area and spacing:
          </p>
          <div className="bg-gray-50 rounded p-4 font-mono text-sm mb-3">
            Estimated Rows = (Total Square Feet ÷ Row Spacing) / Average Row Length
          </div>
          <p className="text-sm text-gray-600 mt-3">
            This is an approximation. Actual row count depends on field shape and orientation. The planner uses the longest polygon edge to determine primary row direction.
          </p>
        </Subsection>
      </Section>

      <Section title="Material Quantity Calculations">
        <Subsection title="Trellis Posts">
          <p>
            Post requirements based on row configuration:
          </p>
          <div className="bg-gray-50 rounded p-4 font-mono text-sm mb-3">
            End Posts = Number of Rows × 2
          </div>
          <div className="bg-gray-50 rounded p-4 font-mono text-sm mb-3">
            Line Posts = (Total Row Length ÷ Post Spacing) × Number of Rows
          </div>
          <div className="bg-gray-50 rounded p-4 font-mono text-sm mb-3">
            Brace Posts = Number of Rows × 2 (for end assemblies)
          </div>
          <p className="text-sm text-gray-700 mt-3">
            <strong>Example:</strong> 50 rows, 400 ft average length, 20 ft post spacing
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
            <li>End Posts: 50 × 2 = 100</li>
            <li>Line Posts: (400 ÷ 20) × 50 = 20 × 50 = 1,000</li>
            <li>Brace Posts: 50 × 2 = 100</li>
            <li><strong>Total: 1,200 posts</strong></li>
          </ul>
        </Subsection>

        <Subsection title="Trellis Wire">
          <p>
            Total wire footage for multi-wire trellis systems:
          </p>
          <div className="bg-gray-50 rounded p-4 font-mono text-sm mb-3">
            Wire Footage = Number of Rows × Average Row Length × Wires per Row
          </div>
          <p className="text-sm text-gray-700 mt-3">
            <strong>Example:</strong> 50 rows × 400 ft × 4 wires = 80,000 linear feet
          </p>
          <Callout type="tip" title="Add Waste Factor">
            Add 10% to wire footage for tensioning, repairs, and waste. Final order: 80,000 × 1.10 = 88,000 feet.
          </Callout>
        </Subsection>

        <Subsection title="Irrigation Emitters">
          <p>
            Drip emitter count based on vine spacing:
          </p>
          <div className="bg-gray-50 rounded p-4 font-mono text-sm mb-3">
            Emitters per Vine = 1-2 (typically 1 for young vines, 2 for mature)
          </div>
          <div className="bg-gray-50 rounded p-4 font-mono text-sm mb-3">
            Total Emitters = Total Vines × Emitters per Vine
          </div>
          <p className="text-sm text-gray-700 mt-3">
            <strong>Example:</strong> 7,260 vines × 1 emitter = 7,260 emitters
          </p>
        </Subsection>

        <Subsection title="Irrigation System Capacity">
          <p>
            Required GPM (gallons per minute) for drip system:
          </p>
          <div className="bg-gray-50 rounded p-4 font-mono text-sm mb-3">
            Total GPH = Total Emitters × GPH per Emitter
          </div>
          <div className="bg-gray-50 rounded p-4 font-mono text-sm mb-3">
            Required GPM = Total GPH ÷ 60 minutes
          </div>
          <p className="text-sm text-gray-700 mt-3">
            <strong>Example:</strong> 7,260 emitters × 0.5 GPH = 3,630 GPH ÷ 60 = 60.5 GPM
          </p>
          <Callout type="warning" title="Oversize Pump">
            Always size pump at 150-200% of calculated GPM to allow for system expansion, pressure loss, and filter backflushing. For 60 GPM requirement, install 90-120 GPM pump.
          </Callout>
        </Subsection>
      </Section>

      <Section title="Financial Calculations">
        <Subsection title="Year 0 Investment">
          <p>
            Total capital requirement for vineyard establishment:
          </p>
          <div className="bg-gray-50 rounded p-4 font-mono text-sm mb-3">
            Year 0 Cost = Land Cost + Site Prep + Trellis Materials + Irrigation + Vines + Installation Labor + Equipment + Buildings
          </div>
        </Subsection>

        <Subsection title="Land Financing">
          <p>
            Monthly payment calculation (standard amortization):
          </p>
          <div className="bg-gray-50 rounded p-4 font-mono text-sm mb-3">
            Monthly Payment = P × [r(1+r)^n] / [(1+r)^n - 1]
          </div>
          <p>
            Where:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
            <li><strong>P</strong> = Principal (loan amount)</li>
            <li><strong>r</strong> = Monthly interest rate (annual rate ÷ 12)</li>
            <li><strong>n</strong> = Total number of payments (years × 12)</li>
          </ul>
          <p className="text-sm text-gray-700 mt-3">
            <strong>Example:</strong> $300,000 loan, 5% annual rate, 30 years
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
            <li>P = $300,000</li>
            <li>r = 0.05 ÷ 12 = 0.004167</li>
            <li>n = 30 × 12 = 360</li>
            <li><strong>Payment = $1,610.46/month</strong></li>
          </ul>
        </Subsection>

        <Subsection title="Yield Ramp Model">
          <p>
            Crop yield percentage by vineyard age:
          </p>
          <div className="bg-gray-50 rounded p-4 font-mono text-sm mb-3">
            Year 0: 0% | Year 1: 0% | Year 2: 25% | Year 3: 50% | Year 4: 75% | Year 5+: 100%
          </div>
          <p className="text-sm text-gray-600 mt-3">
            Based on UC Davis Viticulture Extension data for California wine grapes. Ramp may be faster for table grapes or slower for stressed/rocky sites.
          </p>
        </Subsection>

        <Subsection title="Annual Revenue">
          <p>
            Revenue calculation by business model:
          </p>
          <p className="text-sm font-semibold mt-3">Bulk Grape Sales:</p>
          <div className="bg-gray-50 rounded p-4 font-mono text-sm mb-3">
            Revenue = Acres × Tons/Acre × Yield % × Price/Ton
          </div>
          <p className="text-sm font-semibold mt-3">Bottled Wine Sales:</p>
          <div className="bg-gray-50 rounded p-4 font-mono text-sm mb-3">
            Revenue = Acres × Tons/Acre × Yield % × (Cases/Ton × 12 bottles × Price/Bottle)
          </div>
          <p className="text-sm text-gray-600 mt-3">
            Conversion: 1 ton grapes ≈ 150 gallons ≈ 62.5 cases (750ml bottles)
          </p>
        </Subsection>

        <Subsection title="Operating Costs">
          <p>
            Annual vineyard maintenance expenses:
          </p>
          <div className="bg-gray-50 rounded p-4 font-mono text-sm mb-3">
            Annual Operating Cost = Acres × Cost per Acre
          </div>
          <p>
            Cost per acre includes:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
            <li>Pruning & canopy management</li>
            <li>Pest control (sprays & materials)</li>
            <li>Irrigation (water + energy)</li>
            <li>Fertilization & soil amendments</li>
            <li>Weed control</li>
            <li>Harvest & hauling</li>
          </ul>
        </Subsection>

        <Subsection title="Annual Profit/Loss">
          <p>
            Net income calculation:
          </p>
          <div className="bg-gray-50 rounded p-4 font-mono text-sm mb-3">
            Net Profit = Revenue - Operating Costs - Fixed Costs - Depreciation - Interest Expense
          </div>
        </Subsection>

        <Subsection title="Cumulative Cash Flow">
          <p>
            Running total of cash position over time:
          </p>
          <div className="bg-gray-50 rounded p-4 font-mono text-sm mb-3">
            Cumulative Cash Flow[Year N] = Cumulative Cash Flow[Year N-1] + Net Profit[Year N]
          </div>
          <p className="text-sm text-gray-700 mt-3">
            <strong>Example:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
            <li>Year 0: -$200,000 (investment)</li>
            <li>Year 1: -$200,000 + (-$30,000) = -$230,000</li>
            <li>Year 2: -$230,000 + (-$20,000) = -$250,000</li>
            <li>Year 3: -$250,000 + $5,000 = -$245,000</li>
            <li>Year 4: -$245,000 + $35,000 = -$210,000</li>
          </ul>
        </Subsection>

        <Subsection title="Break-Even Year">
          <p>
            Year when cumulative cash flow crosses zero:
          </p>
          <div className="bg-gray-50 rounded p-4 font-mono text-sm mb-3">
            Break-Even = First year where Cumulative Cash Flow ≥ 0
          </div>
        </Subsection>

        <Subsection title="Return on Investment (ROI)">
          <p>
            10-year total return percentage:
          </p>
          <div className="bg-gray-50 rounded p-4 font-mono text-sm mb-3">
            ROI = [(Cumulative Profit Years 0-10) ÷ Year 0 Investment] × 100%
          </div>
          <p className="text-sm text-gray-700 mt-3">
            <strong>Example:</strong> $200,000 investment, $120,000 cumulative profit by Year 10
          </p>
          <div className="bg-gray-50 rounded p-4 font-mono text-sm mb-3">
            ROI = ($120,000 ÷ $200,000) × 100% = 60%
          </div>
        </Subsection>
      </Section>

      <Section title="Cost Estimation Formulas">
        <Subsection title="Trellis Material Cost">
          <div className="bg-gray-50 rounded p-4 font-mono text-sm mb-3">
            Total Trellis Cost = (End Posts × $20) + (Line Posts × $12) + (Wire Feet × $0.25) + (Hardware × $2/post) + (Anchors × $15)
          </div>
          <p className="text-sm text-gray-600 mt-3">
            Default pricing: End posts $20, Line posts $12, Wire $0.25/ft, Hardware $2/post, Anchors $15. Adjust in Financial Inputs for regional pricing.
          </p>
        </Subsection>

        <Subsection title="Irrigation System Cost">
          <div className="bg-gray-50 rounded p-4 font-mono text-sm mb-3">
            Total Irrigation Cost = Main Line + Laterals + Emitters + Pump + Filtration + Valves + Controller
          </div>
          <p>
            Component defaults:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
            <li>Main line PVC: $3/linear foot</li>
            <li>Drip tape: $0.15-$0.30/foot</li>
            <li>Emitters: $0.25-$0.50 each</li>
            <li>Pump: $2,000-$8,000 (GPM-dependent)</li>
            <li>Filters: $1,500-$5,000</li>
            <li>Valves: $100-$300 each</li>
            <li>Controller: $500-$3,000</li>
          </ul>
        </Subsection>

        <Subsection title="Vine & Planting Cost">
          <div className="bg-gray-50 rounded p-4 font-mono text-sm mb-3">
            Total Vine Cost = (Vines × Vine Price) + (Vines × Shipping) + (Vines × Planting Labor)
          </div>
          <p className="text-sm text-gray-700 mt-3">
            <strong>Example:</strong> 7,260 vines at $5 each, $0.50 shipping, $1 planting labor
          </p>
          <div className="bg-gray-50 rounded p-4 font-mono text-sm mb-3">
            (7,260 × $5) + (7,260 × $0.50) + (7,260 × $1) = $36,300 + $3,630 + $7,260 = $47,190
          </div>
        </Subsection>

        <Subsection title="Installation Labor Cost">
          <p>
            Contractor installation pricing:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
            <li><strong>Post installation:</strong> $1,500-$2,500/acre</li>
            <li><strong>Wire stringing:</strong> $600-$1,200/acre</li>
            <li><strong>Irrigation assembly:</strong> $800-$1,800/acre</li>
          </ul>
          <div className="bg-gray-50 rounded p-4 font-mono text-sm mb-3">
            Total Installation = Acres × (Post Labor + Wire Labor + Irrigation Labor)
          </div>
        </Subsection>
      </Section>

      <Section title="Default Values & Industry Benchmarks">
        <Subsection title="Spacing Presets">
          <Table
            headers={["Spacing", "Vines/Acre", "Use Case"]}
            rows={[
              ["6' × 8'", "908", "Ultra-high density, premium Pinot Noir"],
              ["6' × 10'", "726", "Standard high-quality spacing"],
              ["8' × 8'", "681", "Square spacing, easy management"],
              ["8' × 10'", "545", "Wide row, mechanical harvesting"],
              ["8' × 12'", "454", "Low density, hot climates"],
            ]}
          />
        </Subsection>

        <Subsection title="Yield Defaults by Variety">
          <Table
            headers={["Variety", "Default Yield (tons/acre)", "Range"]}
            rows={[
              ["Cabernet Sauvignon", "3.5", "2-5"],
              ["Pinot Noir", "2.5", "1.5-4"],
              ["Chardonnay", "4.0", "2.5-6"],
              ["Sauvignon Blanc", "4.0", "3-6"],
              ["Merlot", "3.5", "2.5-5"],
            ]}
          />
        </Subsection>

        <Subsection title="Operating Cost Defaults">
          <Table
            headers={["Expense Category", "Default (per acre)", "Notes"]}
            rows={[
              ["Pruning & Canopy", "$1,200", "Labor-intensive"],
              ["Spraying (materials)", "$600", "6-10 spray cycles/year"],
              ["Irrigation", "$350", "Water + energy"],
              ["Fertilization", "$250", "Soil amendments"],
              ["Weed Control", "$300", "Herbicide or mowing"],
              ["Harvest", "$450", "Picking + hauling"],
              ["Total Operating", "$3,150", "Conservative baseline"],
            ]}
          />
        </Subsection>
      </Section>

      <Callout type="note" title="Formulas Are Guidelines">
        All formulas use industry-standard methods, but real-world results vary by site, climate, variety, and management. Use the planner's calculations as a starting point, then refine with local data and contractor quotes.
      </Callout>

      <NextSteps
        links={[
          {
            title: "Financial Inputs",
            description: "Override defaults with your specific costs and assumptions",
            href: "/docs/planner/financial-inputs",
          },
          {
            title: "10-Year Plan",
            description: "See how formulas generate your projections",
            href: "/docs/planner/ten-year-plan",
          },
          {
            title: "Details Tab",
            description: "View all calculated metrics in one place",
            href: "/docs/planner/details",
          },
        ]}
      />
    </DocsLayout>
  );
}
