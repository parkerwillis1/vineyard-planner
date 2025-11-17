import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { useModuleAccess } from '@/shared/hooks/useModuleAccess';
import { UpgradeModal } from '@/shared/components/UpgradeModal';
import {
  LayoutDashboard,
  Grape,
  ClipboardList,
  Droplet,
  Calendar,
  DollarSign,
  Wrench,
  Users,
  CloudRain,
  Package,
  ChevronLeft,
  ChevronRight,
  Zap,
  Wind,
  Tractor,
  Archive,
  TrendingUp
} from 'lucide-react';
import { VineyardDashboard } from '../components/VineyardDashboard';
import { BlockManagement } from '../components/BlockManagement';
import { TaskManagement } from '../components/TaskManagement';
import { HarvestTracking } from '../components/HarvestTracking';
import { SprayRecords } from '../components/SprayRecords';
import { CalendarView } from '../components/CalendarView';
import { CostAnalysis } from '../components/CostAnalysis';
import { EquipmentManagement } from '../components/EquipmentManagement';
import { LaborManagement } from '../components/LaborManagement';
import { WeatherDashboard } from '../components/WeatherDashboard';
import { InventoryManagement } from '../components/InventoryManagement';
import { TeamManagement } from '../components/TeamManagement';
import { IrrigationManagement } from '../components/IrrigationManagement';
import { HardwareIntegration } from '../components/HardwareIntegration';
import { DeviceZoneMapping } from '../components/DeviceZoneMapping';
import { WebhookTester } from '../components/WebhookTester';
import { ArchivedItems } from '../components/ArchivedItems';
import { FieldDetailPage } from './FieldDetailPage';

