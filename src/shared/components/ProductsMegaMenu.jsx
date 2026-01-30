import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Calculator, MapPin, Wine, ArrowRight, Package, TrendingUp } from "lucide-react";

export function ProductsMegaMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div
      className="relative"
      ref={menuRef}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-base font-semibold text-gray-700 hover:text-vine-green-500 transition-colors flex items-center gap-1 bg-transparent border-0 p-0"
      >
        Products
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          className="absolute top-full left-0 mt-0 w-[800px] rounded-2xl bg-white shadow-2xl border border-gray-200 p-6 z-50"
        >
          <div className="grid grid-cols-3 gap-4">
            {/* Financial Planner */}
            <Link
              to="/products/planner"
              onClick={() => setIsOpen(false)}
              className="group p-4 rounded-lg hover:bg-teal-50 transition-all border border-gray-200 hover:border-teal-200 hover:shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center group-hover:bg-teal-200 transition-colors">
                  <Calculator className="w-5 h-5 text-teal-700" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 group-hover:text-teal-700 transition-colors">
                      Financial Planner
                    </h3>
                    <span className="px-2 py-0.5 bg-teal-100 text-teal-700 text-xs font-medium rounded">
                      FREE
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Complete vineyard financial planning and design tools
                  </p>
                  <ul className="mt-3 space-y-1 text-xs text-gray-500">
                    <li>• 10-30 year projections</li>
                    <li>• Vineyard layout calculator</li>
                    <li>• Material cost estimator</li>
                    <li>• Lender-ready reports</li>
                  </ul>
                </div>
              </div>
            </Link>

            {/* Vineyard Operations */}
            <Link
              to="/products/operations"
              onClick={() => setIsOpen(false)}
              className="group p-4 rounded-lg hover:bg-blue-50 transition-all border border-gray-200 hover:border-blue-200 hover:shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <MapPin className="w-5 h-5 text-blue-700" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                      Vineyard Operations
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    Complete vineyard management and operations platform
                  </p>
                  <ul className="mt-3 space-y-1 text-xs text-gray-500">
                    <li>• Block mapping & tracking</li>
                    <li>• Task & team management</li>
                    <li>• Spray program tracking</li>
                    <li>• IoT sensor integration</li>
                  </ul>
                </div>
              </div>
            </Link>

            {/* Wine Production */}
            <Link
              to="/products/production"
              onClick={() => setIsOpen(false)}
              className="group p-4 rounded-lg hover:bg-purple-50 transition-all border border-gray-200 hover:border-purple-200 hover:shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                  <Wine className="w-5 h-5 text-purple-700" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 group-hover:text-purple-700 transition-colors">
                      Wine Production
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    Professional winery production tracking and management
                  </p>
                  <ul className="mt-3 space-y-1 text-xs text-gray-500">
                    <li>• Harvest & crush tracking</li>
                    <li>• Fermentation monitoring</li>
                    <li>• Blend calculator</li>
                    <li>• Inventory management</li>
                  </ul>
                </div>
              </div>
            </Link>
          </div>

          {/* Coming Soon Products - Compact */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-3">
              {/* Inventory */}
              <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 border border-gray-200">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center">
                  <Package className="w-4 h-4 text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-sm font-semibold text-gray-900">Inventory</h4>
                    <span className="px-1.5 py-0.5 bg-gray-200 text-gray-600 text-xs font-medium rounded">
                      SOON
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">Manage grape, wine, and bottle inventory</p>
                </div>
              </div>

              {/* Sales & Distribution */}
              <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 border border-gray-200">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-sm font-semibold text-gray-900">Sales & Distribution</h4>
                    <span className="px-1.5 py-0.5 bg-gray-200 text-gray-600 text-xs font-medium rounded">
                      SOON
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">CRM, orders, and wine club management</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom section */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">Not sure which product is right for you?</p>
                <p className="text-xs text-gray-500 mt-0.5">Compare all products and pricing</p>
              </div>
              <Link
                to="/pricing"
                onClick={() => setIsOpen(false)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition-colors"
              >
                View Pricing
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
