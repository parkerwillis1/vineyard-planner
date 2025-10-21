// src/VineyardPlannerApp.jsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { supabase } from '@/shared/lib/supabaseClient';
import { savePlanner, loadPlanner} from '@/shared/lib/saveLoadPlanner';
import { savePlan, loadPlan, listPlans, createPlan } from '@/shared/lib/plansApi';
import { 
  ChevronDown, 
  TrendingUp, 
  DollarSign, 
  Grape,
  MapPin,
  Tractor,
  Sprout,
  HardHat,
  FileText,
  ScrollText,
  Gem,
  Check,
  Clock,
  Calendar,
  Wrench
} from "lucide-react";
import { 
  VineyardLayoutConfig, 
  calculateVineyardLayout, 
  calculateMaterialCosts,
  VINE_SPACING_OPTIONS 
} from '@/features/planning/components/VineyardLayoutCalculator';


import { Card, CardContent } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Checkbox } from "@/shared/components/ui/checkbox";

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
  ReferenceLine,
  AreaChart,
  Area,
  LineChart,
  Line
} from "recharts";

import { useAuth } from "@/auth/AuthContext";


/* ------------------------------------------------------------------ */
/*  ⚙️  TOP-OF-PAGE UI HELPERS (all inline – no extra files needed)   */
/* ------------------------------------------------------------------ */



