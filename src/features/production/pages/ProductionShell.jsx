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
  ChevronRight
} from 'lucide-react';
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
import { ArchivedLots } from '../components/ArchivedLots';
import { VesselDetail } from '../components/VesselDetail';

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

    // If on vessel detail page with 'from' param, use that for sidebar highlight
    if (isVesselDetailPage && fromViewParam) {
      setActiveView(fromViewParam);
    } else if (viewFromUrl && viewFromUrl !== activeView) {
      setActiveView(viewFromUrl);
    }
  }, [location.search, location.pathname, isVesselDetailPage]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Please sign in to access Winery Production</p>
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
        { id: 'sensors', label: 'IoT Sensors', icon: Thermometer, color: 'green' },
        { id: 'lab', label: 'Wine Analysis', icon: Beaker, color: 'cyan' },
        { id: 'bottling', label: 'Bottling', icon: BottleWine, color: 'emerald' },
      ]
    },
    {
      title: 'Settings',
      items: [
        { id: 'archived', label: 'Archived Lots', icon: Archive, color: 'slate' },
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
      case 'archived':
        return <ArchivedLots />;
      case 'reports':
        return <div className="p-8 text-center text-gray-500">Reports view coming soon...</div>;
      default:
        return <ProductionDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Menu Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[45] lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sticky Sidebar Navigation - Wine/Burgundy Theme */}
      <aside
        className={`
          fixed left-0 top-0 h-screen bg-gradient-to-b from-[#7C203A] via-[#8B2E48] to-[#6B1F35]
          transition-all duration-300 ease-in-out z-40
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
          ${sidebarOpen ? 'lg:w-56' : 'lg:w-20'}
          max-lg:w-56
        `}
      >
        {/* Fixed spacer for navbar */}
        <div className="h-16 flex-shrink-0"></div>

        {/* Sidebar Header */}
        <div
          className={`h-[64px] flex items-center justify-between px-4 border-b border-rose-800/30 flex-shrink-0 transition-transform duration-300 ${
            isNavbarVisible ? 'translate-y-0' : '-translate-y-16'
          }`}
        >
          {sidebarOpen && (
            <span className="text-white font-bold text-xl">Production</span>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden lg:block p-2 hover:bg-rose-900/30 rounded-lg transition-colors ml-auto"
          >
            {sidebarOpen ? (
              <ChevronLeft className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-slate-400" />
            )}
          </button>
        </div>

        {/* Navigation Sections */}
        <nav className="absolute top-[128px] left-0 right-0 bottom-[85px] overflow-y-auto py-4 px-2 hide-scrollbar">
          {navigationSections.map((section, sectionIdx) => (
            <div key={section.title} className={sectionIdx > 0 ? 'mt-6' : ''}>
              {sidebarOpen && (
                <div className="px-3 mb-2">
                  <span className="text-xs font-semibold text-rose-300/70 uppercase tracking-wider">
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
                        setMobileMenuOpen(false);
                      }}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                        transition-all duration-200 group
                        ${isActive
                          ? 'bg-white text-rose-900 shadow-lg'
                          : 'bg-white/10 text-rose-50 hover:bg-white hover:text-rose-900'
                        }
                        ${!sidebarOpen && 'justify-center'}
                      `}
                      title={!sidebarOpen ? item.label : ''}
                    >
                      <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-rose-700' : 'group-hover:text-rose-700'}`} />
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
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-rose-800/30 bg-gradient-to-b from-[#7C203A] via-[#8B2E48] to-[#6B1F35]">
            <div className="bg-gradient-to-br from-amber-500/10 to-rose-500/10 rounded-lg p-3 border border-amber-500/20">
              <p className="text-xs text-rose-200/70 mb-1">Current Vintage</p>
              <p className="text-sm font-semibold text-white">{new Date().getFullYear()}</p>
            </div>
          </div>
        )}
      </aside>

      {/* Floating Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="fixed bottom-6 right-6 z-[40] lg:hidden w-14 h-14 bg-gradient-to-br from-[#7C203A] to-[#6B1F35] text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Main Content Area */}
      <main
        className={`
          flex-1 transition-all duration-300 max-w-full overflow-x-hidden
          ${sidebarOpen ? 'lg:ml-56' : 'lg:ml-20'}
        `}
      >
        {/* Content Area */}
        <div className="px-6 pt-2 pb-6 max-w-full overflow-x-hidden">
          {locked ? (
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
                  Winery Production Requires Professional Tier
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
