import DocsLayout from "../DocsLayout";
import { DocsHeader, Section, Subsection, Callout, Table, NextSteps } from "../DocsComponents";

export default function DetailsTabPage() {
  return (
    <DocsLayout>
      <DocsHeader
        title="Details Tab"
        subtitle="View comprehensive vineyard metrics, infrastructure calculations, and detailed cost breakdowns derived from your design and financial inputs."
      />

      <Section title="Overview">
        <p>
          The Details tab is your at-a-glance dashboard showing every calculated metric from your vineyard plan. It consolidates layout calculations, material quantities, costs per acre, and infrastructure requirements into a single reference view.
        </p>
        <p>
          All values are automatically calculated from your Design tab layout and Financial Inputs. Changes to acreage, spacing, or costs update the Details tab in real-time.
        </p>
      </Section>

      <Section title="Vineyard Layout Metrics">
        <Subsection title="Area Calculations">
          <p>
            Precise measurements derived from GPS polygon boundaries:
          </p>
          <Table
            headers={["Metric", "Calculation", "Use Case"]}
            rows={[
              ["Total Acres", "GPS polygon area", "Land purchase, tax assessment"],
              ["Plantable Acres", "Total acres - roads/buildings", "Vine count, material quantities"],
              ["Total Square Feet", "Acres × 43,560", "Irrigation design, coverage calculations"],
              ["Perimeter (feet)", "Sum of polygon edges", "Fencing requirements"],
            ]}
          />
          <Callout type="tip" title="Plantable vs. Total Acres">
            Plantable acres exclude roads, buildings, and buffer zones. For accurate material costs, always use plantable acres (typically 85-95% of total acres for flat sites, 70-85% for hilly sites with erosion buffers).
          </Callout>
        </Subsection>

        <Subsection title="Vine Density & Count">
          <p>
            Vine planting density and total vine count:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Vines per Acre:</strong> 43,560 sq ft ÷ (row spacing × vine spacing)</li>
            <li><strong>Total Vines:</strong> Plantable acres × vines per acre</li>
            <li><strong>Vine Spacing:</strong> Distance between vines in feet (in-row)</li>
            <li><strong>Row Spacing:</strong> Distance between rows in feet (tractor width + buffer)</li>
          </ul>
          <p className="text-sm text-gray-600 mt-3">
            Example: 10 acres at 6×10 spacing = 726 vines/acre × 10 acres = 7,260 total vines
          </p>
        </Subsection>

        <Subsection title="Row Configuration">
          <p>
            Row layout and orientation details:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Total Rows:</strong> Calculated from area and row spacing</li>
            <li><strong>Average Row Length:</strong> Total linear feet ÷ number of rows</li>
            <li><strong>Row Orientation:</strong> Compass bearing (0-360°) for sun exposure optimization</li>
            <li><strong>Longest Row:</strong> Maximum single-row length (important for irrigation zones)</li>
          </ul>
          <Callout type="note" title="Row Orientation">
            North-South rows (0° or 180°) provide even sun exposure on both sides. East-West rows (90° or 270°) give more morning sun exposure. In hot climates, some growers prefer NE-SW (45°) to reduce afternoon heat stress.
          </Callout>
        </Subsection>
      </Section>

      <Section title="Trellis Infrastructure">
        <Subsection title="Post Requirements">
          <p>
            Calculated post quantities for trellis system:
          </p>
          <Table
            headers={["Post Type", "Quantity Calculation", "Typical Cost"]}
            rows={[
              ["End Posts (6×6)", "2 per row", "$15-$25 each"],
              ["Line Posts (4×4)", "Row length ÷ 20-30 feet", "$8-$15 each"],
              ["Brace Posts", "End assembly support", "$10-$18 each"],
              ["Total Posts", "End + Line + Brace", "Sum of all types"],
            ]}
          />
          <p className="text-sm text-gray-600 mt-3">
            Standard spacing: Line posts every 20 feet for VSP (Vertical Shoot Positioning), every 24-30 feet for divided canopy systems.
          </p>
        </Subsection>

        <Subsection title="Wire & Hardware">
          <p>
            Trellis wire footage and hardware quantities:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Wire Footage:</strong> Rows × row length × wires per row (2-5 wires depending on system)</li>
            <li><strong>Wire Type:</strong> 12.5 or 14 gauge high-tensile galvanized</li>
            <li><strong>Clips & Staples:</strong> 3-5 per post × total posts</li>
            <li><strong>Tensioners:</strong> 1 per wire per row (allows seasonal adjustment)</li>
            <li><strong>Earth Anchors:</strong> 1-2 per row end for stabilization</li>
          </ul>
          <Callout type="tip" title="Wire Quality">
            Never skimp on wire quality. High-tensile galvanized wire lasts 30+ years. Cheap wire rusts, sags, and requires replacement within 10 years—costing more in labor than you saved upfront.
          </Callout>
        </Subsection>

        <Subsection title="Trellis System Type">
          <p>
            Common systems with cost and complexity trade-offs:
          </p>
          <Table
            headers={["System", "Wires", "Cost/Acre", "Best For"]}
            rows={[
              ["VSP (Vertical)", "3-4", "$3,000-$5,000", "Most varieties, standard choice"],
              ["Scott Henry", "4-5", "$4,000-$6,000", "High vigor sites, dual canopy"],
              ["Geneva Double", "4-6", "$4,500-$7,000", "Large canopy varieties"],
              ["Lyre", "6-8", "$5,500-$8,000", "Premium wine, maximum exposure"],
            ]}
          />
          <p className="text-sm text-gray-600 mt-3">
            VSP is the industry standard—simple, cost-effective, and works for 90% of vineyards. Use specialty systems only if specific viticultural goals justify the extra cost.
          </p>
        </Subsection>
      </Section>

      <Section title="Irrigation System Details">
        <Subsection title="Main Line & Laterals">
          <p>
            Irrigation pipe network specifications:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Main Line:</strong> 2-3 inch PVC trunk line from pump to field</li>
            <li><strong>Lateral Lines:</strong> Drip tape running along each vine row</li>
            <li><strong>Emitter Spacing:</strong> 12-24 inches (matches vine spacing)</li>
            <li><strong>Flow Rate:</strong> 0.5-1.0 GPH per emitter (gallons per hour)</li>
            <li><strong>Total GPM Required:</strong> (Total emitters × GPH) ÷ 60 minutes</li>
          </ul>
          <p className="text-sm text-gray-600 mt-3">
            Example: 7,260 vines × 1 emitter each × 0.5 GPH = 3,630 GPH ÷ 60 = 60.5 GPM system capacity needed
          </p>
        </Subsection>

        <Subsection title="Pump & Filtration">
          <p>
            System components sized for acreage and water source:
          </p>
          <Table
            headers={["Component", "Sizing", "Cost Range"]}
            rows={[
              ["Pump", "1.5-2× required GPM", "$2,000-$8,000"],
              ["Pressure Tank", "5-10 gallon per GPM", "$500-$2,000"],
              ["Sand Filter", "Flow rate + 20% margin", "$1,500-$5,000"],
              ["Screen Filter", "120-200 mesh", "$300-$1,000"],
            ]}
          />
          <Callout type="warning" title="Oversizing">
            Always oversize pumps and filters by 20-30%. Undersized systems run continuously, wear out faster, and can't handle expansion. Oversizing adds 10-15% to cost but doubles system lifespan.
          </Callout>
        </Subsection>

        <Subsection title="Irrigation Zones">
          <p>
            Dividing vineyard into manageable irrigation zones:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Zone Size:</strong> 2-5 acres per zone (depends on pump capacity)</li>
            <li><strong>Zone Count:</strong> Total acres ÷ zone size</li>
            <li><strong>Zone Valves:</strong> 1 automatic valve per zone</li>
            <li><strong>Controller:</strong> Programmable timer with zone stations</li>
          </ul>
          <p className="text-sm text-gray-600 mt-3">
            Separate zones allow differential watering by block variety, soil type, or slope. Essential for precision viticulture.
          </p>
        </Subsection>

        <Subsection title="Water Volume Requirements">
          <p>
            Annual and peak-season water needs:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Annual Acre-Feet:</strong> 1.5-3.0 acre-feet per acre (varies by climate)</li>
            <li><strong>Total Gallons/Year:</strong> Acre-feet × 325,851 gallons</li>
            <li><strong>Peak Month Demand:</strong> 25-30% of annual use (July-August)</li>
            <li><strong>Daily Peak Demand:</strong> Annual ÷ 180 irrigation days</li>
          </ul>
          <Callout type="note" title="Water Rights">
            Ensure well or water rights can supply peak summer demand. A well that flows 30 GPM can deliver 43,200 gallons/day (24-hour pumping) = enough for 15-25 acres depending on ET rates.
          </Callout>
        </Subsection>
      </Section>

      <Section title="Cost Breakdowns">
        <Subsection title="Per-Acre Costs">
          <p>
            All costs normalized to per-acre basis for industry comparison:
          </p>
          <Table
            headers={["Category", "Per Acre", "Total (10 acres)"]}
            rows={[
              ["Trellis Materials", "$3,500", "$35,000"],
              ["Irrigation System", "$4,200", "$42,000"],
              ["Vines & Planting", "$4,800", "$48,000"],
              ["Installation Labor", "$3,200", "$32,000"],
              ["Total Development", "$15,700", "$157,000"],
            ]}
          />
          <p className="text-sm text-gray-600 mt-3">
            Per-acre costs allow easy comparison with regional benchmarks and scaling projections for different acreages.
          </p>
        </Subsection>

        <Subsection title="Material vs. Labor Split">
          <p>
            The Details tab shows percentage breakdown:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Materials:</strong> Typically 55-65% of development cost</li>
            <li><strong>Labor:</strong> Typically 35-45% of development cost</li>
          </ul>
          <p className="text-sm text-gray-600 mt-3">
            This split helps evaluate DIY savings potential. If you self-install, you eliminate labor cost but should add 10-15% to materials for waste.
          </p>
        </Subsection>

        <Subsection title="Cost per Vine">
          <p>
            Total establishment cost divided by vine count:
          </p>
          <div className="bg-gray-50 rounded p-4 font-mono text-sm mb-3">
            Cost per Vine = Total Development Cost ÷ Total Vines
          </div>
          <p>
            Industry benchmarks for cost per vine:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Basic Development:</strong> $15-$25 per vine</li>
            <li><strong>Standard Development:</strong> $25-$35 per vine</li>
            <li><strong>Premium Development:</strong> $35-$50 per vine</li>
          </ul>
          <Callout type="tip" title="Density Trade-off">
            Higher density (more vines/acre) means higher cost per acre but same cost per vine. Lower density reduces per-acre investment but may reduce quality in some varieties (Pinot Noir, Chardonnay prefer higher density).
          </Callout>
        </Subsection>
      </Section>

      <Section title="Equipment & Machinery">
        <Subsection title="Essential Equipment List">
          <p>
            The Details tab shows all budgeted equipment:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Tractor:</strong> HP rating, purchase price, financing terms</li>
            <li><strong>Sprayer:</strong> Tank capacity, boom width, cost</li>
            <li><strong>Mower:</strong> Type (flail, rotary, sickle bar), width, cost</li>
            <li><strong>Implements:</strong> Cultivator, aerator, vineyard tools</li>
            <li><strong>Harvest Equipment:</strong> Bins, picking tools, transport</li>
          </ul>
        </Subsection>

        <Subsection title="Equipment Sizing">
          <p>
            Properly size equipment for your acreage to avoid over/under-investment:
          </p>
          <Table
            headers={["Acreage", "Tractor HP", "Sprayer Size", "Work Rate"]}
            rows={[
              ["5-10 acres", "40-50 HP", "50-100 gal", "1-2 acres/hour"],
              ["10-25 acres", "50-70 HP", "100-200 gal", "2-4 acres/hour"],
              ["25-50 acres", "70-90 HP", "200-300 gal", "4-6 acres/hour"],
              ["50+ acres", "90+ HP", "300-500 gal", "6-10 acres/hour"],
            ]}
          />
          <p className="text-sm text-gray-600 mt-3">
            Oversized equipment wastes fuel and capital. Undersized equipment causes bottlenecks during time-critical operations (spraying, harvest).
          </p>
        </Subsection>
      </Section>

      <Section title="Land & Buildings">
        <Subsection title="Land Acquisition Details">
          <p>
            Complete land purchase breakdown:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Total Land Cost:</strong> Acres × cost per acre</li>
            <li><strong>Down Payment:</strong> Percentage of purchase price paid upfront</li>
            <li><strong>Financed Amount:</strong> Remaining balance for land loan</li>
            <li><strong>Interest Rate:</strong> Annual percentage rate</li>
            <li><strong>Loan Term:</strong> Years to repayment (typically 15-30 years)</li>
            <li><strong>Monthly Payment:</strong> Principal + interest</li>
          </ul>
        </Subsection>

        <Subsection title="Building & Infrastructure">
          <p>
            Permanent improvements budgeted in Year 0:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Equipment Barn:</strong> Square footage and construction cost</li>
            <li><strong>Winery (if applicable):</strong> Crush pad, cellar, barrel room</li>
            <li><strong>Tasting Room (if applicable):</strong> Retail space construction</li>
            <li><strong>Utilities:</strong> Well, power, septic, roads</li>
            <li><strong>Fencing:</strong> Perimeter fencing for deer/pest exclusion</li>
          </ul>
        </Subsection>
      </Section>

      <Section title="Using the Details Tab">
        <Subsection title="Pre-Build Verification">
          <p>
            Review Details tab before breaking ground:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Verify vine count matches planting plan</li>
            <li>Check material quantities against supplier quotes</li>
            <li>Confirm irrigation GPM requirement matches well capacity</li>
            <li>Validate cost per acre against regional benchmarks</li>
          </ul>
        </Subsection>

        <Subsection title="Material Ordering">
          <p>
            Use calculated quantities to order materials:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Posts: Order calculated quantity + 5% for waste/damage</li>
            <li>Wire: Order calculated footage + 10% for tensioning/waste</li>
            <li>Drip tape: Order row footage + 5% for repairs</li>
            <li>Vines: Order exact count + 2-3% for replants (Year 1 failures)</li>
          </ul>
        </Subsection>

        <Subsection title="Contractor Bids">
          <p>
            Share Details tab metrics with contractors for accurate bids:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Provide total acres, row count, vine count</li>
            <li>Specify post spacing, wire count, trellis system</li>
            <li>Detail irrigation zones, GPM requirement, emitter spacing</li>
            <li>Request itemized bids (materials separate from labor)</li>
          </ul>
        </Subsection>

        <Subsection title="Financing Documentation">
          <p>
            Lenders require detailed project cost breakdowns:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Export Details tab as PDF for loan application</li>
            <li>Show per-acre costs to justify loan amount</li>
            <li>Demonstrate understanding of infrastructure requirements</li>
            <li>Prove budget aligns with industry norms (not over/under-funded)</li>
          </ul>
        </Subsection>
      </Section>

      <Callout type="note" title="Real-Time Updates">
        The Details tab recalculates instantly when you change Design or Financial Inputs. Use it as a live calculator to explore "what-if" scenarios: "What if I plant 8 acres instead of 10?" "What if I use 8×10 spacing instead of 6×10?"
      </Callout>

      <NextSteps
        links={[
          {
            title: "Design Tab",
            description: "Draw vineyard layout and select spacing configuration",
            href: "/docs/planner/design",
          },
          {
            title: "Financial Inputs",
            description: "Set costs, pricing, and financing assumptions",
            href: "/docs/planner/financial-inputs",
          },
          {
            title: "Vineyard Setup",
            description: "See Year 0 investment breakdown",
            href: "/docs/planner/vineyard-setup",
          },
        ]}
      />
    </DocsLayout>
  );
}
