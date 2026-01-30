import DocsLayout from "../DocsLayout";
import { DocsHeader, Section, Subsection, Callout, ParamList, Table, NextSteps } from "../DocsComponents";

export default function BlocksPage() {
  const blockProperties = [
    {
      name: "name",
      type: "string",
      required: true,
      description: "Block identifier (e.g., 'Block A', 'North Field')",
    },
    {
      name: "variety",
      type: "string",
      required: true,
      description: "Grape variety (e.g., 'Cabernet Sauvignon', 'Chardonnay')",
    },
    {
      name: "rootstock",
      type: "string",
      required: false,
      description: "Rootstock type used for grafting",
    },
    {
      name: "clone",
      type: "string",
      required: false,
      description: "Specific clone number or designation",
    },
    {
      name: "acres",
      type: "number",
      required: true,
      description: "Total acreage of the block",
    },
    {
      name: "year_planted",
      type: "number",
      required: false,
      description: "Year the vines were planted",
    },
    {
      name: "row_spacing",
      type: "number",
      required: false,
      description: "Distance between rows in feet",
    },
    {
      name: "vine_spacing",
      type: "number",
      required: false,
      description: "Distance between vines in feet",
    },
    {
      name: "row_orientation",
      type: "number",
      required: false,
      description: "Row direction in degrees (0-360)",
    },
    {
      name: "trellis_system",
      type: "string",
      required: false,
      description: "Trellis type (e.g., 'VSP', 'Scott Henry', 'Geneva Double Curtain')",
    },
  ];

  return (
    <DocsLayout>
      <DocsHeader
        title="Field Management"
        subtitle="Map, organize, and track detailed information about each vineyard field with GPS boundaries and viticulture data."
      />

      <Section title="Overview">
        <p>
          Field Management is the foundation of your vineyard operations. Each field represents a distinct area of your vineyard with specific characteristics—variety, rootstock, planting year, spacing, and soil conditions.
        </p>
        <p>
          You can draw GPS boundaries on satellite imagery, track viticulture details, collect harvest samples, monitor maturity metrics (Brix, pH, TA), and view historical yield data for each block.
        </p>
      </Section>

      <Section title="Creating Blocks">
        <Subsection title="From the Vineyard Planner">
          <p>
            If you've already designed your vineyard layout in the Vineyard Planner, you can import those field boundaries directly into Operations:
          </p>
          <ol className="list-decimal list-inside space-y-2 ml-4">
            <li>Go to Operations → Blocks</li>
            <li>Click "Import from Planner"</li>
            <li>Select your saved plan</li>
            <li>Blocks are created with GPS geometry and acreage pre-filled</li>
          </ol>
        </Subsection>

        <Subsection title="Manual Creation">
          <p>
            Create blocks from scratch by clicking "Add Block" and filling in:
          </p>
          <ParamList params={blockProperties} />
        </Subsection>

        <Subsection title="Drawing Boundaries on the Map">
          <p>
            Use the interactive map to draw precise GPS polygons for each block:
          </p>
          <ol className="list-decimal list-inside space-y-2 ml-4">
            <li>Switch to Map View</li>
            <li>Click the drawing tool (polygon icon)</li>
            <li>Click points around your block to create a boundary</li>
            <li>Close the polygon by clicking the starting point</li>
            <li>System auto-calculates acreage from GPS coordinates</li>
          </ol>
        </Subsection>
      </Section>

      <Section title="Block Properties">
        <Subsection title="Identity & Status">
          <Table
            headers={["Field", "Description"]}
            rows={[
              ["Name", "Block identifier for easy reference"],
              ["Status", "Active, Fallow, New, or Removed - affects task visibility"],
              ["Notes", "General notes about the block"],
            ]}
          />
        </Subsection>

        <Subsection title="Viticulture Details">
          <p>
            Track complete viticulture specifications for each block:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Variety:</strong> Grape variety (e.g., Cabernet Sauvignon)</li>
            <li><strong>Rootstock:</strong> Rootstock type (e.g., 101-14, 3309C)</li>
            <li><strong>Clone:</strong> Clone designation (e.g., Clone 4, Clone 337)</li>
            <li><strong>Year Planted:</strong> Planting year for age tracking</li>
            <li><strong>Spacing:</strong> Row spacing and vine spacing in feet</li>
            <li><strong>Row Orientation:</strong> Compass direction of rows (0-360°)</li>
            <li><strong>Trellis System:</strong> VSP, Scott Henry, GDC, etc.</li>
            <li><strong>Vine Count:</strong> Actual or auto-calculated from spacing</li>
          </ul>
        </Subsection>

        <Subsection title="Soil Data">
          <p>
            Record soil characteristics that affect irrigation and nutrition decisions:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Soil Type:</strong> Classification (e.g., Loam, Clay, Sandy)</li>
            <li><strong>pH Level:</strong> Soil acidity/alkalinity (typically 5.5-7.5 for vines)</li>
            <li><strong>Texture:</strong> Soil particle composition</li>
            <li><strong>Drainage Rating:</strong> How quickly water percolates</li>
            <li><strong>Organic Matter %:</strong> Organic content percentage</li>
            <li><strong>Soil Notes:</strong> Additional observations</li>
          </ul>
        </Subsection>

        <Subsection title="Auto-Calculated Metrics">
          <p>
            The system automatically calculates infrastructure requirements based on spacing and acreage:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Vines per Acre:</strong> 43,560 sq ft ÷ (row spacing × vine spacing)</li>
            <li><strong>Total Vines:</strong> Acres × vines per acre</li>
            <li><strong>Estimated Rows:</strong> Derived from area and row spacing</li>
            <li><strong>Estimated Posts:</strong> Total wire length ÷ 30 feet</li>
            <li><strong>Estimated Wire Footage:</strong> Rows × row length</li>
          </ul>
        </Subsection>
      </Section>

      <Section title="Harvest Sample Collection">
        <p>
          Track berry maturity directly in each block to guide harvest timing decisions:
        </p>
        <ul className="list-disc list-inside space-y-2 ml-4">
          <li><strong>Brix:</strong> Sugar content (°Brix) - indicates ripeness</li>
          <li><strong>pH:</strong> Berry juice acidity level (typically 3.0-3.8)</li>
          <li><strong>Titratable Acidity (TA):</strong> Total acid content (g/L)</li>
          <li><strong>Berry Size:</strong> Visual assessment of berry development</li>
          <li><strong>Disease Pressure:</strong> Notes on botrytis, powdery mildew, etc.</li>
          <li><strong>Ready to Pick Estimate:</strong> Days until optimal harvest</li>
          <li><strong>Sample Date:</strong> When sample was collected</li>
          <li><strong>Photos:</strong> Attach images of clusters or problem areas</li>
        </ul>
        <Callout type="tip" title="Best Practice">
          Sample the same representative vines weekly during véraison (color change) to track maturity progression. Take samples from multiple locations within the block for accuracy.
        </Callout>
      </Section>

      <Section title="PHI & REI Lock Tracking">
        <Subsection title="Pre-Harvest Interval (PHI)">
          <p>
            When you apply chemicals with PHI restrictions, the system automatically locks the block from harvest until the PHI period expires. You'll see a visual indicator showing days remaining.
          </p>
        </Subsection>

        <Subsection title="Re-Entry Interval (REI)">
          <p>
            After spray applications, blocks are locked from worker entry during the REI period. Task assignments to locked blocks show warnings to prevent violations.
          </p>
        </Subsection>
      </Section>

      <Section title="Yield History">
        <p>
          Track year-over-year yield performance for each block:
        </p>
        <ul className="list-disc list-inside space-y-2 ml-4">
          <li>Tons harvested per year</li>
          <li>Tons per acre</li>
          <li>Average Brix at harvest</li>
          <li>Historical trends and variance</li>
          <li>Compare blocks to identify high/low performers</li>
        </ul>
      </Section>

      <Callout type="note" title="Custom Fields">
        Need to track something not in the standard fields? Use the Custom Fields (JSONB) storage to add your own block-specific data like irrigation zone names, GPS coordinates for specific features, or vineyard-specific codes.
      </Callout>

      <NextSteps
        links={[
          {
            title: "Irrigation Management",
            description: "Schedule irrigation and track water usage by block",
            href: "/docs/operations/irrigation",
          },
          {
            title: "Task Management",
            description: "Assign vineyard tasks to specific blocks",
            href: "/docs/operations/tasks",
          },
          {
            title: "Harvest Tracking",
            description: "Plan and record harvest loads by block",
            href: "/docs/operations",
          },
        ]}
      />
    </DocsLayout>
  );
}