const ProjectBanner = ({ years, setYears }) => (
    <section
      className="relative rounded-xl overflow-hidden shadow-sm mb-0 mx-4 md:mx-8
                bg-gradient-to-r from-vine-green-100 via-vine-green-50 to-white"
    >
    {/* soft radial accent */}
    <div
      className="absolute -top-10 -left-10 w-40 h-40 rounded-full opacity-10 bg-vine-green-500"
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

const TAB_H = 50; // bar height in px (keep in sync with Tailwind padding)


const TabNav = ({
  active,
  setActive,
  projYears,
  setYears,
  totalEstCost,
  onSave,
  isSaving,
  dirty,
  lastSaved,
  currentPlanId,        
  currentPlanName,      
  onPlanChange,         
  onNewPlan,
  plans,
  stickyTopClass = "top-0",
}) => {
  const tabs = [
    { id: "design",        label: "Design" },
    { id: "inputs",        label: "Financial Inputs" },
    { id: "establishment", label: "Vineyard Setup" },
    { id: "proj",          label: `${projYears}-Year Plan` },
    { id: "details",       label: "Details" },
  ];

  return (
    <div className="sticky top-[65px] z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-[1920px] mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* LEFT: Plan Selector */}
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
              Plan
            </span>
            <select
              value={currentPlanId || ''}
              onChange={(e) => onPlanChange(e.target.value)}
              className="text-sm font-medium border border-gray-300 rounded-lg px-3 py-1.5 bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-vine-green-500 min-w-[180px] transition-colors"
            >
              <option value="">Default Plan</option>
              {plans && plans.map(plan => (
                <option key={plan.id} value={plan.id}>
                  {plan.name}
                </option>
              ))}
            </select>

            {/* NEW: always show the current plan name */}
            <span className="text-sm text-gray-600 truncate max-w-[220px]">
              {currentPlanName || 'Default Plan'}
            </span>

            <button
              onClick={onNewPlan}
              className="px-3 py-1.5 text-sm font-medium text-vine-green-600 hover:text-vine-green-700 whitespace-nowrap"
            >
              + New Plan
            </button>
          </div>

          {/* CENTER: Tabs */}
          <div className="flex items-center gap-1 mx-6 flex-1 justify-center">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setActive(t.id)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
                  active === t.id
                    ? "bg-vine-green-100 text-vine-green-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* RIGHT: Controls */}
          <div className="flex items-center gap-4 min-w-0">
            {dirty && (
              <span className="text-xs text-orange-600 font-medium whitespace-nowrap">
                • Unsaved changes
              </span>
            )}
            
            <label className="flex items-center gap-2 text-sm text-gray-700 whitespace-nowrap">
              <span className="font-medium">Years</span>
              <Input
                type="number"
                min={1}
                max={30}
                value={projYears}
                onChange={(e) =>
                  setYears(Math.max(1, Math.min(30, Number(e.target.value) || 1)))
                }
                className="w-16 text-center"
              />
            </label>

            <div className="flex items-center gap-2 text-sm whitespace-nowrap">
              <span className="font-medium text-gray-700">Total</span>
              <span className="px-3 py-1 rounded-lg bg-purple-100 text-purple-700 font-semibold">
                ${totalEstCost.toLocaleString()}
              </span>
            </div>

            <button
              onClick={onSave}
              className="px-5 py-2 text-sm rounded-lg bg-vine-green-600 text-white hover:bg-vine-green-700 font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              disabled={isSaving}
            >
              {isSaving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
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

// Payments with decimal interest (e.g., 0.06 for 6%)
// Handles 0% APR by spreading principal evenly across months.
const pmt = (P, rDecimal, yrs) => {
  const m = rDecimal / 12;
  const n = yrs * 12;
  return m ? (P * m) / (1 - (1 + m) ** -n) : (n > 0 ? P / n : 0);
};

// Section header component for consistency
const SectionHeader = ({ title }) => (
  <h1 className="text-2xl font-bold text-vine-green-700 border-b pb-3">
    {title}
  </h1>
);

// Card container for each section
const SectionCard = ({ title, children, className = "" }) => (
    <Card className="rounded-xl shadow-sm bg-white overflow-hidden mb-16"> {/* Increase mb-8 to mb-10 */}
      <div className="bg-vine-green-50 px-6 py-4 border-b"> {/* Increase py-3 to py-4 */}
        <h3 className="font-medium text-vine-green-700 text-lg">{title}</h3> {/* Add text-lg */}
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
    <Card className="rounded-xl shadow-sm bg-white overflow-hidden mb-16">
      {/* clickable header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between bg-vine-green-50 px-6 py-4 border-b
                   focus:outline-none"
      >
        <h3 className="font-medium text-black text-lg">{title}</h3>

        {/* chevron */}
        <ChevronDown
          className={`h-5 w-5 text-vine-green-500 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* body – only rendered when open */}
      {open && <CardContent className="p-8">{children}</CardContent>}
    </Card>
  );
}

  

export default function PlannerShell({ embedded = false }) {
  console.log('🟢 PlannerShell RENDER', { embedded });
  console.trace('RENDER STACK TRACE');
  const [activeTab, setActiveTab]       = useState("design");
  const [projYears, setProjYears]       = useState(10)
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedChart, setSelectedChart] = useState("revenue");
  const [establishmentView, setEstablishmentView] = useState('breakdown');
  const [taskCompletion, setTaskCompletion] = useState({});

  const [plans, setPlans] = useState([]);
  const [currentPlanName, setCurrentPlanName] = useState('');

  const navigate = useNavigate();

  const { id: planId } = useParams();   // comes from route "/plans/:id"

  const location = useLocation();
  console.log('📍 Location in PlannerShell:', location.pathname);


  // Works for /app/:id, /plans/:id, /app/planner/:id, /x/y/:id, etc.
  const replacePlanIdInUrl = React.useCallback(
    (nextId /* string | '' */) => {
      const { pathname, search, hash } = location;
      const parts = pathname.split("/").filter(Boolean); // ["app","planner","123","establishment"]

      // 1) Try to find the segment equal to the current planId from useParams()
      let idx = -1;
      if (planId) {
        idx = parts.findIndex(p => p === planId);
      }

      // 2) Fallback: if not found, assume an id is the segment after "app" or "plans"
      if (idx < 0) {
        const first = parts[0] || "";
        if ((first === "app" || first === "plans") && parts.length >= 2) {
          idx = 1;
        }
      }

      // 3) If we still couldn't find an index, append/remove at the end as a last resort
      let newParts = parts.slice();
      if (idx >= 0) {
        if (nextId) newParts[idx] = nextId;   // replace id in-place
        else        newParts.splice(idx, 1);  // remove id segment for default
      } else {
        if (nextId) newParts.push(nextId);
        // else leave as-is for default
      }

      const newPath = "/" + newParts.join("/");
      navigate(newPath + search + hash, { replace: true });
    },
    [location, navigate, planId]
  );



  // Recharts/measurement-based components sometimes mount at width=0.
  // Nudge a layout pass whenever route or tab changes.
  useEffect(() => {
    console.log('🟡 PlannerShell MOUNTED');
    // Only dispatch resize events when we're on tabs with charts
    if (['establishment', 'proj', 'details'].includes(activeTab)) {
      const id = requestAnimationFrame(() => {
        window.dispatchEvent(new Event('resize'));
      });
      return () => {
      cancelAnimationFrame(id);
    };
  }
  return () => {
    console.log('🔴 PlannerShell UNMOUNTING');
  };
}, [activeTab]);

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

    vineyardLayout: {
      spacingOption: "6x10",
      customVineSpacing: 6,
      customRowSpacing: 10,
      shape: "rectangle",
      aspectRatio: 2,
      calculatedLayout: null,
      materialCosts: null
    },

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

  const [st, set] = useState(DEFAULT_ST);

  // --- Saving state ---
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  // --- Snapshot of last loaded/saved state (used to decide "dirty")
  const baselineRef = useRef(null);


  // --- Auth context (SAFE destructure) ---
  const auth = useAuth();
  const user = auth?.user || null;

  useEffect(() => {
    if (!user) return;
    let isCancelled = false;

    (async () => {
      setLoading(true);
      const { data, error } = planId ? await loadPlan(planId) : await loadPlanner();

      if (error) {
        console.error('Load planner error', error);
        setLoading(false);
        return;
      }

      if (data && !isCancelled) {
        if (data.st) set({ ...DEFAULT_ST, ...data.st });
        if (data.projYears) setProjYears(data.projYears);
        if (data.taskCompletion) setTaskCompletion(data.taskCompletion);

        setDirty(false);
        setLastSaved(new Date(data.savedAt || data.updated_at || Date.now()));

        // ✅ baseline after loading data
        baselineRef.current = JSON.stringify({
          st: data?.st ? { ...DEFAULT_ST, ...data.st } : DEFAULT_ST,
          projYears: data?.projYears ?? 10,
          taskCompletion: data?.taskCompletion ?? {}
        });

      } else if (!isCancelled) {
        // defaults path
        setDirty(false);
        setLastSaved(new Date());

        // ✅ baseline for defaults
        baselineRef.current = JSON.stringify({
          st: DEFAULT_ST,
          projYears: 10,
          taskCompletion: {}
        });
      }

      setLoading(false);
    })();

    return () => {
      isCancelled = true;
      setLoading(false);
    };
  }, [user, planId]);


  // Load list of plans
  useEffect(() => {
    if (!user) return;
    
    (async () => {
      const { data, error } = await listPlans();
      if (!error && data) {
        setPlans(data);
        
        // Set current plan name if viewing a specific plan
        if (planId) {
          const currentPlan = data.find(p => p.id === planId);
          if (currentPlan) {
            setCurrentPlanName(currentPlan.name);
          }
        }
      }
    })();
  }, [user, planId]);

  // --- Track unsaved changes based on baseline snapshot
  //     NOTE: this must come AFTER st/lastSaved/baselineRef are declared.
  useEffect(() => {
    if (!baselineRef.current) return; // no baseline yet (still loading)
    const snapshot = JSON.stringify({ st, projYears, taskCompletion });
    setDirty(snapshot !== baselineRef.current);
  }, [st, projYears, taskCompletion, lastSaved]);

  const setWithLog = (newState) => {
    console.log('🔥 SET CALLED', new Error().stack);
    set(newState);
  };


    const handlePlanChange = async (newPlanId) => {
    console.log('🔄 handlePlanChange called:', { newPlanId, currentPlanId: planId });

    if (dirty) {
      // eslint-disable-next-line no-restricted-globals
      if (!window.confirm('You have unsaved changes. Switch plans anyway?')) {
        return;
      }
    }

    try {
      setLoading(true);
      let loadedData = null;

      if (newPlanId) {
        // Load a specific plan
        console.log('📥 Loading plan:', newPlanId);
        const { data, error } = await loadPlan(newPlanId);
        if (error) {
          console.error('❌ Failed to load plan:', error);
          alert('Failed to load plan: ' + error.message);
          setLoading(false);
          return;
        }
        loadedData = data;
      } else {
        // Load the default planner
        console.log('📥 Loading default planner');
        const { data, error } = await loadPlanner();
        if (error) {
          console.error('❌ Failed to load default planner:', error);
        }
        loadedData = data;
      }

      // Apply loaded state
      if (loadedData?.st) {
        console.log('📝 Updating st with:', Object.keys(loadedData.st));
        set({ ...DEFAULT_ST, ...loadedData.st });
      } else {
        console.log('⚠️ No st in loaded data, using defaults');
        set(DEFAULT_ST);
      }

      if (loadedData?.projYears) setProjYears(loadedData.projYears);
      else setProjYears(10);

      if (loadedData?.taskCompletion) setTaskCompletion(loadedData.taskCompletion);
      else setTaskCompletion({});

      replacePlanIdInUrl(newPlanId || "");

      // Update header name
      if (newPlanId) {
        const plan = plans.find(p => p.id === newPlanId);
        setCurrentPlanName(plan ? plan.name : '');
      } else {
        setCurrentPlanName('');
      }

      // Mark clean + set new baseline for the loaded snapshot
      setDirty(false);
      setLastSaved(new Date());
      baselineRef.current = JSON.stringify({
        st: loadedData?.st ? { ...DEFAULT_ST, ...loadedData.st } : DEFAULT_ST,
        projYears: loadedData?.projYears ?? 10,
        taskCompletion: loadedData?.taskCompletion ?? {},
      });

      setLoading(false);
      console.log('✅ Plan switch complete');

    } catch (err) {
      console.error('💥 Error switching plan:', err);
      alert('Failed to switch plan: ' + err.message);
      setLoading(false);
    }
  };


  // Navigate to a different plan
  // Create new plan
  const handleNewPlan = async () => {
    if (!user) {
      alert('Sign in to create a plan.');
      return;
    }

    // eslint-disable-next-line no-restricted-globals
    const planName = window.prompt('Enter plan name:');
    if (!planName) return;

    console.log('📝 Creating new plan:', planName);

    try {
      // Create plan with current state
      const { data, error } = await createPlan(planName, { 
        st, 
        projYears, 
        taskCompletion 
      });
      
      if (error) {
        alert('Failed to create plan: ' + error.message);
        return;
      }
      
      if (data && data.id) {
        console.log('✅ Plan created:', data.id);
        
        // Reload plans list
        const { data: plansData } = await listPlans();
        if (plansData) {
          setPlans(plansData);
        }
        
        replacePlanIdInUrl(data.id);
        
        // Update current plan name
        setCurrentPlanName(planName);
        
        // Mark as clean since we just saved
        setDirty(false);
        setLastSaved(new Date());
        
        console.log('✅ Switched to new plan');
      }
    } catch (err) {
      console.error('Error creating plan:', err);
      alert('Failed to create plan');
    }
  };

    async function handleManualSave() {
    console.log('🔵 Save button clicked');

    if (!user) {
      alert('Sign in to save your plan.');
      return;
    }

    try {
      setSaving(true);
      console.log('🔵 Starting save...', {
        planId,
        hasUser: !!user,
        stKeys: Object.keys(st),
        projYears,
        taskCompletionKeys: Object.keys(taskCompletion)
      });

      const payload = { st, projYears, taskCompletion };

      let error;
      if (planId) {
        console.log('🔵 Saving to plan:', planId);
        ({ error } = await savePlan(planId, payload));
      } else {
        console.log('🔵 Saving to default planner');
        ({ error } = await savePlanner(payload));
      }

      if (error) {
        console.error('🔴 Save error:', error);
        alert('Save failed: ' + (error.message || 'Unknown error'));
        return;
      }

      console.log('✅ Save successful!');
      // Mark clean + refresh baseline so the dot disappears
      setDirty(false);
      setLastSaved(new Date());
      baselineRef.current = JSON.stringify({ st, projYears, taskCompletion });

      // Reload the plans list so header name reflects any rename
      const { data } = await listPlans();
      if (data) {
        setPlans(data);
        if (planId) {
          const current = data.find(p => p.id === planId);
          if (current) setCurrentPlanName(current.name);
        }
      }

    } catch (err) {
      console.error('🔴 Save exception:', err);
      alert('Save failed: ' + err.message);
    } finally {
      setSaving(false);
      console.log('🔵 Save complete, saving flag cleared');
    }
  }

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
  insInclude:      !!st.insInclude,
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
  (sum, r) => r.include ? sum + pmt(r.price, (Number(r.rate)||0)/100, r.term) * 12 : sum,
  0
);
const loanAnnual = stNum.loans.reduce(
  (sum, l) => l.include ? sum + pmt(l.principal, (Number(l.rate)||0)/100, l.term) * 12 : sum,
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

  

    // 3) Cultural (per acre)
    const culturalAnnual = stNum.cultural
    .filter(r => r.include)
    .reduce((sum, r) => sum + r.costPerAcre * stNum.acres, 0)

    // 4) Fees (per acre)
    const feesAnnual = stNum.fees
    .filter(r => r.include)
    .reduce((sum, r) => sum + r.costPerAcre * stNum.acres, 0)

    // 5) Harvest & Hauling (per-acre only; per-ton calculated in projection loop)
    const harvestAnnual = stNum.harvest
    .filter(r => r.include)
    .reduce((sum, r) => {
    const byAcre = (r.costPerAcre || 0) * stNum.acres
    return sum + byAcre
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
  culturalAnnual +
  harvestAnnual +
  feesAnnual +
  equipmentOpsCost +
  cashOverhead +
  nonCashOverhead +
  marketingAnnual +
  permitAnnual;

// now only add the "other" fixed fees and debt payments:
const annualFixed =
  dynamicOperatingCost +
  stNum.waterCost * stNum.acres +
  (stNum.insInclude ? stNum.insCost : 0) +
  equipAnnual +
  loanAnnual +
  grapeAnnual;

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
  const denomTons = stNum.acres * AVERAGE_YIELD_TONS_PER_ACRE;
  const costPerTon = denomTons > 0 ? (annualFixed / denomTons) : 0;
  const grapePrice = Number(stNum.grapeSalePrice || 0);
  const grossMarginTon = grapePrice - costPerTon;

  // ---- Year 0 + Operating Years Projection (with explicit Year 0 row) ----
  // Base annual (recurring) operating + fixed costs (exclude one-time establishment)
  const baseAnnualCost = annualFixed; 
  // (If you intended permitOneTime only in Year 0, ensure it was not already part of annualFixed; adjust if needed.)
  console.log({
    salesMode: st.salesMode,
    grapeSalePrice: stNum.grapeSalePrice
  });
    // Build operating years 1..projYears
    let cumulative = -setupCapital;        // start with the establishment outflow including permits
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

  // Year 0 row (pure establishment). revenue 0, cost = totalEstCost (all one-time)
  const projection = [
    {
      year: 0,
      yieldPA: 0,
      bottlesProduced: 0,
      withheldBottles: 0,
      soldBottles: 0,
      revenue: 0,
      cost: Math.round(totalEstCost),
      net: -Math.round(totalEstCost),
      cumulative: -Math.round(totalEstCost),
    },
    ...operatingYears,
  ];

  // Break-even = first year >0 where cumulative >= 0
  const beIdx = projection.findIndex(p => p.year > 0 && p.cumulative >= 0);
  const breakEven = beIdx >= 0 ? projection[beIdx].year : `>${projYears}`;


const breakdownData = [
  { name: "Operating Cost",              value: dynamicOperatingCost }, // already includes permits/cultural/fees/etc.
  { name: "Water Cost",                  value: stNum.waterCost * stNum.acres },
  { name: "Insurance",                   value: stNum.insInclude ? stNum.insCost : 0 },
  { name: "Loan Payments (annual)",      value: loanAnnual },
  { name: "Equipment Payments (annual)", value: equipAnnual },
  { name: "Grape Purchases (annual)",    value: grapeAnnual },
  { name: "Setup Capital (one-time)",    value: totalEstCost }, // or setupCapital if you alias it
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

const handleLayoutChange = useCallback((layout, materialCosts) => {
  if (!layout || !materialCosts) return;
  
  // Use functional setState - prev gives us the current state
  set(prev => {
    // 1. Update vine quantities in planting costs
    const updatedPlanting = prev.planting.map(row => {
      if (row.label.toLowerCase().includes('vine stock')) {
        return {
          ...row,
          qtyPerAcre: Math.round(layout.vineLayout.vinesPerAcre),
          costPerAcre: (Number(row.unitCost) || 0) * Math.round(layout.vineLayout.vinesPerAcre)
        };
      }
      return row;
    });
    
    // 2. Update trellis and irrigation costs based on actual material requirements
    const acres = Number(prev.acres) || 1; // Get acres from prev state
    const updatedSetup = {
      ...prev.setup,
      trellis: {
        include: true,
        cost: Math.round(
          (materialCosts.posts + materialCosts.wire + materialCosts.hardware + materialCosts.earthAnchors) / acres),
        calculated: true,
        breakdown: {
          posts: materialCosts.posts,
          wire: materialCosts.wire, 
          hardware: materialCosts.hardware,
          earthAnchors: materialCosts.earthAnchors
        }
      },
      irrigation: {
        include: true,
        cost: Math.round(materialCosts.irrigation / acres),
        calculated: true,
        system: prev.setup.irrigation?.system || "drip"
      }
    };
    
    // 3. Return the new state object
    return {
      ...prev,
      planting: updatedPlanting,
      setup: updatedSetup,
      vineyardLayout: {
        ...prev.vineyardLayout,
        calculatedLayout: layout,
        materialCosts: materialCosts
      }
    };
  });
}, []); // Empty dependencies array - no external values needed!

// Component for add buttons with consistent styling
const AddButton = ({ onClick, text }) => (
  <button
    onClick={onClick}
    className="text-sm text-vine-green-600 bg-vine-green-50 hover:bg-vine-green-100 rounded-md px-3 py-2 flex items-center gap-1 transition-colors mt-4 mb-2"
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
    { name: 'Insurance',                  
      values: [ 0, ...Array(projYears).fill(stNum.insInclude ? stNum.insCost : 0) ] 
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
  const StatsCard = ({ label, value, color = "vine-green", description, icon }) => {
  // Define color mappings for consistent styling
  const colorMap = {
    emerald: {
      bg: "from-emerald-50 to-emerald-100",
      border: "border-emerald-200",
      text: "text-emerald-700",
      value: "text-emerald-900",
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600"
    },
    amber: {
      bg: "from-amber-50 to-amber-100",
      border: "border-amber-200",
      text: "text-amber-700",
      value: "text-amber-900",
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600"
    },
    green: {
      bg: "from-green-50 to-green-100",
      border: "border-green-200",
      text: "text-green-700",
      value: "text-green-900",
      iconBg: "bg-green-100",
      iconColor: "text-green-600"
    },
    blue: {
      bg: "from-blue-50 to-blue-100",
      border: "border-blue-200",
      text: "text-blue-700",
      value: "text-blue-900",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600"
    },
    purple: {
      bg: "from-purple-50 to-purple-100",
      border: "border-purple-200",
      text: "text-purple-700",
      value: "text-purple-900",
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600"
    },
    indigo: {
      bg: "from-indigo-50 to-indigo-100",
      border: "border-indigo-200",
      text: "text-indigo-700",
      value: "text-indigo-900",
      iconBg: "bg-indigo-100",
      iconColor: "text-indigo-600"
    },
    red: {
      bg: "from-red-50 to-red-100",
      border: "border-red-200",
      text: "text-red-700",
      value: "text-red-900",
      iconBg: "bg-red-100",
      iconColor: "text-red-600"
    }
  };

  const colors = colorMap[color] || colorMap.green;

  return (
    <div className={`p-6 bg-gradient-to-br ${colors.bg} rounded-xl text-center shadow-lg border-2 ${colors.border} transform hover:scale-105 transition-all duration-200`}>
      {icon && (
        <div className={`w-12 h-12 ${colors.iconBg} rounded-full flex items-center justify-center mx-auto mb-3 ${colors.iconColor}`}>
          {icon}
        </div>
      )}
      <p className={`text-xs ${colors.text} uppercase mb-2 font-bold tracking-wider`}>
        {label}
      </p>
      <p className={`text-3xl font-black ${colors.value} mb-2`}>{value}</p>
      {description && (
        <p className="text-xs text-gray-600 leading-tight">{description}</p>
      )}
    </div>
  );
};

  // Progress Tracker Component with Interactive Checkboxes
const EstablishmentProgressTracker = ({ 
  stNum, 
  prePlantTotal, 
  plantingTotal, 
  totalEstCost, 
  permitOneTime,
  taskCompletion,
  setTaskCompletion 
}) => {
  // Calculate progress data
  const taskCategories = [
    {
      id: 'sitePrep',
      category: 'Site Preparation',
      icon: <Wrench className="w-5 h-5" />,
      color: 'orange',
      tasks: stNum.prePlanting.filter(r => r.include).map((row, idx) => ({
        id: `sitePrep-${idx}`,
        name: row.label,
        description: 'Comprehensive soil analysis for pH, nutrients, and drainage',
        cost: row.costPerAcre * stNum.acres,
        duration: '2 weeks',
        month: 'Month 1-2',
      }))
    },
    {
      id: 'planting',
      category: 'Planting',
      icon: <Sprout className="w-5 h-5" />,
      color: 'green',
      tasks: stNum.planting.filter(r => r.include).map((row, idx) => {
        const costPerAcre = row.costPerAcre != null ? row.costPerAcre : (row.unitCost || 0) * (row.qtyPerAcre || 0);
        return {
          id: `planting-${idx}`,
          name: row.label,
          description: row.label.toLowerCase().includes('stock') 
            ? 'Order certified vine stock from nursery'
            : 'Final soil amendments and marking planting locations',
          cost: costPerAcre * stNum.acres,
          duration: row.label.toLowerCase().includes('stock') ? '1 week' : '2 weeks',
          month: row.label.toLowerCase().includes('stock') ? 'Month 2' : 'Month 7-8',
        };
      })
    },
    {
      id: 'infrastructure',
      category: 'Infrastructure',
      icon: <HardHat className="w-5 h-5" />,
      color: 'blue',
      tasks: Object.entries(stNum.setup)
        .filter(([key, obj]) => obj.include && key !== 'vines')
        .map(([key, obj], idx) => ({
          id: `infrastructure-${idx}`,
          name: key.charAt(0).toUpperCase() + key.slice(1) + (obj.system ? ` (${obj.system})` : ''),
          description: key === 'irrigation' 
            ? 'Install drainage systems and improve water management'
            : 'Install infrastructure and prepare site',
          cost: obj.cost * stNum.acres,
          duration: key === 'irrigation' ? '4 weeks' : '2-3 weeks',
          month: 'Month 3-6',
        }))
    },
    {
      id: 'equipment',
      category: 'Equipment',
      icon: <Wrench className="w-5 h-5" />,
      color: 'purple',
      tasks: stNum.equipmentRows.filter(r => r.include).map((row, idx) => ({
        id: `equipment-${idx}`,
        name: 'Equipment Purchase',
        description: 'Acquire tractors, sprayers, and vineyard equipment',
        cost: row.price,
        duration: '2 weeks',
        month: 'Month 9',
      }))
    }
  ];

  // Calculate totals
  const allTasks = taskCategories.flatMap(cat => cat.tasks);
  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter(task => taskCompletion[task.id]).length;
  const progressPercent = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  
  // Calculate financial progress
  const investedAmount = allTasks
    .filter(task => taskCompletion[task.id])
    .reduce((sum, task) => sum + task.cost, 0);
  const remainingAmount = totalEstCost - investedAmount;

  // Toggle task completion
  const toggleTask = (taskId) => {
    setTaskCompletion(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  // Color mappings
  const colorMap = {
    orange: {
      bg: 'bg-orange-50',
      text: 'text-orange-700',
      icon: 'bg-orange-100 text-orange-600',
      border: 'border-orange-200',
      check: 'bg-orange-500 border-orange-500'
    },
    green: {
      bg: 'bg-green-50',
      text: 'text-green-700',
      icon: 'bg-green-100 text-green-600',
      border: 'border-green-200',
      check: 'bg-green-500 border-green-500'
    },
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      icon: 'bg-blue-100 text-blue-600',
      border: 'border-blue-200',
      check: 'bg-blue-500 border-blue-500'
    },
    purple: {
      bg: 'bg-purple-50',
      text: 'text-purple-700',
      icon: 'bg-purple-100 text-purple-600',
      border: 'border-purple-200',
      check: 'bg-purple-500 border-purple-500'
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">Establishment Progress</h3>
          <span className="text-sm text-gray-600 font-medium">
            {completedTasks} of {totalTasks} Complete
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
          <div 
            className="bg-green-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Financial Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600">
              ${investedAmount.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 mt-1">Invested</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-orange-600">
              ${remainingAmount.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 mt-1">Remaining</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-600">
              {progressPercent.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600 mt-1">Complete</div>
          </div>
        </div>
      </div>

      {/* Task Grid - 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {taskCategories.map((category) => {
          if (category.tasks.length === 0) return null;
          
          const colors = colorMap[category.color];
          const categoryCompleted = category.tasks.filter(t => taskCompletion[t.id]).length;
          const categoryTotal = category.tasks.length;

          return (
            <div key={category.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {/* Header */}
              <div className="px-6 py-4 flex items-center justify-between border-b">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full ${colors.icon} flex items-center justify-center`}>
                    {category.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{category.category}</h3>
                    <p className="text-xs text-gray-500">{categoryCompleted}/{categoryTotal}</p>
                  </div>
                </div>
              </div>

              {/* Tasks */}
              <div className="divide-y divide-gray-100">
                {category.tasks.map((task) => {
                  const isCompleted = taskCompletion[task.id];
                  
                  return (
                    <div 
                      key={task.id}
                      className={`p-4 transition-colors cursor-pointer hover:bg-gray-50 ${
                        isCompleted ? colors.bg : ''
                      }`}
                      onClick={() => toggleTask(task.id)}
                    >
                      <div className="flex items-start gap-3">
                        {/* Checkbox */}
                        <div className="flex-shrink-0 pt-0.5">
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                            isCompleted 
                              ? colors.check
                              : 'border-gray-300 bg-white'
                          }`}>
                            {isCompleted && (
                              <Check className="w-4 h-4 text-white" />
                            )}
                          </div>
                        </div>

                        {/* Task Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className={`font-medium text-sm ${
                              isCompleted 
                                ? 'text-gray-500 line-through' 
                                : 'text-gray-900'
                            }`}>
                              {task.name}
                            </h4>
                            <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                              ${task.cost.toLocaleString()}
                            </span>
                          </div>
                          
                          <p className={`text-xs mb-2 ${
                            isCompleted ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            {task.description}
                          </p>

                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span>Year 0 - {task.month}</span>
                            <span>•</span>
                            <span>{task.duration}</span>
                            <span>•</span>
                            <span>${task.cost.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

  const MainUI = (
    <div className="w-full">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">

      {/* NEW VINEYARD DESIGN TAB */}
      {activeTab === "design" && (
        <div className="space-y-8 pt-6">
          {/* Hero Header */}
          <div className="text-center p-8 mb-8">
            <h1 className="text-4xl font-bold text-vine-green-500 mb-3">
              Vineyard Design & Layout
            </h1>
            <p className="text-gray-600 max-w-3xl mx-auto">
              Design your vineyard layout with optimal spacing, variety selection, and trellis systems for maximum productivity and quality.
            </p>
          </div>

          <VineyardLayoutConfig
            acres={stNum.acres}
            onLayoutChange={handleLayoutChange}
            currentLayout={st.vineyardLayout}
            onAcresChange={(value) => update("acres", value)}
          />
        </div>
      )}
      
      {/* INPUTS TAB */}
      {activeTab === "inputs" && (
        <div className="space-y-8 pt-6">
          <h1 className="text-2xl font-bold text-vine-green-700 border-b pb-3">
            Financial Inputs for the Vineyard
          </h1>

          {!st.vineyardLayout?.calculatedLayout && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-yellow-600">⚠️</span>
                <div>
                  <h4 className="font-medium text-yellow-800">Vineyard Design Not Configured</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Configure your vineyard layout first for accurate material costs and vine quantities.
                  </p>
                  <button 
                    onClick={() => setActiveTab("design")}
                    className="mt-2 px-3 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700"
                  >
                    Go to Vineyard Design →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Core Inputs */}
          <CollapsibleSection title="Core Vineyard Parameters">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-8">
              <div>
                <label className="text-sm text-vine-green-700 font-medium block mb-2">
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
                <label className="text-sm text-vine-green-700 font-medium block mb-2">Acres</label>
                {num("acres")}
              </div>
              {st.salesMode === "wine" && (
                <div>
                  <label className="text-sm text-vine-green-700 font-medium block mb-2">
                    Bottle Price ($)
                  </label>
                  {num("bottlePrice", 0.5)}
                </div>
              )}
              {/* ——— SALES STRATEGY ——— */}

              {st.salesMode === "grapes" && (
                <div>
                  <label className="text-sm text-vine-green-700 font-medium block mb-2">
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
                <label className="text-sm text-vine-green-700 font-medium block mb-2">Water Cost ($/acre-yr)</label>
                {num("waterCost", 10)}
              </div>
              <div>
                <label className="text-sm text-vine-green-700 font-medium block mb-2">Land Price ($/acre)</label>
                {num("landPrice", 1000)}
              </div>
              <div>
                <label className="text-sm text-vine-green-700 font-medium block mb-2">Build Cost ($/acre)</label>
                {num("buildPrice", 1000)}
              </div>
              <div>
                <label className="text-sm text-vine-green-700 font-medium block mb-2">Setup Year</label>
                {num("setupYear", 1)}
              </div>
              <div>
                <label className="text-sm text-vine-green-700 font-medium block mb-2">License Cost ($)</label>
                {num("licenseCost", 100)}
              </div>
              <div>
                <label className="text-sm text-vine-green-700 font-medium block mb-2">
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
                const isCalculated = obj.calculated; // From vineyard design
                
                return (
                  <div key={k} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg">
                    <Checkbox 
                      checked={obj.include} 
                      onCheckedChange={v => updateSetup(k, { ...obj, include: v })}
                      className="h-5 w-5"
                    />
                    <span className="text-sm text-vine-green-700 font-medium capitalize w-32">{label}</span>
                    
                    {/* Show calculation source */}
                    {isCalculated ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                          Auto-calculated from design
                        </span>
                        <span className="text-sm text-vine-green-700">$/acre</span>
                        <span className="w-28 p-2 bg-gray-100 text-sm rounded border">
                          ${obj.cost.toLocaleString()}
                        </span>
                        <button 
                          onClick={() => setActiveTab("design")}
                          className="text-xs text-vine-green-500 hover:text-vine-green-700 underline"
                        >
                          Edit in Design →
                        </button>
                      </div>
                    ) : (
                      // Manual input for non-calculated items
                      <>
                        {k === "irrigation" ? (
                          <>
                            <select 
                              className="border p-2 rounded-md text-sm bg-white" 
                              value={obj.system} 
                              onChange={e => updateSetup(k, { ...obj, system: e.target.value, cost: IRRIG_OPTIONS.find(o => o.key === e.target.value).defaultCost })}
                            >
                              {IRRIG_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
                            </select>
                            <label className="text-sm text-vine-green-700">$/acre</label>
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
                            <label className="text-sm text-vine-green-700">$/acre</label>
                            <Input 
                              className="w-28 bg-white" 
                              type="number" 
                              step="100" 
                              value={obj.cost} 
                              onChange={e => updateSetup(k, { ...obj, cost: (e.target.value) })} 
                            />
                          </>
                        )}
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
                <tr className="bg-vine-green-50">
                <th className="text-left p-3 text-xs font-medium text-vine-green-700">Include</th>
                <th className="text-left p-3 text-xs font-medium text-vine-green-700">Task</th>
                <th className="text-left p-3 text-xs font-medium text-vine-green-700">$/acre</th>
                <th className="text-left p-3 text-xs font-medium text-vine-green-700">Actions</th>
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
          {st.vineyardLayout?.calculatedLayout && (
            <div className="mb-4 p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">Calculated Vine Requirements</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-green-700">Total Vines:</span>
                  <div className="font-semibold">{st.vineyardLayout.calculatedLayout.vineLayout.totalVines.toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-green-700">Vines/Acre:</span>
                  <div className="font-semibold">{Math.round(st.vineyardLayout.calculatedLayout.vineLayout.vinesPerAcre)}</div>
                </div>
                <div>
                  <span className="text-green-700">Spacing:</span>
                  <div className="font-semibold">{st.vineyardLayout.calculatedLayout.spacing.vine}' × {st.vineyardLayout.calculatedLayout.spacing.row}'</div>
                </div>
                <div>
                  <span className="text-green-700">Rows:</span>
                  <div className="font-semibold">{st.vineyardLayout.calculatedLayout.vineLayout.numberOfRows}</div>
                </div>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full min-w-max">
              <thead>
                <tr className="bg-vine-green-50">
                  <th className="text-left p-3 text-xs font-medium text-vine-green-700">Include</th>
                  <th className="text-left p-3 text-xs font-medium text-vine-green-700">Item</th>
                  <th className="text-left p-3 text-xs font-medium text-vine-green-700">Unit Cost</th>
                  <th className="text-left p-3 text-xs font-medium text-vine-green-700">Qty/acre</th>
                  <th className="text-left p-3 text-xs font-medium text-vine-green-700">Cost/acre</th>
                  <th className="text-left p-3 text-xs font-medium text-vine-green-700">Actions</th>
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
                <tr className="bg-vine-green-50">
                <th className="text-left p-3 text-xs font-medium text-vine-green-700">Include</th>
                <th className="text-left p-3 text-xs font-medium text-vine-green-700">Operation</th>
                <th className="text-left p-3 text-xs font-medium text-vine-green-700">$/acre</th>
                <th className="text-left p-3 text-xs font-medium text-vine-green-700">Actions</th>
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
                <tr className="bg-vine-green-50">
                <th className="text-left p-3 text-xs font-medium text-vine-green-700">Include</th>
                <th className="text-left p-3 text-xs font-medium text-vine-green-700">Service</th>
                <th className="text-left p-3 text-xs font-medium text-vine-green-700">$/acre</th>
                <th className="text-left p-3 text-xs font-medium text-vine-green-700">$/ton</th>
                <th className="text-left p-3 text-xs font-medium text-vine-green-700">Actions</th>
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
                <tr className="bg-vine-green-50">
                <th className="text-left p-3 text-xs font-medium text-vine-green-700">Include</th>
                <th className="text-left p-3 text-xs font-medium text-vine-green-700">Fee</th>
                <th className="text-left p-3 text-xs font-medium text-vine-green-700">$/acre</th>
                <th className="text-left p-3 text-xs font-medium text-vine-green-700">Actions</th>
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
                <tr className="bg-vine-green-50">
                <th className="text-left p-3 text-xs font-medium text-vine-green-700">Include</th>
                <th className="text-left p-3 text-xs font-medium text-vine-green-700">Expense</th>
                <th className="text-left p-3 text-xs font-medium text-vine-green-700">Annual $</th>
                <th className="text-left p-3 text-xs font-medium text-vine-green-700">Actions</th>
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
                <tr className="bg-vine-green-50">
                <th className="text-left p-3 text-xs font-medium text-vine-green-700">Include</th>
                <th className="text-left p-3 text-xs font-medium text-vine-green-700">Category</th>
                <th className="text-left p-3 text-xs font-medium text-vine-green-700">Annual $</th>
                <th className="text-left p-3 text-xs font-medium text-vine-green-700">Actions</th>
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
                <tr className="bg-vine-green-50">
                <th className="text-left p-3 text-xs font-medium text-vine-green-700">Include</th>
                <th className="text-left p-3 text-xs font-medium text-vine-green-700">Item</th>
                <th className="text-left p-3 text-xs font-medium text-vine-green-700">$/hour</th>
                <th className="text-left p-3 text-xs font-medium text-vine-green-700">Hours/yr</th>
                <th className="text-left p-3 text-xs font-medium text-vine-green-700">Actions</th>
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
                <tr className="bg-vine-green-50">
                <th className="text-left p-3 text-xs font-medium text-vine-green-700">Include</th>
                <th className="text-left p-3 text-xs font-medium text-vine-green-700">Service</th>
                <th className="text-left p-3 text-xs font-medium text-vine-green-700">$/acre</th>
                <th className="text-left p-3 text-xs font-medium text-vine-green-700">Actions</th>
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
                    <span className="flex-1 text-sm text-vine-green-700">{p.label}</span>
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
                  <tr className="bg-vine-green-50">
                    <th className="text-left p-3 text-xs font-medium text-vine-green-700">Include</th>
                    <th className="text-left p-3 text-xs font-medium text-vine-green-700">Equipment</th>
                    <th className="text-left p-3 text-xs font-medium text-vine-green-700">Price ($)</th>
                    <th className="text-left p-3 text-xs font-medium text-vine-green-700">Rate (%)</th>
                    <th className="text-left p-3 text-xs font-medium text-vine-green-700">Term (yrs)</th>
                    <th className="text-left p-3 text-xs font-medium text-vine-green-700">$/mo</th>
                    <th className="text-left p-3 text-xs font-medium text-vine-green-700">Actions</th>
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
                <tr className="bg-vine-green-50">
                <th className="text-left p-3 text-xs font-medium text-vine-green-700">Include</th>
                <th className="text-left p-3 text-xs font-medium text-vine-green-700">Label</th>
                <th className="text-left p-3 text-xs font-medium text-vine-green-700">Principal ($)</th>
                <th className="text-left p-3 text-xs font-medium text-vine-green-700">Rate (%)</th>
                <th className="text-left p-3 text-xs font-medium text-vine-green-700">Term (yrs)</th>
                <th className="text-left p-3 text-xs font-medium text-vine-green-700">$/mo</th>
                <th className="text-left p-3 text-xs font-medium text-vine-green-700">Actions</th>
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
                  <tr className="bg-vine-green-50">
                    <th className="text-left p-3 text-xs font-medium text-vine-green-700">Include</th>
                    <th className="text-left p-3 text-xs font-medium text-vine-green-700">Variety</th>
                    <th className="text-left p-3 text-xs font-medium text-vine-green-700">Pounds</th>
                    <th className="text-left p-3 text-xs font-medium text-vine-green-700">Price/lb ($)</th>
                    <th className="text-left p-3 text-xs font-medium text-vine-green-700">Total ($)</th>
                    <th className="text-left p-3 text-xs font-medium text-vine-green-700">Actions</th>
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
                  <tr className="bg-vine-green-50">
                    <th className="text-left p-3 text-xs font-medium text-vine-green-700">Include</th>
                    <th className="text-left p-3 text-xs font-medium text-vine-green-700">Category</th>
                    <th className="text-left p-3 text-xs font-medium text-vine-green-700">Year</th>
                    <th className="text-left p-3 text-xs font-medium text-vine-green-700">Bottles</th>
                    <th className="text-left p-3 text-xs font-medium text-vine-green-700">Actions</th>
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
          <div className="space-y-8 pt-6">
            <div className="flex items-center justify-between border-b pb-4">
              <SectionHeader title="Year 0 Establishment Costs" />
              
              {/* View Toggle */}
              <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setEstablishmentView('breakdown')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    establishmentView === 'breakdown'
                      ? 'bg-white text-vine-green-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Cost Breakdown
                </button>
                <button
                  onClick={() => setEstablishmentView('progress')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    establishmentView === 'progress'
                      ? 'bg-white text-vine-green-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Progress Tracker
                </button>
              </div>
            </div>

            {/* BREAKDOWN VIEW */}
            {establishmentView === 'breakdown' && (
              <>
                {/* Enhanced Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6 mb-8">
                  <StatsCard 
                    label="Land" 
                    value={`$${(stNum.landPrice * stNum.acres).toLocaleString()}`}
                    color="emerald"
                    icon={<MapPin className="w-6 h-6" />}
                    description="Property acquisition"
                  />
                  <StatsCard 
                    label="Pre-Planting" 
                    value={`$${prePlantTotal.toLocaleString()}`}
                    color="amber"
                    icon={<Tractor className="w-6 h-6" />}
                    description="Site preparation"
                  />
                  <StatsCard 
                    label="Planting" 
                    value={`$${plantingTotal.toLocaleString()}`}
                    color="green"
                    icon={<Sprout className="w-6 h-6" />}
                    description="Vines & materials"
                  />
                  <StatsCard 
                    label="Setup" 
                    value={`$${estData
                      .filter(d => !['Land Purchase','License','One-time Permits','Pre-Planting','Planting'].includes(d.name))
                      .reduce((s,d) => s + d.value, 0)
                      .toLocaleString()}`}
                    color="blue"
                    icon={<HardHat className="w-6 h-6" />}
                    description="Infrastructure"
                  />
                  <StatsCard 
                    label="License" 
                    value={`$${stNum.licenseCost.toLocaleString()}`}
                    color="purple"
                    icon={<FileText className="w-6 h-6" />}
                    description="Permits & fees"
                  />
                  <StatsCard 
                    label="Permits" 
                    value={`$${permitOneTime.toLocaleString()}`}
                    color="indigo"
                    icon={<ScrollText className="w-6 h-6" />}
                    description="Legal requirements"
                  />
                  <div className="sm:col-span-2 md:col-span-3 lg:col-span-4 xl:col-span-6">
                    <StatsCard 
                      label="Total Investment" 
                      value={`$${estData.reduce((s,d) => s + d.value, 0).toLocaleString()}`}
                      color="red"
                      icon={<Gem className="w-6 h-6" />}
                      description={`$${Math.round(estData.reduce((s,d) => s + d.value, 0) / stNum.acres).toLocaleString()} per acre`}
                    />
                  </div>
                </div>

                {/* Bar + Pie Charts */}
                <SectionCard title="Cost Breakdown">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Bar Chart */}
                    <div className="h-64">
                      <ResponsiveContainer
                        key={`rc-${location.pathname}-${activeTab}`}
                        width="100%"
                        height="100%"
                      >
                        <BarChart data={estData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                          <defs>
                            <linearGradient id="establishmentGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9}/>
                              <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.7}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#475569' }} stroke="#94a3b8" />
                          <YAxis tickFormatter={n => `$${n.toLocaleString()}`} tick={{ fontSize: 12, fill: '#475569' }} stroke="#94a3b8" />
                          <Tooltip 
                            formatter={(val) => [`$${val.toLocaleString()}`, 'Cost']} 
                            contentStyle={{ 
                              backgroundColor: 'white', 
                              border: '2px solid #e2e8f0', 
                              borderRadius: '12px', 
                              boxShadow: '0 10px 25px rgba(0,0,0,0.1)' 
                            }}
                          />
                          <Bar dataKey="value" fill="url(#establishmentGradient)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Pie Chart */}
                    <div className="h-64">
                      <ResponsiveContainer
                        key={`rc-${location.pathname}-${activeTab}`}
                        width="100%"
                        height="100%"
                      >
                        <PieChart>
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
                                  "#1F77B4",
                                  "#FF7F0E",
                                  "#2CA02C",
                                  "#D62728",
                                  "#9467BD",
                                  "#8C564B"
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

                {/* Detailed Breakdown Tables */}
                <SectionCard title="Detailed Cost Breakdown">
                  <div className="space-y-8">
                    {/* Pre-Planting Costs */}
                    <div>
                      <h4 className="text-lg font-semibold text-vine-green-700 mb-4 flex items-center gap-2">
                        <Tractor className="w-5 h-5" />
                        Pre-Planting Costs
                      </h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full bg-white divide-y divide-gray-200 border rounded-lg">
                          <thead className="bg-amber-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-amber-700 uppercase">Item</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-amber-700 uppercase">$/Acre</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-amber-700 uppercase">Total Cost</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {stNum.prePlanting.filter(r => r.include).map((row, i) => (
                              <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                <td className="px-6 py-4 text-sm text-gray-900">{row.label}</td>
                                <td className="px-6 py-4 text-sm text-gray-900 text-right">${row.costPerAcre.toLocaleString()}</td>
                                <td className="px-6 py-4 text-sm font-medium text-gray-900 text-right">
                                  ${(row.costPerAcre * stNum.acres).toLocaleString()}
                                </td>
                              </tr>
                            ))}
                            <tr className="bg-amber-50 font-semibold">
                              <td className="px-6 py-4 text-sm text-amber-700">Subtotal</td>
                              <td className="px-6 py-4 text-sm text-amber-700 text-right">
                                ${(prePlantTotal / stNum.acres).toFixed(0)}
                              </td>
                              <td className="px-6 py-4 text-sm text-amber-700 text-right">
                                ${prePlantTotal.toLocaleString()}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Planting Costs */}
                    <div>
                      <h4 className="text-lg font-semibold text-vine-green-700 mb-4 flex items-center gap-2">
                        <Sprout className="w-5 h-5" />
                        Planting Costs
                      </h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full bg-white divide-y divide-gray-200 border rounded-lg">
                          <thead className="bg-green-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase">Item</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-green-700 uppercase">Unit Cost</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-green-700 uppercase">Qty/Acre</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-green-700 uppercase">$/Acre</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-green-700 uppercase">Total Cost</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {stNum.planting.filter(r => r.include).map((row, i) => {
                              const costPerAcre = row.costPerAcre != null ? row.costPerAcre : (row.unitCost || 0) * (row.qtyPerAcre || 0);
                              return (
                                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                  <td className="px-6 py-4 text-sm text-gray-900">{row.label}</td>
                                  <td className="px-6 py-4 text-sm text-gray-900 text-right">
                                    ${(row.unitCost || 0).toFixed(2)}
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-900 text-right">
                                    {row.qtyPerAcre || '—'}
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-900 text-right">
                                    ${costPerAcre.toLocaleString()}
                                  </td>
                                  <td className="px-6 py-4 text-sm font-medium text-gray-900 text-right">
                                    ${(costPerAcre * stNum.acres).toLocaleString()}
                                  </td>
                                </tr>
                              );
                            })}
                            <tr className="bg-green-50 font-semibold">
                              <td className="px-6 py-4 text-sm text-green-700" colSpan={3}>Subtotal</td>
                              <td className="px-6 py-4 text-sm text-green-700 text-right">
                                ${(plantingTotal / stNum.acres).toFixed(0)}
                              </td>
                              <td className="px-6 py-4 text-sm text-green-700 text-right">
                                ${plantingTotal.toLocaleString()}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Setup/Infrastructure Costs */}
                    <div>
                      <h4 className="text-lg font-semibold text-vine-green-700 mb-4 flex items-center gap-2">
                        <HardHat className="w-5 h-5" />
                        Infrastructure Setup
                      </h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full bg-white divide-y divide-gray-200 border rounded-lg">
                          <thead className="bg-blue-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase">Item</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-blue-700 uppercase">$/Acre</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-blue-700 uppercase">Total Cost</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {Object.entries(stNum.setup)
                              .filter(([key, obj]) => obj.include && key !== 'vines')
                              .map(([key, obj], i) => (
                                <tr key={key} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                  <td className="px-6 py-4 text-sm text-gray-900 capitalize">
                                    {key}
                                    {obj.system && <span className="ml-2 text-xs text-gray-500">({obj.system})</span>}
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-900 text-right">
                                    ${obj.cost.toLocaleString()}
                                  </td>
                                  <td className="px-6 py-4 text-sm font-medium text-gray-900 text-right">
                                    ${(obj.cost * stNum.acres).toLocaleString()}
                                  </td>
                                </tr>
                              ))}
                            <tr className={stNum.buildPrice > 0 ? 'bg-white' : 'hidden'}>
                              <td className="px-6 py-4 text-sm text-gray-900">Building</td>
                              <td className="px-6 py-4 text-sm text-gray-900 text-right">
                                ${stNum.buildPrice.toLocaleString()}
                              </td>
                              <td className="px-6 py-4 text-sm font-medium text-gray-900 text-right">
                                ${(stNum.buildPrice * stNum.acres).toLocaleString()}
                              </td>
                            </tr>
                            <tr className="bg-blue-50 font-semibold">
                              <td className="px-6 py-4 text-sm text-blue-700">Subtotal</td>
                              <td className="px-6 py-4 text-sm text-blue-700 text-right">
                                ${(perAcreSetup).toFixed(0)}
                              </td>
                              <td className="px-6 py-4 text-sm text-blue-700 text-right">
                                ${(perAcreSetup * stNum.acres).toLocaleString()}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Licenses & Permits */}
                    <div>
                      <h4 className="text-lg font-semibold text-vine-green-700 mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Licenses & Permits
                      </h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full bg-white divide-y divide-gray-200 border rounded-lg">
                          <thead className="bg-purple-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-purple-700 uppercase">Item</th>
                              <th className="px-6 py-3 text-center text-xs font-medium text-purple-700 uppercase">Type</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-purple-700 uppercase">Cost</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            <tr className="bg-white">
                              <td className="px-6 py-4 text-sm text-gray-900">Business License</td>
                              <td className="px-6 py-4 text-sm text-gray-600 text-center">One-time</td>
                              <td className="px-6 py-4 text-sm font-medium text-gray-900 text-right">
                                ${stNum.licenseCost.toLocaleString()}
                              </td>
                            </tr>
                            {stNum.permits.filter(p => p.include).map((permit, i) => (
                              <tr key={permit.key} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                                <td className="px-6 py-4 text-sm text-gray-900">{permit.label}</td>
                                <td className="px-6 py-4 text-sm text-gray-600 text-center">
                                  {['federal', 'state', 'winegrower', 'farm'].includes(permit.key) ? 'One-time' : 'Annual'}
                                </td>
                                <td className="px-6 py-4 text-sm font-medium text-gray-900 text-right">
                                  ${permit.cost.toLocaleString()}
                                </td>
                              </tr>
                            ))}
                            <tr className="bg-purple-50 font-semibold">
                              <td className="px-6 py-4 text-sm text-purple-700" colSpan={2}>Subtotal</td>
                              <td className="px-6 py-4 text-sm text-purple-700 text-right">
                                ${(stNum.licenseCost + permitOneTime).toLocaleString()}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </SectionCard>

                {/* Financing Section */}
                <SectionCard title="Financing & Net Capital Required">
                  <div className="space-y-4">
                    <div className="overflow-x-auto">
                      <table className="min-w-full bg-white divide-y divide-gray-200">
                        <thead className="bg-vine-green-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-vine-green-700 uppercase tracking-wider">
                              Lender
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-vine-green-700 uppercase tracking-wider">
                              Principal
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-vine-green-700 uppercase tracking-wider">
                              Rate
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-vine-green-700 uppercase tracking-wider">
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
                          <tr className="bg-vine-green-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-vine-green-700">
                              Total Loans
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-vine-green-700 text-right">
                              ${totalLoanPrincipal.toLocaleString()}
                            </td>
                            <td colSpan={2}></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

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
              </>
            )}

            {/* PROGRESS TRACKER VIEW */}
            {/* PROGRESS TRACKER VIEW */}
            {establishmentView === 'progress' && (
              <EstablishmentProgressTracker 
                stNum={stNum}
                prePlantTotal={prePlantTotal}
                plantingTotal={plantingTotal}
                totalEstCost={totalEstCost}
                permitOneTime={permitOneTime}
                taskCompletion={taskCompletion}
                setTaskCompletion={setTaskCompletion}
              />
            )}
          </div>
        )}

        {/* ── 10-Year Projection Tab ── */}
        {activeTab === "proj" && (
        <div className="space-y-8 pt-6">
            <SectionHeader title={`${projYears}-Year Financial Projection`} />

            {/* Enhanced Top-line summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-600 mb-2">Year {breakEven}</div>
                  <div className="text-sm text-gray-500">Break Even</div>
                </div>
                {projection.length > 0 && beIdx >= 0 && (
                  <div className="mt-4 text-center text-xs text-gray-400">
                    Investment Recovery: {((beIdx + 1) / projYears * 100).toFixed(0)}% of projection period
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600 mb-2">
                    ${projection
                      .filter(p => p.year > 0)
                      .reduce((sum, p) => sum + p.revenue, 0)
                      .toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500">Total Revenue</div>
                </div>
                <div className="mt-4 text-center text-xs text-gray-400">
                  Avg Annual: ${Math.round(projection.filter(p => p.year > 0).reduce((sum, p) => sum + p.revenue, 0) / projYears).toLocaleString()}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <Grape className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-purple-600 mb-2">
                    {projection.length > 0 
                      ? `${Math.round((projection[projection.length - 1].cumulative / totalEstCost) * 100)}%` 
                      : "0%"}
                  </div>
                  <div className="text-sm text-gray-500">Annual ROI</div>
                </div>
                <div className="mt-4 text-center text-xs text-gray-400">
                  Final Profit: ${projection[projection.length - 1].cumulative.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Chart Selector with Multiple Views */}
            <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 overflow-hidden mb-16 p-8">
              <div className="mb-6">
                {/* Chart Selector Dropdown */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-6 h-6 text-blue-600" />
                    <h3 className="text-2xl font-bold text-gray-800">
                      {selectedChart === "revenue" && "Revenue Projection"}
                      {selectedChart === "profit" && "Annual Profit/Loss"}
                      {selectedChart === "cashflow" && "Cash Flow Analysis"}
                      {selectedChart === "cumulative" && "Cumulative Profit"}
                    </h3>
                  </div>
                  
                  <div className="relative">
                  <select
                    value={selectedChart}
                    onChange={(e) => setSelectedChart(e.target.value)}
                    className="appearance-none px-4 py-3 pr-10 border border-gray-200 rounded-xl text-base font-medium bg-white shadow-sm hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer min-w-[240px]"
                  >
                    <option value="revenue">Revenue Projection</option>
                    <option value="profit">Annual Profit/Loss</option>
                    <option value="cashflow">Cash Flow Analysis</option>
                    <option value="cumulative">Cumulative Profit</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
                </div>

                {/* Chart Subtitle */}
                <p className="text-gray-500 text-sm mb-6">
                  {selectedChart === "revenue" && "Annual revenue from grape sales"}
                  {selectedChart === "profit" && "Annual profit after operating expenses"}
                  {selectedChart === "cashflow" && "Revenue vs Operating Costs"}
                  {selectedChart === "cumulative" && "Total profit/loss over time"}
                </p>

                {/* Revenue Projection Chart */}
                {selectedChart === "revenue" && (
                  <div className="h-96">
                    <ResponsiveContainer key={`rc-${location.pathname}-${activeTab}-revenue`} width="100%" height="100%">
                      <AreaChart data={projection.filter(p => p.year > 0)} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
                        <defs>
                          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.05}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} tickFormatter={(val) => `$${(val/1000).toFixed(0)}K`} />
                        <Tooltip formatter={(val) => [`$${val.toLocaleString()}`, "Revenue"]} />
                        <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fill="url(#revenueGradient)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Annual Profit/Loss Chart */}
                {selectedChart === "profit" && (
                  <div className="h-96">
                    <ResponsiveContainer key={`rc-${location.pathname}-${activeTab}-profit`} width="100%" height="100%">
                      <BarChart data={projection} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} tickFormatter={(val) => `$${(val/1000).toFixed(0)}K`} />
                        <Tooltip formatter={(val) => [`$${val.toLocaleString()}`, "Net Profit/Loss"]} />
                        <ReferenceLine y={0} stroke="#000" strokeWidth={1} />
                        <Bar dataKey="net" radius={[4, 4, 0, 0]}>
                          {projection.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.net >= 0 ? "#10b981" : "#ef4444"} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Cash Flow Analysis Chart */}
                {selectedChart === "cashflow" && (
                  <div className="h-96">
                    <ResponsiveContainer key={`rc-${location.pathname}-${activeTab}-cashflow`} width="100%" height="100%">
                      <BarChart data={projection} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} tickFormatter={(val) => `$${(val/1000).toFixed(0)}K`} />
                        <Tooltip formatter={(val) => [`$${val.toLocaleString()}`, undefined]} />
                        <Legend />
                        <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="cost" name="Operating Costs" fill="#ef4444" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Cumulative Profit Chart */}
                {selectedChart === "cumulative" && (
                  <div className="h-96">
                    <ResponsiveContainer key={`rc-${location.pathname}-${activeTab}-cumulative`} width="100%" height="100%">
                      <LineChart data={projection} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} tickFormatter={(val) => `$${(val/1000).toFixed(0)}K`} />
                        <Tooltip formatter={(val) => [`$${val.toLocaleString()}`, "Cumulative Profit"]} />
                        <ReferenceLine y={0} stroke="#000" strokeWidth={1} strokeDasharray="3 3" />
                        <Line 
                          type="monotone" 
                          dataKey="cumulative" 
                          stroke="#8b5cf6" 
                          strokeWidth={3}
                          dot={{ fill: "#8b5cf6", r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
                  
            {/* Annual Financials Chart */}
            {/* <SectionCard title="Annual Revenue vs Cost vs Net">
            <div className="h-64">
                <ResponsiveContainer
                  key={`rc-${location.pathname}-${activeTab}`}
                  width="100%"
                  height="100%"
                >
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
            </SectionCard> */}

            {/* Detailed Projection Table */}
            <SectionCard title="Year-by-Year Table">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead className="bg-vine-green-50">
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
                          className="text-left p-2 text-xs font-medium text-vine-green-700 uppercase"
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
        <div className="space-y-8 pt-6 max-w-full overflow-hidden">
            <SectionHeader title="Vineyard Financial Analysis & Breakdown" />
            
            {/* Executive Summary Card */}
            <SectionCard title="Executive Summary">
              <div className="bg-gradient-to-br from-vine-green-50 via-vine-green-500-25 to-white p-8 rounded-2xl mb-8 border-2 border-vine-green-100 shadow-xl">
                {/* Three main KPI cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                  <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-vine-green-500 hover:shadow-xl transition-shadow duration-300">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs text-vine-green-600 uppercase font-bold tracking-wider">Break-Even Year</p>
                    </div>
                    <p className="text-4xl font-black text-vine-green-800 mb-3">Year {breakEven}</p>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      When cumulative profit becomes positive
                    </p>
                    {projection.length > 0 && beIdx >= 0 && (
                      <div className="mt-3 p-2 bg-vine-green-50 rounded-lg">
                        <p className="text-xs text-vine-green-600">
                          Cumulative profit: <span className="font-semibold">${projection[beIdx].cumulative.toLocaleString()}</span>
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-green-500 hover:shadow-xl transition-shadow duration-300">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs text-green-700 uppercase font-bold tracking-wider">Total Investment</p>
                    </div>
                    <p className="text-4xl font-black text-green-900 mb-3">${totalEstCost.toLocaleString()}</p>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Initial capital required to establish vineyard
                    </p>
                    <div className="mt-3 p-2 bg-green-50 rounded-lg">
                      <p className="text-xs text-green-700">
                        Per acre: <span className="font-semibold">${Math.round(totalEstCost / stNum.acres).toLocaleString()}</span>
                      </p>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-purple-500 hover:shadow-xl transition-shadow duration-300">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs text-purple-700 uppercase font-bold tracking-wider">{projYears}-Year ROI</p>
                    </div>
                    <p className="text-4xl font-black text-purple-900 mb-3">
                      {projection.length > 0 
                        ? `${Math.round((projection[projection.length - 1].cumulative / totalEstCost) * 100)}%` 
                        : "0%"}
                    </p>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Return on investment over full period
                    </p>
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                          style={{ 
                            width: `${Math.min(100, Math.max(0, (projection.length > 0 ? (projection[projection.length - 1].cumulative / totalEstCost) * 100 : 0)))}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Financial snapshot section */}
                <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
                  <h3 className="text-xl font-bold text-vine-green-800 mb-6 flex items-center gap-3">
                    Financial Snapshot
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left column - Revenue metrics */}
                    <div className="min-w-0">
                      <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border-l-4 border-green-400">
                        <span className="font-semibold text-green-900">Annual Revenue (full production)</span>
                        <span className="font-black text-xl text-green-800">
                         ${fullProdRevenue.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-lg border-l-4 border-red-400">
                        <span className="font-semibold text-red-900">Annual Operating Costs</span>
                        <span className="font-black text-xl text-red-800">${annualFixed.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-gradient-to-r from-vine-green-50 to-vine-green-100 rounded-lg border-l-4 border-vine-green-500">
                        <span className="font-semibold text-vine-green-800">Annual Net Profit (full production)</span>
                        <span className="font-black text-xl text-vine-green-700">
                          ${fullProdNet.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Right column - Unit economics */}
                    <div className="space-y-4">
                      {isWine ? (
                        <>
                          <div className="p-4 bg-gradient-to-r from-amber-50 to-amber-100 rounded-lg border-l-4 border-amber-400">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-semibold text-amber-900">Cost per Bottle</span>
                              <span className="font-black text-xl text-amber-800">
                                ${(annualFixed / (stNum.acres * AVERAGE_YIELD_TONS_PER_ACRE * BOTTLES_PER_TON)).toFixed(2)}
                              </span>
                            </div>
                            <div className="w-full bg-amber-200 rounded-full h-2">
                              <div 
                                className="bg-amber-600 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${(annualFixed / (stNum.acres * AVERAGE_YIELD_TONS_PER_ACRE * BOTTLES_PER_TON)) / stNum.bottlePrice * 100}%` }}
                              ></div>
                            </div>
                          </div>
                          <div className="p-4 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-lg border-l-4 border-emerald-400">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-semibold text-emerald-900">Price per Bottle</span>
                              <span className="font-black text-xl text-emerald-800">${stNum.bottlePrice.toFixed(2)}</span>
                            </div>
                          </div>
                          <div className="p-4 bg-gradient-to-r from-violet-50 to-violet-100 rounded-lg border-l-4 border-violet-400">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-semibold text-violet-900">Gross Margin per Bottle</span>
                              <span className="font-black text-xl text-violet-800">
                                ${(stNum.bottlePrice - (annualFixed / (stNum.acres * AVERAGE_YIELD_TONS_PER_ACRE * BOTTLES_PER_TON))).toFixed(2)}
                              </span>
                            </div>
                            <div className="text-sm text-violet-700 font-medium">
                              {Math.round((stNum.bottlePrice - (annualFixed / (stNum.acres * AVERAGE_YIELD_TONS_PER_ACRE * BOTTLES_PER_TON))) / stNum.bottlePrice * 100)}% margin
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="p-4 bg-gradient-to-r from-amber-50 to-amber-100 rounded-lg border-l-4 border-amber-400">
                            <div className="flex justify-between items-center">
                              <span className="font-semibold text-amber-900">Cost per Ton</span>
                              <span className="font-black text-xl text-amber-800">${costPerTon.toFixed(0)}</span>
                            </div>
                          </div>
                          <div className="p-4 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-lg border-l-4 border-emerald-400">
                            <div className="flex justify-between items-center">
                              <span className="font-semibold text-emerald-900">Price per Ton</span>
                              <span className="font-black text-xl text-emerald-800">${grapePrice.toLocaleString()}</span>
                            </div>
                          </div>
                          <div className="p-4 bg-gradient-to-r from-violet-50 to-violet-100 rounded-lg border-l-4 border-violet-400">
                            <div className="flex justify-between items-center">
                              <span className="font-semibold text-violet-900">Gross Margin per Ton</span>
                              <span className="font-black text-xl text-violet-800">
                                ${grossMarginTon.toLocaleString()} ({grapePrice ? ((grossMarginTon / grapePrice) * 100).toFixed(1) : 0}%)
                              </span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* Enhanced Cost Breakdown */}
            <SectionCard title="Comprehensive Cost Analysis">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                <h3 className="text-lg font-medium text-vine-green-700 mb-4">Cost Distribution</h3>
                <div className="h-80">
                    <ResponsiveContainer
                      key={`rc-${location.pathname}-${activeTab}`}
                      width="100%"
                      height="100%"
                    >
                    <BarChart
                        data={breakdownData}
                        layout="vertical"
                        margin={{ top: 10, right: 30, left: 160, bottom: 20 }}
                    >
                          <defs>
                            <linearGradient id="costBarGradient" x1="0" y1="0" x2="1" y2="0">
                              <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.8}/>
                              <stop offset="100%" stopColor="#3b82f6" stopOpacity={1}/>
                            </linearGradient>
                          </defs>
                          {/* rest of your existing chart code */}
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
                <h3 className="text-lg font-medium text-vine-green-700 mb-4">Cost Breakdown</h3>
                <div className="overflow-auto rounded-lg shadow">
                    <table className="min-w-full bg-white divide-y divide-gray-200">
                    <thead className="bg-vine-green-50">
                        <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-vine-green-700 uppercase tracking-wider">Category</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-vine-green-700 uppercase tracking-wider">Amount ($)</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-vine-green-700 uppercase tracking-wider">% of Total</th>
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
                                    className={`h-2.5 rounded-full ${index % 2 === 0 ? 'bg-vine-green-500' : 'bg-vine-green-500'}`}
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
                <thead className="bg-vine-green-50">
                    <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-vine-green-700">
                        Category
                    </th>
                    {years.map(y => (
                        <th
                        key={y}
                        className="px-4 py-2 text-right text-xs font-medium text-vine-green-700"
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
                    <tr className="bg-vine-green-50">
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-semibold text-vine-green-700">
                        Total
                    </td>
                    {yearTotals.map((tot, j) => (
                        <td
                        key={j}
                        className="px-4 py-2 whitespace-nowrap text-sm font-semibold text-vine-green-700 text-right"
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
                <span className="font-semibold text-vine-green-700">LTC (Loan-to-Cost):</span>
                &nbsp;Total loan principal divided by total project cost. A higher LTC means
                you’re financing a larger share of the build-out expenses.
              </p>
              <p>
                <span className="font-semibold text-vine-green-700">LTV (Loan-to-Value):</span>
                &nbsp;Total loan principal divided by the collateral’s appraised value
                (land + improvements). Lenders watch this ratio to be sure the asset is
                worth more than the debt secured against it.
              </p>
              <p>
                <span className="font-semibold text-vine-green-700">Land + Impr.</span>
                &nbsp;is the combined market value of the raw land purchase <em>plus</em>
                all permanent site improvements (buildings, trellis, irrigation, etc.).
              </p>
            </div>

            
            {/* Production Analysis */}
            <SectionCard title="Production & Revenue Analysis">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-vine-green-700 mb-4">Vineyard Production Timeline</h3>
                <div className="h-64 mb-4 min-w-0">
                    <ResponsiveContainer
                      key={`rc-${location.pathname}-${activeTab}`}
                      width="100%"
                      height="100%"
                    >
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
                    <h4 className="text-md font-semibold text-vine-green-700 mb-3">Vineyard Maturation Model</h4>
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
                <h3 className="text-lg font-semibold text-vine-green-700 mb-4">Revenue & Profit Analysis</h3>
                <div className="h-64 mb-4 min-w-0">
                    <ResponsiveContainer
                      key={`rc-${location.pathname}-${activeTab}`}
                      width="100%"
                      height="100%"
                    >
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
                    <h4 className="text-md font-semibold text-vine-green-700 mb-3">Revenue Insights</h4>
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
                <h3 className="text-lg font-medium text-vine-green-700 mb-4">Setup Cost Breakdown</h3>
                <div className="h-64">
                  <ResponsiveContainer
                    key={`rc-${location.pathname}-${activeTab}`}
                    width="100%"
                    height="100%"
                  >
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
                <h3 className="text-lg font-medium text-vine-green-700 mb-4">Investment Details</h3>
                <div className="overflow-hidden rounded-lg shadow">
                    <table className="min-w-full bg-white divide-y divide-gray-200">
                    <thead className="bg-vine-green-50">
                        <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-vine-green-700 uppercase tracking-wider">Item</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-vine-green-700 uppercase tracking-wider">Cost/Acre</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-vine-green-700 uppercase tracking-wider">Total Cost</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-vine-green-700 uppercase tracking-wider">% of Setup</th>
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
                        <tr className="bg-vine-green-50">
                        <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-vine-green-700">Total Investment</td>
                        <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-vine-green-700">
                            ${((totalEstCost - stNum.licenseCost) / stNum.acres).toLocaleString()}
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-vine-green-700">
                            ${totalEstCost.toLocaleString()}
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-vine-green-700">100.0%</td>
                        </tr>
                    </tbody>
                    </table>
                </div>
                </div>
            </div>
            </SectionCard>

            
            {/* Profitability Analysis */}
            <SectionCard title="Profitability & Break-Even Analysis">
            <div className="bg-vine-green-50 p-6 rounded-xl mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white p-5 rounded-lg shadow-sm">
                    <h3 className="text-lg font-medium text-vine-green-700 mb-3">Break-Even Timeline</h3>
                    <p className="text-3xl font-bold text-vine-green-700 mb-2">Year {breakEven}</p>
                    <p className="text-sm text-gray-600">
                    This vineyard will reach break-even (cumulative positive cash flow) in Year {breakEven}.
                    {projection.length > 0 && beIdx >= 0 && (
                        <span> At this point, your cumulative profit will be ${projection[beIdx].cumulative.toLocaleString()}.</span>
                    )}
                    </p>
                </div>
                <div className="bg-white p-5 rounded-lg shadow-sm">
                    <h3 className="text-lg font-medium text-vine-green-700 mb-3">Investment Recovery</h3>
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
                    <h3 className="text-lg font-medium text-vine-green-700 mb-3">10-Year ROI</h3>
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
                <h3 className="text-lg font-semibold text-vine-green-700 mb-4">Break-Even Analysis</h3>
                <div className="h-80">
                    {/* This is the section with the error - Fixed version */}
                    <ResponsiveContainer
                      key={`rc-${location.pathname}-${activeTab}`}
                      width="100%"
                      height="100%"
                    >
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
                    <h4 className="text-md font-semibold text-vine-green-700 mb-3">Sensitivity Analysis</h4>
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
                  <h3 className="text-lg font-medium text-vine-green-700 mb-4">Profit Margin Analysis</h3>
                  <div className="mb-6">
                      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                      <h4 className="text-md font-semibold text-vine-green-700 mb-3">Cost & Pricing Breakdown per Bottle</h4>
                      
                      <div className="space-y-4">
                          <div>
                          <div className="flex justify-between text-sm mb-1">
                              <span className="font-medium">Production Cost</span>
                              <span>${(annualFixed / (stNum.acres * AVERAGE_YIELD_TONS_PER_ACRE * BOTTLES_PER_TON)).toFixed(2)}</span>
                          </div>
                          <div className="h-5 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                              className="h-5 bg-vine-green-500 rounded-full flex items-center justify-end pr-2 text-xs text-white font-medium"
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
                          <span className="block text-2xl font-bold text-vine-green-700">${stNum.bottlePrice.toFixed(2)}</span>
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
                      <h4 className="text-md font-semibold text-vine-green-700 mb-3">Price Point Scenario Analysis</h4>
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
                              <tr key={i} className={price === stNum.bottlePrice ? "bg-vine-green-50" : ""}>
                              <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                                  ${price.toFixed(2)}
                                  {price === stNum.bottlePrice && <span className="ml-2 text-xs text-vine-green-500">(Current)</span>}
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
                  <h3 className="text-lg font-medium text-vine-green-700 mb-4">Market Strategy Recommendations</h3>
                  
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mb-6">
                      <h4 className="text-md font-semibold text-vine-green-700 mb-3">Optimal Price Point Analysis</h4>
                      <div className="h-64 mb-4 min-w-0">
                      <ResponsiveContainer
                        key={`rc-${location.pathname}-${activeTab}`}
                        width="100%"
                        height="100%"
                      >
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
                      <h4 className="text-md font-semibold text-vine-green-700 mb-3">Strategic Recommendations</h4>
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
  </div>
);

return (
  <div className="min-h-screen bg-white">
    <main className="w-full pt-0">

      {/* Hide the big vine-green-500 banner/logo when embedded */}
      {/*<ProjectBanner years={projYears} setYears={setProjYears} /> */}
 
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
        currentPlanId={planId}
        currentPlanName={currentPlanName}
        onPlanChange={handlePlanChange}
        onNewPlan={handleNewPlan}
        plans={plans}
       />
 
       {/* centered content container */}
       <div className="w-full">
         {MainUI}
       </div>
     </main>
   </div>
 );
}