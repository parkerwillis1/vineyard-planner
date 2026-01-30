// src/app/router.jsx
import React from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";

// Use @ if your alias is working. If not, see the relative-path version below.
import { useAuth }        from "@/auth/AuthContext.jsx";
import { useModuleAccess } from "@/shared/hooks/useModuleAccess.js";
import PlannerShell       from "@/features/planning/pages/PlannerShell.jsx";
import { OperationsShell } from "@/features/vineyard/pages/OperationsShell.jsx";
import { FieldDetailPage } from "@/features/vineyard/pages/FieldDetailPage.jsx";
import { ProductionShell } from "@/features/production/pages/ProductionShell.jsx";
import { VesselDetail } from "@/features/production/components/VesselDetail.jsx";
import PlansPage          from "@/shared/components/PlansPage.jsx";
import HomePage           from "@/pages/home/HomePage.jsx";
import SignIn             from "@/auth/SignIn.jsx";
import SignUp             from "@/auth/SignUp.jsx";
import { AcceptInvitationPage } from "@/pages/AcceptInvitationPage.jsx";
import PricingPage        from "@/pages/pricing/PricingPage.jsx";
import AccountSettingsPage from "@/pages/account/AccountSettingsPage.jsx";

// Documentation pages
import DocsIndex from "@/pages/docs/DocsIndex.jsx";
import QuickStartPage from "@/pages/docs/getting-started/QuickStartPage.jsx";
import OperationsQuickStartPage from "@/pages/docs/getting-started/OperationsQuickStartPage.jsx";
import ProductionQuickStartPage from "@/pages/docs/getting-started/ProductionQuickStartPage.jsx";
import ConceptsPage from "@/pages/docs/getting-started/ConceptsPage.jsx";
import PlannerOverview from "@/pages/docs/planner/PlannerOverview.jsx";
import OperationsOverview from "@/pages/docs/operations/OperationsOverview.jsx";
import TaskPermissionsPage from "@/pages/docs/operations/TaskPermissionsPage.jsx";
import { default as OpsDashboardPage } from "@/pages/docs/operations/DashboardPage.jsx";
import { default as OpsWeatherPage } from "@/pages/docs/operations/WeatherPage.jsx";
import { default as OpsHarvestPage } from "@/pages/docs/operations/HarvestPage.jsx";
import { default as OpsEquipmentPage } from "@/pages/docs/operations/EquipmentPage.jsx";
import { default as OpsInventoryPage } from "@/pages/docs/operations/InventoryPage.jsx";
import { default as OpsLaborPage } from "@/pages/docs/operations/LaborPage.jsx";
import { default as OpsArchivedPage } from "@/pages/docs/operations/ArchivedPage.jsx";
import { ProductionOverview } from "@/pages/docs/production/ProductionOverview.jsx";
import { DashboardPage as ProductionDashboardPage } from "@/pages/docs/production/DashboardPage.jsx";
import { HarvestPage } from "@/pages/docs/production/HarvestPage.jsx";
import { FermentationPage } from "@/pages/docs/production/FermentationPage.jsx";
import { VesselsPage } from "@/pages/docs/production/VesselsPage.jsx";
import { BlendingPage } from "@/pages/docs/production/BlendingPage.jsx";
import { AgingPage } from "@/pages/docs/production/AgingPage.jsx";
import { LabPage } from "@/pages/docs/production/LabPage.jsx";
import { BottlingPage } from "@/pages/docs/production/BottlingPage.jsx";
import { AnalyticsPage as ProductionAnalyticsPage } from "@/pages/docs/production/AnalyticsPage.jsx";
import { ReportsPage as ProductionReportsPage } from "@/pages/docs/production/ReportsPage.jsx";
import { SensorsPage } from "@/pages/docs/production/SensorsPage.jsx";
import { ArchivesPage as ProductionArchivesPage } from "@/pages/docs/production/ArchivesPage.jsx";
import FAQPage from "@/pages/docs/FAQPage.jsx";
import { DocsPage } from "@/pages/docs/DocsPage.jsx";

/* Guard for routes that require auth */
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth() || {};
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading…
      </div>
    );
  }
  if (!user) return <Navigate to="/signin" replace />;
  return children ? children : <Outlet />;
}

