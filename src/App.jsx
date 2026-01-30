import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";

import SiteLayout from "./app/layout/SiteLayout.jsx";

import HomePage           from "./pages/home/HomePage.jsx";
import ProductsPage       from "./pages/products/ProductsPage.jsx";
import FinancialPlannerPage from "./pages/products/FinancialPlannerPage.jsx";
import VineyardOperationsPage from "./pages/products/VineyardOperationsPage.jsx";
import WineryProductionPage from "./pages/products/WineryProductionPage.jsx";
import VineyardsPage      from "./pages/vineyards/VineyardsPage.jsx";
import PlansPage          from "./shared/components/PlansPage.jsx";
import AboutPage from "./pages/about/AboutPage.jsx";
import ContactPage from "./pages/contact/ContactPage.jsx";
import AccountSettingsPage from "./pages/account/AccountSettingsPage.jsx";
import PricingPage from "./pages/pricing/PricingPage.jsx";
import SelectPlanPage from "./pages/onboarding/SelectPlanPage.jsx";

// Documentation pages
import DocsIndex from "./pages/docs/DocsIndex.jsx";
import QuickStartPage from "./pages/docs/getting-started/QuickStartPage.jsx";
import OperationsQuickStartPage from "./pages/docs/getting-started/OperationsQuickStartPage.jsx";
import ProductionQuickStartPage from "./pages/docs/getting-started/ProductionQuickStartPage.jsx";
import ConceptsPage from "./pages/docs/getting-started/ConceptsPage.jsx";

// Planner docs
import PlannerOverview from "./pages/docs/planner/PlannerOverview.jsx";
import DesignTabPage from "./pages/docs/planner/DesignTabPage.jsx";
import FinancialInputsPage from "./pages/docs/planner/FinancialInputsPage.jsx";
import VineyardSetupPage from "./pages/docs/planner/VineyardSetupPage.jsx";
import TenYearPlanPage from "./pages/docs/planner/TenYearPlanPage.jsx";
import DetailsTabPage from "./pages/docs/planner/DetailsTabPage.jsx";
import FormulasPage from "./pages/docs/planner/FormulasPage.jsx";
import BestPracticesPage from "./pages/docs/planner/BestPracticesPage.jsx";

// Operations docs
import OperationsOverview from "./pages/docs/operations/OperationsOverview.jsx";
import OpsDashboardPage from "./pages/docs/operations/DashboardPage.jsx";
import BlocksPage from "./pages/docs/operations/BlocksPage.jsx";
import IrrigationPage from "./pages/docs/operations/IrrigationPage.jsx";
import OpsWeatherPage from "./pages/docs/operations/WeatherPage.jsx";
import TasksPage from "./pages/docs/operations/TasksPage.jsx";
import TaskPermissionsPage from "./pages/docs/operations/TaskPermissionsPage.jsx";
import OpsHarvestPage from "./pages/docs/operations/HarvestPage.jsx";
import TeamPage from "./pages/docs/operations/TeamPage.jsx";
import OpsLaborPage from "./pages/docs/operations/LaborPage.jsx";
import OpsEquipmentPage from "./pages/docs/operations/EquipmentPage.jsx";
import OpsInventoryPage from "./pages/docs/operations/InventoryPage.jsx";
import SprayPage from "./pages/docs/operations/SprayPage.jsx";
import CalendarPage from "./pages/docs/operations/CalendarPage.jsx";
import AnalyticsPage from "./pages/docs/operations/AnalyticsPage.jsx";
import HardwarePage from "./pages/docs/operations/HardwarePage.jsx";
import OpsArchivedPage from "./pages/docs/operations/ArchivedPage.jsx";

