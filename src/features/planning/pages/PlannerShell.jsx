// src/VineyardPlannerApp.jsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { supabase } from '@/shared/lib/supabaseClient';
import { savePlanner, loadPlanner} from '@/shared/lib/saveLoadPlanner';
import { savePlan, loadPlan, listPlans, createPlan } from '@/shared/lib/plansApi';
import { useSubscription } from "@/shared/hooks/useSubscription";
import {
  ChevronDown,
  TrendingUp,
  DollarSign,
  MapPin,
  FileText,
  ScrollText,
  Gem,
  Tractor,
  Sprout,
  HardHat,
  Check,
  Clock,
  Calendar,
  Wrench,
  Info,
  Building2,
  Warehouse,
  Truck,
  Package,
  CreditCard,
  PiggyBank,
  Wallet,
  Grape,
  ChevronLeft,
  ChevronRight,
  PanelLeftOpen,
  PanelLeftClose,
  Settings,
  Wine,
  ShoppingCart,
  Cog,
  Menu,
  BookOpen,
  Calculator
} from "lucide-react";
import {
  VineyardLayoutConfig,
  calculateVineyardLayout,
  calculateMaterialCosts,
  VINE_SPACING_OPTIONS
} from '@/features/planning/components/VineyardLayoutCalculator';
import { RevenueProjectionChart } from '@/features/planning/components/RevenueProjectionChart';
import { BusinessPlanReport } from '@/features/planning/components/BusinessPlanReport';


import { Card, CardContent } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { ConfirmDialog } from "@/shared/components/ui/ConfirmDialog";
import { PlanNameModal } from "@/shared/components/PlanNameModal";

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
import { useUsageLimits } from "@/shared/hooks/useUsageLimits";
import { SettingsView } from "@/shared/components/SettingsView";
import { DocLink } from '@/shared/components/DocLink';


/* ------------------------------------------------------------------ */
/*  ⚙️  TOP-OF-PAGE UI HELPERS (all inline – no extra files needed)   */
/* ------------------------------------------------------------------ */

// Helper function to format money without decimals
const formatMoney = (value) => Math.round(value).toLocaleString();

// Treat these as "non-persistent" — changes here should NOT trigger the dirty badge
const VOLATILE_KEYS = new Set([
  'calculatedLayout',
  'materialCosts',
  'lastComputed',
  '__temp',
  'updated_at',
  'created_at',
]);

function diffObjects(a, b, path = '') {
  const diffs = [];
  const aKeys = new Set(Object.keys(a || {}));
  const bKeys = new Set(Object.keys(b || {}));
  for (const k of new Set([...aKeys, ...bKeys])) {
    const p = path ? `${path}.${k}` : k;
    const av = a?.[k];
    const bv = b?.[k];
    const bothObjects =
      av && bv && typeof av === 'object' && typeof bv === 'object' &&
      !Array.isArray(av) && !Array.isArray(bv);

    if (bothObjects) {
      diffs.push(...diffObjects(av, bv, p));
      continue;
    }

    const same =
      (Array.isArray(av) && Array.isArray(bv) && JSON.stringify(av) === JSON.stringify(bv)) ||
      av === bv;

    if (!same) diffs.push({ path: p, a: av, b: bv });
  }
  return diffs;
}


// Deep-clone while dropping volatile keys & functions
function pruneAndNormalize(value, key = '') {
  if (VOLATILE_KEYS.has(key)) return undefined;

  if (Array.isArray(value)) {
    return value.map((v) => pruneAndNormalize(v));
  }

  if (value && typeof value === 'object') {
    const out = {};
    for (const k of Object.keys(value)) {
      const v = pruneAndNormalize(value[k], k);
      if (v !== undefined) out[k] = v;
    }
    return out;
  }

  // numeric-like string? normalize it to a number
  if (typeof value === 'string' && /^-?\d+(\.\d+)?$/.test(value.trim())) {
    const n = Number(value);
    // only convert if it's safe/finite (avoid IDs that look numeric but overflow)
    if (Number.isFinite(n)) return n;
  }

  // functions are never persisted
  if (typeof value === 'function') return undefined;

  return value;
}

// Produce a stable snapshot string for comparison / baseline
function makeSnapshot({ st, projYears, taskCompletion }) {
  return JSON.stringify({
    st: pruneAndNormalize(st),
    projYears: pruneAndNormalize(projYears),
    taskCompletion: pruneAndNormalize(taskCompletion),
  });
}


