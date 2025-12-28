import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Droplet, Thermometer, TrendingDown, Activity, CheckCircle2,
  Sparkles, BarChart3, Clock, X, ArrowRight, ExternalLink
} from 'lucide-react';
import {
  getContainer,
  listLots,
  updateContainer,
  logCIPEvent,
  createFermentationLog
} from '@/shared/lib/productionApi';

/**
 * Mobile-optimized quick view for vessels accessed via QR code scan
 * Shows essential info and quick action buttons
 */
export function VesselQuickView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isScan = searchParams.get('scan') === 'true';

  const [container, setContainer] = useState(null);
  const [lot, setLot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Quick action modals
  const [showCIPModal, setShowCIPModal] = useState(false);
  const [showReadingModal, setShowReadingModal] = useState(false);

  const [cipData, setCIPData] = useState({
    product: 'Saniclean',
    cost: ''
  });

  const [readingData, setReadingData] = useState({
    brix: '',
    temp_f: '',
    ph: '',
    notes: ''
  });

  useEffect(() => {
    loadVesselData();
  }, [id]);

  const loadVesselData = async () => {
    setLoading(true);
    try {
      // Fetch container
      const { data: containerData, error: containerError } = await getContainer(id);
      if (containerError) throw containerError;

      // Fetch all lots to find assigned one
      const { data: lotsData, error: lotsError } = await listLots();
      if (lotsError) throw lotsError;

      setContainer(containerData);

      // Find associated lot
      const associatedLot = lotsData?.find(l => l.container_id === id);
      setLot(associatedLot || null);

    } catch (err) {
      console.error('Error loading vessel:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickCIP = async () => {
    try {
      // Log CIP event
      await logCIPEvent(id, cipData.product, cipData.cost ? parseFloat(cipData.cost) : null);

      // Update container status
      await updateContainer(id, {
        status: 'sanitized',
        last_cip_date: new Date().toISOString().split('T')[0],
        cip_product: cipData.product
      });

      setSuccess('CIP recorded successfully');
      setShowCIPModal(false);
      loadVesselData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleQuickReading = async () => {
    if (!lot) {
      setError('No lot assigned to this vessel');
      return;
    }

    try {
      await createFermentationLog({
        lot_id: lot.id,
        brix: readingData.brix ? parseFloat(readingData.brix) : null,
        temp_f: readingData.temp_f ? parseFloat(readingData.temp_f) : null,
        ph: readingData.ph ? parseFloat(readingData.ph) : null,
        notes: readingData.notes
      });

      setSuccess('Reading recorded successfully');
      setShowReadingModal(false);
      setReadingData({ brix: '', temp_f: '', ph: '', notes: '' });
    } catch (err) {
      setError(err.message);
    }
  };

  const fillPercentage = container && lot
    ? Math.min((lot.current_volume_gallons / container.capacity_gallons) * 100, 100)
    : 0;

  const getStatusColor = (status) => {
    const colors = {
      'empty': 'bg-gray-100 text-gray-700',
      'in_use': 'bg-green-100 text-green-700',
      'cleaning': 'bg-blue-100 text-blue-700',
      'sanitized': 'bg-emerald-100 text-emerald-700',
      'needs_cip': 'bg-orange-100 text-orange-700',
      'needs_repair': 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#7C203A] to-[#422833] flex items-center justify-center p-4">
        <div className="text-white text-center">
          <Activity className="w-12 h-12 mx-auto mb-4 animate-pulse" />
          <p className="text-lg">Loading vessel...</p>
        </div>
      </div>
    );
  }

  if (error && !container) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#7C203A] to-[#422833] flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-6 max-w-sm w-full">
          <div className="text-center">
            <X className="w-12 h-12 mx-auto mb-4 text-red-600" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Vessel Not Found</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => navigate('/production/vessels')}
              className="px-4 py-2 bg-[#7C203A] text-white rounded-lg"
            >
              Back to Vessels
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#7C203A] to-[#422833]">
      {/* Header with scan indicator */}
      {isScan && (
        <div className="bg-white/10 backdrop-blur-sm text-white px-4 py-2 text-center text-sm">
          <CheckCircle2 className="w-4 h-4 inline mr-2" />
          QR Code Scanned Successfully
        </div>
      )}

      {/* Main Content */}
      <div className="p-4 space-y-4">
        {/* Success/Error Messages */}
        {success && (
          <div className="bg-green-500 text-white px-4 py-3 rounded-lg flex items-center justify-between">
            <span>{success}</span>
            <button onClick={() => setSuccess(null)}><X className="w-5 h-5" /></button>
          </div>
        )}

        {error && (
          <div className="bg-red-500 text-white px-4 py-3 rounded-lg flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)}><X className="w-5 h-5" /></button>
          </div>
        )}

        {/* Vessel Header Card */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{container.name}</h1>
              <p className="text-gray-600 capitalize">{container.type} • {container.capacity_gallons} gal</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(container.status)}`}>
              {container.status.replace('_', ' ')}
            </span>
          </div>

          {/* Fill Level Indicator */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Fill Level</span>
              <span className="font-semibold">{fillPercentage.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#7C203A] to-[#8B2E48] h-4 transition-all duration-500"
                style={{ width: `${fillPercentage}%` }}
              />
            </div>
          </div>

          {/* Current Lot Info */}
          {lot ? (
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <p className="text-sm font-medium text-purple-900 mb-1">{lot.name}</p>
              <p className="text-sm text-purple-700">{lot.varietal} • {lot.vintage}</p>
              <div className="grid grid-cols-2 gap-3 mt-3">
                {lot.current_brix && (
                  <div className="bg-white rounded p-2">
                    <p className="text-xs text-gray-600">Brix</p>
                    <p className="text-lg font-bold text-gray-900">{lot.current_brix.toFixed(1)}°</p>
                  </div>
                )}
                {lot.current_temp_f && (
                  <div className="bg-white rounded p-2">
                    <p className="text-xs text-gray-600">Temp</p>
                    <p className="text-lg font-bold text-gray-900">{lot.current_temp_f.toFixed(0)}°F</p>
                  </div>
                )}
                {lot.current_ph && (
                  <div className="bg-white rounded p-2">
                    <p className="text-xs text-gray-600">pH</p>
                    <p className="text-lg font-bold text-gray-900">{lot.current_ph.toFixed(2)}</p>
                  </div>
                )}
                {lot.current_volume_gallons && (
                  <div className="bg-white rounded p-2">
                    <p className="text-xs text-gray-600">Volume</p>
                    <p className="text-lg font-bold text-gray-900">{lot.current_volume_gallons.toFixed(0)} gal</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-600">
              <Droplet className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">No lot currently assigned</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setShowReadingModal(true)}
            disabled={!lot}
            className={`bg-white rounded-xl shadow-lg p-4 text-left transition-all ${
              lot ? 'hover:shadow-xl active:scale-95' : 'opacity-50 cursor-not-allowed'
            }`}
          >
            <TrendingDown className="w-6 h-6 text-blue-600 mb-2" />
            <p className="font-semibold text-gray-900">Log Reading</p>
            <p className="text-xs text-gray-600">Brix, Temp, pH</p>
          </button>

          <button
            onClick={() => setShowCIPModal(true)}
            className="bg-white rounded-xl shadow-lg p-4 text-left hover:shadow-xl active:scale-95 transition-all"
          >
            <Sparkles className="w-6 h-6 text-emerald-600 mb-2" />
            <p className="font-semibold text-gray-900">Mark Cleaned</p>
            <p className="text-xs text-gray-600">Record CIP</p>
          </button>

          <button
            onClick={() => navigate(`/production/vessel/${id}`)}
            className="bg-white rounded-xl shadow-lg p-4 text-left hover:shadow-xl active:scale-95 transition-all"
          >
            <BarChart3 className="w-6 h-6 text-purple-600 mb-2" />
            <p className="font-semibold text-gray-900">Full Details</p>
            <p className="text-xs text-gray-600">View analytics</p>
          </button>

          <button
            onClick={() => navigate('/production/vessels')}
            className="bg-white rounded-xl shadow-lg p-4 text-left hover:shadow-xl active:scale-95 transition-all"
          >
            <ExternalLink className="w-6 h-6 text-gray-600 mb-2" />
            <p className="font-semibold text-gray-900">All Vessels</p>
            <p className="text-xs text-gray-600">Manage fleet</p>
          </button>
        </div>
      </div>

      {/* CIP Modal */}
      {showCIPModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Record CIP</h3>
              <button onClick={() => setShowCIPModal(false)}>
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CIP Product</label>
                <input
                  type="text"
                  value={cipData.product}
                  onChange={(e) => setCIPData({ ...cipData, product: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="e.g., Saniclean, Star San"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cost (optional)</label>
                <input
                  type="number"
                  step="0.01"
                  value={cipData.cost}
                  onChange={(e) => setCIPData({ ...cipData, cost: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="$0.00"
                />
              </div>

              <button
                onClick={handleQuickCIP}
                className="w-full py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
              >
                Save CIP Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reading Modal */}
      {showReadingModal && lot && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Log Reading</h3>
              <button onClick={() => setShowReadingModal(false)}>
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Brix</label>
                  <input
                    type="number"
                    step="0.1"
                    value={readingData.brix}
                    onChange={(e) => setReadingData({ ...readingData, brix: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Temp (°F)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={readingData.temp_f}
                    onChange={(e) => setReadingData({ ...readingData, temp_f: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">pH</label>
                <input
                  type="number"
                  step="0.01"
                  value={readingData.ph}
                  onChange={(e) => setReadingData({ ...readingData, ph: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={readingData.notes}
                  onChange={(e) => setReadingData({ ...readingData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={2}
                />
              </div>

              <button
                onClick={handleQuickReading}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Save Reading
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
