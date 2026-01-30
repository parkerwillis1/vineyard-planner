import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { useModuleAccess } from '@/shared/hooks/useModuleAccess';
import { UpgradeModal } from '@/shared/components/UpgradeModal';
import { MODULES } from '@/shared/config/modules';
import {
  Wine,
  LayoutDashboard,
  FlaskConical,
  BarChart3,
  Droplets,
  Sparkles,
  Package,
  TestTube,
  Layers,
  BookOpen,
  FileText,
  Archive,
  Menu,
  Grape,
  Beaker,
  Warehouse,
  Barrel,
  Container,
  BottleWine,
  Thermometer,
  ChevronLeft,
  ChevronRight,
  PanelLeftOpen,
  PanelLeftClose,
  Settings,
  Calculator
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ProductionDashboard } from '../components/ProductionDashboard';
import { SensorManager } from '../components/SensorManager';
import { HarvestIntake } from '../components/HarvestIntake';
import { FermentationTracker } from '../components/FermentationTracker';
import { ContainerManagement } from '../components/ContainerManagement';
import { WineAnalysis } from '../components/WineAnalysis';
import { Analytics } from '../components/Analytics';
import { AgingManagement } from '../components/AgingManagement';
import { BlendingCalculator } from '../components/BlendingCalculator';
import { BottlingManagement } from '../components/BottlingManagement';
import { ArchivesPage } from './ArchivesPage';
import { VesselDetail } from '../components/VesselDetail';
import { Reports } from '../components/Reports';
import { SettingsView } from '@/shared/components/SettingsView';
import { TTBSettings, TTBTransactionLog, TTBReportGenerator } from '../components/ttb';