/* Guard for routes that require specific module access */
function ModuleProtectedRoute({ moduleId, children }) {
  const { user, loading: authLoading } = useAuth() || {};
  const { hasAccess, loading: moduleLoading, locked, reason } = useModuleAccess(moduleId);

  console.log('[ModuleProtectedRoute]', {
    moduleId,
    hasAccess,
    locked,
    reason,
    authLoading,
    moduleLoading
  });

  if (authLoading || moduleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading…
      </div>
    );
  }

  if (!user) {
    console.log('[ModuleProtectedRoute] No user, redirecting to signin');
    return <Navigate to="/signin" replace />;
  }

  // If user doesn't have access, redirect to pricing page
  if (!hasAccess) {
    console.log('[ModuleProtectedRoute] No access, redirecting to pricing');
    return <Navigate to="/pricing" replace />;
  }

  console.log('[ModuleProtectedRoute] Access granted');
  return children ? children : <Outlet />;
}

export default function AppRouter() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/accept-invitation" element={<AcceptInvitationPage />} />
      <Route path="/pricing" element={<PricingPage />} />

      {/* Documentation - Public access */}
      <Route path="/docs" element={<DocsIndex />} />
      <Route path="/docs/getting-started/quick-start" element={<QuickStartPage />} />
      <Route path="/docs/getting-started/operations-quick-start" element={<OperationsQuickStartPage />} />
      <Route path="/docs/getting-started/production-quick-start" element={<ProductionQuickStartPage />} />
      <Route path="/docs/getting-started/concepts" element={<ConceptsPage />} />
      <Route path="/docs/planner" element={<PlannerOverview />} />
      <Route path="/docs/operations" element={<OperationsOverview />} />
      <Route path="/docs/operations/dashboard" element={<OpsDashboardPage />} />
      <Route path="/docs/operations/weather" element={<OpsWeatherPage />} />
      <Route path="/docs/operations/harvest" element={<OpsHarvestPage />} />
      <Route path="/docs/operations/equipment" element={<OpsEquipmentPage />} />
      <Route path="/docs/operations/inventory" element={<OpsInventoryPage />} />
      <Route path="/docs/operations/labor" element={<OpsLaborPage />} />
      <Route path="/docs/operations/archived" element={<OpsArchivedPage />} />
      <Route path="/docs/operations/task-permissions" element={<TaskPermissionsPage />} />
      <Route path="/docs/production" element={<ProductionOverview />} />
      <Route path="/docs/production/dashboard" element={<ProductionDashboardPage />} />
      <Route path="/docs/production/harvest" element={<HarvestPage />} />
      <Route path="/docs/production/fermentation" element={<FermentationPage />} />
      <Route path="/docs/production/vessels" element={<VesselsPage />} />
      <Route path="/docs/production/blending" element={<BlendingPage />} />
      <Route path="/docs/production/aging" element={<AgingPage />} />
      <Route path="/docs/production/lab" element={<LabPage />} />
      <Route path="/docs/production/bottling" element={<BottlingPage />} />
      <Route path="/docs/production/analytics" element={<ProductionAnalyticsPage />} />
      <Route path="/docs/production/reports" element={<ProductionReportsPage />} />
      <Route path="/docs/production/sensors" element={<SensorsPage />} />
      <Route path="/docs/production/archives" element={<ProductionArchivesPage />} />
      <Route path="/docs/faq" element={<FAQPage />} />
      {/* Page-specific documentation */}
      <Route path="/docs/page/*" element={<DocsPage />} />

      {/* Auth-protected area */}
      <Route element={<ProtectedRoute />}>
        {/* Planner - Free tier (everyone has access) */}
        <Route path="/planner" element={<PlannerShell />} />
        <Route path="/planner/:id" element={<PlannerShell />} />
        <Route path="/plans" element={<PlansPage />} />
        <Route path="/account/settings" element={<AccountSettingsPage />} />
      </Route>

      {/* Vineyard Operations - Requires 'vineyard' module (professional tier+) */}
      <Route element={<ModuleProtectedRoute moduleId="vineyard" />}>
        <Route path="/vineyard" element={<OperationsShell />} />
        <Route path="/vineyard/field/:id" element={<FieldDetailPage />} />
      </Route>

      {/* Wine Production - Requires 'production' module (professional tier+) */}
      <Route element={<ModuleProtectedRoute moduleId="production" />}>
        <Route path="/production" element={<ProductionShell />} />
        <Route path="/production/vessel/:id" element={<VesselDetail />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
