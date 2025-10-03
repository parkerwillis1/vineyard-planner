import React           from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";

import { useAuth }        from "./auth/AuthContext";
import PlannerShell from "@/features/planning/pages/PlannerShell";
import DocumentationPage  from "@/shared/components/DocumentationPage";
import PlansPage          from "@/shared/components/PlansPage";
import SignIn             from "@/auth/SignIn";
import SignUp             from "@/auth/SignUp";

/* ──────────────────────────────────────────────── */
/*  Gatekeeper – wraps all routes that need auth   */
/* ──────────────────────────────────────────────── */
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

  /* works for both styles: <ProtectedRoute>… and element={<ProtectedRoute/>} */
  return children ? children : <Outlet />;
}

/* ──────────────────────────────────────────────── */
/*  Main router                                    */
/* ──────────────────────────────────────────────── */
export default function App() {
  return (
    <Routes>
      {/* SIGN‑IN‑REQUIRED AREA */}
      <Route element={<ProtectedRoute />}>

        {/* Dashboard + editor – the “app shell” */}
        <Route path="/*" element={<PlannerShell />} />

        {/* List of saved plans */}
        <Route path="plans" element={<PlansPage />} />

        {/* A specific plan by row id */}
        <Route path="app/:id/*" element={<PlannerShell />} />

        {/* Stand‑alone docs page  (kept outside the editor) */}
        <Route path="docs" element={<DocumentationPage />} />
      </Route>

      {/* Public auth routes */}
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />

      {/* Fallback → dashboard */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
