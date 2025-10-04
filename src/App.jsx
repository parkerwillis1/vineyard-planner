import React from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";

import { useAuth }        from "@/auth/AuthContext";
import NavBar             from "@/shared/components/NavBar";
import HomePage           from "@/pages/home/HomePage";
import PlannerShell       from "@/features/planning/pages/PlannerShell";
import VineyardsPage      from "@/pages/vineyards/VineyardsPage";
import DocumentationPage  from "@/shared/components/DocumentationPage";
import PlansPage          from "@/shared/components/PlansPage";
import SignIn             from "@/auth/SignIn";
import SignUp             from "@/auth/SignUp";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth() || {};
  if (loading) return <div className="min-h-screen grid place-items-center">Loading…</div>;
  if (!user) return <Navigate to="/signin" replace />;
  return children ?? <Outlet />;
}

export default function App() {
  return (
    <>
      <NavBar />
      <Routes>
        {/* public */}
        <Route path="/" element={<HomePage />} />
        <Route path="/vineyards" element={<VineyardsPage />} />
        <Route path="/docs" element={<DocumentationPage />} />

        {/* protected */}
        <Route element={<ProtectedRoute />}>
          <Route path="/app/*" element={<PlannerShell />} />
          <Route path="/app/:id/*" element={<PlannerShell />} />
          <Route path="/plans" element={<PlansPage />} />
        </Route>

        {/* auth */}
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />

        {/* fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
