// src/VineyardPlannerApp.jsx
import React, { useState, useEffect, useMemo } from "react";
import { Link } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { supabase } from './lib/supabaseClient';
import { savePlanner, loadPlanner} from './lib/saveLoadPlanner';
import { savePlan, loadPlan }    from './lib/plansApi';
import { ChevronDown } from "lucide-react";


import { Card, CardContent } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Checkbox } from "./components/ui/checkbox";
// Remove the unused Table imports
import {
  BarChart,
  Bar,
  Pie,
  PieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from "recharts";

import { useAuth } from "./auth/AuthContext";


/* ------------------------------------------------------------------ */
/*  ⚙️  TOP-OF-PAGE UI HELPERS (all inline – no extra files needed)   */
/* ------------------------------------------------------------------ */



const ProjectBanner = ({ years, setYears }) => (
    <section
      className="relative rounded-xl overflow-hidden shadow-sm mb-0 mx-4 md:mx-8
                bg-gradient-to-r from-blue-100 via-blue-50 to-white"
    >
    {/* soft radial accent */}
    <div
      className="absolute -top-10 -left-10 w-40 h-40 rounded-full opacity-10 bg-blue-400"
    />
    <div className="relative z-10 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
  {/* logo + title */}
      <div className="flex items-center gap-3">
        <img
          src="/VineSightLogo.png"          
          alt="Vineyard Planner logo"
          className="h-16 sm:h-20 w-auto drop-shadow-sm"
        />
      </div>

      {/* right‑side controls (leave empty for now) */}
      <div className="flex items-center gap-2"></div>
    </div>

  </section>
);

/* --------------------------------------------------------- */
/*  Sticky tab bar – lives directly under ProjectBanner       */
/* --------------------------------------------------------- */

const TAB_H = 56; // bar height in px (keep in sync with Tailwind padding)

const TabNav = ({
  active,
  setActive,
  projYears,
  setYears,
  totalEstCost,
  onSave,
  isSaving,
  dirty,
  lastSaved
}) => {  const tabs = [
    { id: "inputs",        label: "Financial Inputs" },
    { id: "establishment", label: "Vineyard Establishment" },
    { id: "proj",          label: `${projYears}-Year Projection` },
    { id: "details",       label: "Details" },
  ];

  return (
    <>
      <div style={{ height: TAB_H }} aria-hidden />
      <div
        className="sticky top-0 z-30 bg-white/90 backdrop-blur-md shadow-sm"
        style={{ height: TAB_H }}
      >
        <nav className="flex items-center gap-1 h-full px-2 sm:px-4 overflow-x-auto">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              className={`px-4 sm:px-6 py-3 text-sm whitespace-nowrap border-b-2 ${
                active === t.id
                  ? "font-semibold border-blue-600 text-blue-800 bg-blue-50/60"
                  : "border-transparent text-blue-600/70 hover:text-blue-800 hover:bg-blue-50/40"
              }`}
            >
              {t.label}
            </button>
          ))}

          {/* RIGHT SIDE */}
          <div className="ml-auto flex items-center gap-4 pr-2">
            <label className="flex items-center gap-1 text-xs sm:text-sm text-blue-700 font-medium">
              Projection&nbsp;Years
              <Input
                type="number"
                min={1}
                max={30}
                value={projYears}
                onChange={(e) =>
                  setYears(Math.max(1, Math.min(30, Number(e.target.value) || 1)))
                }
                className="w-16 text-center bg-white border-gray-200"
              />
            </label>

            <span className="hidden sm:flex items-center text-xs sm:text-sm text-gray-700">
              Total&nbsp;Investment
              <span className="ml-2 px-3 py-1 rounded-full bg-purple-50 text-purple-700 font-semibold">
                ${totalEstCost.toLocaleString()}
              </span>
            </span>

            <button
              onClick={onSave}
              className="px-3 py-2 text-xs sm:text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 font-medium transition disabled:opacity-50"
              disabled={isSaving}
            >
              {isSaving ? 'Saving…' : 'Save'}
            </button>

          </div>
        </nav>
      </div>
    </>
  );
};

/* ------------------------------------------------------------------ */




/* ====== MASTER DATA ====== */
const EQUIP_OPTIONS = [
  { key: "mower",      label: "PTO Mower",              price: 6500 },
  { key: "mulcher",    label: "Row Mulcher",            price: 7000 },
  { key: "leafPuller", label: "Leaf Puller",            price: 8500 },
  { key: "atv",        label: "Utility ATV",            price: 9000 },
  { key: "birdNetter", label: "Bird Netter",            price: 9500 },
  { key: "sprayer",    label: "Air-Blast Sprayer",      price: 18000 },
  { key: "hedger",     label: "Canopy Hedger",          price: 12000 },
  { key: "prePruner",  label: "Pre-Pruner",             price: 17000 },
  { key: "gator",      label: "Spray Gator",            price: 15000 },
  { key: "tractor",    label: "Compact Tractor (40 hp)",price: 30000 },
].sort((a, b) => a.price - b.price);


const DEFAULT_LOANS = [
  { label: "FSA Micro-loan",     principal: 15000, rate: 5.125, term: 7,  include: true },
  { label: "FSA Farm-Ownership", principal: 300000, rate: 5.625, term: 40, include: false },
  { label: "Bank LOC",           principal: 25000, rate: 7.5,   term: 5,  include: false },
];

const GRAPE_OPTIONS = [
  { key: "cabernet",   label: "Cabernet Sauvignon", pricePerLb: 1.50 },
  { key: "merlot",     label: "Merlot",              pricePerLb: 1.30 },
  { key: "chardonnay", label: "Chardonnay",          pricePerLb: 1.10 },
  { key: "syrah",      label: "Syrah",               pricePerLb: 1.40 },
];

const UNSOLD_CATEGORIES = ["Aging", "Non-Sold", "Free"];

const IRRIG_OPTIONS = [
  { key: "drip",      label: "Drip (3k–6k $/acre)",     defaultCost: 4500 },
  { key: "sprinkler", label: "Sprinkler (2k–5k $/acre)", defaultCost: 3500 },
  { key: "none",      label: "None",                     defaultCost: 0    },
];

const AVERAGE_YIELD_TONS_PER_ACRE = 3.5;
const BOTTLES_PER_TON = 756;

const pmt = (P, r, yrs) => {
  const m = r / 100 / 12;
  const n = yrs * 12;
  return m ? (P * m) / (1 - (1 + m) ** -n) : 0;
};

/*function useLocalStorage(key, defaultVal) {
    const [storedValue, setStoredValue] = useState(() => {
      try {
        const stored = localStorage.getItem(key);
        return stored != null ? JSON.parse(stored) : defaultVal;
      } catch {
        return defaultVal;
      }
    });

    useEffect(() => {
      try {
        localStorage.setItem(key, JSON.stringify(storedValue));
      } catch {}
    }, [key, storedValue]);

    return [storedValue, setStoredValue];
  }*/

// Section header component for consistency
const SectionHeader = ({ title }) => (
  <h2 className="text-xl font-semibold text-blue-800 mb-6 border-b pb-2">
    {title}
  </h2>
);

// Card container for each section
const SectionCard = ({ title, children, className = "" }) => (
    <Card className="rounded-xl shadow-sm bg-white overflow-hidden mb-10"> {/* Increase mb-8 to mb-10 */}
      <div className="bg-blue-50 px-6 py-4 border-b"> {/* Increase py-3 to py-4 */}
        <h3 className="font-medium text-blue-800 text-lg">{title}</h3> {/* Add text-lg */}
      </div>
      <CardContent className={`p-8 ${className}`}> {/* Increase p-6 to p-8 */}
        {children}
      </CardContent>
    </Card>
  );

