import React, { useState, useRef, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import { ChevronDown, Settings, LogOut } from "lucide-react";
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  // Resources dropdown items
  const resourcesItems = [
    { to: "/docs", label: "Documentation", icon: null },
    { to: "/pricing", label: "Pricing", icon: null },
  ];

  // About dropdown items (for authenticated users)
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
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <img src="/VineSightLogo.png" alt="Vine Pioneer" className="h-8" />
          <span className="font-bold text-gray-900 group-hover:text-teal-700 transition-colors">Vine Pioneer</span>
        </Link>

        {/* Main Navigation */}
        <nav className="ml-6 hidden md:flex items-center gap-1">
          {!user ? (
            <>
              {/* Guest Navigation */}
              <NavLink to="/products" className={({isActive})=>`${linkBase} ${isActive?active:idle}`}>
                Products
              </NavLink>
              <NavLink to="/pricing" className={({isActive})=>`${linkBase} ${isActive?active:idle}`}>
                Pricing
              </NavLink>
              <NavLink to="/about" className={({isActive})=>`${linkBase} ${isActive?active:idle}`}>
                About
              </NavLink>
              <Dropdown trigger="Resources" items={resourcesItems} />
            </>
          ) : (
            <>
              {/* Authenticated Navigation */}
              <NavLink to="/planner" className={({isActive})=>`${linkBase} ${isActive?active:idle}`}>
                Planner
              </NavLink>
              <NavLink to="/plans" className={({isActive})=>`${linkBase} ${isActive?active:idle}`}>
                My Plans
              </NavLink>
              <Dropdown trigger="About" items={aboutItems} />
              <Dropdown trigger="Resources" items={resourcesItems} />
            </>
          )}
        </nav>

        {/* Right side actions */}
        <div className="ml-auto flex items-center gap-3">
          {user ? (
            <>
              <span className="hidden lg:block text-sm text-gray-600 max-w-[200px] truncate">
                {user.email}
              </span>
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
            </>
          ) : (
            <>
              <Link to="/signin" className={`${linkBase} ${idle} hidden sm:block`}>
                Sign in
              </Link>
              <Link
                to="/signup"
                className="px-4 py-2 text-sm font-semibold bg-gradient-to-r from-teal-600 to-vine-green-600 text-white rounded-lg hover:from-teal-500 hover:to-vine-green-500 shadow-sm hover:shadow-md transition-all"
              >
                Get Started Free
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Mobile Navigation (simplified) */}
      <div className="md:hidden border-t border-gray-200 px-4 py-2 bg-white">
        <nav className="flex flex-wrap gap-2">
          {!user ? (
            <>
              <NavLink to="/products" className={({isActive})=>`${linkBase} text-xs ${isActive?active:idle}`}>
                Products
              </NavLink>
              <NavLink to="/pricing" className={({isActive})=>`${linkBase} text-xs ${isActive?active:idle}`}>
                Pricing
              </NavLink>
              <NavLink to="/docs" className={({isActive})=>`${linkBase} text-xs ${isActive?active:idle}`}>
                Docs
              </NavLink>
              <NavLink to="/about" className={({isActive})=>`${linkBase} text-xs ${isActive?active:idle}`}>
                About
              </NavLink>
            </>
          ) : (
            <>
              <NavLink to="/planner" className={({isActive})=>`${linkBase} text-xs ${isActive?active:idle}`}>
                Planner
              </NavLink>
              <NavLink to="/plans" className={({isActive})=>`${linkBase} text-xs ${isActive?active:idle}`}>
                Plans
              </NavLink>
              <NavLink to="/docs" className={({isActive})=>`${linkBase} text-xs ${isActive?active:idle}`}>
                Docs
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
