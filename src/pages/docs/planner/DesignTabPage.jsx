import DocsLayout from "../DocsLayout";
import { DocsHeader, Section, Subsection, Callout, Table, NextSteps } from "../DocsComponents";

export default function DesignTabPage() {
  return (
    <DocsLayout>
      <DocsHeader
        title="Design Tab"
        subtitle="Configure vineyard layout, vine spacing, trellis systems, and irrigation infrastructure with automatic material cost calculations."
      />

      <Section title="Overview">
        <p>
          The Design Tab is your vineyard layout calculator. Input acreage, vine spacing, row orientation, and plot shape—then watch the system calculate total vines, row count, post requirements, wire footage, and material costs automatically.
        </p>
        <p>
          This tab generates the physical infrastructure numbers you need for site preparation, purchasing materials, and estimating labor requirements for Year 0 establishment.
        </p>
      </Section>

      <Section title="Basic Layout Configuration">
        <Subsection title="Acreage">
          <p>
            Total vineyard acreage planted. This drives all other calculations—material quantities, vine counts, and establishment costs scale directly with acreage.
          </p>
        </Subsection>

        <Subsection title="Vine Spacing">
          <p>
            Choose from industry-standard spacing configurations:
          </p>
          <Table
            headers={["Spacing", "Vines per Acre", "Typical Use"]}
            rows={[
              ["4×8 feet", "1,361", "High-density premium wine grapes"],
              ["5×8 feet", "1,089", "Standard wine grape spacing"],
              ["6×9 feet", "807", "Lower-density table grapes"],
              ["6×10 feet", "726", "Wide spacing for equipment access"],
              ["7×10 feet", "622", "Very wide spacing"],
              ["8×12 feet", "454", "Maximum spacing for mechanization"],
            ]}
          />
          <p className="text-sm text-gray-600 mt-3">
            Formula: 43,560 sq ft per acre ÷ (row spacing × vine spacing) = vines per acre
          </p>
        </Subsection>

        <Subsection title="Row Orientation">
          <p>
            Set row direction in degrees (0-360°) for optimal sun exposure. Common orientations:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>North-South (0° or 180°):</strong> Even sun exposure on both canopy sides</li>
            <li><strong>East-West (90° or 270°):</strong> Maximum morning/afternoon sun, one-sided exposure</li>
            <li><strong>Northeast-Southwest (45° or 225°):</strong> Compromise for sloped terrain</li>
          </ul>
          <Callout type="tip" title="Site-Specific">
            Row orientation should follow slope contours for erosion control and consider prevailing wind direction for air drainage.
          </Callout>
        </Subsection>

        <Subsection title="Plot Shape">
          <p>
            Choose how your vineyard acreage is shaped to calculate row lengths and infrastructure:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Square:</strong> Equal dimensions (e.g., 10 acres = ~660×660 feet)</li>
            <li><strong>Rectangle:</strong> Specify custom length-to-width ratio</li>
            <li><strong>Custom Ratio:</strong> Irregular shapes with defined aspect ratio</li>
          </ul>
          <p className="text-sm text-gray-600 mt-3">
            Shape affects row count, end post requirements, and turning space for equipment.
          </p>
        </Subsection>
      </Section>

      <Section title="Auto-Calculated Metrics">
        <Subsection title="Total Vines">
          <p>
            System calculates total vineyard vine count by multiplying acres × vines per acre. This determines:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Vine stock purchase quantity (add 5-10% for mortality)</li>
            <li>Planting labor estimates (crew can plant 200-400 vines/day)</li>
            <li>Long-term pruning and canopy management labor</li>
          </ul>
        </Subsection>

        <Subsection title="Row Count & Length">
          <p>
            Based on acreage, plot shape, and row spacing, the system calculates:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Number of Rows:</strong> Total rows across the vineyard</li>
            <li><strong>Average Row Length:</strong> Feet per row (used for wire calculations)</li>
            <li><strong>Total Linear Feet:</strong> Sum of all row lengths</li>
          </ul>
        </Subsection>

        <Subsection title="Post Requirements">
          <p>
            Trellis posts are spaced every 20-30 feet along each row. The calculator estimates:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>End Posts:</strong> 2 per row (larger, anchored posts)</li>
            <li><strong>Line Posts:</strong> Intermediate posts every 24 feet (standard)</li>
            <li><strong>Total Posts:</strong> Sum of end + line posts</li>
          </ul>
          <Callout type="note" title="Post Sizing">
            End posts are typically 6-8" diameter, 8-10 feet long. Line posts are 4-6" diameter, 7-8 feet long. Add 10% extra for breakage.
          </Callout>
        </Subsection>

        <Subsection title="Wire Footage">
          <p>
            Calculates total wire needed based on trellis system type:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>VSP (Vertical Shoot Positioning):</strong> 3-4 wires per row</li>
            <li><strong>Scott Henry:</strong> 5-6 wires per row (divided canopy)</li>
            <li><strong>Geneva Double Curtain (GDC):</strong> 4 wires + crossarms</li>
            <li><strong>Single High Wire:</strong> 1-2 wires (minimalist)</li>
          </ul>
          <p className="text-sm text-gray-600 mt-3">
            Formula: Row length × number of rows × wires per row = total wire footage
          </p>
        </Subsection>
      </Section>

      <Section title="Trellis System Selection">
        <Subsection title="System Types">
          <Table
            headers={["Trellis System", "Wires", "Best For"]}
            rows={[
              ["VSP (Vertical)", "3-4", "Premium wine grapes, high quality, labor-intensive"],
              ["Scott Henry", "5-6", "High vigor sites, divided canopy, better air flow"],
              ["GDC", "4 + crossarms", "Table grapes, high yields, machine harvest"],
              ["Single High Wire", "1-2", "Low cost, minimal wine grapes, simple management"],
            ]}
          />
        </Subsection>

        <Subsection title="Cost Implications">
          <p>
            Trellis system choice affects material costs significantly:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>VSP:</strong> $3,000-$5,000/acre (moderate wire, standard posts)</li>
            <li><strong>Scott Henry:</strong> $4,000-$6,000/acre (more wire, taller posts)</li>
            <li><strong>GDC:</strong> $5,000-$7,000/acre (crossarms, anchoring, more wire)</li>
            <li><strong>Single Wire:</strong> $1,500-$2,500/acre (minimal materials)</li>
          </ul>
        </Subsection>
      </Section>

      <Section title="Irrigation Layout">
        <Subsection title="Drip System Design">
          <p>
            Calculate drip irrigation infrastructure requirements:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Mainline:</strong> PVC pipe from water source to vineyard (3-6" diameter)</li>
            <li><strong>Sub-mains:</strong> Lateral pipes along row ends (2-4" diameter)</li>
            <li><strong>Drip Line:</strong> One line per vine row with emitters every 2-4 feet</li>
            <li><strong>Drip Tape Footage:</strong> Row length × number of rows = total drip line</li>
          </ul>
        </Subsection>

        <Subsection title="Emitter Spacing">
          <p>
            Set emitter spacing based on soil type and vine water needs:
          </p>
          <Table
            headers={["Soil Type", "Emitter Spacing", "Flow Rate"]}
            rows={[
              ["Sandy", "2 feet", "0.5-1.0 GPH"],
              ["Loam", "3 feet", "1.0 GPH"],
              ["Clay", "4 feet", "0.5-1.0 GPH"],
            ]}
          />
        </Subsection>

        <Subsection title="Pump & Filter Requirements">
          <p>
            System calculates water flow needs based on:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Total acreage × GPM per acre = peak flow rate</li>
            <li>Elevation change from water source to highest point</li>
            <li>Filter sizing (sand media or disc filters)</li>
            <li>Fertilizer injector capacity</li>
          </ul>
        </Subsection>
      </Section>

      <Section title="Material Cost Summary">
        <Subsection title="Trellis Materials">
          <p>
            Design tab calculates total cost for:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>End posts (quantity × $25-$40 each)</li>
            <li>Line posts (quantity × $8-$15 each)</li>
            <li>High-tensile wire (total footage ÷ 4,000 ft/roll × $150/roll)</li>
            <li>Anchors and bracing ($200-$400 per acre)</li>
            <li>Staples, clips, and hardware ($100-$200 per acre)</li>
          </ul>
        </Subsection>

        <Subsection title="Irrigation Materials">
          <p>
            Itemized irrigation costs:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Drip tape/tubing (per foot pricing, typically $0.10-$0.20/ft)</li>
            <li>Mainline PVC (per foot by diameter)</li>
            <li>Valves, fittings, and connectors</li>
            <li>Filters and pressure regulators</li>
            <li>Pump and control system (not included in per-acre calc)</li>
          </ul>
        </Subsection>
      </Section>

      <Callout type="tip" title="Best Practice">
        Get multiple quotes from local suppliers—prices vary significantly by region. Add 10-15% contingency for waste, breakage, and design changes during installation.
      </Callout>

      <NextSteps
        links={[
          {
            title: "Financial Inputs",
            description: "Set land costs, revenue assumptions, and financing",
            href: "/docs/planner/financial-inputs",
          },
          {
            title: "Vineyard Setup",
            description: "View Year 0 investment breakdown with material costs",
            href: "/docs/planner/vineyard-setup",
          },
          {
            title: "10-Year Plan",
            description: "See how vineyard design affects long-term profitability",
            href: "/docs/planner/ten-year-plan",
          },
        ]}
      />
    </DocsLayout>
  );
}