/* --------------------------------------------------------- */
/*  Re‑usable collapsible card                               */
/* --------------------------------------------------------- */
function CollapsibleSection({ title, children, defaultOpen = true }) {
  const [open, setOpen] = React.useState(defaultOpen);

  return (
    <Card className="rounded-xl shadow-sm bg-white overflow-hidden mb-10">
      {/* clickable header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between bg-blue-50 px-6 py-4 border-b
                   focus:outline-none"
      >
        <h3 className="font-medium text-blue-800 text-lg">{title}</h3>

        {/* chevron */}
        <ChevronDown
          className={`h-5 w-5 text-blue-600 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* body – only rendered when open */}
      {open && <CardContent className="p-8">{children}</CardContent>}
    </Card>
  );
}

  

export default function VineyardPlannerApp() {
  const [activeTab, setActiveTab]       = useState("inputs");
  const [projYears, setProjYears]       = useState(10)
  const [dirty, setDirty] = useState(false);

  const { id: planId } = useParams();   // comes from route "/plans/:id"




  const getYieldForYear = (year) => {
    if (year <= 3) return 0;
    if (year === 4) return 1;
    if (year === 5) return 2.5;
    return AVERAGE_YIELD_TONS_PER_ACRE;
  };

  const DEFAULT_ST = useMemo(() => ({
    acres: "1",
    bottlePrice: "28",
    landPrice: "60000",
    buildPrice: "25000",
    waterCost: "400",
    insInclude: true,
    insType: "Liability + Crop",
    insCost: "4000",
    licenseCost: "100",
    salesMode:       "wine",    
    grapeSalePrice:  "1800",
    permits: [
        { include: true, key: 'federal',    label: "TTB Winery Permit",      cost: "0" },
        { include: true, key: 'state',      label: "TABC Winery Permit (G)", cost: "0" },
        { include: false,key: 'carrier',    label: "TABC Carrier’s Permit (C)", cost: "0" },
        { include: false,key: 'tasting',    label: "Tasting Room Permit",     cost: "0" },
        { include: false,key: 'winegrower', label: "Winegrower License",      cost: "0" },
        // /* if/when Farm Winery appears:
           { include: false, key: 'farm', label: "Farm Winery Permit", cost: "0" },
      ],
    availableEquity: "0",
    setupYear: "0",
    setup: {
      sitePrep:   { include: true, cost: "1500" },
      trellis:    { include: true, cost: "4300" },
      irrigation: { include: true, system: "drip", cost: "4500" },
      vines:      { include: true, cost: "3500" },
      fence:      { include: true, cost: "5000" },
    },
    prePlanting: [
        { include: true, label: "Vine removal", costPerAcre: "200" },
        { include: true, label: "Soil amendments", costPerAcre: "150" },
        // etc...
      ],
      planting: [
        { include: true, label: "Vine stock ($/each)", unitCost: "3.50", qtyPerAcre: "800" },
        { include: true, label: "Cartons & wrapping", costPerAcre: "80" },
        // …
      ],
      cultural: [
        { include: true, label: "Pruning", costPerAcre: "120" },
        { include: true, label: "Fertilizer", costPerAcre: "60" },
        // …
      ],
      harvest: [
        { include: true, label: "Machine harvest", costPerAcre: "250" },
        { include: true, label: "Hauling ($/ton)", costPerTon: "15" },
      ],
      fees: [
        { include: true, label: "Pierce’s Disease Assessment", costPerAcre: "5" },
        // …
      ],
      overheadCash: [
        { include: true, label: "Office expense", annualCost: "2000" },
        { include: true, label: "Property taxes", annualCost: "1500" },
        // …
      ],
      overheadNonCash: [
        { include: true, label: "Depreciation", annualCost: "5000" },
        // …
      ],
      equipmentOps: [
        { include: true, label: "Fuel & lube", costPerHour: "15", annualHours: "200" },
        // …
      ],
      marketing: [
        { include: true, label: "VMC fees ($/acre)", costPerAcre: "771" },
        // …
      ],
      // … advancedAnalytics state goes here …
    equipmentRows: [
      { include: false, type: "tractor", price: "30000", rate: "6.25", term: "5" },
    ],
    loans: DEFAULT_LOANS.map(l => ({
           ...l,
           principal: String(l.principal),
           rate:      String(l.rate),
           term:      String(l.term),
         })),
    unsoldBottles: [
      { include: false, category: "Aging", bottles: "0", year: "1" },
    ],
    purchases: [],
    
  }), []);


  // --- Auth context (SAFE destructure) ---
  const auth = useAuth();          // may be null if provider missing
  const user = auth?.user || null; // null until signed in

  useEffect(() => {
  if (!user) return;                  // wait for logged in
  let isCancelled = false;

  (async () => {
    const { data, error } = planId
      ? await loadPlan(planId)  
      : await loadPlanner();
    if (error) {
      console.error('Load planner error', error);
      return;
    }
    if (data && !isCancelled) {
      // MERGE: defaults  ← saved object  (saved values win if they exist)
      if (data.st) set({ ...DEFAULT_ST, ...data.st });

      if (data.projYears) setProjYears(data.projYears);

      setDirty(false);
      setLastSaved(new Date(data.savedAt || data.updated_at || Date.now()));
    }

  })();

  return () => { isCancelled = true; };
}, [user, planId, DEFAULT_ST]);   // run when user changes



  const [st, set] = useState(DEFAULT_ST);

     // --- Saving state ---
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

    async function handleManualSave() {
      if (!user) {
        alert('Sign in to save your plan.');
        return;
      }

      try {
        setSaving(true);

        /* ----------------------------------------------------
          If we’re editing a specific plan (route /app/:id)
          save that row; otherwise fall back to the personal
          “default” planner record.
        ---------------------------------------------------- */
        let error;
        if (planId) {
          ({ error } = await savePlan(planId, { st, projYears })); // ✅ row‑specific
        } else {
          ({ error } = await savePlanner({ st, projYears }));      // default profile
        }

        if (error) {
          console.error(error);
          alert('Save failed: ' + (error.message || 'Unknown error'));
        } else {
          setDirty(false);          // mark form clean
          setLastSaved(new Date()); // record timestamp
        }
      } finally {
        setSaving(false);
      }
    }
  // Mark planner state dirty when st or projYears change *after* an initial save/load baseline
  useEffect(() => {
    // If we have never saved/loaded (lastSaved is still null) don't mark dirty yet
    if (lastSaved === null) return;
    setDirty(true);
  }, [st, projYears, lastSaved]);

// ─── normalize EVERY string → number ───
const stNum = {
  // core inputs
  acres:           Number(st.acres)       || 0,
  bottlePrice:     Number(st.bottlePrice) || 0,
  grapeSalePrice:  Number(st.grapeSalePrice)  || 0,
  buildPrice:      Number(st.buildPrice)  || 0,
  landPrice:       Number(st.landPrice)   || 0,
  waterCost:       Number(st.waterCost)   || 0,
  insCost:         Number(st.insCost)     || 0,
  licenseCost:     Number(st.licenseCost) || 0,
  availableEquity: Number(st.availableEquity) || 0,
  setupYear:       Number(st.setupYear)   || 0,

  // one-time setup costs per acre
  setup: Object.fromEntries(
    Object.entries(st.setup).map(([k,v]) =>
      [ k, { include: v.include, cost: Number(v.cost) || 0, ...(v.system && { system: v.system }) } ]
    )
  ),

  // all your per-acre arrays
  prePlanting: st.prePlanting.map(r => ({
    ...r, costPerAcre: Number(r.costPerAcre) || 0
  })),
  planting: st.planting.map(r => ({
    ...r,
    unitCost:    Number(r.unitCost)    || 0,
    qtyPerAcre:  Number(r.qtyPerAcre)  || 0,
    costPerAcre: Number(r.costPerAcre) || (Number(r.unitCost)||0)*(Number(r.qtyPerAcre)||0)
  })),
  cultural: st.cultural.map(r => ({
    ...r, costPerAcre: Number(r.costPerAcre) || 0
  })),
  harvest: st.harvest.map(r => ({
    ...r,
    costPerAcre: Number(r.costPerAcre) || 0,
    costPerTon:  Number(r.costPerTon)  || 0
  })),
  fees: st.fees.map(r => ({
    ...r, costPerAcre: Number(r.costPerAcre) || 0
  })),
  overheadCash: st.overheadCash.map(r => ({
    ...r, annualCost: Number(r.annualCost) || 0
  })),
  overheadNonCash: st.overheadNonCash.map(r => ({
    ...r, annualCost: Number(r.annualCost) || 0
  })),
  equipmentOps: st.equipmentOps.map(r => ({
    ...r,
    costPerHour: Number(r.costPerHour)  || 0,
    annualHours: Number(r.annualHours)  || 0
  })),
  marketing: st.marketing.map(r => ({
    ...r, costPerAcre: Number(r.costPerAcre) || 0
  })),

  // financed rows
  equipmentRows: st.equipmentRows.map(r => ({
    ...r,
    price: Number(r.price) || 0,
    rate:  Number(r.rate)  || 0,
    term:  Number(r.term)  || 0
  })),
  loans: st.loans.map(l => ({
    ...l,
    principal: Number(l.principal) || 0,
    rate:      Number(l.rate)      || 0,
    term:      Number(l.term)      || 0,
  })),
  purchases: st.purchases.map(p => ({
    ...p,
    pounds:     Number(p.pounds)     || 0,
    pricePerLb: Number(p.pricePerLb) || 0,
  })),
  unsoldBottles: st.unsoldBottles.map(u => ({
    ...u,
    bottles: Number(u.bottles) || 0,
    year:    Number(u.year)    || 0
  })),
  

  // permits also need numeric cost
  permits: st.permits.map(p => ({
    ...p,
    cost: Number(p.cost) || 0
  }))
};

// ─── aggregate annual financing & equipment costs ───
const equipAnnual = stNum.equipmentRows.reduce(
  (sum, r) => r.include ? sum + pmt(r.price, r.rate, r.term) * 12 : sum,
  0
);
const loanAnnual = stNum.loans.reduce(
  (sum, l) => l.include ? sum + pmt(l.principal, l.rate / 100, l.term) * 12 : sum,
  0
);
const grapeAnnual = stNum.purchases.reduce(
  (sum, p) => p.include ? sum + p.pounds * p.pricePerLb : sum,
  0
);



const permitOneTime = stNum.permits
.filter(p => p.include && ['federal','state','winegrower','farm'].includes(p.key))
.reduce((sum,p) => sum + p.cost, 0);

const permitAnnual  = stNum.permits
.filter(p => p.include && ['carrier','tasting'].includes(p.key))
.reduce((sum,p) => sum + p.cost, 0);

// right after:  const totalEstCost = estData.reduce(...)
const prePlantTotal = stNum.prePlanting
.filter(r => r.include)
.reduce((sum, r) => sum + r.costPerAcre * stNum.acres, 0);

const plantingTotal = stNum.planting
.filter(r => r.include)
.reduce((sum, r) => {
  const costPerAcre = r.costPerAcre != null
    ? r.costPerAcre
    : (r.unitCost || 0) * (r.qtyPerAcre || 0);
  return sum + costPerAcre * stNum.acres;
}, 0);

// ── Year-0 Establishment Data ──
const estData = [
    { name: 'Land Purchase',    value: stNum.landPrice * stNum.acres },
    // each enabled setup item (site prep, trellis, irrigation, etc.)
    ...Object.entries(stNum.setup)
      .filter(([, o]) => o.include)
      .map(([k, o]) => ({
        name: k.charAt(0).toUpperCase() + k.slice(1),
        value: o.cost * stNum.acres,
      })),
    { name: 'License',          value: stNum.licenseCost },
    { name: 'One-time Permits', value: permitOneTime },
    { name: 'Pre-Planting',     value: prePlantTotal },
    { name: 'Planting',         value: plantingTotal },
  ];
  
  // total Year-0 cost
  const totalEstCost = estData.reduce((sum, e) => sum + e.value, 0);

  
  // ── Financing via checked-off loans ──
// grab only the loans the user has checked
const includedLoans = stNum.loans.filter(l => l.include);

// sum up just their principals
const totalLoanPrincipal = includedLoans
  .reduce((sum, l) => sum + l.principal, 0);

// sum up just their annual P&I payments
// Note: pmt() expects a decimal rate, so we divide by 100 here
//const annualDebtService = includedLoans
//  .reduce((sum, l) => sum + pmt(l.principal, l.rate / 100, l.term) * 12, 0);

// net (out-of-pocket) equity = total Year-0 cost minus total financed
const netEquityRequired = totalEstCost - totalLoanPrincipal;

  // 1) Pre-Planting (per acre) — stays the same
    const prePlantingAnnual = stNum.prePlanting
    .filter(r => r.include)
    .reduce((sum, r) => sum + r.costPerAcre * stNum.acres, 0)

    // 2) Planting (per acre)
    // if costPerAcre is undefined, fall back to unitCost * qtyPerAcre
    const plantingAnnual = stNum.planting
    .filter(r => r.include)
    .reduce((sum, r) => {
    const costPerAcre = r.costPerAcre != null
        ? r.costPerAcre
        : (r.unitCost || 0) * (r.qtyPerAcre || 0)
    return sum + costPerAcre * stNum.acres
    }, 0)

    // 3) Cultural (per acre)
    const culturalAnnual = stNum.cultural
    .filter(r => r.include)
    .reduce((sum, r) => sum + r.costPerAcre * stNum.acres, 0)

    // 4) Fees (per acre)
    const feesAnnual = stNum.fees
    .filter(r => r.include)
    .reduce((sum, r) => sum + r.costPerAcre * stNum.acres, 0)

    // 5) Harvest & Hauling
    const harvestAnnual = stNum.harvest
    .filter(r => r.include)
    .reduce((sum, r) => {
    const byAcre = (r.costPerAcre || 0) * stNum.acres
    const byTon  = (r.costPerTon   || 0) * (stNum.acres * AVERAGE_YIELD_TONS_PER_ACRE)
    return sum + byAcre + byTon
    }, 0)

    // 6) Marketing (per acre)
    const marketingAnnual = stNum.marketing
    .filter(r => r.include)
    .reduce((sum, r) => sum + r.costPerAcre * stNum.acres, 0)

  const cashOverhead     = stNum.overheadCash
    .filter(i => i.include)
    .reduce((sum, i) => sum + i.annualCost, 0);
  const nonCashOverhead  = stNum.overheadNonCash
    .filter(i => i.include)
    .reduce((sum, i) => sum + i.annualCost, 0);
  const equipmentOpsCost = stNum.equipmentOps
    .filter(i => i.include)
    .reduce((sum, i) => sum + i.costPerHour * i.annualHours, 0);

// lumped-together annual operating cost:
const dynamicOperatingCost =
  prePlantingAnnual +
  plantingAnnual +
  culturalAnnual +
  harvestAnnual +
  feesAnnual +
  equipmentOpsCost +
  cashOverhead +
  nonCashOverhead +
  marketingAnnual +
  permitAnnual;

// now only add the “other” fixed fees and debt payments:
const annualFixed =
  dynamicOperatingCost +
  stNum.waterCost * stNum.acres +
  (stNum.insInclude ? stNum.insCost : 0) +
  equipAnnual +
  loanAnnual +
  grapeAnnual +
  permitOneTime;

  const perAcreSetup = Object.values(stNum.setup).reduce(
    (sum, i) => sum + (i.include ? i.cost : 0),
    stNum.buildPrice
  );

  const setupCapital = totalEstCost;

  const KV = ({ label, value }) => (
  <div className="flex justify-between text-sm mb-1">
    <span className="font-medium">{label}</span>
    <span className="font-semibold">{value}</span>
  </div>
  );

  const fullProdRevenue =
  st.salesMode === "wine"
    ? stNum.acres * AVERAGE_YIELD_TONS_PER_ACRE * BOTTLES_PER_TON * stNum.bottlePrice
    : stNum.acres * AVERAGE_YIELD_TONS_PER_ACRE * stNum.grapeSalePrice;   // $/ton

  const fullProdNet = fullProdRevenue - annualFixed;

  const isWine         = st.salesMode === "wine";
  const costPerTon = annualFixed / (stNum.acres * AVERAGE_YIELD_TONS_PER_ACRE);
  const grapePrice = Number(stNum.grapeSalePrice || 0);
  const grossMarginTon = grapePrice - costPerTon;

  // ---- Year 0 + Operating Years Projection (with explicit Year 0 row) ----
  // Base annual (recurring) operating + fixed costs (exclude one-time establishment)
  const baseAnnualCost = annualFixed - permitOneTime; 
  // (If you intended permitOneTime only in Year 0, ensure it was not already part of annualFixed; adjust if needed.)
  console.log({
    salesMode: st.salesMode,
    grapeSalePrice: stNum.grapeSalePrice
  });
  // Build operating years 1..projYears
  let cumulative = -setupCapital;        // start with the establishment outflow
  const operatingYears = Array.from({ length: projYears }).map((_, idx) => {
    const year = idx + 1;

    const yieldPA = getYieldForYear(year);
    const tonsTotal = yieldPA * stNum.acres;
    const tonsSold        = tonsTotal;
    let bottlesProduced   = tonsTotal * BOTTLES_PER_TON;

    // Unsold (withheld) bottles flagged for this year
    const withheldBottles = stNum.unsoldBottles
      .filter(u => u.include && +u.year === year)
      .reduce((s,u) => s + (+u.bottles || 0), 0);

    let soldBottles      = Math.max(0, bottlesProduced - withheldBottles);

    // ── price entered on the form (may be blank) ──────────────────
    // 3️⃣  Revenue — branch on sales mode
    const revenue = st.salesMode === "wine"
      ? soldBottles * stNum.bottlePrice      // bottled‑wine path
      : tonsTotal   * grapePrice;            // bulk‑grape path


    // Harvest per‑ton variable portion (already counted inside dynamicOperatingCost earlier if you included costPerTon;
    // here we isolate any per‑ton you want *added*; if already included remove this block)
    const harvestPerTon = stNum.harvest
      .filter(r => r.include)
      .reduce((s,r) => s + (Number(r.costPerTon) || 0), 0);
    const harvestVariable = harvestPerTon * tonsTotal;

    // Annual cost = recurring base + harvest variable (exclude establishment)
    const cost = baseAnnualCost + harvestVariable;

    const net = revenue - cost;
    cumulative += net;

    return {
      year,
      yieldPA,
      tonsProduced : tonsTotal,
      tonsSold     : tonsSold,
      bottlesProduced: Math.round(bottlesProduced),
      withheldBottles: withheldBottles,
      soldBottles,
      revenue: Math.round(revenue),
      cost: Math.round(cost),
      net: Math.round(net),
      cumulative: Math.round(cumulative)
    };
  });

  // Year 0 row (pure establishment). revenue 0, cost = setupCapital (all one-time)
  const projection = [
    {
      year: 0,
      yieldPA: 0,
      bottlesProduced: 0,
      withheldBottles: 0,
      soldBottles: 0,
      revenue: 0,
      cost: Math.round(setupCapital + permitOneTime),
      net: -Math.round(setupCapital + permitOneTime),
      cumulative: -Math.round(setupCapital)
    },
    ...operatingYears
  ];

  // Break-even = first year >0 where cumulative >= 0
  const beIdx = projection.findIndex(p => p.year > 0 && p.cumulative >= 0);
  const breakEven = beIdx >= 0 ? projection[beIdx].year : `>${projYears}`;


  const breakdownData = [
    { name: "Operating Cost",             value: dynamicOperatingCost },
    { name: "Water Cost",                 value: stNum.waterCost * stNum.acres },
    { name: "Loan Payments (annual)",     value: loanAnnual },
    { name: "Equipment Payments (annual)",value: equipAnnual },
    { name: "Grape Purchases (annual)",   value: grapeAnnual },
    { name: "Setup Capital (one-time)",   value: setupCapital },
    { name: "Permits (one-time)",   value: permitOneTime },
    { name: "Permits (annual)",     value: permitAnnual   },    
    { name: 'Pre-Planting',    value: prePlantTotal },
    { name: 'Planting',        value: plantingTotal },
    { name: "Cultural Ops (Op. Cost)",      value: culturalAnnual },
    { name: "Harvest & Hauling (Op. Cost)", value: harvestAnnual },
    { name: "Assessments & Fees (Op. Cost)",value: feesAnnual },
    { name: "Equipment Ops (Op. Cost)",     value: equipmentOpsCost },
    { name: "Cash Overhead (Op. Cost)",     value: cashOverhead },
    { name: "Non-Cash Overhead (Op. Cost)", value: nonCashOverhead },
    { name: "Marketing (Op. Cost)",         value: marketingAnnual },
  ];

  const update = (k, v) => set({ ...st, [k]: v });
  const num = (k, step = 1) => (
    <Input
      type="number"
      step={step}
      value={st[k]}
      onChange={e => update(k, e.target.value)}
      className="bg-white shadow-sm border-gray-200"
    />
  );
  const updateEquip = (i, f, v) =>
    update(
      "equipmentRows",
      stNum.equipmentRows.map((r, j) => (j === i ? { ...r, [f]: v } : r))
    );
  const updateLoan = (i, f, v) =>
    update(
      "loans",
      stNum.loans.map((l, j) => (j === i ? { ...l, [f]: v } : l))
    );
  const updatePurchase = (i, row) =>
    update(
      "purchases",
      stNum.purchases.map((r, j) => (j === i ? row : r))
    );
  const updateUnsold = (i, f, v) =>
    update(
      "unsoldBottles",
      stNum.unsoldBottles.map((u, j) => (j === i ? { ...u, [f]: v } : u))
    );
  const updateSetup = (k, row) =>
    update("setup", { ...stNum.setup, [k]: row });

  // Component for add buttons with consistent styling
  const AddButton = ({ onClick, text }) => (
    <button
      onClick={onClick}
      className="text-sm text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md px-3 py-2 flex items-center gap-1 transition-colors mt-4 mb-2"
    >
      <span className="text-lg">+</span> {text}
    </button>
  );

// 0…projYears
const years = Array.from({ length: projYears + 1 }, (_, i) => i)

// Build a row for each cost category, where values[0] is Year 0 and values[1…] are years 1+
const costRows = [
    {
      name: 'Startup Costs',
      values: [ totalEstCost, ...Array(projYears).fill(0) ]
    },
    {
      name: 'Operating Costs',
      values: [ 0, ...Array(projYears).fill(dynamicOperatingCost) ]
    },
    {
      name: 'Water Cost',
      values: [ 0, ...Array(projYears).fill(stNum.waterCost * stNum.acres) ]
    },
    {
      name: 'Debt Service (annual)',
      values: [ 0, ...Array(projYears).fill(loanAnnual) ]
    },
    {
      name: 'Equipment Payments (annual)',
      values: [ 0, ...Array(projYears).fill(equipAnnual) ]
    },
    {
      name: 'Grape Purchases (annual)',
      values: [ 0, ...Array(projYears).fill(grapeAnnual) ]
    },
    {
      name: 'Permits (annual)',
      values: [ 0, ...Array(projYears).fill(permitAnnual) ]
    },
  ]

  const yearTotals = years.map((_, yearIndex) =>
  costRows.reduce((sum, row) => sum + row.values[yearIndex], 0)
);

// === Financing ratios ===


// 2) Net Operating Income (NOI) at full production
//const steadyRevenue = stNum.acres * AVERAGE_YIELD_TONS_PER_ACRE * BOTTLES_PER_TON * stNum.bottlePrice;
// annualFixed already includes debt service, so subtract it out to get pure operating costs
//const operatingExclDebt = annualFixed - annualDebtService;
//const NOI = steadyRevenue - operatingExclDebt;

// 3) DSCR
// const DSCR = annualDebtService > 0 ? NOI / annualDebtService : null;


// 4) Loan-to-Cost (LTC) & Loan-to-Value (LTV)
// const totalLoanPrincipal = stNum.loans
//   .filter(l => l.include)
//   .reduce((sum, l) => sum + l.principal, 0);

const totalProjectCost = totalEstCost; // = land + improvements + license
const LTC = totalProjectCost > 0 ? totalLoanPrincipal / totalProjectCost : null;

//const equityRequired = totalProjectCost - totalLoanPrincipal;
// const equityGap      = Math.max(0, equityRequired - stNum.availableEquity);

const landValue = stNum.landPrice * stNum.acres;
const improvementsValue = perAcreSetup * stNum.acres; // perAcreSetup includes building + site‐prep costs
const LTV = (landValue + improvementsValue) > 0
  ? totalLoanPrincipal / (landValue + improvementsValue)
  : null;


  // StatsCard component for consistent stat displays
  const StatsCard = ({ label, value, color = "blue" }) => (
    <div
      className={`p-5 bg-${color}-50 rounded-lg text-center shadow-sm border border-${color}-100`}
    >
      <p
        className={`text-xs text-${color}-700 uppercase mb-1 font-medium`}
      >
        {label}
      </p>
      <p className={`text-2xl font-bold text-${color}-800`}>{value}</p>
    </div>
  );

  

  const MainUI = (
    <div className="p-8 max-w-7xl mx-auto space-y-12">
      {/* INPUTS TAB */}
      {activeTab === "inputs" && (
        <div className="space-y-10">
          <SectionHeader title="Financial Planning Inputs" />

          {/* Core Inputs */}
          <CollapsibleSection title="Core Vineyard Parameters">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-8">
              <div>
                <label className="text-sm text-blue-800 font-medium block mb-2">
                  Sales Strategy
                </label>
                <select
                  className="border p-2 rounded-md bg-white w-full"
                  value={st.salesMode}
                  onChange={e => update("salesMode", e.target.value)}
                >
                  <option value="wine">Bottle • sell finished wine</option>
                  <option value="grapes">Bulk • sell all grapes</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-blue-800 font-medium block mb-2">Acres</label>
                {num("acres")}
              </div>
              {st.salesMode === "wine" && (
                <div>
                  <label className="text-sm text-blue-800 font-medium block mb-2">
                    Bottle Price ($)
                  </label>
                  {num("bottlePrice", 0.5)}
                </div>
              )}
              {/* ——— SALES STRATEGY ——— */}

              {st.salesMode === "grapes" && (
                <div>
                  <label className="text-sm text-blue-800 font-medium block mb-2">
                    Grape Sale Price ($ / ton)
                  </label>
                  {num("grapeSalePrice", 10)}
                </div>
              )}
              <div>
                <label>Operating Cost ($/yr)</label>
                    <Input
                        readOnly
                        value={dynamicOperatingCost.toFixed(0)}
                        className="bg-gray-100 text-sm"
                    />
              </div>
              <div>
                <label className="text-sm text-blue-800 font-medium block mb-2">Water Cost ($/acre-yr)</label>
                {num("waterCost", 10)}
              </div>
              <div>
                <label className="text-sm text-blue-800 font-medium block mb-2">Land Price ($/acre)</label>
                {num("landPrice", 1000)}
              </div>
              <div>
                <label className="text-sm text-blue-800 font-medium block mb-2">Build Cost ($/acre)</label>
                {num("buildPrice", 1000)}
              </div>
              <div>
                <label className="text-sm text-blue-800 font-medium block mb-2">Setup Year</label>
                {num("setupYear", 1)}
              </div>
              <div>
                <label className="text-sm text-blue-800 font-medium block mb-2">License Cost ($)</label>
                {num("licenseCost", 100)}
              </div>
              <div>
                <label className="text-sm text-blue-800 font-medium block mb-2">
                    Available Equity ($)
                </label>
                <Input
                    type="number"
                    step={1000}
                    value={stNum.availableEquity}
                    onChange={e => update("availableEquity", (e.target.value))}
                    className="bg-white shadow-sm border-gray-200"
                />
                </div>

            </div>
          </CollapsibleSection>

          {/* Setup Items */}
          <CollapsibleSection title="Vineyard Setup">
            <div className="space-y-5">
              {Object.entries(stNum.setup).map(([k, obj]) => {
                const label = k.charAt(0).toUpperCase() + k.slice(1);
                return (
                  <div key={k} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg">
                    <Checkbox 
                      checked={obj.include} 
                      onCheckedChange={v => updateSetup(k, { ...obj, include: v })}
                      className="h-5 w-5"
                    />
                    <span className="text-sm text-blue-800 font-medium capitalize w-32">{label}</span>
                    {k === "irrigation" ? (
                      <>
                        <select 
                          className="border p-2 rounded-md text-sm bg-white" 
                          value={obj.system} 
                          onChange={e => updateSetup(k, { ...obj, system: e.target.value, cost: IRRIG_OPTIONS.find(o => o.key === e.target.value).defaultCost })}
                        >
                          {IRRIG_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
                        </select>
                        <label className="text-sm text-blue-800">$/acre</label>
                        <Input 
                          className="w-28 bg-white" 
                          type="number" 
                          step="100" 
                          value={obj.cost} 
                          onChange={e => updateSetup(k, { ...obj, cost: (e.target.value) })} 
                        />
                      </>
                    ) : (
                      <>
                        <label className="text-sm text-blue-800">$/acre</label>
                        <Input 
                          className="w-28 bg-white" 
                          type="number" 
                          step="100" 
                          value={obj.cost} 
                          onChange={e => updateSetup(k, { ...obj, cost: (e.target.value) })} 
                        />
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </CollapsibleSection>

          {/* Pre-Planting / Site-Prep */}
        <CollapsibleSection title="Pre-Planting / Site-Prep">
        <div className="overflow-x-auto">
            <table className="w-full min-w-max">
            <thead>
                <tr className="bg-blue-50">
                <th className="text-left p-3 text-xs font-medium text-blue-800">Include</th>
                <th className="text-left p-3 text-xs font-medium text-blue-800">Task</th>
                <th className="text-left p-3 text-xs font-medium text-blue-800">$/acre</th>
                <th className="text-left p-3 text-xs font-medium text-blue-800">Actions</th>
                </tr>
            </thead>
            <tbody>
                {stNum.prePlanting.map((row, i) => (
                <tr key={i} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                    <Checkbox
                        checked={row.include}
                        onCheckedChange={v => {
                        const next = [...stNum.prePlanting]
                        next[i].include = v
                        update("prePlanting", next)
                        }}
                        className="h-4 w-4"
                    />
                    </td>
                    <td className="p-3">
                    <Input
                        className="w-32 bg-white text-sm"
                        value={row.label}
                        onChange={e => {
                        const next = [...stNum.prePlanting]
                        next[i].label = e.target.value
                        update("prePlanting", next)
                        }}
                    />
                    </td>
                    <td className="p-3">
                    <Input
                        type="number"
                        step="1"
                        className="w-24 bg-white text-sm"
                        value={row.costPerAcre}
                        onChange={e => {
                        const next = [...stNum.prePlanting]
                        next[i].costPerAcre = (e.target.value)
                        update("prePlanting", next)
                        }}
                    />
                    </td>
                    <td className="p-3">
                    <button
                        className="text-red-600 hover:text-red-800 p-1"
                        onClick={() =>
                        update("prePlanting", stNum.prePlanting.filter((_, j) => j !== i))
                        }
                    >
                        Remove
                    </button>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
            <AddButton
            text="Add Pre-Planting Task"
            onClick={() =>
                update("prePlanting", [
                ...stNum.prePlanting,
                { include: false, label: "", costPerAcre: 0 },
                ])
            }
            />
        </div>
        </CollapsibleSection>

        {/* Planting Costs */}
        <CollapsibleSection title="Planting Costs">
        <div className="overflow-x-auto">
            <table className="w-full min-w-max">
            <thead>
                <tr className="bg-blue-50">
                <th className="text-left p-3 text-xs font-medium text-blue-800">Include</th>
                <th className="text-left p-3 text-xs font-medium text-blue-800">Item</th>
                <th className="text-left p-3 text-xs font-medium text-blue-800">Unit Cost</th>
                <th className="text-left p-3 text-xs font-medium text-blue-800">Qty/acre</th>
                <th className="text-left p-3 text-xs font-medium text-blue-800">Cost/acre</th>
                <th className="text-left p-3 text-xs font-medium text-blue-800">Actions</th>
                </tr>
            </thead>
            <tbody>
                {stNum.planting.map((row, i) => (
                <tr key={i} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                    <Checkbox
                        checked={row.include}
                        onCheckedChange={v => {
                        const next = [...stNum.planting]
                        next[i].include = v
                        update("planting", next)
                        }}
                        className="h-4 w-4"
                    />
                    </td>
                    <td className="p-3">
                    <Input
                        className="w-32 bg-white text-sm"
                        value={row.label}
                        onChange={e => {
                        const next = [...stNum.planting]
                        next[i].label = e.target.value
                        update("planting", next)
                        }}
                    />
                    </td>
                    <td className="p-3">
                    <Input
                        type="number"
                        step="0.1"
                        className="w-24 bg-white text-sm"
                        value={row.unitCost}
                        onChange={e => {
                        const next = [...stNum.planting]
                        next[i].unitCost = (e.target.value)
                        update("planting", next)
                        }}
                    />
                    </td>
                    <td className="p-3">
                    <Input
                        type="number"
                        step="1"
                        className="w-24 bg-white text-sm"
                        value={row.qtyPerAcre}
                        onChange={e => {
                        const next = [...stNum.planting]
                        next[i].qtyPerAcre = (e.target.value)
                        update("planting", next)
                        }}
                    />
                    </td>
                    <td className="p-3">
                    <Input
                        type="number"
                        step="1"
                        className="w-24 bg-white text-sm"
                        value={row.costPerAcre}
                        onChange={e => {
                        const next = [...stNum.planting]
                        next[i].costPerAcre = (e.target.value)
                        update("planting", next)
                        }}
                    />
                    </td>
                    <td className="p-3">
                    <button
                        className="text-red-600 hover:text-red-800 p-1"
                        onClick={() =>
                        update("planting", stNum.planting.filter((_, j) => j !== i))
                        }
                    >
                        Remove
                    </button>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
            <AddButton
            text="Add Planting Item"
            onClick={() =>
                update("planting", [
                ...stNum.planting,
                { include: false, label: "", unitCost: 0, qtyPerAcre: 0, costPerAcre: 0 },
                ])
            }
            />
        </div>
        </CollapsibleSection>

        {/* Cultural Operations */}
        <CollapsibleSection title="Cultural Operations">
        <div className="overflow-x-auto">
            <table className="w-full min-w-max">
            <thead>
                <tr className="bg-blue-50">
                <th className="text-left p-3 text-xs font-medium text-blue-800">Include</th>
                <th className="text-left p-3 text-xs font-medium text-blue-800">Operation</th>
                <th className="text-left p-3 text-xs font-medium text-blue-800">$/acre</th>
                <th className="text-left p-3 text-xs font-medium text-blue-800">Actions</th>
                </tr>
            </thead>
            <tbody>
                {stNum.cultural.map((row, i) => (
                <tr key={i} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                    <Checkbox
                        checked={row.include}
                        onCheckedChange={v => {
                        const next = [...stNum.cultural]
                        next[i].include = v
                        update("cultural", next)
                        }}
                        className="h-4 w-4"
                    />
                    </td>
                    <td className="p-3">
                    <Input
                        className="w-32 bg-white text-sm"
                        value={row.label}
                        onChange={e => {
                        const next = [...stNum.cultural]
                        next[i].label = e.target.value
                        update("cultural", next)
                        }}
                    />
                    </td>
                    <td className="p-3">
                    <Input
                        type="number"
                        step="1"
                        className="w-24 bg-white text-sm"
                        value={row.costPerAcre}
                        onChange={e => {
                        const next = [...stNum.cultural]
                        next[i].costPerAcre = (e.target.value) 
                        update("cultural", next)
                        }}
                    />
                    </td>
                    <td className="p-3">
                    <button
                        className="text-red-600 hover:text-red-800 p-1"
                        onClick={() =>
                        update("cultural", stNum.cultural.filter((_, j) => j !== i))
                        }
                    >
                        Remove
                    </button>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
            <AddButton
            text="Add Cultural Operation"
            onClick={() =>
                update("cultural", [
                ...stNum.cultural,
                { include: false, label: "", costPerAcre: 0 },
                ])
            }
            />
        </div>
        </CollapsibleSection>

        {/* Harvest & Hauling */}
        <CollapsibleSection title="Harvest & Hauling">
        <div className="overflow-x-auto">
            <table className="w-full min-w-max">
            <thead>
                <tr className="bg-blue-50">
                <th className="text-left p-3 text-xs font-medium text-blue-800">Include</th>
                <th className="text-left p-3 text-xs font-medium text-blue-800">Service</th>
                <th className="text-left p-3 text-xs font-medium text-blue-800">$/acre</th>
                <th className="text-left p-3 text-xs font-medium text-blue-800">$/ton</th>
                <th className="text-left p-3 text-xs font-medium text-blue-800">Actions</th>
                </tr>
            </thead>
            <tbody>
                {stNum.harvest.map((row, i) => (
                <tr key={i} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                    <Checkbox
                        checked={row.include}
                        onCheckedChange={v => {
                        const next = [...stNum.harvest]
                        next[i].include = v
                        update("harvest", next)
                        }}
                        className="h-4 w-4"
                    />
                    </td>
                    <td className="p-3">
                    <Input
                        className="w-32 bg-white text-sm"
                        value={row.label}
                        onChange={e => {
                        const next = [...stNum.harvest]
                        next[i].label = e.target.value
                        update("harvest", next)
                        }}
                    />
                    </td>
                    <td className="p-3">
                    <Input
                        type="number"
                        step="1"
                        className="w-24 bg-white text-sm"
                        value={row.costPerAcre}
                        onChange={e => {
                        const next = [...stNum.harvest]
                        next[i].costPerAcre = (e.target.value) 
                        update("harvest", next)
                        }}
                    />
                    </td>
                    <td className="p-3">
                    <Input
                        type="number"
                        step="1"
                        className="w-24 bg-white text-sm"
                        value={row.costPerTon}
                        onChange={e => {
                        const next = [...stNum.harvest]
                        next[i].costPerTon = (e.target.value)
                        update("harvest", next)
                        }}
                    />
                    </td>
                    <td className="p-3">
                    <button
                        className="text-red-600 hover:text-red-800 p-1"
                        onClick={() =>
                        update("harvest", stNum.harvest.filter((_, j) => j !== i))
                        }
                    >
                        Remove
                    </button>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
            <AddButton
            text="Add Harvest Service"
            onClick={() =>
                update("harvest", [
                ...stNum.harvest,
                { include: false, label: "", costPerAcre: 0, costPerTon: 0 },
                ])
            }
            />
        </div>
        </CollapsibleSection>

            {/* Assessments & Fees */}
        <CollapsibleSection title="Assessments & Fees">
        <div className="overflow-x-auto">
            <table className="w-full min-w-max">
            <thead>
                <tr className="bg-blue-50">
                <th className="text-left p-3 text-xs font-medium text-blue-800">Include</th>
                <th className="text-left p-3 text-xs font-medium text-blue-800">Fee</th>
                <th className="text-left p-3 text-xs font-medium text-blue-800">$/acre</th>
                <th className="text-left p-3 text-xs font-medium text-blue-800">Actions</th>
                </tr>
            </thead>
            <tbody>
                {stNum.fees.map((row,i)=>( 
                <tr key={i} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                    <Checkbox
                        checked={row.include}
                        onCheckedChange={v=>{
                        const next=[...stNum.fees]; next[i].include=v; update("fees",next);
                        }}
                        className="h-4 w-4"
                    />
                    </td>
                    <td className="p-3">
                    <Input
                        className="w-32 bg-white text-sm"
                        value={row.label}
                        onChange={e=>{
                        const next=[...stNum.fees]; next[i].label=e.target.value; update("fees",next);
                        }}
                    />
                    </td>
                    <td className="p-3">
                    <Input
                        type="number" step="1"
                        className="w-24 bg-white text-sm"
                        value={row.costPerAcre}
                        onChange={e=>{
                        const next=[...stNum.fees]; next[i].costPerAcre=(e.target.value); update("fees",next);
                        }}
                    />
                    </td>
                    <td className="p-3">
                    <button
                        className="text-red-600 hover:text-red-800 p-1"
                        onClick={()=>update("fees",stNum.fees.filter((_,j)=>j!==i))}
                    >
                        Remove
                    </button>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
            <AddButton
            text="Add Fee"
            onClick={()=>update("fees",[...stNum.fees,{ include:false,label:"",costPerAcre:0 }])}
            />
        </div>
        </CollapsibleSection>

        {/* Cash Overhead */}
        <CollapsibleSection title="Cash Overhead">
        <div className="overflow-x-auto">
            <table className="w-full min-w-max">
            <thead>
                <tr className="bg-blue-50">
                <th className="text-left p-3 text-xs font-medium text-blue-800">Include</th>
                <th className="text-left p-3 text-xs font-medium text-blue-800">Expense</th>
                <th className="text-left p-3 text-xs font-medium text-blue-800">Annual $</th>
                <th className="text-left p-3 text-xs font-medium text-blue-800">Actions</th>
                </tr>
            </thead>
            <tbody>
                {stNum.overheadCash.map((row,i)=>( 
                <tr key={i} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                    <Checkbox
                        checked={row.include}
                        onCheckedChange={v=>{
                        const next=[...stNum.overheadCash]; next[i].include=v; update("overheadCash",next);
                        }}
                        className="h-4 w-4"
                    />
                    </td>
                    <td className="p-3">
                    <Input
                        className="w-32 bg-white text-sm"
                        value={row.label}
                        onChange={e=>{
                        const next=[...stNum.overheadCash]; next[i].label=e.target.value; update("overheadCash",next);
                        }}
                    />
                    </td>
                    <td className="p-3">
                    <Input
                        type="number" step="1"
                        className="w-24 bg-white text-sm"
                        value={row.annualCost}
                        onChange={e=>{
                        const next=[...stNum.overheadCash]; next[i].annualCost=(e.target.value); update("overheadCash",next);
                        }}
                    />
                    </td>
                    <td className="p-3">
                    <button
                        className="text-red-600 hover:text-red-800 p-1"
                        onClick={()=>update("overheadCash",stNum.overheadCash.filter((_,j)=>j!==i))}
                    >
                        Remove
                    </button>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
            <AddButton
            text="Add Cash Overhead"
            onClick={()=>update("overheadCash",[...stNum.overheadCash,{ include:false,label:"",annualCost:0 }])}
            />
        </div>
        </CollapsibleSection>

        {/* Non-Cash Overhead */}
        <CollapsibleSection title="Non-Cash Overhead">
        <div className="overflow-x-auto">
            <table className="w-full min-w-max">
            <thead>
                <tr className="bg-blue-50">
                <th className="text-left p-3 text-xs font-medium text-blue-800">Include</th>
                <th className="text-left p-3 text-xs font-medium text-blue-800">Category</th>
                <th className="text-left p-3 text-xs font-medium text-blue-800">Annual $</th>
                <th className="text-left p-3 text-xs font-medium text-blue-800">Actions</th>
                </tr>
            </thead>
            <tbody>
                {stNum.overheadNonCash.map((row,i)=>( 
                <tr key={i} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                    <Checkbox
                        checked={row.include}
                        onCheckedChange={v=>{
                        const next=[...stNum.overheadNonCash]; next[i].include=v; update("overheadNonCash",next);
                        }}
                        className="h-4 w-4"
                    />
                    </td>
                    <td className="p-3">
                    <Input
                        className="w-32 bg-white text-sm"
                        value={row.label}
                        onChange={e=>{
                        const next=[...stNum.overheadNonCash]; next[i].label=e.target.value; update("overheadNonCash",next);
                        }}
                    />
                    </td>
                    <td className="p-3">
                    <Input
                        type="number" step="1"
                        className="w-24 bg-white text-sm"
                        value={row.annualCost}
                        onChange={e=>{
                        const next=[...stNum.overheadNonCash]; next[i].annualCost=(e.target.value); update("overheadNonCash",next);
                        }}
                    />
                    </td>
                    <td className="p-3">
                    <button
                        className="text-red-600 hover:text-red-800 p-1"
                        onClick={()=>update("overheadNonCash",stNum.overheadNonCash.filter((_,j)=>j!==i))}
                    >
                        Remove
                    </button>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
            <AddButton
            text="Add Non-Cash Overhead"
            onClick={()=>update("overheadNonCash",[...stNum.overheadNonCash,{ include:false,label:"",annualCost:0 }])}
            />
        </div>
        </CollapsibleSection>

        {/* Equipment Operating Costs */}
        <CollapsibleSection title="Equipment Operating Costs">
        <div className="overflow-x-auto">
            <table className="w-full min-w-max">
            <thead>
                <tr className="bg-blue-50">
                <th className="text-left p-3 text-xs font-medium text-blue-800">Include</th>
                <th className="text-left p-3 text-xs font-medium text-blue-800">Item</th>
                <th className="text-left p-3 text-xs font-medium text-blue-800">$/hour</th>
                <th className="text-left p-3 text-xs font-medium text-blue-800">Hours/yr</th>
                <th className="text-left p-3 text-xs font-medium text-blue-800">Actions</th>
                </tr>
            </thead>
            <tbody>
                {stNum.equipmentOps.map((row,i)=>( 
                <tr key={i} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                    <Checkbox
                        checked={row.include}
                        onCheckedChange={v=>{
                        const next=[...stNum.equipmentOps]; next[i].include=v; update("equipmentOps",next);
                        }}
                        className="h-4 w-4"
                    />
                    </td>
                    <td className="p-3">
                    <Input
                        className="w-32 bg-white text-sm"
                        value={row.label}
                        onChange={e=>{
                        const next=[...stNum.equipmentOps]; next[i].label=e.target.value; update("equipmentOps",next);
                        }}
                    />
                    </td>
                    <td className="p-3">
                    <Input
                        type="number" step="0.1"
                        className="w-24 bg-white text-sm"
                        value={row.costPerHour}
                        onChange={e=>{
                        const next=[...stNum.equipmentOps]; next[i].costPerHour=(e.target.value); update("equipmentOps",next);
                        }}
                    />
                    </td>
                    <td className="p-3">
                    <Input
                        type="number" step="1"
                        className="w-24 bg-white text-sm"
                        value={row.annualHours}
                        onChange={e=>{
                        const next=[...stNum.equipmentOps]; next[i].annualHours=(e.target.value); update("equipmentOps",next);
                        }}
                    />
                    </td>
                    <td className="p-3">
                    <button
                        className="text-red-600 hover:text-red-800 p-1"
                        onClick={()=>update("equipmentOps",stNum.equipmentOps.filter((_,j)=>j!==i))}
                    >
                        Remove
                    </button>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
            <AddButton
            text="Add Equipment Op"
            onClick={()=>update("equipmentOps",[...stNum.equipmentOps,{ include:false,label:"",costPerHour:0,annualHours:0 }])}
            />
        </div>
        </CollapsibleSection>

        {/* Marketing & Management */}
        <CollapsibleSection title="Marketing & Management">
        <div className="overflow-x-auto">
            <table className="w-full min-w-max">
            <thead>
                <tr className="bg-blue-50">
                <th className="text-left p-3 text-xs font-medium text-blue-800">Include</th>
                <th className="text-left p-3 text-xs font-medium text-blue-800">Service</th>
                <th className="text-left p-3 text-xs font-medium text-blue-800">$/acre</th>
                <th className="text-left p-3 text-xs font-medium text-blue-800">Actions</th>
                </tr>
            </thead>
            <tbody>
                {stNum.marketing.map((row,i)=>( 
                <tr key={i} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                    <Checkbox
                        checked={row.include}
                        onCheckedChange={v=>{
                        const next=[...stNum.marketing]; next[i].include=v; update("marketing",next);
                        }}
                        className="h-4 w-4"
                    />
                    </td>
                    <td className="p-3">
                    <Input
                        className="w-32 bg-white text-sm"
                        value={row.label}
                        onChange={e=>{
                        const next=[...stNum.marketing]; next[i].label=e.target.value; update("marketing",next);
                        }}
                    />
                    </td>
                    <td className="p-3">
                    <Input
                        type="number" step="1"
                        className="w-24 bg-white text-sm"
                        value={row.costPerAcre}
                        onChange={e=>{
                        const next=[...stNum.marketing]; next[i].costPerAcre=(e.target.value); update("marketing",next);
                        }}
                    />
                    </td>
                    <td className="p-3">
                    <button
                        className="text-red-600 hover:text-red-800 p-1"
                        onClick={()=>update("marketing",stNum.marketing.filter((_,j)=>j!==i))}
                    >
                        Remove
                    </button>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
            <AddButton
            text="Add Marketing Item"
            onClick={()=>update("marketing",[...stNum.marketing,{ include:false,label:"",costPerAcre:0 }])}
            />
        </div>
        </CollapsibleSection>

        <CollapsibleSection title="Permits & Licenses">
            <div className="space-y-4">
                {stNum.permits.map((p, i) => (
                <div key={p.key} className="flex items-center gap-4">
                    <Checkbox
                    checked={p.include}
                    onCheckedChange={v => {
                        const next = [...stNum.permits];
                        next[i].include = v;
                        update("permits", next);
                    }}
                    />
                    <span className="flex-1 text-sm text-blue-800">{p.label}</span>
                    <Input
                    type="number"
                    step={100}
                    value={p.cost}
                    onChange={e => {
                        const next = [...stNum.permits];
                        next[i].cost = (e.target.value);
                        update("permits", next);
                    }}
                    className="w-28 bg-white"
                    />
                </div>
                ))}
            </div>
            </CollapsibleSection>


          {/* Equipment (financed) */}
          <CollapsibleSection title="Equipment">
            <div className="overflow-x-auto">
              <table className="w-full min-w-max">
                <thead>
                  <tr className="bg-blue-50">
                    <th className="text-left p-3 text-xs font-medium text-blue-800">Include</th>
                    <th className="text-left p-3 text-xs font-medium text-blue-800">Equipment</th>
                    <th className="text-left p-3 text-xs font-medium text-blue-800">Price ($)</th>
                    <th className="text-left p-3 text-xs font-medium text-blue-800">Rate (%)</th>
                    <th className="text-left p-3 text-xs font-medium text-blue-800">Term (yrs)</th>
                    <th className="text-left p-3 text-xs font-medium text-blue-800">$/mo</th>
                    <th className="text-left p-3 text-xs font-medium text-blue-800">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {stNum.equipmentRows.map((r, i) => (
                    <tr key={i} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <Checkbox
                          checked={r.include}
                          onCheckedChange={v => updateEquip(i, "include", v)}
                          className="h-4 w-4"
                        />
                      </td>
                      <td className="p-3">
                        <select
                          className="border p-1 rounded bg-white text-sm w-full"
                          value={r.type}
                          onChange={e => {
                            const t = e.target.value;
                            updateEquip(i, "type", t);
                            updateEquip(
                              i,
                              "price",
                              EQUIP_OPTIONS.find(o => o.key === t).price
                            );
                          }}
                        >
                          {EQUIP_OPTIONS.map(o => (
                            <option key={o.key} value={o.key}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-3">
                        <Input
                          type="number"
                          className="w-24 bg-white text-sm"
                          step="100"
                          value={r.price}
                          onChange={e =>
                            updateEquip(i, "price", (e.target.value) )
                          }
                        />
                      </td>
                      <td className="p-3">
                        <Input
                          type="number"
                          className="w-16 bg-white text-sm"
                          step="0.1"
                          value={r.rate}
                          onChange={e =>
                            updateEquip(i, "rate", (e.target.value))
                          }
                        />
                      </td>
                      <td className="p-3">
                        <Input
                          type="number"
                          className="w-16 bg-white text-sm"
                          step="1"
                          value={r.term}
                          onChange={e =>
                            updateEquip(i, "term", (e.target.value) )
                          }
                        />
                      </td>
                      <td className="p-3 font-medium">
                        {r.include ? `$${pmt(r.price, r.rate, r.term).toFixed(0)}` : "$0"}
                      </td>
                      <td className="p-3">
                        <button
                          className="text-red-600 hover:text-red-800 p-1"
                          onClick={() =>
                            update("equipmentRows", stNum.equipmentRows.filter((_, j) => j !== i))
                          }
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              <AddButton
                onClick={() =>
                  update("equipmentRows", [
                    ...stNum.equipmentRows,
                    {
                      include: false,
                      type: EQUIP_OPTIONS[0].key,
                      price: EQUIP_OPTIONS[0].price,
                      rate: 6,
                      term: 5,
                    },
                  ])
                }
                text="Add Equipment"
              />
            </div>
          </CollapsibleSection>

        {/* ── Loans ── */}
        <CollapsibleSection title="Loans">
        <div className="overflow-x-auto">
            <table className="w-full min-w-max">
            <thead>
                <tr className="bg-blue-50">
                <th className="text-left p-3 text-xs font-medium text-blue-800">Include</th>
                <th className="text-left p-3 text-xs font-medium text-blue-800">Label</th>
                <th className="text-left p-3 text-xs font-medium text-blue-800">Principal ($)</th>
                <th className="text-left p-3 text-xs font-medium text-blue-800">Rate (%)</th>
                <th className="text-left p-3 text-xs font-medium text-blue-800">Term (yrs)</th>
                <th className="text-left p-3 text-xs font-medium text-blue-800">$/mo</th>
                <th className="text-left p-3 text-xs font-medium text-blue-800">Actions</th>
                </tr>
            </thead>
            <tbody>
                {stNum.loans.map((l, i) => (
                <tr key={i} className="border-b hover:bg-gray-50">
                    {/* checkbox to include/exclude */}
                    <td className="p-3">
                    <Checkbox
                        checked={l.include}
                        onCheckedChange={v => updateLoan(i, "include", v)}
                        className="h-4 w-4"
                    />
                    </td>

                    {/* label */}
                    <td className="p-3">
                    <Input
                        className="w-32 bg-white text-sm"
                        value={l.label}
                        onChange={e => updateLoan(i, "label", e.target.value)}
                    />
                    </td>

                    {/* principal */}
                    <td className="p-3">
                    <Input
                        type="number"
                        className="w-28 bg-white text-sm"
                        step="1000"
                        value={l.principal}
                        onChange={e =>
                        updateLoan(i, "principal", (e.target.value) )
                        }
                    />
                    </td>

                    {/* rate (%) — stored as percent, not decimal */}
                    <td className="p-3">
                    <Input
                        type="number"
                        className="w-16 bg-white text-sm"
                        step="0.01"
                        value={l.rate.toFixed(2)}
                        onChange={e =>
                        // user types e.g. "5.25" and we keep it as 5.25
                        updateLoan(i, "rate", (e.target.value))
                        }
                    />
                    </td>

                    {/* term */}
                    <td className="p-3">
                    <Input
                        type="number"
                        className="w-16 bg-white text-sm"
                        step="1"
                        value={l.term}
                        onChange={e =>
                        updateLoan(i, "term", (e.target.value))
                        }
                    />
                    </td>

                    {/* monthly P&I — dividing by 100 to feed pmt() a decimal */}
                    <td className="p-3 font-medium">
                    {l.include
                        ? `$${pmt(l.principal, l.rate / 100, l.term).toFixed(0)}`
                        : "$0"}
                    </td>

                    {/* remove button */}
                    <td className="p-3">
                    <button
                        className="text-red-600 hover:text-red-800 p-1"
                        onClick={() =>
                        update("loans", stNum.loans.filter((_, j) => j !== i))
                        }
                    >
                        Remove
                    </button>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>

            <AddButton
            onClick={() =>
                update("loans", [
                ...stNum.loans,
                {
                    label: "Custom Loan",
                    principal: 10000,
                    rate: 6,   // six percent
                    term: 5,
                    include: false,
                },
                ])
            }
            text="Add Loan"
            />
        </div>
        </CollapsibleSection>

          {/* Purchased Grapes */}
          <CollapsibleSection title="Purchased Grapes">
            <div className="overflow-x-auto">
              <table className="w-full min-w-max">
                <thead>
                  <tr className="bg-blue-50">
                    <th className="text-left p-3 text-xs font-medium text-blue-800">Include</th>
                    <th className="text-left p-3 text-xs font-medium text-blue-800">Variety</th>
                    <th className="text-left p-3 text-xs font-medium text-blue-800">Pounds</th>
                    <th className="text-left p-3 text-xs font-medium text-blue-800">Price/lb ($)</th>
                    <th className="text-left p-3 text-xs font-medium text-blue-800">Total ($)</th>
                    <th className="text-left p-3 text-xs font-medium text-blue-800">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {stNum.purchases.map((r, i) => (
                    <tr key={i} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <Checkbox
                          checked={r.include}
                          onCheckedChange={v => updatePurchase(i, { ...r, include: v })}
                          className="h-4 w-4"
                        />
                      </td>
                      <td className="p-3">
                        <select
                          className="border p-1 rounded bg-white text-sm w-full"
                          value={r.grape}
                          onChange={e => {
                            const g = e.target.value;
                            updatePurchase(i, {
                              ...r,
                              grape: g,
                              pricePerLb: GRAPE_OPTIONS.find(o => o.key === g).pricePerLb,
                            });
                          }}
                        >
                          {GRAPE_OPTIONS.map(o => (
                            <option key={o.key} value={o.key}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-3">
                        <Input
                          type="number"
                          className="w-24 bg-white text-sm"
                          step="1"
                          value={r.pounds}
                          onChange={e =>
                            updatePurchase(i, {
                              ...r,
                              pounds: (e.target.value, 10),
                            })
                          }
                        />
                      </td>
                      <td className="p-3 font-medium">
                        ${r.pricePerLb.toFixed(2)}
                      </td>
                      <td className="p-3 font-medium">
                        {r.include ? `$${(r.pounds * r.pricePerLb).toFixed(0)}` : "$0"}
                      </td>
                      <td className="p-3">
                        <button
                          className="text-red-600 hover:text-red-800 p-1"
                          onClick={() =>
                            update("purchases", stNum.purchases.filter((_, j) => j !== i))
                          }
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <AddButton
                onClick={() =>
                  update("purchases", [
                    ...stNum.purchases,
                    {
                      include: false,
                      grape: GRAPE_OPTIONS[0].key,
                      pounds: 0,
                      pricePerLb: GRAPE_OPTIONS[0].pricePerLb,
                    },
                  ])
                }
                text="Add Grape Purchase"
              />
            </div>
          </CollapsibleSection>

          {/* Unsold Bottles */}
          <CollapsibleSection title="Unsold Bottles">
            <div className="overflow-x-auto">
              <table className="w-full min-w-max">
                <thead>
                  <tr className="bg-blue-50">
                    <th className="text-left p-3 text-xs font-medium text-blue-800">Include</th>
                    <th className="text-left p-3 text-xs font-medium text-blue-800">Category</th>
                    <th className="text-left p-3 text-xs font-medium text-blue-800">Year</th>
                    <th className="text-left p-3 text-xs font-medium text-blue-800">Bottles</th>
                    <th className="text-left p-3 text-xs font-medium text-blue-800">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {stNum.unsoldBottles.map((u, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <Checkbox 
                          checked={u.include} 
                          onCheckedChange={v => updateUnsold(idx, "include", v)} 
                          className="h-4 w-4"
                        />
                      </td>
                      <td className="p-3">
                        <select 
                          className="border p-1 rounded bg-white text-sm" 
                          value={u.category} 
                          onChange={e => updateUnsold(idx, "category", e.target.value)}
                        >
                          {UNSOLD_CATEGORIES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </td>
                      <td className="p-3">
                        <select 
                          className="border p-1 rounded bg-white text-sm" 
                          value={u.year} 
                          onChange={e => updateUnsold(idx, "year", (e.target.value) )}
                        >
                          {Array.from({ length: projYears }, (_, i) => (
                            <option key={i+1} value={i+1}>Year {i+1}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-3">
                        <Input 
                          type="number" 
                          step="1" 
                          className="w-24 bg-white text-sm" 
                          value={u.bottles} 
                          onChange={e => updateUnsold(idx, "bottles", (e.target.value) )} 
                        />
                      </td>
                      <td className="p-3">
                        <button
                          className="text-red-600 hover:text-red-800 p-1"
                          onClick={() => update("unsoldBottles", stNum.unsoldBottles.filter((_, j) => j !== idx))}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <AddButton
                onClick={() => update("unsoldBottles", [...stNum.unsoldBottles, { include: false, category: "Aging", bottles: 0, year: 1 }])}
                text="Add Unsold Entry"
              />
            </div>
          </CollapsibleSection>
        </div>
      )}

        {/* ── Vineyard Establishment Tab ── */}
        {activeTab === "establishment" && (
        <div className="space-y-8 p-6">
            <SectionHeader title="Year 0 Establishment Costs" />

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
              <StatsCard label="Land"
                value={`$${(stNum.landPrice * stNum.acres).toLocaleString()}`} />

              <StatsCard label="Pre-Planting"
                value={`$${prePlantTotal.toLocaleString()}`} />

              <StatsCard label="Planting"
                value={`$${plantingTotal.toLocaleString()}`} />

              <StatsCard label="Setup"
                value={`$${estData
                  .filter(d =>
                    !['Land Purchase','License','One-time Permits','Pre-Planting','Planting'].includes(d.name)
                  )
                  .reduce((s,d) => s + d.value, 0)
                  .toLocaleString()}`} />

              <StatsCard label="License"
                value={`$${stNum.licenseCost.toLocaleString()}`} />

              <StatsCard label="Permits"
                value={`$${permitOneTime.toLocaleString()}`} />

              <StatsCard label="Total Cost" color="purple"
                value={`$${estData.reduce((s,d) => s + d.value, 0).toLocaleString()}`} />
            </div>

            {/* Bar + Pie Charts */}
            <SectionCard title="Cost Breakdown">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bar Chart */}
                <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={estData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={n => `$${n.toLocaleString()}`} />
                    <Tooltip formatter={(val) => [`$${val.toLocaleString()}`, 'Cost']} />
                    <Bar dataKey="value" fill="#3b82f6" />
                    </BarChart>
                </ResponsiveContainer>
                </div>

                {/* Upgraded Pie Chart */}
                <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                    {/* Shift pie left for legend on the right */}
                    <Pie
                        data={estData}
                        dataKey="value"
                        nameKey="name"
                        cx="40%"
                        cy="50%"
                        outerRadius={80}
                        label={false}
                        labelLine={false}
                    >
                        {estData.map((_, i) => (
                        <Cell
                            key={i}
                            fill={[
                            "#1F77B4", // muted blue
                            "#FF7F0E", // orange
                            "#2CA02C", // green
                            "#D62728", // red
                            "#9467BD", // purple
                            "#8C564B"  // brown
                            ][i % 6]}
                        />
                        ))}
                    </Pie>

                    <Tooltip formatter={(val) => [`$${val.toLocaleString()}`, 'Cost']} />

                    <Legend
                        layout="vertical"
                        align="right"
                        verticalAlign="middle"
                        formatter={(value, entry) => {
                        const pct = (entry.payload.value / estData.reduce((s, e) => s + e.value, 0)) * 100;
                        return `${value} ${pct.toFixed(0)}%`;
                        }}
                        wrapperStyle={{ fontSize: '0.875rem' }}
                    />
                    </PieChart>
                </ResponsiveContainer>
                </div>
            </div>
            </SectionCard>

            {/* ── Expense Details Table ── */}
            <SectionCard title="Establishment Expense Details">
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white divide-y divide-gray-200">
                <thead className="bg-blue-50">
                    <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                        Item
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-blue-800 uppercase tracking-wider">
                        Total Cost
                    </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {estData.map((entry, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {entry.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                        ${entry.value.toLocaleString()}
                        </td>
                    </tr>
                    ))}
                    {/* Grand-total row */}
                    <tr className="bg-blue-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-800">
                        Total
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-800 text-right">
                        ${estData.reduce((sum, e) => sum + e.value, 0).toLocaleString()}
                    </td>
                    </tr>
                </tbody>
                </table>
            </div>
            </SectionCard>
            {/* ── Financing & Net Equity Required ── */}
            <SectionCard title="Financing & Net Capital Required">
            <div className="space-y-4">
                {/* Loan Options Table (only included loans) */}
                <div className="overflow-x-auto">
                <table className="min-w-full bg-white divide-y divide-gray-200">
                    <thead className="bg-blue-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                        Lender
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-blue-800 uppercase tracking-wider">
                        Principal
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-blue-800 uppercase tracking-wider">
                        Rate
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-blue-800 uppercase tracking-wider">
                        Term (yrs)
                        </th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                    {includedLoans.map((loan, i) => (
                        <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {loan.label || `Loan ${i + 1}`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                            ${loan.principal.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {loan.rate.toFixed(2)}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                            {loan.term}
                        </td>
                        </tr>
                    ))}
                    <tr className="bg-blue-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-800">
                        Total Loans
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-800 text-right">
                        ${totalLoanPrincipal.toLocaleString()}
                        </td>
                        <td colSpan={2}></td>
                    </tr>
                    </tbody>
                </table>
                </div>

                {/* Net Equity Summary */}
                <div className="text-right">
                <p className="text-sm text-gray-600">
                    <span className="font-medium">Total Establishment Cost:</span>{" "}
                    ${totalEstCost.toLocaleString()}
                </p>
                <p className="text-lg font-semibold text-purple-800">
                    <span className="font-medium">Net Capital Required:</span>{" "}
                    ${netEquityRequired.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">
                    (Total cost minus all available loan financing)
                </p>
                </div>
            </div>
            </SectionCard>


        </div>
        )}

        {/* ── 10-Year Projection Tab ── */}
        {activeTab === "proj" && (
        <div className="space-y-8 p-6">
            <SectionHeader title={`${projYears}-Year Financial Projection`} />

            {/* Top‐line summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatsCard
                label="Break-Even Year"
                value={`Year ${breakEven}`}
                color="blue"
            />
            <StatsCard
                label="Total Revenue"
                value={`$${projection
                .filter(p => p.year > 0)
                .reduce((sum, p) => sum + p.revenue, 0)
                .toLocaleString()}`}
                color="green"
            />
            <StatsCard
                label="Cumulative Profit"
                value={`$${projection[projection.length - 1].cumulative.toLocaleString()}`}
                color="purple"
            />
            </div>

                  
            {/* Annual Financials Chart */}
            <SectionCard title="Annual Revenue vs Cost vs Net">
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                <BarChart data={projection} margin={{ top: 5, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                    dataKey="year"
                    label={{ value: "Year", position: "insideBottom", offset: -5 }}
                    tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                    label={{ value: "Dollars ($)", angle: -90, position: "insideLeft", offset: 10 }}
                    tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                    formatter={(val) => [`$${val.toLocaleString()}`, undefined]}
                    />
                    <Legend verticalAlign="top" height={36} />
                    <Bar dataKey="revenue" name="Revenue" fill="#4ade80" />
                    <Bar dataKey="cost"    name="Cost"    fill="#f87171" />
                    <Bar dataKey="net"     name="Net"     fill="#60a5fa" />
                </BarChart>
                </ResponsiveContainer>
            </div>
            </SectionCard>

            {/* Detailed Projection Table */}
            <SectionCard title="Year-by-Year Table">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead className="bg-blue-50">
                    <tr>
                      {(
                        st.salesMode === "wine"
                          ? [
                              "Year",
                              "Yield (t/acre)",
                              "Bottles Produced",
                              "Bottles Unsold",
                              "Bottles Sold",
                              "Revenue",
                              "Cost",
                              "Net",
                              "Cumulative",
                            ]
                          : [
                              "Year",
                              "Yield (t/acre)",
                              "Tons Produced",
                              "Tons Sold",
                              "Revenue",
                              "Cost",
                              "Net",
                              "Cumulative",
                            ]
                      ).map((h) => (
                        <th
                          key={h}
                          className="text-left p-2 text-xs font-medium text-blue-800 uppercase"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {projection.map((p) => {
                      const isWine = st.salesMode === "wine";
                      const tonsTotal = p.yieldPA * stNum.acres;          // helper for grapes view

                      return (
                        <tr
                          key={p.year}
                          className={p.year % 2 === 0 ? "bg-gray-50" : undefined}
                        >
                          {/* Year & yield */}
                          <td className="p-2">{p.year}</td>
                          <td className="p-2">
                            {p.year === 0 ? "–" : p.yieldPA.toFixed(1)}
                          </td>

                          {/* Mode‑specific production / sales columns */}
                          {isWine ? (
                            <>
                              <td className="p-2">
                                {p.bottlesProduced.toLocaleString()}
                              </td>
                              <td className="p-2">
                                {p.withheldBottles.toLocaleString()}
                              </td>
                              <td className="p-2">
                                {p.soldBottles.toLocaleString()}
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="p-2">{tonsTotal.toLocaleString()}</td>
                              {/* selling all tons ⇒ tons sold = tons produced */}
                              <td className="p-2">{tonsTotal.toLocaleString()}</td>
                            </>
                          )}

                          {/* $ columns – identical for both modes */}
                          <td className="p-2">${p.revenue.toLocaleString()}</td>
                          <td className="p-2">${p.cost.toLocaleString()}</td>
                          <td
                            className={`p-2 font-medium ${
                              p.net >= 0 ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            ${p.net.toLocaleString()}
                          </td>
                          <td
                            className={`p-2 font-medium ${
                              p.cumulative >= 0 ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            ${p.cumulative.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </SectionCard>
        </div>
        )}

      {/* ---- DETAILS TAB - ENHANCED VERSION -------------------------- */}
 
        {/* ------- render Details tab only when active ------- */}
        {activeTab === "details" && (
        <div className="space-y-8 p-6 max-w-full overflow-hidden">
            <SectionHeader title="Vineyard Financial Analysis & Breakdown" />
            
            {/* Executive Summary Card */}
            <SectionCard title="Executive Summary">
            <div className="bg-blue-50 p-6 rounded-xl mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white p-5 rounded-lg shadow-sm border border-blue-100">
                    <p className="text-xs text-blue-700 uppercase mb-1 font-medium">Break-Even Year</p>
                    <p className="text-3xl font-bold text-blue-800">Year {breakEven}</p>
                    <p className="text-sm text-gray-600 mt-2">The point when cumulative profit becomes positive</p>
                </div>
                <div className="bg-white p-5 rounded-lg shadow-sm border border-green-100">
                    <p className="text-xs text-green-700 uppercase mb-1 font-medium">Total Investment</p>
                    <p className="text-3xl font-bold text-green-800">${totalEstCost.toLocaleString()}</p>
                    <p className="text-sm text-gray-600 mt-2">Initial capital required to establish vineyard</p>
                </div>
                <div className="bg-white p-5 rounded-lg shadow-sm border border-purple-100">
                    <p className="text-xs text-purple-700 uppercase mb-1 font-medium">10-Year ROI</p>
                    <p className="text-3xl font-bold text-purple-800">
                    {projection.length > 0 
                        ? `${Math.round((projection[projection.length - 1].cumulative / totalEstCost) * 100)}%` 
                        : "0%"}
                    </p>
                    <p className="text-sm text-gray-600 mt-2">Return on investment over full period</p>
                </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-blue-800 mb-4">Financial Snapshot</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
                    <div>
                    <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">Annual Revenue (at full production)</span>
                        <span className="font-semibold text-green-700">
                          {fullProdRevenue.toLocaleString()}
                        </span>
                    </div>
                    <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">Annual Operating Costs</span>
                        <span className="font-semibold text-red-600">${annualFixed.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">Annual Net Profit (at full production)</span>
                        <span className="font-semibold text-blue-700">
                          {fullProdNet.toLocaleString()}
                        </span>
                    </div>
                    </div>
                    {/* RIGHT column – bottle OR ton view */}
                      {isWine ? (
                        /* ---------- Wine mode ---------- */
                        <div>
                          <KV label="Cost per Bottle"  value={`$${(annualFixed / (stNum.acres * AVERAGE_YIELD_TONS_PER_ACRE * BOTTLES_PER_TON)).toFixed(2)}`} />
                          <KV label="Price per Bottle" value={`$${stNum.bottlePrice.toFixed(2)}`} />
                          <KV
                            label="Gross Margin / Bottle"
                            value={`$${(stNum.bottlePrice - (annualFixed / (stNum.acres * AVERAGE_YIELD_TONS_PER_ACRE * BOTTLES_PER_TON))).toFixed(2)}
                                    (${Math.round((stNum.bottlePrice - (annualFixed / (stNum.acres * AVERAGE_YIELD_TONS_PER_ACRE * BOTTLES_PER_TON))) / stNum.bottlePrice * 100)}%)`}
                          />
                        </div>
                      ) : (
                        /* ---------- Bulk‑grape mode ---------- */
                        <div>
                          <KV label="Cost per Ton"  value={`$${costPerTon.toFixed(0)}`} />
                          <KV label="Price per Ton" value={`$${grapePrice.toLocaleString()}`} />
                          <KV
                            label="Gross Margin / Ton"
                            value={`$${grossMarginTon.toLocaleString()} (${grapePrice ? ((grossMarginTon / grapePrice) * 100).toFixed(1) : 0}%)`}
                          />
                        </div>
                      )}
                   {/* ← closes grid grid-cols‑2 */}
                </div>
                </div>
            </div>
            </SectionCard>
            
            {/* Enhanced Cost Breakdown */}
            <SectionCard title="Comprehensive Cost Analysis">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                <h3 className="text-lg font-medium text-blue-800 mb-4">Cost Distribution</h3>
                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={breakdownData}
                        layout="vertical"
                        margin={{ top: 10, right: 30, left: 160, bottom: 20 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                        type="number" 
                        label={{ value: 'Dollars ($)', position: 'insideBottom', offset: -5 }}
                        tick={{ fontSize: 12 }}
                        />
                        <YAxis 
                        type="category" 
                        dataKey="name" 
                        width={160} 
                        tick={{ fontSize: 12 }}
                        />
                        <Tooltip 
                        formatter={(value) => [`$${value.toLocaleString()}`, undefined]}
                        contentStyle={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '6px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}
                        />
                        <Bar dataKey="value" name="Amount">
                        {breakdownData.map((entry, index) => (
                            <Cell key={`cell-${index}`}>
                            {index % 2 === 0 ? 
                                <linearGradient id={`colorBar${index}`} x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.8}/>
                                <stop offset="100%" stopColor="#3b82f6" stopOpacity={1}/>
                                </linearGradient> :
                                <linearGradient id={`colorBar${index}`} x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#93c5fd" stopOpacity={0.8}/>
                                <stop offset="100%" stopColor="#60a5fa" stopOpacity={1}/>
                                </linearGradient>
                            }
                            <fillcolor fill={`url(#colorBar${index})`} />
                            </Cell>
                        ))}
                        </Bar>
                    </BarChart>
                    </ResponsiveContainer>
                </div>
                </div>
                
                <div>
                <h3 className="text-lg font-medium text-blue-800 mb-4">Cost Breakdown</h3>
                <div className="overflow-auto rounded-lg shadow">
                    <table className="min-w-full bg-white divide-y divide-gray-200">
                    <thead className="bg-blue-50">
                        <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">Category</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">Amount ($)</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">% of Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {breakdownData.map((item, index) => {
                        const totalCost = breakdownData.reduce((acc, curr) => acc + curr.value, 0);
                        const percentage = (item.value / totalCost) * 100;
                        return (
                            <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.value.toLocaleString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                <div className="flex items-center">
                                <span className="mr-2">{percentage.toFixed(1)}%</span>
                                <div className="w-24 bg-gray-200 rounded-full h-2.5">
                                    <div 
                                    className={`h-2.5 rounded-full ${index % 2 === 0 ? 'bg-blue-600' : 'bg-blue-400'}`}
                                    style={{ width: `${percentage}%` }}
                                    ></div>
                                </div>
                                </div>
                            </td>
                            </tr>
                        );
                        })}
                    </tbody>
                    </table>
                </div>
                </div>
            </div>
            </SectionCard>

            <SectionCard title="All Vineyard Costs by Year">
            <div className="overflow-x-auto">
                <table className="w-full table-auto">
                <thead className="bg-blue-50">
                    <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-blue-800">
                        Category
                    </th>
                    {years.map(y => (
                        <th
                        key={y}
                        className="px-4 py-2 text-right text-xs font-medium text-blue-800"
                        >
                        {y === 0 ? 'Year 0' : `Year ${y}`}
                        </th>
                    ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {costRows.map((row, i) => (
                    <tr
                        key={row.name}
                        className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                    >
                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                        {row.name}
                        </td>
                        {row.values.map((val, j) => (
                        <td
                            key={j}
                            className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-right"
                        >
                            ${val.toLocaleString()}
                        </td>
                        ))}
                    </tr>
                    ))}

                    {/* ── Totals Row ── */}
                    <tr className="bg-blue-50">
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-semibold text-blue-800">
                        Total
                    </td>
                    {yearTotals.map((tot, j) => (
                        <td
                        key={j}
                        className="px-4 py-2 whitespace-nowrap text-sm font-semibold text-blue-800 text-right"
                        >
                        ${tot.toLocaleString()}
                        </td>
                    ))}
                    </tr>
                </tbody>
                </table>
            </div>
            </SectionCard>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
            <StatsCard label="LTC" value={`${(LTC*100).toFixed(1)}%`} />
            <StatsCard label="LTV" value={`${(LTV*100).toFixed(1)}%`} />
            <StatsCard label="Total Loans" value={`$${totalLoanPrincipal.toLocaleString()}`} />
            <StatsCard label="Project Cost" value={`$${totalProjectCost.toLocaleString()}`} />
            <StatsCard label="Land + Impr." value={`$${(landValue + improvementsValue).toLocaleString()}`} />
            </div>
            {/* ── Terminology quick-reference ── */}
            <div className="mt-4 space-y-2 text-sm text-gray-700 leading-relaxed">
              <p>
                <span className="font-semibold text-blue-800">LTC (Loan-to-Cost):</span>
                &nbsp;Total loan principal divided by total project cost. A higher LTC means
                you’re financing a larger share of the build-out expenses.
              </p>
              <p>
                <span className="font-semibold text-blue-800">LTV (Loan-to-Value):</span>
                &nbsp;Total loan principal divided by the collateral’s appraised value
                (land + improvements). Lenders watch this ratio to be sure the asset is
                worth more than the debt secured against it.
              </p>
              <p>
                <span className="font-semibold text-blue-800">Land + Impr.</span>
                &nbsp;is the combined market value of the raw land purchase <em>plus</em>
                all permanent site improvements (buildings, trellis, irrigation, etc.).
              </p>
            </div>

            
            {/* Production Analysis */}
            <SectionCard title="Production & Revenue Analysis">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-blue-800 mb-4">Vineyard Production Timeline</h3>
                <div className="h-64 mb-4">
                    <ResponsiveContainer width="100%" height="100%">
                        {/* ── NEW BarChart that hides “bottles” in bulk‑grape mode ── */}
                      <BarChart
                        data={projection.map(p => ({
                          year:   p.year,
                          yield:  p.yieldPA,
                          // only add a “bottles” field when in wine mode
                          ...(isWine && {
                            bottles: Math.round(p.yieldPA * BOTTLES_PER_TON * stNum.acres),
                          }),
                        }))}
                        margin={{ top: 10, right: 30, left: 20, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="year"
                          label={{ value: 'Year', position: 'insideBottom', offset: -5 }}
                          tick={{ fontSize: 12 }}
                        />

                        {/* left axis – always tons/acre */}
                        <YAxis
                          yAxisId="left"
                          label={{ value: 'Tons/Acre', angle: -90, position: 'insideLeft', offset: 10 }}
                          tick={{ fontSize: 12 }}
                        />

                        {/* right axis & bars – only when selling wine */}
                        {isWine && (
                          <>
                            <YAxis
                              yAxisId="right"
                              orientation="right"
                              label={{ value: 'Bottles', angle: 90, position: 'insideRight', offset: 10 }}
                              tick={{ fontSize: 12 }}
                            />
                            <Bar
                              yAxisId="right"
                              dataKey="bottles"
                              name="Bottles Produced"
                              fill="#60a5fa"
                            />
                          </>
                        )}

                        <Tooltip
                          formatter={(v, n) =>
                            n === 'yield' ? `${v} tons/acre` : `${v.toLocaleString()} bottles`
                          }
                          contentStyle={{
                            background: 'white',
                            border: '1px solid #e2e8f0',
                            borderRadius: '6px',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                          }}
                        />
                        <Legend />

                        {/* yield bar – always visible */}
                        <Bar
                          yAxisId="left"
                          dataKey="yield"
                          name="Yield (tons/acre)"
                          fill="#4ade80"
                        />
                      </BarChart>

                    </ResponsiveContainer>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-md font-semibold text-blue-800 mb-3">Vineyard Maturation Model</h4>
                    <ul className="list-disc ml-5 text-sm text-gray-700 space-y-2">
                    <li>Years 1-3: <span className="font-medium">0 tons/acre</span> (vineyard establishment)</li>
                    <li>Year 4: <span className="font-medium">1 ton/acre</span> (first crop)</li>
                    <li>Year 5: <span className="font-medium">2.5 tons/acre</span> (developing vines)</li>
                    <li>Year 6+: <span className="font-medium">{AVERAGE_YIELD_TONS_PER_ACRE} tons/acre</span> (mature vines)</li>
                    {isWine && (
                      <li>
                        Each ton of grapes produces
                        <span className="font-medium">&nbsp;{BOTTLES_PER_TON} bottles</span>
                        of wine
                      </li>
                    )}
                    </ul>
                </div>
                </div>
                
                {/* Revenue Analysis */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-blue-800 mb-4">Revenue & Profit Analysis</h3>
                <div className="h-64 mb-4">
                    <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={projection.map(p => ({ 
                        year: p.year, 
                        revenue: p.revenue,
                        profit: p.net,
                        margin: p.revenue > 0 ? (p.net / p.revenue) * 100 : 0
                        }))}
                        margin={{ top: 10, right: 30, left: 20, bottom: 20 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                        dataKey="year" 
                        label={{ value: 'Year', position: 'insideBottom', offset: -5 }}
                        tick={{ fontSize: 12 }}
                        />
                        <YAxis 
                        yAxisId="left"
                        label={{ value: 'Dollars ($)', angle: -90, position: 'insideLeft', offset: 10 }}
                        tick={{ fontSize: 12 }}
                        />
                        <YAxis 
                        yAxisId="right"
                        orientation="right"
                        label={{ value: 'Profit Margin (%)', angle: 90, position: 'insideRight', offset: 10 }}
                        domain={[-100, 100]}
                        tick={{ fontSize: 12 }}
                        />
                        <Tooltip 
                        formatter={(value, name) => [
                            name === 'margin' ? `${value.toFixed(1)}%` : `$${value.toLocaleString()}`, 
                            name === 'margin' ? 'Profit Margin' : name === 'revenue' ? 'Revenue' : 'Profit'
                        ]}
                        contentStyle={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '6px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}
                        />
                        <Legend />
                        <Bar yAxisId="left" dataKey="revenue" name="Revenue" fill="#4ade80" />
                        <Bar yAxisId="left" dataKey="profit" name="Profit" fill="#60a5fa" />
                        <Bar yAxisId="right" dataKey="margin" name="Profit Margin %" fill="#8b5cf6" />
                    </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-md font-semibold text-blue-800 mb-3">Revenue Insights</h4>
                    <ul className="list-disc ml-5 text-sm text-gray-700 space-y-2">
                    <li>First revenue in <span className="font-medium">Year {projection.findIndex(p => p.revenue > 0) + 1}</span></li>
                    <li>First profitable year: <span className="font-medium">Year {projection.findIndex(p => p.net > 0) + 1}</span></li>
                    <li>Maximum annual revenue: <span className="font-medium">${Math.max(...projection.map(p => p.revenue)).toLocaleString()}</span></li>
                    <li>
                      Revenue at full production:&nbsp;
                      <span className="font-medium">
                        ${fullProdRevenue.toLocaleString()}
                      </span>
                    </li>
                    </ul>
                </div>
                </div>
            </div>
            </SectionCard>

            
            {/* Setup Cost Analysis */}
            <SectionCard title="Initial Investment Analysis">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                <h3 className="text-lg font-medium text-blue-800 mb-4">Setup Cost Breakdown</h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={[
                        ...Object.entries(stNum.setup)
                            .filter(([_, obj]) => obj.include)
                            .map(([k, obj]) => ({
                            name: k.charAt(0).toUpperCase() + k.slice(1),
                            value: obj.cost * stNum.acres,
                            type: 'setup'
                            })),
                        { name: 'Building', value: stNum.buildPrice * stNum.acres, type: 'setup' },
                        { name: 'Land', value: stNum.landPrice * stNum.acres, type: 'setup' },
                        { name: 'License', value: stNum.licenseCost, type: 'other' }
                        ]}
                        margin={{ top: 10, right: 30, left: 20, bottom: 20 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                        dataKey="name" 
                        label={{ value: 'Cost Component', position: 'insideBottom', offset: -5 }}
                        tick={{ fontSize: 11 }}
                        />
                        <YAxis 
                        label={{ value: 'Cost ($)', angle: -90, position: 'insideLeft', offset: 10 }}
                        tick={{ fontSize: 12 }}
                        />
                        <Tooltip 
                        formatter={(value) => [`$${value.toLocaleString()}`, 'Cost']}
                        contentStyle={{
                            background: 'white',
                            border: '1px solid #e2e8f0',
                            borderRadius: '6px',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                        }}
                        />
                        <Legend />
                        <Bar dataKey="value" name="Cost">
                        {data => (
                            <Cell fill={data.payload.type === 'setup' ? '#3b82f6' : '#8b5cf6'} />
                        )}
                        </Bar>
                    </BarChart>
                    </ResponsiveContainer>
                </div>
                </div>

                <div>
                <h3 className="text-lg font-medium text-blue-800 mb-4">Investment Details</h3>
                <div className="overflow-hidden rounded-lg shadow">
                    <table className="min-w-full bg-white divide-y divide-gray-200">
                    <thead className="bg-blue-50">
                        <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">Item</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">Cost/Acre</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">Total Cost</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">% of Setup</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {Object.entries(stNum.setup).map(([k, obj], index) => {
                        const label = k.charAt(0).toUpperCase() + k.slice(1);
                        const costPerAcre = obj.include ? obj.cost : 0;
                        const totalCost = costPerAcre * stNum.acres;
                        const percentage = (totalCost / totalEstCost) * 100;
                        return (
                            <tr key={k} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                            <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{label}</td>
                            <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">${costPerAcre.toLocaleString()}</td>
                            <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">${totalCost.toLocaleString()}</td>
                            <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">{percentage.toFixed(1)}%</td>
                            </tr>
                        );
                        })}

                        {/* Building row */}
                        <tr className="bg-gray-50">
                        <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900">Building</td>
                        <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">${stNum.buildPrice.toLocaleString()}</td>
                        <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">${(stNum.buildPrice * stNum.acres).toLocaleString()}</td>
                        <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                            {((stNum.buildPrice * stNum.acres) / totalEstCost * 100).toFixed(1)}%
                        </td>
                        </tr>

                        {/* Land row */}
                        <tr className="bg-white">
                        <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900">Land</td>
                        <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">${stNum.landPrice.toLocaleString()}</td>
                        <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">${(stNum.landPrice * stNum.acres).toLocaleString()}</td>
                        <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                            {((stNum.landPrice * stNum.acres) / totalEstCost * 100).toFixed(1)}%
                        </td>
                        </tr>  {/* ← Make sure this closing </tr> is present */}

                        {/* License row */}
                        <tr className="bg-gray-50">
                        <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900">License</td>
                        <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">–</td>
                        <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">${(stNum.licenseCost ?? 0).toLocaleString()}</td>
                        <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                            {(((stNum.licenseCost ?? 0) / totalEstCost) * 100).toFixed(1)}%
                        </td>
                        </tr>

                        {/* Total Investment row */}
                        <tr className="bg-blue-50">
                        <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-blue-800">Total Investment</td>
                        <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-blue-800">
                            ${((totalEstCost - stNum.licenseCost) / stNum.acres).toLocaleString()}
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-blue-800">
                            ${totalEstCost.toLocaleString()}
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-blue-800">100.0%</td>
                        </tr>
                    </tbody>
                    </table>
                </div>
                </div>
            </div>
            </SectionCard>

            
            {/* Profitability Analysis */}
            <SectionCard title="Profitability & Break-Even Analysis">
            <div className="bg-blue-50 p-6 rounded-xl mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white p-5 rounded-lg shadow-sm">
                    <h3 className="text-lg font-medium text-blue-800 mb-3">Break-Even Timeline</h3>
                    <p className="text-3xl font-bold text-blue-800 mb-2">Year {breakEven}</p>
                    <p className="text-sm text-gray-600">
                    This vineyard will reach break-even (cumulative positive cash flow) in Year {breakEven}.
                    {projection.length > 0 && beIdx >= 0 && (
                        <span> At this point, your cumulative profit will be ${projection[beIdx].cumulative.toLocaleString()}.</span>
                    )}
                    </p>
                </div>
                <div className="bg-white p-5 rounded-lg shadow-sm">
                    <h3 className="text-lg font-medium text-blue-800 mb-3">Investment Recovery</h3>
                    <p className="text-3xl font-bold text-green-800 mb-2">
                    {projection.length > 0 && beIdx >= 0 
                        ? `${((beIdx + 1) / projYears * 100).toFixed(0)}%` 
                        : ">100%"}
                    </p>
                    <p className="text-sm text-gray-600">
                    {projection.length > 0 && beIdx >= 0
                        ? `You'll recover your investment in ${beIdx + 1} years, which is ${((beIdx + 1) / projYears * 100).toFixed(0)}% of the ${projYears}-year projection period.`
                        : `Your investment will take more than ${projYears} years to recover.`}
                    </p>
                </div>
                <div className="bg-white p-5 rounded-lg shadow-sm">
                    <h3 className="text-lg font-medium text-blue-800 mb-3">10-Year ROI</h3>
                    <p className="text-3xl font-bold text-purple-800 mb-2">
                    {projection.length > 0 
                        ? `${Math.round((projection[projection.length - 1].cumulative / totalEstCost) * 100)}%` 
                        : "0%"}
                    </p>
                    <p className="text-sm text-gray-600">
                    Over the full {projYears}-year period, your return on investment will be
                    {projection.length > 0 
                        ? ` ${Math.round((projection[projection.length - 1].cumulative / totalEstCost) * 100)}%` 
                        : " 0%"}.
                    </p>
                </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-blue-800 mb-4">Break-Even Analysis</h3>
                <div className="h-80">
                    {/* This is the section with the error - Fixed version */}
                    <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={projection} margin={{ top: 5, right: 30, left: 20, bottom: 20 }}>
                        <defs>
                        <linearGradient id="colorPos" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#4ade80" stopOpacity={0.8}/>
                            <stop offset="100%" stopColor="#22c55e" stopOpacity={1}/>
                        </linearGradient>
                        <linearGradient id="colorNeg" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#ef4444" stopOpacity={0.8}/>
                            <stop offset="100%" stopColor="#dc2626" stopOpacity={1}/>
                        </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                        dataKey="year" 
                        label={{ value: 'Year', position: 'insideBottom', offset: -10 }}
                        tick={{ fontSize: 12 }}
                        />
                        <YAxis 
                        label={{ value: 'Cumulative Profit/Loss ($)', angle: -90, position: 'insideLeft', offset: 10 }}
                        tick={{ fontSize: 12 }}
                        />
                        <Tooltip 
                        formatter={(value) => [`$${value.toLocaleString()}`, "Cumulative Profit/Loss"]}
                        labelFormatter={(value) => `Year ${value}`}
                        contentStyle={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '6px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}
                        />
                        <Legend />
                        <Bar dataKey="cumulative" name="Cumulative Profit/Loss">
                        {projection.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.cumulative >= 0 ? 'url(#colorPos)' : 'url(#colorNeg)'} />
                        ))}
                        </Bar>
                        <ReferenceLine y={0} stroke="#000" strokeDasharray="3 3" />
                        {beIdx >= 0 && <ReferenceLine x={beIdx + 1} stroke="#8884d8" strokeDasharray="3 3" label={{ position: 'top', value: 'Break-Even', fill: '#8884d8', fontSize: 12 }} />}
                    </BarChart>
                    </ResponsiveContainer>
                </div>
                
                <div className="mt-6">
                    <h4 className="text-md font-semibold text-blue-800 mb-3">Sensitivity Analysis</h4>
                    <p className="text-sm text-gray-700 mb-4">
                    How changes in key factors affect your break-even point:
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <h5 className="font-medium text-gray-800 mb-2">Bottle Price</h5>
                        <p className="text-sm text-gray-600 mb-2">
                        If bottle price {stNum.bottlePrice < 30 ? "increases" : "decreases"} by $5:
                        </p>
                        <p className="text-sm font-medium">
                        Break-even moves to approximately Year {' '}
                        {stNum.bottlePrice < 30 
                            ? Math.max(1, beIdx > 0 ? beIdx - 1 : projYears - 1) 
                            : Math.min(projYears, beIdx + 1)}
                        </p>
                    </div>
                    
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <h5 className="font-medium text-gray-800 mb-2">Operating Costs</h5>
                        <p className="text-sm text-gray-600 mb-2">
                        If annual costs {stNum.opCost < 7000 ? "increase" : "decrease"} by 20%:
                        </p>
                        <p className="text-sm font-medium">
                        Break-even moves to approximately Year {' '}
                        {stNum.opCost < 7000 
                            ? Math.min(projYears, beIdx + 1) 
                            : Math.max(1, beIdx > 0 ? beIdx - 1 : projYears - 1)}
                        </p>
                    </div>
                    
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <h5 className="font-medium text-gray-800 mb-2">Yield</h5>
                        <p className="text-sm text-gray-600 mb-2">
                        If yield {AVERAGE_YIELD_TONS_PER_ACRE < 4 ? "increases" : "decreases"} by 0.5 tons/acre:
                        </p>
                        <p className="text-sm font-medium">
                        Break-even moves to approximately Year {' '}
                        {AVERAGE_YIELD_TONS_PER_ACRE < 4
                            ? Math.max(1, beIdx > 0 ? beIdx - 1 : projYears - 1)
                            : Math.min(projYears, beIdx + 1)}
                        </p>
                    </div>
                    </div>
                </div>
                </div>
            </div>
            </SectionCard>
            
            {/* Bottling & Packaging Analysis */}
            {isWine && (
              <SectionCard title="Bottle Economics & Price Point Analysis">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                  <h3 className="text-lg font-medium text-blue-800 mb-4">Profit Margin Analysis</h3>
                  <div className="mb-6">
                      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                      <h4 className="text-md font-semibold text-blue-800 mb-3">Cost & Pricing Breakdown per Bottle</h4>
                      
                      <div className="space-y-4">
                          <div>
                          <div className="flex justify-between text-sm mb-1">
                              <span className="font-medium">Production Cost</span>
                              <span>${(annualFixed / (stNum.acres * AVERAGE_YIELD_TONS_PER_ACRE * BOTTLES_PER_TON)).toFixed(2)}</span>
                          </div>
                          <div className="h-5 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                              className="h-5 bg-blue-600 rounded-full flex items-center justify-end pr-2 text-xs text-white font-medium"
                              style={{ 
                                  width: `${Math.min(100, (annualFixed / (stNum.acres * AVERAGE_YIELD_TONS_PER_ACRE * BOTTLES_PER_TON)) / stNum.bottlePrice * 100)}%` 
                              }}
                              >
                              {Math.round((annualFixed / (stNum.acres * AVERAGE_YIELD_TONS_PER_ACRE * BOTTLES_PER_TON)) / stNum.bottlePrice * 100)}%
                              </div>
                          </div>
                          </div>
                          
                          <div>
                          <div className="flex justify-between text-sm mb-1">
                              <span className="font-medium">Profit Margin</span>
                              <span>${(stNum.bottlePrice - (annualFixed / (stNum.acres * AVERAGE_YIELD_TONS_PER_ACRE * BOTTLES_PER_TON))).toFixed(2)}</span>
                          </div>
                          <div className="h-5 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                              className="h-5 bg-green-500 rounded-full flex items-center justify-end pr-2 text-xs text-white font-medium"
                              style={{ 
                                  width: `${Math.min(100, (stNum.bottlePrice - (annualFixed / (stNum.acres * AVERAGE_YIELD_TONS_PER_ACRE * BOTTLES_PER_TON))) / stNum.bottlePrice * 100)}%`,
                                  marginLeft: `${Math.min(100, (annualFixed / (stNum.acres * AVERAGE_YIELD_TONS_PER_ACRE * BOTTLES_PER_TON)) / stNum.bottlePrice * 100)}%`
                              }}
                              >
                              {Math.round((stNum.bottlePrice - (annualFixed / (stNum.acres * AVERAGE_YIELD_TONS_PER_ACRE * BOTTLES_PER_TON))) / stNum.bottlePrice * 100)}%
                              </div>
                          </div>
                          </div>
                      </div>
                      
                      <div className="mt-6 flex justify-between items-end">
                          <div>
                          <span className="block text-2xl font-bold text-blue-800">${stNum.bottlePrice.toFixed(2)}</span>
                          <span className="text-sm text-gray-600">Bottle Price</span>
                          </div>
                          <div className="text-right">
                          <span className="block text-2xl font-bold text-green-700">
                              {Math.round((stNum.bottlePrice - (annualFixed / (stNum.acres * AVERAGE_YIELD_TONS_PER_ACRE * BOTTLES_PER_TON))) / stNum.bottlePrice * 100)}%
                          </span>
                          <span className="text-sm text-gray-600">Profit Margin</span>
                          </div>
                      </div>
                      </div>
                  </div>
                  
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                      <h4 className="text-md font-semibold text-blue-800 mb-3">Price Point Scenario Analysis</h4>
                      <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                          <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price Point</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profit/Bottle</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Margin</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Break-Even</th>
                          </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                          {[stNum.bottlePrice - 10, stNum.bottlePrice - 5, stNum.bottlePrice, stNum.bottlePrice + 5, stNum.bottlePrice + 10].map((price, i) => {
                          if (price <= 0) return null;
                          const costPerBottle = annualFixed / (stNum.acres * AVERAGE_YIELD_TONS_PER_ACRE * BOTTLES_PER_TON);
                          const profit = price - costPerBottle;
                          const margin = (profit / price) * 100;
                          // Simple break-even estimation (approximate)
                          let estimatedBreakEven;
                          if (profit <= 0) {
                              estimatedBreakEven = ">10";
                          } else {
                              estimatedBreakEven = Math.ceil(totalEstCost / (profit * stNum.acres * AVERAGE_YIELD_TONS_PER_ACRE * BOTTLES_PER_TON));
                              if (estimatedBreakEven > projYears) {
                              estimatedBreakEven = `>${projYears}`;
                              }
                          }
                          return (
                              <tr key={i} className={price === stNum.bottlePrice ? "bg-blue-50" : ""}>
                              <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                                  ${price.toFixed(2)}
                                  {price === stNum.bottlePrice && <span className="ml-2 text-xs text-blue-600">(Current)</span>}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                  ${profit.toFixed(2)}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                  {margin.toFixed(1)}%
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                  Year {estimatedBreakEven}
                              </td>
                              </tr>
                          );
                          })}
                      </tbody>
                      </table>
                  </div>
                  </div>
                  
                  {/* Right Column */}
                  <div>
                  <h3 className="text-lg font-medium text-blue-800 mb-4">Market Strategy Recommendations</h3>
                  
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mb-6">
                      <h4 className="text-md font-semibold text-blue-800 mb-3">Optimal Price Point Analysis</h4>
                      <div className="h-64 mb-4">
                      <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                          data={
                              Array.from({ length: 7 }, (_, i) => {
                              const price = stNum.bottlePrice - 15 + (i * 5);
                              if (price <= 0) return null;
                              const costPerBottle = annualFixed / (stNum.acres * AVERAGE_YIELD_TONS_PER_ACRE * BOTTLES_PER_TON);
                              const profit = price - costPerBottle;
                              const yearlyProfit = profit * stNum.acres * AVERAGE_YIELD_TONS_PER_ACRE * BOTTLES_PER_TON;
                              const margin = (profit / price) * 100;
                              return {
                                  price: price,
                                  profit: yearlyProfit,
                                  margin: margin
                              };
                              }).filter(Boolean)
                          }
                          margin={{ top: 10, right: 30, left: 20, bottom: 20 }}
                          >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                              dataKey="price" 
                              label={{ value: 'Bottle Price ($)', position: 'insideBottom', offset: -5 }}
                              tick={{ fontSize: 12 }}
                          />
                          <YAxis 
                              yAxisId="left"
                              label={{ value: 'Annual Profit ($)', angle: -90, position: 'insideLeft', offset: 10 }}
                              tick={{ fontSize: 12 }}
                          />
                          <YAxis 
                              yAxisId="right"
                              orientation="right"
                              label={{ value: 'Profit Margin (%)', angle: 90, position: 'insideRight', offset: 10 }}
                              tick={{ fontSize: 12 }}
                          />
                          <Tooltip 
                              formatter={(value, name, props) => [
                              name === 'profit' ? `$${value.toLocaleString()}` : `${value.toFixed(1)}%`,
                              name === 'profit' ? 'Annual Profit' : 'Profit Margin'
                              ]}
                              labelFormatter={value => `Bottle Price: $${value}`}
                              contentStyle={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '6px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}
                          />
                          <Legend />
                          <Bar yAxisId="left" dataKey="profit" name="Annual Profit" fill="#4ade80" />
                          <Bar yAxisId="right" dataKey="margin" name="Profit Margin %" fill="#60a5fa" />
                          <ReferenceLine 
                              yAxisId="left"
                              x={stNum.bottlePrice} 
                              stroke="#8b5cf6" 
                              strokeDasharray="3 3" 
                              label={{ position: 'top', value: 'Current', fill: '#8b5cf6', fontSize: 12 }} 
                          />
                          </BarChart>
                      </ResponsiveContainer>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700">
                      <p className="mb-2">
                          <span className="font-medium">Analysis:</span> This chart shows how different price points affect your annual profit and profit margin when the vineyard reaches full production.
                      </p>
                      {stNum.bottlePrice > 15 ? (
                          <p>
                          At your current price point (${stNum.bottlePrice.toFixed(2)}), you'll achieve a {Math.round((stNum.bottlePrice - (annualFixed / (stNum.acres * AVERAGE_YIELD_TONS_PER_ACRE * BOTTLES_PER_TON))) / stNum.bottlePrice * 100)}% profit margin
                          and approximately ${Math.round((stNum.bottlePrice - (annualFixed / (stNum.acres * AVERAGE_YIELD_TONS_PER_ACRE * BOTTLES_PER_TON))) * stNum.acres * AVERAGE_YIELD_TONS_PER_ACRE * BOTTLES_PER_TON).toLocaleString()} in annual profit at full production.
                          </p>
                      ) : (
                          <p className="text-red-600 font-medium">
                          Warning: Your current price point is too low to cover production costs. Consider a bottle price of at least 
                          ${Math.ceil(annualFixed / (stNum.acres * AVERAGE_YIELD_TONS_PER_ACRE * BOTTLES_PER_TON) + 5).toFixed(2)} to achieve profitability.
                          </p>
                      )}
                      </div>
                  </div>
                  
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                      <h4 className="text-md font-semibold text-blue-800 mb-3">Strategic Recommendations</h4>
                      <ul className="list-disc ml-5 text-sm text-gray-700 space-y-3">
                      <li>
                          <span className="font-medium">Optimal Price Point:</span> Based on your costs and industry averages, 
                          ${Math.max(stNum.bottlePrice, Math.ceil((annualFixed / (stNum.acres * AVERAGE_YIELD_TONS_PER_ACRE * BOTTLES_PER_TON)) * 3))}-
                          ${Math.max(stNum.bottlePrice + 10, Math.ceil((annualFixed / (stNum.acres * AVERAGE_YIELD_TONS_PER_ACRE * BOTTLES_PER_TON)) * 4))} 
                          per bottle would maximize both profit and sustainable market positioning.
                      </li>
                      <li>
                          <span className="font-medium">Direct-to-Consumer Focus:</span> Consider allocating 30-40% of production to direct-to-consumer channels to improve margins and build brand loyalty.
                      </li>
                      <li>
                          <span className="font-medium">Scaling Considerations:</span> Expanding beyond {stNum.acres} {stNum.acres === 1 ? "acre" : "acres"} would improve economies of scale, particularly for equipment utilization.
                      </li>
                      <li>
                          <span className="font-medium">Diversification Opportunity:</span> Consider adding tasting room or wine club revenue streams to improve profitability in years 4-6.
                      </li>
                      <li>
                          <span className="font-medium">Risk Mitigation:</span> Budget for minimum 10% contingency on all capital costs and consider crop insurance options.
                      </li>
                      </ul>
                  </div>
                  </div>
              </div>
              </SectionCard>
            )}
      </div>
    )}
  </div>             
);

return (
  <div className="min-h-screen bg-gray-50">
    {/* ── floating header ── */}

    <div className="flex min-h-[calc(100vh-56px)]">
      {/* ── sidebar (unchanged) ── */}
      <aside
        /* 240 px wide, 1.5 rem gap from the window edge, inner padding */
        className="w-60 mx-6 my-6 px-4 py-6 bg-white rounded-xl shadow-md
                    flex flex-col shrink-0"
      >
        <nav className="space-y-1">
          <h2 className="font-semibold text-gray-500 text-xs uppercase tracking-wider mb-3 px-4">
            Navigation
          </h2>
          <Link
            to="/"
            className="block py-2 px-4 rounded-lg text-blue-800 hover:bg-blue-50"
          >
            Dashboard
          </Link>
          <Link
            to="/docs"
            className="block py-2 px-4 rounded-lg text-blue-800 hover:bg-blue-50"
          >
            Documentation
          </Link>
          <Link
            to="/plans"
            className="block py-2 px-4 rounded-lg text-blue-800 hover:bg-blue-50"
          >
            My Plans
          </Link>
        </nav>

        {/* separator */}
        <div className="mt-6 mb-3 h-px bg-gray-200" />

        {/* show current user email if signed in */}
        {user && (
          <div className="px-2 mb-3 text-xs text-gray-600 break-all">
            <span className="uppercase tracking-wide text-gray-400 block mb-1">Signed in</span>
            <span className="font-medium text-gray-800">{user.email}</span>
          </div>
        )}

        {/* sign in / sign out logic */}
        {user ? (
          <button
            onClick={() => supabase.auth.signOut()}
            className="w-full text-left px-4 py-2 text-sm rounded-lg text-red-600 hover:bg-red-50 font-medium transition"
          >
            Sign Out
          </button>
        ) : (
          <Link
            to="/signin"
            className="block w-full px-4 py-2 text-sm rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 font-medium transition"
          >
            Sign In
          </Link>
        )}
        {/* Save planner button (only when signed in) */}
        {user && (
          <div className="mt-4">
            <button
              onClick={handleManualSave}
              disabled={saving || !dirty}
              className={`w-full px-4 py-2 text-sm rounded-lg font-medium transition
                ${saving
                  ? 'bg-blue-300 text-white cursor-wait'
                  : dirty
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-200 text-gray-500 cursor-default'
                }`}
            >
              {saving ? 'Saving…' : dirty ? 'Save Changes' : 'Saved'}
            </button>

            <div className="mt-2 text-[11px] leading-tight text-gray-500 px-1">
              {lastSaved
                ? <>Last saved: {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</>
                : 'Not saved yet'}
            </div>
          </div>
        )}

      </aside>

      {/* ── main workspace ── */}
      <main className="flex-grow">
        {/* translucent project banner */}
        <ProjectBanner
          years={projYears}
          setYears={setProjYears}
        />

        {/* tab strip */}
        <TabNav
          active={activeTab}
          setActive={setActiveTab}
          projYears={projYears}
          setYears={setProjYears}
          totalEstCost={totalEstCost}
          onSave={handleManualSave}
          isSaving={saving}
          dirty={dirty}
          lastSaved={lastSaved}
        />


        {/*  everything else (MainUI / docs) stays the same */}
        {MainUI}   {/* renders MainUI for "/" and DocumentationPage for "/docs" */}
      </main>
    </div>
  </div>
);
} 