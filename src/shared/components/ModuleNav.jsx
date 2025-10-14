import React, { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { MODULES } from '../config/modules';
import { useSubscription } from '../hooks/useSubscription';

export const ModuleNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const subscription = useSubscription();
  
  // ✅ Calculate module access once based on subscription
  const moduleAccessMap = useMemo(() => {
    const map = {};
    Object.entries(MODULES).forEach(([moduleId, module]) => {
      const hasAccess = subscription.modules.includes(moduleId);
      const locked = !hasAccess;
      
      map[moduleId] = {
        hasAccess,
        locked,
        reason: locked ? (module.comingSoon ? 'coming-soon' : 'upgrade-required') : null
      };
    });
    return map;
  }, [subscription.modules]);
  
  const handleModuleClick = (module) => {
    const access = moduleAccessMap[module.id];
    
    if (access.hasAccess) {
      navigate(module.route);
    } else {
      // Trigger upgrade modal
      window.dispatchEvent(
        new CustomEvent('show-upgrade-modal', { detail: { moduleId: module.id } })
      );
    }
  };

  return (
    <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center gap-1 overflow-x-auto h-14">
          {Object.values(MODULES).map(module => {
            const access = moduleAccessMap[module.id];
            const isActive = location.pathname.startsWith(module.route);
            const Icon = Icons[module.icon] || Icons.Package;
            
            return (
              <button
                key={module.id}
                onClick={() => handleModuleClick(module)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors flex items-center gap-2 ${
                  isActive
                    ? "border-vine-green-600 text-vine-green-700"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } ${access.locked && 'opacity-60'}`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{module.name}</span>
                <span className="sm:hidden">{module.id}</span>
                {access.locked && <Icons.Lock className="w-3 h-3" />}
                {module.comingSoon && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                    Soon
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};