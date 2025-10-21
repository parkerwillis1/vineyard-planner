import React, { useState, useRef, useEffect } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { supabase } from "@/shared/lib/supabaseClient";
import { useSubscription } from "@/shared/hooks/useSubscription";
import { MODULES } from "@/shared/config/modules";
import * as Icons from "lucide-react";
import { ChevronDown } from "lucide-react";

export default function SiteLayout() {
  const { user } = useAuth() || {};
  const subscription = useSubscription();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const toolsMenuRef = useRef(null);

  const needsPadding = ['/signin', '/signup', '/account/settings'].includes(location.pathname);

  // Close tools menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(event.target)) {
        setShowToolsMenu(false);
      }
    };

    if (showToolsMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showToolsMenu]);

  const handleModuleClick = (module) => {
    const hasAccess = subscription.modules.includes(module.id);
    
    setShowToolsMenu(false); // Close dropdown
    
    if (hasAccess) {
      navigate(module.route);
    } else {
      // Trigger upgrade modal
      window.dispatchEvent(
        new CustomEvent('show-upgrade-modal', { detail: { moduleId: module.id } })
      );
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Main Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-[1920px] mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Brand */}
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <img src="/VinePioneerLongV1.png" alt="Vine Pioneer" className="h-10" />
            </Link>

            {/* Left nav */}
            <nav className="flex items-center gap-8 ml-12">
              <NavLink 
                to="/" 
                end 
                className={({isActive}) =>
                  isActive ? "text-vine-green-500 font-semibold text-base" : "text-gray-700 hover:text-vine-green-500"
                }
              >
                Home
              </NavLink>

              {/* ⭐ NEW: Tools Dropdown (only show when logged in) */}
              {user && (
                <div className="relative" ref={toolsMenuRef}>
                  <button
                    onClick={() => setShowToolsMenu(!showToolsMenu)}
                    className={`flex items-center gap-1 text-base font-semibold transition-colors ${
                      ['/planner', '/vineyard', '/production', '/inventory', '/sales'].some(path => 
                        location.pathname.startsWith(path)
                      )
                        ? "text-vine-green-500"
                        : "text-gray-700 hover:text-vine-green-500"
                    }`}
                  >
                    Tools
                    <ChevronDown className={`w-4 h-4 transition-transform ${showToolsMenu ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Tools Dropdown Menu */}
                  {showToolsMenu && (
                    <div className="absolute left-0 top-full mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50">
                      {Object.values(MODULES).map(module => {
                        const hasAccess = subscription.modules.includes(module.id);
                        const isActive = location.pathname.startsWith(module.route);
                        const Icon = Icons[module.icon] || Icons.Package;
                        
                        return (
                          <button
                            key={module.id}
                            onClick={() => handleModuleClick(module)}
                            className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                              isActive ? 'bg-vine-green-50' : ''
                            }`}
                          >
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              isActive ? 'bg-vine-green-100' : 'bg-gray-100'
                            }`}>
                              <Icon className={`w-5 h-5 ${
                                isActive ? 'text-vine-green-600' : 'text-gray-600'
                              }`} />
                            </div>
                            
                            <div className="flex-1 text-left">
                              <div className="flex items-center gap-2">
                                <span className={`font-medium ${
                                  isActive ? 'text-vine-green-700' : 'text-gray-900'
                                }`}>
                                  {module.name}
                                </span>
                                {!hasAccess && <Icons.Lock className="w-3 h-3 text-gray-400" />}
                                {module.comingSoon && (
                                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                    Soon
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {module.description}
                              </p>
                            </div>

                            {isActive && (
                              <div className="w-1 h-8 bg-vine-green-500 rounded-full absolute right-2" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Show Vineyards link only when not logged in (for marketing) */}
              {!user && (
                <NavLink 
                  to="/vineyards" 
                  className={({isActive}) =>
                    isActive ? "text-vine-green-500 font-semibold text-base" : "text-gray-700 hover:text-vine-green-500"
                  }
                >
                  Vineyards
                </NavLink>
              )}

              <NavLink 
                to="/docs" 
                className={({isActive}) =>
                  isActive ? "text-vine-green-500 font-semibold text-base" : "text-gray-700 hover:text-vine-green-500"
                }
              >
                Documentation
              </NavLink>

              <NavLink 
                to="/about" 
                className={({isActive}) =>
                  isActive ? "text-vine-green-500 font-semibold text-base" : "text-gray-700 hover:text-vine-green-500"
                }
              >
                About
              </NavLink>
            </nav>

            {/* Right side */}
            <div className="ml-auto flex items-center gap-4">

              {user ? (
                <>
                  {/* Upgrade button if not on highest tier */}
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
                          {/* Show current tier */}
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
        </div>
      </header>

      {/* Main Content */}
      <main className={needsPadding ? "max-w-screen-2xl mx-auto px-6 py-10" : ""}>
        <Outlet key={location.pathname} />
      </main>
    </div>
  );
}