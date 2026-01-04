import { BookOpen, TrendingUp, Leaf, DollarSign } from "lucide-react";

// Blog post metadata
export const blogPosts = [
  {
    id: 1,
    title: "Getting Started with Vineyard Planning: A Complete Guide",
    excerpt: "Learn the essential steps for planning a successful vineyard, from site selection to financial forecasting.",
    date: "2025-01-10",
    category: "Planning",
    icon: BookOpen,
    color: "teal",
    readTime: "18 min read",
    slug: "getting-started-vineyard-planning"
  },
  {
    id: 2,
    title: "Understanding Vineyard ROI: What to Expect in Your First 10 Years",
    excerpt: "Realistic financial expectations for new vineyard owners, including cash flow timelines and profitability milestones.",
    date: "2025-01-08",
    category: "Finance",
    icon: TrendingUp,
    color: "vine-green",
    readTime: "10 min read",
    slug: "vineyard-roi-expectations"
  },
  {
    id: 3,
    title: "Trellis System Design: VSP vs. Other Options",
    excerpt: "Compare vertical shoot positioning (VSP) with other trellis systems to choose the best option for your vineyard.",
    date: "2025-01-05",
    category: "Design",
    icon: Leaf,
    color: "green",
    readTime: "6 min read",
    slug: "trellis-system-design"
  },
  {
    id: 4,
    title: "Land Costs by Region: 2025 Market Analysis",
    excerpt: "Comprehensive breakdown of vineyard land prices across major wine regions in the United States.",
    date: "2025-01-03",
    category: "Finance",
    icon: DollarSign,
    color: "amber",
    readTime: "12 min read",
    slug: "land-costs-2025"
  }
];

