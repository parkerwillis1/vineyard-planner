import { Link } from "react-router-dom";
import { useState } from "react";

export default function DocumentationPage() {
  const [activeSection, setActiveSection] = useState("planner");

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-vine-green-50 to-white py-20">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Documentation
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Complete guide to vineyard financial planning and operational management
          </p>
        </div>
      </section>

      {/* Section Switcher */}
      <section className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="mx-auto max-w-5xl px-6">
          <nav className="flex gap-1">
            <button
              onClick={() => setActiveSection("planner")}
              className={`px-6 py-4 font-semibold border-b-2 transition-colors ${
                activeSection === "planner"
                  ? "border-vine-green-600 text-vine-green-700"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              📊 Planning Tools
            </button>
            <button
              onClick={() => setActiveSection("vineyards")}
              className={`px-6 py-4 font-semibold border-b-2 transition-colors ${
                activeSection === "vineyards"
                  ? "border-vine-green-600 text-vine-green-700"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              🍇 Vineyard Operations <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Coming Soon</span>
            </button>
          </nav>
        </div>
      </section>

      {/* PLANNER SECTION */}
      {activeSection === "planner" && (
        <>
          {/* Quick Start Guide */}
          <section className="mx-auto max-w-5xl px-6 py-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">🚀 Quick Start Guide</h2>
            <div className="bg-vine-green-50 rounded-2xl p-8 mb-12">
              <ol className="space-y-4">
                <Step 
                  number="1" 
                  title="Set Your Projection Timeline"
                  description="Use the 'Years' input at the top right to set your planning horizon (1-30 years). Most vineyard business plans use 10-15 years to capture full maturation and profitability."
                />
                <Step 
                  number="2" 
                  title="Design Your Vineyard Layout"
                  description="In the Design tab, configure vine spacing (standard options from 4×8' to 8×12'), choose your plot shape (rectangle, square, or custom ratio), set row orientation for optimal sun exposure, and let the calculator determine total vines needed, row count, and material requirements."
                />
                <Step 
                  number="3" 
                  title="Input Core Financial Parameters"
                  description="Enter your acreage, land cost per acre, building/winery construction costs. Choose your sales strategy: bottled wine (direct-to-consumer or wholesale) or bulk grape sales to other wineries. Each strategy has different revenue models and capital requirements."
                />
                <Step 
                  number="4" 
                  title="Configure Establishment Costs"
                  description="Toggle setup items (site preparation, trellis systems, irrigation, vine stock, fencing) and customize per-acre costs. The Design tab auto-calculates trellis and irrigation costs based on your vineyard dimensions."
                />
                <Step 
                  number="5" 
                  title="Add Operating Cost Details"
                  description="Customize annual operating costs including pre-planting, planting, cultural operations (pruning, canopy management, pest control), harvest and hauling, assessments, overhead, equipment operations, and marketing."
                />
                <Step 
                  number="6" 
                  title="Model Your Financing"
                  description="Add equipment purchases with financing terms (tractors, sprayers, harvesters). Include loans (USDA FSA Microloans, Farm Ownership loans, commercial LOCs) with accurate interest rates and terms. The model calculates monthly payments and total debt service."
                />
                <Step 
                  number="7" 
                  title="Review Projections and Refine"
                  description="Jump to Vineyard Setup to see Year 0 investment breakdown, then Projection tab for year-by-year cash flow. Review break-even timeline, cumulative profitability, and adjust assumptions until your model reflects realistic scenarios."
                />
              </ol>
            </div>
          </section>

          {/* Design Tab Deep Dive */}
          <section className="bg-gray-50 py-16">
            <div className="mx-auto max-w-5xl px-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">🎨 Design Tab - Complete Reference</h2>
              
              <DetailCard title="Vine Spacing Configuration">
                <h4 className="font-semibold text-gray-900 mb-3">Spacing Pattern</h4>
                <p className="text-gray-600 mb-4">
                  Choose from industry-standard spacing patterns or create custom spacing. Common patterns:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-600 mb-4">
                  <li><strong>4' × 8' (High Density):</strong> 1,361 vines/acre. Maximizes production but requires more initial investment and labor. Best for premium wine production.</li>
                  <li><strong>6' × 10' (Standard):</strong> 726 vines/acre. Balanced approach used by most small-to-medium vineyards. Good equipment access and moderate costs.</li>
                  <li><strong>8' × 10' (Wide):</strong> 544 vines/acre. Easier tractor access, lower establishment costs, but reduced per-acre yield potential.</li>
                  <li><strong>8' × 12' (Very Wide):</strong> 454 vines/acre. Used for vigorous varieties or low-input systems. Minimal per-acre costs.</li>
                  <li><strong>Custom:</strong> Enter your exact vine spacing and row spacing for site-specific designs.</li>
                </ul>

                <h4 className="font-semibold text-gray-900 mb-3 mt-6">Vineyard Shape</h4>
                <p className="text-gray-600 mb-4">
                  Define your plot dimensions:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-600 mb-4">
                  <li><strong>Rectangle:</strong> Standard shape. Set length-to-width ratio (2:1 is common - 590' × 295' for 4 acres).</li>
                  <li><strong>Square:</strong> Equal dimensions on all sides. Simplifies layout but may not fit irregular terrain.</li>
                  <li><strong>Custom Aspect Ratio:</strong> Enter exact ratio (e.g., 3:1 for long, narrow plots or 1.5:1 for nearly square).</li>
                </ul>

                <h4 className="font-semibold text-gray-900 mb-3 mt-6">Row Orientation</h4>
                <p className="text-gray-600 mb-4">
                  Determines sun exposure and trellis post placement:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-600">
                  <li><strong>Horizontal (posts on short sides):</strong> Rows run along the length. Posts at ends. Best for north-south sun exposure.</li>
                  <li><strong>Vertical (posts on long sides):</strong> Rows run across width. Posts on long edges. Used for east-west orientation.</li>
                </ul>

                <h4 className="font-semibold text-gray-900 mb-3 mt-6">Auto-Calculated Outputs</h4>
                <ul className="list-disc pl-6 space-y-2 text-gray-600">
                  <li><strong>Total Vines:</strong> Automatically calculated and propagated to planting costs.</li>
                  <li><strong>Number of Rows:</strong> Based on row spacing and plot dimensions.</li>
                  <li><strong>Vines per Acre:</strong> Density metric for planning.</li>
                  <li><strong>Trellis Materials:</strong> Posts, wire, and hardware calculated from row count and length.</li>
                  <li><strong>Irrigation Requirements:</strong> Drip tubing and emitter quantities based on vine count and spacing.</li>
                </ul>
              </DetailCard>
            </div>
          </section>

          {/* Financial Inputs Tab Deep Dive */}
          <section className="mx-auto max-w-5xl px-6 py-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">💰 Financial Inputs Tab - Complete Reference</h2>
            
            <div className="space-y-8">
              <DetailCard title="Core Vineyard Parameters">
                <FieldDoc
                  name="Sales Strategy"
                  type="Dropdown"
                  options={["Bottle • sell finished wine", "Bulk • sell all grapes"]}
                  description="Fundamentally changes your business model. Bottled wine requires winery infrastructure, licensing, and more capital but offers higher margins ($20-50+ per bottle vs $1,200-2,500 per ton of grapes). Bulk grape sales require only vineyard operations."
                />
                <FieldDoc
                  name="Acres"
                  type="Number"
                  description="Total planted acreage. Scales nearly every cost and revenue calculation. Typical small vineyards: 2-10 acres. Medium: 10-50 acres. Most costs are calculated per-acre then multiplied by this value."
                />
                <FieldDoc
                  name="Bottle Price ($)"
                  type="Number (appears in Bottle mode)"
                  description="Wholesale price per 750ml bottle. Direct-to-consumer pricing typically $25-60+. Wholesale to distributors: $12-25. Factors: varietal, quality level, brand recognition, region. Used to calculate: Revenue = Bottles Sold × Bottle Price."
                />
                <FieldDoc
                  name="Grape Sale Price ($/ton)"
                  type="Number (appears in Bulk mode)"
                  description="Contract price per ton of grapes delivered to winery. Varies widely by variety and region: $800-1,500/ton (bulk varietals), $1,500-3,000/ton (premium), $3,000-6,000+/ton (ultra-premium Napa/Sonoma). Check regional pricing reports."
                />
                <FieldDoc
                  name="Operating Cost ($/yr)"
                  type="Auto-calculated (read-only)"
                  description="Sum of all annual recurring costs: pre-planting, planting, cultural operations, harvest, fees, equipment operations, overhead, and marketing. Excludes one-time setup costs and debt service. Typical range: $3,000-8,000 per acre per year."
                />
                <FieldDoc
                  name="Water Cost ($/acre-yr)"
                  type="Number"
                  description="Annual irrigation, pumping, and water district fees per acre. Varies by region and water source. Well water with electric pump: $200-500/acre. Ag district water: $300-800/acre. Includes energy costs for pressurization."
                />
                <FieldDoc
                  name="Land Price ($/acre)"
                  type="Number"
                  description="Purchase price per acre. Highly regional: $5,000-20,000/acre (Texas Hill Country, Virginia, Oregon), $50,000-150,000+/acre (Napa, Sonoma, Paso Robles). Financed through land loans or paid with equity."
                />
                <FieldDoc
                  name="Build Cost ($/acre)"
                  type="Number"
                  description="Winery, barn, equipment shed, tasting room construction costs allocated per acre. Small winery (3,000-5,000 sq ft): $150,000-400,000 total. Divide by planted acres for per-acre cost. Metal barn/storage: $20,000-50,000."
                />
                <FieldDoc
                  name="Setup Year"
                  type="Number"
                  description="Year when vineyard establishment occurs (Year 0 is immediate, Year 1 delays one year, etc.). Use for phased expansion planning. All Year 0 costs are shifted to this year."
                />
                <FieldDoc
                  name="License Cost ($)"
                  type="Number"
                  description="One-time application fees for federal TTB winery permit ($0 but requires forms) and state winery license ($100-500). Some states require additional local permits. Does not include annual renewals."
                />
                <FieldDoc
                  name="Available Equity ($)"
                  type="Number"
                  description="Cash and liquid assets available for down payment and gap financing. Used to calculate equity gap: Required Equity = Total Project Cost - Total Loans - Available Equity. Negative equity gap indicates you need more capital or financing."
                />
              </DetailCard>

              <DetailCard title="Vineyard Setup (One-Time Capital Costs)">
                <div className="space-y-4">
                  <SetupItemDoc
                    name="Site Preparation"
                    typicalCost="$800-2,500/acre"
                    description="Land clearing, ripping/deep tillage, contouring, road access, drainage installation. Varies greatly by terrain: flat cleared land ($800-1,200), brushy land requiring clearing ($1,500-2,500+), hillside terracing ($3,000+)."
                  />
                  <SetupItemDoc
                    name="Trellis System"
                    typicalCost="$3,500-6,000/acre"
                    description="Posts (wood or metal), high-tensile wire (3-5 wires), anchors, hardware. Auto-calculated from Design tab if configured. Manual entry: Standard VSP (Vertical Shoot Positioning) with treated wood posts: $4,000-4,500/acre. Metal posts: $5,500-6,500/acre."
                  />
                  <SetupItemDoc
                    name="Irrigation System"
                    typicalCost="Drip: $3,000-6,000/acre, Sprinkler: $2,000-4,500/acre"
                    description="Choose system type (Drip or Sprinkler). Drip includes mainline, sub-mains, drip tubing, emitters, filters, pressure regulators, fertigation system. Auto-calculated from Design tab if configured. Sprinkler: overhead or micro-sprinklers, simpler but less precise."
                  />
                  <SetupItemDoc
                    name="Vine Stock"
                    typicalCost="$3-7 per vine ($2,500-5,000/acre)"
                    description="Rooted grapevines (own-rooted or grafted), planting labor, stakes, grow tubes. Auto-calculated quantity from Design tab. Premium varieties or specialty rootstock: $5-7/vine. Standard varieties: $3-4/vine. Includes freight and handling."
                  />
                  <SetupItemDoc
                    name="Fencing"
                    typicalCost="$3,000-8,000/acre"
                    description="Perimeter deer/hog exclusion fencing. 8' tall woven wire or high-tensile electric: $4-8 per linear foot. 10-acre vineyard perimeter (~2,600 LF): $10,000-20,000 total or $1,000-2,000/acre. Varies widely by shape and terrain."
                  />
                </div>
              </DetailCard>

              <DetailCard title="Pre-Planting / Site-Prep (Recurring or Staged)">
                <p className="text-gray-600 mb-4">
                  Costs incurred before planting vines. Can be done all in Year 0 or staged across multiple years.
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-600">
                  <li><strong>Vine removal ($200-500/acre):</strong> Removing old vines if replanting existing vineyard.</li>
                  <li><strong>Soil amendments ($100-300/acre):</strong> Lime, gypsum, compost incorporation based on soil tests.</li>
                  <li><strong>Cover crop ($50-150/acre):</strong> Establishing erosion control and soil health.</li>
                </ul>
              </DetailCard>

              <DetailCard title="Planting Costs (Per-Acre or Per-Unit)">
                <p className="text-gray-600 mb-4">
                  Costs directly related to getting vines in the ground. Calculated per-acre OR unit cost × quantity.
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-600">
                  <li><strong>Vine stock ($/each):</strong> Auto-populated from Design tab or manual entry. Quantity per acre auto-calculated.</li>
                  <li><strong>Cartons & wrapping ($80-150/acre):</strong> Shipping containers and protective materials for nursery stock.</li>
                  <li><strong>Planting labor ($800-1,500/acre):</strong> Hand or machine planting, varies by terrain and crew rates.</li>
                </ul>
              </DetailCard>

              <DetailCard title="Cultural Operations (Annual Recurring)">
                <p className="text-gray-600 mb-4">
                  Yearly vineyard maintenance and care. Incurred every year after planting.
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-600">
                  <li><strong>Pruning ($120-250/acre):</strong> Winter dormant pruning, typically $15-25 per hour × 8-15 hours/acre.</li>
                  <li><strong>Canopy management ($80-150/acre):</strong> Shoot thinning, leaf pulling, hedging.</li>
                  <li><strong>Fertilizer ($60-120/acre):</strong> Nitrogen, micronutrients based on tissue and soil analysis.</li>
                  <li><strong>Pest control ($100-200/acre):</strong> Fungicides, insecticides, spraying labor and equipment.</li>
                  <li><strong>Weed control ($40-100/acre):</strong> Herbicides, mowing, cultivation labor.</li>
                </ul>
              </DetailCard>

              <DetailCard title="Harvest & Hauling">
                <ul className="list-disc pl-6 space-y-2 text-gray-600">
                  <li><strong>Machine harvest ($200-400/acre):</strong> Per-acre contract rate for mechanical harvester and crew. Alternative: hand harvest ($800-1,500/acre for premium fruit).</li>
                  <li><strong>Hauling ($/ton):</strong> Transport from vineyard to winery. $15-30/ton depending on distance. Applied to actual tons produced: Cost = Tons × $/ton.</li>
                  <li><strong>Picking bins or lugs ($20-50/acre):</strong> Container rental or purchase for hand-harvested fruit.</li>
                </ul>
              </DetailCard>

              <DetailCard title="Assessments & Fees (Annual)">
                <ul className="list-disc pl-6 space-y-2 text-gray-600">
                  <li><strong>Pierce's Disease Assessment ($3-8/acre):</strong> State-mandated disease control fee (CA, TX, southeast). Check your state ag department.</li>
                  <li><strong>Marketing order fees ($50-200/acre):</strong> Industry promotion assessments (if applicable in your region).</li>
                  <li><strong>Certification fees ($100-500 total):</strong> Organic, Biodynamic, or sustainability certification annual costs if pursuing.</li>
                </ul>
              </DetailCard>

              <DetailCard title="Cash Overhead (Annual Fixed Costs)">
                <ul className="list-disc pl-6 space-y-2 text-gray-600">
                  <li><strong>Office expense ($1,000-3,000/yr):</strong> Bookkeeping, software, supplies, phone, internet.</li>
                  <li><strong>Property taxes ($800-2,000/yr per acre-value):</strong> Varies by county; ag exemption often lowers rate.</li>
                  <li><strong>General liability insurance ($1,500-4,000/yr):</strong> Covers farm operations. Separate from crop insurance.</li>
                  <li><strong>Crop insurance ($200-600/acre):</strong> Optional USDA crop insurance for revenue/yield protection.</li>
                  <li><strong>Utilities ($500-2,000/yr):</strong> Electricity for pumps, shop, office. Water district fees if not in Water Cost.</li>
                </ul>
              </DetailCard>

              <DetailCard title="Non-Cash Overhead">
                <ul className="list-disc pl-6 space-y-2 text-gray-600">
                  <li><strong>Depreciation ($3,000-8,000/yr):</strong> Accounting expense (not cash outflow). Based on depreciable assets: equipment, buildings, improvements. 5-7 year MACRS for equipment, 15-20 year for land improvements, 27.5-39 year for buildings.</li>
                  <li><strong>Management/Owner labor (imputed):</strong> Optional: value of your own time managing the vineyard. Not a cash cost but important for true profitability analysis.</li>
                </ul>
              </DetailCard>

              <DetailCard title="Equipment Operating Costs">
                <p className="text-gray-600 mb-4">
                  Hourly operating costs × annual hours. Separate from equipment purchase financing.
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-600">
                  <li><strong>Fuel & lube ($12-20/hr):</strong> Diesel/gas, oil, filters. Hours depend on acreage: 15-30 hours/acre/yr typical.</li>
                  <li><strong>Repairs & maintenance ($5-10/hr):</strong> Ongoing equipment repairs, parts, shop labor.</li>
                  <li><strong>Equipment replacement reserve ($2-5/hr):</strong> Savings for eventual replacement of machinery.</li>
                </ul>
              </DetailCard>

              <DetailCard title="Marketing & Management">
                <ul className="list-disc pl-6 space-y-2 text-gray-600">
                  <li><strong>Vineyard management fees ($500-1,200/acre/yr):</strong> If hiring a management company. Includes all cultural operations labor but not materials.</li>
                  <li><strong>Consulting fees ($100-200/hr or $500-2,000/yr retainer):</strong> Viticultural consultant for disease diagnostics, soil/tissue analysis interpretation, spray programs.</li>
                  <li><strong>Marketing & promotion (if bottling wine) ($2,000-10,000+/yr):</strong> Website, social media, events, tasting room marketing, wine club materials.</li>
                </ul>
              </DetailCard>

              <DetailCard title="Permits & Licenses (One-Time and Annual)">
                <p className="text-gray-600 mb-4">
                  Federal, state, and local permits required for wine production and sales. Check your state ABC/alcoholic beverage control agency.
                </p>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">One-Time (Year 0):</h4>
                    <ul className="list-disc pl-6 space-y-1 text-gray-600 mt-2">
                      <li><strong>TTB Winery Permit (Federal):</strong> $0 application fee, required for all wine production. Processing time: 90-180 days.</li>
                      <li><strong>State Winery License:</strong> $100-500 depending on state (e.g., Texas TABC Winery Permit G: $150).</li>
                      <li><strong>Farm Winery Permit:</strong> Some states offer lower-cost farm winery option with production limits.</li>
                      <li><strong>Winegrower License:</strong> Production-only license if not selling direct.</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mt-4">Annual Renewals:</h4>
                    <ul className="list-disc pl-6 space-y-1 text-gray-600 mt-2">
                      <li><strong>Carrier's Permit:</strong> For transporting your own wine (e.g., TABC Carrier's Permit C: $60/yr).</li>
                      <li><strong>Tasting Room Permit:</strong> On-premise consumption license ($200-800/yr).</li>
                    </ul>
                  </div>
                </div>
              </DetailCard>

              <DetailCard title="Equipment (Financed Purchases)">
                <p className="text-gray-600 mb-4">
                  Add rows for financed equipment. Each calculates monthly/annual payment using PMT formula.
                </p>
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Standard Equipment List:</h4>
                  <ul className="list-disc pl-6 space-y-1 text-sm text-gray-600">
                    <li>Compact Tractor (40-60 HP): $25,000-40,000</li>
                    <li>PTO Mower: $5,000-8,000</li>
                    <li>Air-Blast Sprayer: $15,000-25,000</li>
                    <li>Canopy Hedger: $10,000-15,000</li>
                    <li>Utility ATV/UTV: $8,000-12,000</li>
                    <li>Row Mulcher: $6,000-9,000</li>
                    <li>Pre-Pruner: $15,000-20,000</li>
                  </ul>
                </div>
                <p className="text-sm text-gray-600">
                  <strong>Financing:</strong> Equipment loans typically 5-7 years, 4-8% APR. Enter rate as percentage (e.g., 6, not 0.06). Monthly payment = PMT(principal, rate/12, term*12).
                </p>
              </DetailCard>

              <DetailCard title="Loans (Operating and Term Debt)">
                <p className="text-gray-600 mb-4">
                  Model multiple loan sources with different terms and rates. Three defaults provided; add custom loans as needed.
                </p>
                <div className="space-y-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">USDA FSA Microloan</h4>
                    <ul className="list-disc pl-6 text-sm text-gray-600 space-y-1">
                      <li>Max: $50,000 (default $15,000)</li>
                      <li>Rate: Fixed ~4-6% (check current USDA rates)</li>
                      <li>Term: Up to 7 years</li>
                      <li>Use: Equipment, livestock, supplies, small improvements</li>
                      <li>Application: Local USDA Service Center</li>
                    </ul>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">USDA FSA Farm Ownership Loan</h4>
                    <ul className="list-disc pl-6 text-sm text-gray-600 space-y-1">
                      <li>Max: $600,000 direct, $1.75M guaranteed (default $300,000)</li>
                      <li>Rate: Fixed ~5-6%</li>
                      <li>Term: Up to 40 years</li>
                      <li>Use: Land purchase, construction, major improvements</li>
                      <li>Requires down payment (typically 10-25%)</li>
                    </ul>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Commercial Bank Line of Credit</h4>
                    <ul className="list-disc pl-6 text-sm text-gray-600 space-y-1">
                      <li>Amount: Varies ($10,000-100,000+ typical)</li>
                      <li>Rate: Variable, Prime + 2-4% (7-9% current)</li>
                      <li>Term: 1-5 years, revolving or term</li>
                      <li>Use: Operating expenses, cash flow smoothing</li>
                      <li>Requires established business history and collateral</li>
                    </ul>
                  </div>
                </div>
              </DetailCard>

              <DetailCard title="Purchased Grapes (for Wine Production)">
                <p className="text-gray-600 mb-4">
                  If bottling wine, you may purchase additional grapes to supplement your own production. Common for new vineyards during years 1-5 when estate grapes aren't yet at full production.
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-600">
                  <li><strong>Variety:</strong> Choose grape variety (Cabernet Sauvignon, Merlot, Chardonnay, etc.)</li>
                  <li><strong>Pounds:</strong> Amount to purchase. 1 ton = 2,000 lbs. Yields ~120-150 gallons or ~600-756 bottles per ton.</li>
                  <li><strong>Price per lb:</strong> Typically $0.60-1.50/lb ($1,200-3,000/ton) depending on quality and variety.</li>
                  <li><strong>Annual cost:</strong> Pounds × Price/lb, applied each year of projection.</li>
                </ul>
              </DetailCard>

              <DetailCard title="Unsold Bottles (Wine Inventory Management)">
                <p className="text-gray-600 mb-4">
                  Track bottles withheld from sale for aging, reserves, or non-commercial use (samples, staff, events). Reduces revenue in the year they're withheld.
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-600">
                  <li><strong>Category:</strong> Aging (held for later release), Non-Sold (samples/tastings), Free (donations/gifts)</li>
                  <li><strong>Year:</strong> Which projection year to withhold bottles</li>
                  <li><strong>Bottles:</strong> Quantity withheld. Formula: Sold Bottles = Produced Bottles - Withheld Bottles</li>
                  <li><strong>Use case:</strong> Model reserve program (hold 20% of production for 2-year aging before sale)</li>
                </ul>
              </DetailCard>
            </div>
          </section>

          {/* Vineyard Setup Tab Deep Dive */}
          <section className="bg-gray-50 py-16">
            <div className="mx-auto max-w-5xl px-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">🏗️ Vineyard Setup Tab - Complete Reference</h2>
              
              <DetailCard title="Year 0 Establishment Overview">
                <p className="text-gray-600 mb-4">
                  This tab visualizes all one-time capital costs required to establish your vineyard. It's your "startup budget" showing exactly where initial investment goes.
                </p>
                <h4 className="font-semibold text-gray-900 mb-3">Visual Cost Cards</h4>
                <p className="text-gray-600 mb-4">
                  Six color-coded cards display major cost categories:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-600 mb-6">
                  <li><strong>Land (Green):</strong> Acreage × Land Price per acre. Often the largest single cost.</li>
                  <li><strong>Pre-Planting (Yellow):</strong> Sum of all enabled pre-planting tasks from Financial Inputs.</li>
                  <li><strong>Planting (Emerald):</strong> Vine stock and planting labor total.</li>
                  <li><strong>Setup (Vine-Green):</strong> Site prep, trellis, irrigation, fencing - sum of all enabled setup items.</li>
                  <li><strong>License (Purple):</strong> One-time license and permit application fees.</li>
                  <li><strong>Permits (Indigo):</strong> One-time permit costs that don't renew annually.</li>
                </ul>
                
                <h4 className="font-semibold text-gray-900 mb-3">Total Investment Card</h4>
                <p className="text-gray-600 mb-4">
                  Spans full width, shows grand total of all Year 0 costs plus per-acre breakdown. This is your "check amount" - the total capital needed before any financing.
                </p>

                <h4 className="font-semibold text-gray-900 mb-3">Interactive Charts</h4>
                <ul className="list-disc pl-6 space-y-2 text-gray-600 mb-6">
                  <li><strong>Bar Chart:</strong> Horizontal bars showing relative size of each cost category. Easy to identify largest expenses at a glance.</li>
                  <li><strong>Pie Chart:</strong> Percentage breakdown of total investment. Shows proportion of budget allocated to each category.</li>
                </ul>

                <h4 className="font-semibold text-gray-900 mb-3">Cost Breakdown Table</h4>
                <p className="text-gray-600 mb-4">
                  Detailed line-item table with every establishment cost. Columns: Item name, Total cost, Percentage of total. Ends with grand total row. Copy-paste friendly for sharing with lenders or partners.
                </p>
              </DetailCard>

              <DetailCard title="Financing Summary">
                <p className="text-gray-600 mb-4">
                  Shows which loans are being used to finance the project and calculates net capital required (equity needed).
                </p>
                
                <h4 className="font-semibold text-gray-900 mb-3">Loan Options Table</h4>
                <p className="text-gray-600 mb-4">
                  Lists only the loans you've enabled (checked) in Financial Inputs. Displays:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-600 mb-6">
                  <li><strong>Lender name:</strong> FSA Microloan, FSA Farm Ownership, Bank LOC, etc.</li>
                  <li><strong>Principal:</strong> Amount borrowed</li>
                  <li><strong>Rate:</strong> Interest rate (APR)</li>
                  <li><strong>Term:</strong> Loan duration in years</li>
                </ul>
                <p className="text-gray-600 mb-4">
                  <strong>Total Loans row:</strong> Sum of all loan principals - this is the debt portion of your financing.
                </p>

                <h4 className="font-semibold text-gray-900 mb-3">Net Capital Required</h4>
                <div className="bg-purple-50 border-l-4 border-purple-600 p-4 rounded">
                  <p className="text-sm text-gray-700 mb-2">
                    <strong>Formula:</strong> Total Establishment Cost - Total Loan Principal = Net Equity Required
                  </p>
                  <p className="text-sm text-gray-600">
                    This is your actual out-of-pocket capital needed. If you have Available Equity (set in Financial Inputs), compare: Net Equity Required vs Available Equity to identify any funding gap.
                  </p>
                </div>
                
                <h4 className="font-semibold text-gray-900 mb-3 mt-6">Example Scenario</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <ul className="space-y-1 text-sm text-gray-700">
                    <li>Total Establishment Cost: $812,874</li>
                    <li>FSA Farm Ownership Loan (80% LTC): $650,000</li>
                    <li>FSA Microloan: $50,000</li>
                    <li>Total Loans: $700,000</li>
                    <li><strong>Net Capital Required: $112,874</strong></li>
                    <li>Available Equity: $150,000</li>
                    <li><strong>Equity Gap: $0</strong> (fully funded with $37,126 buffer)</li>
                  </ul>
                </div>
              </DetailCard>

              <DetailCard title="Per-Acre Analysis">
                <p className="text-gray-600 mb-4">
                  All totals are also shown on a per-acre basis for easy comparison to industry benchmarks and other vineyards.
                </p>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Typical Per-Acre Ranges:</h4>
                  <ul className="list-disc pl-6 text-sm text-gray-600 space-y-1">
                    <li><strong>Low-cost regions / bulk grapes:</strong> $25,000-40,000/acre</li>
                    <li><strong>Mid-range / quality wine:</strong> $50,000-80,000/acre</li>
                    <li><strong>Premium regions / estate winery:</strong> $100,000-200,000+/acre</li>
                  </ul>
                  <p className="text-xs text-gray-500 mt-3">
                    *Includes land, improvements, and initial working capital. Does not include winery equipment for wine production which can add $50,000-500,000+ depending on scale.
                  </p>
                </div>
              </DetailCard>
            </div>
          </section>

          {/* Projection Tab Deep Dive */}
          <section className="mx-auto max-w-5xl px-6 py-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">📈 10-Year Plan Tab - Complete Reference</h2>
            
            <div className="space-y-8">
              <DetailCard title="Top-Line Metrics (Hero Cards)">
                <p className="text-gray-600 mb-4">
                  Three large summary cards highlighting the most important outcomes:
                </p>
                <ul className="list-disc pl-6 space-y-3 text-gray-600">
                  <li>
                    <strong>Break-Even Point (Green):</strong> First year cumulative cash flow becomes positive. Formula: Year where Σ(Revenue - Cost) ≥ 0. Shows as "Year X" or "&gt;10" if beyond projection period. Typical: Years 6-10 for new vineyards.
                  </li>
                  <li>
                    <strong>Total Revenue (Green):</strong> Sum of all annual revenue across projection period. For bottled wine: Σ(Bottles Sold × Bottle Price). For bulk grapes: Σ(Tons Sold × Grape Price per Ton). Also shows average annual revenue.
                  </li>
                  <li>
                    <strong>Final Profit (Purple):</strong> Cumulative profit/loss at end of projection period. Includes Year 0 establishment costs. Formula: (Total Revenue - Total Costs) including all years. Also shows ROI: (Final Profit ÷ Total Investment) × 100%.
                  </li>
                </ul>
              </DetailCard>

              <DetailCard title="Annual Revenue vs Cost vs Net Chart">
                <p className="text-gray-600 mb-4">
                  Grouped bar chart showing three bars for each year:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-600 mb-4">
                  <li><strong>Green bars (Revenue):</strong> Gross income from wine/grape sales. Starts at $0 in years 1-3, grows in years 4-5, reaches full potential year 6+.</li>
                  <li><strong>Red bars (Cost):</strong> All annual costs including operating, debt service, equipment payments. Relatively stable year-over-year after Year 0.</li>
                  <li><strong>Blue bars (Net):</strong> Annual profit/loss (Revenue - Cost). Negative in early years, positive once production matures.</li>
                </ul>
                <p className="text-gray-600">
                  X-axis: Years (0 through projection years). Y-axis: Dollars. Hover over bars for exact values. Use this chart to identify when operation becomes cash-flow positive annually (blue bar turns positive).
                </p>
              </DetailCard>

              <DetailCard title="Year-by-Year Table">
                <p className="text-gray-600 mb-4">
                  Detailed table with full financial details for every year. Different columns based on sales mode:
                </p>
                
                <h4 className="font-semibold text-gray-900 mb-3">Bottled Wine Mode Columns:</h4>
                <ul className="list-disc pl-6 space-y-2 text-gray-600 mb-6">
                  <li><strong>Year:</strong> 0 (establishment) through final projection year</li>
                  <li><strong>Yield (t/acre):</strong> Tons per acre. 0 for years 1-3, 1.0 year 4, 2.5 year 5, 3.5 year 6+</li>
                  <li><strong>Bottles Produced:</strong> Acres × Yield × 756 bottles/ton</li>
                  <li><strong>Bottles Unsold:</strong> Any bottles withheld from sale (aging, samples, reserves)</li>
                  <li><strong>Bottles Sold:</strong> Produced - Unsold</li>
                  <li><strong>Revenue:</strong> Bottles Sold × Bottle Price</li>
                  <li><strong>Cost:</strong> All operating costs + debt service + equipment payments</li>
                  <li><strong>Net:</strong> Revenue - Cost (annual profit/loss)</li>
                  <li><strong>Cumulative:</strong> Running total of Net from Year 0 through current year</li>
                </ul>

                <h4 className="font-semibold text-gray-900 mb-3">Bulk Grape Mode Columns:</h4>
                <ul className="list-disc pl-6 space-y-2 text-gray-600 mb-6">
                  <li><strong>Year, Yield (t/acre):</strong> Same as wine mode</li>
                  <li><strong>Tons Produced:</strong> Acres × Yield per acre</li>
                  <li><strong>Tons Sold:</strong> All tons sold (no withholding in bulk model)</li>
                  <li><strong>Revenue:</strong> Tons Sold × Grape Price per Ton</li>
                  <li><strong>Cost, Net, Cumulative:</strong> Same as wine mode</li>
                </ul>

                <div className="bg-yellow-50 border-l-4 border-yellow-600 p-4 rounded mt-6">
                  <p className="text-sm text-gray-700">
                    <strong>💡 Pro Tip:</strong> Year 0 shows zero revenue but full establishment cost, resulting in large negative Net and Cumulative. This is expected - you're investing before any production. Watch Cumulative column to see when investment is recovered.
                  </p>
                </div>

                <h4 className="font-semibold text-gray-900 mb-3 mt-6">Color Coding:</h4>
                <ul className="list-disc pl-6 space-y-1 text-gray-600">
                  <li><strong className="text-green-600">Green text:</strong> Positive Net or Cumulative values</li>
                  <li><strong className="text-red-600">Red text:</strong> Negative Net or Cumulative values</li>
                  <li>Helps quickly identify profitable vs unprofitable years</li>
                </ul>
              </DetailCard>

              <DetailCard title="Yield Maturation Curve">
                <p className="text-gray-600 mb-4">
                  Understanding the production ramp-up is critical to realistic projections. Here's the default model:
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-300">
                        <th className="text-left py-2">Year</th>
                        <th className="text-left py-2">Tons/Acre</th>
                        <th className="text-left py-2">% of Full Production</th>
                        <th className="text-left py-2">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-700">
                      <tr className="border-b border-gray-200">
                        <td className="py-2">1-3</td>
                        <td className="py-2">0</td>
                        <td className="py-2">0%</td>
                        <td className="py-2">Vine establishment, no crop</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="py-2">4</td>
                        <td className="py-2">1.0</td>
                        <td className="py-2">29%</td>
                        <td className="py-2">First small crop</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="py-2">5</td>
                        <td className="py-2">2.5</td>
                        <td className="py-2">71%</td>
                        <td className="py-2">Developing production</td>
                      </tr>
                      <tr>
                        <td className="py-2">6+</td>
                        <td className="py-2">3.5</td>
                        <td className="py-2">100%</td>
                        <td className="py-2">Mature, stable yield</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-sm text-gray-600 mt-4">
                  These are industry averages. Actual yields vary by variety, rootstock, climate, and management. Premium sites may reach 4-5 tons/acre. Some varieties stay at 2-3 tons/acre for quality reasons.
                </p>
              </DetailCard>
            </div>
          </section>

          {/* Details Tab Deep Dive */}
          <section className="bg-gray-50 py-16">
            <div className="mx-auto max-w-5xl px-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">🔍 Details Tab - Complete Reference</h2>
              
              <DetailCard title="Executive Summary Section">
                <p className="text-gray-600 mb-4">
                  Three KPI cards at the top provide lender-ready metrics:
                </p>
                <ul className="list-disc pl-6 space-y-3 text-gray-600">
                  <li>
                    <strong>Break-Even Point:</strong> Same as Projection tab, shown prominently with year and cumulative profit at that milestone
                  </li>
                  <li>
                    <strong>Total Investment:</strong> Year 0 establishment cost, with per-acre breakdown
                  </li>
                  <li>
                    <strong>10-Year ROI:</strong> Return on investment percentage. Formula: (Final Cumulative Profit ÷ Total Investment) × 100%. Shows progress bar visualization.
                  </li>
                </ul>
                
                <h4 className="font-semibold text-gray-900 mb-3 mt-6">Financial Snapshot Card</h4>
                <p className="text-gray-600 mb-4">
                  Two-column layout showing key revenue and cost metrics:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <p className="font-semibold text-gray-900 mb-2">Revenue Metrics:</p>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>Annual Revenue (full production)</li>
                      <li>Annual Operating Costs</li>
                      <li>Annual Net Profit (full production)</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 mb-2">Unit Economics:</p>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>Cost per Bottle or Cost per Ton</li>
                      <li>Price per Bottle or Price per Ton</li>
                      <li>Gross Margin per Bottle/Ton</li>
                      <li>Margin percentage</li>
                    </ul>
                  </div>
                </div>
              </DetailCard>

              <DetailCard title="Comprehensive Cost Analysis">
                <p className="text-gray-600 mb-4">
                  Two-panel visualization: horizontal bar chart + breakdown table
                </p>
                
                <h4 className="font-semibold text-gray-900 mb-3">Cost Distribution Chart</h4>
                <p className="text-gray-600 mb-4">
                  Horizontal bars showing relative size of each cost category. All costs shown, including:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-gray-600 mb-4">
                  <li>Operating Cost (largest recurring expense)</li>
                  <li>Water Cost</li>
                  <li>Loan Payments (annual)</li>
                  <li>Equipment Payments (annual)</li>
                  <li>Grape Purchases (if applicable)</li>
                  <li>Setup Capital (one-time)</li>
                  <li>Permits (one-time and annual separated)</li>
                </ul>

                <h4 className="font-semibold text-gray-900 mb-3">Cost Breakdown Table</h4>
                <p className="text-gray-600 mb-4">
                  Three columns: Category, Amount ($), % of Total. Sortable and filterable. Total row at bottom. Each operating cost sub-category broken out:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-gray-600">
                  <li>Pre-Planting (from Op. Cost)</li>
                  <li>Planting (from Op. Cost)</li>
                  <li>Cultural Ops (from Op. Cost)</li>
                  <li>Harvest & Hauling (from Op. Cost)</li>
                  <li>Assessments & Fees (from Op. Cost)</li>
                  <li>Equipment Ops (from Op. Cost)</li>
                  <li>Cash Overhead (from Op. Cost)</li>
                  <li>Non-Cash Overhead (from Op. Cost)</li>
                  <li>Marketing (from Op. Cost)</li>
                </ul>
              </DetailCard>

              <DetailCard title="All Costs by Year Table">
                <p className="text-gray-600 mb-4">
                  Matrix showing every cost category across all years (columns: Year 0, Year 1, ..., Year 10). Rows:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-gray-600 mb-4">
                  <li>Startup Costs (Year 0 only)</li>
                  <li>Operating Costs (Years 1+)</li>
                  <li>Water Cost (Years 1+)</li>
                  <li>Debt Service (Years 1+)</li>
                  <li>Equipment Payments (Years 1+)</li>
                  <li>Grape Purchases (Years 1+ if applicable)</li>
                  <li>Permits annual (Years 1+)</li>
                  <li><strong>Total row:</strong> Sum of all costs per year</li>
                </ul>
                <p className="text-gray-600">
                  Use this to identify year-over-year cost trends and budget for specific years. Totals match projection tab cost column.
                </p>
              </DetailCard>

              <DetailCard title="Lender Ratios & Financing Metrics">
                <p className="text-gray-600 mb-4">
                  Four key ratio cards that lenders evaluate for creditworthiness:
                </p>
                
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">LTC (Loan-to-Cost)</h4>
                    <p className="text-sm text-gray-700 mb-2">
                      <strong>Formula:</strong> Total Loan Principal ÷ Total Project Cost
                    </p>
                    <p className="text-sm text-gray-600 mb-2">
                      Measures what percentage of project is debt-financed. Lenders typically require:
                    </p>
                    <ul className="list-disc pl-6 text-xs text-gray-600 space-y-1">
                      <li><strong>Below 80%:</strong> Acceptable for most farm loans</li>
                      <li><strong>80-90%:</strong> Requires strong financials and collateral</li>
                      <li><strong>Above 90%:</strong> Very difficult to obtain, high risk</li>
                    </ul>
                    <p className="text-xs text-gray-500 mt-2">
                      Example: $700,000 loans on $900,000 project = 77.8% LTC (acceptable)
                    </p>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">LTV (Loan-to-Value)</h4>
                    <p className="text-sm text-gray-700 mb-2">
                      <strong>Formula:</strong> Total Loan Principal ÷ (Land Value + Improvements Value)
                    </p>
                    <p className="text-sm text-gray-600 mb-2">
                      Measures loan amount relative to asset value (excluding operating costs). Lenders want:
                    </p>
                    <ul className="list-disc pl-6 text-xs text-gray-600 space-y-1">
                      <li><strong>Below 75%:</strong> Preferred, low risk</li>
                      <li><strong>75-85%:</strong> Acceptable with good credit</li>
                      <li><strong>Above 85%:</strong> High risk, may require additional collateral</li>
                    </ul>
                    <p className="text-xs text-gray-500 mt-2">
                      Improvements = Site prep + trellis + irrigation + vines + fence + building
                    </p>
                  </div>

                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Total Loans</h4>
                    <p className="text-sm text-gray-600">
                      Sum of all enabled loan principals. This is your total debt burden. Compare to Available Equity to ensure project is fully funded.
                    </p>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Project Cost</h4>
                    <p className="text-sm text-gray-600">
                      Total Year 0 establishment cost from Vineyard Setup tab. Denominator for LTC calculation.
                    </p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Land + Improvements</h4>
                    <p className="text-sm text-gray-600 mb-2">
                      Appraised asset value. Formula: (Land Price × Acres) + (Sum of all setup items × Acres) + Building Cost
                    </p>
                    <p className="text-xs text-gray-500">
                      Denominator for LTV calculation. This is what lender can recover through foreclosure/liquidation, so it's critical to their risk assessment.
                    </p>
                  </div>
                </div>

                <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded mt-6">
                  <p className="text-sm font-semibold text-gray-900 mb-2">⚠️ Important Terminology Note</p>
                  <p className="text-xs text-gray-700">
                    The model shows these ratios for informational purposes. Actual lender requirements vary by institution, loan program, borrower credit profile, and collateral quality. Always discuss specific requirements with your lender. These are guidelines, not guarantees of approval.
                  </p>
                </div>
              </DetailCard>

              <DetailCard title="Production Analysis (Charts & Insights)">
                <h4 className="font-semibold text-gray-900 mb-3">Vineyard Production Timeline Chart</h4>
                <p className="text-gray-600 mb-4">
                  Dual-axis bar chart showing yield maturation:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-600 mb-6">
                  <li><strong>Left Y-axis (Green bars):</strong> Yield in tons/acre per year</li>
                  <li><strong>Right Y-axis (Blue bars, wine mode only):</strong> Bottles produced per year</li>
                  <li>Visualizes the production ramp-up from zero (years 1-3) to full production (year 6+)</li>
                </ul>

                <h4 className="font-semibold text-gray-900 mb-3">Revenue & Profit Analysis Chart</h4>
                <p className="text-gray-600 mb-4">
                  Three-series bar chart with dual Y-axes:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-600 mb-6">
                  <li><strong>Left axis:</strong> Revenue (green) and Profit (blue) in dollars</li>
                  <li><strong>Right axis:</strong> Profit Margin % (purple)</li>
                  <li>Shows how profitability evolves as vineyard matures and reaches optimal production</li>
                </ul>

                <h4 className="font-semibold text-gray-900 mb-3">Revenue Insights Panel</h4>
                <p className="text-gray-600 mb-4">
                  Summary bullets highlighting key findings:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-gray-600">
                  <li>First revenue year (when production begins)</li>
                  Unexpected token. Did you mean `{'>'}` or `&gt;`?
                  <li>Maximum annual revenue achieved</li>
                  <li>Revenue at full production (Year 6+ steady state)</li>
                </ul>
              </DetailCard>

              <DetailCard title="Initial Investment Analysis">
                <h4 className="font-semibold text-gray-900 mb-3">Setup Cost Breakdown Chart</h4>
                <p className="text-gray-600 mb-4">
                  Bar chart showing Year 0 investment by category. Same data as Vineyard Setup tab but reformatted for detailed analysis context.
                </p>

                <h4 className="font-semibold text-gray-900 mb-3">Investment Details Table</h4>
                <p className="text-gray-600 mb-4">
                  Four-column table: Item, Cost/Acre, Total Cost, % of Setup. Includes:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-gray-600">
                  <li>All setup items (trellis, irrigation, vines, etc.)</li>
                  <li>Building</li>
                  <li>Land</li>
                  <li>License</li>
                  <li><strong>Total Investment row:</strong> Grand total with average $/acre</li>
                </ul>
              </DetailCard>

              <DetailCard title="Profitability & Break-Even Analysis">
                <h4 className="font-semibold text-gray-900 mb-3">Three-Card Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-vine-green-50 p-4 rounded-lg">
                    <p className="text-xs text-vine-green-600 font-semibold mb-1">Break-Even Timeline</p>
                    <p className="text-2xl font-bold text-vine-green-700 mb-2">Year X</p>
                    <p className="text-xs text-gray-600">When cumulative CF turns positive</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-xs text-green-700 font-semibold mb-1">Investment Recovery</p>
                    <p className="text-2xl font-bold text-green-800 mb-2">XX%</p>
                    <p className="text-xs text-gray-600">Of projection period to break-even</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-xs text-purple-700 font-semibold mb-1">10-Year ROI</p>
                    <p className="text-2xl font-bold text-purple-800 mb-2">XX%</p>
                    <p className="text-xs text-gray-600">Cumulative return on investment</p>
                  </div>
                </div>

                <h4 className="font-semibold text-gray-900 mb-3">Break-Even Analysis Chart</h4>
                <p className="text-gray-600 mb-4">
                  Bar chart showing cumulative profit/loss by year. Key features:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-600 mb-6">
                  <li><strong>Green bars:</strong> Years with positive cumulative cash flow (above $0 line)</li>
                  <li><strong>Red bars:</strong> Years with negative cumulative cash flow (below $0 line)</li>
                  <li><strong>Zero reference line:</strong> Horizontal black dashed line at y=0</li>
                  <li><strong>Break-even marker:</strong> Vertical blue dashed line at first positive cumulative year</li>
                  <li>Hover over bars to see exact cumulative profit/loss for each year</li>
                </ul>

                <h4 className="font-semibold text-gray-900 mb-3">Sensitivity Analysis Panel</h4>
                <p className="text-gray-600 mb-4">
                  Shows how changes in key variables affect break-even timing. Three scenario cards:
                </p>
                <ul className="list-disc pl-6 space-y-3 text-gray-600">
                  <li>
                    <strong>Bottle Price Impact:</strong> If price increases/decreases by $5, break-even moves forward/backward by ~1-2 years (varies by scale)
                  </li>
                  <li>
                    <strong>Operating Costs Impact:</strong> If annual costs increase/decrease by 20%, break-even shifts by ~1-3 years
                  </li>
                  <li>
                    <strong>Yield Impact:</strong> If yield increases/decreases by 0.5 tons/acre, break-even shifts by ~1-2 years
                  </li>
                </ul>
                <p className="text-sm text-gray-500 mt-4">
                  These are approximate impacts. Actual sensitivity depends on your specific numbers. Use this to understand which variables have the most leverage on profitability.
                </p>
              </DetailCard>

              <DetailCard title="Bottle Economics & Price Point Analysis (Wine Mode Only)">
                <p className="text-gray-600 mb-4">
                  Only appears when Sales Strategy = "Bottle • sell finished wine". Provides deep dive into per-bottle economics.
                </p>

                <h4 className="font-semibold text-gray-900 mb-3">Profit Margin Breakdown</h4>
                <p className="text-gray-600 mb-4">
                  Visual bar showing cost vs margin as percentage of bottle price:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-600 mb-6">
                  <li><strong>Production Cost bar (vine-green):</strong> What % of bottle price goes to costs</li>
                  <li><strong>Profit Margin bar (green):</strong> What % of bottle price is profit</li>
                  <li>Both bars sum to 100% of bottle price</li>
                  <li>Healthy wine margins: 40-70% depending on business model (DTC vs wholesale)</li>
                </ul>

                <h4 className="font-semibold text-gray-900 mb-3">Per-Bottle Metrics</h4>
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li><strong>Production Cost:</strong> Annual fixed costs ÷ (Acres × Yield × 756 bottles/ton)</li>
                    <li><strong>Bottle Price:</strong> Your set price (from Financial Inputs)</li>
                    <li><strong>Profit per Bottle:</strong> Bottle Price - Production Cost</li>
                    <li><strong>Profit Margin %:</strong> (Profit per Bottle ÷ Bottle Price) × 100</li>
                  </ul>
                </div>

                <h4 className="font-semibold text-gray-900 mb-3">Price Point Scenario Table</h4>
                <p className="text-gray-600 mb-4">
                  Shows five price points (your price ±$10 in $5 increments). For each:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-gray-600 mb-4">
                  <li>Profit per bottle</li>
                  <li>Profit margin %</li>
                  <li>Estimated break-even year</li>
                </ul>
                <p className="text-gray-600 mb-6">
                  Current price row highlighted in green. Use this to see immediate impact of price changes on profitability without re-running entire model.
                </p>

                <h4 className="font-semibold text-gray-900 mb-3">Optimal Price Point Chart</h4>
                <p className="text-gray-600 mb-4">
                  Dual-axis bar chart showing price points on X-axis:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-600 mb-6">
                  <li><strong>Left axis (green bars):</strong> Annual profit at full production for each price</li>
                  <li><strong>Right axis (blue bars):</strong> Profit margin % for each price</li>
                  <li><strong>Vertical reference line (purple):</strong> Your current price setting</li>
                </ul>
                <p className="text-gray-600 mb-6">
                  Shows relationship between price and profitability. Higher prices = higher profit (linearly) and higher margin % (non-linearly). Helps identify optimal pricing for your goals.
                </p>

                <h4 className="font-semibold text-gray-900 mb-3">Strategic Recommendations Panel</h4>
                <p className="text-gray-600 mb-4">
                  Context-aware suggestions based on your numbers:
                </p>
                <ul className="list-disc pl-6 space-y-3 text-gray-600">
                  <li>
                    <strong>Optimal Price Point:</strong> Algorithm suggests price range based on industry margins and your cost structure (typically 2.5-4× cost per bottle)
                  </li>
                  <li>
                    <strong>Direct-to-Consumer Focus:</strong> Recommends DTC sales allocation (30-40%) for higher margins vs wholesale
                  </li>
                  <li>
                    <strong>Scaling Considerations:</strong> Notes about economies of scale if you expand acreage
                  </li>
                  <li>
                    <strong>Diversification Opportunity:</strong> Suggests additional revenue streams (tasting room, wine club, events)
                  </li>
                  <li>
                    <strong>Risk Mitigation:</strong> Reminds about contingency budgets and crop insurance
                  </li>
                </ul>
              </DetailCard>
            </div>
          </section>

          {/* Financial Formulas */}
          <section className="mx-auto max-w-5xl px-6 py-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">📊 Financial Formulas Reference</h2>
            <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">Production Calculations</h3>
                  <div className="space-y-4">
                    <FormulaCard
                      name="Vines per Acre"
                      formula="43,560 sq ft/acre ÷ (Vine Spacing × Row Spacing)"
                    />
                    <FormulaCard
                      name="Total Vines"
                      formula="Vines per Acre × Acres"
                    />
                    <FormulaCard
                      name="Number of Rows"
                      formula="Plot dimension ÷ Row Spacing (depends on orientation)"
                    />
                    <FormulaCard
                      name="Bottle Production"
                      formula="Acres × Tons/acre × 756 bottles/ton"
                    />
                    <FormulaCard
                      name="Gallons per Ton"
                      formula="~150 gallons/ton (varies by press yield)"
                    />
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">Revenue Calculations</h3>
                  <div className="space-y-4">
                    <FormulaCard
                      name="Wine Revenue"
                      formula="(Bottles Produced - Bottles Unsold) × Bottle Price"
                    />
                    <FormulaCard
                      name="Grape Revenue"
                      formula="(Acres × Yield per Acre) × Price per Ton"
                    />
                    <FormulaCard
                      name="Gross Margin (Wine)"
                      formula="(Bottle Price - Cost per Bottle) ÷ Bottle Price × 100%"
                    />
                    <FormulaCard
                      name="Gross Margin (Grapes)"
                      formula="(Price per Ton - Cost per Ton) ÷ Price per Ton × 100%"
                    />
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">Cost Calculations</h3>
                  <div className="space-y-4">
                    <FormulaCard
                      name="Cost per Bottle"
                      formula="Annual Fixed Costs ÷ Total Bottles Produced"
                    />
                    <FormulaCard
                      name="Cost per Ton"
                      formula="Annual Fixed Costs ÷ (Acres × Yield per Acre)"
                    />
                    <FormulaCard
                      name="Operating Cost"
                      formula="Σ (All enabled annual recurring costs)"
                    />
                    <FormulaCard
                      name="Total Annual Cost"
                      formula="Operating Cost + Water + Insurance + Debt + Equipment Payments"
                    />
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">Profitability Calculations</h3>
                  <div className="space-y-4">
                    <FormulaCard
                      name="Annual Net Profit"
                      formula="Revenue - Total Annual Cost"
                    />
                    <FormulaCard
                      name="Cumulative Cash Flow"
                      formula="Σ Net Profit (Year 0 through Year N)"
                    />
                    <FormulaCard
                      name="Break-Even Year"
                      formula="First year where Cumulative CF ≥ 0"
                    />
                    <FormulaCard
                      name="ROI"
                      formula="(Final Cumulative CF ÷ Total Investment) × 100%"
                    />
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">Financing Calculations</h3>
                  <div className="space-y-4">
                    <FormulaCard
                      name="Monthly Payment (PMT)"
                      formula="P × (r/12) ÷ [1 - (1 + r/12)^(-n×12)]"
                    />
                    <FormulaCard
                      name="Annual Debt Service"
                      formula="Monthly Payment × 12"
                    />
                    <FormulaCard
                      name="Net Equity Required"
                      formula="Total Investment - Total Loan Principal"
                    />
                    <FormulaCard
                      name="Equity Gap"
                      formula="Net Equity Required - Available Equity"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-4">
                    Where: P = Principal, r = annual rate (as decimal), n = years
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">Lender Ratios</h3>
                  <div className="space-y-4">
                    <FormulaCard
                      name="LTC (Loan-to-Cost)"
                      formula="Total Loans ÷ Total Project Cost × 100%"
                    />
                    <FormulaCard
                      name="LTV (Loan-to-Value)"
                      formula="Total Loans ÷ (Land + Improvements) × 100%"
                    />
                    <FormulaCard
                      name="DSCR (Debt Service Coverage)"
                      formula="Net Operating Income ÷ Annual Debt Service"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-4">
                    DSCR shown for reference; calculation requires more detailed cash flow analysis
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Key Concepts */}
          <section className="bg-gray-50 py-16">
            <div className="mx-auto max-w-5xl px-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">💡 Key Concepts</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <ConceptCard
                  title="Sales Strategies Comparison"
                  content={
                    <>
                      <div className="mb-4">
                        <p className="font-semibold text-gray-900 mb-2">Bottle • Sell Finished Wine</p>
                        <p className="text-sm text-gray-600 mb-2">
                          Grow, vinify, bottle, and sell your own branded wine.
                        </p>
                        <ul className="list-disc pl-6 text-sm text-gray-600 space-y-1">
                          <li><strong>Revenue:</strong> $20-60+ per bottle (DTC), $12-25 wholesale</li>
                          <li><strong>Margins:</strong> 50-75% (DTC), 30-45% (wholesale)</li>
                          <li><strong>Capital:</strong> High ($200,000-500,000+ for winery)</li>
                          <li><strong>Licenses:</strong> Federal TTB + State winery + local permits</li>
                          <li><strong>Complexity:</strong> High - production, compliance, marketing</li>
                          <li><strong>Time to market:</strong> 6-8 years (aging + brand building)</li>
                        </ul>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 mb-2">Bulk • Sell All Grapes</p>
                        <p className="text-sm text-gray-600 mb-2">
                          Sell all grape yields to other wineries at harvest.
                        </p>
                        <ul className="list-disc pl-6 text-sm text-gray-600 space-y-1">
                          <li><strong>Revenue:</strong> $1,200-3,000+ per ton (variety dependent)</li>
                          <li><strong>Margins:</strong> 15-40% (depends on contract price)</li>
                          <li><strong>Capital:</strong> Low ($50,000-150,000 for vineyard only)</li>
                          <li><strong>Licenses:</strong> None or minimal (ag operation)</li>
                          <li><strong>Complexity:</strong> Low - farming only</li>
                          <li><strong>Time to market:</strong> 4 years (first crop)</li>
                        </ul>
                      </div>
                    </>
                  }
                />
                
                <ConceptCard
                  title="Break-Even Timeline Explained"
                  content={
                    <>
                      <p className="text-gray-600 mb-4">
                        The year when cumulative cash flow turns positive. This is when your total profit equals your initial investment.
                      </p>
                      <div className="bg-blue-50 p-4 rounded-lg mb-4">
                        <p className="font-semibold text-gray-900 mb-2">Typical Timeline:</p>
                        <ul className="list-disc pl-6 text-sm text-gray-600 space-y-1">
                          <li><strong>Years 6-8:</strong> Excellent (aggressive pricing or low costs)</li>
                          <li><strong>Years 9-12:</strong> Good (balanced model, realistic)</li>
                          <li><strong>Years 13-15:</strong> Acceptable (conservative or high debt)</li>
                          <li><strong>Beyond 15:</strong> Challenging (needs restructuring)</li>
                        </ul>
                      </div>
                      <p className="text-sm text-gray-600">
                        Factors that accelerate break-even: Higher prices, lower land costs, less debt, faster yield maturation, supplemental income (tasting room, events).
                      </p>
                      <p className="text-sm text-gray-600 mt-2">
                        Factors that delay break-even: Lower prices, expensive land, high debt service, slow production ramp, unforeseen costs.
                      </p>
                    </>
                  }
                />

                <ConceptCard
                  title="Yield Maturation Curve Details"
                  content={
                    <>
                      <p className="text-gray-600 mb-4">
                        Grapevines don't produce full yields immediately. Understanding this timeline is critical for realistic cash flow projections.
                      </p>
                      <div className="space-y-3 text-sm text-gray-600">
                        <div>
                          <p className="font-semibold text-gray-900">Years 1-3: Establishment Phase</p>
                          <p>Zero production. Vines are building root systems and canopy. All costs, no revenue. Focus on irrigation, weed control, and training young vines.</p>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Year 4: First Crop</p>
                          <p>~1 ton/acre (29% of mature yield). Light crop to avoid stressing young vines. Quality may be lower. Often sold bulk even if planning to bottle in future.</p>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Year 5: Development</p>
                          <p>~2.5 tons/acre (71% of mature). Quality improving. Vines gaining vigor and balance. Good first vintage for estate wine if bottling.</p>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Year 6+: Full Production</p>
                          <p>~3.5 tons/acre (100%). Vines mature and stable. Consistent quality and quantity. This yield sustained for 20-40+ years with proper management.</p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-4">
                        Note: These are averages. Actual yields vary by variety (Pinot Noir: 2-3 t/ac, Cabernet: 3-4 t/ac, Zinfandel: 4-6 t/ac), rootstock, climate, and management intensity.
                      </p>
                    </>
                  }
                />

                <ConceptCard
                  title="Understanding Lender Ratios"
                  content={
                    <>
                      <p className="text-gray-600 mb-4">
                        Lenders use these ratios to assess risk. Understanding them helps you structure financing to maximize approval chances.
                      </p>
                      <div className="space-y-3 text-sm">
                        <div>
                          <p className="font-semibold text-gray-900">LTC (Loan-to-Cost)</p>
                          <p className="text-gray-600 mb-2">Measures leverage: what % of project is debt vs equity.</p>
                          <ul className="list-disc pl-6 text-gray-600 space-y-1">
                            <li>Below 70%: Low risk, excellent</li>
                            <li>70-80%: Moderate risk, standard</li>
                            <li>80-90%: Higher risk, requires strong profile</li>
                            <li>Above 90%: Very high risk, difficult to obtain</li>
                          </ul>
                        </div>
                        <div className="mt-3">
                          <p className="font-semibold text-gray-900">LTV (Loan-to-Value)</p>
                          <p className="text-gray-600 mb-2">Measures collateral coverage: loan amount vs asset value.</p>
                          <ul className="list-disc pl-6 text-gray-600 space-y-1">
                            <li>Below 65%: Excellent collateral coverage</li>
                            <li>65-75%: Good coverage, acceptable</li>
                            <li>75-85%: Moderate coverage, scrutinized</li>
                            <li>Above 85%: Weak coverage, red flag</li>
                          </ul>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-4">
                        Pro tip: If LTC or LTV is too high, consider: 1) Increasing down payment, 2) Phasing project (delay some improvements), 3) Seeking additional equity partners, 4) Using USDA guaranteed loans (higher LTV allowed).
                      </p>
                    </>
                  }
                />

                <ConceptCard
                  title="Operating Cost Components"
                  content={
                    <>
                      <p className="text-gray-600 mb-4">
                        Annual operating cost is the sum of all recurring expenses. Understanding composition helps identify cost reduction opportunities.
                      </p>
                      <div className="text-sm text-gray-600 space-y-2">
                        <p><strong>Cultural Operations (~30-40%):</strong> Pruning, canopy management, spraying, fertilizer. Labor-intensive, scales with acreage.</p>
                        <p><strong>Harvest & Hauling (~15-20%):</strong> Machine or hand harvest, transport to winery. Varies with yield.</p>
                        <p><strong>Overhead (~25-30%):</strong> Property taxes, insurance, office, utilities, management. More fixed.</p>
                        <p><strong>Equipment Operations (~10-15%):</strong> Fuel, repairs, maintenance. Scales with hours worked.</p>
                        <p><strong>Other (~5-10%):</strong> Fees, assessments, marketing, consulting.</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-4">
                        Typical total: $3,000-8,000 per acre per year. Lower for bulk grapes (no winery costs), higher for estate wine with extensive DTC program.
                      </p>
                    </>
                  }
                />

                <ConceptCard
                  title="Financing Options Overview"
                  content={
                    <>
                      <p className="text-gray-600 mb-4">
                        Multiple financing sources are often combined. Each has different requirements, rates, and uses.
                      </p>
                      <div className="space-y-3 text-sm text-gray-600">
                        <div>
                          <p className="font-semibold text-gray-900">USDA FSA Loans (Best Rates)</p>
                          <p>Federal farm loans with below-market rates. Microloans ($50k max) and Farm Ownership ($600k-$1.75M) most common. Requires US citizenship, farming experience or training, demonstrated need. Application through local USDA Service Center. Processing: 60-120 days.</p>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Commercial Bank Loans</p>
                          <p>Higher rates (Prime + 2-4%) but faster approval. Requires established credit, collateral, business plan. Term loans for equipment, LOC for operating expenses. Processing: 30-60 days.</p>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Equipment Financing</p>
                          <p>Dealer or third-party financing for tractors, sprayers, etc. 5-7 year terms, secured by equipment. Rates: 4-8%. Can be combined with other loans.</p>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Private/Family Loans</p>
                          <p>Flexible terms, may offer better rates. Important to formalize with promissory note and payment schedule for tax and legal clarity.</p>
                        </div>
                      </div>
                    </>
                  }
                />
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="mx-auto max-w-5xl px-6 py-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">❓ Frequently Asked Questions</h2>
            <div className="space-y-4">
              <FAQItem
                question="Why is my break-even year showing '>10'?"
                answer="Your annual operating costs plus debt service exceed your revenue at full production. This means the vineyard won't break even within your projection period. To fix: 1) Reduce costs (lower operating expenses, refinance debt at better rates), 2) Increase revenue (raise bottle price, increase acreage for economies of scale, add revenue streams), 3) Restructure financing (more equity, less debt), or 4) Extend projection period to see if break-even occurs later."
              />
              
              <FAQItem
                question="How accurate are the default cost estimates?"
                answer="Defaults are based on USDA Agricultural Census data, university extension budgets, and industry surveys for small-to-medium vineyards in temperate climates (similar to Virginia, Texas Hill Country, Oregon, Paso Robles). However, costs vary significantly by: Region (±30-50%), Labor rates (±40%), Land costs (±300%), Water availability/cost (±50%), Regulatory environment (±20%). Always customize all inputs for your specific location and circumstances. Use defaults as a starting point, then research local costs through: Extension office budgets, local vineyard managers, equipment dealers, contractors, neighboring growers."
              />
              
              <FAQItem
                question="Can I model a phased expansion or delayed start?"
                answer="Yes! Use the 'Setup Year' field in Financial Inputs. Set to 0 for immediate establishment, 1 to delay one year, 2 for two years, etc. This shifts all Year 0 costs to your chosen year. To model phased acreage expansion: Create multiple plans (Plan A: 3 acres Year 0, Plan B: 3 acres Year 0 + 2 acres Year 3) and compare side-by-side. Or model in stages: First plan shows Phase 1 (3 acres), second plan shows total operation (5 acres) with blended projections."
              />
              
              <FAQItem
                question="What's included in 'Operating Cost' and what's separate?"
                answer="Operating Cost (auto-calculated field) includes: All recurring annual vineyard expenses (pre-planting, planting, cultural operations, harvest, fees, equipment operations, overhead, marketing). Separate from Operating Cost (shown in other fields): Water cost, Insurance, Debt service (loan payments), Equipment financing payments, Grape purchases, Permits (annual renewals). This separation allows you to see 'true' vineyard operating cost vs financing/capital costs."
              />
              
              <FAQItem
                question="How do I save my plan and access it later?"
                answer="Plans are automatically saved to your account: 1) Sign in or create account (top right), 2) Click 'Save' button (top right of planner - turns green when saved), 3) Access saved plans: Click 'My Plans' in left sidebar, 4) Plans are saved in real-time as you edit. To create multiple scenarios: In 'My Plans', click 'New Plan', give it a descriptive name ('Base Case', 'High Yield Scenario', 'Low Debt Option'), work on it in the planner. All plans are saved independently."
              />
              
              <FAQItem
                question="Can I export my financial projections to Excel or PDF?"
                answer="Currently: You can copy the projection table (select all cells, Ctrl+C or Cmd+C, paste into Excel/Sheets). Charts can be screenshot. Coming soon: Native Excel export (full projection table with formulas), PDF report generation (executive summary + all tabs), CSV download (raw data for custom analysis). For now, we recommend: 1) Screenshot the charts you need, 2) Copy-paste the projection table to Excel, 3) Use Details tab summaries for narrative sections of your business plan."
              />
              
              <FAQItem
                question="What if I want to model both bottled wine AND bulk grape sales?"
                answer="The current planner uses a single sales mode. To model a hybrid approach: Option 1: Create two plans and average the results. Plan A: 100% bottle (shows maximum revenue potential), Plan B: 100% bulk (shows minimum risk baseline), Your reality: Somewhere between. Option 2: Use 'Unsold Bottles' feature. Set Sales Strategy to 'Bottle', then use 'Unsold Bottles' to withhold a portion each year that you'll actually sell as bulk grapes. Manually adjust bottle price to account for blended revenue. Option 3 (advanced): In bulk mode, increase 'Grape Sale Price' to reflect weighted average: If selling 60% bulk at $1,800/ton and 40% as wine equivalent at $3,500/ton, use ($1,800×0.6 + $3,500×0.4) = $2,480/ton."
              />
              
              <FAQItem
                question="How do I account for replanting costs or ongoing capital improvements?"
                answer="For replanting (every 25-40 years): This planner focuses on initial 10-30 year projection where replanting isn't yet needed. If modeling longer: Add a custom line item in 'Operating Cost' > 'Cash Overhead' for 'Replant Reserve' (divide estimated replant cost by years until replant, e.g. $30,000 ÷ 30 years = $1,000/year). For ongoing improvements (add 2 acres Year 5): Use 'Setup Year' field to model the new planting in a separate plan, then manually combine projections. Or adjust your 'Acres' field partway through analysis (not ideal but workable for rough estimates)."
              />
              
              <FAQItem
                question="What's a realistic bottle price for a new winery?"
                answer="Depends heavily on: Sales channel, Quality positioning, Region, Competition. Guidelines: Direct-to-Consumer (tasting room, wine club, website): $25-45 for standard quality, $45-75 for premium, $75+ for ultra-premium. Wholesale to distributors/restaurants: DTC price × 0.5-0.6 (distributors need margin). Self-distribution to local restaurants: DTC price × 0.65-0.75. New wineries without brand recognition typically start at lower end of range for their quality tier, then increase prices as reputation builds (Years 3-5). Be conservative initially: easier to raise prices than lower them."
              />
              
              <FAQItem
                question="How do I model different grape varieties with different yields and prices?"
                answer="The planner uses single average yield (3.5 tons/acre default). For varietal-specific modeling: Option 1: Adjust the yield assumption. High-yielding varieties (Zinfandel, Barbera): 4-6 tons/acre. Standard (Cabernet, Merlot): 3-4 tons/acre. Low-yielding (Pinot Noir): 2-3 tons/acre. Option 2: Create separate plans for each variety block (2 acres Cab, 2 acres Chard) and combine results. Option 3: Use weighted average. If planting 50% Cabernet (3.5 t/ac) and 50% Chardonnay (4 t/ac), use 3.75 tons/acre average. Do same for prices: weight by production volume or acreage."
              />
              
              <FAQItem
                question="What's the difference between 'Build Cost' and 'Setup Items'?"
                answer="Build Cost ($/acre): Winery building, barn, equipment shed, tasting room construction. Permanent structures. Cost allocated per planted acre (e.g., $200,000 winery ÷ 4 acres = $50,000/acre). Setup Items: Vineyard infrastructure installed on the land itself. Trellis, irrigation, vines, fencing, site preparation. These are truly per-acre costs that scale exactly with acreage. Example: 4-acre vineyard with winery: Build Cost: $50,000/acre × 4 = $200,000 (one winery), Setup Items: $15,000/acre × 4 = $60,000 (trellis, vines, etc. for all 4 acres)."
              />
              
              <FAQItem
                question="Should I include my own labor in the costs?"
                answer="Depends on your goal: For lender/investor presentations: No. Show only cash outlays. Your sweat equity reduces cash needs but isn't a cost. For true profitability analysis: Yes. Add 'Owner Labor' to 'Cash Overhead' at market rate (vineyard manager: $50,000-80,000/year, or hourly at $25-40/hr × estimated hours). This shows true economic profit vs just cash flow. Recommendation: Run two scenarios: 1) Cash basis (no owner labor) - shows actual cash needed, 2) Full cost basis (with owner labor) - shows if operation makes economic sense vs working elsewhere."
              />
              
              <FAQItem
                question="How do economies of scale work? Should I start small and expand?"
                answer="Economies of scale are significant in viticulture: Small (1-3 acres): $6,000-10,000/acre operating cost. High per-acre overhead, can't fully utilize equipment. Medium (4-10 acres): $4,000-6,000/acre. Better equipment utilization, spreading fixed costs. Large (10-25 acres): $3,000-4,500/acre. Efficient equipment use, can hire dedicated staff. Starting small pros: Lower initial capital, learn as you go, test market, less risk. Starting small cons: Higher per-unit costs, harder to be profitable, may not generate enough volume for winery. Recommendation: Minimum 3-5 acres if bottling wine (need volume for viability), 2-3 acres minimum for bulk grapes. Model both scenarios in separate plans to compare."
              />
              
              <FAQItem
                question="What about organic or biodynamic certification costs?"
                answer="Organic certification adds: Year 0: Application fee ($400-1,000), 3-year transition period required (can't sell as organic yet). Years 1-3: Transition costs (organic inputs often 15-30% higher), annual inspection fee ($800-1,500/year). Years 4+: Certified organic status, annual renewal fee ($800-1,500), potentially higher grape/wine prices (10-30% premium). To model: Add to 'Assessments & Fees': 'Organic certification' annual line item ($1,200/year), increase cultural operations costs by 20-25% (more labor, expensive inputs), increase bottle price or grape price by 15-20% (market premium). Note: Not all markets pay premium for organic; research your target market first."
              />
              
              <FAQItem
                question="How do I account for crop insurance?"
                answer="Crop insurance protects against yield loss or revenue loss from weather, disease, pests. Two main types: 1) Yield-based: Pays when actual yield falls below guaranteed yield (typically 50-75% of historical average). Cost: $150-400/acre. 2) Revenue-based: Pays when revenue falls below guaranteed level due to yield loss or price decline. Cost: $200-600/acre. To add: In 'Financial Inputs' > 'Cash Overhead', add line item 'Crop insurance' with annual cost ($200-400/acre typical). Multiply by acres for total. Recommendation: Consider insurance by Year 4 (first crop) when you have revenue at risk. First 3 years: minimal yield loss risk (no production anyway)."
              />
              
              <FAQItem
                question="What if I want to rent/lease land instead of buying?"
                answer="Lease modeling: Set 'Land Price' to $0 (no purchase), add 'Land Lease' to 'Cash Overhead' (annual cost). Typical ag lease rates: Cash rent: $100-500/acre/year (varies wildly by region and quality), crop-share: 20-30% of gross revenue (harder to model in planner). For crop-share: Reduce your revenue by the share percentage (if 25% share, use Bottle Price × 0.75 or Grape Price × 0.75). Benefits of leasing: Much lower Year 0 capital, reduced LTV ratio (no land debt), flexibility to relocate. Drawbacks: Ongoing cost forever, no equity building, lease can be terminated, landowner may restrict improvements."
              />
              
              <FAQItem
                question="Can this planner be used for other crops (berries, orchard, hops)?"
                answer="Partially. The financial structure works for any perennial crop: Use 'Acres' for planted area, adjust 'Yield Maturation' assumptions (berries: Year 2-3 full production, apples: Year 4-6), change 'Bottle Price' to unit price ($/lb, $/bushel, $/bale), ignore wine-specific features (unsold bottles, grape purchases). However: Yield calculations are in tons (not lbs/boxes/bales), some terminology is wine-specific, no variety-specific modeling. For serious non-grape analysis: Best to use spreadsheet modeling with crop-specific templates. This planner: Good for rough feasibility, not detailed budgeting for non-grape crops."
              />

              <FAQItem
                question="How do I share my plan with a lender, partner, or consultant?"
                answer="Currently: Use screenshots of key sections (Setup tab, Projection tab, Details tab), copy-paste projection table into Excel/Word, manually compile into document/presentation. Coming soon: Shareable link feature (read-only access to your plan), PDF export with professional formatting, collaboration features (comments, notes, multiple users). Pro tip for now: Create a simple business plan document with: 1) Executive summary (write manually based on Details tab metrics), 2) Vineyard design (screenshot from Design tab), 3) Financial assumptions (list from Financial Inputs), 4) Year 0 budget (screenshot Setup tab), 5) Projections (paste table from Projection tab), 6) Key metrics (copy from Details tab)."
              />
            </div>
          </section>

          {/* Best Practices */}
          <section className="bg-vine-green-50 py-16">
            <div className="mx-auto max-w-5xl px-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">✅ Best Practices & Tips</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-lg border-l-4 border-vine-green-600">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">📊 Financial Modeling</h3>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-gray-600">
                    <li>Create three scenarios: Best case, Base case (realistic), Worst case</li>
                    <li>Be conservative on revenue, realistic on costs (costs tend to exceed estimates)</li>
                    <li>Add 10-15% contingency to Year 0 costs for unexpected expenses</li>
                    <li>Use actual quotes from contractors when possible, not just defaults</li>
                    <li>Model first 10-15 years; beyond that is too uncertain</li>
                    <li>Update annually with actual vs projected to refine assumptions</li>
                  </ul>
                </div>

                <div className="bg-white p-6 rounded-lg border-l-4 border-blue-600">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">🏦 Financing Strategy</h3>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-gray-600">
                    <li>Aim for LTC below 75% and LTV below 70% for easier approval</li>
                    <li>Combine USDA FSA loans (low rates) with commercial for best blended rate</li>
                    <li>Don't over-leverage: higher debt = higher risk and later break-even</li>
                    <li>Build relationships with lenders early (12+ months before needed)</li>
                    <li>Have detailed business plan ready before applying</li>
                    <li>Consider SBA loans if USDA doesn't fit (different requirements)</li>
                  </ul>
                </div>

                <div className="bg-white p-6 rounded-lg border-l-4 border-green-600">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">🌱 Vineyard Planning</h3>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-gray-600">
                    <li>Get soil tests before buying land (pH, drainage, nutrients)</li>
                    <li>Choose varieties suited to your climate and market demand</li>
                    <li>Visit established vineyards in your region for cost reality checks</li>
                    <li>Factor in 3-year ramp-up with zero revenue when timing your start</li>
                    <li>Plan water source and irrigation before planting</li>
                    <li>Don't skimp on trellis or irrigation - expensive to fix later</li>
                  </ul>
                </div>

                <div className="bg-white p-6 rounded-lg border-l-4 border-purple-600">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">🍷 Business Strategy</h3>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-gray-600">
                    <li>Start with bulk grape sales, transition to bottling once established</li>
                    <li>Build DTC channels (wine club, tasting room) for best margins</li>
                    <li>Secure grape purchase contracts before building winery</li>
                    <li>Consider custom crush in early years (lower capital, test market)</li>
                    <li>Diversify revenue: events, tours, food service, retail</li>
                    <li>Build brand early even if not selling wine yet (social media, story)</li>
                  </ul>
                </div>

                <div className="bg-white p-6 rounded-lg border-l-4 border-yellow-600">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">⚠️ Common Mistakes to Avoid</h3>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-gray-600">
                    <li>Underestimating time to profitability (plan for 6-10 years)</li>
                    <li>Over-optimistic yield assumptions (use conservative estimates)</li>
                    <li>Forgetting working capital (need cash for years 1-5 operations)</li>
                    <li>Ignoring market research (who will buy your wine/grapes?)</li>
                    <li>Rushing into winery construction (bulk sales first validates demand)</li>
                    <li>Not planning for owner income (you need to live during ramp-up)</li>
                  </ul>
                </div>

                <div className="bg-white p-6 rounded-lg border-l-4 border-red-600">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">🎯 Success Factors</h3>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-gray-600">
                    <li>Adequate capitalization (don't run out of money in Year 3)</li>
                    <li>Realistic timeline expectations (patience is essential)</li>
                    <li>Quality focus over quantity (premium prices require premium fruit)</li>
                    <li>Strong sales/marketing skills or partnerships</li>
                    <li>Viticultural knowledge or hiring qualified manager</li>
                    <li>Contingency planning (weather, pests, market changes)</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="bg-vine-green-600 py-16">
            <div className="mx-auto max-w-3xl px-6 text-center">
              <h2 className="text-3xl font-bold text-white mb-6">
                Ready to Start Planning Your Vineyard?
              </h2>
              <p className="text-lg text-vine-green-100 mb-8">
                Use these comprehensive tools and guidance to create a professional financial model.
              </p>
              <Link
                to="/planner"
                className="inline-block rounded-md bg-white px-8 py-3 text-base font-semibold text-vine-green-600 shadow-sm hover:bg-vine-green-50"
              >
                Open Financial Planner
              </Link>
            </div>
          </section>
        </>
      )}

      {/* VINEYARDS SECTION (Coming Soon) */}
      {activeSection === "vineyards" && (
        <>
          <section className="mx-auto max-w-5xl px-6 py-16">
            <div className="text-center mb-12">
              <div className="inline-block bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm font-semibold mb-6">
                🚧 Coming in Phase 2 (2026)
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                My Vineyards - Operational Management Platform
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Transform planning into action with real-time vineyard monitoring, compliance tracking, and operational tools.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <ComingSoonFeature
                icon="📡"
                title="Live Monitoring"
                description="Real-time sensor data for soil moisture, temperature, humidity, and weather conditions across your vineyard blocks."
                features={[
                  "IoT sensor integration",
                  "24/7 data streaming",
                  "Block-level monitoring",
                  "Alert thresholds",
                  "Historical trending"
                ]}
              />

              <ComingSoonFeature
                icon="📋"
                title="Compliance & Reporting"
                description="Automated compliance tracking, document management, and regulatory reporting for TTB, state, and local requirements."
                features={[
                  "Document library",
                  "Deadline calendar",
                  "Spray records",
                  "Lab results tracking",
                  "Audit trail"
                ]}
              />

              <ComingSoonFeature
                icon="📝"
                title="Activity Logging"
                description="Quick logging of daily vineyard activities with photo capture, GPS tagging, and crew time tracking."
                features={[
                  "Mobile-first forms",
                  "Photo documentation",
                  "Weather auto-log",
                  "Crew time sheets",
                  "Activity templates"
                ]}
              />

              <ComingSoonFeature
                icon="🗺️"
                title="Interactive Maps"
                description="Visual vineyard mapping with aerial imagery, block boundaries, sensor locations, and condition heat maps."
                features={[
                  "Satellite imagery",
                  "Custom block shapes",
                  "Sensor placement",
                  "NDVI overlays",
                  "Soil mapping"
                ]}
              />

              <ComingSoonFeature
                icon="📊"
                title="Analytics & Reports"
                description="Generate professional reports for costs, yields, compliance, and vineyard performance metrics."
                features={[
                  "Cost tracking vs plan",
                  "Yield analysis",
                  "PDF exports",
                  "Custom reports",
                  "Data visualization"
                ]}
              />

              <ComingSoonFeature
                icon="👥"
                title="Team Management"
                description="Assign tasks, track work orders, manage crew schedules, and coordinate contractor activities."
                features={[
                  "Task assignment",
                  "Work orders",
                  "Crew scheduling",
                  "Contractor logs",
                  "Role-based access"
                ]}
              />

              <ComingSoonFeature
                icon="🔔"
                title="Smart Alerts"
                description="Customizable notifications for sensor thresholds, compliance deadlines, weather warnings, and task reminders."
                features={[
                  "SMS & email alerts",
                  "Threshold triggers",
                  "Weather warnings",
                  "Deadline reminders",
                  "Custom rules"
                ]}
              />

              <ComingSoonFeature
                icon="🌡️"
                title="Weather Integration"
                description="Hyperlocal weather forecasts, GDD tracking, frost alerts, and rainfall monitoring for your exact location."
                features={[
                  "7-day forecasts",
                  "GDD accumulation",
                  "Frost warnings",
                  "Rainfall tracking",
                  "Historical data"
                ]}
              />

              <ComingSoonFeature
                icon="🔗"
                title="Integrations"
                description="Connect with accounting software, lab testing services, equipment vendors, and industry platforms."
                features={[
                  "QuickBooks sync",
                  "Lab data import",
                  "Equipment dealers",
                  "Wine industry APIs",
                  "Custom webhooks"
                ]}
              />
            </div>

            <div className="mt-16 bg-blue-50 border-l-4 border-blue-600 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                📅 Roadmap Timeline
              </h3>
              <div className="space-y-3 text-gray-700">
                <p><strong>Q2 2026:</strong> Core monitoring dashboard, activity logging, basic compliance tools</p>
                <p><strong>Q3 2026:</strong> IoT sensor integration, interactive maps, weather data</p>
                <p><strong>Q4 2026:</strong> Advanced analytics, team management, mobile app</p>
                <p><strong>2027:</strong> AI-powered insights, predictive analytics, marketplace integrations</p>
              </div>
            </div>

            <div className="mt-12 text-center">
              <Link
                to="/planner"
                className="inline-block rounded-md bg-vine-green-600 px-8 py-3 text-base font-semibold text-white shadow-sm hover:bg-vine-green-700"
              >
                Start with Financial Planning →
              </Link>
              <p className="mt-4 text-sm text-gray-600">
                Join the waitlist for early access to vineyard operations features
              </p>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

// Additional Helper Components
function DetailCard({ title, children }) {
  return (
    <div className="bg-white p-8 rounded-xl border-2 border-gray-200 mb-8">
      <h3 className="text-2xl font-bold text-vine-green-700 mb-6 pb-3 border-b border-gray-200">
        {title}
      </h3>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}

function FieldDoc({ name, type, options, description }) {
  return (
    <div className="border-l-4 border-vine-green-500 pl-4 py-2">
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-semibold text-gray-900">{name}</h4>
        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded ml-2 whitespace-nowrap">
          {type}
        </span>
      </div>
      {options && (
        <p className="text-xs text-gray-500 mb-2">
          Options: {options.join(", ")}
        </p>
      )}
      <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
}

function SetupItemDoc({ name, typicalCost, description }) {
  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-semibold text-gray-900">{name}</h4>
        <span className="text-sm text-vine-green-600 font-semibold whitespace-nowrap ml-2">
          {typicalCost}
        </span>
      </div>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
}

function ComingSoonFeature({ icon, title, description, features }) {
  return (
    <div className="bg-white p-6 rounded-lg border-2 border-gray-200 hover:border-vine-green-300 transition-colors">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 mb-4">{description}</p>
      <ul className="space-y-1">
        {features.map((feature, idx) => (
          <li key={idx} className="text-xs text-gray-500 flex items-start gap-2">
            <span className="text-vine-green-500 mt-0.5">✓</span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Helper Components (add these at the bottom before the export)
function Step({ number, title, description }) {
  return (
    <li className="flex gap-4">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-vine-green-600 text-white flex items-center justify-center font-bold">
        {number}
      </div>
      <div>
        <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </div>
    </li>
  );
}

function FeatureSection({ title, description, features }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 mb-4">{description}</p>
      <ul className="space-y-2">
        {features.map((feature, idx) => (
          <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
            <span className="text-vine-green-600 mt-0.5">✓</span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ConceptCard({ title, content }) {
  return (
    <div className="bg-white p-6 rounded-lg border-l-4 border-vine-green-600">
      <h3 className="text-xl font-semibold text-gray-900 mb-3">{title}</h3>
      <div className="text-gray-600">{content}</div>
    </div>
  );
}

function FormulaCard({ name, formula }) {
  return (
    <div className="border-l-4 border-vine-green-600 pl-4">
      <div className="font-semibold text-gray-900 mb-1">{name}</div>
      <code className="text-sm text-gray-600 bg-gray-50 px-2 py-1 rounded">{formula}</code>
    </div>
  );
}

function FAQItem({ question, answer }) {
  const [open, setOpen] = useState(false);
  
  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50"
      >
        <span className="font-semibold text-gray-900">{question}</span>
        <span className="text-vine-green-600 text-xl">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="px-6 pb-4 text-gray-600">
          {answer}
        </div>
      )}
    </div>
  );
}


// Keep existing helper components (Step, FeatureSection, ConceptCard, FormulaCard, FAQItem)