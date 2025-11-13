import DocsLayout from "../DocsLayout";
import { DocsHeader, Section, Subsection, Callout, InlineCode, NextSteps } from "../DocsComponents";

export default function ConceptsPage() {
  return (
    <DocsLayout>
      <DocsHeader
        title="Core Concepts"
        subtitle="Key terms and financial concepts you'll encounter when planning your vineyard."
      />

      <Section title="Vineyard Layout">
        <Subsection title="Vine Spacing">
          <p>
            The distance between vines within rows and between rows, typically measured in feet.
            Common patterns include 6×8, 6×10, 7×9, and 8×12. Tighter spacing (e.g., 4×8) produces
            more vines per acre but increases establishment and maintenance costs.
          </p>
          <Callout type="note">
            <strong>Example:</strong> A 6×8 spacing means 6 feet between vines in the row and 8 feet between rows.
            This yields approximately 908 vines per acre.
          </Callout>
        </Subsection>

        <Subsection title="Plantable Area">
          <p>
            The actual area available for planting after accounting for setbacks, roads, buildings,
            and non-plantable terrain. Typically 70-90% of total acreage depending on property layout.
          </p>
        </Subsection>

        <Subsection title="Row Orientation">
          <p>
            The compass direction rows run (e.g., North-South, East-West). Affects sun exposure,
            airflow, erosion control, and harvest efficiency. North-South is common for balanced sun
            exposure, but topography and prevailing winds often dictate optimal orientation.
          </p>
        </Subsection>
      </Section>

      <Section title="Financial Terms">
        <Subsection title="Establishment Costs">
          <p>
            One-time Year 0 expenses to prepare land and plant vines. Includes site preparation,
            trellis systems, irrigation infrastructure, vine stock, fencing, and initial equipment purchases.
            Typically ranges from $15,000-$40,000 per acre depending on region and quality level.
          </p>
        </Subsection>

        <Subsection title="Operating Costs">
          <p>
            Recurring annual expenses including labor, cultural operations (pruning, canopy management,
            pest control), harvest, hauling, assessments, overhead, and equipment maintenance. Costs
            vary by vineyard age—younger vines cost less to maintain but produce no revenue.
          </p>
        </Subsection>

        <Subsection title="Yield Curve">
          <p>
            The progression of grape production as vines mature. Year 1-2: No production. Year 3: First
            light crop (~25% of mature yield). Year 4-5: Increasing yields (50-75%). Year 6+: Full
            production. Understanding the yield curve is critical for accurate revenue forecasting.
          </p>
        </Subsection>

        <Subsection title="Break-Even Point">
          <p>
            The year when cumulative cash flow turns positive—when total revenue finally exceeds total
            costs since establishment. For most vineyards, this occurs in Year 7-12 depending on
            production model, debt load, and grape prices.
          </p>
        </Subsection>

        <Subsection title="Debt Service Coverage Ratio (DSCR)">
          <p>
            A key lender metric calculated as <InlineCode>Net Operating Income / Annual Debt Payments</InlineCode>.
            Banks typically require DSCR ≥ 1.25 (meaning income is 125% of debt obligations). Below 1.0
            means the operation cannot cover debt payments from operational cash flow.
          </p>
        </Subsection>
      </Section>

      <Section title="Production Models">
        <Subsection title="Bulk Grape Sales">
          <p>
            Selling grapes to other wineries by the ton. Lower capital requirements (no winery needed)
            but lower margins. Typical prices: $1,500-$5,000/ton depending on variety and AVA prestige.
            Revenue starts Year 3-4 as vines begin producing.
          </p>
        </Subsection>

        <Subsection title="Estate Bottling">
          <p>
            Producing wine in-house and selling bottles directly or through wholesale channels. Higher
            capital requirements (winery, equipment, permits, inventory) but significantly higher margins.
            Typical retail: $25-$75/bottle. Revenue delayed 2-3 years after harvest for aging and release.
          </p>
        </Subsection>

        <Subsection title="Hybrid Model">
          <p>
            Selling bulk grapes during establishment years (Year 3-5) to generate cash flow while
            building winery infrastructure. Transition to bottling in Year 6+ once capital is available
            and brand is established. Balances early revenue with long-term profitability.
          </p>
        </Subsection>
      </Section>

      <Section title="Financing">
        <Subsection title="USDA FSA Loans">
          <p>
            Farm Service Agency programs designed for beginning and small-scale farmers. Include
            Microloans (up to $50k, simplified approval), Farm Ownership loans (up to $600k for land
            and improvements), and Operating loans (up to $400k for annual expenses).
          </p>
        </Subsection>

        <Subsection title="Commercial LOC">
          <p>
            Line of Credit from commercial banks for operational expenses. Typically requires established
            credit history, positive cash flow, and collateral. Rates vary (5-8%) based on
            creditworthiness and relationship banking.
          </p>
        </Subsection>

        <Subsection title="Equipment Financing">
          <p>
            Secured loans for tractors, sprayers, harvesters, and winery equipment. Terms typically
            5-10 years with equipment as collateral. Down payment usually 10-20%. Interest rates
            slightly higher than land loans due to depreciation risk.
          </p>
        </Subsection>
      </Section>

      <Callout type="tip" title="Further Reading">
        For a deep dive into how these concepts translate into financial calculations, see the{" "}
        <a href="/docs/planner/formulas" className="text-vine-green-600 underline">
          Financial Formulas Reference
        </a>
        .
      </Callout>

      <NextSteps
        links={[
          {
            title: "Quick Start Guide",
            description: "Create your first financial projection step-by-step",
            href: "/docs/getting-started/quick-start",
          },
          {
            title: "Financial Planner Overview",
            description: "Explore all features of the planning tool",
            href: "/docs/planner",
          },
        ]}
      />
    </DocsLayout>
  );
}
