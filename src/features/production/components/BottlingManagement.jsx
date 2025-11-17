import React, { useState, useEffect } from 'react';
import {
  BottleWine, Calendar, Plus, Package, TrendingUp, AlertCircle, CheckCircle2, Clock
} from 'lucide-react';
import { listLots } from '@/shared/lib/productionApi';

export function BottlingManagement() {
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRunForm, setShowRunForm] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [formData, setFormData] = useState({
    lot_id: '',
    run_date: new Date().toISOString().split('T')[0],
    cases_planned: '',
    bottle_size: '750',
    closure_type: 'cork',
    label_name: '',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data, error: lotsError } = await listLots({ status: 'aging,blending,filtering' });
      if (lotsError) throw lotsError;

      setLots(data || []);
    } catch (err) {
      console.error('Error loading lots:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const bottleReadyLots = lots.filter(lot => {
    if (!lot.press_date) return false;
    const daysAging = Math.floor((new Date() - new Date(lot.press_date)) / (1000 * 60 * 60 * 24));
    return daysAging > 180; // At least 6 months aging
  });

  const upcomingRuns = []; // Would come from a bottling_runs table

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-[#7C203A] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading bottling data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between pt-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Bottling Management</h2>
          <p className="text-gray-600 mt-1">Schedule runs, track inventory, and manage packaging</p>
        </div>
        <button
          onClick={() => setShowRunForm(!showRunForm)}
          className="flex items-center gap-2 px-4 py-2 bg-[#7C203A] text-white rounded-lg hover:bg-[#8B2E48] transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Schedule Run
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="w-5 h-5" />
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
            <BottleWine className="w-8 h-8 text-[#7C203A]" />
            <span className="text-sm font-medium text-gray-600">Bottle Ready</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{bottleReadyLots.length}</p>
          <p className="text-xs text-gray-500 mt-1">lots ready to bottle</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-8 h-8 text-[#7C203A]" />
            <span className="text-sm font-medium text-gray-600">Scheduled Runs</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{upcomingRuns.length}</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-8 h-8 text-[#7C203A]" />
            <span className="text-sm font-medium text-gray-600">Total Volume</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {bottleReadyLots.reduce((sum, lot) => sum + (lot.current_volume_gallons || 0), 0).toLocaleString()}
            <span className="text-lg text-gray-500 ml-1">gal</span>
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-8 h-8 text-[#7C203A]" />
            <span className="text-sm font-medium text-gray-600">Est. Cases</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {Math.round(bottleReadyLots.reduce((sum, lot) => sum + (lot.current_volume_gallons || 0), 0) / 2.38)}
          </p>
          <p className="text-xs text-gray-500 mt-1">@ 750ml bottles</p>
        </div>
      </div>

      {/* Run Scheduling Form */}
      {showRunForm && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Schedule Bottling Run</h3>

          <form className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lot *</label>
                <select
                  value={formData.lot_id}
                  onChange={(e) => setFormData({...formData, lot_id: e.target.value})}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                >
                  <option value="">Select lot...</option>
                  {bottleReadyLots.map(lot => (
                    <option key={lot.id} value={lot.id}>
                      {lot.name} - {lot.varietal} {lot.vintage} ({lot.current_volume_gallons} gal)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Run Date *</label>
                <input
                  type="date"
                  value={formData.run_date}
                  onChange={(e) => setFormData({...formData, run_date: e.target.value})}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cases Planned *</label>
                <input
                  type="number"
                  value={formData.cases_planned}
                  onChange={(e) => setFormData({...formData, cases_planned: e.target.value})}
                  required
                  placeholder="e.g., 500"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bottle Size</label>
                <select
                  value={formData.bottle_size}
                  onChange={(e) => setFormData({...formData, bottle_size: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                >
                  <option value="375">375ml (Half)</option>
                  <option value="750">750ml (Standard)</option>
                  <option value="1500">1.5L (Magnum)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Closure Type</label>
                <select
                  value={formData.closure_type}
                  onChange={(e) => setFormData({...formData, closure_type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                >
                  <option value="cork">Natural Cork</option>
                  <option value="synthetic_cork">Synthetic Cork</option>
                  <option value="screw_cap">Screw Cap</option>
                  <option value="glass">Glass Stopper</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Label Name</label>
                <input
                  type="text"
                  value={formData.label_name}
                  onChange={(e) => setFormData({...formData, label_name: e.target.value})}
                  placeholder="e.g., Estate Reserve Pinot Noir"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                rows="2"
                placeholder="Special instructions, label requirements, etc."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
              />
            </div>

            <div className="flex items-center gap-3 pt-4">
              <button
                type="submit"
                className="px-6 py-2 bg-[#7C203A] text-white rounded-lg hover:bg-[#8B2E48] transition-colors shadow-sm"
              >
                Schedule Run
              </button>
              <button
                type="button"
                onClick={() => setShowRunForm(false)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Bottle-Ready Lots */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <BottleWine className="w-5 h-5 text-[#7C203A]" />
          <h3 className="text-lg font-semibold text-gray-900">Bottle-Ready Lots</h3>
        </div>

        {bottleReadyLots.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No lots ready for bottling yet</p>
        ) : (
          <div className="space-y-3">
            {bottleReadyLots.map(lot => {
              const daysAging = Math.floor((new Date() - new Date(lot.press_date)) / (1000 * 60 * 60 * 24));
              const monthsAging = (daysAging / 30).toFixed(1);
              const estCases = Math.round((lot.current_volume_gallons || 0) / 2.38);

              return (
                <div key={lot.id} className="p-4 rounded-lg border border-gray-200 bg-gradient-to-r from-white to-green-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-gray-900">{lot.name}</p>
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                          Ready
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{lot.varietal} • {lot.vintage}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <span>{lot.current_volume_gallons?.toLocaleString() || 0} gal</span>
                        <span>~{estCases} cases</span>
                        <span>Aged {monthsAging} months</span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setFormData({...formData, lot_id: lot.id, cases_planned: estCases.toString()});
                        setShowRunForm(true);
                      }}
                      className="px-4 py-2 bg-[#7C203A] text-white rounded-lg hover:bg-[#8B2E48] transition-colors text-sm font-medium"
                    >
                      Schedule
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Dry Goods Inventory Placeholder */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-300 border-dashed p-8 text-center">
        <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600 font-medium">Dry Goods Inventory</p>
        <p className="text-sm text-gray-500 mt-1">Track bottles, corks, labels, and cases - coming soon</p>
      </div>
    </div>
  );
}
