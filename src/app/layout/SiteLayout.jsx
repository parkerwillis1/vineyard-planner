import React, { useState, useRef, useEffect } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { supabase } from "@/shared/lib/supabaseClient";
import { useSubscription } from "@/shared/hooks/useSubscription";
import { MODULES } from "@/shared/config/modules";
import * as Icons from "lucide-react";
import { ChevronDown, BookOpen, DollarSign, HelpCircle, Mail, FileText, Lightbulb, Briefcase, BookMarked } from "lucide-react";

export default function SiteLayout() {
  const { user } = useAuth() || {};
  const subscription = useSubscription();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const [showResourcesMenu, setShowResourcesMenu] = useState(false);
  const [showAboutMenu, setShowAboutMenu] = useState(false);
  const toolsMenuRef = useRef(null);
  const resourcesMenuRef = useRef(null);
  const aboutMenuRef = useRef(null);

  const needsPadding = ['/signin', '/signup', '/account/settings'].includes(location.pathname);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(event.target)) {
        setShowToolsMenu(false);
      }
      if (resourcesMenuRef.current && !resourcesMenuRef.current.contains(event.target)) {
        setShowResourcesMenu(false);
      }
      if (aboutMenuRef.current && !aboutMenuRef.current.contains(event.target)) {
        setShowAboutMenu(false);
      }
    };

    if (showToolsMenu || showResourcesMenu || showAboutMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showToolsMenu, showResourcesMenu, showAboutMenu]);

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
              {!user ? (
                <>
                  {/* GUEST NAVIGATION: Home, Products, Pricing, Resources, About */}
                  <NavLink
                    to="/"
                    end
                    className={({isActive}) =>
                      isActive ? "text-vine-green-500 font-semibold text-base" : "text-gray-700 hover:text-vine-green-500"
                    }
                  >
                    Home
                  </NavLink>

                  <NavLink
                    to="/products"
                    className={({isActive}) =>
                      isActive ? "text-vine-green-500 font-semibold text-base" : "text-gray-700 hover:text-vine-green-500"
                    }
                  >
                    Products
                  </NavLink>

                  <NavLink
                    to="/pricing"
                    className={({isActive}) =>
                      isActive ? "text-vine-green-500 font-semibold text-base" : "text-gray-700 hover:text-vine-green-500"
                    }
                  >
                    Pricing
                  </NavLink>

                  {/* Resources Dropdown */}
                  <div className="relative" ref={resourcesMenuRef}>
                    <button
                      onClick={() => setShowResourcesMenu(!showResourcesMenu)}
                      className="flex items-center gap-1 text-base font-semibold text-gray-700 hover:text-vine-green-500 bg-transparent border-0 p-0"
                    >
                      Resources
                      <ChevronDown className={`w-4 h-4 transition-transform ${showResourcesMenu ? 'rotate-180' : ''}`} />
                    </button>

                    {showResourcesMenu && (
                      <div className="absolute left-0 top-full mt-2 w-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 p-5 z-50">
                        <h3 className="text-base font-semibold text-gray-900 mb-3">Free resources for vineyard owners</h3>

                        <div className="grid grid-cols-2 gap-3">
                          {/* Documentation */}
                          <Link
                            to="/docs"
                            onClick={() => setShowResourcesMenu(false)}
                            className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                          >
                            <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0 group-hover:bg-teal-100 transition-colors">
                              <BookOpen className="w-5 h-5 text-teal-600" />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900 mb-1">Documentation</div>
                              <div className="text-sm text-gray-600">Learn how to use Vine Pioneer</div>
                            </div>
                          </Link>

                          {/* Pricing */}
                          <Link
                            to="/pricing"
                            onClick={() => setShowResourcesMenu(false)}
                            className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                          >
                            <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0 group-hover:bg-teal-100 transition-colors">
                              <DollarSign className="w-5 h-5 text-teal-600" />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900 mb-1">Pricing</div>
                              <div className="text-sm text-gray-600">View plans and pricing</div>
                            </div>
                          </Link>

                          {/* FAQ */}
                          <Link
                            to="/faq"
                            onClick={() => setShowResourcesMenu(false)}
                            className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                          >
                            <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0 group-hover:bg-teal-100 transition-colors">
                              <HelpCircle className="w-5 h-5 text-teal-600" />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900 mb-1">FAQs</div>
                              <div className="text-sm text-gray-600">Answers to frequent questions</div>
                            </div>
                          </Link>

                          {/* Contact */}
                          <Link
                            to="/contact"
                            onClick={() => setShowResourcesMenu(false)}
                            className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                          >
                            <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0 group-hover:bg-teal-100 transition-colors">
                              <Mail className="w-5 h-5 text-teal-600" />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900 mb-1">Contact Us</div>
                              <div className="text-sm text-gray-600">Get in touch with our team</div>
                            </div>
                          </Link>

                          {/* Blog */}
                          <Link
                            to="/blog"
                            onClick={() => setShowResourcesMenu(false)}
                            className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                          >
                            <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0 group-hover:bg-teal-100 transition-colors">
                              <FileText className="w-5 h-5 text-teal-600" />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900 mb-1">Blog</div>
                              <div className="text-sm text-gray-600">Vineyard planning insights</div>
                            </div>
                          </Link>

                          {/* Tips */}
                          <Link
                            to="/tips"
                            onClick={() => setShowResourcesMenu(false)}
                            className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                          >
                            <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0 group-hover:bg-teal-100 transition-colors">
                              <Lightbulb className="w-5 h-5 text-teal-600" />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900 mb-1">Planning Tips</div>
                              <div className="text-sm text-gray-600">Best practices for success</div>
                            </div>
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>

                  <NavLink
                    to="/about"
                    className={({isActive}) =>
                      isActive ? "text-vine-green-500 font-semibold text-base" : "text-gray-700 hover:text-vine-green-500"
                    }
                  >
                    About
                  </NavLink>
                </>
              ) : (
                <>
                  {/* AUTHENTICATED NAVIGATION: Tools, Documentation, Resources, About */}

                  {/* Tools Dropdown */}
                  <div className="relative" ref={toolsMenuRef}>
                    <button
                      onClick={() => setShowToolsMenu(!showToolsMenu)}
                      className={`flex items-center gap-1 text-base font-semibold transition-colors bg-transparent border-0 p-0 ${
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

                    {showToolsMenu && (
                      <div className="absolute left-0 top-full mt-2 w-[550px] bg-white rounded-2xl shadow-2xl border border-gray-200 p-5 z-50">
                        <h3 className="text-base font-semibold text-gray-900 mb-3">Your planning tools</h3>

                        <div className="grid grid-cols-2 gap-3">
                          {Object.values(MODULES).map(module => {
                            const hasAccess = subscription.modules.includes(module.id);
                            const isActive = location.pathname.startsWith(module.route);
                            const Icon = Icons[module.icon] || Icons.Package;

                            return (
                              <button
                                key={module.id}
                                onClick={() => handleModuleClick(module)}
                                className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group text-left"
                              >
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                                  isActive
                                    ? 'bg-vine-green-100'
                                    : 'bg-teal-50 group-hover:bg-teal-100'
                                }`}>
                                  <Icon className={`w-5 h-5 ${
                                    isActive ? 'text-vine-green-600' : 'text-teal-600'
                                  }`} />
                                </div>

                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className={`font-semibold ${
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
                                  <p className="text-sm text-gray-600">
                                    {module.description}
                                  </p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <NavLink
                    to="/docs"
                    className={({isActive}) =>
                      isActive ? "text-vine-green-500 font-semibold text-base" : "text-gray-700 hover:text-vine-green-500"
                    }
                  >
                    Documentation
                  </NavLink>

                  {/* Resources Dropdown */}
                  <div className="relative" ref={resourcesMenuRef}>
                    <button
                      onClick={() => setShowResourcesMenu(!showResourcesMenu)}
                      className="flex items-center gap-1 text-base font-semibold text-gray-700 hover:text-vine-green-500 bg-transparent border-0 p-0"
                    >
                      Resources
                      <ChevronDown className={`w-4 h-4 transition-transform ${showResourcesMenu ? 'rotate-180' : ''}`} />
                    </button>

                    {showResourcesMenu && (
                      <div className="absolute left-0 top-full mt-2 w-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 p-5 z-50">
                        <h3 className="text-base font-semibold text-gray-900 mb-3">Free resources for vineyard owners</h3>

                        <div className="grid grid-cols-2 gap-3">
                          {/* Documentation */}
                          <Link
                            to="/docs"
                            onClick={() => setShowResourcesMenu(false)}
                            className="flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors group"
                          >
                            <div className="w-12 h-12 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0 group-hover:bg-teal-100 transition-colors">
                              <BookOpen className="w-6 h-6 text-teal-600" />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900 mb-1">Documentation</div>
                              <div className="text-sm text-gray-600">Learn how to use Vine Pioneer</div>
                            </div>
                          </Link>

                          {/* Pricing */}
                          <Link
                            to="/pricing"
                            onClick={() => setShowResourcesMenu(false)}
                            className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                          >
                            <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0 group-hover:bg-teal-100 transition-colors">
                              <DollarSign className="w-5 h-5 text-teal-600" />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900 mb-1">Pricing</div>
                              <div className="text-sm text-gray-600">View plans and pricing</div>
                            </div>
                          </Link>

                          {/* FAQ */}
                          <Link
                            to="/faq"
                            onClick={() => setShowResourcesMenu(false)}
                            className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                          >
                            <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0 group-hover:bg-teal-100 transition-colors">
                              <HelpCircle className="w-5 h-5 text-teal-600" />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900 mb-1">FAQs</div>
                              <div className="text-sm text-gray-600">Answers to frequent questions</div>
                            </div>
                          </Link>

                          {/* Contact */}
                          <Link
                            to="/contact"
                            onClick={() => setShowResourcesMenu(false)}
                            className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                          >
                            <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0 group-hover:bg-teal-100 transition-colors">
                              <Mail className="w-5 h-5 text-teal-600" />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900 mb-1">Contact Us</div>
                              <div className="text-sm text-gray-600">Get in touch with our team</div>
                            </div>
                          </Link>

                          {/* Blog */}
                          <Link
                            to="/blog"
                            onClick={() => setShowResourcesMenu(false)}
                            className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                          >
                            <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0 group-hover:bg-teal-100 transition-colors">
                              <FileText className="w-5 h-5 text-teal-600" />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900 mb-1">Blog</div>
                              <div className="text-sm text-gray-600">Vineyard planning insights</div>
                            </div>
                          </Link>

                          {/* Tips */}
                          <Link
                            to="/tips"
                            onClick={() => setShowResourcesMenu(false)}
                            className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                          >
                            <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0 group-hover:bg-teal-100 transition-colors">
                              <Lightbulb className="w-5 h-5 text-teal-600" />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900 mb-1">Planning Tips</div>
                              <div className="text-sm text-gray-600">Best practices for success</div>
                            </div>
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* About Dropdown */}
                  <div className="relative" ref={aboutMenuRef}>
                    <button
                      onClick={() => setShowAboutMenu(!showAboutMenu)}
                      className={`flex items-center gap-1 text-base font-semibold transition-colors bg-transparent border-0 p-0 ${
                        ['/products', '/about'].includes(location.pathname)
                          ? "text-vine-green-500"
                          : "text-gray-700 hover:text-vine-green-500"
                      }`}
                    >
                      About
                      <ChevronDown className={`w-4 h-4 transition-transform ${showAboutMenu ? 'rotate-180' : ''}`} />
                    </button>

                    {showAboutMenu && (
                      <div className="absolute left-0 top-full mt-2 w-[350px] bg-white rounded-2xl shadow-2xl border border-gray-200 p-5 z-50">
                        <h3 className="text-base font-semibold text-gray-900 mb-3">Learn more about us</h3>

                        <div className="space-y-2">
                          <Link
                            to="/products"
                            onClick={() => setShowAboutMenu(false)}
                            className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                          >
                            <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0 group-hover:bg-teal-100 transition-colors">
                              <Briefcase className="w-5 h-5 text-teal-600" />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900 mb-1">Products</div>
                              <div className="text-sm text-gray-600">See what we offer</div>
                            </div>
                          </Link>

                          <Link
                            to="/about"
                            onClick={() => setShowAboutMenu(false)}
                            className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                          >
                            <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0 group-hover:bg-teal-100 transition-colors">
                              <BookMarked className="w-5 h-5 text-teal-600" />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900 mb-1">Our Story</div>
                              <div className="text-sm text-gray-600">How Vine Pioneer began</div>
                            </div>
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
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