import React, { useState, useRef, useEffect } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { supabase } from "@/shared/lib/supabaseClient";
import { useSubscription } from "@/shared/hooks/useSubscription";
import { MODULES } from "@/shared/config/modules";
import * as Icons from "lucide-react";
import { ChevronDown, BookOpen, DollarSign, HelpCircle, Mail, FileText, Lightbulb, Briefcase, BookMarked, ChevronLeft, ChevronRight, Calculator, MapPin, Wine } from "lucide-react";
import { ProductsMegaMenu } from "@/shared/components/ProductsMegaMenu";

export default function SiteLayout() {
  const { user, loading: authLoading } = useAuth() || {};
  const subscription = useSubscription();
  const location = useLocation();
  const navigate = useNavigate();

  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const [showResourcesMenu, setShowResourcesMenu] = useState(false);
  const [showAboutMenu, setShowAboutMenu] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Mobile menu sections collapsed state
  const [mobileToolsExpanded, setMobileToolsExpanded] = useState(true);
  const [mobileResourcesExpanded, setMobileResourcesExpanded] = useState(false);
  const [mobileAboutExpanded, setMobileAboutExpanded] = useState(false);
  const toolsMenuRef = useRef(null);
  const resourcesMenuRef = useRef(null);
  const aboutMenuRef = useRef(null);

  const needsPadding = ['/signin', '/signup', '/account/settings'].includes(location.pathname);

  // Hide footer on tool pages to give users more workspace
  const showFooter = !location.pathname.startsWith('/vineyard') && !location.pathname.startsWith('/planner') && !location.pathname.startsWith('/production');

  // Auto-hide navbar on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Show navbar when at top of page
      if (currentScrollY < 10) {
        setIsVisible(true);
      }
      // Hide when scrolling down, show when scrolling up
      else if (currentScrollY > lastScrollY && currentScrollY > 64) {
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY) {
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

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

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  const handleModuleClick = (module) => {
    console.log('🔍 handleModuleClick called for:', module.id, module);

    // TEMPORARILY DISABLED FOR TESTING: Allow vineyard access
    const hasAccess = subscription.modules.includes(module.id) || module.id === 'vineyard';
    console.log('🔑 hasAccess:', hasAccess, 'subscription.modules:', subscription.modules);

    setShowToolsMenu(false); // Close dropdown

    // Skip navigation for coming soon modules (except vineyard)
    if (module.comingSoon && module.id !== 'vineyard') {
      console.log('⏭️ Skipping - coming soon module');
      return;
    }

    if (hasAccess) {
      console.log('✅ Navigating to:', module.route);
      navigate(module.route);
    } else {
      console.log('🔒 No access - showing upgrade modal');
      // Trigger upgrade modal
      window.dispatchEvent(
        new CustomEvent('show-upgrade-modal', { detail: { moduleId: module.id } })
      );
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Main Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 transition-transform duration-300 print:hidden ${
          isVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Brand */}
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <img src="/Trellis_Logo/trellis_logo_black.png" alt="Trellis" className="h-10" />
            </Link>

            {/* Left nav - Desktop Only */}
            <nav className="hidden lg:flex items-center gap-8 ml-12">
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

                  {/* Products Dropdown */}
                  <ProductsMegaMenu />

                  <NavLink
                    to="/pricing"
                    className={({isActive}) =>
                      isActive ? "text-vine-green-500 font-semibold text-base" : "text-gray-700 hover:text-vine-green-500"
                    }
                  >
                    Pricing
                  </NavLink>

                  {/* Resources Dropdown */}
                  <div
                    className="relative"
                    ref={resourcesMenuRef}
                    onMouseEnter={() => setShowResourcesMenu(true)}
                    onMouseLeave={() => setShowResourcesMenu(false)}
                  >
                    <button
                      onClick={() => setShowResourcesMenu(!showResourcesMenu)}
                      className="flex items-center gap-1 text-base font-semibold text-gray-700 hover:text-vine-green-500 bg-transparent border-0 p-0"
                    >
                      Resources
                      <ChevronDown className={`w-4 h-4 transition-transform ${showResourcesMenu ? 'rotate-180' : ''}`} />
                    </button>

                    {showResourcesMenu && (
                      <div className="absolute left-0 top-full mt-0 w-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 p-5 z-50">
                        <h3 className="text-base font-semibold text-gray-900 mb-3">Free resources for vineyard owners</h3>

                        <div className="grid grid-cols-2 gap-3">
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
                  <div
                    className="relative"
                    ref={toolsMenuRef}
                    onMouseEnter={() => setShowToolsMenu(true)}
                    onMouseLeave={() => setShowToolsMenu(false)}
                  >
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
                      <div className="absolute left-0 top-full mt-1 w-[550px] bg-white rounded-2xl shadow-2xl border border-gray-200 p-5 z-50">
                        <h3 className="text-base font-semibold text-gray-900 mb-3">Your Trellis tools</h3>

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
                  <div
                    className="relative"
                    ref={resourcesMenuRef}
                    onMouseEnter={() => setShowResourcesMenu(true)}
                    onMouseLeave={() => setShowResourcesMenu(false)}
                  >
                    <button
                      onClick={() => setShowResourcesMenu(!showResourcesMenu)}
                      className="flex items-center gap-1 text-base font-semibold text-gray-700 hover:text-vine-green-500 bg-transparent border-0 p-0"
                    >
                      Resources
                      <ChevronDown className={`w-4 h-4 transition-transform ${showResourcesMenu ? 'rotate-180' : ''}`} />
                    </button>

                    {showResourcesMenu && (
                      <div className="absolute left-0 top-full mt-0 w-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 p-5 z-50">
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
                              <div className="text-sm text-gray-600">Learn how to use Trellis</div>
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
                  <div
                    className="relative"
                    ref={aboutMenuRef}
                    onMouseEnter={() => setShowAboutMenu(true)}
                    onMouseLeave={() => setShowAboutMenu(false)}
                  >
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
                      <div className="absolute left-0 top-full mt-1 w-[350px] bg-white rounded-2xl shadow-2xl border border-gray-200 p-5 z-50">
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
                              <div className="text-sm text-gray-600">How Trellis began</div>
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
              {/* Hamburger Menu Button - Mobile & Tablet */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-teal-50 transition-colors"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <ChevronLeft className="w-6 h-6 text-gray-900" />
                ) : (
                  <ChevronRight className="w-6 h-6 text-gray-900" />
                )}
              </button>

              {/* Desktop Right Side Items */}
              {user ? (
                <>
                  {/* Upgrade button if not on highest tier */}
                  {subscription.tier !== 'enterprise' && (
                    <Link
                      to="/pricing"
                      className="hidden lg:flex px-4 py-2 bg-gradient-to-r from-vine-green-500 to-vine-green-600 text-white rounded-lg font-semibold text-sm hover:shadow-lg transition-all duration-200 items-center gap-2"
                    >
                      <span>Upgrade</span>
                    </Link>
                  )}

                  {/* Account Menu */}
                  <div className="relative hidden lg:block">
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
                            onClick={async () => {
                              console.log('Sign out clicked');
                              setShowAccountMenu(false);

                              try {
                                console.log('Attempting sign out...');
                                const { error } = await supabase.auth.signOut();

                                if (error) {
                                  console.error('Sign out error:', error);
                                }

                                console.log('Clearing storage and redirecting...');
                                // Clear all local storage
                                localStorage.clear();
                                sessionStorage.clear();

                                // Force redirect
                                window.location.replace('/');
                              } catch (error) {
                                console.error('Exception during sign out:', error);
                                // Force sign out anyway
                                localStorage.clear();
                                sessionStorage.clear();
                                window.location.replace('/');
                              }
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
                <Link to="/signin" className="hidden lg:block text-vine-green-500 hover:underline font-medium text-base">
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Slide-out Menu - OUTSIDE HEADER */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed left-0 right-0 bottom-0 bg-black/50 z-[60] lg:hidden"
            style={{ top: '64px' }}
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Slide-out Panel */}
          <div
            className="fixed right-0 bottom-0 w-[85vw] max-w-sm bg-white shadow-2xl z-[70] lg:hidden overflow-y-auto animate-slideInRight"
            style={{ top: '64px' }}
          >
              <nav className="p-4 space-y-1">
                {!user ? (
                  <>
                    {/* Guest Navigation - Matches desktop: Home, Products, Pricing, Resources, About */}
                    <NavLink
                      to="/"
                      end
                      className={({isActive})=>`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'text-teal-700 bg-teal-50' : 'text-gray-700 hover:text-teal-700 hover:bg-teal-50/50'}`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Home
                    </NavLink>
                    <NavLink
                      to="/products"
                      className={({isActive})=>`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'text-teal-700 bg-teal-50' : 'text-gray-700 hover:text-teal-700 hover:bg-teal-50/50'}`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Products
                    </NavLink>
                    <NavLink
                      to="/pricing"
                      className={({isActive})=>`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'text-teal-700 bg-teal-50' : 'text-gray-700 hover:text-teal-700 hover:bg-teal-50/50'}`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Pricing
                    </NavLink>

                    {/* Resources Section - Collapsible */}
                    <div className="pt-3">
                      <button
                        onClick={() => setMobileResourcesExpanded(!mobileResourcesExpanded)}
                        className="w-full flex items-center justify-between px-3 py-1 text-xs font-semibold text-gray-500 uppercase hover:text-gray-700"
                      >
                        Resources
                        <ChevronDown className={`w-4 h-4 transition-transform ${mobileResourcesExpanded ? 'rotate-180' : ''}`} />
                      </button>
                      {mobileResourcesExpanded && (
                        <>
                          <NavLink
                            to="/faq"
                            className={({isActive})=>`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'text-teal-700 bg-teal-50' : 'text-gray-700 hover:text-teal-700 hover:bg-teal-50/50'}`}
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            FAQs
                          </NavLink>
                          <NavLink
                            to="/contact"
                            className={({isActive})=>`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'text-teal-700 bg-teal-50' : 'text-gray-700 hover:text-teal-700 hover:bg-teal-50/50'}`}
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            Contact Us
                          </NavLink>
                          <NavLink
                            to="/blog"
                            className={({isActive})=>`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'text-teal-700 bg-teal-50' : 'text-gray-700 hover:text-teal-700 hover:bg-teal-50/50'}`}
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            Blog
                          </NavLink>
                          <NavLink
                            to="/tips"
                            className={({isActive})=>`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'text-teal-700 bg-teal-50' : 'text-gray-700 hover:text-teal-700 hover:bg-teal-50/50'}`}
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            Planning Tips
                          </NavLink>
                        </>
                      )}
                    </div>

                    <NavLink
                      to="/about"
                      className={({isActive})=>`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'text-teal-700 bg-teal-50' : 'text-gray-700 hover:text-teal-700 hover:bg-teal-50/50'}`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      About
                    </NavLink>

                    {/* Mobile Sign In Button */}
                    <div className="pt-4 mt-4 border-t border-gray-200">
                      <Link
                        to="/signin"
                        className="block w-full text-center px-4 py-2 text-sm font-medium text-teal-700 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Sign In
                      </Link>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Authenticated Navigation - Matches desktop: Tools, Documentation, Resources, About */}

                    {/* Tools Section - Collapsible */}
                    <div>
                      <button
                        onClick={() => setMobileToolsExpanded(!mobileToolsExpanded)}
                        className="w-full flex items-center justify-between px-3 py-1 text-xs font-semibold text-gray-500 uppercase hover:text-gray-700"
                      >
                        Tools
                        <ChevronDown className={`w-4 h-4 transition-transform ${mobileToolsExpanded ? 'rotate-180' : ''}`} />
                      </button>
                      {mobileToolsExpanded && (
                        <>
                          {Object.values(MODULES).map(module => {
                            const hasAccess = subscription.modules.includes(module.id);
                            const Icon = Icons[module.icon] || Icons.Package;

                            return (
                              <button
                                key={module.id}
                                onClick={() => {
                                  setMobileMenuOpen(false);
                                  handleModuleClick(module);
                                }}
                                className="w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors text-gray-700 hover:text-teal-700 hover:bg-teal-50/50 flex items-center gap-2"
                              >
                                <Icon className="w-4 h-4" />
                                {module.name}
                                {!hasAccess && <Icons.Lock className="w-3 h-3 text-gray-400 ml-auto" />}
                                {module.comingSoon && (
                                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded ml-auto">
                                    Soon
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </>
                      )}
                    </div>

                    <NavLink
                      to="/docs"
                      className={({isActive})=>`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'text-teal-700 bg-teal-50' : 'text-gray-700 hover:text-teal-700 hover:bg-teal-50/50'}`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Documentation
                    </NavLink>

                    {/* Resources Section - Collapsible */}
                    <div className="pt-3">
                      <button
                        onClick={() => setMobileResourcesExpanded(!mobileResourcesExpanded)}
                        className="w-full flex items-center justify-between px-3 py-1 text-xs font-semibold text-gray-500 uppercase hover:text-gray-700"
                      >
                        Resources
                        <ChevronDown className={`w-4 h-4 transition-transform ${mobileResourcesExpanded ? 'rotate-180' : ''}`} />
                      </button>
                      {mobileResourcesExpanded && (
                        <>
                          <NavLink
                            to="/pricing"
                            className={({isActive})=>`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'text-teal-700 bg-teal-50' : 'text-gray-700 hover:text-teal-700 hover:bg-teal-50/50'}`}
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            Pricing
                          </NavLink>
                          <NavLink
                            to="/faq"
                            className={({isActive})=>`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'text-teal-700 bg-teal-50' : 'text-gray-700 hover:text-teal-700 hover:bg-teal-50/50'}`}
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            FAQs
                          </NavLink>
                          <NavLink
                            to="/contact"
                            className={({isActive})=>`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'text-teal-700 bg-teal-50' : 'text-gray-700 hover:text-teal-700 hover:bg-teal-50/50'}`}
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            Contact Us
                          </NavLink>
                          <NavLink
                            to="/blog"
                            className={({isActive})=>`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'text-teal-700 bg-teal-50' : 'text-gray-700 hover:text-teal-700 hover:bg-teal-50/50'}`}
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            Blog
                          </NavLink>
                          <NavLink
                            to="/tips"
                            className={({isActive})=>`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'text-teal-700 bg-teal-50' : 'text-gray-700 hover:text-teal-700 hover:bg-teal-50/50'}`}
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            Planning Tips
                          </NavLink>
                        </>
                      )}
                    </div>

                    {/* About Section - Collapsible */}
                    <div className="pt-3">
                      <button
                        onClick={() => setMobileAboutExpanded(!mobileAboutExpanded)}
                        className="w-full flex items-center justify-between px-3 py-1 text-xs font-semibold text-gray-500 uppercase hover:text-gray-700"
                      >
                        About
                        <ChevronDown className={`w-4 h-4 transition-transform ${mobileAboutExpanded ? 'rotate-180' : ''}`} />
                      </button>
                      {mobileAboutExpanded && (
                        <>
                          <NavLink
                            to="/products"
                            className={({isActive})=>`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'text-teal-700 bg-teal-50' : 'text-gray-700 hover:text-teal-700 hover:bg-teal-50/50'}`}
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            Products
                          </NavLink>
                          <NavLink
                            to="/about"
                            className={({isActive})=>`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'text-teal-700 bg-teal-50' : 'text-gray-700 hover:text-teal-700 hover:bg-teal-50/50'}`}
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            Our Story
                          </NavLink>
                        </>
                      )}
                    </div>

                    {/* Account Section */}
                    <div className="pt-4 mt-4 border-t border-gray-200 space-y-1">
                      <div className="px-3 py-2 text-xs text-gray-500">
                        Current Plan: <span className="font-semibold text-vine-green-700 capitalize">{subscription.tier}</span>
                      </div>
                      {subscription.tier !== 'enterprise' && (
                        <Link
                          to="/pricing"
                          className="block px-3 py-2 text-sm text-vine-green-600 hover:bg-teal-50 rounded-md transition-colors font-medium"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Upgrade Plan
                        </Link>
                      )}
                      <Link
                        to="/account/settings"
                        className="block px-3 py-2 text-sm text-gray-700 hover:bg-teal-50 hover:text-teal-700 rounded-md transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Account Settings
                      </Link>
                      <button
                        onClick={async () => {
                          setMobileMenuOpen(false);
                          try {
                            await supabase.auth.signOut();
                            localStorage.clear();
                            sessionStorage.clear();
                            window.location.replace('/');
                          } catch (error) {
                            console.error('Sign out error:', error);
                            localStorage.clear();
                            sessionStorage.clear();
                            window.location.replace('/');
                          }
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      >
                        Sign Out
                      </button>
                    </div>
                  </>
                )}
              </nav>
            </div>
          </>
        )}

      {/* Main Content */}
      <main className={needsPadding ? "max-w-screen-2xl mx-auto px-6 py-10 mt-16" : "mt-16"}>
        <Outlet key={location.pathname} />
      </main>

      {/* Footer */}
      {showFooter && (
      <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-300 border-t border-gray-700 print:hidden">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            {/* Products Column */}
            <div>
              <h3 className="text-teal-400 font-bold text-base mb-4 uppercase tracking-wider">Products</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/planner" className="text-white hover:text-teal-400 transition-colors text-sm">
                    Planner - Financial Planning
                  </Link>
                </li>
                <li>
                  <Link to="/vineyard?view=dashboard" className="text-white hover:text-teal-400 transition-colors text-sm">
                    Operations - Vineyard Management
                  </Link>
                </li>
              </ul>
            </div>

            {/* Features Column */}
            <div>
              <h3 className="text-teal-400 font-bold text-base mb-4 uppercase tracking-wider">Features</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/products#financial-planning" className="text-white hover:text-teal-400 transition-colors text-sm">
                    Financial Planning & Projections
                  </Link>
                </li>
                <li>
                  <Link to="/products#vineyard-design" className="text-white hover:text-teal-400 transition-colors text-sm">
                    Vineyard Layout Calculator
                  </Link>
                </li>
                <li>
                  <Link to="/products#block-management" className="text-white hover:text-teal-400 transition-colors text-sm">
                    Block & Field Management
                  </Link>
                </li>
                <li>
                  <Link to="/products#irrigation" className="text-white hover:text-teal-400 transition-colors text-sm">
                    Irrigation Planning
                  </Link>
                </li>
                <li>
                  <Link to="/products#satellite" className="text-white hover:text-teal-400 transition-colors text-sm">
                    Satellite Analytics (NDVI & ET)
                  </Link>
                </li>
                <li>
                  <Link to="/products#task-management" className="text-white hover:text-teal-400 transition-colors text-sm">
                    Task & Team Management
                  </Link>
                </li>
              </ul>
            </div>

            {/* Resources Column */}
            <div>
              <h3 className="text-teal-400 font-bold text-base mb-4 uppercase tracking-wider">Resources</h3>
              <ul className="space-y-2">
                {user && (
                  <li>
                    <Link to="/docs" className="text-white hover:text-teal-400 transition-colors text-sm">
                      Documentation
                    </Link>
                  </li>
                )}
                <li>
                  <Link to="/pricing" className="text-white hover:text-teal-400 transition-colors text-sm">
                    Pricing & Plans
                  </Link>
                </li>
                <li>
                  <Link to="/blog" className="text-white hover:text-teal-400 transition-colors text-sm">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link to="/tips" className="text-white hover:text-teal-400 transition-colors text-sm">
                    Vineyard Planning Tips
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company Column */}
            <div>
              <h3 className="text-teal-400 font-bold text-base mb-4 uppercase tracking-wider">Company</h3>
              <ul className="space-y-2 mb-4">
                <li>
                  <Link to="/about" className="text-white hover:text-teal-400 transition-colors text-sm">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="text-white hover:text-teal-400 transition-colors text-sm">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link to="/products" className="text-white hover:text-teal-400 transition-colors text-sm">
                    Our Products
                  </Link>
                </li>
                <li>
                  <a href="#" className="text-white hover:text-teal-400 transition-colors text-sm">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-white hover:text-teal-400 transition-colors text-sm">
                    Terms of Service
                  </a>
                </li>
              </ul>

              {/* Get in Touch Section */}
              <div className="mt-6">
                <h4 className="text-teal-400 font-semibold text-xs mb-2 uppercase tracking-wider">Get in Touch</h4>
                <Link
                  to="/contact"
                  className="inline-block px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg transition-all text-xs font-medium"
                >
                  Request a Demo
                </Link>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-6 border-t border-gray-700 flex flex-col md:flex-row justify-between items-center gap-3">
            {/* Logo and Copyright */}
            <div className="flex items-center gap-3">
              <img src="/Trellis_Logo/trellis_logo_white.png" alt="Trellis" className="h-6" />
              <div className="text-xs text-gray-400">
                © {new Date().getFullYear()} Trellis. All rights reserved.
              </div>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-4">
              <a
                href="mailto:support@vinepioneer.com"
                className="text-gray-400 hover:text-teal-400 transition-colors"
                aria-label="Email"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
      )}
    </div>
  );
}