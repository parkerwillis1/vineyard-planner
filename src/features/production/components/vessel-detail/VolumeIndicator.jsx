import React, { useState } from 'react';
import { Droplet } from 'lucide-react';

export function VolumeIndicator({
  currentVolume,
  capacity,
  onVolumeChange,
  onSave,
  isSaving = false
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(currentVolume);

  const fillPercentage = capacity ? Math.min((currentVolume / capacity) * 100, 100) : 0;

  const handleSave = async () => {
    await onSave(editValue);
    setIsEditing(false);
  };

  const getProgressColor = () => {
    if (fillPercentage > 90) return 'linear-gradient(to right, #7C203A, #9a2848)';
    if (fillPercentage > 50) return 'linear-gradient(to right, #22c55e, #16a34a)';
    if (fillPercentage > 25) return 'linear-gradient(to right, #eab308, #ca8a04)';
    return 'linear-gradient(to right, #ef4444, #dc2626)';
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Current Volume</h3>
        {!isEditing && (
          <button
            onClick={() => {
              setEditValue(currentVolume);
              setIsEditing(true);
            }}
            className="text-xs text-[#7C203A] hover:underline font-medium"
          >
            Adjust Volume
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${fillPercentage}%`,
              background: getProgressColor()
            }}
          />
        </div>
      </div>

      {/* Volume Display / Edit */}
      {isEditing ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              max={capacity}
              step="0.1"
              value={editValue}
              onChange={(e) => setEditValue(parseFloat(e.target.value) || 0)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-lg font-semibold focus:ring-2 focus:ring-[#7C203A]/20 focus:border-[#7C203A]"
            />
            <span className="text-gray-500">/ {capacity} gal</span>
          </div>

          <input
            type="range"
            min="0"
            max={capacity}
            step="0.1"
            value={editValue}
            onChange={(e) => setEditValue(parseFloat(e.target.value) || 0)}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            style={{ accentColor: '#7C203A' }}
          />

          <div className="flex gap-2">
            <button
              onClick={() => setEditValue(0)}
              className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
            >
              Empty
            </button>
            <button
              onClick={() => setEditValue(capacity)}
              className="px-3 py-1.5 bg-[#7C203A]/10 text-[#7C203A] rounded-lg hover:bg-[#7C203A]/20 transition-colors text-sm font-medium"
            >
              Full
            </button>
            <div className="flex-1" />
            <button
              onClick={() => setIsEditing(false)}
              className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-1.5 bg-[#7C203A] text-white rounded-lg hover:bg-[#5a1a2d] transition-colors text-sm font-medium disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Droplet className="w-5 h-5 text-[#7C203A]" />
            <span className="text-2xl font-bold text-gray-900">
              {currentVolume?.toFixed(1) || 0}
            </span>
            <span className="text-gray-500">/ {capacity} gal</span>
          </div>
          <span className="text-lg font-semibold text-gray-600">
            {fillPercentage.toFixed(0)}%
          </span>
        </div>
      )}
    </div>
  );
}
