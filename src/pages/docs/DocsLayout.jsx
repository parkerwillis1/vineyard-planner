import { Link, useLocation, useNavigate } from "react-router-dom";
import { ChevronRight, ChevronLeft, LogOut } from "lucide-react";
import { docsNavigation, getBreadcrumbs } from "./docsConfig";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/auth/AuthContext";
import { supabase } from "@/shared/lib/supabaseClient";
import DocsSearch from "./DocsSearch";
import { useSearchHighlight } from "./useSearchHighlight";

export default function DocsLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const breadcrumbs = getBreadcrumbs(location.pathname);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarRef = useRef(null);
  const scrollPositionRef = useRef(0);
  const contentRef = useRef(null);
  const { user } = useAuth() || {};

  // Enable search term highlighting
  useSearchHighlight(contentRef);

  // Save scroll position when scrolling
  const handleScroll = () => {
    if (sidebarRef.current) {
      scrollPositionRef.current = sidebarRef.current.scrollTop;
    }
  };

  // Restore scroll position after route changes
  useEffect(() => {
    if (sidebarRef.current) {
      sidebarRef.current.scrollTop = scrollPositionRef.current;
    }
  }, [location.pathname]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Top Bar */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
          <div className="flex items-center gap-4">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100"
            >
              {sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </button>

            <Link to="/" className="flex items-center gap-2">
              <span className="text-xl font-bold text-vine-green-500">Vine Pioneer</span>
            </Link>
            <span className="text-sm text-gray-400 hidden sm:inline">docs</span>
          </div>

          {/* Search bar - centered */}
          <div className="hidden sm:flex items-center justify-center flex-1 mx-8">
            <div className="w-full max-w-xl">
              <DocsSearch />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <span className="text-sm text-gray-600 hidden sm:inline max-w-[150px] truncate">
                  {user.email}
                </span>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/signin"
                  className="text-sm font-medium text-gray-600 hover:text-gray-900"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="text-sm font-semibold text-white bg-vine-green-500 hover:bg-vine-green-600 px-4 py-2 rounded-lg transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar Navigation */}
        <aside
          ref={sidebarRef}
          onScroll={handleScroll}
          className={`${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0 fixed lg:sticky top-16 left-0 z-30 w-56 h-[calc(100vh-4rem)] overflow-y-auto border-r border-gray-200 bg-white transition-transform duration-200 ease-in-out`}
        >
          <nav className="p-6 space-y-8">
            {docsNavigation.map((section) => (
              <div key={section.title}>
                <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-3">
                  {section.title}
                </h3>
                <ul className="space-y-1">
                  {section.items.map((item) => {
                    const isActive = location.pathname === item.href;
                    return (
                      <li key={item.href}>
                        <Link
                          to={item.href}
                          onClick={() => setSidebarOpen(false)}
                          className={`block px-3 py-2 text-sm rounded-md transition-colors ${
                            isActive
                              ? "bg-vine-green-50 text-vine-green-700 font-semibold"
                              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                          }`}
                        >
                          {item.title}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {/* Breadcrumbs */}
          <div className="border-b border-gray-200 bg-gray-50">
            <div className="max-w-4xl mx-auto px-6 sm:px-8 py-4">
              <nav className="flex items-center gap-2 text-sm">
                {breadcrumbs.map((crumb, index) => (
                  <div key={crumb.href} className="flex items-center gap-2">
                    {index > 0 && <ChevronRight className="w-4 h-4 text-gray-400" />}
                    {index === breadcrumbs.length - 1 ? (
                      <span className="text-gray-900 font-medium">{crumb.title}</span>
                    ) : (
                      <Link
                        to={crumb.href}
                        className="text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        {crumb.title}
                      </Link>
                    )}
                  </div>
                ))}
              </nav>
            </div>
          </div>

          {/* Page Content */}
          <div ref={contentRef} className="max-w-4xl mx-auto px-6 sm:px-8 py-12">
            {children}
          </div>
        </main>
      </div>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-gray-900/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
