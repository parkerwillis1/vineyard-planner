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
      // Validate ID first
      if (!id || id === 'undefined') {
        throw new Error('Invalid vessel ID. Please scan a valid QR code.');
      }

      // Fetch container
      const { data: containerData, error: containerError } = await getContainer(id);
      if (containerError) {
        console.error('Container error:', containerError);
        throw containerError;
      }

      if (!containerData) {
        throw new Error('Vessel not found. It may have been deleted.');
      }

      // Fetch all lots to find assigned one
      const { data: lotsData, error: lotsError } = await listLots();
      if (lotsError) {
        console.error('Lots error:', lotsError);
        // Non-critical, continue without lot data
      }

      setContainer(containerData);

      // Find associated lot
      const associatedLot = lotsData?.find(l => l.container_id === id);
      setLot(associatedLot || null);

    } catch (err) {
      console.error('Error loading vessel:', err);
      setError(err.message || 'Failed to load vessel data');
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
      <div className="min-h-screen bg-gradient-to-br from-[#7C203A] to-[#422833] flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl">
          <div className="text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <X className="w-12 h-12 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Vessel Not Found</h2>
            <p className="text-base text-gray-600 mb-6 leading-relaxed">
              {error.includes('uuid')
                ? 'The QR code appears to be invalid or the vessel has been deleted.'
                : error}
            </p>
            <button
              onClick={() => navigate('/production?view=containers')}
              className="w-full py-4 bg-[#7C203A] text-white rounded-xl font-bold text-lg hover:bg-[#8B2E48] active:scale-98 transition-all shadow-lg"
            >
              Back to Vessels
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#7C203A] to-[#422833] pb-6">
      {/* Header with scan indicator */}
      {isScan && (
        <div className="bg-white/10 backdrop-blur-sm text-white px-4 py-3 text-center font-medium">
          <CheckCircle2 className="w-5 h-5 inline mr-2" />
          QR Code Scanned Successfully
        </div>
      )}

      {/* Main Content */}
      <div className="p-5 space-y-5">
        {/* Success/Error Messages */}
        {success && (
          <div className="bg-green-500 text-white px-5 py-4 rounded-xl flex items-center justify-between shadow-lg text-base font-medium">
            <span>{success}</span>
            <button onClick={() => setSuccess(null)} className="p-1 hover:bg-green-600 rounded-lg transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
        )}

        {error && (
          <div className="bg-red-500 text-white px-5 py-4 rounded-xl flex items-center justify-between shadow-lg text-base font-medium">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="p-1 hover:bg-red-600 rounded-lg transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
        )}

        {/* Vessel Header Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="flex items-start justify-between mb-5">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-1">{container.name}</h1>
              <p className="text-lg text-gray-600 capitalize">{container.type} • {container.capacity_gallons} gal</p>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap ${getStatusColor(container.status)}`}>
              {container.status.replace('_', ' ')}
            </span>
          </div>

          {/* Fill Level Indicator */}
          <div className="mb-5">
            <div className="flex justify-between text-base text-gray-700 mb-2 font-medium">
              <span>Fill Level</span>
              <span className="font-bold text-lg">{fillPercentage.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden shadow-inner">
              <div
                className="bg-gradient-to-r from-[#7C203A] to-[#8B2E48] h-6 transition-all duration-500 flex items-center justify-end"
                style={{ width: `${fillPercentage}%` }}
              >
                {fillPercentage > 10 && (
                  <span className="text-white text-xs font-bold mr-2">{fillPercentage.toFixed(0)}%</span>
                )}
              </div>
            </div>
          </div>

          {/* Current Lot Info */}
          {lot ? (
            <div className="bg-purple-50 rounded-xl p-5 border-2 border-purple-200">
              <p className="text-base font-bold text-purple-900 mb-1">{lot.name}</p>
              <p className="text-base text-purple-700 mb-4">{lot.varietal} • {lot.vintage}</p>
              <div className="grid grid-cols-2 gap-3">
                {lot.current_brix && (
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <p className="text-sm text-gray-600 mb-1">Brix</p>
                    <p className="text-2xl font-bold text-gray-900">{lot.current_brix.toFixed(1)}°</p>
                  </div>
                )}
                {lot.current_temp_f && (
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <p className="text-sm text-gray-600 mb-1">Temp</p>
                    <p className="text-2xl font-bold text-gray-900">{lot.current_temp_f.toFixed(0)}°F</p>
                  </div>
                )}
                {lot.current_ph && (
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <p className="text-sm text-gray-600 mb-1">pH</p>
                    <p className="text-2xl font-bold text-gray-900">{lot.current_ph.toFixed(2)}</p>
                  </div>
                )}
                {lot.current_volume_gallons && (
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <p className="text-sm text-gray-600 mb-1">Volume</p>
                    <p className="text-2xl font-bold text-gray-900">{lot.current_volume_gallons.toFixed(0)} gal</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-6 text-center text-gray-600">
              <Droplet className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-base font-medium">No lot currently assigned</p>
            </div>
          )}
        </div>

        {/* Quick Actions - Larger touch targets */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setShowReadingModal(true)}
            disabled={!lot}
            className={`bg-white rounded-2xl shadow-xl p-5 text-left transition-all min-h-[120px] ${
              lot ? 'hover:shadow-2xl active:scale-95' : 'opacity-50 cursor-not-allowed'
            }`}
          >
            <TrendingDown className="w-8 h-8 text-blue-600 mb-3" />
            <p className="font-bold text-gray-900 text-lg mb-1">Log Reading</p>
            <p className="text-sm text-gray-600">Brix, Temp, pH</p>
          </button>

          <button
            onClick={() => setShowCIPModal(true)}
            className="bg-white rounded-2xl shadow-xl p-5 text-left hover:shadow-2xl active:scale-95 transition-all min-h-[120px]"
          >
            <Sparkles className="w-8 h-8 text-emerald-600 mb-3" />
            <p className="font-bold text-gray-900 text-lg mb-1">Mark Cleaned</p>
            <p className="text-sm text-gray-600">Record CIP</p>
          </button>

          <button
            onClick={() => navigate(`/production/vessel/${id}`)}
            className="bg-white rounded-2xl shadow-xl p-5 text-left hover:shadow-2xl active:scale-95 transition-all min-h-[120px]"
          >
            <BarChart3 className="w-8 h-8 text-purple-600 mb-3" />
            <p className="font-bold text-gray-900 text-lg mb-1">Full Details</p>
            <p className="text-sm text-gray-600">View analytics</p>
          </button>

          <button
            onClick={() => navigate('/production/vessels')}
            className="bg-white rounded-2xl shadow-xl p-5 text-left hover:shadow-2xl active:scale-95 transition-all min-h-[120px]"
          >
            <ExternalLink className="w-8 h-8 text-gray-600 mb-3" />
            <p className="font-bold text-gray-900 text-lg mb-1">All Vessels</p>
            <p className="text-sm text-gray-600">Manage fleet</p>
          </button>
        </div>
      </div>

      {/* CIP Modal - Mobile Optimized */}
      {showCIPModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Record CIP</h3>
              <button
                onClick={() => setShowCIPModal(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-7 h-7 text-gray-600" />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-base font-semibold text-gray-700 mb-2">CIP Product</label>
                <input
                  type="text"
                  value={cipData.product}
                  onChange={(e) => setCIPData({ ...cipData, product: e.target.value })}
                  className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="e.g., Saniclean, Star San"
                />
              </div>

              <div>
                <label className="block text-base font-semibold text-gray-700 mb-2">Cost (optional)</label>
                <input
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  value={cipData.cost}
                  onChange={(e) => setCIPData({ ...cipData, cost: e.target.value })}
                  className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="$0.00"
                />
              </div>

              <button
                onClick={handleQuickCIP}
                className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold text-lg hover:bg-emerald-700 active:scale-98 transition-all shadow-lg"
              >
                Save CIP Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reading Modal - Mobile Optimized */}
      {showReadingModal && lot && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Log Reading</h3>
              <button
                onClick={() => setShowReadingModal(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-7 h-7 text-gray-600" />
              </button>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-base font-semibold text-gray-700 mb-2">Brix</label>
                  <input
                    type="number"
                    step="0.1"
                    inputMode="decimal"
                    value={readingData.brix}
                    onChange={(e) => setReadingData({ ...readingData, brix: e.target.value })}
                    className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.0"
                  />
                </div>

                <div>
                  <label className="block text-base font-semibold text-gray-700 mb-2">Temp (°F)</label>
                  <input
                    type="number"
                    step="0.1"
                    inputMode="decimal"
                    value={readingData.temp_f}
                    onChange={(e) => setReadingData({ ...readingData, temp_f: e.target.value })}
                    className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-base font-semibold text-gray-700 mb-2">pH</label>
                <input
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  value={readingData.ph}
                  onChange={(e) => setReadingData({ ...readingData, ph: e.target.value })}
                  className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-base font-semibold text-gray-700 mb-2">Notes</label>
                <textarea
                  value={readingData.notes}
                  onChange={(e) => setReadingData({ ...readingData, notes: e.target.value })}
                  className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Optional notes..."
                />
              </div>

              <button
                onClick={handleQuickReading}
                className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 active:scale-98 transition-all shadow-lg"
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