// Production docs
import { ProductionOverview } from "./pages/docs/production/ProductionOverview.jsx";
import { DashboardPage as ProductionDashboardPage } from "./pages/docs/production/DashboardPage.jsx";
import { HarvestPage as ProductionHarvestPage } from "./pages/docs/production/HarvestPage.jsx";
import { FermentationPage } from "./pages/docs/production/FermentationPage.jsx";
import { VesselsPage } from "./pages/docs/production/VesselsPage.jsx";
import { BlendingPage } from "./pages/docs/production/BlendingPage.jsx";
import { AgingPage } from "./pages/docs/production/AgingPage.jsx";
import { LabPage } from "./pages/docs/production/LabPage.jsx";
import { BottlingPage } from "./pages/docs/production/BottlingPage.jsx";
import { AnalyticsPage as ProductionAnalyticsPage } from "./pages/docs/production/AnalyticsPage.jsx";
import { ReportsPage as ProductionReportsPage } from "./pages/docs/production/ReportsPage.jsx";
import { SensorsPage } from "./pages/docs/production/SensorsPage.jsx";
import { ArchivesPage as ProductionArchivesPage } from "./pages/docs/production/ArchivesPage.jsx";

// Resources docs
import FAQPage from "./pages/docs/FAQPage.jsx";
import TroubleshootingPage from "./pages/docs/TroubleshootingPage.jsx";
import SupportPage from "./pages/docs/SupportPage.jsx";
import BlogPage from "./pages/blog/BlogPage.jsx";
import BlogPostPage from "./pages/blog/BlogPostPage.jsx";
import TipsPage from "./pages/tips/TipsPage.jsx";


import PlannerShell       from "./features/planning/pages/PlannerShell.jsx";
import { OperationsShell } from "./features/vineyard/pages/OperationsShell.jsx";
import { ProductionShell } from "./features/production/pages/ProductionShell.jsx";

import SignIn             from "./auth/SignIn.jsx";
import SignUp             from "./auth/SignUp.jsx";
import ForgotPassword     from "./auth/ForgotPassword.jsx";
import ResetPassword      from "./auth/ResetPassword.jsx";
import { useAuth }        from "./auth/AuthContext.jsx";

// ⭐ NEW: Import subscription system
import { SubscriptionProvider } from "./shared/hooks/useSubscription.jsx";
import { UpgradeModal } from "./shared/components/UpgradeModal.jsx";
import ScrollToTop from "./shared/components/ScrollToTop.jsx";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth() || {};
  if (loading) return <div className="min-h-screen grid place-items-center">Loading…</div>;
  if (!user) return <Navigate to="/signin" replace />;
  return children ?? <Outlet />;
}

// Removed SmartHomePage - keeping normal homepage accessible