export function ProductionShell() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { hasAccess, locked, reason } = useModuleAccess('production');

  // Check if we're on a vessel detail page
  const isVesselDetailPage = location.pathname.startsWith('/production/vessel/');
  const vesselId = isVesselDetailPage ? location.pathname.split('/').pop() : null;

  // Get active view from URL search params, defaulting to 'dashboard'
  const searchParams = new URLSearchParams(location.search);
  const urlView = searchParams.get('view') || 'dashboard';

  // If on vessel detail page, check if we came from a specific view
  const fromView = searchParams.get('from');
  const effectiveView = isVesselDetailPage && fromView ? fromView : urlView;

  const [activeView, setActiveView] = useState(effectiveView);
  const [sidebarOpen, setSidebarOpen] = useState(true); // Desktop sidebar expanded/collapsed
  const [isNavbarVisible, setIsNavbarVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // Mobile menu overlay open/closed
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

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
    const fromViewParam = params.get('from');

    // If on vessel detail page, always highlight "Vessels" in sidebar
    if (isVesselDetailPage) {
      setActiveView(fromViewParam || 'containers');
    } else if (viewFromUrl && viewFromUrl !== activeView) {
      setActiveView(viewFromUrl);
    }
  }, [location.search, location.pathname, isVesselDetailPage]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Please sign in to access Wine Production</p>
      </div>
    );
  }

  const navigationSections = [
    {
      title: 'Overview',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'rose' },
        { id: 'analytics', label: 'Analytics', icon: BarChart3, color: 'purple' },
        { id: 'reports', label: 'Reports', icon: FileText, color: 'amber' },
      ]
    },
    {
      title: 'Production',
      items: [
        { id: 'harvest', label: 'Harvest Intake', icon: Grape, color: 'purple' },
        { id: 'fermentation', label: 'Fermentation', icon: Sparkles, color: 'fuchsia' },
        { id: 'aging', label: 'Aging', icon: Warehouse, color: 'amber' },
        { id: 'blending', label: 'Blending', icon: Layers, color: 'rose' },
      ]
    },
    {
      title: 'Cellar',
      items: [
        { id: 'containers', label: 'Vessels', icon: Barrel, color: 'blue' },
        { id: 'lab', label: 'Wine Analysis', icon: Beaker, color: 'cyan' },
        { id: 'bottling', label: 'Bottling', icon: BottleWine, color: 'emerald' },
      ]
    },
    {
      title: 'Settings',
      items: [
        { id: 'sensors', label: 'IoT Sensors', icon: Thermometer, color: 'green' },
        { id: 'ttb-settings', label: 'TTB Compliance', icon: FileText, color: 'indigo' },
        { id: 'archives', label: 'Archives', icon: Archive, color: 'slate' },
      ]
    }
  ];

  const renderViewContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <ProductionDashboard />;
      case 'harvest':
        return <HarvestIntake />;
      case 'fermentation':
        return <FermentationTracker />;
      case 'containers':
        return <ContainerManagement />;
      case 'sensors':
        return <SensorManager />;
      case 'lab':
        return <WineAnalysis />;
      case 'analytics':
        return <Analytics />;
      case 'aging':
        return <AgingManagement />;
      case 'blending':
        return <BlendingCalculator />;
      case 'bottling':
        return <BottlingManagement />;
      case 'archives':
        return <ArchivesPage />;
      case 'reports':
        return <Reports />;
      case 'ttb-report':
        return <TTBReportGenerator />;
      case 'ttb-transactions':
        return <TTBTransactionLog />;
      case 'ttb-settings':
        return <TTBSettings />;
      default:
        return <ProductionDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F6F7] flex">
      {/* Mobile Menu Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-[45] lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Dropdown Menu - Shows on mobile only */}
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
            <span className="font-semibold text-gray-900">Production</span>
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
                <span className="text-xs font-semibold text-[#862A44] uppercase tracking-wider">
                  {section.title}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        navigate(`/production?view=${item.id}`);
                        setActiveView(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`
                        flex items-center gap-2 px-3 py-3 rounded-xl
                        transition-all duration-200
                        ${isActive
                          ? 'bg-[#862A44] text-white shadow-md'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                        }
                      `}
                    >
                      <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-[#862A44]'}`} />
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
              to="/vineyard"
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-gray-50 rounded-xl text-gray-600 hover:bg-gray-100"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Grape className="w-4 h-4" />
              <span className="text-sm font-medium">Operations</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Sticky Sidebar Navigation - Desktop Only */}
      <aside
        className={`
          fixed left-0 top-0 h-screen bg-[#F5F6F7]
          transition-all duration-300 ease-in-out z-40
          hidden lg:block
          ${sidebarOpen ? 'lg:w-56' : 'lg:w-20'}
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
                    className="w-[18px] h-[18px] text-[#862A44] hover:text-[#862A44]/70 transition-colors cursor-pointer"
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
                          className="flex items-center gap-3 px-4 py-2.5 text-gray-600 hover:bg-gray-50 hover:text-gray-800 transition-colors"
                          onClick={() => setShowToolsMenu(false)}
                        >
                          <Grape className="w-4 h-4" />
                          <span className="text-sm font-medium">Operations</span>
                        </Link>
                        <Link
                          to="/production"
                          className="flex items-center gap-3 px-4 py-2.5 text-[#862A44] bg-[#862A44]/10"
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
                  <BookOpen className="w-[18px] h-[18px] text-[#862A44] hover:text-[#862A44]/70 transition-colors" />
                  <div className="absolute top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover/docs:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg">
                    Docs
                  </div>
                </Link>
                <div className="relative group/settings cursor-pointer" onClick={() => setShowSettings(true)}>
                  <Settings className="w-[18px] h-[18px] text-[#862A44] hover:text-[#862A44]/70 transition-colors" />
                  <div className="absolute top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover/settings:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg">
                    Settings
                  </div>
                </div>
                <div
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="cursor-pointer"
                >
                  <PanelLeftClose className="w-[18px] h-[18px] text-[#862A44] hover:text-[#862A44]/70 transition-colors" />
                </div>
              </div>
            </>
          ) : (
            <div
              onClick={() => setSidebarOpen(true)}
              className="relative group/expand cursor-pointer flex items-center justify-center"
            >
              <img src="/Trellis_Logo/logo_symbol .png" alt="Trellis" className="h-8 w-8 group-hover/expand:opacity-50 transition-opacity" />
              <PanelLeftOpen className="w-5 h-5 text-[#862A44] absolute opacity-0 group-hover/expand:opacity-100 transition-opacity" />
            </div>
          )}
        </div>

        {/* Navigation Sections */}
        <nav className="absolute top-16 left-0 right-0 bottom-[85px] overflow-y-auto py-4 px-3 hide-scrollbar">
          {navigationSections.map((section, sectionIdx) => (
            <div key={section.title} className={sectionIdx > 0 ? 'mt-6' : ''}>
              {sidebarOpen && (
                <div className="px-3 mb-2">
                  <span className="text-xs font-semibold text-[#862A44] uppercase tracking-wider">
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
                        navigate(`/production?view=${item.id}`);
                        setActiveView(item.id);
                      }}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                        transition-all duration-200 group
                        ${isActive
                          ? 'bg-[#862A44] text-white shadow-lg'
                          : 'bg-transparent text-gray-700 hover:bg-[#862A44]/10 hover:text-[#862A44]'
                        }
                        ${!sidebarOpen && 'justify-center'}
                      `}
                      title={!sidebarOpen ? item.label : ''}
                    >
                      <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-[#862A44] group-hover:text-[#862A44]'}`} />
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

        {/* Sidebar Footer */}
        {sidebarOpen && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-[#F5F6F7]">
            <div className="bg-[#862A44]/5 rounded-lg p-3 border border-[#862A44]/20">
              <p className="text-xs text-[#862A44]/70 mb-1">Current Vintage</p>
              <p className="text-sm font-semibold text-[#862A44]">{new Date().getFullYear()}</p>
            </div>
          </div>
        )}
      </aside>

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
              className="p-2 text-[#862A44] hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

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
          ) : locked ? (
            <div className="mt-8 bg-white rounded-xl border border-rose-200 shadow-lg p-12">
              <div className="text-center">
                <div className="mb-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-rose-100 rounded-full">
                    <svg className="w-8 h-8 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Wine Production Requires Professional Tier
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  {reason}
                </p>
                <button
                  onClick={() => navigate('/account')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-rose-600 to-rose-700 text-white rounded-lg hover:from-rose-700 hover:to-rose-800 transition-all duration-200 font-medium shadow-md"
                >
                  Upgrade to Professional
                </button>
              </div>
            </div>
          ) : isVesselDetailPage ? (
            <VesselDetail
              id={vesselId}
              onBack={() => {
                // Use fromView if available, otherwise default to containers
                const targetView = fromView || 'containers';
                navigate(`/production?view=${targetView}`);
                setActiveView(targetView);
              }}
            />
          ) : (
            renderViewContent()
          )}
        </div>
      </main>
    </div>
  );
}
