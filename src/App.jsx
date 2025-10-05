import React from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";

import SiteLayout from "./app/layout/SiteLayout.jsx";

import HomePage           from "./pages/home/HomePage.jsx";
import VineyardsPage      from "./pages/vineyards/VineyardsPage.jsx";
import DocumentationPage  from "./shared/components/DocumentationPage.jsx";
import PlansPage          from "./shared/components/PlansPage.jsx";

import PlannerShell       from "./features/planning/pages/PlannerShell.jsx";

import SignIn             from "./auth/SignIn.jsx";
import SignUp             from "./auth/SignUp.jsx";
import { useAuth }        from "./auth/AuthContext.jsx";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth() || {};
  if (loading) return <div className="min-h-screen grid place-items-center">Loading…</div>;
  if (!user) return <Navigate to="/signin" replace />;
  return children ?? <Outlet />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route index element={<HomePage />} />
        <Route path="planner"   element={<PlannerShell />} />
        <Route path="vineyards" element={<VineyardsPage />} />
        <Route path="docs"      element={<DocumentationPage />} />
        <Route path="plans"     element={<PlansPage />} />
      </Route>

      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
