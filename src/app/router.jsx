// src/app/router.jsx
import React from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";

// Use @ if your alias is working. If not, see the relative-path version below.
import { useAuth }        from "@/auth/AuthContext.jsx";
import PlannerShell       from "@/features/planning/pages/PlannerShell.jsx";
import { OperationsShell } from "@/features/vineyard/pages/OperationsShell.jsx";
import { FieldDetailPage } from "@/features/vineyard/pages/FieldDetailPage.jsx";
import DocumentationPage  from "@/shared/components/DocumentationPage.jsx";
import PlansPage          from "@/shared/components/PlansPage.jsx";
import HomePage           from "@/pages/home/HomePage.jsx";
import SignIn             from "@/auth/SignIn.jsx";
import SignUp             from "@/auth/SignUp.jsx";

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

export default function AppRouter() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />

      {/* Auth-protected area */}
      <Route element={<ProtectedRoute />}>
        {/* Main editor/dashboard shell */}
        <Route path="/planner" element={<PlannerShell />} />
        <Route path="/planner/:id" element={<PlannerShell />} />
        <Route path="/vineyard" element={<OperationsShell />} />
        <Route path="/vineyard/field/:id" element={<FieldDetailPage />} />
        <Route path="/plans" element={<PlansPage />} />
        <Route path="/docs"  element={<DocumentationPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
