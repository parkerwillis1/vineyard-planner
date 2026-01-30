import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Activity } from 'lucide-react';

export function QuickReadingModal({
  isOpen,
  onClose,
  lot,
  onSave,
  isLoading = false
}) {
  const [formData, setFormData] = useState({
    brix: '',
    ph: '',
    temp: '',
    ta: '',
    alcohol: '',
    notes: ''
  });

  if (!isOpen || !lot) return null;

  const handleSubmit = () => {
    const updates = {};
    if (formData.brix) updates.current_brix = parseFloat(formData.brix);
    if (formData.ph) updates.current_ph = parseFloat(formData.ph);
    if (formData.temp) updates.current_temp_f = parseFloat(formData.temp);
    if (formData.ta) updates.current_ta = parseFloat(formData.ta);
    if (formData.alcohol) updates.current_alcohol_pct = parseFloat(formData.alcohol);
    if (formData.notes) updates.notes = formData.notes;

    if (Object.keys(updates).length > 0) {
      onSave(updates);
    }

    setFormData({ brix: '', ph: '', temp: '', ta: '', alcohol: '', notes: '' });
  };

  const handleClose = () => {
    setFormData({ brix: '', ph: '', temp: '', ta: '', alcohol: '', notes: '' });
    onClose();
  };

  const hasValues = formData.brix || formData.ph || formData.temp || formData.ta || formData.alcohol;

  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#7C203A] to-[#5a1a2d] px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Add Chemistry Reading</h2>
                <p className="text-white/70 text-sm">{lot.varietal} - {lot.vintage}</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600">
            Enter new readings. Only fill in the values you want to update.
          </p>

          {/* Reading Inputs Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Brix */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Brix (°)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.brix}
                onChange={(e) => setFormData({ ...formData, brix: e.target.value })}
                placeholder={lot.current_brix?.toString() || '0.0'}
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#7C203A]/20 focus:border-[#7C203A] transition-colors text-lg font-semibold"
              />
            </div>

            {/* pH */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                pH
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.ph}
                onChange={(e) => setFormData({ ...formData, ph: e.target.value })}
                placeholder={lot.current_ph?.toString() || '0.00'}
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#7C203A]/20 focus:border-[#7C203A] transition-colors text-lg font-semibold"
              />
            </div>

            {/* Temperature */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Temp (°F)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.temp}
                onChange={(e) => setFormData({ ...formData, temp: e.target.value })}
                placeholder={lot.current_temp_f?.toString() || '0.0'}
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#7C203A]/20 focus:border-[#7C203A] transition-colors text-lg font-semibold"
              />
            </div>

            {/* TA */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                TA (g/L)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.ta}
                onChange={(e) => setFormData({ ...formData, ta: e.target.value })}
                placeholder={lot.current_ta?.toString() || '0.0'}
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#7C203A]/20 focus:border-[#7C203A] transition-colors text-lg font-semibold"
              />
            </div>

            {/* Alcohol - Full Width */}
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Alcohol (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.alcohol}
                onChange={(e) => setFormData({ ...formData, alcohol: e.target.value })}
                placeholder={lot.current_alcohol_pct?.toString() || '0.0'}
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#7C203A]/20 focus:border-[#7C203A] transition-colors text-lg font-semibold"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Notes (optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any observations..."
              rows={2}
              className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#7C203A]/20 focus:border-[#7C203A] transition-colors resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || !hasValues}
            className="flex-1 px-4 py-2.5 bg-[#7C203A] text-white rounded-lg hover:bg-[#5a1a2d] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              'Save Reading'
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
