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
  Menu,
  X
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
import { FieldDetailPage } from './FieldDetailPage';

export function OperationsShell() {
  console.log('🌿 OperationsShell rendering...');
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  console.log('👤 User:', user);
  const [activeView, setActiveView] = useState('team');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Check if we're on a field detail page
  const isFieldDetailPage = location.pathname.startsWith('/vineyard/field/');
  const fieldId = isFieldDetailPage ? location.pathname.split('/').pop() : null;

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
      ]
    },
    {
      title: 'Vineyard',
      items: [
        { id: 'blocks', label: 'Fields', icon: Grape, color: 'purple' },
        { id: 'tasks', label: 'Tasks', icon: ClipboardList, color: 'indigo' },
        { id: 'harvest', label: 'Harvest', icon: Calendar, color: 'amber' },
        { id: 'spray', label: 'Spray Records', icon: Droplet, color: 'cyan' },
      ]
    },
    {
      title: 'Management',
      items: [
        { id: 'inventory', label: 'Inventory', icon: Package, color: 'blue' },
        { id: 'costs', label: 'Cost Analysis', icon: DollarSign, color: 'green' },
        { id: 'equipment', label: 'Equipment', icon: Wrench, color: 'orange' },
        { id: 'labor', label: 'Labor Tracking', icon: Users, color: 'rose' },
        { id: 'weather', label: 'Weather', icon: CloudRain, color: 'sky' },
      ]
    }
  ];

  const currentItem = navigationSections
    .flatMap(section => section.items)
    .find(item => item.id === activeView);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sticky Sidebar Navigation */}
      <aside
        className={`
          fixed left-0 top-[64px] h-[calc(100vh-64px)] bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900
          transition-all duration-300 ease-in-out z-40 flex flex-col
          ${sidebarOpen ? 'w-64' : 'w-20'}
        `}
      >
        {/* Sidebar Header - Match main nav height */}
        <div className="h-[64px] flex items-center justify-between px-4 border-b border-slate-700">
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
              <X className="w-5 h-5 text-slate-400" />
            ) : (
              <Menu className="w-5 h-5 text-slate-400" />
            )}
          </button>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 hide-scrollbar">
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
                        navigate('/vineyard');
                        setActiveView(item.id);
                      }}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                        transition-all duration-200 group
                        ${isActive
                          ? `bg-gradient-to-r from-${item.color}-500 to-${item.color}-600 text-white shadow-lg shadow-${item.color}-500/50`
                          : 'bg-white/10 text-white hover:bg-white hover:text-slate-800'
                        }
                        ${!sidebarOpen && 'justify-center'}
                      `}
                      title={!sidebarOpen ? item.label : ''}
                    >
                      <Icon className={`w-5 h-5 flex-shrink-0 ${!isActive && 'group-hover:text-slate-800'}`} />
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
          <div className="p-4 border-t border-slate-700">
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
          flex-1 transition-all duration-300
          ${sidebarOpen ? 'ml-64' : 'ml-20'}
        `}
      >
        {/* Top Bar */}
        <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {currentItem && (
                <>
                  <div className={`w-10 h-10 bg-${currentItem.color}-100 rounded-lg flex items-center justify-center`}>
                    {React.createElement(currentItem.icon, {
                      className: `w-5 h-5 text-${currentItem.color}-600`
                    })}
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{currentItem.label}</h1>
                    <p className="text-sm text-gray-500">
                      {activeView === 'team' ? 'Your vineyard profile and team' : 'Vineyard Operations Management'}
                    </p>
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs text-gray-500">Current Date</p>
                <p className="text-sm font-semibold text-gray-900">
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6">
          {isFieldDetailPage ? (
            <FieldDetailPage id={fieldId} onBack={() => {
              navigate('/vineyard');
              setActiveView('blocks');
            }} />
          ) : (
            <>
              {activeView === 'dashboard' && <VineyardDashboard />}
              {activeView === 'calendar' && <CalendarView onNavigate={(view) => setActiveView(view)} />}
              {activeView === 'blocks' && <BlockManagement />}
              {activeView === 'tasks' && <TaskManagement />}
              {activeView === 'harvest' && <HarvestTracking />}
              {activeView === 'spray' && <SprayRecords />}
              {activeView === 'team' && <TeamManagement />}
              {activeView === 'inventory' && <InventoryManagement />}
              {activeView === 'costs' && <CostAnalysis />}
              {activeView === 'equipment' && <EquipmentManagement />}
              {activeView === 'labor' && <LaborManagement />}
              {activeView === 'weather' && <WeatherDashboard />}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
