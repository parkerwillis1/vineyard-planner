import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Clock, Beaker, FlaskConical, Play, ChevronDown, X, Calculator, Grape } from 'lucide-react';
import { listLots, updateLot } from '@/shared/lib/productionApi';

// Common yeast strains with characteristics
const YEAST_STRAINS = {
  'EC-1118': { name: 'EC-1118 (Prise de Mousse)', temp: '50-86°F', alcohol: '18%', notes: 'Champagne yeast, clean, neutral, reliable' },
  'D47': { name: 'D47 (Côte des Blancs)', temp: '59-86°F', alcohol: '15%', notes: 'White wines, tropical fruit, spicy notes' },
  'RC212': { name: 'RC-212 (Bourgovin)', temp: '68-86°F', alcohol: '16%', notes: 'Pinot Noir, fruity, complex' },
  'BM4x4': { name: 'BM 4x4', temp: '64-82°F', alcohol: '16%', notes: 'Bordeaux reds, structure, color stability' },
  'BDX': { name: 'BDX (Pasteur Red)', temp: '68-95°F', alcohol: '16%', notes: 'Big reds, full-bodied, high alcohol' },
  'D254': { name: 'D254 (Assmannshausen)', temp: '50-95°F', alcohol: '16%', notes: 'Cool climate reds, enhances color' },
  'QA23': { name: 'QA23 (Portugal)', temp: '59-86°F', alcohol: '16%', notes: 'Aromatic whites, thiols, tropical' },
  '71B': { name: '71B-1122 (Narbonne)', temp: '59-86°F', alcohol: '14%', notes: 'Rosé, young reds, softens acidity' }
};

