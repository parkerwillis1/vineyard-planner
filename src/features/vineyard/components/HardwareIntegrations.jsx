import React, { useState, useEffect } from 'react';
import { Settings, CloudRain, Cpu } from 'lucide-react';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { LoadingSpinner } from './LoadingSpinner';
import RainGaugeManagement from './RainGaugeManagement';
import ControllerManagement from './ControllerManagement';
import { supabase } from '@/shared/lib/supabaseClient';

export function HardwareIntegrations() {
  const [activeTab, setActiveTab] = useState('rain-gauges');
  const [vineyardBlocks, setVineyardBlocks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load vineyard blocks for both components
  useEffect(() => {
    loadVineyardBlocks();
  }, []);

  async function loadVineyardBlocks() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('vineyard_blocks')
        .select('id, name, variety, acres, lat, lng')
        .eq('user_id', user.id)
        .order('name', { ascending: true });

      if (error) {
        console.error('Error loading vineyard blocks:', error);
        return;
      }

      setVineyardBlocks(data || []);
    } catch (error) {
      console.error('Error loading vineyard blocks:', error);
    } finally {
      setLoading(false);
    }
  }

  const tabs = [
    { id: 'rain-gauges', label: 'Rainfall Tracking', icon: CloudRain },
    { id: 'controllers', label: 'Irrigation Controllers', icon: Cpu }
  ];

  if (loading) {
    return <LoadingSpinner message="Loading hardware integrations..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pt-4">
        <h1 className="text-2xl font-bold text-gray-900">Hardware Integrations</h1>
        <p className="text-sm text-gray-500 mt-1">
          Connect rain gauges and irrigation controllers for automated data collection
        </p>
      </div>

      {/* Integration Overview Banner */}
      <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-2 border-blue-200">
        <CardContent className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-3">
            🎯 Achieve Maximum Data Accuracy
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <CloudRain className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900">Rainfall Tracking</p>
                  <p className="text-gray-700">
                    Connect to free weather APIs (NWS, NOAA, OpenWeatherMap, Visual Crossing) to automatically track rainfall down to the millimeter
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <Cpu className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900">Irrigation Controllers</p>
                  <p className="text-gray-700">
                    Auto-import irrigation events from Baseline, Hunter Hydrawise, Rachio, and RainMachine controllers
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'rain-gauges' && (
          <RainGaugeManagement vineyardBlocks={vineyardBlocks} />
        )}
        {activeTab === 'controllers' && (
          <ControllerManagement vineyardBlocks={vineyardBlocks} />
        )}
      </div>
    </div>
  );
}
