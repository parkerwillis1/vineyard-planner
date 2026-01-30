import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { X, CheckCircle2, AlertCircle, AlertTriangle, Beaker } from 'lucide-react';

export function StatusChangeModal({
  isOpen,
  onClose,
  lot,
  newStatus,
  onConfirm,
  isLoading = false,
  containerId = null
}) {
  const navigate = useNavigate();
  const [justification, setJustification] = useState('');

  if (!isOpen || !lot) return null;

  // Calculate aging info for context
  const getAgingInfo = () => {
    const agingStart = lot.press_date ? new Date(lot.press_date) :
                       lot.updated_at ? new Date(lot.updated_at) : null;

    if (!agingStart) return { monthsAging: 0, expectedMonths: 18, isEarly: false };

    const now = new Date();
    const monthsAging = Math.round((now - agingStart) / (1000 * 60 * 60 * 24 * 30.44));
    const expectedMonths = 18;
    const isEarly = monthsAging < expectedMonths;
    const monthsDiff = expectedMonths - monthsAging;

    return { monthsAging, expectedMonths, isEarly, monthsDiff };
  };

  // Check required chemistry data for bottling
  const getChemistryStatus = () => {
    const missing = [];
    const present = [];

    // ABV is required for labels
    if (lot.current_alcohol_pct) {
      present.push({ name: 'ABV', value: `${lot.current_alcohol_pct}%` });
    } else {
      missing.push('ABV (required for labels)');
    }

    // pH is important for stability
    if (lot.current_ph) {
      present.push({ name: 'pH', value: lot.current_ph.toFixed(2) });
    } else {
      missing.push('pH');
    }

    // TA is important for balance
    if (lot.current_ta) {
      present.push({ name: 'TA', value: `${lot.current_ta} g/L` });
    } else {
      missing.push('TA');
    }

    return { missing, present, isComplete: missing.length === 0 };
  };

  const agingInfo = getAgingInfo();
  const chemistryStatus = newStatus === 'ready_to_bottle' ? getChemistryStatus() : { missing: [], present: [], isComplete: true };
  const requiresJustification = newStatus === 'ready_to_bottle' && agingInfo.isEarly;
  const canProceed = chemistryStatus.isComplete;

  const handleSubmit = () => {
    if (requiresJustification && justification.trim().length < 20) return;
    onConfirm(justification);
    setJustification('');
  };

  const handleClose = () => {
    setJustification('');
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                newStatus === 'ready_to_bottle' ? 'bg-green-100' : 'bg-blue-100'
              }`}>
                <CheckCircle2 className={`w-5 h-5 ${
                  newStatus === 'ready_to_bottle' ? 'text-green-600' : 'text-blue-600'
                }`} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {newStatus === 'ready_to_bottle' ? 'Mark Ready for Bottling' : 'Change Status'}
                </h2>
                <p className="text-sm text-gray-500">{lot.name}</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Chemistry Requirements (for ready_to_bottle) */}
          {newStatus === 'ready_to_bottle' && !chemistryStatus.isComplete && (
            <div className="p-4 rounded-lg border-2 bg-red-50 border-red-200">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <span className="font-semibold text-red-800">Missing Required Chemistry Data</span>
              </div>
              <p className="text-sm text-red-700 mb-3">
                Complete wine analysis is required before marking as ready to bottle:
              </p>
              <ul className="space-y-1 mb-4">
                {chemistryStatus.missing.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-red-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    {item}
                  </li>
                ))}
              </ul>
              {chemistryStatus.present.length > 0 && (
                <div className="pt-3 border-t border-red-200">
                  <p className="text-xs text-gray-600 mb-2">Already recorded:</p>
                  <div className="flex flex-wrap gap-2">
                    {chemistryStatus.present.map((item, idx) => (
                      <span key={idx} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                        {item.name}: {item.value}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <button
                onClick={() => {
                  onClose();
                  navigate(`/production?view=lab&lot=${lot.id}`);
                }}
                className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#7C203A] text-white rounded-lg hover:bg-[#5a1a2d] transition-colors font-medium"
              >
                <Beaker className="w-4 h-4" />
                Add Wine Analysis
              </button>
            </div>
          )}

          {/* Chemistry Complete (for ready_to_bottle) */}
          {newStatus === 'ready_to_bottle' && chemistryStatus.isComplete && (
            <div className="p-4 rounded-lg border-2 bg-green-50 border-green-200">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-green-800">Chemistry Requirements Met</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {chemistryStatus.present.map((item, idx) => (
                  <span key={idx} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                    {item.name}: {item.value}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Aging Info (for ready_to_bottle) */}
          {newStatus === 'ready_to_bottle' && chemistryStatus.isComplete && (
            <div className={`p-4 rounded-lg border-2 ${
              agingInfo.isEarly ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Current Aging</span>
                <span className="text-lg font-bold text-gray-900">{agingInfo.monthsAging} months</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Expected Timeline</span>
                <span className="text-sm text-gray-600">{agingInfo.expectedMonths} months</span>
              </div>
              {agingInfo.isEarly ? (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-amber-200">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-medium text-amber-700">
                    {agingInfo.monthsDiff} months earlier than expected
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-green-200">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700">
                    On schedule or past expected timeline
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Status Change Info (for other statuses) */}
          {newStatus !== 'ready_to_bottle' && (
            <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
              <p className="text-sm text-gray-700">
                Change status from <span className="font-semibold capitalize">{lot.status?.replace(/_/g, ' ')}</span> to{' '}
                <span className="font-semibold capitalize">{newStatus?.replace(/_/g, ' ')}</span>
              </p>
            </div>
          )}

          {/* Justification (required for early bottling) */}
          {requiresJustification && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Justification <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Explain why this lot is ready for bottling before the expected timeline
              </p>
              <textarea
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="The wine has reached optimal flavor development with balanced tannins..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                rows={4}
              />
              {justification.trim().length > 0 && justification.trim().length < 20 && (
                <p className="text-xs text-amber-600 mt-1">
                  Please provide a detailed justification (at least 20 characters)
                </p>
              )}
            </div>
          )}

          {/* Optional notes for other status changes */}
          {!requiresJustification && newStatus !== 'ready_to_bottle' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (optional)
              </label>
              <textarea
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Any notes about this status change..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={2}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          {/* Only show confirm button if chemistry requirements are met */}
          {canProceed && (
            <button
              onClick={handleSubmit}
              disabled={isLoading || (requiresJustification && justification.trim().length < 20)}
              className={`flex-1 px-4 py-2.5 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                newStatus === 'ready_to_bottle'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Confirm
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
