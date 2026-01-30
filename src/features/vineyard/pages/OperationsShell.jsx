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
  PanelLeftOpen,
  PanelLeftClose,
  Zap,
  Wind,
  Tractor,
  Archive,
  TrendingUp,
  Menu,
  BookOpen,
  Settings,
  Calculator,
  Wine,
  FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';
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
import { OperationsReports } from '../components/OperationsReports';
import { FieldDetailPage } from './FieldDetailPage';
import { SettingsView } from '@/shared/components/SettingsView';

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
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
        { id: 'reports', label: 'Reports', icon: FileText, color: 'wine' },
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
    <div className="min-h-screen bg-[#F5F6F7] flex">
      {/* Mobile Menu Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-[45] lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Dropdown Menu */}
      <div
        className={`
          fixed top-0 left-0 right-0 bg-white shadow-xl z-[50] lg:hidden
          transition-all duration-300 ease-in-out
          ${mobileMenuOpen ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}
        `}
      >
        {/* Mobile Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <Link to="/" className="flex items-center gap-2">
            <img src="/Trellis_Logo/logo_symbol .png" alt="Trellis" className="h-8 w-8" />
            <span className="font-semibold text-gray-900">Operations</span>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Mobile Navigation Grid */}
        <div className="p-4 max-h-[70vh] overflow-y-auto">
          {navigationSections.map((section, sectionIdx) => (
            <div key={section.title} className={sectionIdx > 0 ? 'mt-4 pt-4 border-t border-gray-100' : ''}>
              <div className="px-1 mb-2">
                <span className="text-xs font-semibold text-[#1C2739] uppercase tracking-wider">
                  {section.title}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  // Highlight "Fields" when on field detail page, otherwise use activeView
                  const isActive = isFieldDetailPage
                    ? item.id === 'blocks'
                    : activeView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        navigate(`/vineyard?view=${item.id}`);
                        setActiveView(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`
                        flex items-center gap-2 px-3 py-3 rounded-xl
                        transition-all duration-200
                        ${isActive
                          ? 'bg-[#1C2739] text-white shadow-md'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                        }
                      `}
                    >
                      <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-[#1C2739]'}`} />
                      <span className="font-medium text-sm">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Quick Links */}
          <div className="mt-4 pt-4 border-t border-gray-100 flex gap-3">
            <Link
              to="/planner"
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-gray-50 rounded-xl text-gray-600 hover:bg-gray-100"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Calculator className="w-4 h-4" />
              <span className="text-sm font-medium">Planner</span>
            </Link>
            <Link
              to="/production"
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-gray-50 rounded-xl text-gray-600 hover:bg-gray-100"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Wine className="w-4 h-4" />
              <span className="text-sm font-medium">Production</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Top Header Bar */}
      <div className="fixed top-0 left-0 right-0 z-[40] lg:hidden bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <img src="/Trellis_Logo/logo_symbol .png" alt="Trellis" className="h-7 w-7" />
          </Link>
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium text-gray-700 mr-2">
              {navigationSections.flatMap(s => s.items).find(i => i.id === activeView)?.label || 'Dashboard'}
            </span>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-[#1C2739] hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Sticky Sidebar Navigation - Desktop Only */}
      <aside
        className={`
          fixed left-0 top-0 h-screen bg-[#F5F6F7]
          transition-all duration-300 ease-in-out z-40
          hidden lg:block
          ${sidebarOpen ? 'w-56' : 'w-20'}
        `}
      >
        {/* Sidebar Header Row */}
        <div className={`h-16 flex items-center flex-shrink-0 relative ${sidebarOpen ? 'justify-between px-4' : 'justify-center'}`}>
          {sidebarOpen ? (
            <>
              <Link to="/" className="flex-shrink-0">
                <img src="/Trellis_Logo/logo_symbol .png" alt="Trellis" className="h-8 w-8" />
              </Link>
              <div className="flex items-center gap-4">
                {/* Tools Menu */}
                <div className="relative group/menu">
                  <Menu
                    className="w-[18px] h-[18px] text-[#1C2739] hover:text-[#1C2739]/70 transition-colors cursor-pointer"
                    onClick={() => setShowToolsMenu(!showToolsMenu)}
                  />
                  {!showToolsMenu && (
                    <div className="absolute top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover/menu:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg">
                      Tools
                    </div>
                  )}
                  {showToolsMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowToolsMenu(false)} />
                      <div className="absolute top-8 left-0 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-50 py-2">
                        <Link
                          to="/planner"
                          className="flex items-center gap-3 px-4 py-2.5 text-gray-600 hover:bg-gray-50 hover:text-gray-800 transition-colors"
                          onClick={() => setShowToolsMenu(false)}
                        >
                          <Calculator className="w-4 h-4" />
                          <span className="text-sm font-medium">Planner</span>
                        </Link>
                        <Link
                          to="/vineyard"
                          className="flex items-center gap-3 px-4 py-2.5 text-[#1C2739] bg-[#1C2739]/10"
                          onClick={() => setShowToolsMenu(false)}
                        >
                          <Grape className="w-4 h-4" />
                          <span className="text-sm font-medium">Operations</span>
                        </Link>
                        <Link
                          to="/production"
                          className="flex items-center gap-3 px-4 py-2.5 text-gray-600 hover:bg-gray-50 hover:text-gray-800 transition-colors"
                          onClick={() => setShowToolsMenu(false)}
                        >
                          <Wine className="w-4 h-4" />
                          <span className="text-sm font-medium">Production</span>
                        </Link>
                      </div>
                    </>
                  )}
                </div>
                <Link to="/docs" className="relative group/docs">
                  <BookOpen className="w-[18px] h-[18px] text-[#1C2739] hover:text-[#1C2739]/70 transition-colors" />
                  <div className="absolute top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover/docs:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg">
                    Docs
                  </div>
                </Link>
                <div className="relative group/settings cursor-pointer" onClick={() => setShowSettings(true)}>
                  <Settings className="w-[18px] h-[18px] text-[#1C2739] hover:text-[#1C2739]/70 transition-colors" />
                  <div className="absolute top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover/settings:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg">
                    Settings
                  </div>
                </div>
                <div
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="cursor-pointer"
                >
                  <PanelLeftClose className="w-[18px] h-[18px] text-[#1C2739] hover:text-[#1C2739]/70 transition-colors" />
                </div>
              </div>
            </>
          ) : (
            <div
              onClick={() => setSidebarOpen(true)}
              className="relative group/expand cursor-pointer flex items-center justify-center"
            >
              <img src="/Trellis_Logo/logo_symbol .png" alt="Trellis" className="h-8 w-8 group-hover/expand:opacity-50 transition-opacity" />
              <PanelLeftOpen className="w-5 h-5 text-[#1C2739] absolute opacity-0 group-hover/expand:opacity-100 transition-opacity" />
            </div>
          )}
        </div>

        {/* Navigation Sections - positioned at fixed location */}
        <nav className="absolute top-16 left-0 right-0 bottom-[85px] overflow-y-auto py-4 px-3 hide-scrollbar">
          {navigationSections.map((section, sectionIdx) => (
            <div key={section.title} className={sectionIdx > 0 ? 'mt-6' : ''}>
              {sidebarOpen && (
                <div className="px-3 mb-2">
                  <span className="text-xs font-semibold text-[#1C2739] uppercase tracking-wider">
                    {section.title}
                  </span>
                </div>
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  // Highlight "Fields" when on field detail page, otherwise use activeView
                  const isActive = isFieldDetailPage
                    ? item.id === 'blocks'
                    : activeView === item.id;
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
                          ? 'bg-[#1C2739] text-white shadow-lg'
                          : 'bg-transparent text-gray-700 hover:bg-[#1C2739]/10 hover:text-[#1C2739]'
                        }
                        ${!sidebarOpen && 'justify-center'}
                      `}
                      title={!sidebarOpen ? item.label : ''}
                    >
                      <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-[#1C2739] group-hover:text-[#1C2739]'}`} />
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
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-[#F5F6F7]">
            <div className="bg-[#1C2739]/5 rounded-lg p-3 border border-[#1C2739]/20">
              <p className="text-xs text-[#1C2739]/70 mb-1">Active Season</p>
              <p className="text-sm font-semibold text-[#1C2739]">{new Date().getFullYear()}</p>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <main
        className={`
          flex-1 transition-all duration-300 max-w-full overflow-x-hidden
          pt-16 lg:pt-0
          ${sidebarOpen ? 'lg:ml-56' : 'lg:ml-20'}
        `}
      >
        {/* Content Area */}
        <div className="pl-4 pr-4 lg:pl-0 lg:pr-6 pt-2 lg:pt-0 pb-6 max-w-full overflow-x-hidden">
          {showSettings ? (
            <SettingsView onClose={() => setShowSettings(false)} />
          ) : isFieldDetailPage ? (
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
              {activeView === 'reports' && <OperationsReports />}
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
