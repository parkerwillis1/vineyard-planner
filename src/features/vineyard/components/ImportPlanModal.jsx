import React, { useState, useEffect } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { X, Download, MapPin, Ruler, Grape as GrapeIcon } from 'lucide-react';
import { listPlans } from '@/shared/lib/plansApi';

export function ImportPlanModal({ isOpen, onClose, onImport }) {
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);

  useEffect(() => {
    if (isOpen && user) {
      loadPlans();
    }
  }, [isOpen, user]);

  const loadPlans = async () => {
    setLoading(true);
    try {
      const response = await listPlans();
      console.log('📋 listPlans response:', response);

      // listPlans returns { data: [...], error: null } from Supabase
      if (response.error) {
        console.error('Error loading plans:', response.error);
        setPlans([]);
      } else if (Array.isArray(response.data)) {
        console.log('✅ Loaded plans:', response.data.length);
        setPlans(response.data);
      } else {
        console.warn('listPlans returned unexpected format:', response);
        setPlans([]);
      }
    } catch (error) {
      console.error('Exception loading plans:', error);
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = () => {
    if (selectedPlan) {
      onImport(selectedPlan);
      onClose();
    }
  };

  const getPlanSummary = (plan) => {
    const data = plan.data || {};
    const st = data.st || {};

    // The layout is stored at st.vineyardLayout.calculatedLayout
    const vineyardLayout = st.vineyardLayout || {};
    const calculatedLayout = vineyardLayout.calculatedLayout || {};

    // Log to help debug
    console.log('Plan data:', { plan: plan.name, st, vineyardLayout, calculatedLayout });

    // Extract spacing and vineLayout from calculatedLayout
    const spacing = calculatedLayout.spacing || {};
    const vineLayout = calculatedLayout.vineLayout || {};

    return {
      acres: parseFloat(st.acres) || 0,
      rowSpacing: parseFloat(spacing.row) || 0,
      vineSpacing: parseFloat(spacing.vine) || 0,
      variety: st.variety || st.grapeVariety || 'Not specified',
      totalVines: parseInt(vineLayout.totalVines) || 0,
      rows: parseInt(vineLayout.numberOfRows) || 0
    };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-vine-green-500 to-emerald-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <Download className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Import from Vineyard Planner</h2>
              <p className="text-sm text-white text-opacity-90">Select a plan to create operational blocks</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-vine-green-500"></div>
              <p className="text-gray-600 mt-4">Loading your plans...</p>
            </div>
          ) : !Array.isArray(plans) || plans.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Plans Found</h3>
              <p className="text-gray-600 mb-6">You haven't created any vineyard plans yet.</p>
              <a
                href="/planner"
                className="inline-flex items-center gap-2 px-6 py-3 bg-vine-green-500 text-white rounded-lg hover:bg-vine-green-600 transition-colors"
              >
                <MapPin className="w-4 h-4" />
                Create Your First Plan
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Select a plan to import ({Array.isArray(plans) ? plans.length : 0} available)
                </h3>
                <p className="text-sm text-gray-500">
                  This will create operational blocks based on your vineyard design.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.isArray(plans) && plans.map((plan) => {
                  const summary = getPlanSummary(plan);
                  const isSelected = selectedPlan?.id === plan.id;

                  return (
                    <button
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan)}
                      className={`text-left p-5 rounded-xl border-2 transition-all ${
                        isSelected
                          ? 'border-vine-green-500 bg-vine-green-50 shadow-md'
                          : 'border-gray-200 hover:border-vine-green-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">{plan.name}</h4>
                          <p className="text-xs text-gray-500">
                            Last updated: {new Date(plan.updated_at).toLocaleDateString()}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="w-6 h-6 bg-vine-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-vine-green-600" />
                          <div>
                            <div className="text-xs text-gray-500">Acreage</div>
                            <div className="text-sm font-semibold text-gray-900">{summary.acres} acres</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <GrapeIcon className="w-4 h-4 text-purple-600" />
                          <div>
                            <div className="text-xs text-gray-500">Vines</div>
                            <div className="text-sm font-semibold text-gray-900">{summary.totalVines.toLocaleString()}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Ruler className="w-4 h-4 text-blue-600" />
                          <div>
                            <div className="text-xs text-gray-500">Spacing</div>
                            <div className="text-sm font-semibold text-gray-900">
                              {summary.rowSpacing}' × {summary.vineSpacing}'
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <GrapeIcon className="w-4 h-4 text-amber-600" />
                          <div>
                            <div className="text-xs text-gray-500">Variety</div>
                            <div className="text-sm font-semibold text-gray-900 truncate">
                              {summary.variety}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">{summary.rows} rows</span>
                          <span className="text-vine-green-600 font-medium">
                            {summary.totalVines > 0 ? 'Ready to import' : 'Incomplete plan'}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
          <p className="text-sm text-gray-600">
            {selectedPlan ? (
              <>
                <span className="font-semibold text-vine-green-600">Selected:</span> {selectedPlan.name}
              </>
            ) : (
              'Select a plan above to continue'
            )}
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={!selectedPlan}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                selectedPlan
                  ? 'bg-vine-green-500 text-white hover:bg-vine-green-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Import Plan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
