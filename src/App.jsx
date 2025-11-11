import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";

import SiteLayout from "./app/layout/SiteLayout.jsx";

import HomePage           from "./pages/home/HomePage.jsx";
import ProductsPage       from "./pages/products/ProductsPage.jsx";
import VineyardsPage      from "./pages/vineyards/VineyardsPage.jsx";
import DocumentationPage  from "./shared/components/DocumentationPage.jsx";
import PlansPage          from "./shared/components/PlansPage.jsx";
import AboutPage from "./pages/about/AboutPage.jsx";
import ContactPage from "./pages/contact/ContactPage.jsx";
import AccountSettingsPage from "./pages/account/AccountSettingsPage.jsx";
import PricingPage from "./pages/pricing/PricingPage.jsx";
import SelectPlanPage from "./pages/onboarding/SelectPlanPage.jsx";


import PlannerShell       from "./features/planning/pages/PlannerShell.jsx";
import { OperationsShell } from "./features/vineyard/pages/OperationsShell.jsx";

import SignIn             from "./auth/SignIn.jsx";
import SignUp             from "./auth/SignUp.jsx";
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
        <Route element={<SiteLayout />}>
          {/* Public routes */}
          <Route index element={<HomePage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="docs" element={<DocumentationPage />} />
          <Route path="pricing" element={<PricingPage />} />

          {/* Protected routes - require authentication */}
          <Route element={<ProtectedRoute />}>
            <Route path="select-plan" element={<SelectPlanPage />} />
            <Route path="planner" element={<PlannerShell embedded />} />
            <Route path="planner/:id" element={<PlannerShell embedded />} />
            <Route path="vineyard/*" element={<OperationsShell />} />
            <Route path="vineyards" element={<VineyardsPage />} />
            <Route path="plans" element={<PlansPage />} />
            <Route path="account/settings" element={<AccountSettingsPage />} />
          </Route>
        </Route>

        {/* Auth pages (outside SiteLayout) */}
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
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