// Blog post content components
const blogContent = {
  "getting-started-vineyard-planning": (
    <>
      <p className="text-xl text-gray-600 leading-relaxed mb-8">
        Starting a vineyard is one of the most rewarding agricultural ventures you can undertake, but it requires careful planning, substantial capital, and realistic expectations. This comprehensive guide will walk you through every essential step to plan a successful vineyard operation, from initial site assessment through long-term management strategies.
      </p>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 my-8">
        <h3 className="text-lg font-bold text-blue-900 mb-3">Planning Timeline Overview</h3>
        <p className="text-blue-800 mb-3">
          Proper vineyard planning takes 18-24 months before planting. This guide covers the complete planning process including site assessment, financial modeling, regulatory compliance, and implementation strategy.
        </p>
        <p className="text-sm text-blue-700">
          <strong>Estimated reading time:</strong> 18 minutes | <strong>Recommended follow-up:</strong> Create detailed financial model using vineyard planning software
        </p>
      </div>

      <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-6">Phase 1: Pre-Planning Assessment (Months 1-6)</h2>

      <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Self-Assessment and Goal Setting</h3>

      <p className="text-gray-700 leading-relaxed mb-4">
        Before evaluating sites or running financial models, honestly assess your motivations, resources, and constraints:
      </p>

      <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6 ml-4">
        <li><strong>Capital availability:</strong> Do you have access to $500k-$2M+ for land, development, and 3-5 years of operating capital?</li>
        <li><strong>Time commitment:</strong> Can you dedicate 20-60+ hours/week during critical periods (harvest, pruning)?</li>
        <li><strong>Experience level:</strong> Do you have viticulture experience, or will you need to hire expertise?</li>
        <li><strong>Business goals:</strong> Are you seeking lifestyle, investment returns, legacy, or combination?</li>
        <li><strong>Risk tolerance:</strong> Can you withstand 4-7 years before meaningful cash flow?</li>
        <li><strong>Geographic flexibility:</strong> Are you tied to a specific region, or can you pursue best opportunities?</li>
      </ul>

      <div className="bg-amber-50 border-l-4 border-amber-600 p-6 my-8 rounded-r-lg">
        <p className="text-amber-900 font-semibold mb-2">⚠️ Critical Reality Check</p>
        <p className="text-amber-800">
          Vineyards are capital-intensive, slow-return agricultural investments. If you need cash flow within 5 years or cannot sustain $50,000-$200,000+ annual operating losses for 3 years, reconsider timing or scale. The #1 cause of vineyard failure is inadequate capitalization, not poor farming.
        </p>
      </div>

      <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Building Your Advisory Team</h3>

      <p className="text-gray-700 leading-relaxed mb-4">
        Assemble professional advisors early in the planning process:
      </p>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden my-8">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Advisor Type</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">When to Engage</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Typical Cost</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            <tr>
              <td className="px-6 py-4 text-sm text-gray-900 font-medium">Viticulture Consultant</td>
              <td className="px-6 py-4 text-sm text-gray-700">Before site selection</td>
              <td className="px-6 py-4 text-sm text-gray-700">$150-$300/hour</td>
            </tr>
            <tr>
              <td className="px-6 py-4 text-sm text-gray-900 font-medium">Agricultural Attorney</td>
              <td className="px-6 py-4 text-sm text-gray-700">During site evaluation</td>
              <td className="px-6 py-4 text-sm text-gray-700">$250-$500/hour</td>
            </tr>
            <tr>
              <td className="px-6 py-4 text-sm text-gray-900 font-medium">Soil Scientist</td>
              <td className="px-6 py-4 text-sm text-gray-700">Before land purchase</td>
              <td className="px-6 py-4 text-sm text-gray-700">$2,000-$5,000 per site</td>
            </tr>
            <tr>
              <td className="px-6 py-4 text-sm text-gray-900 font-medium">Water Rights Specialist</td>
              <td className="px-6 py-4 text-sm text-gray-700">During due diligence</td>
              <td className="px-6 py-4 text-sm text-gray-700">$200-$400/hour</td>
            </tr>
            <tr>
              <td className="px-6 py-4 text-sm text-gray-900 font-medium">CPA/Tax Advisor</td>
              <td className="px-6 py-4 text-sm text-gray-700">Entity formation phase</td>
              <td className="px-6 py-4 text-sm text-gray-700">$200-$400/hour</td>
            </tr>
            <tr>
              <td className="px-6 py-4 text-sm text-gray-900 font-medium">Agricultural Lender</td>
              <td className="px-6 py-4 text-sm text-gray-700">Financial planning phase</td>
              <td className="px-6 py-4 text-sm text-gray-700">Loan origination fees</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="text-gray-700 leading-relaxed mb-4">
        Budget $15,000-$40,000 for professional advisory fees during the planning phase. This investment prevents costly mistakes that dwarf advisory costs.
      </p>

      <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-6">Phase 2: Site Selection and Assessment (Months 3-12)</h2>

      <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Climate and Macrocl imate Analysis</h3>

      <p className="text-gray-700 leading-relaxed mb-4">
        Successful viticulture begins with matching grape varieties to climate. Evaluate these critical climate factors:
      </p>

      <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6 ml-4">
        <li><strong>Growing Degree Days (GDD):</strong> Calculate Winkler Index—most Vitis vinifera need 2,400-3,000 GDD</li>
        <li><strong>Frost-free period:</strong> Minimum 180-200 days; track last spring frost and first fall frost dates</li>
        <li><strong>Diurnal temperature variation:</strong> 30-50°F swings preserve acidity and develop complex flavors</li>
        <li><strong>Rainfall patterns:</strong> 20-30" annual ideal; dry harvest period critical for quality</li>
        <li><strong>Extreme events:</strong> Review 20-year history for hail, hurricane, extreme cold events</li>
        <li><strong>Future climate trends:</strong> Consider warming trends—varieties planted today produce for 30-50 years</li>
      </ul>

      <div className="bg-teal-50 border-l-4 border-teal-600 p-6 my-8 rounded-r-lg">
        <p className="text-teal-900 font-semibold mb-2">💡 Data Sources for Climate Analysis</p>
        <div className="text-teal-800 space-y-1">
          <p>• NOAA National Centers for Environmental Information (NCEI): Long-term weather data</p>
          <p>• Local agricultural extension offices: Regional viticulture guides</p>
          <p>• Weather Underground: Historical weather patterns by specific location</p>
          <p>• University viticulture departments: Growing degree day calculators and regional suitability maps</p>
        </div>
      </div>

      <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Topography, Slope, and Aspect</h3>

      <p className="text-gray-700 leading-relaxed mb-4">
        Site topography dramatically affects microclimate, frost risk, and operational costs:
      </p>

      <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6 ml-4">
        <li><strong>Slope gradient:</strong> Ideal 2-15%; gentle slopes provide drainage and air movement</li>
        <li><strong>Aspect (slope direction):</strong> South/southwest facing (northern hemisphere) maximizes sun exposure</li>
        <li><strong>Elevation:</strong> Higher elevations reduce frost risk via cold air drainage; assess 50-500ft elevation range</li>
        <li><strong>Valley floors:</strong> Avoid—cold air pools increase frost damage risk</li>
        <li><strong>Hilltops:</strong> Excellent drainage and air movement but may face wind stress and erosion</li>
        <li><strong>Hillside benching:</strong> Steep sites require terracing—add $10,000-$25,000/acre for grading</li>
      </ul>

      <p className="text-gray-700 leading-relaxed mb-4">
        <strong>Mechanization considerations:</strong> Slopes exceeding 15% require specialized equipment or hand labor, increasing operating costs 30-100%. Sites over 25% slope are generally impractical for commercial viticulture.
      </p>

      <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Comprehensive Soil Assessment</h3>

      <p className="text-gray-700 leading-relaxed mb-4">
        Hire a professional soil scientist to conduct grid sampling (minimum 1 sample per 2-5 acres). Critical soil parameters:
      </p>

      <div className="bg-white border border-gray-200 rounded-lg p-6 my-8">
        <h4 className="text-lg font-bold text-gray-900 mb-4">Essential Soil Testing Parameters</h4>

        <div className="space-y-4">
          <div>
            <p className="font-semibold text-gray-900 mb-2">Physical Properties</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-4">
              <li><strong>Texture:</strong> Clay loam to gravelly loam ideal; avoid heavy clay (poor drainage) or pure sand (low nutrients)</li>
              <li><strong>Structure:</strong> Well-aggregated soils with good pore space</li>
              <li><strong>Depth:</strong> Minimum 36-48 inches for root development; probe for hardpan or bedrock</li>
              <li><strong>Drainage:</strong> Percolation test—water should drain within 24-48 hours</li>
              <li><strong>Water-holding capacity:</strong> 4-8 inches per 4 feet ideal</li>
            </ul>
          </div>

          <div>
            <p className="font-semibold text-gray-900 mb-2">Chemical Properties</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-4">
              <li><strong>pH:</strong> Target 6.0-7.0; amend if outside 5.5-7.5 range</li>
              <li><strong>Organic matter:</strong> 2-5% ideal; low OM requires compost amendments</li>
              <li><strong>Macronutrients:</strong> N, P, K levels guide fertilization strategy</li>
              <li><strong>Micronutrients:</strong> Test Fe, Mn, B, Zn; deficiencies common in alkaline soils</li>
              <li><strong>Salinity (EC):</strong> &lt;2.0 dS/m; high salinity requires leaching or drainage improvements</li>
              <li><strong>Sodium (Na):</strong> Exchangeable sodium percentage &lt;15%</li>
            </ul>
          </div>

          <div>
            <p className="font-semibold text-gray-900 mb-2">Biological Assessment</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-4">
              <li><strong>Nematodes:</strong> Test for root-knot nematodes; may require fumigation ($1,500-$3,000/acre)</li>
              <li><strong>Soil-borne diseases:</strong> Screen for phytophthora, armillaria, verticillium</li>
              <li><strong>Microbial activity:</strong> Assess beneficial microbe populations</li>
            </ul>
          </div>
        </div>
      </div>

      <p className="text-gray-700 leading-relaxed mb-4">
        <strong>Soil amendment costs:</strong> Budget $500-$3,000/acre for soil corrections depending on deficiencies. Severe problems (pH &lt;5.0 or &gt;8.0, high salinity) may make sites economically unfeasible.
      </p>

      <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Water Rights and Irrigation Planning</h3>

      <p className="text-gray-700 leading-relaxed mb-4">
        Water availability is often the decisive factor in vineyard viability, especially in western states:
      </p>

      <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6 ml-4">
        <li><strong>Water rights research:</strong> Hire water rights attorney to verify senior water rights or well permits</li>
        <li><strong>Irrigation requirement calculation:</strong> Estimate 12-24 acre-inches per season depending on rainfall and ET</li>
        <li><strong>Water source options:</strong> Surface rights, well, municipal, purchased/transferred rights</li>
        <li><strong>Well drilling:</strong> $15,000-$75,000 depending on depth; secure permits before drilling</li>
        <li><strong>Yield expectations:</strong> Minimum 10-20 GPM for drip irrigation system serving 20 acres</li>
        <li><strong>Water quality testing:</strong> Test for pH, salinity, sodium, boron, chloride</li>
      </ul>

      <div className="bg-amber-50 border-l-4 border-amber-600 p-6 my-8 rounded-r-lg">
        <p className="text-amber-900 font-semibold mb-2">⚠️ Water Rights Deal-Breaker</p>
        <p className="text-amber-800">
          In California, Arizona, and other western states, lack of secure water rights can render otherwise excellent vineyard sites worthless. Always verify water availability BEFORE making an offer on land. Water rights due diligence typically costs $5,000-$15,000 but prevents catastrophic mistakes.
        </p>
      </div>

      <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Infrastructure Assessment</h3>

      <p className="text-gray-700 leading-relaxed mb-4">
        Evaluate existing infrastructure and estimate development costs:
      </p>

      <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6 ml-4">
        <li><strong>Road access:</strong> All-season access for harvest trucks; gravel roads $15-$35/linear foot</li>
        <li><strong>Electricity:</strong> 3-phase power for irrigation pumps; utility extensions $25,000-$100,000+</li>
        <li><strong>Buildings:</strong> Equipment storage, shop, office needs; pole barns $15-$35/sq ft</li>
        <li><strong>Drainage:</strong> French drains, culverts for wet areas; $5,000-$25,000</li>
        <li><strong>Fencing:</strong> Deer and livestock exclusion; $3-$8/linear foot for 8' deer fence</li>
        <li><strong>Windbreaks:</strong> Consider living windbreaks in high-wind areas</li>
      </ul>

      <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-6">Phase 3: Variety and Rootstock Selection (Months 6-10)</h2>

      <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Market-Driven Variety Selection</h3>

      <p className="text-gray-700 leading-relaxed mb-4">
        Select varieties based on market demand analysis, not personal preference:
      </p>

      <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6 ml-4">
        <li><strong>Contact local wineries:</strong> Survey 10-15 wineries about purchasing needs and pricing</li>
        <li><strong>Review USDA Grape Crush Reports:</strong> Analyze pricing trends by variety and region (past 5-10 years)</li>
        <li><strong>Assess regional reputation:</strong> Plant varieties proven in your specific AVA/region</li>
        <li><strong>Consider market saturation:</strong> Avoid overplanted varieties unless you have differentiated quality</li>
        <li><strong>Hedge with diversity:</strong> Plant 2-4 varieties to reduce market and climate risk</li>
        <li><strong>Future market trends:</strong> Consider 5-7 year outlook—your first meaningful crop is years away</li>
      </ul>

      <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Climate-Variety Matching</h3>

      <p className="text-gray-700 leading-relaxed mb-4">
        Match varieties to your site's GDD and climate characteristics:
      </p>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden my-8">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Climate Category</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">GDD Range</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Recommended Varieties</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            <tr>
              <td className="px-6 py-4 text-sm text-gray-900 font-medium">Cool Climate (Region I)</td>
              <td className="px-6 py-4 text-sm text-gray-700">2,000-2,500 GDD</td>
              <td className="px-6 py-4 text-sm text-gray-700">Pinot Noir, Chardonnay, Riesling, Gewürztraminer, Pinot Gris</td>
            </tr>
            <tr>
              <td className="px-6 py-4 text-sm text-gray-900 font-medium">Moderate Climate (Region II)</td>
              <td className="px-6 py-4 text-sm text-gray-700">2,500-3,000 GDD</td>
              <td className="px-6 py-4 text-sm text-gray-700">Merlot, Cabernet Franc, Syrah, Sauvignon Blanc, Viognier</td>
            </tr>
            <tr>
              <td className="px-6 py-4 text-sm text-gray-900 font-medium">Warm Climate (Region III)</td>
              <td className="px-6 py-4 text-sm text-gray-700">3,000-3,500 GDD</td>
              <td className="px-6 py-4 text-sm text-gray-700">Cabernet Sauvignon, Zinfandel, Petite Sirah, Sangiovese</td>
            </tr>
            <tr>
              <td className="px-6 py-4 text-sm text-gray-900 font-medium">Hot Climate (Regions IV-V)</td>
              <td className="px-6 py-4 text-sm text-gray-700">3,500-4,000+ GDD</td>
              <td className="px-6 py-4 text-sm text-gray-700">Grenache, Tempranillo, Barbera, Colombard (bulk production)</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Rootstock Selection Strategy</h3>

      <p className="text-gray-700 leading-relaxed mb-4">
        Rootstock selection is as important as variety choice. Match rootstock to soil conditions and vigor requirements:
      </p>

      <div className="bg-white border border-gray-200 rounded-lg p-6 my-8">
        <h4 className="text-lg font-bold text-gray-900 mb-4">Common Rootstock Characteristics</h4>

        <div className="space-y-3">
          <div>
            <p className="font-semibold text-gray-900">3309C (Low-Moderate Vigor)</p>
            <p className="text-sm text-gray-700">Good for low-moderate vigor sites, drought tolerant, lime tolerance, moderate nematode resistance</p>
          </div>
          <div>
            <p className="font-semibold text-gray-900">101-14 Mgt (Low Vigor)</p>
            <p className="text-sm text-gray-700">Excellent for fertile soils where vigor control needed, drought sensitive, low lime tolerance</p>
          </div>
          <div>
            <p className="font-semibold text-gray-900">SO4 (Moderate-High Vigor)</p>
            <p className="text-sm text-gray-700">Wet, heavy soils, nematode resistant, moderate drought tolerance, good lime tolerance</p>
          </div>
          <div>
            <p className="font-semibold text-gray-900">1103P (High Vigor)</p>
            <p className="text-sm text-gray-700">Drought sites, deep soils, high lime tolerance, strong nematode resistance, promotes early ripening</p>
          </div>
          <div>
            <p className="font-semibold text-gray-900">110R (High Vigor)</p>
            <p className="text-sm text-gray-700">Drought sites, low vigor soils, good nematode resistance, moderate lime tolerance</p>
          </div>
          <div>
            <p className="font-semibold text-gray-900">5C (Moderate Vigor)</p>
            <p className="text-sm text-gray-700">High calcium soils, wet sites, phylloxera resistant, nematode susceptible</p>
          </div>
        </div>
      </div>

      <p className="text-gray-700 leading-relaxed mb-4">
        <strong>Rootstock selection criteria:</strong>
      </p>

      <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6 ml-4">
        <li><strong>Soil type:</strong> Heavy clay = SO4; sandy loam = 3309C or 101-14; drought-prone = 1103P or 110R</li>
        <li><strong>Vigor matching:</strong> Fertile sites need low-vigor stocks; poor soils need vigorous stocks</li>
        <li><strong>Nematode pressure:</strong> High nematode sites require resistant rootstocks (SO4, 1103P, 110R)</li>
        <li><strong>Lime/pH:</strong> High pH/lime soils need lime-tolerant stocks (1103P, 5C, 3309C)</li>
        <li><strong>Drought tolerance:</strong> Sites with limited irrigation need drought-tolerant stocks (1103P, 110R, 3309C)</li>
      </ul>

      <div className="bg-teal-50 border-l-4 border-teal-600 p-6 my-8 rounded-r-lg">
        <p className="text-teal-900 font-semibold mb-2">💡 Consult Before Deciding</p>
        <p className="text-teal-800">
          Rootstock selection mistakes cost 3-5 years of lost productivity and potentially entire vineyard replants ($20,000-$30,000/acre). Always consult with university extension viticulturists and experienced local growers before finalizing rootstock choices.
        </p>
      </div>

      <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-6">Phase 4: Financial Planning and Modeling (Months 8-14)</h2>

      <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Comprehensive Capital Budget</h3>

      <p className="text-gray-700 leading-relaxed mb-4">
        Develop detailed capital budget covering all Year 0 investments:
      </p>

      <div className="bg-white border border-gray-200 rounded-lg p-6 my-8">
        <h4 className="text-lg font-bold text-gray-900 mb-4">Year 0 Capital Budget Example (20 acres)</h4>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between border-b pb-2">
            <span className="font-semibold text-gray-900">Item</span>
            <span className="font-semibold text-gray-900">Cost</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-700">Land acquisition (20 ac @ $50k/ac, 30% down)</span>
            <span className="text-gray-900">$300,000</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">Closing costs, title insurance (3%)</span>
            <span className="text-gray-900">$30,000</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">Site preparation and grading (20 ac @ $3k/ac)</span>
            <span className="text-gray-900">$60,000</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">Soil amendments (20 ac @ $1.5k/ac)</span>
            <span className="text-gray-900">$30,000</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">VSP trellis system (20 ac @ $12k/ac)</span>
            <span className="text-gray-900">$240,000</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">Grafted vines and planting (20 ac @ $4.5k/ac)</span>
            <span className="text-gray-900">$90,000</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">Drip irrigation system (20 ac @ $2.5k/ac)</span>
            <span className="text-gray-900">$50,000</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">Well drilling and permits</span>
            <span className="text-gray-900">$45,000</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">Electrical service and irrigation pump</span>
            <span className="text-gray-900">$35,000</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">Internal roads and parking (500 ft @ $25/ft)</span>
            <span className="text-gray-900">$12,500</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">Deer fencing (1,800 ft @ $6/ft)</span>
            <span className="text-gray-900">$10,800</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">Equipment: tractor, sprayer, mower, ATV, bins</span>
            <span className="text-gray-900">$175,000</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">Storage barn (2,400 sq ft @ $25/sf)</span>
            <span className="text-gray-900">$60,000</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">Professional fees (consultants, attorneys, engineers)</span>
            <span className="text-gray-900">$35,000</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">Permits and regulatory compliance</span>
            <span className="text-gray-900">$8,000</span>
          </div>

          <div className="flex justify-between border-t-2 border-gray-300 pt-2 mt-3">
            <span className="font-bold text-gray-900">Subtotal</span>
            <span className="font-bold text-gray-900">$1,181,300</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-700">Contingency (20%)</span>
            <span className="text-gray-900">$236,260</span>
          </div>

          <div className="flex justify-between border-t-2 border-teal-600 pt-3 mt-3">
            <span className="font-bold text-teal-900 text-lg">Total Year 0 Investment</span>
            <span className="font-bold text-teal-600 text-xl">$1,417,560</span>
          </div>

          <div className="flex justify-between text-sm text-gray-600 mt-2">
            <span>Cost per planted acre:</span>
            <span>$70,878/acre</span>
          </div>
        </div>
      </div>

      <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Operating Expenses Projection</h3>

      <p className="text-gray-700 leading-relaxed mb-4">
        Model annual operating expenses through Year 10+:
      </p>

      <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6 ml-4">
        <li><strong>Years 1-2:</strong> $2,000-$3,500/acre (training, pest management, irrigation, weed control)</li>
        <li><strong>Years 3-4:</strong> $3,500-$4,800/acre (+ light harvest costs in Year 3)</li>
        <li><strong>Years 5+:</strong> $4,200-$6,400/acre (full spray program, canopy management, harvest, overhead)</li>
      </ul>

      <p className="text-gray-700 leading-relaxed mb-4">
        Major operating expense categories:
      </p>

      <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6 ml-4">
        <li><strong>Labor (40-50% of operating costs):</strong> Pruning, shoot thinning, canopy management, harvest</li>
        <li><strong>Materials (20-25%):</strong> Fungicides, insecticides, fertilizers, fuel, supplies</li>
        <li><strong>Utilities (5-10%):</strong> Electricity for irrigation, water costs</li>
        <li><strong>Equipment (10-15%):</strong> Repairs, maintenance, fuel, depreciation</li>
        <li><strong>Overhead (10-15%):</strong> Insurance, property tax, administration, management</li>
      </ul>

      <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Revenue Modeling and Pricing Research</h3>

      <p className="text-gray-700 leading-relaxed mb-4">
        Build conservative revenue projections based on market research:
      </p>

      <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6 ml-4">
        <li><strong>Yield ramp:</strong> Year 3 = 25-35% of mature yield; Year 4 = 50-70%; Year 5 = 85-100%</li>
        <li><strong>Mature yields:</strong> 3-5 tons/acre depending on variety, site, quality goals</li>
        <li><strong>Pricing:</strong> Research regional crush reports; discount 10-20% for new, unproven vineyard</li>
        <li><strong>Contract security:</strong> Seek multi-year contracts with floor pricing before planting</li>
      </ul>

      <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Financing Strategy</h3>

      <p className="text-gray-700 leading-relaxed mb-4">
        Explore financing options to minimize equity requirements:
      </p>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden my-8">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Financing Source</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Typical Terms</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Pros/Cons</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            <tr>
              <td className="px-6 py-4 text-sm text-gray-900 font-medium">Farm Credit (AgDirect, CoBank)</td>
              <td className="px-6 py-4 text-sm text-gray-700">25-30% down, 5-7% interest, 20-30 year term</td>
              <td className="px-6 py-4 text-sm text-gray-700">Best rates, agriculture-focused, relationship required</td>
            </tr>
            <tr>
              <td className="px-6 py-4 text-sm text-gray-900 font-medium">USDA FSA Loans</td>
              <td className="px-6 py-4 text-sm text-gray-700">10-25% down, variable rate, up to $600k microloans</td>
              <td className="px-6 py-4 text-sm text-gray-700">Low down payment, slow process, eligibility restrictions</td>
            </tr>
            <tr>
              <td className="px-6 py-4 text-sm text-gray-900 font-medium">Commercial Bank</td>
              <td className="px-6 py-4 text-sm text-gray-700">30-40% down, 6-9% interest, 15-20 year term</td>
              <td className="px-6 py-4 text-sm text-gray-700">Faster closing, higher rates, may lack ag expertise</td>
            </tr>
            <tr>
              <td className="px-6 py-4 text-sm text-gray-900 font-medium">Seller Financing</td>
              <td className="px-6 py-4 text-sm text-gray-700">Negotiable, typically 10-20% down</td>
              <td className="px-6 py-4 text-sm text-gray-700">Flexible terms, limited availability, balloon payments common</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="bg-amber-50 border-l-4 border-amber-600 p-6 my-8 rounded-r-lg">
        <p className="text-amber-900 font-semibold mb-2">⚠️ Critical Capital Reserve</p>
        <p className="text-amber-800">
          Beyond land financing and Year 0 capital, maintain liquid reserves equal to 2-3 years of operating expenses ($150,000-$400,000 for 20 acres). Lenders rarely provide operating lines of credit to new vineyard ventures. Running out of cash in Year 2-4 is the most common path to vineyard failure.
        </p>
      </div>

      <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-6">Phase 5: Legal, Regulatory, and Risk Management (Months 10-18)</h2>

      <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Business Entity Formation</h3>

      <p className="text-gray-700 leading-relaxed mb-4">
        Consult with agricultural attorney and CPA to select optimal entity structure:
      </p>

      <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6 ml-4">
        <li><strong>LLC (most common):</strong> Liability protection, pass-through taxation, flexible management</li>
        <li><strong>S-Corporation:</strong> Self-employment tax savings for active owners taking salaries</li>
        <li><strong>C-Corporation:</strong> Rarely optimal for vineyards unless pursuing Section 1202 QSBS treatment</li>
        <li><strong>Sole proprietorship:</strong> Simplest but provides no liability protection</li>
      </ul>

      <p className="text-gray-700 leading-relaxed mb-4">
        <strong>Key legal documents:</strong> Operating agreement, shareholder agreements, buy-sell provisions, succession planning
      </p>

      <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Permits and Regulatory Compliance</h3>

      <p className="text-gray-700 leading-relaxed mb-4">
        Navigate regulatory requirements 12-18 months before planting:
      </p>

      <div className="bg-white border border-gray-200 rounded-lg p-6 my-8">
        <h4 className="text-lg font-bold text-gray-900 mb-4">Essential Permits and Approvals</h4>

        <ul className="space-y-3 text-sm text-gray-700">
          <li>
            <strong className="text-gray-900">Zoning and land use:</strong> Verify agricultural zoning allows commercial viticulture; obtain conditional use permits if needed
          </li>
          <li>
            <strong className="text-gray-900">Water rights:</strong> Well drilling permits, surface water appropriation permits, groundwater withdrawal permits (state dependent)
          </li>
          <li>
            <strong className="text-gray-900">Environmental:</strong> Erosion control permits, wetland delineation, endangered species surveys, stormwater management
          </li>
          <li>
            <strong className="text-gray-900">Building permits:</strong> Structures, septic systems, electrical service upgrades
          </li>
          <li>
            <strong className="text-gray-900">Road/driveway:</strong> Encroachment permits, DOT access permits for public road connections
          </li>
          <li>
            <strong className="text-gray-900">Pesticide application:</strong> Applicator licenses (commercial or private), restricted use permits
          </li>
          <li>
            <strong className="text-gray-900">Labor:</strong> Agricultural employer registration, workers compensation insurance, H-2A visa program (if applicable)
          </li>
        </ul>
      </div>

      <p className="text-gray-700 leading-relaxed mb-4">
        Budget $15,000-$50,000 for permits, regulatory compliance, and professional fees (attorneys, engineers, consultants).
      </p>

      <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Insurance and Risk Management</h3>

      <p className="text-gray-700 leading-relaxed mb-4">
        Implement comprehensive insurance program before planting:
      </p>

      <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6 ml-4">
        <li><strong>Property insurance:</strong> Buildings, equipment, fencing; $3,000-$8,000/year</li>
        <li><strong>General liability:</strong> $2M-$5M coverage; $2,000-$5,000/year</li>
        <li><strong>Workers compensation:</strong> Required in most states; rates vary by state (5-15% of payroll)</li>
        <li><strong>Crop insurance:</strong> USDA-subsidized coverage available in established regions; premiums 3-8% of insured value</li>
        <li><strong>Equipment/vehicle:</strong> Tractor, sprayer, ATV coverage; bundled with property insurance</li>
        <li><strong>Umbrella policy:</strong> $5M-$10M excess liability; $1,500-$3,000/year</li>
      </ul>

      <p className="text-gray-700 leading-relaxed mb-4">
        Total annual insurance costs: $12,000-$30,000 depending on acreage and coverage levels.
      </p>

      <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-6">Phase 6: Implementation Planning (Months 14-20)</h2>

      <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">18-Month Planting Timeline</h3>

      <p className="text-gray-700 leading-relaxed mb-4">
        Develop detailed implementation timeline working backward from target planting date:
      </p>

      <div className="bg-white border border-gray-200 rounded-lg p-6 my-8">
        <h4 className="text-lg font-bold text-gray-900 mb-4">Sample Timeline to Spring Planting</h4>

        <div className="space-y-2 text-sm text-gray-700">
          <div className="flex">
            <span className="font-semibold text-gray-900 w-32">18 months prior:</span>
            <span>Complete site selection and soil testing; place vine orders (grafted vines require 12-18 month lead time)</span>
          </div>
          <div className="flex">
            <span className="font-semibold text-gray-900 w-32">15 months prior:</span>
            <span>Finalize financing; submit permit applications; order trellis materials</span>
          </div>
          <div className="flex">
            <span className="font-semibold text-gray-900 w-32">12 months prior:</span>
            <span>Begin site preparation: clear land, apply soil amendments, install drainage</span>
          </div>
          <div className="flex">
            <span className="font-semibold text-gray-900 w-32">10 months prior:</span>
            <span>Drill well, install pump and electrical service</span>
          </div>
          <div className="flex">
            <span className="font-semibold text-gray-900 w-32">8 months prior:</span>
            <span>Grade roads, build equipment storage barn</span>
          </div>
          <div className="flex">
            <span className="font-semibold text-gray-900 w-32">6 months prior:</span>
            <span>Install trellis end posts and brace assemblies</span>
          </div>
          <div className="flex">
            <span className="font-semibold text-gray-900 w-32">4 months prior:</span>
            <span>Install mainline irrigation and submains</span>
          </div>
          <div className="flex">
            <span className="font-semibold text-gray-900 w-32">3 months prior:</span>
            <span>Install trellis line posts and bottom wire</span>
          </div>
          <div className="flex">
            <span className="font-semibold text-gray-900 w-32">2 months prior:</span>
            <span>Install drip irrigation laterals and emitters</span>
          </div>
          <div className="flex">
            <span className="font-semibold text-gray-900 w-32">1 month prior:</span>
            <span>Final field preparation, pre-irrigation if needed, vine delivery coordination</span>
          </div>
          <div className="flex">
            <span className="font-semibold text-gray-900 w-32">Planting (April-May):</span>
            <span>Plant vines, install vine guards, begin irrigation schedule</span>
          </div>
        </div>
      </div>

      <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Building Your Management Team</h3>

      <p className="text-gray-700 leading-relaxed mb-4">
        Identify key personnel needs based on your experience level and acreage:
      </p>

      <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6 ml-4">
        <li><strong>Vineyard manager (critical if you lack experience):</strong> $50,000-$95,000/year salary + benefits</li>
        <li><strong>Seasonal labor crew:</strong> Budget 600-1,200 hours/year per 20 acres @ $18-$25/hour + payroll taxes (30%)</li>
        <li><strong>Consulting viticulturist:</strong> $3,000-$8,000/year for periodic site visits and recommendations</li>
        <li><strong>Bookkeeper/accountant:</strong> $200-$500/month for ongoing financial management</li>
      </ul>

      <p className="text-gray-700 leading-relaxed mb-4">
        <strong>Do-it-yourself considerations:</strong> If managing the vineyard yourself, expect 15-25 hours/week commitment during growing season, 5-10 hours/week dormant season for 20 acres. Peak periods (harvest, pruning) may require 40-60 hour weeks.
      </p>

      <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-6">Critical Success Factors and Common Mistakes</h2>

      <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Top 10 Planning Mistakes to Avoid</h3>

      <div className="bg-white border border-gray-200 rounded-lg p-6 my-8">
        <ol className="space-y-3 text-gray-700">
          <li><strong className="text-gray-900">1. Underestimating total capital needs:</strong> Add minimum 30% to all cost estimates; most failures stem from running out of money, not poor farming</li>
          <li><strong className="text-gray-900">2. Skipping professional soil analysis:</strong> $3,000 soil testing saves $50,000+ in failed plantings and amendments</li>
          <li><strong className="text-gray-900">3. Ignoring water rights due diligence:</strong> Verify water availability before purchasing land—retrofitting water infrastructure is prohibitively expensive</li>
          <li><strong className="text-gray-900">4. Planting varieties based on preference vs. market:</strong> Your favorite wine ≠ profitable grape variety in your region</li>
          <li><strong className="text-gray-900">5. Selecting wrong rootstock:</strong> Mismatched rootstock reduces yields 30-50% and may necessitate replanting ($25,000/acre loss)</li>
          <li><strong className="text-gray-900">6. Inadequate operating capital reserves:</strong> Maintain 2-3 years operating expenses in liquid reserves ($100,000-$400,000)</li>
          <li><strong className="text-gray-900">7. Overly optimistic yield and price projections:</strong> Use conservative models—Year 3 yields are 30-40% of mature, not 75%</li>
          <li><strong className="text-gray-900">8. Buying unsuitable equipment:</strong> Right-size tractor and implements for your acreage; oversized equipment wastes capital</li>
          <li><strong className="text-gray-900">9. Neglecting frost risk assessment:</strong> Single frost event can destroy entire year's crop ($80,000-$200,000 loss for 20 acres)</li>
          <li><strong className="text-gray-900">10. Planting without secured buyers:</strong> Establish purchase contracts or winery relationships before planting, not after first harvest</li>
        </ol>
      </div>

      <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Pre-Planting Checklist</h3>

      <p className="text-gray-700 leading-relaxed mb-4">
        Complete this checklist before committing to land purchase and planting:
      </p>

      <div className="bg-teal-50 border border-teal-200 rounded-lg p-6 my-8">
        <div className="space-y-2 text-sm">
          <div className="flex items-start">
            <span className="text-teal-700 mr-2">☐</span>
            <span className="text-teal-900">20-year climate data analyzed for frost, GDD, rainfall patterns</span>
          </div>
          <div className="flex items-start">
            <span className="text-teal-700 mr-2">☐</span>
            <span className="text-teal-900">Professional grid soil sampling completed (1 sample per 2-5 acres)</span>
          </div>
          <div className="flex items-start">
            <span className="text-teal-700 mr-2">☐</span>
            <span className="text-teal-900">Water rights verified by water attorney; yield testing completed if well-based</span>
          </div>
          <div className="flex items-start">
            <span className="text-teal-700 mr-2">☐</span>
            <span className="text-teal-900">Topographic survey confirms suitable slopes (2-15%) and drainage</span>
          </div>
          <div className="flex items-start">
            <span className="text-teal-700 mr-2">☐</span>
            <span className="text-teal-900">Nematode and soil disease screening completed</span>
          </div>
          <div className="flex items-start">
            <span className="text-teal-700 mr-2">☐</span>
            <span className="text-teal-900">Market research: contacted 10+ wineries about variety demand and pricing</span>
          </div>
          <div className="flex items-start">
            <span className="text-teal-700 mr-2">☐</span>
            <span className="text-teal-900">Variety-climate matching validated by extension viticulturist</span>
          </div>
          <div className="flex items-start">
            <span className="text-teal-700 mr-2">☐</span>
            <span className="text-teal-900">Rootstock selected based on soil analysis and vigor requirements</span>
          </div>
          <div className="flex items-start">
            <span className="text-teal-700 mr-2">☐</span>
            <span className="text-teal-900">10-year financial model completed with 20% cost contingency</span>
          </div>
          <div className="flex items-start">
            <span className="text-teal-700 mr-2">☐</span>
            <span className="text-teal-900">Financing secured; operating capital reserves funded (2-3 years expenses)</span>
          </div>
          <div className="flex items-start">
            <span className="text-teal-700 mr-2">☐</span>
            <span className="text-teal-900">Legal entity formed; operating agreement finalized</span>
          </div>
          <div className="flex items-start">
            <span className="text-teal-700 mr-2">☐</span>
            <span className="text-teal-900">All required permits obtained or applications submitted</span>
          </div>
          <div className="flex items-start">
            <span className="text-teal-700 mr-2">☐</span>
            <span className="text-teal-900">Insurance policies in place (property, liability, workers comp, crop)</span>
          </div>
          <div className="flex items-start">
            <span className="text-teal-700 mr-2">☐</span>
            <span className="text-teal-900">Grape purchase contracts or winery relationships established</span>
          </div>
          <div className="flex items-start">
            <span className="text-teal-700 mr-2">☐</span>
            <span className="text-teal-900">Vineyard manager hired or consulting viticulturist engaged</span>
          </div>
          <div className="flex items-start">
            <span className="text-teal-700 mr-2">☐</span>
            <span className="text-teal-900">Vine order placed (12-18 months lead time for quality grafted vines)</span>
          </div>
          <div className="flex items-start">
            <span className="text-teal-700 mr-2">☐</span>
            <span className="text-teal-900">Trellis materials sourced and delivery scheduled</span>
          </div>
          <div className="flex items-start">
            <span className="text-teal-700 mr-2">☐</span>
            <span className="text-teal-900">Equipment purchased or lease agreements finalized</span>
          </div>
        </div>
      </div>

      <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-6">Next Steps: Creating Your Detailed Plan</h2>

      <p className="text-gray-700 leading-relaxed mb-4">
        With this comprehensive planning framework, you're ready to create a detailed, site-specific vineyard development plan. Key next actions:
      </p>

      <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6 ml-4">
        <li><strong>Build financial model:</strong> Use vineyard planning software to project 10-year cash flows with multiple scenarios</li>
        <li><strong>Engage professional team:</strong> Hire viticulture consultant, attorney, and soil scientist before site selection</li>
        <li><strong>Visit established vineyards:</strong> Tour 5-10 successful operations in your target region; learn from experienced growers</li>
        <li><strong>Create implementation timeline:</strong> Develop month-by-month action plan working backward from target planting date</li>
        <li><strong>Stress-test assumptions:</strong> Model worst-case scenarios (frost damage, low yields, depressed pricing)</li>
      </ul>

      <div className="bg-gradient-to-r from-teal-50 to-green-50 border border-teal-200 rounded-lg p-6 my-8">
        <h3 className="text-lg font-bold text-teal-900 mb-3">Use Professional Planning Tools</h3>
        <p className="text-teal-800 mb-4">
          The Trellis vineyard planner helps you model all the variables discussed in this guide—from site design and trellis costs to 10-year financial projections. Create multiple scenarios, test assumptions, and build investor-ready financial forecasts.
        </p>
        <div className="flex gap-4">
          <a href="/planner" className="inline-block bg-teal-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-teal-700 transition-colors">
            Start Planning Your Vineyard
          </a>
          <a href="/docs/planner" className="inline-block bg-white text-teal-700 px-6 py-3 rounded-lg font-semibold border-2 border-teal-600 hover:bg-teal-50 transition-colors">
            View Planning Documentation
          </a>
        </div>
      </div>

      <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-6">Final Thoughts</h2>

      <p className="text-gray-700 leading-relaxed mb-4">
        Successful vineyard planning is a marathon, not a sprint. The 18-24 month planning process outlined in this guide significantly increases your probability of long-term success. While the upfront time and money investment in professional advisors, comprehensive site assessment, and financial modeling may seem excessive, these costs are trivial compared to the capital at risk ($1M-$3M+) and the multi-decade commitment you're making.
      </p>

      <p className="text-gray-700 leading-relaxed mb-4">
        The vineyard owners who succeed share common traits: realistic expectations, adequate capitalization, professional advisory teams, conservative financial modeling, and patience. Those who fail typically skip critical planning steps, underestimate costs, rely on optimistic projections, and run out of capital before achieving cash flow.
      </p>

      <p className="text-gray-700 leading-relaxed">
        <strong>Remember:</strong> Data-driven planning beats optimism every time. Take the time to research thoroughly, consult with experts, visit established operations, and build conservative financial models that can weather unexpected challenges. Your vineyard will potentially outlive you—plan accordingly.
      </p>
    </>
  ),

  "vineyard-roi-expectations": (
    <>
      <p className="text-xl text-gray-600 leading-relaxed mb-8">
        One of the most common questions prospective vineyard owners ask is: "When will my vineyard be profitable?" The answer is more nuanced than you might expect. Understanding realistic ROI timelines and cash flow patterns is critical to avoiding the undercapitalization that sinks many vineyard ventures.
      </p>

      <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-6">The Harsh Reality: Years 0-3</h2>

      <p className="text-gray-700 leading-relaxed mb-4">
        The first three years of vineyard ownership are purely cash-negative. There is no revenue—only expenses.
      </p>

      <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Year 0: The Setup Year</h3>

      <p className="text-gray-700 leading-relaxed mb-4">
        Year 0 represents your largest capital outlay:
      </p>

      <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6 ml-4">
        <li><strong>Land acquisition:</strong> Typically requires 25-40% down payment plus closing costs</li>
        <li><strong>Site preparation:</strong> Soil testing, amendments, grading, drainage installation</li>
        <li><strong>Trellis installation:</strong> Posts, wire, anchors, labor—your second-largest upfront cost</li>
        <li><strong>Irrigation system:</strong> Mainline, laterals, drip emitters, pump, tank</li>
        <li><strong>Vine purchase and planting:</strong> Rootstock selection, grafted vines, planting labor</li>
        <li><strong>Equipment acquisition:</strong> Tractor, sprayer, mower, ATV, bins, hand tools</li>
      </ul>

      <div className="bg-white border border-gray-200 rounded-lg p-6 my-8">
        <h4 className="text-lg font-bold text-gray-900 mb-4">Typical Year 0 Costs (20 acres)</h4>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-700">Land down payment (30% of $50k/ac)</span>
            <span className="font-semibold text-gray-900">$300,000</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">Site prep + trellis + irrigation</span>
            <span className="font-semibold text-gray-900">$260,000</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">Vines + planting labor</span>
            <span className="font-semibold text-gray-900">$90,000</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">Equipment</span>
            <span className="font-semibold text-gray-900">$150,000</span>
          </div>
          <div className="border-t border-gray-300 pt-3 flex justify-between">
            <span className="text-gray-900 font-bold">Total Year 0 Investment</span>
            <span className="font-bold text-teal-600 text-xl">$800,000</span>
          </div>
        </div>
      </div>

      <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Years 1-2: The Care and Feeding Phase</h3>

      <p className="text-gray-700 leading-relaxed mb-4">
        Young vines require intensive care but produce no commercial fruit:
      </p>

      <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6 ml-4">
        <li><strong>Training:</strong> Establishing trunk and cordons requires precise pruning and positioning</li>
        <li><strong>Irrigation:</strong> Young vines need careful water management to establish roots</li>
        <li><strong>Pest and disease management:</strong> Full spray program to protect developing plants</li>
        <li><strong>Weed control:</strong> Critical during establishment—weeds compete for water and nutrients</li>
        <li><strong>Frost protection:</strong> Young vines are vulnerable to spring frost damage</li>
      </ul>

      <p className="text-gray-700 leading-relaxed mb-4">
        Annual operating expenses during Years 1-2 typically run $2,000-$3,500/acre. For a 20-acre vineyard, budget $40,000-$70,000 per year with zero revenue to offset these costs.
      </p>

      <div className="bg-amber-50 border-l-4 border-amber-600 p-6 my-8 rounded-r-lg">
        <p className="text-amber-900 font-semibold mb-2">⚠️ Cash Flow Warning</p>
        <p className="text-amber-800">
          Many new vineyard owners underestimate the emotional and financial toll of 3 years of negative cash flow. Ensure you have sufficient capital reserves or off-farm income to sustain operations through this period. Most vineyard failures occur in Years 2-4 when owners run out of cash.
        </p>
      </div>

      <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-6">The Light at the End: Years 3-5</h2>

      <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Year 3: First Commercial Crop</h3>

      <p className="text-gray-700 leading-relaxed mb-4">
        Year 3 brings your first revenue, but expectations must remain conservative:
      </p>

      <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6 ml-4">
        <li><strong>Yield:</strong> Expect 25-40% of mature crop (1-1.5 tons/acre vs. 3-4 tons/acre at maturity)</li>
        <li><strong>Quality:</strong> Fruit quality may be lower, affecting price</li>
        <li><strong>Buyer caution:</strong> First-time crops from new vineyards often sell at discounted rates</li>
      </ul>

      <p className="text-gray-700 leading-relaxed mb-4">
        <strong>Realistic Year 3 revenue:</strong> If your target price is $3,000/ton at maturity, expect $1,500-$2,000/ton in Year 3 for 1.25 tons/acre = $1,875-$2,500/acre revenue.
      </p>

      <p className="text-gray-700 leading-relaxed mb-4">
        With operating expenses of $3,500/acre, you're still cash-negative in Year 3, but the psychological boost of generating revenue cannot be overstated.
      </p>

      <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Year 4: Ramping Production</h3>

      <p className="text-gray-700 leading-relaxed mb-4">
        Year 4 typically delivers 50-75% of full production:
      </p>

      <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6 ml-4">
        <li><strong>Yield:</strong> 2-3 tons/acre for most varieties</li>
        <li><strong>Quality:</strong> Approaching target quality levels</li>
        <li><strong>Price:</strong> 85-100% of mature vineyard pricing</li>
      </ul>

      <p className="text-gray-700 leading-relaxed mb-4">
        <strong>Year 4 scenario:</strong> 2.5 tons/acre × $2,750/ton = $6,875/acre revenue vs. $4,200/acre operating expenses = <strong>$2,675/acre positive cash flow</strong>.
      </p>

      <p className="text-gray-700 leading-relaxed mb-4">
        This is often the first year of positive operating cash flow, though you're still far from recovering your initial investment.
      </p>

      <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Year 5: Full Production</h3>

      <p className="text-gray-700 leading-relaxed mb-4">
        Year 5 represents the first year of full commercial production:
      </p>

      <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6 ml-4">
        <li><strong>Yield:</strong> 3-4 tons/acre (variety and site dependent)</li>
        <li><strong>Quality:</strong> Full quality potential realized</li>
        <li><strong>Price:</strong> Full market rate for your variety and region</li>
        <li><strong>Reputation:</strong> Established track record with buyers</li>
      </ul>

      <p className="text-gray-700 leading-relaxed mb-4">
        <strong>Year 5 scenario:</strong> 3.5 tons/acre × $3,000/ton = $10,500/acre revenue vs. $4,500/acre operating expenses = <strong>$6,000/acre operating profit</strong>.
      </p>

      <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-6">Years 6-10: Maturity and Refinement</h2>

      <p className="text-gray-700 leading-relaxed mb-4">
        Years 6-10 represent your vineyard's mature productive phase:
      </p>

      <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Stabilized Cash Flow</h3>

      <p className="text-gray-700 leading-relaxed mb-4">
        Operating cash flows stabilize as you optimize farming practices:
      </p>

      <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6 ml-4">
        <li>Yields remain consistent at 3-4 tons/acre</li>
        <li>Operating expenses predictable at $4,500-$5,500/acre</li>
        <li>Prices track with regional grape market trends</li>
        <li>Reputation premium may develop for consistent quality</li>
      </ul>

      <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">When Does ROI Turn Positive?</h3>

      <p className="text-gray-700 leading-relaxed mb-4">
        This is the critical question. Using our 20-acre example:
      </p>

      <div className="bg-white border border-gray-200 rounded-lg p-6 my-8">
        <h4 className="text-lg font-bold text-gray-900 mb-4">10-Year Cumulative Cash Flow Example</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-700">Initial investment (Year 0)</span>
            <span className="text-red-600 font-semibold">-$800,000</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">Years 1-2 operating losses</span>
            <span className="text-red-600 font-semibold">-$110,000</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">Year 3 net cash flow</span>
            <span className="text-red-600 font-semibold">-$32,500</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">Year 4 net cash flow</span>
            <span className="text-green-600 font-semibold">+$53,500</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">Year 5 net cash flow</span>
            <span className="text-green-600 font-semibold">+$120,000</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">Years 6-10 cumulative (avg $130k/yr)</span>
            <span className="text-green-600 font-semibold">+$650,000</span>
          </div>
          <div className="border-t border-gray-300 pt-3 mt-3 flex justify-between">
            <span className="text-gray-900 font-bold">10-Year Cumulative Cash Flow</span>
            <span className="font-bold text-red-600">-$119,000</span>
          </div>
        </div>
      </div>

      <p className="text-gray-700 leading-relaxed mb-4">
        In this realistic scenario, the vineyard remains cumulative cash-negative even after 10 years. Positive ROI typically occurs in Years 12-15 for bulk grape operations.
      </p>

      <div className="bg-teal-50 border-l-4 border-teal-600 p-6 my-8 rounded-r-lg">
        <p className="text-teal-900 font-semibold mb-2">💡 The Long-Term Perspective</p>
        <p className="text-teal-800">
          Vineyards are long-term agricultural investments, not get-rich-quick schemes. The real value often lies in land appreciation, lifestyle benefits, and the option value of converting to estate wine production. Treat your vineyard as a 20-30 year investment horizon, not a 5-year flip.
        </p>
      </div>

      <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-6">Accelerating ROI: Alternative Strategies</h2>

      <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Estate Wine Production</h3>

      <p className="text-gray-700 leading-relaxed mb-4">
        Producing and selling your own wine can dramatically improve margins:
      </p>

      <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6 ml-4">
        <li><strong>Wholesale wine:</strong> $25-$45/bottle wholesale (vs. $3,000/ton = $12.50/bottle equivalent in grapes)</li>
        <li><strong>DTC wine sales:</strong> $40-$85/bottle retail (70-85% gross margins)</li>
        <li><strong>Trade-off:</strong> Requires winery construction ($500k-$2M+), longer cash flow delay, market development risk</li>
      </ul>

      <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Buying Established Vineyards</h3>

      <p className="text-gray-700 leading-relaxed mb-4">
        Purchasing a mature, producing vineyard eliminates Years 0-4 cash drain:
      </p>

      <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6 ml-4">
        <li><strong>Premium cost:</strong> Established vineyards command 2-3× the price of raw land</li>
        <li><strong>Immediate revenue:</strong> Positive cash flow from Year 1</li>
        <li><strong>Proven performance:</strong> Historical yield and quality data reduce risk</li>
        <li><strong>Faster ROI:</strong> Typically 8-12 years vs. 12-15 years for new plantings</li>
      </ul>

      <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-6">The Bottom Line</h2>

      <p className="text-gray-700 leading-relaxed mb-4">
        Understanding realistic ROI timelines is essential for vineyard success:
      </p>

      <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6 ml-4">
        <li>Plan for 3 years of zero revenue and 5 years before meaningful cash flow</li>
        <li>Budget 20% contingency on all cost estimates</li>
        <li>Maintain capital reserves to sustain 4-5 years of operations</li>
        <li>Model conservative yield and price assumptions</li>
        <li>View vineyards as 15-20 year investments, not short-term ventures</li>
      </ul>

      <p className="text-gray-700 leading-relaxed">
        With realistic expectations and adequate capitalization, vineyard ownership can be both financially rewarding and personally fulfilling. The key is entering the venture with your eyes wide open to the true timeline and financial requirements.
      </p>
    </>
  ),

  "trellis-system-design": (
    <>
      <p className="text-xl text-gray-600 leading-relaxed mb-8">
        Your trellis system is one of the most important—and expensive—decisions you'll make when establishing a vineyard. It affects everything from vine health and fruit quality to labor efficiency and long-term maintenance costs. Let's compare VSP (Vertical Shoot Positioning) with other common trellis systems.
      </p>

      <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-6">VSP: The Industry Standard</h2>

      <p className="text-gray-700 leading-relaxed mb-4">
        Vertical Shoot Positioning (VSP) is the most widely used trellis system in premium wine grape production worldwide. There are good reasons for its dominance.
      </p>

      <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">How VSP Works</h3>

      <p className="text-gray-700 leading-relaxed mb-4">
        VSP trains vine shoots vertically upward from a horizontal fruiting wire (cordon):
      </p>

      <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6 ml-4">
        <li><strong>Cordon wire:</strong> Permanent cordons trained horizontally at 30-42 inches height</li>
        <li><strong>Fruiting zone:</strong> Grape clusters hang from the cordon in a narrow vertical band</li>
        <li><strong>Catch wires:</strong> 2-4 movable wires guide shoots vertically upward</li>
        <li><strong>Canopy height:</strong> Shoots trained to 4-6 feet above cordon wire</li>
      </ul>

      <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">VSP Advantages</h3>

      <div className="bg-green-50 border-l-4 border-green-600 p-6 my-8 rounded-r-lg">
        <ul className="space-y-3 text-green-900">
          <li><strong>✓ Superior fruit quality:</strong> Optimal sun exposure and air circulation in fruiting zone</li>
          <li><strong>✓ Disease management:</strong> Vertical canopy promotes airflow, reducing powdery mildew and botrytis</li>
          <li><strong>✓ Mechanization-friendly:</strong> Compatible with mechanical harvesters, pruners, and leaf removers</li>
          <li><strong>✓ Labor efficiency:</strong> Easier hand harvesting, pruning, and canopy management</li>
          <li><strong>✓ Proven track record:</strong> Decades of research and refinement across all major wine regions</li>
        </ul>
      </div>

      <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">VSP Disadvantages</h3>

      <div className="bg-amber-50 border-l-4 border-amber-600 p-6 my-8 rounded-r-lg">
        <ul className="space-y-3 text-amber-900">
          <li><strong>✗ Higher material costs:</strong> $8,000-$15,000/acre including posts, wire, anchors, and labor</li>
          <li><strong>✗ Canopy management intensive:</strong> Requires shoot positioning, tucking, and hedging</li>
          <li><strong>✗ Not ideal for vigorous sites:</strong> Excessive vigor leads to shading and crowding</li>
          <li><strong>✗ Limited capacity:</strong> Lower yields than sprawling systems (but higher quality)</li>
        </ul>
      </div>

      <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Best Applications for VSP</h3>

      <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6 ml-4">
        <li><strong>Premium wine production:</strong> When fruit quality is paramount</li>
        <li><strong>Low to moderate vigor sites:</strong> Prevents excessive vegetative growth</li>
        <li><strong>Cool, humid climates:</strong> Where disease pressure is high</li>
        <li><strong>Varieties:</strong> Pinot Noir, Chardonnay, Cabernet Sauvignon, Merlot, Riesling</li>
      </ul>

      <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-6">Alternative Trellis Systems</h2>

      <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Geneva Double Curtain (GDC)</h3>

      <p className="text-gray-700 leading-relaxed mb-4">
        GDC divides the canopy into two downward-hanging curtains on a high, divided trellis.
      </p>

      <p className="text-gray-700 leading-relaxed mb-4">
        <strong>Structure:</strong> Crossarms at 5-6 feet height create two parallel cordons 3-4 feet apart, with shoots hanging downward.
      </p>

      <div className="bg-white border border-gray-200 rounded-lg p-6 my-8">
        <h4 className="text-lg font-bold text-gray-900 mb-4">GDC Pros & Cons</h4>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <p className="font-semibold text-green-700 mb-2">Advantages:</p>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>• High yields (50-100% more than VSP)</li>
              <li>• Excellent for vigorous sites</li>
              <li>• Lower canopy management labor</li>
              <li>• Good mechanical harvesting compatibility</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-amber-700 mb-2">Disadvantages:</p>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>• Lower fruit quality potential</li>
              <li>• Higher trellis materials cost</li>
              <li>• Shading in fruiting zone</li>
              <li>• Not suitable for premium wines</li>
            </ul>
          </div>
        </div>
      </div>

      <p className="text-gray-700 leading-relaxed mb-4">
        <strong>Best for:</strong> Bulk wine production, vigorous American hybrids, regions prioritizing yield over quality
      </p>

      <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Scott Henry Trellis</h3>

      <p className="text-gray-700 leading-relaxed mb-4">
        Scott Henry uses alternating vine training: one vine's shoots grow up, the next vine's shoots grow down.
      </p>

      <p className="text-gray-700 leading-relaxed mb-4">
        <strong>Structure:</strong> Double-cordon system with shoots trained both upward and downward, dividing the canopy.
      </p>

      <div className="bg-white border border-gray-200 rounded-lg p-6 my-8">
        <h4 className="text-lg font-bold text-gray-900 mb-4">Scott Henry Pros & Cons</h4>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <p className="font-semibold text-green-700 mb-2">Advantages:</p>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>• Handles moderate to high vigor well</li>
              <li>• Better fruit quality than GDC</li>
              <li>• Increased yields vs. VSP (20-40%)</li>
              <li>• Good sun exposure when managed correctly</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-amber-700 mb-2">Disadvantages:</p>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>• Complex shoot positioning required</li>
              <li>• Higher labor for canopy management</li>
              <li>• Difficult mechanical harvesting</li>
              <li>• Training complexity</li>
            </ul>
          </div>
        </div>
      </div>

      <p className="text-gray-700 leading-relaxed mb-4">
        <strong>Best for:</strong> Moderate to high vigor sites, regions wanting yield + quality balance, Syrah, Grenache
      </p>

      <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Lyre (U-Trellis)</h3>

      <p className="text-gray-700 leading-relaxed mb-4">
        Lyre system creates a U-shaped canopy with shoots trained upward and outward on angled wires.
      </p>

      <p className="text-gray-700 leading-relaxed mb-4">
        <strong>Structure:</strong> Split cordon with two canopies angled outward at 30-45°, resembling a lyre or U-shape.
      </p>

      <div className="bg-white border border-gray-200 rounded-lg p-6 my-8">
        <h4 className="text-lg font-bold text-gray-900 mb-4">Lyre Pros & Cons</h4>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <p className="font-semibold text-green-700 mb-2">Advantages:</p>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>• Excellent light interception</li>
              <li>• Handles very high vigor</li>
              <li>• Increased leaf area for photosynthesis</li>
              <li>• Higher yields with good quality potential</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-amber-700 mb-2">Disadvantages:</p>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>• Very high installation cost ($18k-$25k/ac)</li>
              <li>• Complex canopy management</li>
              <li>• Wide row spacing required (10+ feet)</li>
              <li>• Not mechanization-friendly</li>
            </ul>
          </div>
        </div>
      </div>

      <p className="text-gray-700 leading-relaxed mb-4">
        <strong>Best for:</strong> Very high vigor sites, boutique wineries with hand labor, Chardonnay in fertile soils
      </p>

      <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-6">Cost Comparison</h2>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden my-8">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Trellis System</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Materials Cost/Acre</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Installation Labor</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Total Cost/Acre</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            <tr>
              <td className="px-6 py-4 text-sm text-gray-900 font-medium">VSP</td>
              <td className="px-6 py-4 text-sm text-gray-700">$5,000-$9,000</td>
              <td className="px-6 py-4 text-sm text-gray-700">$3,000-$6,000</td>
              <td className="px-6 py-4 text-sm font-semibold text-gray-900">$8,000-$15,000</td>
            </tr>
            <tr>
              <td className="px-6 py-4 text-sm text-gray-900 font-medium">Geneva Double Curtain</td>
              <td className="px-6 py-4 text-sm text-gray-700">$6,000-$10,000</td>
              <td className="px-6 py-4 text-sm text-gray-700">$4,000-$7,000</td>
              <td className="px-6 py-4 text-sm font-semibold text-gray-900">$10,000-$17,000</td>
            </tr>
            <tr>
              <td className="px-6 py-4 text-sm text-gray-900 font-medium">Scott Henry</td>
              <td className="px-6 py-4 text-sm text-gray-700">$5,500-$9,500</td>
              <td className="px-6 py-4 text-sm text-gray-700">$3,500-$6,500</td>
              <td className="px-6 py-4 text-sm font-semibold text-gray-900">$9,000-$16,000</td>
            </tr>
            <tr>
              <td className="px-6 py-4 text-sm text-gray-900 font-medium">Lyre</td>
              <td className="px-6 py-4 text-sm text-gray-700">$11,000-$15,000</td>
              <td className="px-6 py-4 text-sm text-gray-700">$7,000-$10,000</td>
              <td className="px-6 py-4 text-sm font-semibold text-gray-900">$18,000-$25,000</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-6">Decision Framework</h2>

      <p className="text-gray-700 leading-relaxed mb-4">
        Choose your trellis system based on these key factors:
      </p>

      <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Site Vigor</h3>

      <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6 ml-4">
        <li><strong>Low vigor:</strong> VSP is ideal—don't overspend on divided canopy systems</li>
        <li><strong>Moderate vigor:</strong> VSP or Scott Henry depending on variety</li>
        <li><strong>High vigor:</strong> GDC, Scott Henry, or Lyre to manage excessive growth</li>
      </ul>

      <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. Quality Goals</h3>

      <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6 ml-4">
        <li><strong>Ultra-premium:</strong> VSP delivers optimal fruit quality</li>
        <li><strong>Premium:</strong> VSP or well-managed Scott Henry</li>
        <li><strong>Bulk/value wines:</strong> GDC maximizes yield at acceptable quality</li>
      </ul>

      <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. Labor Availability</h3>

      <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6 ml-4">
        <li><strong>Limited hand labor:</strong> VSP (mechanization-friendly) or GDC</li>
        <li><strong>Skilled labor available:</strong> Any system, including Scott Henry or Lyre</li>
        <li><strong>Mechanical harvest required:</strong> VSP or GDC only</li>
      </ul>

      <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4. Budget Constraints</h3>

      <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6 ml-4">
        <li><strong>Tight budget:</strong> VSP offers best quality-to-cost ratio</li>
        <li><strong>Yield-focused:</strong> GDC despite higher upfront cost</li>
        <li><strong>Unlimited budget:</strong> Match system to site conditions regardless of cost</li>
      </ul>

      <div className="bg-teal-50 border-l-4 border-teal-600 p-6 my-8 rounded-r-lg">
        <p className="text-teal-900 font-semibold mb-2">💡 Expert Recommendation</p>
        <p className="text-teal-800">
          For first-time vineyard owners focused on premium wine quality, VSP is the safest choice. It's the most forgiving system to manage, has the best research backing, and delivers consistent quality across varied conditions. Save the experimentation with alternative systems until you've mastered basic viticulture.
        </p>
      </div>

      <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-6">The Bottom Line</h2>

      <p className="text-gray-700 leading-relaxed">
        VSP remains the gold standard for premium wine grape production for good reason: it delivers superior fruit quality, is mechanization-compatible, and has decades of proven performance. While alternative systems have their place—especially on high-vigor sites or for bulk production—most new vineyards will achieve the best results with a well-designed VSP trellis system.
      </p>
    </>
  ),

  "land-costs-2025": (
    <>
      <p className="text-xl text-gray-600 leading-relaxed mb-8">
        Vineyard land prices vary dramatically across the United States, ranging from under $15,000/acre in emerging regions to over $500,000/acre in Napa Valley's most prestigious AVAs. Understanding these regional cost differences is essential for realistic financial planning and identifying opportunities.
      </p>

      <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-6">Premium Regions: California's Wine Country</h2>

      <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Napa Valley</h3>

      <p className="text-gray-700 leading-relaxed mb-4">
        Napa Valley remains America's most expensive vineyard real estate market, with prices driven by global brand recognition and limited available land.
      </p>

      <div className="bg-white border border-gray-200 rounded-lg p-6 my-8">
        <h4 className="text-lg font-bold text-gray-900 mb-4">Napa Valley Pricing Tiers (2025)</h4>
        <div className="space-y-4">
          <div>
            <p className="font-semibold text-gray-900 mb-2">Raw/Undeveloped Land</p>
            <p className="text-gray-700 mb-1">$100,000-$300,000/acre</p>
            <p className="text-sm text-gray-600">Varies by AVA designation, elevation, and development potential</p>
          </div>
          <div>
            <p className="font-semibold text-gray-900 mb-2">Established Vineyards (Producing)</p>
            <p className="text-gray-700 mb-1">$300,000-$500,000/acre</p>
            <p className="text-sm text-gray-600">Premium varieties (Cabernet Sauvignon), mature vines, proven production history</p>
          </div>
          <div>
            <p className="font-semibold text-gray-900 mb-2">Ultra-Premium AVAs (Rutherford, Oakville, Stags Leap)</p>
            <p className="text-gray-700 mb-1">$500,000-$1,000,000+/acre</p>
            <p className="text-sm text-gray-600">Trophy properties with established reputation and multi-generational track records</p>
          </div>
        </div>
      </div>

      <p className="text-gray-700 leading-relaxed mb-4">
        <strong>Key factors driving Napa pricing:</strong>
      </p>

      <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6 ml-4">
        <li><strong>AVA prestige:</strong> Rutherford, Oakville, and Stags Leap District command 2-3× premiums over valley floor</li>
        <li><strong>Water rights:</strong> Secure, abundant water adds $50,000-$100,000/acre to value</li>
        <li><strong>Ag Preserve zoning:</strong> Protected agricultural zoning limits supply, supporting prices</li>
        <li><strong>Cabernet pedigree:</strong> Proven Cabernet Sauvignon sites worth significantly more than white varieties</li>
      </ul>

      <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Sonoma County</h3>

      <p className="text-gray-700 leading-relaxed mb-4">
        Sonoma offers more diverse terroir and AVAs than Napa, with correspondingly diverse pricing:
      </p>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden my-8">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Sonoma AVA/Region</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Raw Land</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Established Vineyard</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            <tr>
              <td className="px-6 py-4 text-sm text-gray-900">Russian River Valley</td>
              <td className="px-6 py-4 text-sm text-gray-700">$60,000-$150,000/ac</td>
              <td className="px-6 py-4 text-sm text-gray-700">$200,000-$350,000/ac</td>
            </tr>
            <tr>
              <td className="px-6 py-4 text-sm text-gray-900">Sonoma Coast</td>
              <td className="px-6 py-4 text-sm text-gray-700">$40,000-$100,000/ac</td>
              <td className="px-6 py-4 text-sm text-gray-700">$150,000-$275,000/ac</td>
            </tr>
            <tr>
              <td className="px-6 py-4 text-sm text-gray-900">Dry Creek Valley</td>
              <td className="px-6 py-4 text-sm text-gray-700">$50,000-$120,000/ac</td>
              <td className="px-6 py-4 text-sm text-gray-700">$175,000-$300,000/ac</td>
            </tr>
            <tr>
              <td className="px-6 py-4 text-sm text-gray-900">Alexander Valley</td>
              <td className="px-6 py-4 text-sm text-gray-700">$45,000-$110,000/ac</td>
              <td className="px-6 py-4 text-sm text-gray-700">$160,000-$280,000/ac</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Central Coast California</h3>

      <p className="text-gray-700 leading-relaxed mb-4">
        The Central Coast (Paso Robles, Santa Barbara, San Luis Obispo) offers premium quality potential at more accessible price points:
      </p>

      <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6 ml-4">
        <li><strong>Raw land:</strong> $25,000-$75,000/acre (varies widely by location and water availability)</li>
        <li><strong>Established vineyards:</strong> $100,000-$200,000/acre</li>
        <li><strong>Premium sites (Sta. Rita Hills, Edna Valley):</strong> $150,000-$250,000/acre</li>
      </ul>

      <div className="bg-teal-50 border-l-4 border-teal-600 p-6 my-8 rounded-r-lg">
        <p className="text-teal-900 font-semibold mb-2">💡 Central Coast Opportunity</p>
        <p className="text-teal-800">
          The Central Coast represents one of California's best value propositions: growing international recognition for Rhône varieties and Burgundian varietals, significantly lower land costs than Napa/Sonoma, and improving infrastructure. Water availability remains the critical constraint.
        </p>
      </div>

      <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-6">Pacific Northwest</h2>

      <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Oregon Willamette Valley</h3>

      <p className="text-gray-700 leading-relaxed mb-4">
        Oregon's Willamette Valley has established itself as America's premier Pinot Noir region:
      </p>

      <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6 ml-4">
        <li><strong>Raw hillside land:</strong> $15,000-$50,000/acre</li>
        <li><strong>Established Pinot Noir vineyards:</strong> $75,000-$150,000/acre</li>
        <li><strong>Premium sub-AVAs (Dundee Hills, Ribbon Ridge):</strong> $100,000-$200,000/acre</li>
      </ul>

      <p className="text-gray-700 leading-relaxed mb-4">
        Willamette pricing remains significantly below California despite comparable wine quality, driven by abundant available land and lower regional operating costs.
      </p>

      <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Washington Columbia Valley</h3>

      <p className="text-gray-700 leading-relaxed mb-4">
        Washington state offers some of America's most affordable premium vineyard land:
      </p>

      <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6 ml-4">
        <li><strong>Raw land with water rights:</strong> $10,000-$30,000/acre</li>
        <li><strong>Established vineyards:</strong> $50,000-$100,000/acre</li>
        <li><strong>Premium sites (Red Mountain, Walla Walla Valley):</strong> $75,000-$150,000/acre</li>
      </ul>

      <p className="text-gray-700 leading-relaxed mb-4">
        <strong>Critical consideration:</strong> Water rights are essential and can add $5,000-$15,000/acre to land costs. Eastern Washington's desert climate makes irrigation mandatory.
      </p>

      <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-6">Emerging Wine Regions</h2>

      <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Texas Hill Country</h3>

      <p className="text-gray-700 leading-relaxed mb-4">
        Texas has emerged as America's fifth-largest wine-producing state, with the Hill Country AVA leading growth:
      </p>

      <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6 ml-4">
        <li><strong>Raw land:</strong> $30,000-$75,000/acre (dramatic rise from $8,000-$15,000/acre a decade ago)</li>
        <li><strong>Established vineyards:</strong> $100,000+/acre for proven sites</li>
        <li><strong>Premium locations (Fredericksburg area):</strong> $125,000-$175,000/acre</li>
      </ul>

      <div className="bg-amber-50 border-l-4 border-amber-600 p-6 my-8 rounded-r-lg">
        <p className="text-amber-900 font-semibold mb-2">⚠️ Market Heating Warning</p>
        <p className="text-amber-800">
          Texas Hill Country land prices have tripled in the past 10 years, driven by winery tourism, Austin/San Antonio proximity, and strong demand for rural recreational properties. Don't assume current prices represent long-term norms—the market may be overheated relative to grape production economics.
        </p>
      </div>

      <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Arizona Verde Valley</h3>

      <p className="text-gray-700 leading-relaxed mb-4">
        Arizona's high-elevation wine country is gaining recognition for quality production:
      </p>

      <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6 ml-4">
        <li><strong>Raw land:</strong> $30,000-$60,000/acre (limited suitable high-elevation sites)</li>
        <li><strong>Established vineyards:</strong> $80,000+/acre</li>
        <li><strong>Challenges:</strong> Water availability, extreme diurnal temperature swings, limited infrastructure</li>
      </ul>

      <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">New York Finger Lakes</h3>

      <p className="text-gray-700 leading-relaxed mb-4">
        New York's Finger Lakes region specializes in cool-climate varieties and boasts a well-established wine tourism economy:
      </p>

      <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6 ml-4">
        <li><strong>Raw lakeside land:</strong> $20,000-$50,000/acre</li>
        <li><strong>Planted vineyards:</strong> $80,000+/acre statewide average</li>
        <li><strong>Premium lake-effect sites:</strong> $100,000-$150,000/acre</li>
      </ul>

      <p className="text-gray-700 leading-relaxed mb-4">
        The Finger Lakes benefits from established wine tourism infrastructure, proximity to major Northeastern population centers, and growing reputation for Riesling and sparkling wines.
      </p>

      <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">New Mexico</h3>

      <p className="text-gray-700 leading-relaxed mb-4">
        New Mexico offers some of America's most affordable vineyard development opportunities:
      </p>

      <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6 ml-4">
        <li><strong>Raw agricultural land:</strong> $10,000-$35,000/acre</li>
        <li><strong>Established vineyards:</strong> $50,000+/acre (limited sales data)</li>
        <li><strong>Regions:</strong> Southern New Mexico, Albuquerque area, northern elevations</li>
      </ul>

      <p className="text-gray-700 leading-relaxed mb-4">
        New Mexico's wine industry is nascent but growing, with high-elevation sites (4,000-7,000 feet) producing interesting results with Spanish and Rhône varieties.
      </p>

      <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-6">Regional Comparison: Complete Overview</h2>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden my-8">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Region</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Raw Land Range</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Established Vineyard</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Market Trend</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            <tr>
              <td className="px-6 py-4 text-sm text-gray-900 font-medium">Napa Valley, CA</td>
              <td className="px-6 py-4 text-sm text-gray-700">$100,000-$300,000/ac</td>
              <td className="px-6 py-4 text-sm text-gray-700">$300,000-$1,000,000+/ac</td>
              <td className="px-6 py-4 text-sm text-gray-700">Stable/Appreciating</td>
            </tr>
            <tr>
              <td className="px-6 py-4 text-sm text-gray-900 font-medium">Sonoma County, CA</td>
              <td className="px-6 py-4 text-sm text-gray-700">$40,000-$150,000/ac</td>
              <td className="px-6 py-4 text-sm text-gray-700">$150,000-$350,000/ac</td>
              <td className="px-6 py-4 text-sm text-gray-700">Stable</td>
            </tr>
            <tr>
              <td className="px-6 py-4 text-sm text-gray-900 font-medium">Central Coast, CA</td>
              <td className="px-6 py-4 text-sm text-gray-700">$25,000-$75,000/ac</td>
              <td className="px-6 py-4 text-sm text-gray-700">$100,000-$250,000/ac</td>
              <td className="px-6 py-4 text-sm text-gray-700">Appreciating</td>
            </tr>
            <tr>
              <td className="px-6 py-4 text-sm text-gray-900 font-medium">Oregon Willamette</td>
              <td className="px-6 py-4 text-sm text-gray-700">$15,000-$50,000/ac</td>
              <td className="px-6 py-4 text-sm text-gray-700">$75,000-$200,000/ac</td>
              <td className="px-6 py-4 text-sm text-gray-700">Appreciating</td>
            </tr>
            <tr>
              <td className="px-6 py-4 text-sm text-gray-900 font-medium">Washington Columbia</td>
              <td className="px-6 py-4 text-sm text-gray-700">$10,000-$30,000/ac</td>
              <td className="px-6 py-4 text-sm text-gray-700">$50,000-$150,000/ac</td>
              <td className="px-6 py-4 text-sm text-gray-700">Stable/Appreciating</td>
            </tr>
            <tr>
              <td className="px-6 py-4 text-sm text-gray-900 font-medium">Texas Hill Country</td>
              <td className="px-6 py-4 text-sm text-gray-700">$30,000-$75,000/ac</td>
              <td className="px-6 py-4 text-sm text-gray-700">$100,000-$175,000/ac</td>
              <td className="px-6 py-4 text-sm text-gray-700">Rapidly Appreciating</td>
            </tr>
            <tr>
              <td className="px-6 py-4 text-sm text-gray-900 font-medium">Arizona Verde Valley</td>
              <td className="px-6 py-4 text-sm text-gray-700">$30,000-$60,000/ac</td>
              <td className="px-6 py-4 text-sm text-gray-700">$80,000+/ac</td>
              <td className="px-6 py-4 text-sm text-gray-700">Appreciating</td>
            </tr>
            <tr>
              <td className="px-6 py-4 text-sm text-gray-900 font-medium">New York Finger Lakes</td>
              <td className="px-6 py-4 text-sm text-gray-700">$20,000-$50,000/ac</td>
              <td className="px-6 py-4 text-sm text-gray-700">$80,000-$150,000/ac</td>
              <td className="px-6 py-4 text-sm text-gray-700">Stable</td>
            </tr>
            <tr>
              <td className="px-6 py-4 text-sm text-gray-900 font-medium">New Mexico</td>
              <td className="px-6 py-4 text-sm text-gray-700">$10,000-$35,000/ac</td>
              <td className="px-6 py-4 text-sm text-gray-700">$50,000+/ac</td>
              <td className="px-6 py-4 text-sm text-gray-700">Emerging</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-6">Factors Driving Regional Price Differences</h2>

      <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Established Reputation and AVA Recognition</h3>

      <p className="text-gray-700 leading-relaxed mb-4">
        Regions with decades of proven quality and AVA designations command premium prices. Napa's 150+ year winemaking history supports its pricing, while emerging regions trade at discounts despite comparable growing conditions.
      </p>

      <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. Water Availability</h3>

      <p className="text-gray-700 leading-relaxed mb-4">
        Secure, abundant water rights can add $50,000-$150,000/acre to land values in arid regions. California's water scarcity and regulatory complexity particularly impact Central Coast and Central Valley pricing.
      </p>

      <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. Development Status</h3>

      <p className="text-gray-700 leading-relaxed mb-4">
        Planted, producing vineyards typically command 2-3× the price of raw land due to eliminated setup costs and proven production history. Buyers pay premiums to avoid 3-5 year cash flow delays.
      </p>

      <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4. Proximity to Population Centers</h3>

      <p className="text-gray-700 leading-relaxed mb-4">
        Vineyard land near major metros (Napa-San Francisco, Sonoma-San Francisco, Finger Lakes-NYC) benefits from wine tourism potential and recreational property demand, inflating prices beyond pure agricultural economics.
      </p>

      <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">5. Climate Suitability</h3>

      <p className="text-gray-700 leading-relaxed mb-4">
        Regions with ideal viticultural climates (moderate temperatures, adequate rainfall, low frost risk) command premiums. Marginal climates requiring intensive management trade at discounts.
      </p>

      <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-6">Investment Implications</h2>

      <div className="bg-teal-50 border-l-4 border-teal-600 p-6 my-8 rounded-r-lg">
        <p className="text-teal-900 font-semibold mb-2">💡 Strategic Guidance</p>
        <p className="text-teal-800 mb-4">
          For new vineyard owners, emerging regions (Washington, Oregon, Texas, New Mexico) offer compelling risk-adjusted returns compared to California's premium regions. While California land appreciates steadily, the entry cost creates significant hurdle rates for ROI.
        </p>
        <p className="text-teal-800">
          Consider: $30,000/acre in Texas Hill Country vs. $200,000/acre in Napa. Even if Napa grapes fetch 3× Texas prices, the 7× lower capital requirement in Texas accelerates payback and reduces financial risk.
        </p>
      </div>

      <p className="text-gray-700 leading-relaxed">
        The 2025 vineyard land market reflects a bifurcated reality: established California regions remain expensive but stable, while emerging regions offer opportunity at accessible price points with meaningful appreciation potential. Your region selection should align with your capital availability, risk tolerance, and long-term business model—whether focused on land appreciation, grape sales, or estate wine production.
      </p>
    </>
  ),
};

// Helper function to get blog post by slug
export function getBlogPost(slug) {
  const post = blogPosts.find(p => p.slug === slug);
  if (!post) return null;

  return {
    ...post,
    content: blogContent[slug]
  };
}
