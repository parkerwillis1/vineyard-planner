// Documentation navigation structure with descriptions for search
export const docsNavigation = [
  {
    title: "Getting Started",
    items: [
      { title: "Overview", href: "/docs", description: "Introduction to Trellis documentation", keywords: "overview introduction documentation getting started home welcome" },
      { title: "Quick Start", href: "/docs/getting-started/quick-start", description: "Get started with Trellis in minutes", keywords: "quick start tutorial guide setup beginner onboarding" },
      { title: "Core Concepts", href: "/docs/getting-started/concepts", description: "Understand key concepts and terminology", keywords: "concepts terminology definitions glossary basics fundamentals" },
    ],
  },
  {
    title: "Financial Planner",
    items: [
      { title: "Overview", href: "/docs/planner", description: "Introduction to the Financial Planner tool", keywords: "planner financial vineyard planning tool beta v1.0 investment business model projections feasibility analysis ROI return design layout acres spacing variety trellis costs revenue expenses cash flow profitability" },
      { title: "Design Tab", href: "/docs/planner/design", description: "Design your vineyard layout and trellis system", keywords: "design layout trellis VSP vertical shoot positioning spacing rows acres materials wire posts anchors calculators plant density width length between plants vine cordon height gauge galvanized cable end intermediate line clips strainers brace assembly turnbuckles staples cost estimate feet linear quantity total price vineyard dimensions rectangle irregular shape map area measurement × multiply ÷ divide + add - subtract = equals ft ' feet \" inches", content: [
        "Design your vineyard layout and trellis system using VSP (Vertical Shoot Positioning) or other trellis configurations.",
        "Set row spacing (typically 6-12 feet), vine spacing (4-8 feet), and calculate total plant density per acre.",
        "The material cost calculator estimates wire, posts, anchors, and clips needed based on your vineyard dimensions.",
        "Typical VSP trellis costs range from $8,000-$15,000 per acre including all materials and labor."
      ] },
      { title: "Financial Inputs", href: "/docs/planner/financial-inputs", description: "Set costs, revenue assumptions, and expenses", keywords: "financial land cost revenue price ton bottle yield expenses operating labor equipment winery construction building utilities napa sonoma cabernet pinot chardonnay bulk grapes wholesale DTC payment financing mortgage acquisition purchase down payment interest rate term monthly acres regions AVA premium valley county central coast oregon washington willamette columbia new york finger lakes texas hill country arizona verde valley new mexico southern buildings infrastructure crush pad cellar tasting room barrel storage office lab square feet barn power water septic road sales strategy business model margin cash fast risk contracts brand control tasting slow ramp variety quality USDA grape crush reports production wholesale retail pruning canopy management pest disease control irrigation rainfall fertilization soil amendments weed harvest hauling frost protection overhead insurance taxes admin vineyard manager seasonal field winemaker staff commission tractor sprayer mower cultivator ATV UTV bins USDA FSA microloan commercial dealer promotions underestimating failures overruns contingency material trellis $ dollar percent % / per × multiply + add - subtract = equals", content: [
        "Set land costs, construction budgets, revenue assumptions, and operating expenses with industry-standard defaults.",
        "Land cost per acre varies dramatically by region: Napa Valley $100,000-$300,000/ac, Sonoma County $50,000-$150,000/ac.",
        "Emerging wine regions include Texas Hill Country $30,000-$75,000/ac, Arizona Verde Valley $30,000-$60,000/ac, New York Finger Lakes $20,000-$50,000/ac, and New Mexico Southern regions $10,000-$35,000/ac.",
        "Established vineyards command premium prices: Texas Hill Country $100,000+/ac, Arizona and New York Finger Lakes $80,000+/ac.",
        "If selling fruit to wineries, set expected price per ton by variety and quality: Napa Cabernet $3,000-$8,000/ton.",
        "For estate bottling, set wholesale and DTC retail prices: Production cost $3-$8/bottle, wholesale price 2-3× production cost.",
        "Most vineyard land purchases require 25-40% down payment with financing available through commercial loans.",
        "Annual vineyard operating expenses range from $2,750-$6,400/acre depending on region and practices.",
        "Equipment costs include tractors ($35,000-$60,000 new), sprayers ($25,000-$50,000 new), and ATVs ($12,000-$25,000)."
      ] },
      { title: "Vineyard Setup", href: "/docs/planner/vineyard-setup", description: "Year 0 investment breakdown and setup costs", keywords: "setup year 0 zero investment initial costs breakdown capital startup upfront establishment planting site preparation soil testing amendments plants vines rootstock trellis posts wire irrigation system drip lines emitters mainline pump tank installation labor contractors price total budget financing first year" },
      { title: "10-Year Plan", href: "/docs/planner/ten-year-plan", description: "View cash flow projections and financial forecasts", keywords: "10-year ten year plan cash flow projections forecast revenue profit loss ROI return investment NPV net present value IRR internal rate timeline maturity harvest income expenses operating annual yearly cumulative payback breakeven EBITDA margin profitability" },
      { title: "Details Tab", href: "/docs/planner/details", description: "Detailed vineyard and financial information", keywords: "details summary metrics totals breakdown analysis comprehensive overview vineyard parameters financial assumptions results outputs complete full specifications" },
      { title: "Financial Formulas", href: "/docs/planner/formulas", description: "Understanding the calculation methodology", keywords: "formulas calculations methodology equations math revenue cost depreciation accounting GAAP tax deductions amortization straight-line declining balance useful life assets liabilities net income COGS gross margin operating expenses interest amortization principal payment + plus - minus × multiply ÷ divide = equals % percent / per ( ) parentheses" },
      { title: "Best Practices", href: "/docs/planner/best-practices", description: "Tips for accurate vineyard planning", keywords: "best practices tips advice recommendations guidelines planning accuracy realistic conservative assumptions industry standards common mistakes avoid pitfalls success factors critical validation cross-check verify research comparable data benchmarking professional consultant review" },
    ],
  },
  {
    title: "Vineyard Operations",
    items: [
      { title: "Overview", href: "/docs/operations", description: "Introduction to Vineyard Operations tool", keywords: "operations management vineyard blocks irrigation tasks team spray records" },
      { title: "Block Management", href: "/docs/operations/blocks", description: "Create and manage vineyard blocks", keywords: "blocks fields parcels acres hectares variety cultivar clone rootstock spacing rows vines plants map location GPS coordinates latitude longitude soil type texture pH organic matter drainage elevation slope aspect exposure custom attributes notes archive delete edit create add name number designation AVA appellation region vineyard section price", content: [
        "Create and manage vineyard blocks with variety, rootstock, spacing, and planting date information.",
        "Track block-specific data including acres, GPS coordinates, soil type, and custom field attributes.",
        "View all blocks on an interactive map with color-coding by variety, vintage, or custom criteria.",
        "Archive completed or removed blocks to maintain historical records without cluttering active views."
      ] },
      { title: "Irrigation System", href: "/docs/operations/irrigation", description: "Track ET, rainfall, and irrigation events", keywords: "irrigation water watering schedule ET evapotranspiration rainfall precipitation OpenET NDVI EVI satellite imagery sentinel landsat zones management drip micro sprinkler overhead gallons liters acre-feet inches millimeters centimeters soil moisture deficit recommendations daily weekly cumulative flow rate GPM pressure emitters nozzles valves pump timer controller automation sensors weather station rain gauge date time duration amount volume applied efficiency uniformity leaching salts runoff conservation sustainability drought stress canopy temperature infrared thermal CWSI price cost", content: [
        "Track evapotranspiration (ET), rainfall, and irrigation events to optimize water usage and vine health.",
        "OpenET satellite data provides field-level ET measurements updated every 8 days with NDVI zone mapping.",
        "Record irrigation events with date, duration, flow rate, and total gallons applied per block.",
        "View cumulative water balance showing soil moisture deficit and irrigation recommendations.",
        "NDVI satellite imagery shows vegetation health zones to enable precision irrigation management."
      ] },
      { title: "Task Management", href: "/docs/operations/tasks", description: "Create and track vineyard tasks", keywords: "tasks work orders jobs activities pruning dormant summer hedging topping suckering shoot thinning leaf removal canopy management mowing weed control spraying pesticide fungicide fertilizer application harvest picking sorting crushing destemming labor crew workers assignments assign delegate status pending in-progress completed priority high medium low urgent deadline due date notes photos attachments materials equipment tractor implements tools supplies cost price hours time tracking billing payroll efficiency productivity" },
      { title: "Task Permissions & Hierarchy", href: "/docs/operations/task-permissions", description: "Understand task visibility and role-based access control", keywords: "permissions hierarchy roles RBAC access control visibility admin manager member team reports supervise owner who can see tasks assigned created private security RLS row level policy view edit delete reassign costs privileges rights scope organizational structure reporting manager-member relationship subordinates direct reports supervisor oversee oversight permissions comparison table grant revoke restrict limit filter" },
      { title: "Spray Records", href: "/docs/operations/spray", description: "Track chemical applications and compliance", keywords: "spray spraying chemical pesticide insecticide fungicide herbicide miticide bactericide application records compliance regulations REI re-entry interval PHI pre-harvest interval EPA registration label FIFRA tank mix compatibility rate dose concentration volume carrier water adjuvant surfactant spreader sticker buffer pH weather conditions wind speed direction temperature humidity inversion atmospheric stability drift nozzle type pressure boom height swath width calibration applicator license certified operator supervisor witness signature date time start finish location block field map GPS area treated gallons acres cost price inventory stock batch lot expiration MSDS SDS safety PPE protective equipment gloves mask respirator suit" },
      { title: "Team Management", href: "/docs/operations/team", description: "Manage team members and permissions", keywords: "team members users staff employees crew workers contractors roles permissions access control rights privileges admin manager supervisor foreman lead worker viewer editor owner invite add remove delete deactivate email phone contact information skills certifications licenses training qualifications hourly salary wage pay rate cost price schedule availability calendar time-off vacation sick leave" },
      { title: "Calendar View", href: "/docs/operations/calendar", description: "View tasks and events in calendar format", keywords: "calendar schedule planner timeline agenda events tasks activities appointments meetings deadlines milestones dates day week month year view filter sort color-code category recurring repeat daily weekly monthly seasonal phenology stages budbreak bloom veraison harvest dormancy frost risk growing degree days GDD" },
      { title: "Analytics Dashboard", href: "/docs/operations/analytics", description: "Track metrics and performance data", keywords: "analytics dashboard metrics KPI key performance indicators reports charts graphs tables statistics insights trends analysis data visualization export PDF Excel CSV labor productivity efficiency utilization costs expenses revenue yield quality tonnage price comparisons benchmarks historical actual vs planned variance alerts notifications thresholds targets goals objectives ROI return investment profitability margin" },
      { title: "Hardware Integration", href: "/docs/operations/hardware", description: "Connect sensors and IoT devices", keywords: "hardware sensors IoT internet things devices equipment weather station meteorological rain gauge anemometer wind temperature humidity solar radiation pyranometer barometer pressure soil moisture tension tensiometer watermark probes TDR capacitance EC salinity pH redox dendrometer sap flow stem trunk diameter fruit growth pressure bomb leaf water potential datalogger telemetry wireless cellular LoRa satellite connectivity cloud API webhook integration real-time alerts threshold notifications battery solar powered installation calibration maintenance troubleshooting firmware updates configuration settings price cost" },
    ],
  },
  {
    title: "Winery Production",
    items: [
      { title: "Overview", href: "/docs/production", description: "Introduction to Winery Production module", keywords: "production winery cellar crush fermentation aging bottling blending barrel tank vessel lot chemistry professional tier wine making red white rose sparkling" },
      { title: "IoT Sensors", href: "/docs/production/sensors", description: "Connect temperature sensors for real-time monitoring", keywords: "sensors IoT temperature monitoring fermentation tank barrel probe thermometer tilt plaato inkbird raspberry pi esp32 arduino hardware webhook API alert notification real-time live data cellar field vineyard weather soil moisture flow meter dendrometer davis vantage atmos tempest integration bluetooth wifi wireless" },
    ],
  },
  {
    title: "Resources",
    items: [
      { title: "FAQ", href: "/docs/faq", description: "Frequently asked questions", keywords: "FAQ questions answers help common issues pricing account billing features" },
      { title: "Troubleshooting", href: "/docs/troubleshooting", description: "Common issues and solutions", keywords: "troubleshooting problems errors bugs fixes solutions debugging login loading data sync" },
      { title: "Support", href: "/docs/support", description: "Get help and contact support", keywords: "support help contact email feedback bug report feature request assistance customer service" },
    ],
  },
];

// Get all searchable pages (flattened list)
export function getAllPages() {
  return docsNavigation.flatMap(section =>
    section.items.map(item => ({
      ...item,
      section: section.title
    }))
  );
}

// Breadcrumb helper
export function getBreadcrumbs(pathname) {
  const parts = pathname.split('/').filter(Boolean);
  const breadcrumbs = [{ title: 'Docs', href: '/docs' }];

  let currentPath = '';
  for (let i = 1; i < parts.length; i++) {
    currentPath += '/' + parts[i];
    const fullPath = '/docs' + currentPath;

    // Find the title from navigation
    let title = parts[i].split('-').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');

    // Try to find exact match in navigation
    for (const section of docsNavigation) {
      const item = section.items.find(item => item.href === fullPath);
      if (item) {
        title = item.title;
        break;
      }
    }

    breadcrumbs.push({ title, href: fullPath });
  }

  return breadcrumbs;
}
