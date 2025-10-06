import React, { useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { supabase } from "@/shared/lib/supabaseClient";

export default function SiteLayout() {
  const { user } = useAuth() || {};
  const location = useLocation();
  const [showAccountMenu, setShowAccountMenu] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b">
        <div className="max-w-screen-2xl mx-auto px-6 py-4 flex items-center gap-8">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img src="/VinePioneerLongV1.png" alt="Vine Pioneer" className="h-8" />
          </Link>

          {/* Left nav */}
          <nav className="flex items-center gap-8">
            <NavLink to="/" end className={({isActive}) =>
              isActive ? "text-blue-700 font-semibold text-base" : "text-gray-700 hover:text-blue-700 text-base"
            }>Home</NavLink>

            <NavLink to="/planner" className={({isActive}) =>
              isActive ? "text-blue-700 font-semibold text-base" : "text-gray-700 hover:text-blue-700 text-base"
            }>Planner</NavLink>

            <NavLink to="/vineyards" className={({isActive}) =>
              isActive ? "text-blue-700 font-semibold text-base" : "text-gray-700 hover:text-blue-700 text-base"
            }>Vineyards</NavLink>

            <NavLink to="/about" className={({isActive}) =>
              isActive ? "text-blue-700 font-semibold text-base" : "text-gray-700 hover:text-blue-700 text-base"
            }>About</NavLink>
          </nav>

          {/* Right side */}
          <div className="ml-auto flex items-center gap-6">
            <NavLink to="/docs" className={({isActive}) =>
              isActive ? "text-blue-700 font-semibold text-base" : "text-gray-700 hover:text-blue-700 text-base"
            }>Documentation</NavLink>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowAccountMenu(!showAccountMenu)}
                  className="text-gray-700 hover:text-blue-700 font-medium text-base"
                >
                  Account
                </button>
                
                {/* ... rest of account menu ... */}
              </div>
            ) : (
              <Link to="/signin" className="text-blue-700 hover:underline font-medium text-base">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>
      <main className="max-w-screen-2xl mx-auto px-6 py-10">
        <Outlet key={location.pathname} />
      </main>
    </div>
  );
}