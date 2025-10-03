import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import PlannerShell from "@/features/planning/pages/PlannerShell.jsx";
import DocumentationPage from "@/shared/components/DocumentationPage.jsx";

import SignIn from './auth/SignIn';
import SignUp from './auth/SignUp';
import { useAuth } from '@/auth/AuthContext';


function ProtectedRoute({ children }) {
  const { user, loading } = useAuth() || {};
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading…
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/signin" replace />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <PlannerShell />
          </ProtectedRoute>
        }
      />
      <Route
        path="/docs"
        element={
          <ProtectedRoute>
            <DocumentationPage />
          </ProtectedRoute>
        }
      />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