export function OperationsShell() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Get active view from URL search params, defaulting to 'team'
  const searchParams = new URLSearchParams(location.search);
  const urlView = searchParams.get('view') || 'team';

  const [activeView, setActiveView] = useState(urlView);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isNavbarVisible, setIsNavbarVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Check if we're on a field detail page
  const isFieldDetailPage = location.pathname.startsWith('/vineyard/field/');
  const fieldId = isFieldDetailPage ? location.pathname.split('/').pop() : null;

  // Track navbar visibility
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY < 10) {
        setIsNavbarVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 64) {
        setIsNavbarVisible(false);
      } else if (currentScrollY < lastScrollY) {
        setIsNavbarVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Sync activeView with URL when location changes
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const viewFromUrl = params.get('view');
    if (viewFromUrl && viewFromUrl !== activeView) {
      setActiveView(viewFromUrl);
    }
  }, [location.search]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Please sign in to access Vineyard Operations</p>
      </div>
    );
  }

  const navigationSections = [
    {
      title: 'Overview',
      items: [
        { id: 'team', label: 'My Vineyard', icon: Users, color: 'vine-green' },
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'emerald' },
        { id: 'calendar', label: 'Calendar', icon: Calendar, color: 'blue' },
        { id: 'weather', label: 'Weather', icon: CloudRain, color: 'sky' },
      ]
    },
    {
      title: 'Vineyard',
      items: [
        { id: 'blocks', label: 'Fields', icon: Grape, color: 'purple' },
        { id: 'tasks', label: 'Tasks', icon: ClipboardList, color: 'indigo' },
        { id: 'irrigation', label: 'Irrigation', icon: Droplet, color: 'blue' },
        { id: 'spray', label: 'Spray Records', icon: Wind, color: 'cyan' },
        { id: 'harvest', label: 'Harvest', icon: Tractor, color: 'amber' },
      ]
    },
    {
      title: 'Management',
      items: [
        { id: 'inventory', label: 'Inventory', icon: Package, color: 'blue' },
        { id: 'costs', label: 'Analytics', icon: TrendingUp, color: 'teal' },
        { id: 'equipment', label: 'Equipment', icon: Wrench, color: 'orange' },
        { id: 'labor', label: 'Labor Tracking', icon: Users, color: 'rose' },
      ]
    },
    {
      title: 'Settings',
      items: [
        { id: 'hardware', label: 'Devices', icon: Zap, color: 'violet' },
        { id: 'webhook-test', label: 'Webhook Tester', icon: Zap, color: 'indigo' },
        { id: 'archived', label: 'Archived', icon: Archive, color: 'slate' },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sticky Sidebar Navigation */}
      <aside
        className={`
          fixed left-0 top-0 h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900
          transition-all duration-300 ease-in-out z-40
          ${sidebarOpen ? 'w-56' : 'w-20'}
        `}
      >
        {/* Fixed spacer for navbar */}
        <div className="h-16 flex-shrink-0"></div>

        {/* Sidebar Header - slides up with navbar */}
        <div
          className={`h-[64px] flex items-center justify-between px-4 border-b border-slate-700 flex-shrink-0 transition-transform duration-300 ${
            isNavbarVisible ? 'translate-y-0' : '-translate-y-16'
          }`}
        >
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-vine-green-400 to-emerald-500 rounded-lg flex items-center justify-center">
                <Grape className="w-5 h-5 text-white" />
              </div>
              <span className="text-white font-bold text-lg">Operations</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors ml-auto"
          >
            {sidebarOpen ? (
              <ChevronLeft className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-slate-400" />
            )}
          </button>
        </div>

        {/* Navigation Sections - positioned at fixed location */}
        <nav className="absolute top-[128px] left-0 right-0 bottom-[85px] overflow-y-auto py-4 px-2 hide-scrollbar">
          {navigationSections.map((section, sectionIdx) => (
            <div key={section.title} className={sectionIdx > 0 ? 'mt-6' : ''}>
              {sidebarOpen && (
                <div className="px-3 mb-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {section.title}
                  </span>
                </div>
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        navigate(`/vineyard?view=${item.id}`);
                        setActiveView(item.id);
                      }}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                        transition-all duration-200 group
                        ${isActive
                          ? 'bg-white text-slate-800 shadow-lg'
                          : 'bg-white/10 text-white hover:bg-white hover:text-slate-800'
                        }
                        ${!sidebarOpen && 'justify-center'}
                      `}
                      title={!sidebarOpen ? item.label : ''}
                    >
                      <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-slate-800' : 'group-hover:text-slate-800'}`} />
                      {sidebarOpen && (
                        <span className="font-medium text-sm">{item.label}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer - positioned at fixed location */}
        {sidebarOpen && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
            <div className="bg-gradient-to-br from-vine-green-500/10 to-emerald-500/10 rounded-lg p-3 border border-vine-green-500/20">
              <p className="text-xs text-slate-400 mb-1">Active Season</p>
              <p className="text-sm font-semibold text-white">{new Date().getFullYear()}</p>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <main
        className={`
          flex-1 transition-all duration-300 max-w-full overflow-x-hidden
          ${sidebarOpen ? 'ml-56' : 'ml-20'}
        `}
      >
        {/* Content Area */}
        <div className="px-6 pt-2 pb-6 max-w-full overflow-x-hidden">
          {isFieldDetailPage ? (
            <FieldDetailPage id={fieldId} onBack={() => {
              navigate(-1); // Go back to previous page
            }} />
          ) : (
            <>
              {activeView === 'dashboard' && <VineyardDashboard />}
              {activeView === 'calendar' && <CalendarView onNavigate={(view) => setActiveView(view)} />}
              {activeView === 'blocks' && <BlockManagement />}
              {activeView === 'tasks' && <TaskManagement />}
              {activeView === 'harvest' && <HarvestTracking />}
              {activeView === 'spray' && <SprayRecords />}
              {activeView === 'irrigation' && <IrrigationManagement />}
              {activeView === 'team' && <TeamManagement />}
              {activeView === 'inventory' && <InventoryManagement />}
              {activeView === 'costs' && <CostAnalysis />}
              {activeView === 'equipment' && <EquipmentManagement />}
              {activeView === 'labor' && <LaborManagement />}
              {activeView === 'weather' && <WeatherDashboard />}
              {activeView === 'hardware' && <HardwareIntegration />}
              {activeView === 'hardware-zones' && (
                <DeviceZoneMapping
                  deviceId={searchParams.get('device')}
                  onBack={() => navigate('/vineyard?view=hardware')}
                />
              )}
              {activeView === 'webhook-test' && <WebhookTester />}
              {activeView === 'archived' && <ArchivedItems />}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
