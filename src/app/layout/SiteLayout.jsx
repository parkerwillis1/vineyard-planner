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
        <div className="max-w-screen-2xl mx-auto px-6 py-3 flex items-center gap-6">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img src="/VineSightLogo.png" alt="Vine Pioneer" className="h-7" />
            <span className="font-semibold text-blue-900">Vine Pioneer</span>
          </Link>

          {/* Left nav */}
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

            <NavLink to="/about" className={({isActive}) =>
              isActive ? "text-blue-700 font-medium" : "text-gray-700 hover:text-blue-700"
            }>About</NavLink>
          </nav>

          {/* Right side */}
          <div className="ml-auto flex items-center gap-4">
            <NavLink to="/docs" className={({isActive}) =>
              isActive ? "text-blue-700 font-medium" : "text-gray-700 hover:text-blue-700"
            }>Documentation</NavLink>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowAccountMenu(!showAccountMenu)}
                  className="text-gray-700 hover:text-blue-700 font-medium"
                >
                  Account
                </button>
                
                {showAccountMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setShowAccountMenu(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                      <Link
                        to="/plans"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setShowAccountMenu(false)}
                      >
                        My Plans
                      </Link>
                      <Link
                        to="/account/settings"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setShowAccountMenu(false)}
                      >
                        Settings
                      </Link>
                      <hr className="my-1 border-gray-200" />
                      <button
                        onClick={() => {
                          supabase.auth.signOut();
                          setShowAccountMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                      >
                        Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link to="/signin" className="text-blue-700 hover:underline font-medium">
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