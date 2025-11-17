import React, { useState, useEffect } from 'react';
import {
  Barrel, Calendar, Plus, Droplet, AlertTriangle, Clock, TrendingUp, CheckCircle2
} from 'lucide-react';
import { listLots, listContainers, updateContainer, createFermentationLog } from '@/shared/lib/productionApi';

export function AgingManagement() {
  const [lots, setLots] = useState([]);
  const [barrels, setBarrels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedBarrels, setSelectedBarrels] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [lotsResult, containersResult] = await Promise.all([
        listLots({ status: 'aging,pressed,blending' }),
        listContainers()
      ]);

      if (!lotsResult.error) {
        setLots(lotsResult.data || []);
      }
      if (!containersResult.error) {
        const barrelData = (containersResult.data || []).filter(c => c.type === 'barrel');
        setBarrels(barrelData);
      }
    } catch (err) {
      console.error('Error loading aging data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Get barrels that need topping
  const getBarrelsNeedingTopping = () => {
    return barrels.filter(barrel => {
      if (barrel.status !== 'in_use') return false;

      const lastTopping = barrel.last_topping_date;
      if (!lastTopping) return true;

      const daysSinceTopping = Math.floor((new Date() - new Date(lastTopping)) / (1000 * 60 * 60 * 24));
      return daysSinceTopping > 30; // Need topping every 30 days
    });
  };

  // Get barrels approaching retirement
  const getBarrelsForReplacement = () => {
    return barrels.filter(barrel => {
      const fills = barrel.total_fills || 0;
      const age = barrel.purchase_date
        ? Math.floor((new Date() - new Date(barrel.purchase_date)) / (1000 * 60 * 60 * 24 * 365))
        : 0;

      return fills >= 4 || age >= 5; // Replace after 5 fills or 5 years
    });
  };

  // Handle bulk topping
  const handleBulkTopping = async () => {
    try {
      const toppingDate = new Date().toISOString().split('T')[0];

      await Promise.all(
        selectedBarrels.map(id =>
          updateContainer(id, {
            last_topping_date: toppingDate
          })
        )
      );

      setSuccess(`Marked ${selectedBarrels.length} barrel(s) as topped`);
      setSelectedBarrels([]);
      loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  // Toggle barrel selection
  const toggleBarrelSelection = (barrelId) => {
    setSelectedBarrels(prev =>
      prev.includes(barrelId)
        ? prev.filter(id => id !== barrelId)
        : [...prev, barrelId]
    );
  };

  const needsTopping = getBarrelsNeedingTopping();
  const needsReplacement = getBarrelsForReplacement();
  const agingLots = lots.filter(lot => lot.status === 'aging');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-[#7C203A] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading aging data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="pt-4">
        <h2 className="text-2xl font-bold text-gray-900">Aging Management</h2>
        <p className="text-gray-600 mt-1">Barrel rotation, topping schedules, and aging timeline</p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800">
            <AlertTriangle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-800">
            <CheckCircle2 className="w-5 h-5" />
            <span>{success}</span>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Barrel className="w-8 h-8 text-[#7C203A]" />
            <span className="text-sm font-medium text-gray-600">Total Barrels</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{barrels.length}</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-8 h-8 text-[#7C203A]" />
            <span className="text-sm font-medium text-gray-600">Aging Lots</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{agingLots.length}</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Droplet className="w-8 h-8 text-amber-600" />
            <span className="text-sm font-medium text-gray-600">Needs Topping</span>
          </div>
          <p className="text-3xl font-bold text-amber-700">{needsTopping.length}</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-8 h-8 text-red-600" />
            <span className="text-sm font-medium text-gray-600">Replacement Due</span>
          </div>
          <p className="text-3xl font-bold text-red-700">{needsReplacement.length}</p>
        </div>
      </div>

      {/* Topping Schedule */}
      {needsTopping.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Droplet className="w-5 h-5 text-[#7C203A]" />
              <h3 className="text-lg font-semibold text-gray-900">Topping Schedule</h3>
            </div>
            {selectedBarrels.length > 0 && (
              <button
                onClick={handleBulkTopping}
                className="flex items-center gap-2 px-4 py-2 bg-[#7C203A] text-white rounded-lg hover:bg-[#8B2E48] transition-colors shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                Mark {selectedBarrels.length} Topped
              </button>
            )}
          </div>

          <div className="space-y-2">
            {needsTopping.map(barrel => {
              const lot = lots.find(l => l.container_id === barrel.id);
              const daysSinceTopping = barrel.last_topping_date
                ? Math.floor((new Date() - new Date(barrel.last_topping_date)) / (1000 * 60 * 60 * 24))
                : 999;
              const isSelected = selectedBarrels.includes(barrel.id);

              return (
                <div
                  key={barrel.id}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-[#7C203A] bg-rose-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                  onClick={() => toggleBarrelSelection(barrel.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <p className="font-semibold text-gray-900">{barrel.name}</p>
                        {lot && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                            {lot.name}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {barrel.cooperage && `${barrel.cooperage} • `}
                        {barrel.capacity_gallons} gal
                        {barrel.last_topping_date && ` • Last topped: ${daysSinceTopping} days ago`}
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      daysSinceTopping > 45
                        ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {daysSinceTopping > 45 ? 'Urgent' : 'Due Soon'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Aging Lots */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-[#7C203A]" />
          <h3 className="text-lg font-semibold text-gray-900">Aging Timeline</h3>
        </div>

        {agingLots.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No lots currently aging</p>
        ) : (
          <div className="space-y-3">
            {agingLots.map(lot => {
              const daysAging = lot.press_date
                ? Math.floor((new Date() - new Date(lot.press_date)) / (1000 * 60 * 60 * 24))
                : 0;
              const monthsAging = (daysAging / 30).toFixed(1);
              const targetMonths = 18; // Default target
              const progress = Math.min((monthsAging / targetMonths) * 100, 100);

              return (
                <div key={lot.id} className="p-4 rounded-lg border border-gray-200 bg-gradient-to-r from-white to-amber-50">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-gray-900">{lot.name}</p>
                      <p className="text-sm text-gray-600">{lot.varietal} • {lot.vintage}</p>
                    </div>
                    <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                      {monthsAging} months
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                      <span>Aging Progress</span>
                      <span>Target: {targetMonths} months</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-amber-500 to-[#7C203A] h-2 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Barrel Replacement Planning */}
      {needsReplacement.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-semibold text-gray-900">Barrel Replacement Planning</h3>
          </div>

          <div className="space-y-2">
            {needsReplacement.map(barrel => {
              const age = barrel.purchase_date
                ? Math.floor((new Date() - new Date(barrel.purchase_date)) / (1000 * 60 * 60 * 24 * 365))
                : 0;
              const fills = barrel.total_fills || 0;

              return (
                <div key={barrel.id} className="p-4 rounded-lg border border-red-200 bg-red-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{barrel.name}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {barrel.cooperage && `${barrel.cooperage} • `}
                        Age: {age} years • Fills: {fills}
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                      Consider Replacement
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
