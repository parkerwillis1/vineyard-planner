import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Wine, Grape, Droplet, X } from 'lucide-react';
import {
  getContainer,
  updateContainer,
  deleteContainer,
  listLots,
  updateLot,
  logLotAssignment,
  logLotRemoval,
  getVesselHistory,
  listSensors,
  getLatestReading,
  createFermentationLog
} from '@/shared/lib/productionApi';
import { VesselQuickView } from './VesselQuickView';
import { VesselAnalytics } from './VesselAnalytics';
import {
  VesselHeader,
  QuickActionsBar,
  ChemistryCards,
  AgingProgress,
  StatusChangeModal,
  QuickReadingModal,
  RecentActivity,
  VesselSpecifications,
  VolumeIndicator
} from './vessel-detail';

export function VesselDetail({ id: propId, onBack }) {
  const { id: paramId } = useParams();
  const id = propId || paramId;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Check if accessed via QR scan
  const isScan = searchParams.get('scan') === 'true';
  const fromView = searchParams.get('from');

  // If scanned via QR, show mobile-optimized quick view
  // Pass the id explicitly since useParams() may not work in nested renders
  if (isScan) {
    return <VesselQuickView id={id} />;
  }

  // Core state
  const [container, setContainer] = useState(null);
  const [lot, setLot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentVolume, setCurrentVolume] = useState(0);
  const [activeTab, setActiveTab] = useState('wine');
  const [recentHistory, setRecentHistory] = useState([]);

  // Sensor state
  const [sensor, setSensor] = useState(null);
  const [latestReading, setLatestReading] = useState(null);

  // Modal state
  const [showReadingModal, setShowReadingModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [pendingStatus, setPendingStatus] = useState(null);
  const [showLotPicker, setShowLotPicker] = useState(false);
  const [availableLots, setAvailableLots] = useState([]);
  const [isEditing, setIsEditing] = useState(false);

  // Loading states
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadVesselData();
  }, [id]);

  const loadVesselData = async () => {
    setLoading(true);
    try {
      const { data: containerData, error: containerError } = await getContainer(id);
      if (containerError) throw containerError;

      const { data: lotsData, error: lotsError } = await listLots();
      if (lotsError) throw lotsError;

      setContainer(containerData);

      // Find associated lot
      const associatedLot = lotsData?.find(l => l.container_id === id);
      setLot(associatedLot || null);

      // Set current volume
      setCurrentVolume(associatedLot?.current_volume_gallons ?? containerData.current_volume_gallons ?? 0);

      // Auto-sync container status
      if (associatedLot && containerData.status === 'empty') {
        try {
          await updateContainer(id, { status: 'in_use' });
          const { data: freshContainer } = await getContainer(id);
          if (freshContainer) setContainer(freshContainer);
        } catch (syncError) {
          console.error('Error syncing container status:', syncError);
        }
      }

      // Load recent vessel history
      try {
        const { data: historyData } = await getVesselHistory(id, { limit: 10 });
        setRecentHistory(historyData || []);
      } catch (historyErr) {
        console.error('Error loading vessel history:', historyErr);
      }

      // Load sensor data
      try {
        const { data: sensorsData } = await listSensors();
        const attachedSensor = sensorsData?.find(s =>
          s.container_id === id || (associatedLot && s.lot_id === associatedLot.id)
        );
        if (attachedSensor) {
          setSensor(attachedSensor);
          const { data: reading } = await getLatestReading(attachedSensor.id);
          setLatestReading(reading);
        } else {
          setSensor(null);
          setLatestReading(null);
        }
      } catch (sensorErr) {
        console.error('Error loading sensor data:', sensorErr);
      }
    } catch (err) {
      console.error('Error loading vessel:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (fromView) {
      navigate(`/production?view=${fromView}`);
    } else {
      navigate(-1);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this vessel?')) return;

    try {
      const { error: deleteError } = await deleteContainer(id);
      if (deleteError) throw deleteError;
      if (onBack) {
        onBack();
      } else {
        navigate('/production?view=containers');
      }
    } catch (err) {
      console.error('Error deleting vessel:', err);
      setError(err.message);
    }
  };

  const handleSaveReading = async (updates) => {
    if (!lot) return;

    setIsSaving(true);
    try {
      // Update the lot's current values
      const { error: updateError } = await updateLot(lot.id, updates);
      if (updateError) throw updateError;

      // Also create a fermentation log entry for history tracking
      const logEntry = {
        lot_id: lot.id,
        log_date: new Date().toISOString().split('T')[0],
        ph: updates.current_ph || null,
        titratable_acidity: updates.current_ta || null,
        alcohol_pct: updates.current_alcohol_pct || null,
        residual_sugar: updates.current_brix || null,
        notes: updates.notes || `Quick reading from ${container?.name || 'vessel'}`
      };

      // Only create log if we have at least one value
      if (logEntry.ph || logEntry.titratable_acidity || logEntry.alcohol_pct || logEntry.residual_sugar) {
        const { error: logError } = await createFermentationLog(logEntry);
        if (logError) {
          console.error('Error creating fermentation log:', logError);
          // Don't throw - the lot update succeeded, log is secondary
        }
      }

      setShowReadingModal(false);
      await loadVesselData();
    } catch (err) {
      console.error('Error saving reading:', err);
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = (newStatus) => {
    if (newStatus === 'ready_to_bottle') {
      setPendingStatus(newStatus);
      setShowStatusModal(true);
    } else {
      setPendingStatus(newStatus);
      setShowStatusModal(true);
    }
  };

  const handleConfirmStatusChange = async (justification) => {
    if (!lot || !pendingStatus) return;

    setIsSaving(true);
    try {
      const updateData = { status: pendingStatus };

      // If marking ready for bottling with justification
      if (pendingStatus === 'ready_to_bottle' && justification) {
        const agingStart = lot.press_date ? new Date(lot.press_date) : new Date(lot.updated_at);
        const monthsAging = Math.round((new Date() - agingStart) / (1000 * 60 * 60 * 24 * 30.44));

        const justificationNote = `[READY FOR BOTTLING - ${new Date().toLocaleDateString()}]\n` +
          `Aged: ${monthsAging} months (expected: 18 months)\n` +
          `Justification: ${justification.trim()}`;

        const existingNotes = lot.notes || '';
        updateData.notes = existingNotes ? `${existingNotes}\n\n${justificationNote}` : justificationNote;
      }

      const { error } = await updateLot(lot.id, updateData);
      if (error) throw error;

      setShowStatusModal(false);
      setPendingStatus(null);
      await loadVesselData();
    } catch (err) {
      console.error('Error updating status:', err);
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveVolume = async (newVolume) => {
    setIsSaving(true);
    try {
      const { error: updateError } = await updateContainer(id, {
        current_volume_gallons: newVolume
      });
      if (updateError) throw updateError;

      setCurrentVolume(newVolume);
      await loadVesselData();
    } catch (err) {
      console.error('Error saving volume:', err);
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveVessel = async (updates) => {
    try {
      const { error: updateError } = await updateContainer(id, updates);
      if (updateError) throw updateError;
      await loadVesselData();
    } catch (err) {
      console.error('Error saving vessel:', err);
      setError(err.message);
      throw err;
    }
  };

  const loadAvailableLots = async () => {
    try {
      const { data: lotsData, error: lotsError } = await listLots();
      if (lotsError) throw lotsError;

      let validStatuses;
      if (container.type === 'barrel') {
        validStatuses = ['pressed', 'aging', 'blending', 'filtering'];
      } else {
        validStatuses = ['fermenting', 'pressed', 'aging', 'blending', 'filtering'];
      }

      const available = lotsData?.filter(l =>
        (!l.container_id || l.container_id === id) &&
        validStatuses.includes(l.status)
      ) || [];

      setAvailableLots(available);
      setShowLotPicker(true);
    } catch (err) {
      console.error('Error loading lots:', err);
      setError(err.message);
    }
  };

  const assignLotToVessel = async (lotId) => {
    try {
      const lotToAssign = availableLots.find(l => l.id === lotId);
      const volume = lotToAssign?.current_volume_gallons || 0;

      const { error: updateError } = await updateLot(lotId, { container_id: id });
      if (updateError) throw updateError;

      try {
        await logLotAssignment(id, lotId, volume);
      } catch (historyError) {
        console.error('Error logging vessel history:', historyError);
      }

      setShowLotPicker(false);
      await loadVesselData();
    } catch (err) {
      console.error('Error assigning lot:', err);
      setError(err.message);
    }
  };

  const unassignLot = async () => {
    if (!lot) return;
    if (!confirm('Remove this lot from the vessel?')) return;

    try {
      const { error: updateError } = await updateLot(lot.id, { container_id: null });
      if (updateError) throw updateError;

      try {
        await logLotRemoval(id, lot.id, 'User removed lot from vessel');
      } catch (historyError) {
        console.error('Error logging vessel history:', historyError);
      }

      await loadVesselData();
    } catch (err) {
      console.error('Error unassigning lot:', err);
      setError(err.message);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-[#7C203A] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading vessel details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !container) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error || 'Vessel not found'}</p>
          <button onClick={handleBack} className="mt-4 text-[#7C203A] hover:underline">
            Back to Vessels
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:pt-6 sm:pl-6">
      {/* Header */}
      <div className="sm:mr-6">
        <VesselHeader
          container={container}
          lot={lot}
          currentVolume={currentVolume}
          onBack={handleBack}
          onEdit={() => {
            setActiveTab('vessel');
            setIsEditing(true);
          }}
          onDelete={handleDelete}
          onChangeLot={loadAvailableLots}
          onAssignLot={loadAvailableLots}
        />
      </div>

      {/* Quick Actions Bar - Only show when lot is assigned */}
      {lot && (
        <div className="sm:mr-6">
          <QuickActionsBar
            lot={lot}
            onAddReading={() => setShowReadingModal(true)}
            onMarkReady={() => handleStatusChange('ready_to_bottle')}
            onAddNote={() => {
              // Could open a notes modal, for now just scroll to activity
              setActiveTab('wine');
            }}
          />
        </div>
      )}

      {/* Tabs - Simplified to 2 tabs */}
      <div className="border-b border-gray-200 sm:mr-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('wine')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors bg-transparent rounded-none border-x-0 border-t-0 ${
              activeTab === 'wine'
                ? 'border-slate-800 text-slate-900'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Wine Info
          </button>
          <button
            onClick={() => setActiveTab('vessel')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors bg-transparent rounded-none border-x-0 border-t-0 ${
              activeTab === 'vessel'
                ? 'border-slate-800 text-slate-900'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Vessel Details
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'wine' && (
        <div className="space-y-4 sm:mr-6">
          {lot ? (
            <>
              {/* Chemistry Cards */}
              <ChemistryCards
                lot={lot}
                latestReading={latestReading}
                sensor={sensor}
                onCardClick={() => setShowReadingModal(true)}
              />

              {/* Aging Progress */}
              <AgingProgress
                lot={lot}
                onStatusChange={handleStatusChange}
              />

              {/* Recent Activity */}
              <RecentActivity
                history={recentHistory}
                onViewAll={() => navigate(`/production?view=analytics&vessel=${id}`)}
              />
            </>
          ) : (
            // Empty vessel state
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300 p-10 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mx-auto mb-4">
                <Wine className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-700 font-semibold text-lg">Vessel Empty</p>
              <p className="text-sm text-gray-500 mt-1 mb-4">No wine lot currently assigned</p>
              <button
                onClick={loadAvailableLots}
                className="px-5 py-2.5 bg-[#7C203A] text-white rounded-lg hover:bg-[#5a1a2d] transition-colors inline-flex items-center gap-2 font-medium"
              >
                <Grape className="w-4 h-4" />
                Assign a Lot
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'vessel' && (
        <div className="space-y-4 sm:mr-6">
          {/* Vessel Specifications */}
          <VesselSpecifications
            container={container}
            onSave={handleSaveVessel}
          />

          {/* Volume Indicator */}
          <VolumeIndicator
            currentVolume={currentVolume}
            capacity={container.capacity_gallons}
            onVolumeChange={setCurrentVolume}
            onSave={handleSaveVolume}
            isSaving={isSaving}
          />
        </div>
      )}

      {/* Modals */}
      <QuickReadingModal
        isOpen={showReadingModal}
        onClose={() => setShowReadingModal(false)}
        lot={lot}
        onSave={handleSaveReading}
        isLoading={isSaving}
      />

      <StatusChangeModal
        isOpen={showStatusModal}
        onClose={() => {
          setShowStatusModal(false);
          setPendingStatus(null);
        }}
        lot={lot}
        newStatus={pendingStatus}
        onConfirm={handleConfirmStatusChange}
        isLoading={isSaving}
      />

      {/* Lot Picker Modal */}
      {showLotPicker && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Assign Lot to {container.name}</h2>
                <button
                  onClick={() => setShowLotPicker(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-1">Select a lot to assign to this vessel</p>
            </div>

            <div className="overflow-y-auto max-h-[calc(80vh-180px)] p-6">
              {availableLots.length === 0 ? (
                <div className="text-center py-8">
                  <Droplet className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">No available lots</p>
                  <p className="text-sm text-gray-500 mt-1">Create a lot in Harvest Intake first</p>
                  <button
                    onClick={() => {
                      setShowLotPicker(false);
                      navigate('/production?view=harvest');
                    }}
                    className="mt-4 px-4 py-2 bg-[#7C203A] text-white rounded-lg hover:bg-[#5a1a2d] transition-colors"
                  >
                    Go to Harvest Intake
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {availableLots.map((availableLot) => (
                    <button
                      key={availableLot.id}
                      onClick={() => assignLotToVessel(availableLot.id)}
                      className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-[#7C203A] hover:bg-gray-50 transition-all text-left"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 text-lg">{availableLot.name}</h3>
                          <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-gray-600">Varietal:</span>{' '}
                              <span className="font-medium text-gray-900">{availableLot.varietal}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Vintage:</span>{' '}
                              <span className="font-medium text-gray-900">{availableLot.vintage}</span>
                            </div>
                            {availableLot.volume_gallons && (
                              <div>
                                <span className="text-gray-600">Volume:</span>{' '}
                                <span className="font-medium text-gray-900">{availableLot.volume_gallons} gal</span>
                              </div>
                            )}
                            <div>
                              <span className="text-gray-600">Status:</span>{' '}
                              <span className="font-medium text-gray-900 capitalize">
                                {availableLot.status.replace(/_/g, ' ')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => setShowLotPicker(false)}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
