import React, { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';

export function AgingProgress({ lot, onStatusChange }) {
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  // Calculate aging info
  const getAgingInfo = () => {
    if (!lot) return null;

    const agingStart = lot.press_date ? new Date(lot.press_date) :
                       lot.updated_at ? new Date(lot.updated_at) : null;

    if (!agingStart) return { monthsAging: 0, expectedMonths: 18, progress: 0 };

    const now = new Date();
    const monthsAging = Math.round((now - agingStart) / (1000 * 60 * 60 * 24 * 30.44));
    const expectedMonths = 18; // Default expected aging for red wines
    const progress = Math.min((monthsAging / expectedMonths) * 100, 100);

    return { monthsAging, expectedMonths, progress, agingStart };
  };

  const agingInfo = getAgingInfo();

  const statusOptions = [
    { value: 'fermenting', label: 'Fermenting' },
    { value: 'pressed', label: 'Pressed' },
    { value: 'aging', label: 'Aging' },
    { value: 'blending', label: 'Blending' },
    { value: 'filtering', label: 'Filtering' },
    { value: 'ready_to_bottle', label: 'Ready to Bottle' },
    { value: 'bottled', label: 'Bottled' }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'fermenting': return 'bg-amber-100 text-amber-700';
      case 'pressed': return 'bg-slate-100 text-slate-700';
      case 'aging': return 'bg-purple-100 text-purple-700';
      case 'blending': return 'bg-blue-100 text-blue-700';
      case 'filtering': return 'bg-cyan-100 text-cyan-700';
      case 'ready_to_bottle': return 'bg-green-100 text-green-700';
      case 'bottled': return 'bg-emerald-100 text-emerald-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (!lot) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
        Aging Progress
      </h3>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-600">
            {agingInfo.monthsAging} of {agingInfo.expectedMonths} months
          </span>
          <span className="font-semibold text-gray-900">
            {agingInfo.progress.toFixed(0)}%
          </span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${agingInfo.progress}%`,
              background: agingInfo.progress >= 100
                ? 'linear-gradient(to right, #22c55e, #16a34a)'
                : 'linear-gradient(to right, #7C203A, #9a2848)'
            }}
          />
        </div>
      </div>

      {/* Status & Press Date */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Status Dropdown */}
        <div className="flex items-center gap-2 flex-1">
          <span className="text-sm text-gray-600">Status:</span>
          <div className="relative">
            <button
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${getStatusColor(lot.status)}`}
            >
              <span className="capitalize">{lot.status?.replace(/_/g, ' ')}</span>
              <ChevronDown className="w-4 h-4" />
            </button>

            {showStatusDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowStatusDropdown(false)} />
                <div className="absolute left-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-xl z-50 py-1">
                  {statusOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setShowStatusDropdown(false);
                        if (option.value !== lot.status) {
                          onStatusChange(option.value);
                        }
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                        option.value === lot.status ? 'font-semibold bg-gray-50' : ''
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Press Date */}
        {lot.press_date && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>Press Date: {new Date(lot.press_date).toLocaleDateString()}</span>
          </div>
        )}
      </div>
    </div>
  );
}
