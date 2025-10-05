// src/App.jsx
import React from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./auth/AuthContext";

import PlannerShell from "./features/planning/pages/PlannerShell";
import DocumentationPage from "./shared/components/DocumentationPage";
import PlansPage from "./shared/components/PlansPage";
// add your simple pages if you have them:
import HomePage from "./pages/home/HomePage.jsx";         // stub/placeholder OK
import VineyardsPage from "./pages/vineyards/Vineyards.jsx"; // stub/placeholder OK
import SignIn from "./auth/SignIn";
import SignUp from "./auth/SignUp";

function ProtectedRoute() {
  const { user, loading } = useAuth() || {};
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading…</div>;
  if (!user) return <Navigate to="/signin" replace />;
  return <Outlet />;
}

export default function App() {
  return (
    <Routes>
      {/* everything below requires auth */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/vineyards" element={<VineyardsPage />} />
        <Route path="/docs" element={<DocumentationPage />} />
        <Route path="/plans" element={<PlansPage />} />

        {/* 👇 scope the planner explicitly */}
        <Route path="/planner/*" element={<PlannerShell />} />
        <Route path="/planner/:id/*" element={<PlannerShell />} />
      </Route>

      {/* public auth */}
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />

      {/* fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