export function CrushPad() {
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCrushModal, setShowCrushModal] = useState(false);
  const [selectedLot, setSelectedLot] = useState(null);
  const [crushData, setCrushData] = useState({
    crush_date: new Date().toISOString().slice(0, 16),
    crushed_weight_lbs: '',
    so2_addition_ppm: '',
    so2_addition_grams: '',
    yeast_strain: '',
    yeast_grams: '',
    nutrient_type: '',
    nutrient_grams: '',
    acid_addition_grams: '',
    sugar_addition_lbs: '',
    cold_soak_hours: '',
    crush_notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data, error } = await listLots({ status: 'harvested,crushing' });
      if (error) throw error;
      setLots(data || []);
    } catch (err) {
      console.error('Error loading lots:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate days since harvest
  const getDaysSinceHarvest = (harvestDate) => {
    if (!harvestDate) return null;
    const harvest = new Date(harvestDate);
    const now = new Date();
    const diffTime = Math.abs(now - harvest);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Get urgency level
  const getUrgency = (days) => {
    if (days === null) return 'low';
    if (days > 2) return 'critical';
    if (days > 1) return 'high';
    return 'normal';
  };

  // Calculate SO2 addition based on pH
  const calculateSO2 = (ph, targetFreeSO2 = 0.8) => {
    if (!ph) return null;
    // Molecular SO2 formula: Free SO2 needed increases as pH increases
    const phNum = parseFloat(ph);
    if (phNum < 3.0) return 30;
    if (phNum < 3.3) return 40;
    if (phNum < 3.5) return 50;
    if (phNum < 3.7) return 60;
    return 75; // High pH needs more SO2
  };

  // Calculate SO2 grams from PPM and volume
  const calculateSO2Grams = (ppm, gallons) => {
    if (!ppm || !gallons) return '';
    // 1 gallon = 3.78541 liters
    // 1 ppm = 1 mg/L
    const liters = gallons * 3.78541;
    const grams = (ppm * liters) / 1000;
    return grams.toFixed(1);
  };

  // Recommend yeast based on varietal
  const recommendYeast = (varietal) => {
    const variety = varietal?.toLowerCase() || '';
    if (variety.includes('pinot')) return 'RC212';
    if (variety.includes('chardonnay')) return 'D47';
    if (variety.includes('sauvignon')) return 'QA23';
    if (variety.includes('cabernet') || variety.includes('merlot')) return 'BM4x4';
    if (variety.includes('syrah') || variety.includes('petite')) return 'BDX';
    if (variety.includes('zinfandel')) return 'D254';
    return 'EC-1118'; // Universal fallback
  };

  const handleOpenCrushModal = (lot) => {
    setSelectedLot(lot);
    const recommendedYeast = recommendYeast(lot.varietal);
    const recommendedSO2 = calculateSO2(lot.current_ph);

    setCrushData({
      crush_date: new Date().toISOString().slice(0, 16),
      crushed_weight_lbs: lot.initial_weight_lbs || '',
      so2_addition_ppm: recommendedSO2 || '',
      so2_addition_grams: calculateSO2Grams(recommendedSO2, lot.current_volume_gallons),
      yeast_strain: recommendedYeast,
      yeast_grams: '', // User fills based on manufacturer recommendation
      nutrient_type: 'Fermaid K',
      nutrient_grams: '',
      acid_addition_grams: '',
      sugar_addition_lbs: '',
      cold_soak_hours: lot.varietal?.toLowerCase().includes('pinot') ? '72' : '',
      crush_notes: ''
    });
    setShowCrushModal(true);
  };

  const handleCrushSubmit = async (e) => {
    e.preventDefault();

    try {
      const updates = {
        status: crushData.cold_soak_hours ? 'crushing' : 'fermenting',
        crush_date: crushData.crush_date,
        so2_ppm: parseFloat(crushData.so2_addition_ppm) || null,
        yeast_strain: crushData.yeast_strain || null,
        notes: selectedLot.notes
          ? `${selectedLot.notes}\n\n--- CRUSH RECORD ---\nSO₂: ${crushData.so2_addition_ppm}ppm (${crushData.so2_addition_grams}g)\nYeast: ${crushData.yeast_strain} (${crushData.yeast_grams}g)\nNutrients: ${crushData.nutrient_type} (${crushData.nutrient_grams}g)\n${crushData.acid_addition_grams ? `Acid: ${crushData.acid_addition_grams}g\n` : ''}${crushData.sugar_addition_lbs ? `Sugar: ${crushData.sugar_addition_lbs}lbs\n` : ''}${crushData.cold_soak_hours ? `Cold soak: ${crushData.cold_soak_hours}hrs\n` : ''}${crushData.crush_notes}`
          : `--- CRUSH RECORD ---\nSO₂: ${crushData.so2_addition_ppm}ppm (${crushData.so2_addition_grams}g)\nYeast: ${crushData.yeast_strain} (${crushData.yeast_grams}g)\nNutrients: ${crushData.nutrient_type} (${crushData.nutrient_grams}g)\n${crushData.acid_addition_grams ? `Acid: ${crushData.acid_addition_grams}g\n` : ''}${crushData.sugar_addition_lbs ? `Sugar: ${crushData.sugar_addition_lbs}lbs\n` : ''}${crushData.cold_soak_hours ? `Cold soak: ${crushData.cold_soak_hours}hrs\n` : ''}${crushData.crush_notes}`
      };

      const { error } = await updateLot(selectedLot.id, updates);

      if (error) {
        alert('Error recording crush: ' + error.message);
      } else {
        setShowCrushModal(false);
        setSelectedLot(null);
        loadData();
      }
    } catch (err) {
      alert('Failed to record crush: ' + err.message);
    }
  };

  const handleStartFermentation = async (lot) => {
    if (!confirm(`Start fermentation for ${lot.name}?\n\nThis will move the lot to the Fermentation Tracker.`)) return;

    try {
      const { error } = await updateLot(lot.id, {
        status: 'fermenting',
        fermentation_start_date: new Date().toISOString()
      });

      if (error) throw error;
      loadData();
    } catch (err) {
      alert('Error starting fermentation: ' + err.message);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-gray-500">Loading crush pad...</div></div>;
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="pt-4">
        <h2 className="text-2xl font-bold text-gray-900">Crush Pad</h2>
        <p className="text-gray-600 mt-1">Process harvested fruit and prepare for fermentation</p>
      </div>

      {/* Alert for urgent lots */}
      {lots.some(l => getUrgency(getDaysSinceHarvest(l.harvest_date)) === 'critical') && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-3" />
            <div>
              <p className="text-red-800 font-semibold">Urgent: Lots waiting 48+ hours!</p>
              <p className="text-red-700 text-sm">Spoilage risk increases significantly after 48 hours. Process immediately.</p>
            </div>
          </div>
        </div>
      )}

      {/* Lots awaiting processing */}
      {lots.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Grape className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">No lots awaiting processing</p>
          <p className="text-sm text-gray-500">Import harvests from the Harvest Intake page</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {lots.map(lot => {
            const days = getDaysSinceHarvest(lot.harvest_date);
            const urgency = getUrgency(days);
            const urgencyColors = {
              critical: 'border-red-500 bg-red-50',
              high: 'border-orange-500 bg-orange-50',
              normal: 'border-green-500 bg-green-50',
              low: 'border-gray-300 bg-white'
            };
            const urgencyTextColors = {
              critical: 'text-red-700',
              high: 'text-orange-700',
              normal: 'text-green-700',
              low: 'text-gray-700'
            };

            return (
              <div key={lot.id} className={`border-l-4 rounded-r-xl ${urgencyColors[urgency]} p-6 shadow-sm`}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{lot.name}</h3>
                    <p className="text-sm text-gray-600">{lot.varietal} • {lot.vintage}</p>
                    {days !== null && (
                      <div className="flex items-center gap-2 mt-2">
                        <Clock className={`w-4 h-4 ${urgencyTextColors[urgency]}`} />
                        <span className={`text-sm font-semibold ${urgencyTextColors[urgency]}`}>
                          {days === 0 ? 'Harvested today' : `${days} day${days > 1 ? 's' : ''} since harvest`}
                        </span>
                      </div>
                    )}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    lot.status === 'crushing'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-purple-100 text-purple-800'
                  }`}>
                    {lot.status === 'crushing' ? 'Processing' : 'Awaiting Crush'}
                  </span>
                </div>

                {/* Chemistry readings */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-4 bg-white/60 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-600">Weight</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {lot.initial_weight_lbs ? `${(lot.initial_weight_lbs / 2000).toFixed(2)} tons` : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Brix</p>
                    <p className="text-sm font-semibold text-gray-900">{lot.current_brix || '-'}°</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">pH</p>
                    <p className="text-sm font-semibold text-gray-900">{lot.current_ph || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">TA</p>
                    <p className="text-sm font-semibold text-gray-900">{lot.current_ta ? `${lot.current_ta} g/L` : '-'}</p>
                  </div>
                </div>

                {/* Recommended actions */}
                {lot.current_ph && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Calculator className="w-4 h-4 text-blue-600 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-semibold text-blue-900">Recommended SO₂: {calculateSO2(lot.current_ph)} ppm</p>
                        <p className="text-blue-700">Based on pH {lot.current_ph}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-2">
                  {lot.status === 'harvested' && (
                    <button
                      onClick={() => handleOpenCrushModal(lot)}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      <Beaker className="w-4 h-4" />
                      Record Crush
                    </button>
                  )}
                  {lot.status === 'crushing' && (
                    <button
                      onClick={() => handleStartFermentation(lot)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Play className="w-4 h-4" />
                      Start Fermentation
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Crush Record Modal */}
      {showCrushModal && selectedLot && createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-purple-600 px-6 py-4 flex items-center justify-between rounded-t-xl">
              <div>
                <h3 className="text-xl font-bold text-white">Record Crush</h3>
                <p className="text-purple-100 text-sm">{selectedLot.name}</p>
              </div>
              <button onClick={() => setShowCrushModal(false)} className="hover:bg-white/20 p-2 rounded-lg transition-colors">
                <X className="w-6 h-6 text-gray-900 stroke-2" />
              </button>
            </div>

            <form onSubmit={handleCrushSubmit} className="p-6 space-y-6">
              {/* Date/Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Crush Date & Time *</label>
                <input
                  type="datetime-local"
                  value={crushData.crush_date}
                  onChange={(e) => setCrushData({...crushData, crush_date: e.target.value})}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Weight */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Crushed Weight (lbs)</label>
                <input
                  type="number"
                  step="0.1"
                  value={crushData.crushed_weight_lbs}
                  onChange={(e) => setCrushData({...crushData, crushed_weight_lbs: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="May be less than harvest weight due to stem removal"
                />
              </div>

              {/* SO2 Addition */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FlaskConical className="w-5 h-5 text-purple-600" />
                  SO₂ Addition
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">PPM *</label>
                    <input
                      type="number"
                      value={crushData.so2_addition_ppm}
                      onChange={(e) => {
                        const ppm = e.target.value;
                        setCrushData({
                          ...crushData,
                          so2_addition_ppm: ppm,
                          so2_addition_grams: calculateSO2Grams(ppm, selectedLot.current_volume_gallons)
                        });
                      }}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="30-75"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Grams (calculated)</label>
                    <input
                      type="text"
                      value={crushData.so2_addition_grams}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    />
                  </div>
                </div>
              </div>

              {/* Yeast */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="font-semibold text-gray-900 mb-3">Yeast Inoculation</h4>
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Strain *</label>
                    <select
                      value={crushData.yeast_strain}
                      onChange={(e) => setCrushData({...crushData, yeast_strain: e.target.value})}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Select yeast...</option>
                      {Object.entries(YEAST_STRAINS).map(([key, strain]) => (
                        <option key={key} value={key}>{strain.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount (grams)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={crushData.yeast_grams}
                      onChange={(e) => setCrushData({...crushData, yeast_grams: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="Per manufacturer"
                    />
                  </div>
                </div>
                {crushData.yeast_strain && YEAST_STRAINS[crushData.yeast_strain] && (
                  <div className="text-sm bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <p className="text-purple-900"><strong>Temp Range:</strong> {YEAST_STRAINS[crushData.yeast_strain].temp}</p>
                    <p className="text-purple-900"><strong>Alcohol Tolerance:</strong> {YEAST_STRAINS[crushData.yeast_strain].alcohol}</p>
                    <p className="text-purple-700 mt-1">{YEAST_STRAINS[crushData.yeast_strain].notes}</p>
                  </div>
                )}
              </div>

              {/* Nutrients */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nutrient Type</label>
                  <select
                    value={crushData.nutrient_type}
                    onChange={(e) => setCrushData({...crushData, nutrient_type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">None</option>
                    <option value="Fermaid K">Fermaid K</option>
                    <option value="Fermaid O">Fermaid O</option>
                    <option value="DAP">DAP</option>
                    <option value="Go-Ferm">Go-Ferm</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (grams)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={crushData.nutrient_grams}
                    onChange={(e) => setCrushData({...crushData, nutrient_grams: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Adjustments */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="font-semibold text-gray-900 mb-3">Optional Adjustments</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Acid Addition (g)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={crushData.acid_addition_grams}
                      onChange={(e) => setCrushData({...crushData, acid_addition_grams: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="Tartaric acid"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sugar Addition (lbs)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={crushData.sugar_addition_lbs}
                      onChange={(e) => setCrushData({...crushData, sugar_addition_lbs: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="Chaptalization"
                    />
                  </div>
                </div>
              </div>

              {/* Cold Soak */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cold Soak Duration (hours)</label>
                <input
                  type="number"
                  value={crushData.cold_soak_hours}
                  onChange={(e) => setCrushData({...crushData, cold_soak_hours: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="Typically 48-96 hours for Pinot Noir"
                />
                <p className="text-xs text-gray-500 mt-1">Lot will remain in "crushing" status until fermentation starts</p>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Crush Notes</label>
                <textarea
                  value={crushData.crush_notes}
                  onChange={(e) => setCrushData({...crushData, crush_notes: e.target.value})}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="Stem inclusion, cluster sorting, maceration observations..."
                />
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
                >
                  {crushData.cold_soak_hours ? 'Record Crush & Start Cold Soak' : 'Record Crush & Start Fermentation'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCrushModal(false)}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
