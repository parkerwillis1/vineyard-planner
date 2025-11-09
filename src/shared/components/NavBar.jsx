import React, { useState, useRef, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import { ChevronDown, Settings, LogOut, Menu, X } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import { supabase } from "@/shared/lib/supabaseClient";

const linkBase = "px-3 py-2 rounded-md text-sm font-medium transition-colors";
const active = "text-teal-700 bg-teal-50";
const idle = "text-gray-700 hover:text-teal-700 hover:bg-teal-50/50";

// Dropdown component
function Dropdown({ trigger, items }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`${linkBase} ${idle} flex items-center gap-1`}
      >
        {trigger}
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-48 rounded-lg bg-white shadow-lg border border-gray-200 py-1 z-50">
          {items.map((item, idx) => (
            item.divider ? (
              <div key={idx} className="my-1 border-t border-gray-200" />
            ) : (
              <Link
                key={idx}
                to={item.to}
                onClick={() => {
                  setIsOpen(false);
                  item.onClick?.();
                }}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-teal-50 hover:text-teal-700 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {item.icon}
                  {item.label}
                </div>
              </Link>
            )
          ))}
        </div>
      )}
    </div>
  );
}

export default function NavBar() {
  const { user } = useAuth() || {};
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

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

  // Close mobile menu when clicking outside
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

  // Tools dropdown items (for authenticated users)
  const toolsItems = [
    { to: "/vineyard?view=dashboard", label: "Dashboard", icon: null },
    { to: "/planner", label: "Planner", icon: null },
    { to: "/plans", label: "My Plans", icon: null },
  ];

  // Resources dropdown items (for both guests and auth users)
  const resourcesItems = [
    { to: "/docs", label: "Documentation", icon: null },
    { to: "/pricing", label: "Pricing", icon: null },
  ];

  // About dropdown items (for authenticated users only)
  const aboutItems = [
    { to: "/products", label: "Products", icon: null },
    { to: "/about", label: "Our Story", icon: null },
  ];

  // Account dropdown items (for authenticated users)
  const accountItems = [
    { to: "/account/settings", label: "Account Settings", icon: <Settings className="w-4 h-4" /> },
    { divider: true },
    { to: "#", label: "Sign Out", icon: <LogOut className="w-4 h-4" />, onClick: handleSignOut },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <img src="/VineSightLogo.png" alt="Vine Pioneer" className="h-8" />
          <span className="font-bold text-gray-900 group-hover:text-teal-700 transition-colors">Vine Pioneer</span>
        </Link>

        {/* Main Navigation - Desktop Only (Large screens and up) */}
        <nav className="ml-6 hidden lg:flex items-center gap-1">
          {!user ? (
            <>
              {/* Guest Navigation: Home, Products, Pricing, Resources, About */}
              <NavLink to="/" className={({isActive})=>`${linkBase} ${isActive?active:idle}`}>
                Home
              </NavLink>
              <NavLink to="/products" className={({isActive})=>`${linkBase} ${isActive?active:idle}`}>
                Products
              </NavLink>
              <NavLink to="/pricing" className={({isActive})=>`${linkBase} ${isActive?active:idle}`}>
                Pricing
              </NavLink>
              <Dropdown trigger="Resources" items={resourcesItems} />
              <NavLink to="/about" className={({isActive})=>`${linkBase} ${isActive?active:idle}`}>
                About
              </NavLink>
            </>
          ) : (
            <>
              {/* Authenticated Navigation: Tools, Documentation, Resources, About */}
              <Dropdown trigger="Tools" items={toolsItems} />
              <NavLink to="/docs" className={({isActive})=>`${linkBase} ${isActive?active:idle}`}>
                Documentation
              </NavLink>
              <Dropdown trigger="Resources" items={resourcesItems} />
              <Dropdown trigger="About" items={aboutItems} />
            </>
          )}
        </nav>

        {/* Right side actions */}
        <div className="ml-auto flex items-center gap-2">
          {/* Hamburger Menu Button - Mobile & Tablet */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-teal-50 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 text-gray-900" />
            ) : (
              <Menu className="w-6 h-6 text-gray-900" />
            )}
          </button>

          {/* Desktop actions */}
          {user ? (
            <>
              <span className="hidden xl:block text-sm text-gray-600 max-w-[200px] truncate">
                {user.email}
              </span>
              <div className="hidden lg:block">
                <Dropdown
                  trigger={
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 hover:border-teal-500 transition-colors">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-500 to-vine-green-500 flex items-center justify-center text-white text-sm font-bold">
                        {user.email?.[0]?.toUpperCase() || 'U'}
                      </div>
                    </div>
                  }
                  items={accountItems}
                />
              </div>
            </>
          ) : (
            <>
              <Link to="/signin" className={`${linkBase} ${idle} hidden lg:block`}>
                Sign in
              </Link>
              <Link
                to="/signup"
                className="hidden lg:flex px-4 py-2 text-sm font-semibold bg-gradient-to-r from-teal-600 to-vine-green-600 text-white rounded-lg hover:from-teal-500 hover:to-vine-green-500 shadow-sm hover:shadow-md transition-all"
              >
                Get Started Free
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Mobile Slide-out Menu */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Slide-out Panel */}
          <div className="fixed top-16 right-0 bottom-0 w-64 bg-white shadow-2xl z-50 lg:hidden overflow-y-auto">
            <nav className="p-4 space-y-1">
              {!user ? (
                <>
                  {/* Guest Navigation */}
                  <NavLink
                    to="/"
                    className={({isActive})=>`block ${linkBase} ${isActive?active:idle}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Home
                  </NavLink>
                  <NavLink
                    to="/products"
                    className={({isActive})=>`block ${linkBase} ${isActive?active:idle}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Products
                  </NavLink>
                  <NavLink
                    to="/pricing"
                    className={({isActive})=>`block ${linkBase} ${isActive?active:idle}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Pricing
                  </NavLink>
                  <NavLink
                    to="/docs"
                    className={({isActive})=>`block ${linkBase} ${isActive?active:idle}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Documentation
                  </NavLink>
                  <NavLink
                    to="/about"
                    className={({isActive})=>`block ${linkBase} ${isActive?active:idle}`}
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
                  {/* Authenticated Navigation */}
                  <NavLink
                    to="/vineyard?view=dashboard"
                    className={({isActive})=>`block ${linkBase} ${isActive?active:idle}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </NavLink>
                  <NavLink
                    to="/planner"
                    className={({isActive})=>`block ${linkBase} ${isActive?active:idle}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Planner
                  </NavLink>
                  <NavLink
                    to="/plans"
                    className={({isActive})=>`block ${linkBase} ${isActive?active:idle}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    My Plans
                  </NavLink>
                  <NavLink
                    to="/docs"
                    className={({isActive})=>`block ${linkBase} ${isActive?active:idle}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Documentation
                  </NavLink>
                  <NavLink
                    to="/products"
                    className={({isActive})=>`block ${linkBase} ${isActive?active:idle}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Products
                  </NavLink>
                  <NavLink
                    to="/pricing"
                    className={({isActive})=>`block ${linkBase} ${isActive?active:idle}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Pricing
                  </NavLink>
                  <NavLink
                    to="/about"
                    className={({isActive})=>`block ${linkBase} ${isActive?active:idle}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    About
                  </NavLink>

                  {/* Account Section */}
                  <div className="pt-4 mt-4 border-t border-gray-200 space-y-1">
                    <div className="px-3 py-2 text-xs text-gray-500 truncate">
                      {user.email}
                    </div>
                    <Link
                      to="/account/settings"
                      className="block px-3 py-2 text-sm text-gray-700 hover:bg-teal-50 hover:text-teal-700 rounded-md transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <div className="flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        Account Settings
                      </div>
                    </Link>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleSignOut();
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-teal-50 hover:text-teal-700 rounded-md transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </div>
                    </button>
                  </div>
                </>
              )}
            </nav>
          </div>
        </>
      )}
    </header>
  );
}