export default function App() {
  // ⭐ NEW: Global upgrade modal state
  const [upgradeModalModule, setUpgradeModalModule] = useState(null);

  // ⭐ NEW: Listen for upgrade modal events from anywhere in the app
  useEffect(() => {
    const handleShowUpgradeModal = (event) => {
      setUpgradeModalModule(event.detail.moduleId);
    };

    window.addEventListener('show-upgrade-modal', handleShowUpgradeModal);
    return () => window.removeEventListener('show-upgrade-modal', handleShowUpgradeModal);
  }, []);

  return (
    // ⭐ NEW: Wrap entire app with subscription provider
    <SubscriptionProvider>
      <ScrollToTop />
      <Routes>
        {/* Documentation routes (outside SiteLayout - uses its own DocsLayout) */}
        <Route path="/docs" element={<DocsIndex />} />

        {/* Getting Started */}
        <Route path="/docs/getting-started/quick-start" element={<QuickStartPage />} />
        <Route path="/docs/getting-started/operations-quick-start" element={<OperationsQuickStartPage />} />
        <Route path="/docs/getting-started/production-quick-start" element={<ProductionQuickStartPage />} />
        <Route path="/docs/getting-started/concepts" element={<ConceptsPage />} />

        {/* Vineyard Planner */}
        <Route path="/docs/planner" element={<PlannerOverview />} />
        <Route path="/docs/planner/design" element={<DesignTabPage />} />
        <Route path="/docs/planner/financial-inputs" element={<FinancialInputsPage />} />
        <Route path="/docs/planner/vineyard-setup" element={<VineyardSetupPage />} />
        <Route path="/docs/planner/ten-year-plan" element={<TenYearPlanPage />} />
        <Route path="/docs/planner/details" element={<DetailsTabPage />} />
        <Route path="/docs/planner/formulas" element={<FormulasPage />} />
        <Route path="/docs/planner/best-practices" element={<BestPracticesPage />} />

        {/* Vineyard Operations */}
        <Route path="/docs/operations" element={<OperationsOverview />} />
        <Route path="/docs/operations/dashboard" element={<OpsDashboardPage />} />
        <Route path="/docs/operations/blocks" element={<BlocksPage />} />
        <Route path="/docs/operations/irrigation" element={<IrrigationPage />} />
        <Route path="/docs/operations/weather" element={<OpsWeatherPage />} />
        <Route path="/docs/operations/tasks" element={<TasksPage />} />
        <Route path="/docs/operations/task-permissions" element={<TaskPermissionsPage />} />
        <Route path="/docs/operations/harvest" element={<OpsHarvestPage />} />
        <Route path="/docs/operations/team" element={<TeamPage />} />
        <Route path="/docs/operations/labor" element={<OpsLaborPage />} />
        <Route path="/docs/operations/equipment" element={<OpsEquipmentPage />} />
        <Route path="/docs/operations/inventory" element={<OpsInventoryPage />} />
        <Route path="/docs/operations/spray" element={<SprayPage />} />
        <Route path="/docs/operations/calendar" element={<CalendarPage />} />
        <Route path="/docs/operations/analytics" element={<AnalyticsPage />} />
        <Route path="/docs/operations/hardware" element={<HardwarePage />} />
        <Route path="/docs/operations/archived" element={<OpsArchivedPage />} />

        {/* Wine Production */}
        <Route path="/docs/production" element={<ProductionOverview />} />
        <Route path="/docs/production/dashboard" element={<ProductionDashboardPage />} />
        <Route path="/docs/production/harvest" element={<ProductionHarvestPage />} />
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

        {/* Resources */}
        <Route path="/docs/faq" element={<FAQPage />} />
        <Route path="/docs/troubleshooting" element={<TroubleshootingPage />} />
        <Route path="/docs/support" element={<SupportPage />} />

        <Route element={<SiteLayout />}>
          {/* Public routes */}
          <Route index element={<HomePage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="products/planner" element={<FinancialPlannerPage />} />
          <Route path="products/operations" element={<VineyardOperationsPage />} />
          <Route path="products/production" element={<WineryProductionPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="pricing" element={<PricingPage />} />
          <Route path="faq" element={<FAQPage />} />
          <Route path="blog" element={<BlogPage />} />
          <Route path="blog/:slug" element={<BlogPostPage />} />
          <Route path="tips" element={<TipsPage />} />

          {/* Protected routes - require authentication */}
          <Route element={<ProtectedRoute />}>
            <Route path="select-plan" element={<SelectPlanPage />} />
            <Route path="planner" element={<PlannerShell embedded />} />
            <Route path="planner/:id" element={<PlannerShell embedded />} />
            <Route path="vineyard/*" element={<OperationsShell />} />
            <Route path="production/*" element={<ProductionShell />} />
            <Route path="vineyards" element={<VineyardsPage />} />
            <Route path="plans" element={<PlansPage />} />
            <Route path="account/settings" element={<AccountSettingsPage />} />
          </Route>
        </Route>

        {/* Auth pages (outside SiteLayout) */}
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* ⭐ NEW: Global upgrade modal (rendered once, triggered from anywhere) */}
      {upgradeModalModule && (
        <UpgradeModal
          moduleId={upgradeModalModule}
          onClose={() => setUpgradeModalModule(null)}
        />
      )}
    </SubscriptionProvider>
  );
}