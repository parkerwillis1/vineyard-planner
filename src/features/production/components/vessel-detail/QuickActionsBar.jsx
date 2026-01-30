import React from 'react';
import { Activity, CheckCircle2, FileText } from 'lucide-react';

export function QuickActionsBar({
  lot,
  onAddReading,
  onMarkReady,
  onAddNote,
  showMarkReady = true
}) {
  // Only show "Mark Ready" for aging or blending lots
  const canMarkReady = lot && showMarkReady &&
    (lot.status === 'aging' || lot.status === 'blending');

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Primary Action - Add Reading */}
      <button
        onClick={onAddReading}
        className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 bg-[#7C203A] text-white rounded-xl hover:bg-[#5a1a2d] transition-colors font-semibold shadow-sm"
      >
        <Activity className="w-5 h-5" />
        <span>Add Chemistry Reading</span>
      </button>

      {/* Secondary Action - Mark Ready */}
      {canMarkReady && (
        <button
          onClick={onMarkReady}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 bg-white text-green-700 rounded-xl hover:bg-green-50 transition-colors font-medium border-2 border-green-200 shadow-sm"
        >
          <CheckCircle2 className="w-5 h-5" />
          <span>Mark Ready</span>
        </button>
      )}

      {/* Tertiary Action - Add Note */}
      <button
        onClick={onAddNote}
        className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium border border-gray-200 shadow-sm"
      >
        <FileText className="w-5 h-5" />
        <span>Add Note</span>
      </button>
    </div>
  );
}
