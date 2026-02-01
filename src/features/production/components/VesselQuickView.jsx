import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Droplet, Thermometer, TrendingDown, Activity, CheckCircle2,
  Sparkles, BarChart3, Clock, X, ArrowRight, ExternalLink, Wine, Grape,
  Barrel, Package, MapPin, Beaker, LogIn, AlertCircle
} from 'lucide-react';
import {
  getContainer,
  listLots,
  updateContainer,
  updateLot,
  logCIPEvent,
  createFermentationLog
} from '@/shared/lib/productionApi';
import { useAuth } from '@/auth/AuthContext.jsx';

/**
 * Mobile-optimized quick view for vessels accessed via QR code scan
 * Shows essential info and quick action buttons
 */
export function VesselQuickView({ id: propId }) {
  const { id: paramId } = useParams();
  const id = propId || paramId; // Use prop if provided, fallback to URL param
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isScan = searchParams.get('scan') === 'true';
  const { user, loading: authLoading } = useAuth() || {};

  console.log('[VesselQuickView] ID from prop:', propId, 'ID from params:', paramId, 'Using:', id);

  const [container, setContainer] = useState(null);
  const [lot, setLot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorType, setErrorType] = useState(null); // 'auth', 'not_found', 'invalid_id'
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
    // Wait for auth to load before fetching data
    if (!authLoading) {
      loadVesselData();
    }
  }, [id, authLoading, user]);

  const loadVesselData = async () => {
    setLoading(true);
    setError(null);
    setErrorType(null);

    try {
      // Check auth first
      if (!user) {
        setErrorType('auth');
        throw new Error('Please sign in to view this vessel.');
      }

      // Validate ID format
      if (!id || id === 'undefined') {
        setErrorType('invalid_id');
        throw new Error('Invalid vessel ID. Please scan a valid QR code.');
      }

      // Basic UUID format check
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        setErrorType('invalid_id');
        throw new Error('Invalid QR code format. This doesn\'t appear to be a valid vessel code.');
      }

      // Fetch container
      console.log('[VesselQuickView] Fetching container:', id);
      const { data: containerData, error: containerError } = await getContainer(id);

      if (containerError) {
        console.error('[VesselQuickView] Container error:', containerError);
        // Check for specific error types
        if (containerError.message === 'Not authenticated') {
          setErrorType('auth');
          throw new Error('Please sign in to view this vessel.');
        }
        if (containerError.code === 'PGRST116' || containerError.message?.includes('no rows')) {
          setErrorType('not_found');
          throw new Error('Vessel not found. It may have been deleted or belongs to a different account.');
        }
        if (containerError.message?.includes('uuid')) {
          setErrorType('invalid_id');
          throw new Error('Invalid QR code. Please try scanning again.');
        }
        throw containerError;
      }

      if (!containerData) {
        console.error('[VesselQuickView] No container data returned');
        setErrorType('not_found');
        throw new Error('Vessel not found. It may have been deleted or belongs to a different account.');
      }

      console.log('[VesselQuickView] Container found:', containerData.name);

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
      // Update lot directly with new readings
      const updateData = {};
      if (readingData.brix) updateData.current_brix = parseFloat(readingData.brix);
      if (readingData.temp_f) updateData.current_temp_f = parseFloat(readingData.temp_f);
      if (readingData.ph) updateData.current_ph = parseFloat(readingData.ph);

      const { error: updateError } = await updateLot(lot.id, updateData);
      if (updateError) throw updateError;

      // Also log to fermentation history if needed
      if (readingData.notes) {
        await createFermentationLog({
          lot_id: lot.id,
          brix: readingData.brix ? parseFloat(readingData.brix) : null,
          temp_f: readingData.temp_f ? parseFloat(readingData.temp_f) : null,
          ph: readingData.ph ? parseFloat(readingData.ph) : null,
          notes: readingData.notes
        });
      }

      setSuccess('Reading saved successfully');
      setShowReadingModal(false);
      setReadingData({ brix: '', temp_f: '', ph: '', notes: '' });
      loadVesselData();
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
      'cleaning': 'bg-slate-100 text-slate-700',
      'sanitized': 'bg-emerald-100 text-emerald-700',
      'needs_cip': 'bg-orange-100 text-orange-700',
      'needs_repair': 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#7C203A] to-[#422833] flex items-center justify-center p-4">
        <div className="text-white text-center">
          <Activity className="w-12 h-12 mx-auto mb-4 animate-pulse" />
          <p className="text-lg">{authLoading ? 'Checking login...' : 'Loading vessel...'}</p>
        </div>
      </div>
    );
  }

  // Auth required error - show sign in prompt
  if (errorType === 'auth' || (!user && !loading)) {
    const currentUrl = window.location.pathname + window.location.search;
    const redirectUrl = encodeURIComponent(currentUrl);

    return (
      <div className="min-h-screen bg-gradient-to-br from-[#7C203A] to-[#422833] flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl">
          <div className="text-center">
            <div className="w-20 h-20 bg-[#7C203A]/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <LogIn className="w-10 h-10 text-[#7C203A]" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Sign In Required</h2>
            <p className="text-base text-gray-600 mb-6 leading-relaxed">
              Please sign in to your Trellis account to view this vessel.
            </p>
            <Link
              to={`/signin?redirect=${redirectUrl}`}
              className="block w-full py-4 bg-[#7C203A] text-white rounded-xl font-bold text-lg hover:bg-[#8B2E48] active:scale-98 transition-all shadow-lg text-center mb-3"
            >
              Sign In
            </Link>
            <Link
              to={`/signup?redirect=${redirectUrl}`}
              className="block w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold text-base hover:bg-gray-200 active:scale-98 transition-all text-center"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Other errors
  if (error && !container) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#7C203A] to-[#422833] flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl">
          <div className="text-center">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
              errorType === 'invalid_id' ? 'bg-amber-100' : 'bg-red-100'
            }`}>
              {errorType === 'invalid_id' ? (
                <AlertCircle className="w-10 h-10 text-amber-600" />
              ) : (
                <X className="w-12 h-12 text-red-600" />
              )}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              {errorType === 'invalid_id' ? 'Invalid QR Code' : 'Vessel Not Found'}
            </h2>
            <p className="text-base text-gray-600 mb-6 leading-relaxed">
              {error}
            </p>

            {/* Debug info for troubleshooting */}
            <div className="bg-gray-50 rounded-lg p-3 mb-6 text-left">
              <p className="text-xs text-gray-500 mb-2 font-medium">Troubleshooting:</p>
              <ul className="text-xs text-gray-500 space-y-1 mb-3">
                <li>• Make sure you're signed into the correct account</li>
                <li>• The vessel may have been deleted</li>
                <li>• Try scanning the QR code again</li>
              </ul>
              <div className="border-t border-gray-200 pt-2 mt-2">
                <p className="text-[10px] text-gray-400 font-mono break-all">
                  ID: {id || 'none'}
                </p>
                <p className="text-[10px] text-gray-400">
                  User: {user?.email || 'not signed in'}
                </p>
              </div>
            </div>

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
            <div className="bg-gradient-to-br from-[#7C203A]/10 to-[#7C203A]/5 rounded-xl p-5 border-2 border-[#7C203A]/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[#7C203A] flex items-center justify-center">
                  <Wine className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900">{lot.varietal || 'Unknown'}</p>
                  <p className="text-sm text-[#7C203A] font-semibold">{lot.vintage} • {lot.name}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Brix</p>
                  <p className="text-2xl font-bold text-amber-600">{lot.current_brix?.toFixed(1) || '—'}°</p>
                </div>
                <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Temp</p>
                  <p className="text-2xl font-bold text-red-600">{lot.current_temp_f?.toFixed(0) || '—'}°F</p>
                </div>
                <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">pH</p>
                  <p className="text-2xl font-bold text-purple-600">{lot.current_ph?.toFixed(2) || '—'}</p>
                </div>
                <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Volume</p>
                  <p className="text-2xl font-bold text-[#7C203A]">{lot.current_volume_gallons?.toFixed(0) || '—'} <span className="text-sm font-normal">gal</span></p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mx-auto mb-3">
                <Wine className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-lg font-semibold text-gray-700">Vessel Empty</p>
              <p className="text-sm text-gray-500 mt-1">No lot currently assigned</p>
            </div>
          )}
        </div>

        {/* Quick Actions - Larger touch targets */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setShowReadingModal(true)}
            disabled={!lot}
            className={`bg-white rounded-2xl shadow-xl p-5 text-left transition-all min-h-[120px] border-2 border-transparent ${
              lot ? 'hover:shadow-2xl hover:border-[#7C203A]/20 active:scale-95' : 'opacity-50 cursor-not-allowed'
            }`}
          >
            <div className="w-12 h-12 rounded-xl bg-[#7C203A]/10 flex items-center justify-center mb-3">
              <Activity className="w-6 h-6 text-[#7C203A]" />
            </div>
            <p className="font-bold text-gray-900 text-lg mb-1">Quick Reading</p>
            <p className="text-sm text-gray-600">Brix, Temp, pH</p>
          </button>

          <button
            onClick={() => setShowCIPModal(true)}
            className="bg-white rounded-2xl shadow-xl p-5 text-left hover:shadow-2xl hover:border-emerald-200 active:scale-95 transition-all min-h-[120px] border-2 border-transparent"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mb-3">
              <Sparkles className="w-6 h-6 text-emerald-600" />
            </div>
            <p className="font-bold text-gray-900 text-lg mb-1">Mark Cleaned</p>
            <p className="text-sm text-gray-600">Record CIP</p>
          </button>

          <button
            onClick={() => navigate(`/production/vessel/${id}`)}
            className="bg-white rounded-2xl shadow-xl p-5 text-left hover:shadow-2xl hover:border-slate-200 active:scale-95 transition-all min-h-[120px] border-2 border-transparent"
          >
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
              <BarChart3 className="w-6 h-6 text-slate-700" />
            </div>
            <p className="font-bold text-gray-900 text-lg mb-1">Full Details</p>
            <p className="text-sm text-gray-600">View analytics</p>
          </button>

          <button
            onClick={() => navigate('/production?view=containers')}
            className="bg-white rounded-2xl shadow-xl p-5 text-left hover:shadow-2xl hover:border-gray-200 active:scale-95 transition-all min-h-[120px] border-2 border-transparent"
          >
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
              <ExternalLink className="w-6 h-6 text-gray-600" />
            </div>
            <p className="font-bold text-gray-900 text-lg mb-1">All Vessels</p>
            <p className="text-sm text-gray-600">Manage fleet</p>
          </button>
        </div>
      </div>

      {/* CIP Modal - Mobile Optimized */}
      {showCIPModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Record CIP</h3>
                    <p className="text-white/70 text-sm">{container.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCIPModal(false)}
                  className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">CIP Product</label>
                <input
                  type="text"
                  value={cipData.product}
                  onChange={(e) => setCIPData({ ...cipData, product: e.target.value })}
                  className="w-full px-4 py-3 text-lg border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                  placeholder="e.g., Saniclean, Star San"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Cost (optional)</label>
                <input
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  value={cipData.cost}
                  onChange={(e) => setCIPData({ ...cipData, cost: e.target.value })}
                  className="w-full px-4 py-3 text-lg border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                  placeholder="$0.00"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setShowCIPModal(false)}
                className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold text-base hover:bg-gray-300 active:scale-98 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleQuickCIP}
                className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold text-base hover:bg-emerald-700 active:scale-98 transition-all shadow-lg"
              >
                Mark Clean
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reading Modal - Mobile Optimized */}
      {showReadingModal && lot && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#7C203A] to-[#5a1a2d] px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Quick Reading</h3>
                    <p className="text-white/70 text-sm">{lot.varietal} • {lot.vintage}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowReadingModal(false)}
                  className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto">
              <p className="text-sm text-gray-600">
                Enter new readings. Only fill in values you want to update.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Brix (°)</label>
                  <input
                    type="number"
                    step="0.1"
                    inputMode="decimal"
                    value={readingData.brix}
                    onChange={(e) => setReadingData({ ...readingData, brix: e.target.value })}
                    placeholder={lot.current_brix || '0.0'}
                    className="w-full px-4 py-3 text-xl font-semibold border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#7C203A]/20 focus:border-[#7C203A] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Temp (°F)</label>
                  <input
                    type="number"
                    step="0.1"
                    inputMode="decimal"
                    value={readingData.temp_f}
                    onChange={(e) => setReadingData({ ...readingData, temp_f: e.target.value })}
                    placeholder={lot.current_temp_f || '0.0'}
                    className="w-full px-4 py-3 text-xl font-semibold border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#7C203A]/20 focus:border-[#7C203A] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">pH</label>
                <input
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  value={readingData.ph}
                  onChange={(e) => setReadingData({ ...readingData, ph: e.target.value })}
                  placeholder={lot.current_ph || '0.00'}
                  className="w-full px-4 py-3 text-xl font-semibold border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#7C203A]/20 focus:border-[#7C203A] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Notes (optional)</label>
                <textarea
                  value={readingData.notes}
                  onChange={(e) => setReadingData({ ...readingData, notes: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#7C203A]/20 focus:border-[#7C203A] transition-colors resize-none"
                  rows={2}
                  placeholder="Any observations..."
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setShowReadingModal(false)}
                className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold text-base hover:bg-gray-300 active:scale-98 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleQuickReading}
                disabled={!readingData.brix && !readingData.temp_f && !readingData.ph}
                className="flex-1 py-3 bg-[#7C203A] text-white rounded-xl font-bold text-base hover:bg-[#5a1a2d] active:scale-98 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
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
