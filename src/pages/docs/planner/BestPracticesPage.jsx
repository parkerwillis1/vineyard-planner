import DocsLayout from "../DocsLayout";
import { DocsHeader, Section, Subsection, Callout, Table, NextSteps } from "../DocsComponents";

export default function BestPracticesPage() {
  return (
    <DocsLayout>
      <DocsHeader
        title="Vineyard Planning Best Practices"
        subtitle="Proven strategies from experienced growers and viticulturists for successful vineyard development, financial planning, and risk management."
      />

      <Section title="Overview">
        <p>
          Successful vineyard projects follow repeatable patterns—conservative financial planning, proper site selection, realistic timelines, and contingency planning. This guide consolidates lessons from hundreds of vineyard developments to help you avoid costly mistakes.
        </p>
        <p>
          Whether you're a first-time grower or expanding an existing operation, these best practices increase your odds of on-time, on-budget project completion and long-term profitability.
        </p>
      </Section>

      <Section title="Financial Planning">
        <Subsection title="Conservative Revenue Assumptions">
          <p>
            The #1 cause of vineyard financial failure is over-optimistic revenue projections:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Use below-average pricing:</strong> Model at 70-80% of current market prices, not peak prices</li>
            <li><strong>Assume standard yield ramp:</strong> Don't assume 100% yield by Year 3—use Year 5</li>
            <li><strong>Plan for crop loss years:</strong> Budget 1-2 years of significantly reduced yield (frost, hail, disease) in 10-year projections</li>
            <li><strong>Don't count on contracts:</strong> Winery contracts expire, renegotiate downward, or get cancelled—have backup markets</li>
          </ul>
          <Callout type="warning" title="Real-World Example">
            A Sonoma grower projected $4,500/ton Pinot Noir pricing based on 2019 peak demand. By 2023, oversupply dropped prices to $2,200/ton. Conservative $3,000/ton projection would have kept the business solvent.
          </Callout>
        </Subsection>

        <Subsection title="Budget 20% Contingency on Costs">
          <p>
            Development costs always exceed initial estimates:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Unexpected site conditions (rock, drainage issues)</li>
            <li>Weather delays extending labor timelines</li>
            <li>Supply chain disruptions (materials, equipment)</li>
            <li>Learning curve waste for DIY installation</li>
            <li>Change orders as reality differs from plan</li>
          </ul>
          <p className="text-sm text-gray-600 mt-3">
            Add 20% to every cost category. If your base budget is $200,000, secure $240,000 in funding. The 70% of projects that run over budget average 18% cost overrun.
          </p>
        </Subsection>

        <Subsection title="Maintain 18-24 Month Cash Reserves">
          <p>
            Cash reserve requirements by phase:
          </p>
          <Table
            headers={["Phase", "Reserve Requirement", "Why"]}
            rows={[
              ["Development (Year 0)", "24 months operating cost", "Lenders require proof before loan approval"],
              ["Establishment (Years 1-3)", "18 months operating cost", "Cover losses before revenue begins"],
              ["Production Ramp (Years 4-6)", "12 months operating cost", "Buffer for low-yield or low-price years"],
              ["Mature Operation (Year 7+)", "6 months operating cost", "Standard business emergency fund"],
            ]}
          />
        </Subsection>

        <Subsection title="Don't Over-Leverage">
          <p>
            Debt limits for sustainable vineyard operations:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Land loan:</strong> Max 75% LTV (loan-to-value) with 15-30 year term</li>
            <li><strong>Development loan:</strong> Max 70% of development cost, paid from operating cash flow by Year 10</li>
            <li><strong>Total debt service:</strong> Should not exceed 40% of projected Year 5 revenue</li>
          </ul>
          <Callout type="tip" title="The 40% Rule">
            Total annual debt payments (land + development + equipment) should be less than 40% of mature vineyard revenue. If payments exceed this, the operation is over-leveraged and vulnerable to market downturns.
          </Callout>
        </Subsection>

        <Subsection title="Model Multiple Scenarios">
          <p>
            Don't rely on a single projection—build three scenarios:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Base Case:</strong> Conservative pricing, standard yield ramp, 10% cost overrun</li>
            <li><strong>Pessimistic Case:</strong> Below-market pricing, delayed yield, 25% cost overrun, 1 crop loss year</li>
            <li><strong>Optimistic Case:</strong> Above-market pricing, fast yield ramp, on-budget costs</li>
          </ul>
          <p className="text-sm text-gray-600 mt-3">
            Your business plan should remain viable even in the pessimistic case. If pessimistic case shows negative cumulative cash flow through Year 10, re-evaluate project feasibility.
          </p>
        </Subsection>
      </Section>

      <Section title="Site Selection & Design">
        <Subsection title="Soil Over Location">
          <p>
            Don't buy land based on AVA prestige alone—soil matters more:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Drainage is critical:</strong> Poorly drained soils cause root rot and vine death—no recovery</li>
            <li><strong>Test before buying:</strong> $500 soil analysis can save you from a $200,000 mistake</li>
            <li><strong>Depth matters:</strong> Minimum 3 feet of topsoil for healthy root development</li>
            <li><strong>Rocky soil is good:</strong> Stones improve drainage and stress vines for quality (don't fear rocks)</li>
          </ul>
        </Subsection>

        <Subsection title="Water Rights First">
          <p>
            Secure water before purchasing land:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Verify well capacity (GPM) can support full irrigation at peak summer demand</li>
            <li>Confirm water rights are transferable with land purchase</li>
            <li>Test water quality (high salts or boron can damage vines)</li>
            <li>Budget for well drilling ($15,000-$75,000) if no existing source</li>
          </ul>
          <Callout type="warning" title="Water Rights Crisis">
            In California, Oregon, and Washington, water rights disputes and drought restrictions are increasing. Some vineyards lose 50-100% irrigation access during droughts. Confirm senior water rights before buying.
          </Callout>
        </Subsection>

        <Subsection title="Slope Considerations">
          <p>
            Slope impact on development costs and operations:
          </p>
          <Table
            headers={["Slope", "Development Cost Impact", "Operations Impact"]}
            rows={[
              ["0-5% (flat)", "Baseline cost", "Easy tractor work, efficient"],
              ["5-15% (gentle)", "+10-20% cost", "Standard operations, some erosion control"],
              ["15-25% (moderate)", "+25-40% cost", "Requires contour rows, erosion prevention"],
              ["25%+ (steep)", "+50-100% cost", "Specialized equipment, high erosion risk"],
            ]}
          />
          <p className="text-sm text-gray-600 mt-3">
            Hillside vineyards can produce exceptional quality but cost significantly more to develop and operate. Only worth it if premium pricing justifies extra expense.
          </p>
        </Subsection>

        <Subsection title="Frost Risk Assessment">
          <p>
            Frost damage can eliminate entire crops—assess risk before planting:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Cold air drainage:</strong> Low-lying areas are frost pockets—avoid</li>
            <li><strong>Spring frost dates:</strong> Check 30-year historical frost data for area</li>
            <li><strong>Elevation matters:</strong> Hillside mid-slope is safest (cold air sinks to valley floor)</li>
            <li><strong>Frost protection cost:</strong> Wind machines ($25,000-$50,000), sprinklers ($3,000-$6,000/acre)</li>
          </ul>
          <Callout type="tip" title="Temperature Inversion">
            In frost-prone areas, planting on mid-slope (300-800 ft elevation) takes advantage of temperature inversion—warmer than valley floor by 5-10°F during frost events.
          </Callout>
        </Subsection>

        <Subsection title="Row Orientation for Climate">
          <p>
            Optimize row direction for sun exposure and wind:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Cool climates:</strong> East-West rows maximize afternoon sun exposure for ripening</li>
            <li><strong>Hot climates:</strong> North-South rows provide even shade, reduce heat stress</li>
            <li><strong>Windy sites:</strong> Orient rows perpendicular to prevailing wind to reduce damage</li>
            <li><strong>Sloped land:</strong> Rows should follow contour (across slope) to prevent erosion</li>
          </ul>
        </Subsection>
      </Section>

      <Section title="Development & Installation">
        <Subsection title="Hire Professionals for Critical Systems">
          <p>
            DIY can save money but increases risk—hire professionals for:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Irrigation design:</strong> Mistakes cause uneven water distribution, vine stress, and crop loss</li>
            <li><strong>Electrical work:</strong> Code violations, safety hazards, and insurance issues</li>
            <li><strong>Well drilling:</strong> Specialized equipment and expertise required</li>
            <li><strong>Grading & drainage:</strong> Improper grading causes erosion and equipment damage</li>
          </ul>
          <p className="text-sm text-gray-600 mt-3">
            Acceptable DIY tasks: Post installation (with guidance), wire stringing, manual planting, barn construction (if experienced).
          </p>
        </Subsection>

        <Subsection title="Phase Development If Capital Limited">
          <p>
            Don't plant all acreage at once if funds are tight:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Phase 1:</strong> Plant 40-50% of acreage, basic equipment</li>
            <li><strong>Phase 2:</strong> Use Year 2-3 revenue to fund remaining acreage</li>
            <li><strong>Phase 3:</strong> Upgrade equipment and add facilities once cash-flow positive</li>
          </ul>
          <Callout type="tip" title="Phasing Benefits">
            Phasing reduces initial capital requirement by 40-50%, allows learning from Phase 1 mistakes before Phase 2, and spreads risk across multiple planting years. Downside: Delays full revenue by 2-3 years.
          </Callout>
        </Subsection>

        <Subsection title="Don't Cheap Out on Key Materials">
          <p>
            Materials that justify premium cost:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Trellis wire:</strong> High-tensile galvanized lasts 30+ years vs. 10 years for cheap wire</li>
            <li><strong>End posts:</strong> 6×6 pressure-treated lasts twice as long as 4×4</li>
            <li><strong>Drip emitters:</strong> Pressure-compensating emitters ($0.40 vs. $0.20) provide even water distribution</li>
            <li><strong>Vine rootstock:</strong> Certified virus-free grafted vines cost 2× but yield 30% more over 20 years</li>
          </ul>
        </Subsection>

        <Subsection title="Schedule Buffer for Weather">
          <p>
            Development timelines slip due to weather—plan accordingly:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Add 20-30% time buffer to contractor schedules</li>
            <li>Avoid planting during rainy season (access issues, delayed delivery)</li>
            <li>Order materials 6-8 weeks ahead (supply chain delays common)</li>
            <li>Have backup planting date if spring weather doesn't cooperate</li>
          </ul>
        </Subsection>
      </Section>

      <Section title="Variety Selection">
        <Subsection title="Match Variety to Climate">
          <p>
            Don't plant what you want—plant what grows best:
          </p>
          <Table
            headers={["Climate", "Cool-Season Varieties", "Warm-Season Varieties"]}
            rows={[
              ["Cool (&lt;2,500 GDD)", "Pinot Noir, Riesling, Chardonnay", "Not recommended"],
              ["Moderate (2,500-3,500 GDD)", "Pinot Noir, Chardonnay, Syrah, Merlot", "Cabernet Sauvignon, Zinfandel"],
              ["Warm (3,500-4,500 GDD)", "Not recommended", "Cabernet, Zinfandel, Grenache, Tempranillo"],
              ["Hot (&gt;4,500 GDD)", "Not recommended", "Zinfandel, Grenache, Petite Sirah"],
            ]}
          />
          <p className="text-sm text-gray-600 mt-3">
            GDD = Growing Degree Days (cumulative heat units April-October). Check local UC extension or USDA climate data for your site's GDD.
          </p>
        </Subsection>

        <Subsection title="Market Demand Trumps Personal Preference">
          <p>
            Plant for profit, not passion:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Bulk grape sales:</strong> Plant high-demand varieties (Cabernet, Chardonnay, Pinot) for contract security</li>
            <li><strong>Bottled wine:</strong> Differentiate with less-common varieties only if you have direct sales channel</li>
            <li><strong>Check regional demand:</strong> Call local wineries and ask what they're buying before planting</li>
          </ul>
        </Subsection>

        <Subsection title="Rootstock Selection Matters">
          <p>
            Rootstock affects yield, disease resistance, and longevity:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Phylloxera-prone areas:</strong> Use resistant rootstock (101-14, 3309C, SO4)</li>
            <li><strong>Nematode pressure:</strong> Freedom, Harmony rootstocks provide resistance</li>
            <li><strong>Vigor control:</strong> Low-vigor rootstocks (101-14) for fertile soils; high-vigor (110R) for poor soils</li>
            <li><strong>Consult local experts:</strong> UC Extension or local nurseries know what works in your region</li>
          </ul>
        </Subsection>
      </Section>

      <Section title="Risk Management">
        <Subsection title="Crop Insurance Is Essential">
          <p>
            Protect against catastrophic weather events:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Whole Farm Revenue Protection (WFRP):</strong> USDA program covers revenue loss from weather, price drops</li>
            <li><strong>Named Peril Policies:</strong> Cover frost, hail, wind damage</li>
            <li><strong>Cost:</strong> 2-4% of insured value (worth it for $50,000+ revenue protection)</li>
          </ul>
          <Callout type="warning" title="Real Losses">
            2017 California wildfires destroyed vineyards insured for $500M+ in crop value. 2020 Oregon ice storm caused $50M+ in trellis damage. Uninsured growers went bankrupt—insured growers rebuilt.
          </Callout>
        </Subsection>

        <Subsection title="Diversify Revenue Streams">
          <p>
            Don't rely on single buyer or market:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Sell bulk grapes to 2-3 wineries, not just one</li>
            <li>Keep 10-20% of fruit for estate bottling as insurance</li>
            <li>Develop DTC (direct-to-consumer) channel for price control</li>
            <li>Consider agritourism (tasting room, events) for additional revenue</li>
          </ul>
        </Subsection>

        <Subsection title="Build Relationships Early">
          <p>
            Networking before planting de-risks sales:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Talk to local wineries about future fruit contracts (3-5 year lead time)</li>
            <li>Join regional grape grower associations</li>
            <li>Visit successful vineyards and ask for mentorship</li>
            <li>Hire viticulture consultant for first 2-3 years (pays for itself in avoided mistakes)</li>
          </ul>
        </Subsection>

        <Subsection title="Have an Exit Plan">
          <p>
            Know your exit strategy before investing:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>10-year hold:</strong> Mature vineyard salable at 6-10× annual profit</li>
            <li><strong>Lease option:</strong> Lease to operator if you can't manage it</li>
            <li><strong>Development sale:</strong> Sell after establishment but before production (recoup development cost)</li>
            <li><strong>Conservation easement:</strong> Donate development rights for tax benefit</li>
          </ul>
        </Subsection>
      </Section>

      <Section title="Common Mistakes to Avoid">
        <Subsection title="Top 10 Vineyard Planning Failures">
          <ol className="list-decimal list-inside space-y-3 ml-4">
            <li><strong>Underestimating capital needs:</strong> Ran out of money mid-development, couldn't finish vineyard</li>
            <li><strong>Overpaying for land:</strong> Land cost so high that operation can never be profitable</li>
            <li><strong>No water rights:</strong> Bought land assuming water availability, later found restricted rights</li>
            <li><strong>Wrong variety for climate:</strong> Planted Pinot Noir in hot climate—poor quality, no buyers</li>
            <li><strong>Skipping soil test:</strong> Discovered hardpan or poor drainage after planting—vines failed</li>
            <li><strong>DIY irrigation mistakes:</strong> Uneven water distribution caused 30% yield loss</li>
            <li><strong>Cheap materials:</strong> Trellis wire rusted out in 8 years, required $40,000 replacement</li>
            <li><strong>Over-optimistic pricing:</strong> Modeled at peak prices, market crashed, cash flow collapsed</li>
            <li><strong>No crop insurance:</strong> Lost entire crop to frost, no revenue that year, couldn't pay loans</li>
            <li><strong>Planted without contracts:</strong> Had grapes but no buyers, fruit rotted on vine</li>
          </ol>
        </Subsection>
      </Section>

      <Callout type="success" title="The 80/20 Rule">
        80% of vineyard success comes from 20% of decisions: Site selection, water rights, conservative financial planning, proper variety selection, and professional irrigation design. Get these right, and minor mistakes won't sink the project.
      </Callout>

      <NextSteps
        links={[
          {
            title: "Financial Inputs",
            description: "Apply best practices to your financial model",
            href: "/docs/planner/financial-inputs",
          },
          {
            title: "10-Year Plan",
            description: "Model conservative scenarios for risk assessment",
            href: "/docs/planner/ten-year-plan",
          },
          {
            title: "Support & Resources",
            description: "Get help from viticulture experts",
            href: "/docs/support",
          },
        ]}
      />
    </DocsLayout>
  );
}