const ProjectBanner = ({ years, setYears }) => (
    <section
      className="relative rounded-xl overflow-hidden mb-0 mx-4 md:mx-8 border border-gray-200
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

/* ====== SIDEBAR ====== */
const Sidebar = ({
  active,
  setActive,
  projYears,
  setYears,
  sidebarOpen,
  setSidebarOpen,
  onSave,
  isSaving,
  dirty,
  currentPlanId,
  currentPlanName,
  onPlanChange,
  onNewPlan,
  currentTier,
  limits = {},
  plans,
  totalEstCost,
  showSettings,
  setShowSettings
}) => {
  const [showPlanMenu, setShowPlanMenu] = React.useState(false);
  const [isNavbarVisible, setIsNavbarVisible] = React.useState(true);
  const [lastScrollY, setLastScrollY] = React.useState(0);
  const [showToolsMenu, setShowToolsMenu] = React.useState(false);
  const planMenuRef = React.useRef(null);

  // Track navbar visibility
  React.useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY < 10) {
        setIsNavbarVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 64) {
        setIsNavbarVisible(false);
      } else if (currentScrollY < lastScrollY) {
        setIsNavbarVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const navigationItems = [
    { id: 'design', label: 'Vineyard Design', icon: Grape },
    { id: 'inputs', label: 'Financial Inputs', icon: DollarSign },
    { id: 'establishment', label: 'Vineyard Setup', icon: Sprout },
    { id: 'proj', label: `${projYears}-Year Plan`, icon: TrendingUp },
    { id: 'details', label: 'Business Plan', icon: FileText },
  ];

  // Check if user can create more plans
  const canCreateMorePlans = limits.plans === -1 || (plans?.length || 0) < limits.plans;

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (planMenuRef.current && !planMenuRef.current.contains(event.target)) {
        setShowPlanMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <aside
      className={`
        fixed left-0 top-0 h-screen bg-[#F5F6F7]
        transition-all duration-300 ease-in-out z-40
        print:hidden hidden lg:block
        ${sidebarOpen ? 'w-56' : 'w-20'}
      `}
    >
      {/* Sidebar Header Row */}
      <div className={`h-16 flex items-center flex-shrink-0 relative ${sidebarOpen ? 'justify-between px-4' : 'justify-center'}`}>
        {sidebarOpen ? (
          <>
            <Link to="/" className="flex-shrink-0">
              <img src="/Trellis_Logo/logo_symbol .png" alt="Trellis" className="h-8 w-8" />
            </Link>
            <div className="flex items-center gap-4">
              {/* Tools Menu */}
              <div className="relative group/menu">
                <Menu
                  className="w-[18px] h-[18px] text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
                  onClick={() => setShowToolsMenu(!showToolsMenu)}
                />
                {!showToolsMenu && (
                  <div className="absolute top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover/menu:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg">
                    Tools
                  </div>
                )}
                {showToolsMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowToolsMenu(false)} />
                    <div className="absolute top-8 left-0 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-50 py-2">
                      <Link
                        to="/planner"
                        className="flex items-center gap-3 px-4 py-2.5 text-gray-800 bg-gray-100"
                        onClick={() => setShowToolsMenu(false)}
                      >
                        <Calculator className="w-4 h-4" />
                        <span className="text-sm font-medium">Planner</span>
                      </Link>
                      <Link
                        to="/vineyard"
                        className="flex items-center gap-3 px-4 py-2.5 text-gray-600 hover:bg-gray-50 hover:text-gray-800 transition-colors"
                        onClick={() => setShowToolsMenu(false)}
                      >
                        <Grape className="w-4 h-4" />
                        <span className="text-sm font-medium">Operations</span>
                      </Link>
                      <Link
                        to="/production"
                        className="flex items-center gap-3 px-4 py-2.5 text-gray-600 hover:bg-gray-50 hover:text-gray-800 transition-colors"
                        onClick={() => setShowToolsMenu(false)}
                      >
                        <Wine className="w-4 h-4" />
                        <span className="text-sm font-medium">Production</span>
                      </Link>
                    </div>
                  </>
                )}
              </div>
              <Link to="/docs" className="relative group/docs">
                <BookOpen className="w-[18px] h-[18px] text-gray-500 hover:text-gray-800 transition-colors" />
                <div className="absolute top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover/docs:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg">
                  Docs
                </div>
              </Link>
              <div className="relative group/settings cursor-pointer" onClick={() => setShowSettings(true)}>
                <Settings className="w-[18px] h-[18px] text-gray-500 hover:text-gray-800 transition-colors" />
                <div className="absolute top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover/settings:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg">
                  Settings
                </div>
              </div>
              <div
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="cursor-pointer"
              >
                <PanelLeftClose className="w-[18px] h-[18px] text-gray-500 hover:text-gray-800 transition-colors" />
              </div>
            </div>
          </>
        ) : (
          <div
            onClick={() => setSidebarOpen(true)}
            className="relative group/expand cursor-pointer flex items-center justify-center"
          >
            <img src="/Trellis_Logo/logo_symbol .png" alt="Trellis" className="h-8 w-8 group-hover/expand:opacity-50 transition-opacity" />
            <PanelLeftOpen className="w-5 h-5 text-gray-500 absolute opacity-0 group-hover/expand:opacity-100 transition-opacity" />
          </div>
        )}
      </div>

      {/* Plans & Save Section - Only when expanded - positioned at top */}
      {sidebarOpen && (
        <div className="px-3 py-3 space-y-2 bg-[#F5F6F7] flex-shrink-0">
          {/* Plans Dropdown */}
          <div className="relative" ref={planMenuRef}>
            <button
              onClick={() => setShowPlanMenu(!showPlanMenu)}
              className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-vine-green-500 transition-colors"
            >
              <span className="text-gray-700 truncate">
                {currentPlanName || 'Default Plan'}
              </span>
              <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform flex-shrink-0 ${showPlanMenu ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {showPlanMenu && (
              <div className="absolute top-full left-0 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50">
                {/* Default Plan */}
                <button
                  onClick={() => {
                    onPlanChange('');
                    setShowPlanMenu(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                    !currentPlanId ? 'bg-vine-green-50 text-black font-bold font-medium' : 'text-gray-700'
                  }`}
                >
                  Default Plan
                </button>

                {/* Divider */}
                {plans && plans.length > 0 && (
                  <div className="border-t border-gray-200 my-2"></div>
                )}

                {/* User's Plans */}
                {plans && plans.map(plan => (
                  <button
                    key={plan.id}
                    onClick={() => {
                      onPlanChange(plan.id);
                      setShowPlanMenu(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                      currentPlanId === plan.id ? 'bg-vine-green-50 text-black font-bold font-medium' : 'text-gray-700'
                    }`}
                  >
                    {plan.name}
                  </button>
                ))}

                {/* Divider */}
                <div className="border-t border-gray-200 my-2"></div>

                {/* Plan Usage Indicator (for free tier) */}
                {currentTier === 'free' && limits?.plans > 0 && (
                  <div className="px-4 py-2 text-xs text-gray-500">
                    Plans: {plans.length}/{limits.plans} {plans.length >= limits.plans && '(limit reached)'}
                  </div>
                )}

                {/* Create New Plan */}
                <button
                  onClick={() => {
                    setShowPlanMenu(false);
                    onNewPlan();
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-vine-green-600 hover:bg-vine-green-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!canCreateMorePlans}
                >
                  + Create New Plan
                </button>
              </div>
            )}
          </div>

          {/* Smart Save Button */}
          <button
            onClick={onSave}
            disabled={isSaving || !dirty}
            className={`w-full px-4 py-2 text-sm rounded-lg font-semibold transition-all shadow-sm disabled:cursor-not-allowed ${
              dirty
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-vine-green-500 text-white cursor-default'
            }`}
          >
            {isSaving ? 'Saving…' : dirty ? 'Save' : 'Saved'}
          </button>
        </div>
      )}

      {/* Navigation Items - scrollable content */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 hide-scrollbar">
        <div className="space-y-3 w-full">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActive(item.id)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                  transition-all duration-200 group
                  ${isActive
                    ? 'bg-white text-gray-800 shadow-md'
                    : 'bg-transparent text-gray-700 hover:bg-white hover:text-gray-800 hover:shadow-sm'
                  }
                  ${!sidebarOpen && 'justify-center'}
                `}
                title={!sidebarOpen ? item.label : ''}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-gray-800' : 'group-hover:text-gray-800'}`} />
                {sidebarOpen && (
                  <span className="font-medium text-sm">{item.label}</span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Sidebar Footer - Years + Total - positioned at fixed location */}
      {sidebarOpen && (
        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-3 bg-[#F5F6F7]">
          {/* Years Selector */}
          <div>
            <label className="flex items-center justify-between text-xs text-gray-600 mb-1">
              <span className="font-medium">Project Years</span>
            </label>
            <Input
              type="number"
              min={1}
              max={30}
              value={projYears}
              onChange={(e) =>
                setYears(Math.max(1, Math.min(30, Number(e.target.value) || 1)))
              }
              className="w-full text-center"
            />
          </div>

          {/* Total Cost */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3 border border-purple-200">
            <p className="text-xs text-gray-600 mb-1">Total Est. Cost</p>
            <p className="text-lg font-bold text-purple-700">${formatMoney(totalEstCost)}</p>
          </div>
        </div>
      )}
    </aside>
  );
};

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
  <h1 className="text-2xl font-bold text-black font-bold border-b pb-3">
    {title}
  </h1>
);

// Card container for each section
const SectionCard = ({ title, children, className = "" }) => (
    <Card className="rounded-xl bg-white overflow-hidden mb-16 border border-gray-200"> {/* Increase mb-8 to mb-10 */}
      <div className="bg-vine-green-50 px-6 py-4 border-b"> {/* Increase py-3 to py-4 */}
        <h3 className="font-medium text-black font-bold text-lg">{title}</h3> {/* Add text-lg */}
      </div>
      <CardContent className={`p-8 ${className}`}> {/* Increase p-6 to p-8 */}
        {children}
      </CardContent>
    </Card>
  );

/* --------------------------------------------------------- */
/*  Re-usable collapsible card - Matching projection style   */
/* --------------------------------------------------------- */
function CollapsibleSection({ title, children, isOpen, onToggle }) {
  const open = isOpen;

  const handleToggle = () => {
    if (onToggle) {
      onToggle(title);
    }
  };

  // Icon mapping - each section gets its own lucide-react icon
  const getIcon = () => {
    const iconProps = { className: "w-9 h-9 text-vine-green-500", strokeWidth: 1.5 };

    switch(title) {
      case "Core Vineyard Parameters":
        return <Settings {...iconProps} />;
      case "Vineyard Setup":
        return <Building2 {...iconProps} />;
      case "Pre-Planting / Site-Prep":
        return <Tractor {...iconProps} />;
      case "Planting Costs":
        return <Sprout {...iconProps} />;
      case "Cultural Operations":
        return <Calendar {...iconProps} />;
      case "Harvest & Hauling":
        return <Grape {...iconProps} />;
      case "Cash Overhead":
        return <DollarSign {...iconProps} />;
      case "Equipment":
        return <Wrench {...iconProps} />;
      case "Loans":
        return <CreditCard {...iconProps} />;
      case "Purchased Grapes":
        return <ShoppingCart {...iconProps} />;
      case "Unsold Bottles":
        return <Wine {...iconProps} />;
      case "Assessments & Fees":
        return <FileText {...iconProps} />;
      case "Non-Cash Overhead":
        return <PiggyBank {...iconProps} />;
      case "Permits & Licenses":
        return <ScrollText {...iconProps} />;
      case "Marketing & Management":
        return <TrendingUp {...iconProps} />;
      case "Equipment Operating Costs":
        return <Cog {...iconProps} />;
      default:
        return <TrendingUp {...iconProps} />;
    }
  };

  return (
    <Card className="rounded-xl bg-white overflow-hidden mb-8 border border-gray-200 relative">
      {/* Subtle gradient accent in top-left corner */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-blue-100 via-blue-50 to-transparent opacity-40 rounded-br-full pointer-events-none" />
      
      {/* Clickable header */}
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between px-8 py-6 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset transition-all relative z-10"
      >
        <div className="flex items-center gap-4">
          {getIcon()}
          <h3 className="font-bold text-gray-800 text-2xl leading-none -translate-y-2">{title}</h3>
        </div>

        {/* Chevron */}
        <ChevronDown
          className={`h-5 w-5 text-blue-600 transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Subtitle/description bar */}
      <div className="px-8 pb-4 relative z-10">
        <p className="text-gray-500 text-sm">
          {title === "Core Vineyard Parameters" && "Configure your vineyard's basic financial parameters"}
          {title === "Vineyard Setup" && "One-time infrastructure and setup costs"}
          {title === "Pre-Planting / Site-Prep" && "Site preparation tasks before planting"}
          {title === "Planting Costs" && "Vine stock and planting materials"}
          {title === "Cultural Operations" && "Annual vineyard management activities"}
          {title === "Harvest & Hauling" && "Harvest services and transportation"}
          {title === "Assessments & Fees" && "Annual regulatory fees and assessments"}
          {title === "Cash Overhead" && "Annual cash operating expenses"}
          {title === "Non-Cash Overhead" && "Depreciation and non-cash expenses"}
          {title === "Equipment Operating Costs" && "Equipment fuel, maintenance, and operating costs"}
          {title === "Marketing & Management" && "Marketing and management services"}
          {title === "Permits & Licenses" && "Required permits and business licenses"}
          {title === "Equipment" && "Financed equipment purchases"}
          {title === "Loans" && "Loan financing options"}
          {title === "Purchased Grapes" && "Additional grape purchases for production"}
          {title === "Unsold Bottles" && "Bottles withheld from sale for aging or other purposes"}
        </p>
      </div>

      {/* Body - only rendered when open */}
      {open && (
        <CardContent className="p-8 pt-4 border-t border-gray-100">
          {children}
        </CardContent>
      )}
    </Card>
  );
}

  

export default function PlannerShell({ embedded = false }) {
  const [activeTab, setActiveTab]       = useState("design");
  const [projYears, setProjYears]       = useState(10)
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedChart, setSelectedChart] = useState("revenue");
  const [establishmentView, setEstablishmentView] = useState('breakdown');
  const [taskCompletion, setTaskCompletion] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sectionsState, setSectionsState] = useState({
    "Core Vineyard Parameters": true,
    "Vineyard Setup": true,
    "Pre-Planting / Site-Prep": true,
    "Planting Costs": true,
    "Cultural Operations": true,
    "Harvest & Hauling": true,
    "Assessments & Fees": true,
    "Cash Overhead": true,
    "Non-Cash Overhead": true,
    "Equipment Operating Costs": true,
    "Marketing & Management": true,
    "Permits & Licenses": true,
    "Equipment": true,
    "Loans": true,
    "Purchased Grapes": true,
    "Unsold Bottles": true,
  });

  const [plans, setPlans] = useState([]);
  const [currentPlanName, setCurrentPlanName] = useState('');
  const [upgradeDialog, setUpgradeDialog] = useState({ isOpen: false, message: '' });
  const [showPlanNameModal, setShowPlanNameModal] = useState(false);

  const toggleSection = (sectionTitle) => {
    setSectionsState(prev => ({
      ...prev,
      [sectionTitle]: !prev[sectionTitle]
    }));
  };

  const navigate = useNavigate();

  // Accept any of: /app/:id, /plans/:id, /app/:planId, etc.
  const params = useParams();
  const planId = params.id ?? params.planId ?? params.plan ?? null;

  // (optional – helpful while debugging)
  console.log('🧭 params:', params, '→ planId:', planId);
   // comes from route "/plans/:id"

  const location = useLocation();
  console.log('📍 Location in PlannerShell:', location.pathname);


  // Works for /app/:id, /plans/:id, /app/planner/:id, /x/y/:id, etc.
  // Right below: const location = useLocation();
  const replacePlanIdInUrl = React.useCallback(
    (nextId) => {
      const newPath = nextId ? `/planner/${nextId}` : `/planner`;
      navigate(newPath, { replace: true });
    },
    [navigate]
  );


  // Force scroll to top whenever tab changes + handle chart resizing
  useEffect(() => {
    console.log('🟡 Tab changed to:', activeTab);
    
    // FORCE SCROLL TO TOP IMMEDIATELY
    // Try all possible scroll targets
    window.scrollTo(0, 0);
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
    
    // Also check if main container is scrolling
    const mainElement = document.querySelector('main');
    if (mainElement) {
      mainElement.scrollTop = 0;
    }
    
    // Find any overflow containers and reset them
    const containers = document.querySelectorAll('.overflow-auto, .overflow-y-auto, .overflow-scroll');
    containers.forEach(container => {
      container.scrollTop = 0;
    });
    
    console.log('✅ Scrolled to top');
    
    // Then handle chart resizing for recharts (after scroll)
    if (['establishment', 'proj', 'details'].includes(activeTab)) {
      const id = requestAnimationFrame(() => {
        window.dispatchEvent(new Event('resize'));
      });
      return () => {
        cancelAnimationFrame(id);
      };
    }
  }, [activeTab]);

  const getYieldForYear = (year, yieldPerAcre = AVERAGE_YIELD_TONS_PER_ACRE, customYields = {}) => {
    // Check for custom override first
    if (customYields[year] !== undefined) {
      return customYields[year];
    }
    // Default yield ramp
    if (year <= 3) return 0;
    if (year === 4) return 1;
    if (year === 5) return 2.5;
    return yieldPerAcre;
  };

  const DEFAULT_ST = useMemo(() => ({
    acres: "1",
    bottlePrice: "28",
    landPrice: "60000",
    buildPrice: "25000",
    waterCost: "400",
    yieldPerAcre: "3.5",
    customYields: {},
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
      rowOrientation: "horizontal",
      trellisSystem: "VSP",
      shape: "rectangle",
      aspectRatio: 2,
      calculatedLayout: null,
      materialCosts: null
    },
    vineyardFields: [],

    setupYear: "0",
    setup: {
      sitePrep:   { include: true, cost: "1500" },
      trellis:    { include: true, cost: "4300" },
      irrigation: { include: true, system: "drip", cost: "4500" },
      vines:      { include: true, costPerVine: "3.50", unitType: "vine" }, // Changed to per-vine pricing
      fence:      { include: true, costPerFoot: "15", fenceType: "8ft-deer", unitType: "foot" }, // Changed to per-foot pricing
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
        { include: true, label: "Tractor fuel & maintenance", costPerAcre: "0", annualTotal: "2000" },
        // …
      ],
      marketing: [
        { include: true, label: "VMC fees", costPerAcre: "0", annualTotal: "2500" },
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
const hydratingRef = useRef(false);

// --- State mirrors (so baseline commits reflect the actual applied state)
const stRef = React.useRef(st);
const projYearsRef = React.useRef(projYears);
const taskCompletionRef = React.useRef(taskCompletion);

useEffect(() => { stRef.current = st; }, [st]);
useEffect(() => { projYearsRef.current = projYears; }, [projYears]);
useEffect(() => { taskCompletionRef.current = taskCompletion; }, [taskCompletion]);

// --- Auth context (SAFE destructure) ---
const auth = useAuth();
const user = auth?.user || null;
const { canCreatePlan, tier, limits } = useUsageLimits();



// --- Load current plan (or default planner) and commit a clean baseline
useEffect(() => {
  if (!user) return;
  let isCancelled = false;

  (async () => {
    hydratingRef.current = true;
    setLoading(true);
    setDirty(false); // ⭐ Clear dirty immediately

    const { data, error} = planId ? await loadPlan(planId) : await loadPlanner();
    if (error) {
      console.error('Load planner error', error);
      setLoading(false);
      hydratingRef.current = false;
      return;
    }

    if (!isCancelled && data) {
      // Apply loaded data to state with migration for old setup structure
      let loadedState = data?.st ? { ...DEFAULT_ST, ...data.st } : DEFAULT_ST;

      // Migrate old vine/fence data structure to new unit-based structure
      if (loadedState.setup) {
        if (loadedState.setup.vines && !loadedState.setup.vines.unitType) {
          // Old structure - migrate to new
          loadedState.setup.vines = {
            include: loadedState.setup.vines.include ?? true,
            costPerVine: "3.50",
            unitType: "vine"
          };
        }
        if (loadedState.setup.fence && !loadedState.setup.fence.unitType) {
          // Old structure - migrate to new
          loadedState.setup.fence = {
            include: loadedState.setup.fence.include ?? true,
            costPerFoot: "15",
            fenceType: "8ft-deer",
            unitType: "foot"
          };
        }
      }

      set(loadedState);
      setProjYears(data?.projYears ?? 10);
      setTaskCompletion(data?.taskCompletion ?? {});
      setLastSaved(new Date(data.savedAt || data.updated_at || Date.now()));
    } else if (!isCancelled) {
      // Defaults path
      console.log('📥 Loading defaults (no data)');
      set(DEFAULT_ST);
      setProjYears(10);
      setTaskCompletion({});
      setLastSaved(new Date());
    }

    setLoading(false);

    // ✅ Commit baseline from the *actual current state* after a longer delay
    setTimeout(() => {
      if (isCancelled) return;
      baselineRef.current = makeSnapshot({
        st: stRef.current,
        projYears: projYearsRef.current,
        taskCompletion: taskCompletionRef.current,
      });
      setDirty(false); // ⭐ Clear dirty again after baseline is set
      hydratingRef.current = false; // ⭐ Only clear hydrating flag AFTER baseline is committed
    }, 100); // Increased delay to ensure all state updates have settled
  })();

  return () => { isCancelled = true; };
}, [user, planId]);

// --- Load list of plans (for selector + current name)
useEffect(() => {
  if (!user) return;
  (async () => {
    const { data, error } = await listPlans();
    if (!error && data) {
      setPlans(data);
      if (planId) {
        const currentPlan = data.find(p => p.id === planId);
        if (currentPlan) setCurrentPlanName(currentPlan.name);
      }
    }
  })();
}, [user, planId]);

// --- Keep current plan name in sync with URL id + plans list
useEffect(() => {
  if (!planId || !plans?.length) {
    setCurrentPlanName('');
    return;
  }
  const p = plans.find(pl => pl.id === planId);
  setCurrentPlanName(p ? p.name : '');
}, [planId, plans]);

// --- Track unsaved changes vs. baseline (skip during hydration/loading)
useEffect(() => {
  if (hydratingRef.current || loading || !baselineRef.current || !lastSaved) {
    console.log('⏸️  Dirty tracking blocked:', { 
      hydrating: hydratingRef.current, 
      loading, 
      hasBaseline: !!baselineRef.current,
      hasLastSaved: !!lastSaved 
    });
    return;
  }

  const currentStr = makeSnapshot({ st, projYears, taskCompletion });
  const isDirty = currentStr !== baselineRef.current;

  // Optional debug (safe to remove)
  if (isDirty) {
    try {
      const baseObj = JSON.parse(baselineRef.current);
      const currObj = JSON.parse(currentStr);
      const diffs = diffObjects(baseObj, currObj);
      console.groupCollapsed('🔎 Dirty diffs');
      console.table(diffs.slice(0, 20));
      if (diffs.length > 20) console.log(`(+${diffs.length - 20} more)`);
      console.groupEnd();
    } catch {}
  }

  setDirty(prev => (prev !== isDirty ? isDirty : prev));
}, [st, projYears, taskCompletion, lastSaved, loading]);

// --- (Optional) defend against React Strict Mode double-invoke baseline drift
useEffect(() => {
  if (!hydratingRef.current && baselineRef.current == null) {
    baselineRef.current = makeSnapshot({
      st: stRef.current,
      projYears: projYearsRef.current,
      taskCompletion: taskCompletionRef.current,
    });
  }
  // run once post-mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

// --- Helpers
const setWithLog = (newState) => {
  console.log('🔥 SET CALLED', new Error().stack);
  set(newState);
};

// --- Change plan by updating the URL only (load happens in the effect above)
const handlePlanChange = (nextId) => {
  console.log('🔄 handlePlanChange (URL-only):', { nextId, currentPlanId: planId });

  if (dirty && !window.confirm('You have unsaved changes. Switch plans anyway?')) {
    return;
  }

  hydratingRef.current = true;
  setDirty(false); // Clear dirty flag immediately

  // Optimistically reflect name in header
  if (nextId) {
    const p = plans.find(pl => pl.id === nextId);
    setCurrentPlanName(p ? p.name : '');
  } else {
    setCurrentPlanName('');
  }

  // Do NOT fetch here. Just change the URL; useEffect([user, planId]) will load/apply.
  replacePlanIdInUrl(nextId || '');
};


  // Navigate to a different plan
  // Create new plan
  const handleNewPlan = async () => {
    if (!user) {
      alert('Sign in to create a plan.');
      return;
    }

    // Check if user can create more plans
    const planCheck = canCreatePlan();
    if (!planCheck.allowed) {
      const upgradeMessage = tier === 'free'
        ? `You've reached your plan limit (${limits.plans} plan). Upgrade to Vineyard ($29/mo) for unlimited plans!`
        : `You've reached your plan limit (${planCheck.limit} plans). Upgrade to get more plans!`;

      setUpgradeDialog({ isOpen: true, message: upgradeMessage });
      return;
    }

    // Open the custom modal
    setShowPlanNameModal(true);
  };

  // Handle plan creation after name is entered
  const handleCreatePlanWithName = async (planName) => {
    setShowPlanNameModal(false);
    
    console.log('📝 Creating new plan:', planName);

    try {
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
        
        hydratingRef.current = true;
        setDirty(false);
        
        replacePlanIdInUrl(data.id);
        
        // Update current plan name
        setCurrentPlanName(planName);
        setLastSaved(new Date());
        
        requestAnimationFrame(() => {
          baselineRef.current = makeSnapshot({
            st: stRef.current,
            projYears: projYearsRef.current,
            taskCompletion: taskCompletionRef.current,
          });
          hydratingRef.current = false;
        });
        
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
      baselineRef.current = makeSnapshot({ st, projYears, taskCompletion });

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
  yieldPerAcre:    Number(st.yieldPerAcre) || 3.5,
  insCost:         Number(st.insCost)     || 0,
  insInclude:      !!st.insInclude,
  licenseCost:     Number(st.licenseCost) || 0,
  availableEquity: Number(st.availableEquity) || 0,
  setupYear:       Number(st.setupYear)   || 0,

  // one-time setup costs per acre
  setup: Object.fromEntries(
    Object.entries(st.setup).map(([k,v]) => {
      if (k === 'vines' && v.unitType === 'vine') {
        // Calculate cost per acre based on vines per acre
        const vinesPerAcre = st.vineyardLayout?.calculatedLayout?.vineLayout?.vinesPerAcre || 726; // Default
        const costPerVine = Number(v.costPerVine) || 3.50;
        const costPerAcre = vinesPerAcre * costPerVine;
        return [k, {
          include: v.include,
          cost: costPerAcre,
          costPerVine,
          vinesPerAcre,
          unitType: 'vine',
          ...(v.system && { system: v.system })
        }];
      } else if (k === 'fence' && v.unitType === 'foot') {
        // Calculate cost per acre based on perimeter
        const acres = Number(st.acres) || 1;
        const perimeter = st.vineyardLayout?.calculatedLayout?.dimensions?.perimeter ||
                         (Math.sqrt(acres * 43560) * 4); // Default: assume square
        const costPerFoot = Number(v.costPerFoot) || 15;
        const totalCost = perimeter * costPerFoot;
        const costPerAcre = totalCost / acres;
        return [k, {
          include: v.include,
          cost: costPerAcre,
          costPerFoot,
          perimeter: Math.round(perimeter),
          fenceType: v.fenceType || '8ft-deer',
          unitType: 'foot',
          ...(v.system && { system: v.system })
        }];
      } else {
        return [k, { include: v.include, cost: Number(v.cost) || 0, ...(v.system && { system: v.system }) }];
      }
    })
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
    costPerAcre: Number(r.costPerAcre) || 0,
    annualTotal: Number(r.annualTotal) || 0
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

    // 5) Harvest & Hauling
    // NOTE: Each harvest item should use EITHER costPerAcre OR costPerTon, not both
    // - costPerAcre is included in harvestAnnual (fixed cost)
    // - costPerTon is added per-year in projection loop (variable cost based on actual yield)
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
    .reduce((sum, i) => {
      // Use annualTotal if provided, otherwise calculate from costPerAcre
      const cost = i.annualTotal > 0 ? i.annualTotal : (i.costPerAcre * stNum.acres);
      return sum + cost;
    }, 0);

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

  // Maximum potential revenue at full production (assumes all bottles/grapes sold)
  const maxPotentialRevenue =
  st.salesMode === "wine"
    ? stNum.acres * stNum.yieldPerAcre * BOTTLES_PER_TON * stNum.bottlePrice
    : stNum.acres * stNum.yieldPerAcre * stNum.grapeSalePrice;   // $/ton

  const maxPotentialNet = maxPotentialRevenue - annualFixed;

  const isWine         = st.salesMode === "wine";
  // Cost per ton at full production (based on mature yield)
  const denomTons = stNum.acres * stNum.yieldPerAcre;
  const costPerTonAtFullProduction = denomTons > 0 ? (annualFixed / denomTons) : 0;
  const grapePrice = Number(stNum.grapeSalePrice || 0);
  const grossMarginTon = grapePrice - costPerTonAtFullProduction;

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

    const yieldPA = getYieldForYear(year, stNum.yieldPerAcre, st.customYields || {});
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


    // Harvest per-ton variable costs (yield-dependent, added per year)
    // NOTE: This is separate from costPerAcre which was already included in baseAnnualCost
    // Each harvest item should use EITHER costPerAcre OR costPerTon to avoid double-counting
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

  const update = (k, v) => set(prev => ({ ...prev, [k]: v }));
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

  const updateCustomYield = (year, value) => {
    const newCustomYields = { ...(st.customYields || {}) };
    if (value === null || value === undefined || value === '') {
      delete newCustomYields[year];
    } else {
      newCustomYields[year] = Number(value);
    }
    update("customYields", newCustomYields);
  };

// Store layout update to apply it properly
const handleLayoutChange = (layout, materialCosts) => {
  if (!layout || !materialCosts) return;

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

    // 2. Update trellis and irrigation costs
    const acres = Number(prev.acres) || 1;
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

    // 3. Return new state with calculatedLayout
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
};

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
      bg: "from-vine-green-50 to-vine-green-100",
      border: "border-vine-green-200",
      text: "text-black font-bold",
      value: "text-vine-green-900",
      iconBg: "bg-vine-green-100",
      iconColor: "text-vine-green-500"
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
      icon: <Sprout className="w-6 h-6 text-vine-green-500" strokeWidth={1.5} />,
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
      icon: <Building2 className="w-6 h-6 text-vine-green-500" strokeWidth={1.5} />,
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
      bg: 'bg-vine-green-50',
      text: 'text-black font-bold',
      icon: 'bg-vine-green-100 text-vine-green-500',
      border: 'border-vine-green-200',
      check: 'bg-vine-green-500 border-vine-green-500'
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
            className="bg-vine-green-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Financial Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-vine-green-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-vine-green-500">
              ${formatMoney(investedAmount)}
            </div>
            <div className="text-sm text-gray-600 mt-1">Invested</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-orange-600">
              ${formatMoney(remainingAmount)}
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
                              ${formatMoney(task.cost)}
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
                            <span>${formatMoney(task.cost)}</span>
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

      <div className="max-w-7xl pl-0 pr-4 sm:pr-6 lg:pr-8 pb-16">

      {/* NEW VINEYARD DESIGN TAB */}
      {activeTab === "design" && (
        <div className="space-y-8">
          {/* Header */}
          <div className="pt-4">
            <h1 className="text-2xl font-bold text-gray-900">Vineyard Design</h1>
            <p className="text-sm text-gray-500 mt-1">
              Design your vineyard layout using our interactive map or auto-layout calculator. Configure row spacing, vine spacing, and field boundaries. <DocLink docId="planner/vineyard-design" />
            </p>
          </div>

          <VineyardLayoutConfig
            acres={stNum.acres}
            onLayoutChange={handleLayoutChange}
            currentLayout={st.vineyardLayout}
            onAcresChange={(value) => update("acres", value)}
            savedFields={st.vineyardFields || []}
            onFieldsChange={(fields) => update("vineyardFields", fields)}
            onConfigChange={(config) => {
              set(prev => ({
                ...prev,
                vineyardLayout: {
                  ...prev.vineyardLayout,
                  ...config,
                  // Preserve calculatedLayout and materialCosts
                  calculatedLayout: prev.vineyardLayout.calculatedLayout,
                  materialCosts: prev.vineyardLayout.materialCosts
                }
              }));
            }}
          />
        </div>
      )}
      
      {/* INPUTS TAB */}
      {activeTab === "inputs" && (
        <div className="space-y-8">
          <div className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Financial Inputs</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Set up your vineyard's financial blueprint, from land and equipment to annual operating costs. <DocLink docId="planner/financial-inputs" />
                </p>
              </div>
              <button
                onClick={() => {
                  const allOpen = Object.values(sectionsState).every(v => v);
                  const newState = {};
                  Object.keys(sectionsState).forEach(key => {
                    newState[key] = !allOpen;
                  });
                  setSectionsState(newState);
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors flex-shrink-0"
              >
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-300 ${
                    Object.values(sectionsState).every(v => v) ? "rotate-180" : ""
                  }`}
                />
                {Object.values(sectionsState).every(v => v) ? "Collapse All" : "Expand All"}
              </button>
            </div>
          </div>

          {!st.vineyardLayout?.calculatedLayout && (!st.vineyardFields || st.vineyardFields.length === 0 || !st.vineyardFields.some(f => f.polygonPath && f.polygonPath.length > 0)) && (
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

          {/* Loading state - fields exist but layout not calculated yet */}
          {!st.vineyardLayout?.calculatedLayout && st.vineyardFields && st.vineyardFields.length > 0 && st.vineyardFields.some(f => f.polygonPath && f.polygonPath.length > 0) && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-blue-600">ℹ️</span>
                <div>
                  <h4 className="font-medium text-blue-800">Calculating Vineyard Layout...</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Your field data is loading. The layout will appear shortly.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Core Inputs */}
          <CollapsibleSection isOpen={sectionsState["Core Vineyard Parameters"]} onToggle={toggleSection} title="Core Vineyard Parameters">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-8">
              <div>
                <label className="text-sm text-black font-bold font-medium block mb-2">Acres</label>
                {num("acres")}
              </div>
              <div>
                <label className="text-sm text-black font-bold font-medium block mb-2">Land Price ($/acre)</label>
                {num("landPrice", 1000)}
              </div>
              <div>
                <label className="text-sm text-black font-bold font-medium block mb-2">
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
              {st.salesMode === "wine" && (
                <div>
                  <label className="text-sm text-black font-bold font-medium block mb-2">
                    Bottle Price ($)
                  </label>
                  {num("bottlePrice", 0.5)}
                </div>
              )}
              {/* ——— SALES STRATEGY ——— */}

              {st.salesMode === "grapes" && (
                <div>
                  <label className="text-sm text-black font-bold font-medium block mb-2">
                    Grape Sale Price ($ / ton)
                  </label>
                  {num("grapeSalePrice", 10)}
                </div>
              )}
              <div>
                <label className="text-sm text-black font-bold font-medium block mb-2">
                  Yield (t/acre)
                </label>
                {num("yieldPerAcre", 0.1)}
                <p className="text-xs text-gray-500 mt-1">Expected yield at full maturity (default: 3.5 tons/acre)</p>
              </div>
              <div>
                <label>Operating Cost ($/yr)</label>
                    <Input
                        readOnly
                        value={dynamicOperatingCost.toFixed(0)}
                        className="bg-gray-100 text-sm"
                    />
              </div>
              <div>
                <label className="text-sm text-black font-bold font-medium block mb-2">Water Cost ($/acre-yr)</label>
                {num("waterCost", 10)}
              </div>
              <div>
                <label className="text-sm text-black font-bold font-medium block mb-2">Build Cost ($/acre)</label>
                {num("buildPrice", 1000)}
              </div>
              <div>
                <label className="text-sm text-black font-bold font-medium block mb-2">Setup Year</label>
                {num("setupYear", 1)}
              </div>
              <div>
                <label className="text-sm text-black font-bold font-medium block mb-2">License Cost ($)</label>
                {num("licenseCost", 100)}
              </div>
              <div>
                <label className="text-sm text-black font-bold font-medium block mb-2">
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
          <CollapsibleSection isOpen={sectionsState["Vineyard Setup"]} onToggle={toggleSection} title="Vineyard Setup">
            <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-vine-green-50 border-b border-gray-200">
                    <th className="text-left p-4 text-sm text-black font-bold">Include</th>
                    <th className="text-left p-4 text-sm text-black font-bold">Item</th>
                    <th className="text-left p-4 text-sm text-black font-bold">Configuration</th>
                    <th className="text-right p-4 text-sm text-black font-bold">Cost/Acre</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {Object.entries(stNum.setup).map(([k, obj]) => {
                    const label = k.charAt(0).toUpperCase() + k.slice(1);
                    const isCalculated = obj.calculated;

                    return (
                      <tr key={k} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4">
                          <Checkbox
                            checked={obj.include}
                            onCheckedChange={v => updateSetup(k, { ...obj, include: v })}
                            className="h-5 w-5"
                          />
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 capitalize">{label}</span>
                            {k === "vines" && obj.unitType === 'vine' && (
                              <div className="relative group">
                                <Info className="h-3.5 w-3.5 text-gray-400 hover:text-vine-green-600 cursor-help transition-colors" />
                                <div className="absolute left-0 top-5 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 pointer-events-none">
                                  <div className="w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl border border-gray-700">
                                    Typical vine costs: Grafted vines $3-6/vine, Own-rooted $2-4/vine
                                  </div>
                                </div>
                              </div>
                            )}
                            {k === "fence" && obj.unitType === 'foot' && (
                              <div className="relative group">
                                <Info className="h-3.5 w-3.5 text-gray-400 hover:text-vine-green-600 cursor-help transition-colors" />
                                <div className="absolute left-0 top-5 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 pointer-events-none">
                                  <div className="w-80 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl border border-gray-700">
                                    Deer fencing is essential to protect vines! 8ft minimum recommended. Typical costs: 6ft Standard $8/ft, 8ft Deer $15/ft, 10ft High-Tensile $22/ft
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          {isCalculated ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs bg-vine-green-100 text-vine-green-800 px-2 py-1 rounded">
                                Auto-calculated
                              </span>
                              <button
                                onClick={() => setActiveTab("design")}
                                className="text-xs text-vine-green-600 hover:text-black font-bold underline"
                              >
                                Edit in Design →
                              </button>
                            </div>
                          ) : k === "vines" && obj.unitType === 'vine' ? (
                            <div className="flex items-center gap-2">
                              <Input
                                className="w-20 bg-white text-sm"
                                type="number"
                                step="0.50"
                                value={st.setup.vines.costPerVine}
                                onChange={e => updateSetup(k, { ...st.setup.vines, costPerVine: e.target.value })}
                              />
                              <span className="text-sm text-gray-600">$/vine × {obj.vinesPerAcre?.toLocaleString()}/acre</span>
                            </div>
                          ) : k === "fence" && obj.unitType === 'foot' ? (
                            <div className="flex items-center gap-2">
                              <select
                                className="border p-1.5 rounded text-sm bg-white"
                                value={st.setup.fence.fenceType || '8ft-deer'}
                                onChange={e => {
                                  const costs = {'6ft-standard': '15', '8ft-deer': '25', '10ft-deer': '35'};
                                  updateSetup(k, { ...st.setup.fence, fenceType: e.target.value, costPerFoot: costs[e.target.value] });
                                }}
                              >
                                <option value="6ft-standard">6ft Standard</option>
                                <option value="8ft-deer">8ft Deer</option>
                                <option value="10ft-deer">10ft Deer</option>
                              </select>
                              <Input
                                className="w-16 bg-white text-sm"
                                type="number"
                                step="1"
                                value={st.setup.fence.costPerFoot}
                                onChange={e => updateSetup(k, { ...st.setup.fence, costPerFoot: e.target.value })}
                              />
                              <span className="text-sm text-gray-600">$/ft × {obj.perimeter?.toLocaleString()} ft</span>
                            </div>
                          ) : k === "irrigation" ? (
                            <div className="flex items-center gap-2">
                              <select
                                className="border p-1.5 rounded text-sm bg-white"
                                value={obj.system}
                                onChange={e => updateSetup(k, { ...obj, system: e.target.value, cost: IRRIG_OPTIONS.find(o => o.key === e.target.value).defaultCost })}
                              >
                                {IRRIG_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
                              </select>
                              <Input
                                className="w-24 bg-white text-sm"
                                type="number"
                                step="100"
                                value={obj.cost}
                                onChange={e => updateSetup(k, { ...obj, cost: (e.target.value) })}
                              />
                              <span className="text-sm text-gray-600">$/acre</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Input
                                className="w-24 bg-white text-sm"
                                type="number"
                                step="100"
                                value={obj.cost}
                                onChange={e => updateSetup(k, { ...obj, cost: (e.target.value) })}
                              />
                              <span className="text-sm text-gray-600">$/acre</span>
                            </div>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <span className="font-semibold text-gray-900 text-lg">${formatMoney(obj.cost)}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
            </table>
          </CollapsibleSection>

          {/* Pre-Planting / Site-Prep */}
        <CollapsibleSection isOpen={sectionsState["Pre-Planting / Site-Prep"]} onToggle={toggleSection} title="Pre-Planting / Site-Prep">
        <div className="overflow-x-auto">
            <table className="w-full min-w-max">
            <thead>
                <tr className="bg-vine-green-50">
                <th className="text-left p-3 text-xs text-black font-bold">Include</th>
                <th className="text-left p-3 text-xs text-black font-bold">Task</th>
                <th className="text-left p-3 text-xs text-black font-bold">$/acre</th>
                <th className="text-left p-3 text-xs text-black font-bold">Actions</th>
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
        <CollapsibleSection isOpen={sectionsState["Planting Costs"]} onToggle={toggleSection} title="Planting Costs">
          {st.vineyardLayout?.calculatedLayout && (
            <div className="mb-4 p-4 bg-vine-green-50 rounded-lg">
              <h4 className="font-medium text-vine-green-800 mb-2">Calculated Vine Requirements</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-black font-bold">Total Vines:</span>
                  <div className="font-semibold">{st.vineyardLayout.calculatedLayout.vineLayout.totalVines.toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-black font-bold">Vines/Acre:</span>
                  <div className="font-semibold">{Math.round(st.vineyardLayout.calculatedLayout.vineLayout.vinesPerAcre)}</div>
                </div>
                <div>
                  <span className="text-black font-bold">Spacing:</span>
                  <div className="font-semibold">{st.vineyardLayout.calculatedLayout.spacing.vine}' × {st.vineyardLayout.calculatedLayout.spacing.row}'</div>
                </div>
                <div>
                  <span className="text-black font-bold">Rows:</span>
                  <div className="font-semibold">{st.vineyardLayout.calculatedLayout.vineLayout.numberOfRows}</div>
                </div>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full min-w-max">
              <thead>
                <tr className="bg-vine-green-50">
                  <th className="text-left p-3 text-xs text-black font-bold">Include</th>
                  <th className="text-left p-3 text-xs text-black font-bold">Item</th>
                  <th className="text-left p-3 text-xs text-black font-bold">Unit Cost</th>
                  <th className="text-left p-3 text-xs text-black font-bold">Qty/acre</th>
                  <th className="text-left p-3 text-xs text-black font-bold">Cost/acre</th>
                  <th className="text-left p-3 text-xs text-black font-bold">Actions</th>
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
        <CollapsibleSection isOpen={sectionsState["Cultural Operations"]} onToggle={toggleSection} title="Cultural Operations">
        <div className="overflow-x-auto">
            <table className="w-full min-w-max">
            <thead>
                <tr className="bg-vine-green-50">
                <th className="text-left p-3 text-xs text-black font-bold">Include</th>
                <th className="text-left p-3 text-xs text-black font-bold">Operation</th>
                <th className="text-left p-3 text-xs text-black font-bold">$/acre</th>
                <th className="text-left p-3 text-xs text-black font-bold">Actions</th>
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
        <CollapsibleSection isOpen={sectionsState["Harvest & Hauling"]} onToggle={toggleSection} title="Harvest & Hauling">
        <div className="mb-3 p-3 bg-blue-50 border-l-4 border-blue-400 rounded text-sm">
          <p className="font-medium text-blue-900">Important: Use either $/acre OR $/ton for each service, not both.</p>
          <p className="text-blue-700 mt-1">Per-acre costs are fixed annually. Per-ton costs vary with actual harvest yield.</p>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full min-w-max">
            <thead>
                <tr className="bg-vine-green-50">
                <th className="text-left p-3 text-xs text-black font-bold">Include</th>
                <th className="text-left p-3 text-xs text-black font-bold">Service</th>
                <th className="text-left p-3 text-xs text-black font-bold">$/acre</th>
                <th className="text-left p-3 text-xs text-black font-bold">$/ton</th>
                <th className="text-left p-3 text-xs text-black font-bold">Actions</th>
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
        <CollapsibleSection isOpen={sectionsState["Assessments & Fees"]} onToggle={toggleSection} title="Assessments & Fees">
        <div className="overflow-x-auto">
            <table className="w-full min-w-max">
            <thead>
                <tr className="bg-vine-green-50">
                <th className="text-left p-3 text-xs text-black font-bold">Include</th>
                <th className="text-left p-3 text-xs text-black font-bold">Fee</th>
                <th className="text-left p-3 text-xs text-black font-bold">$/acre</th>
                <th className="text-left p-3 text-xs text-black font-bold">Actions</th>
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
        <CollapsibleSection isOpen={sectionsState["Cash Overhead"]} onToggle={toggleSection} title="Cash Overhead">
        <div className="overflow-x-auto">
            <table className="w-full min-w-max">
            <thead>
                <tr className="bg-vine-green-50">
                <th className="text-left p-3 text-xs text-black font-bold">Include</th>
                <th className="text-left p-3 text-xs text-black font-bold">Expense</th>
                <th className="text-left p-3 text-xs text-black font-bold">Annual $</th>
                <th className="text-left p-3 text-xs text-black font-bold">Actions</th>
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
        <CollapsibleSection isOpen={sectionsState["Non-Cash Overhead"]} onToggle={toggleSection} title="Non-Cash Overhead">
        <div className="overflow-x-auto">
            <table className="w-full min-w-max">
            <thead>
                <tr className="bg-vine-green-50">
                <th className="text-left p-3 text-xs text-black font-bold">Include</th>
                <th className="text-left p-3 text-xs text-black font-bold">Category</th>
                <th className="text-left p-3 text-xs text-black font-bold">Annual $</th>
                <th className="text-left p-3 text-xs text-black font-bold">Actions</th>
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
        <CollapsibleSection isOpen={sectionsState["Equipment Operating Costs"]} onToggle={toggleSection} title="Equipment Operating Costs">
        <div className="mb-4 p-4 bg-blue-50 border-l-4 border-blue-400 rounded text-sm">
          <p className="font-medium text-blue-900">Farm equipment operating costs: fuel, lubrication, repairs, and maintenance.</p>
          <p className="text-blue-700 mt-1">Enter either $/Acre OR Annual Total. Entering one auto-calculates the other based on your acreage.</p>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full min-w-max">
            <thead>
                <tr className="bg-vine-green-50">
                <th className="text-left p-3 text-xs text-black font-bold">Include</th>
                <th className="text-left p-3 text-xs text-black font-bold">Equipment</th>
                <th className="text-left p-3 text-xs text-black font-bold">$/Acre</th>
                <th className="text-left p-3 text-xs text-black font-bold">Annual Total ($)</th>
                <th className="text-left p-3 text-xs text-black font-bold">Actions</th>
                </tr>
            </thead>
            <tbody>
                {stNum.equipmentOps.map((row,i)=>{
                const costPerAcre = Number(row.costPerAcre) || 0;
                const annualTotal = Number(row.annualTotal) || 0;

                // Calculate the display values based on which field was edited
                const displayAnnual = annualTotal > 0 ? annualTotal : (costPerAcre * stNum.acres);
                const displayPerAcre = costPerAcre > 0 ? costPerAcre : (stNum.acres > 0 ? annualTotal / stNum.acres : 0);

                return (
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
                        className="w-40 bg-white text-sm"
                        value={row.label}
                        onChange={e=>{
                        const next=[...stNum.equipmentOps]; next[i].label=e.target.value; update("equipmentOps",next);
                        }}
                        placeholder="Tractor fuel/maintenance"
                    />
                    </td>
                    <td className="p-3">
                    <Input
                        type="number" step="0.01"
                        className="w-24 bg-white text-sm"
                        value={displayPerAcre || ''}
                        onChange={e=>{
                        const next=[...stNum.equipmentOps];
                        next[i].costPerAcre = e.target.value;
                        next[i].annualTotal = 0; // Clear annual when per-acre is edited
                        update("equipmentOps",next);
                        }}
                    />
                    </td>
                    <td className="p-3">
                    <Input
                        type="number" step="0.01"
                        className="w-24 bg-white text-sm"
                        value={displayAnnual || ''}
                        onChange={e=>{
                        const next=[...stNum.equipmentOps];
                        next[i].annualTotal = e.target.value;
                        next[i].costPerAcre = 0; // Clear per-acre when annual is edited
                        update("equipmentOps",next);
                        }}
                    />
                    </td>
                    <td className="p-3">
                    <button
                        className="text-red-600 hover:text-red-800 p-1 text-sm"
                        onClick={()=>update("equipmentOps",stNum.equipmentOps.filter((_,j)=>j!==i))}
                    >
                        Remove
                    </button>
                    </td>
                </tr>
                )})}
            </tbody>
            </table>
            <AddButton
            text="Add Equipment Operating Cost"
            onClick={()=>update("equipmentOps",[...stNum.equipmentOps,{ include:false,label:"",costPerAcre:0,annualTotal:0 }])}
            />
        </div>
        </CollapsibleSection>

        {/* Marketing & Management */}
        <CollapsibleSection isOpen={sectionsState["Marketing & Management"]} onToggle={toggleSection} title="Marketing & Management">
        <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded mb-4">
          <p className="font-medium text-blue-900">Marketing, sales, and management costs.</p>
          <p className="text-blue-700 mt-1">Enter either $/Acre OR Annual Total. Entering one auto-calculates the other based on your acreage.</p>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full min-w-max">
            <thead>
                <tr className="bg-vine-green-50">
                <th className="text-left p-3 text-xs text-black font-bold">Include</th>
                <th className="text-left p-3 text-xs text-black font-bold">Service</th>
                <th className="text-left p-3 text-xs text-black font-bold">$/Acre</th>
                <th className="text-left p-3 text-xs text-black font-bold">Annual Total ($)</th>
                <th className="text-left p-3 text-xs text-black font-bold">Actions</th>
                </tr>
            </thead>
            <tbody>
                {stNum.marketing.map((row,i)=>{
                const costPerAcre = Number(row.costPerAcre) || 0;
                const annualTotal = Number(row.annualTotal) || 0;

                // Calculate the display values based on which field was edited
                const displayAnnual = annualTotal > 0 ? annualTotal : (costPerAcre * stNum.acres);
                const displayPerAcre = costPerAcre > 0 ? costPerAcre : (stNum.acres > 0 ? annualTotal / stNum.acres : 0);

                return (
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
                        className="w-40 bg-white text-sm"
                        value={row.label}
                        onChange={e=>{
                        const next=[...stNum.marketing]; next[i].label=e.target.value; update("marketing",next);
                        }}
                        placeholder="Marketing expense"
                    />
                    </td>
                    <td className="p-3">
                    <Input
                        type="number" step="0.01"
                        className="w-24 bg-white text-sm"
                        value={displayPerAcre || ''}
                        onChange={e=>{
                        const next=[...stNum.marketing];
                        next[i].costPerAcre = e.target.value;
                        next[i].annualTotal = 0; // Clear annual when per-acre is edited
                        update("marketing",next);
                        }}
                    />
                    </td>
                    <td className="p-3">
                    <Input
                        type="number" step="0.01"
                        className="w-24 bg-white text-sm"
                        value={displayAnnual || ''}
                        onChange={e=>{
                        const next=[...stNum.marketing];
                        next[i].annualTotal = e.target.value;
                        next[i].costPerAcre = 0; // Clear per-acre when annual is edited
                        update("marketing",next);
                        }}
                    />
                    </td>
                    <td className="p-3">
                    <button
                        className="text-red-600 hover:text-red-800 p-1 text-sm"
                        onClick={()=>update("marketing",stNum.marketing.filter((_,j)=>j!==i))}
                    >
                        Remove
                    </button>
                    </td>
                </tr>
                )})}
            </tbody>
            </table>
            <AddButton
            text="Add Marketing Item"
            onClick={()=>update("marketing",[...stNum.marketing,{ include:false,label:"",costPerAcre:0,annualTotal:0 }])}
            />
        </div>
        </CollapsibleSection>

        <CollapsibleSection isOpen={sectionsState["Permits & Licenses"]} onToggle={toggleSection} title="Permits & Licenses">
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
                    <span className="flex-1 text-sm text-black font-bold">{p.label}</span>
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
          <CollapsibleSection isOpen={sectionsState["Equipment"]} onToggle={toggleSection} title="Equipment">
            <div className="overflow-x-auto">
              <table className="w-full min-w-max">
                <thead>
                  <tr className="bg-vine-green-50">
                    <th className="text-left p-3 text-xs text-black font-bold">Include</th>
                    <th className="text-left p-3 text-xs text-black font-bold">Equipment</th>
                    <th className="text-left p-3 text-xs text-black font-bold">Price ($)</th>
                    <th className="text-left p-3 text-xs text-black font-bold">Rate (%)</th>
                    <th className="text-left p-3 text-xs text-black font-bold">Term (yrs)</th>
                    <th className="text-left p-3 text-xs text-black font-bold">$/mo</th>
                    <th className="text-left p-3 text-xs text-black font-bold">Actions</th>
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
        <CollapsibleSection isOpen={sectionsState["Loans"]} onToggle={toggleSection} title="Loans">
        <div className="overflow-x-auto">
            <table className="w-full min-w-max">
            <thead>
                <tr className="bg-vine-green-50">
                <th className="text-left p-3 text-xs text-black font-bold">Include</th>
                <th className="text-left p-3 text-xs text-black font-bold">Label</th>
                <th className="text-left p-3 text-xs text-black font-bold">Principal ($)</th>
                <th className="text-left p-3 text-xs text-black font-bold">Rate (%)</th>
                <th className="text-left p-3 text-xs text-black font-bold">Term (yrs)</th>
                <th className="text-left p-3 text-xs text-black font-bold">$/mo</th>
                <th className="text-left p-3 text-xs text-black font-bold">Actions</th>
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
          <CollapsibleSection isOpen={sectionsState["Purchased Grapes"]} onToggle={toggleSection} title="Purchased Grapes">
            <div className="overflow-x-auto">
              <table className="w-full min-w-max">
                <thead>
                  <tr className="bg-vine-green-50">
                    <th className="text-left p-3 text-xs text-black font-bold">Include</th>
                    <th className="text-left p-3 text-xs text-black font-bold">Variety</th>
                    <th className="text-left p-3 text-xs text-black font-bold">Pounds</th>
                    <th className="text-left p-3 text-xs text-black font-bold">Price/lb ($)</th>
                    <th className="text-left p-3 text-xs text-black font-bold">Total ($)</th>
                    <th className="text-left p-3 text-xs text-black font-bold">Actions</th>
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
          <CollapsibleSection isOpen={sectionsState["Unsold Bottles"]} onToggle={toggleSection} title="Unsold Bottles">
            <div className="overflow-x-auto">
              <table className="w-full min-w-max">
                <thead>
                  <tr className="bg-vine-green-50">
                    <th className="text-left p-3 text-xs text-black font-bold">Include</th>
                    <th className="text-left p-3 text-xs text-black font-bold">Category</th>
                    <th className="text-left p-3 text-xs text-black font-bold">Year</th>
                    <th className="text-left p-3 text-xs text-black font-bold">Bottles</th>
                    <th className="text-left p-3 text-xs text-black font-bold">Actions</th>
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
          <div className="space-y-8">
            <div className="flex items-center justify-between pt-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Vineyard Setup</h1>
                <p className="text-sm text-gray-500 mt-1">
                  One-time upfront costs to establish your vineyard including land, infrastructure, planting, and initial setup expenses. <DocLink docId="planner/vineyard-setup" />
                </p>
              </div>

              {/* View Toggle */}
              <div className="flex gap-2 bg-gray-100 p-1 rounded-lg flex-shrink-0">
                <button
                  onClick={() => setEstablishmentView('breakdown')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    establishmentView === 'breakdown'
                      ? 'bg-white text-black font-bold shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Cost Breakdown
                </button>
                <button
                  onClick={() => setEstablishmentView('progress')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    establishmentView === 'progress'
                      ? 'bg-white text-black font-bold shadow-sm'
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
                {/* Enhanced Summary Cards - Clean Icon Style */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
                  {/* Land Card */}
                  <div className="bg-white rounded-2xl p-8 border border-gray-200">
                    <div className="flex items-center justify-center mb-4">
                      <MapPin className="w-8 h-8 text-vine-green-500" />
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-vine-green-500 mb-2">
                        ${(stNum.landPrice * stNum.acres).toLocaleString()}
                      </div>
                      <div className="text-base font-medium text-gray-700 mb-1">Land</div>
                      <div className="text-sm text-gray-400">Property acquisition</div>
                    </div>
                  </div>

                  {/* Pre-Planting Card */}
                  <div className="bg-white rounded-2xl p-8 border border-gray-200">
                    <div className="flex items-center justify-center mb-4">
                      <Tractor className="w-8 h-8 text-amber-500" />
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-amber-600 mb-2">
                        ${prePlantTotal.toLocaleString()}
                      </div>
                      <div className="text-base font-medium text-gray-700 mb-1">Pre-Planting</div>
                      <div className="text-sm text-gray-400">Site preparation</div>
                    </div>
                  </div>

                  {/* Planting Card */}
                  <div className="bg-white rounded-2xl p-8 border border-gray-200">
                    <div className="flex items-center justify-center mb-4">
                      <Sprout className="w-8 h-8 text-vine-green-500" />
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-vine-green-500 mb-2">
                        ${plantingTotal.toLocaleString()}
                      </div>
                      <div className="text-base font-medium text-gray-700 mb-1">Planting</div>
                      <div className="text-sm text-gray-400">Vines & materials</div>
                    </div>
                  </div>

                  {/* Setup/Infrastructure Card */}
                  <div className="bg-white rounded-2xl p-8 border border-gray-200">
                    <div className="flex items-center justify-center mb-4">
                      <HardHat className="w-8 h-8 text-blue-500" />
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-blue-600 mb-2">
                        ${estData
                          .filter(d => !['Land Purchase','License','One-time Permits','Pre-Planting','Planting'].includes(d.name))
                          .reduce((s,d) => s + d.value, 0)
                          .toLocaleString()}
                      </div>
                      <div className="text-base font-medium text-gray-700 mb-1">Setup</div>
                      <div className="text-sm text-gray-400">Infrastructure</div>
                    </div>
                  </div>

                  {/* License Card */}
                  <div className="bg-white rounded-2xl p-8 border border-gray-200">
                    <div className="flex items-center justify-center mb-4">
                      <FileText className="w-8 h-8 text-purple-500" />
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-purple-600 mb-2">
                        ${stNum.licenseCost.toLocaleString()}
                      </div>
                      <div className="text-base font-medium text-gray-700 mb-1">License</div>
                      <div className="text-sm text-gray-400">Permits & fees</div>
                    </div>
                  </div>

                  {/* Permits Card */}
                  <div className="bg-white rounded-2xl p-8 border border-gray-200">
                    <div className="flex items-center justify-center mb-4">
                      <ScrollText className="w-8 h-8 text-blue-500" />
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-blue-600 mb-2">
                        ${permitOneTime.toLocaleString()}
                      </div>
                      <div className="text-base font-medium text-gray-700 mb-1">Permits</div>
                      <div className="text-sm text-gray-400">Legal requirements</div>
                    </div>
                  </div>
                </div>

                {/* Total Investment - Full Width Card */}
                <div className="mb-8">
                  <div className="bg-white rounded-2xl p-8 border border-gray-200">
                    <div className="flex items-center justify-center mb-4">
                      <DollarSign className="w-8 h-8 text-vine-green-500" />
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-vine-green-500 mb-2">
                        ${estData.reduce((s,d) => s + d.value, 0).toLocaleString()}
                      </div>
                      <div className="text-base font-medium text-gray-700 mb-1">Total Investment</div>
                      <div className="text-sm text-gray-400">
                        ${Math.round(estData.reduce((s,d) => s + d.value, 0) / stNum.acres).toLocaleString()} per acre
                      </div>
                    </div>
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
                          <YAxis tickFormatter={n => `$${formatMoney(n)}`} tick={{ fontSize: 12, fill: '#475569' }} stroke="#94a3b8" />
                          <Tooltip 
                            formatter={(val) => [`$${formatMoney(val)}`, 'Cost']} 
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
                          <Tooltip formatter={(val) => [`$${formatMoney(val)}`, 'Cost']} />
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
                      <h4 className="text-lg font-semibold text-black font-bold mb-4 flex items-center gap-2">
                        <Tractor className="w-6 h-6 text-vine-green-500" strokeWidth={1.5} />
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
                                <td className="px-6 py-4 text-sm text-gray-900 text-right">${formatMoney(row.costPerAcre)}</td>
                                <td className="px-6 py-4 text-sm font-medium text-gray-900 text-right">
                                  ${formatMoney(row.costPerAcre * stNum.acres)}
                                </td>
                              </tr>
                            ))}
                            <tr className="bg-amber-50 font-semibold">
                              <td className="px-6 py-4 text-sm text-amber-700">Subtotal</td>
                              <td className="px-6 py-4 text-sm text-amber-700 text-right">
                                ${(prePlantTotal / stNum.acres).toFixed(0)}
                              </td>
                              <td className="px-6 py-4 text-sm text-amber-700 text-right">
                                ${formatMoney(prePlantTotal)}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Planting Costs */}
                    <div>
                      <h4 className="text-lg font-semibold text-black font-bold mb-4 flex items-center gap-2">
                        <Sprout className="w-6 h-6 text-vine-green-500" strokeWidth={1.5} />
                        Planting Costs
                      </h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full bg-white divide-y divide-gray-200 border rounded-lg">
                          <thead className="bg-vine-green-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs text-black font-bold uppercase">Item</th>
                              <th className="px-6 py-3 text-right text-xs text-black font-bold uppercase">Unit Cost</th>
                              <th className="px-6 py-3 text-right text-xs text-black font-bold uppercase">Qty/Acre</th>
                              <th className="px-6 py-3 text-right text-xs text-black font-bold uppercase">$/Acre</th>
                              <th className="px-6 py-3 text-right text-xs text-black font-bold uppercase">Total Cost</th>
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
                                    ${formatMoney(costPerAcre)}
                                  </td>
                                  <td className="px-6 py-4 text-sm font-medium text-gray-900 text-right">
                                    ${formatMoney(costPerAcre * stNum.acres)}
                                  </td>
                                </tr>
                              );
                            })}
                            <tr className="bg-vine-green-50 font-semibold">
                              <td className="px-6 py-4 text-sm text-black font-bold" colSpan={3}>Subtotal</td>
                              <td className="px-6 py-4 text-sm text-black font-bold text-right">
                                ${(plantingTotal / stNum.acres).toFixed(0)}
                              </td>
                              <td className="px-6 py-4 text-sm text-black font-bold text-right">
                                ${formatMoney(plantingTotal)}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Setup/Infrastructure Costs */}
                    <div>
                      <h4 className="text-lg font-semibold text-black font-bold mb-4 flex items-center gap-2">
                        <Building2 className="w-6 h-6 text-vine-green-500" strokeWidth={1.5} />
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
                                    ${formatMoney(obj.cost)}
                                  </td>
                                  <td className="px-6 py-4 text-sm font-medium text-gray-900 text-right">
                                    ${formatMoney(obj.cost * stNum.acres)}
                                  </td>
                                </tr>
                              ))}
                            <tr className={stNum.buildPrice > 0 ? 'bg-white' : 'hidden'}>
                              <td className="px-6 py-4 text-sm text-gray-900">Building</td>
                              <td className="px-6 py-4 text-sm text-gray-900 text-right">
                                ${formatMoney(stNum.buildPrice)}
                              </td>
                              <td className="px-6 py-4 text-sm font-medium text-gray-900 text-right">
                                ${formatMoney(stNum.buildPrice * stNum.acres)}
                              </td>
                            </tr>
                            <tr className="bg-blue-50 font-semibold">
                              <td className="px-6 py-4 text-sm text-blue-700">Subtotal</td>
                              <td className="px-6 py-4 text-sm text-blue-700 text-right">
                                ${(perAcreSetup).toFixed(0)}
                              </td>
                              <td className="px-6 py-4 text-sm text-blue-700 text-right">
                                ${formatMoney(perAcreSetup * stNum.acres)}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Licenses & Permits */}
                    <div>
                      <h4 className="text-lg font-semibold text-black font-bold mb-4 flex items-center gap-2">
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
                                ${formatMoney(stNum.licenseCost)}
                              </td>
                            </tr>
                            {stNum.permits.filter(p => p.include).map((permit, i) => (
                              <tr key={permit.key} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                                <td className="px-6 py-4 text-sm text-gray-900">{permit.label}</td>
                                <td className="px-6 py-4 text-sm text-gray-600 text-center">
                                  {['federal', 'state', 'winegrower', 'farm'].includes(permit.key) ? 'One-time' : 'Annual'}
                                </td>
                                <td className="px-6 py-4 text-sm font-medium text-gray-900 text-right">
                                  ${formatMoney(permit.cost)}
                                </td>
                              </tr>
                            ))}
                            <tr className="bg-purple-50 font-semibold">
                              <td className="px-6 py-4 text-sm text-purple-700" colSpan={2}>Subtotal</td>
                              <td className="px-6 py-4 text-sm text-purple-700 text-right">
                                ${formatMoney(stNum.licenseCost + permitOneTime)}
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
                            <th className="px-6 py-3 text-left text-xs text-black font-bold uppercase tracking-wider">
                              Lender
                            </th>
                            <th className="px-6 py-3 text-right text-xs text-black font-bold uppercase tracking-wider">
                              Principal
                            </th>
                            <th className="px-6 py-3 text-right text-xs text-black font-bold uppercase tracking-wider">
                              Rate
                            </th>
                            <th className="px-6 py-3 text-right text-xs text-black font-bold uppercase tracking-wider">
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
                                ${formatMoney(loan.principal)}
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
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-black font-bold">
                              Total Loans
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-black font-bold text-right">
                              ${formatMoney(totalLoanPrincipal)}
                            </td>
                            <td colSpan={2}></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Total Establishment Cost:</span>{" "}
                        ${formatMoney(totalEstCost)}
                      </p>
                      <p className="text-lg font-semibold text-purple-800">
                        <span className="font-medium">Net Capital Required:</span>{" "}
                        ${formatMoney(netEquityRequired)}
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
        <div className="space-y-8">
            <div className="pt-4">
              <h1 className="text-2xl font-bold text-gray-900">{projYears}-Year Plan</h1>
              <p className="text-sm text-gray-500 mt-1">
                Multi-year financial forecast showing revenue, expenses, cash flow, and profitability over time based on your vineyard inputs. <DocLink docId="planner/10-year-plan" />
              </p>
            </div>

            {/* Enhanced Top-line summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div className="bg-white rounded-2xl p-8 border border-gray-200">
                <div className="flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
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

              <div className="bg-white rounded-2xl p-8 border border-gray-200">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-12 h-12 bg-vine-green-100 rounded-full flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-vine-green-500" />
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-vine-green-500 mb-2">
                    ${formatMoney(projection
                      .filter(p => p.year > 0)
                      .reduce((sum, p) => sum + p.revenue, 0))}
                  </div>
                  <div className="text-sm text-gray-500">Total Revenue</div>
                </div>
                <div className="mt-4 text-center text-xs text-gray-400">
                  Avg Annual: ${formatMoney(projection.filter(p => p.year > 0).reduce((sum, p) => sum + p.revenue, 0) / projYears)}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-8 border border-gray-200">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-12 h-12 bg-vine-green-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-7 h-7 text-vine-green-500" strokeWidth={1.5} />
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-vine-green-600 mb-2">
                    {projection.length > 0
                      ? `${Math.round((projection[projection.length - 1].cumulative / totalEstCost) * 100)}%`
                      : "0%"}
                  </div>
                  <div className="text-sm text-gray-500">Annual ROI</div>
                </div>
                <div className="mt-4 text-center text-xs text-gray-400">
                  Final Profit: ${formatMoney(projection[projection.length - 1].cumulative)}
                </div>
              </div>
            </div>

            {/* Revenue Projection Visual Chart */}
            <RevenueProjectionChart
              projection={projection}
              breakEven={breakEven}
              totalYears={projYears}
            />

            {/* Chart Selector with Multiple Views */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-16 p-8">
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
                    className="appearance-none px-4 py-3 pr-10 border border-gray-200 rounded-xl text-base font-medium bg-white shadow-sm hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-vine-green-500 focus:border-transparent cursor-pointer min-w-[240px]"
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
                        <Tooltip formatter={(val) => [`$${formatMoney(val)}`, "Revenue"]} />
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
                        <Tooltip formatter={(val) => [`$${formatMoney(val)}`, "Net Profit/Loss"]} />
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
                        <Tooltip formatter={(val) => [`$${formatMoney(val)}`, undefined]} />
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
                        <Tooltip formatter={(val) => [`$${formatMoney(val)}`, "Cumulative Profit"]} />
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
                    formatter={(val) => [`$${formatMoney(val)}`, undefined]}
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
                          className="text-left p-2 text-xs text-black font-bold uppercase"
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
                            {p.year === 0 ? "–" : (
                              <Input
                                type="number"
                                step={0.1}
                                value={p.yieldPA.toFixed(1)}
                                onChange={(e) => updateCustomYield(p.year, e.target.value)}
                                className="w-20 text-center bg-white shadow-sm border-gray-200 p-1 text-sm"
                              />
                            )}
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
                          <td className="p-2">${formatMoney(p.revenue)}</td>
                          <td className="p-2">${formatMoney(p.cost)}</td>
                          <td
                            className={`p-2 font-medium ${
                              p.net >= 0 ? "text-vine-green-500" : "text-red-600"
                            }`}
                          >
                            ${formatMoney(p.net)}
                          </td>
                          <td
                            className={`p-2 font-medium ${
                              p.cumulative >= 0 ? "text-vine-green-500" : "text-red-600"
                            }`}
                          >
                            ${formatMoney(p.cumulative)}
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

      {/* ---- DETAILS TAB - PROFESSIONAL BUSINESS PLAN -------------------------- */}

        {/* ------- render Details tab only when active ------- */}
        {activeTab === "details" && (
          <BusinessPlanReport
            stNum={stNum}
            projection={projection}
            breakEven={breakEven}
            totalEstCost={totalEstCost}
            projYears={projYears}
            vineyardLayout={st.vineyardLayout}
            materialCosts={st.vineyardLayout?.materialCosts}
            beIdx={beIdx}
          />
        )}
      </div>
    </div>
  );

  const navigationItems = [
    { id: 'design', label: 'Vineyard Design', icon: Grape },
    { id: 'inputs', label: 'Financial Inputs', icon: DollarSign },
    { id: 'establishment', label: 'Vineyard Setup', icon: Sprout },
    { id: 'proj', label: `${projYears}-Year Plan`, icon: TrendingUp },
    { id: 'details', label: 'Business Plan', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-[#F5F6F7] flex">
      {/* Mobile Menu Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-[45] lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Dropdown Menu */}
      <div
        className={`
          fixed top-0 left-0 right-0 bg-white shadow-xl z-[50] lg:hidden
          transition-all duration-300 ease-in-out
          ${mobileMenuOpen ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}
        `}
      >
        {/* Mobile Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <Link to="/" className="flex items-center gap-2">
            <img src="/Trellis_Logo/logo_symbol .png" alt="Trellis" className="h-8 w-8" />
            <span className="font-semibold text-gray-900">Planner</span>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        <div className="p-4 max-h-[70vh] overflow-y-auto">
          {/* Plan Selector */}
          <div className="mb-4 pb-4 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Current Plan</p>
            <p className="text-sm font-medium text-gray-900">{currentPlanName || 'Default Plan'}</p>
          </div>

          {/* Navigation Items */}
          <div className="grid grid-cols-2 gap-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`
                    flex items-center gap-2 px-3 py-3 rounded-xl
                    transition-all duration-200
                    ${isActive
                      ? 'bg-vine-green-600 text-white shadow-md'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-vine-green-600'}`} />
                  <span className="font-medium text-sm">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Links */}
          <div className="mt-4 pt-4 border-t border-gray-100 flex gap-3">
            <Link
              to="/vineyard"
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-gray-50 rounded-xl text-gray-600 hover:bg-gray-100"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Grape className="w-4 h-4" />
              <span className="text-sm font-medium">Operations</span>
            </Link>
            <Link
              to="/production"
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-gray-50 rounded-xl text-gray-600 hover:bg-gray-100"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Wine className="w-4 h-4" />
              <span className="text-sm font-medium">Production</span>
            </Link>
          </div>

          {/* Save Button */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <button
              onClick={() => {
                handleManualSave();
                setMobileMenuOpen(false);
              }}
              disabled={saving || !dirty}
              className={`w-full px-4 py-3 text-sm rounded-xl font-semibold transition-all ${
                dirty
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-vine-green-500 text-white'
              }`}
            >
              {saving ? 'Saving…' : dirty ? 'Save Changes' : 'All Saved'}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Top Header Bar */}
      <div className="fixed top-0 left-0 right-0 z-[40] lg:hidden bg-white border-b border-gray-200 shadow-sm print:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <img src="/Trellis_Logo/logo_symbol .png" alt="Trellis" className="h-7 w-7" />
          </Link>
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium text-gray-700 mr-2">
              {navigationItems.find(i => i.id === activeTab)?.label || 'Planner'}
            </span>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar with all controls - Desktop Only */}
      <Sidebar
        active={activeTab}
        setActive={setActiveTab}
        projYears={projYears}
        setYears={setProjYears}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        onSave={handleManualSave}
        isSaving={saving}
        dirty={dirty}
        currentPlanId={planId}
        currentPlanName={currentPlanName}
        onPlanChange={handlePlanChange}
        onNewPlan={handleNewPlan}
        plans={plans}
        currentTier={tier}
        limits={limits}
        totalEstCost={totalEstCost}
        showSettings={showSettings}
        setShowSettings={setShowSettings}
      />

      {/* Main Content Area */}
      <main
        className={`
          flex-1 transition-all duration-300 max-w-full overflow-x-hidden print:mt-0 print:ml-0
          pt-16 lg:pt-0
          lg:ml-56 ${sidebarOpen ? 'lg:ml-56' : 'lg:ml-20'}
        `}
      >
        {/* Content Container */}
        <div className="pl-4 pr-4 lg:pl-0 lg:pr-6 pt-2 lg:pt-0 pb-6 max-w-full overflow-x-hidden">
          {showSettings ? (
            <SettingsView onClose={() => setShowSettings(false)} />
          ) : (
            MainUI
          )}
        </div>
      </main>

      {/* Upgrade Dialog */}
      <ConfirmDialog
        isOpen={upgradeDialog.isOpen}
        onClose={() => setUpgradeDialog({ isOpen: false, message: '' })}
        onConfirm={() => navigate('/pricing')}
        title="Upgrade Required"
        message={upgradeDialog.message}
        confirmText="Go to Pricing"
        cancelText="Cancel"
        variant="warning"
      />

      {/* Plan Name Modal */}
      <PlanNameModal
        isOpen={showPlanNameModal}
        onClose={() => setShowPlanNameModal(false)}
        onConfirm={handleCreatePlanWithName}
        title="Create New Plan"
      />
    </div>
  );
}