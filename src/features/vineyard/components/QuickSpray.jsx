import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Zap, Plus, Minus } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { sortByName } from '@/shared/lib/sortUtils';

export function QuickSpray({
  blocks,
  chemicals,
  onSubmit,
  onCancel,
  stateCode = 'DEFAULT'
}) {
  const [selectedBlocks, setSelectedBlocks] = useState([]);
  const [tankMix, setTankMix] = useState([]);
  const [formData, setFormData] = useState({
    application_date: new Date().toISOString().split('T')[0],
    applicator_name: ''
  });

  const toggleBlock = (blockId) => {
    if (selectedBlocks.includes(blockId)) {
      setSelectedBlocks(selectedBlocks.filter(id => id !== blockId));
    } else {
      setSelectedBlocks([...selectedBlocks, blockId]);
    }
  };

  const addChemical = (chemicalId) => {
    const chemical = chemicals.find(c => c.id === chemicalId);
    if (!chemical) return;

    const totalAcres = blocks
      .filter(b => selectedBlocks.includes(b.id))
      .reduce((sum, b) => sum + parseFloat(b.acres || 0), 0);

    setTankMix([...tankMix, {
      item_id: chemical.id,
      chemical_name: chemical.name,
      rate_per_acre: 0,
      unit: chemical.unit,
      total_quantity: 0,
      epa_reg_no: chemical.epa_reg_no,
      phi_days: chemical.phi_days,
      rei_hours: chemical.rei_hours
    }]);
  };

  const removeChemical = (index) => {
    setTankMix(tankMix.filter((_, i) => i !== index));
  };

  const updateRate = (index, rate) => {
    const newMix = [...tankMix];
    const totalAcres = blocks
      .filter(b => selectedBlocks.includes(b.id))
      .reduce((sum, b) => sum + parseFloat(b.acres || 0), 0);

    newMix[index].rate_per_acre = parseFloat(rate) || 0;
    newMix[index].total_quantity = (parseFloat(rate) || 0) * totalAcres;
    setTankMix(newMix);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const totalAcres = blocks
      .filter(b => selectedBlocks.includes(b.id))
      .reduce((sum, b) => sum + parseFloat(b.acres || 0), 0);

    const sprayData = {
      application_date: formData.application_date,
      applicator_name: formData.applicator_name,
      treated_acres: totalAcres,
      spray_method: 'Airblast', // Default
      status: 'submitted',
      // Quick spray defaults
      buffer_zones_respected: true,
      inversion_risk: 'None'
    };

    const blocksData = selectedBlocks.map(blockId => {
      const block = blocks.find(b => b.id === blockId);
      return {
        block_id: blockId,
        acres_treated: parseFloat(block.acres || 0)
      };
    });

    const mixData = tankMix.map(tm => ({
      item_id: tm.item_id,
      rate_per_acre: tm.rate_per_acre,
      unit: tm.unit,
      total_quantity: tm.total_quantity,
      purpose: 'fungicide' // Default
    }));

    onSubmit(sprayData, blocksData, mixData);
  };

  const canSubmit =
    selectedBlocks.length > 0 &&
    tankMix.length > 0 &&
    tankMix.every(tm => tm.rate_per_acre > 0) &&
    formData.application_date &&
    formData.applicator_name;

  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <Zap className="w-6 h-6 text-white" />
            <div>
              <h2 className="text-xl font-bold text-white">Quick Spray</h2>
              <p className="text-sm text-green-100">Fast entry for routine applications</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors border border-white/20"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Date & Applicator */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.application_date}
                  onChange={(e) => setFormData({ ...formData, application_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Applicator <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.applicator_name}
                  onChange={(e) => setFormData({ ...formData, applicator_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Your name"
                />
              </div>
            </div>

            {/* Blocks */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Blocks ({selectedBlocks.length} selected)
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
                {sortByName(blocks).map(block => (
                  <label
                    key={block.id}
                    className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                      selectedBlocks.includes(block.id)
                        ? 'bg-green-100 border border-green-500'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedBlocks.includes(block.id)}
                      onChange={() => toggleBlock(block.id)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium">{block.name}</span>
                    <span className="text-xs text-gray-500 ml-auto">{block.acres} ac</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Tank Mix */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Tank Mix ({tankMix.length} products)
              </label>

              {tankMix.map((mix, index) => (
                <div key={index} className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-3">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-gray-900">{mix.chemical_name}</p>
                      <div className="flex gap-3 mt-1">
                        {mix.phi_days > 0 && (
                          <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                            PHI: {mix.phi_days}d
                          </span>
                        )}
                        {mix.rei_hours > 0 && (
                          <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                            REI: {mix.rei_hours}h
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeChemical(index)}
                      className="p-2 text-gray-400 hover:text-red-600 rounded"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Rate per Acre
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          step="0.01"
                          value={mix.rate_per_acre || ''}
                          onChange={(e) => updateRate(index, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                          placeholder="0.00"
                        />
                        <span className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-sm">
                          {mix.unit}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Total
                      </label>
                      <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-medium">
                        {mix.total_quantity.toFixed(2)} {mix.unit}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Add Chemical */}
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                value=""
                onChange={(e) => {
                  if (e.target.value) addChemical(e.target.value);
                }}
              >
                <option value="">+ Add Chemical</option>
                {chemicals
                  .filter(c => !tankMix.some(tm => tm.item_id === c.id))
                  .map(chemical => (
                    <option key={chemical.id} value={chemical.id}>
                      {chemical.name}
                    </option>
                  ))}
              </select>
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <Button
                type="submit"
                disabled={!canSubmit}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                Submit Quick Spray
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
              >
                Cancel
              </Button>
            </div>

            {/* Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                <strong>Quick Spray</strong> creates a basic record with minimal fields.
                Use the full wizard for detailed records or new chemicals.
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>,
    document.body
  );
}
