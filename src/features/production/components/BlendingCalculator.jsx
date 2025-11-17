import React, { useState, useEffect } from 'react';
import { Layers, Plus, Trash2, Calculator, AlertCircle, CheckCircle2 } from 'lucide-react';
import { listLots } from '@/shared/lib/productionApi';

export function BlendingCalculator() {
  const [lots, setLots] = useState([]);
  const [blendComponents, setBlendComponents] = useState([{ lot_id: '', percentage: '' }]);
  const [loading, setLoading] = useState(true);
  const [targetVolume, setTargetVolume] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data, error } = await listLots({ status: 'aging,pressed,blending' });
      if (error) throw error;
      setLots(data || []);
    } catch (err) {
      console.error('Error loading lots:', err);
    } finally {
      setLoading(false);
    }
  };

  const addComponent = () => {
    setBlendComponents([...blendComponents, { lot_id: '', percentage: '' }]);
  };

  const removeComponent = (index) => {
    setBlendComponents(blendComponents.filter((_, i) => i !== index));
  };

  const updateComponent = (index, field, value) => {
    const updated = [...blendComponents];
    updated[index][field] = value;
    setBlendComponents(updated);
  };

  const calculateBlend = () => {
    const totalPercentage = blendComponents.reduce((sum, c) => sum + (parseFloat(c.percentage) || 0), 0);
    const results = blendComponents.map(component => {
      const lot = lots.find(l => l.id === component.lot_id);
      const percentage = parseFloat(component.percentage) || 0;
      const volume = targetVolume ? (parseFloat(targetVolume) * percentage / 100) : 0;

      return {
        lot,
        percentage,
        volume,
        available: lot?.current_volume_gallons || 0
      };
    });

    return { results, totalPercentage };
  };

  const { results, totalPercentage } = calculateBlend();

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]"><div className="text-gray-500">Loading...</div></div>;
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="pt-4">
        <h2 className="text-2xl font-bold text-gray-900">Blending Calculator</h2>
        <p className="text-gray-600 mt-1">Create and calculate custom blends</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Target Blend Volume (gallons)</label>
          <input
            type="number"
            value={targetVolume}
            onChange={(e) => setTargetVolume(e.target.value)}
            placeholder="e.g., 300"
            className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
          />
        </div>

        <div className="space-y-3 mb-4">
          {blendComponents.map((component, index) => (
            <div key={index} className="flex items-center gap-3">
              <select
                value={component.lot_id}
                onChange={(e) => updateComponent(index, 'lot_id', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
              >
                <option value="">Select lot...</option>
                {lots.map(lot => (
                  <option key={lot.id} value={lot.id}>
                    {lot.name} - {lot.varietal} {lot.vintage} ({lot.current_volume_gallons} gal)
                  </option>
                ))}
              </select>
              <input
                type="number"
                step="0.1"
                value={component.percentage}
                onChange={(e) => updateComponent(index, 'percentage', e.target.value)}
                placeholder="%"
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
              />
              <button onClick={() => removeComponent(index)} className="p-2 text-red-600 hover:bg-red-50 rounded">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={addComponent}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Component
        </button>

        <div className={`mt-4 p-3 rounded-lg ${totalPercentage === 100 ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
          <p className="text-sm font-medium">Total: {totalPercentage.toFixed(1)}%</p>
        </div>
      </div>

      {results.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Blend Calculation</h3>
          <div className="space-y-3">
            {results.map((result, idx) => result.lot && (
              <div key={idx} className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{result.lot.name}</p>
                    <p className="text-sm text-gray-600">{result.lot.varietal} {result.lot.vintage}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{result.percentage}%</p>
                    {targetVolume && (
                      <p className="text-sm text-gray-600">{result.volume.toFixed(1)} gal needed</p>
                    )}
                    <p className={`text-xs ${result.volume > result.available ? 'text-red-600' : 'text-green-600'}`}>
                      {result.available.toFixed(0)} gal available
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
