import React, { useState, useEffect } from 'react';
import {
  TrendingUp, BarChart3, PieChart, Activity, Droplet, Calendar, Wine, Package
} from 'lucide-react';
import { listLots, getProductionDashboardData } from '@/shared/lib/productionApi';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RePieChart, Pie, Cell } from 'recharts';

const COLORS = ['#7C203A', '#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'];

export function Analytics() {
  const [lots, setLots] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [lotsResult, dashResult] = await Promise.all([
        listLots(),
        getProductionDashboardData()
      ]);

      if (!lotsResult.error) setLots(lotsResult.data || []);
      if (!dashResult.error) setDashboardData(dashResult.data);
    } catch (err) {
      console.error('Error loading analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate vintage breakdown
  const getVintageData = () => {
    const vintageMap = {};
    lots.forEach(lot => {
      vintageMap[lot.vintage] = (vintageMap[lot.vintage] || 0) + (lot.current_volume_gallons || 0);
    });
    return Object.entries(vintageMap).map(([vintage, volume]) => ({
      vintage,
      volume: Math.round(volume)
    })).sort((a, b) => b.vintage - a.vintage);
  };

  // Calculate varietal breakdown
  const getVarietalData = () => {
    const varietalMap = {};
    lots.forEach(lot => {
      const varietal = lot.varietal || 'Unknown';
      varietalMap[varietal] = (varietalMap[varietal] || 0) + (lot.current_volume_gallons || 0);
    });
    return Object.entries(varietalMap).map(([name, value]) => ({
      name,
      value: Math.round(value)
    }));
  };

  // Calculate production trends by month
  const getProductionTrends = () => {
    const monthMap = {};
    lots.forEach(lot => {
      if (lot.harvest_date) {
        const month = new Date(lot.harvest_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        monthMap[month] = (monthMap[month] || 0) + (lot.current_volume_gallons || 0);
      }
    });
    return Object.entries(monthMap).map(([month, volume]) => ({
      month,
      volume: Math.round(volume)
    }));
  };

  // Calculate status distribution
  const getStatusData = () => {
    const statusMap = {};
    lots.forEach(lot => {
      statusMap[lot.status] = (statusMap[lot.status] || 0) + 1;
    });
    return Object.entries(statusMap).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-[#7C203A] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const vintageData = getVintageData();
  const varietalData = getVarietalData();
  const productionTrends = getProductionTrends();
  const statusData = getStatusData();

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="pt-4">
        <h2 className="text-2xl font-bold text-gray-900">Production Analytics</h2>
        <p className="text-gray-600 mt-1">Trends, comparisons, and insights</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Wine className="w-8 h-8 text-[#7C203A]" />
            <span className="text-sm font-medium text-gray-600">Total Volume</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {dashboardData?.totalVolume?.toLocaleString() || 0}
            <span className="text-lg text-gray-500 ml-1">gal</span>
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-8 h-8 text-[#7C203A]" />
            <span className="text-sm font-medium text-gray-600">Active Lots</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{lots.length}</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="w-8 h-8 text-[#7C203A]" />
            <span className="text-sm font-medium text-gray-600">Varietals</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{varietalData.length}</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-8 h-8 text-[#7C203A]" />
            <span className="text-sm font-medium text-gray-600">Vintages</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{vintageData.length}</p>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Volume by Vintage */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Volume by Vintage</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={vintageData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="vintage" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} label={{ value: 'Gallons', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Bar dataKey="volume" fill="#7C203A" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Varietal Distribution */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Varietal Distribution</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={varietalData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {varietalData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </RePieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Production Trends */}
        {productionTrends.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Production Timeline</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={productionTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="volume" stroke="#7C203A" strokeWidth={2} dot={{ fill: '#7C203A', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Status Distribution */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Distribution</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#7C203A" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
