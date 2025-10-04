import React from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";

const linkBase = "px-3 py-2 rounded-md text-sm font-medium";
const active = "text-blue-800";
const idle   = "text-blue-700/80 hover:text-blue-900 hover:bg-blue-50";

export default function NavBar() {
  const { user } = useAuth() || {};

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2">
          <img src="/VineSightLogo.png" alt="Vine Pioneer" className="h-7" />
          <span className="font-semibold text-blue-900">Vine Pioneer</span>
        </Link>

        <nav className="ml-4 flex items-center gap-1">
          <NavLink to="/" end className={({isActive})=>`${linkBase} ${isActive?active:idle}`}>Home</NavLink>
          <NavLink to="/app" className={({isActive})=>`${linkBase} ${isActive?active:idle}`}>Planner</NavLink>
          <NavLink to="/vineyards" className={({isActive})=>`${linkBase} ${isActive?active:idle}`}>Vineyards</NavLink>
          <NavLink to="/docs" className={({isActive})=>`${linkBase} ${isActive?active:idle}`}>Docs</NavLink>
          <NavLink to="/plans" className={({isActive})=>`${linkBase} ${isActive?active:idle}`}>My Plans</NavLink>
        </nav>

        <div className="ml-auto flex items-center gap-3">
          {user ? (
            <>
              <span className="hidden sm:block text-xs text-gray-600">{user.email}</span>
              <Link to="/app" className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700">
                Open Planner
              </Link>
            </>
          ) : (
            <>
              <Link to="/signin" className={`${linkBase} ${idle}`}>Sign in</Link>
              <Link to="/signup" className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700">
                Create account
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
