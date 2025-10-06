import React from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";        // adjust if your path differs
import { supabase } from "@/shared/lib/supabaseClient";

export default function SiteLayout() {
  const location = useLocation();
  const { user } = useAuth() || {};

  return (
    <div className="min-h-screen bg-white">
      {/* Top site navbar (NOT used inside the planner) */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b">
        <div className="max-w-screen-2xl mx-auto px-6 py-3 flex items-center gap-6">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img src="/VineSightLogo.png" alt="Vine Pioneer" className="h-7" />
            <span className="font-semibold text-blue-900">Vine Pioneer</span>
          </Link>

          {/* Primary nav */}
          <nav className="flex items-center gap-6">
            <NavLink to="/" end className={({isActive}) =>
              isActive ? "text-blue-700 font-medium" : "text-gray-700 hover:text-blue-700"
            }>Home</NavLink>

            <NavLink to="/planner" className={({isActive}) =>
              isActive ? "text-blue-700 font-medium" : "text-gray-700 hover:text-blue-700"
            }>Planner</NavLink>

            <NavLink to="/vineyards" className={({isActive}) =>
              isActive ? "text-blue-700 font-medium" : "text-gray-700 hover:text-blue-700"
            }>Vineyards</NavLink>

            <NavLink to="/docs" className={({isActive}) =>
              isActive ? "text-blue-700 font-medium" : "text-gray-700 hover:text-blue-700"
            }>Docs</NavLink>

            <NavLink to="/plans" className={({isActive}) =>
              isActive ? "text-blue-700 font-medium" : "text-gray-700 hover:text-blue-700"
            }>My Plans</NavLink>
          </nav>

          {/* Right side */}
          <div className="ml-auto flex items-center gap-3">
            {user && <span className="hidden sm:block text-sm text-gray-600">{user.email}</span>}

            {user ? (
              <button
                onClick={() => supabase.auth.signOut()}
                className="text-red-600 hover:underline"
              >
                Sign Out
              </button>
            ) : (
              <Link to="/signin" className="text-blue-700 hover:underline">Sign In</Link>
            )}

            <Link
              to="/planner"
              className="px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
              Open Planner
            </Link>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="max-w-screen-2xl mx-auto px-6 py-10">
        <Outlet />
      </main>
      <main className="max-w-screen-2xl mx-auto px-6 py-10">
        <Outlet key={location.pathname} />
      </main>
    </div>
  );
}
