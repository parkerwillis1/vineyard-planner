import React, { useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { supabase } from "@/shared/lib/supabaseClient";
import { ModuleNav } from "@/shared/components/ModuleNav";
import { useSubscription } from "@/shared/hooks/useSubscription";

export default function SiteLayout() {
  const { user } = useAuth() || {};
  const subscription = useSubscription();
  const location = useLocation();
  const [showAccountMenu, setShowAccountMenu] = useState(false);

  const isPlannerPage = location.pathname.startsWith('/planner');
  const needsPadding = ['/signin', '/signup', '/account/settings'].includes(location.pathname);

  return (
    <div className="min-h-screen bg-white">
      {/* Main Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b">
        <div className="max-w-screen-2xl mx-auto px-6 py-5 flex items-center gap-6">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img src="/VinePioneerLongV1.png" alt="Vine Pioneer" className="h-10" />
          </Link>

          {/* Left nav */}
          <nav className="flex items-center gap-8">
            <NavLink to="/" end className={({isActive}) =>
              isActive ? "text-vine-green-500 font-semibold text-base" : "text-gray-700 hover:text-vine-green-500"
            }>Home</NavLink>

            <NavLink to="/planner" className={({isActive}) =>
              isActive ? "text-vine-green-500 font-semibold text-base" : "text-gray-700 hover:text-vine-green-500"
            }>Planner</NavLink>

            <NavLink to="/vineyards" className={({isActive}) =>
              isActive ? "text-vine-green-500 font-semibold text-base" : "text-gray-700 hover:text-vine-green-500"
            }>Vineyards</NavLink>

            <NavLink to="/about" className={({isActive}) =>
              isActive ? "text-vine-green-500 font-semibold text-base" : "text-gray-700 hover:text-vine-green-500"
            }>About</NavLink>
          </nav>

          {/* Right side */}
          <div className="ml-auto flex items-center gap-4">
            <NavLink to="/docs" className={({isActive}) =>
              isActive ? "text-vine-green-500 font-semibold text-base" : "text-gray-700 hover:text-vine-green-500"
            }>Documentation</NavLink>

            {user ? (
              <>
                {/* ⭐ NEW: Show Upgrade button if not on highest tier */}
                {subscription.tier !== 'enterprise' && (
                  <Link 
                    to="/pricing"
                    className="px-4 py-2 bg-gradient-to-r from-vine-green-500 to-vine-green-600 text-white rounded-lg font-semibold text-sm hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                  >
                    <span>Upgrade</span>
                  </Link>
                )}

                {/* Account Menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowAccountMenu(!showAccountMenu)}
                    className="text-gray-700 hover:text-vine-green-500 font-medium text-base"
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
                        {/* ⭐ NEW: Show current tier */}
                        <div className="px-4 py-2 border-b border-gray-100">
                          <p className="text-xs text-gray-500">Current Plan</p>
                          <p className="text-sm font-semibold text-vine-green-700 capitalize">
                            {subscription.tier}
                          </p>
                        </div>

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

                        {/* ⭐ NEW: Pricing link */}
                        {subscription.tier !== 'enterprise' && (
                          <Link
                            to="/pricing"
                            className="block px-4 py-2 text-sm text-vine-green-600 hover:bg-gray-50 font-medium"
                            onClick={() => setShowAccountMenu(false)}
                          >
                            Upgrade Plan
                          </Link>
                        )}

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
              </>
            ) : (
              <Link to="/signin" className="text-vine-green-500 hover:underline font-medium text-base">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ⭐ Module Navigation - Only show for logged-in users */}
      {user && <ModuleNav />}

      {/* Main Content */}
      <main className={
        isPlannerPage ? "" :  // ⭐ REMOVED: -mt-12 (no longer needed)
        needsPadding ? "max-w-screen-2xl mx-auto px-6 py-10" : 
        ""
      }>
        <Outlet key={location.pathname} />
      </main>
    </div>
  );
}