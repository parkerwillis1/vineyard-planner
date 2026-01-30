import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, Info, CheckCircle2, Loader2, AlertCircle, X } from 'lucide-react';
import { getReadinessExplanation } from '@/shared/lib/lotReadiness';
import { updateLot } from '@/shared/lib/productionApi';

// Routes that are implemented (safe to navigate to)
const IMPLEMENTED_ROUTES = [
  '/production',
  '/production/vessel/:id',
  '/production?view=lab' // Wine Analysis page
];

// Check if a route pattern is implemented
function isRouteImplemented(path) {
  // Check for Wine Analysis deep link
  if (path.includes('/production?view=lab&lot=')) {
    return true;
  }

  // Extract base path without lot ID
  const basePath = path.replace(/\/lots\/\d+/, '/lots/:id');

  // Check if route matches any implemented pattern
  return IMPLEMENTED_ROUTES.some(route => {
    if (route === basePath) return true;
    // Check if it's a nested route under an implemented base
    if (basePath.startsWith('/production') && route === '/production') {
      // Only /production root is implemented, not /production/lots/*
      return false;
    }
    return false;
  });
}

// Calculate aging info for a lot
function getAgingInfo(lot) {
  const agingStart = lot.press_date ? new Date(lot.press_date) :
                     lot.updated_at ? new Date(lot.updated_at) : null;

  if (!agingStart) return { monthsAging: 0, expectedMonths: 18, isEarly: false };

  const now = new Date();
  const monthsAging = Math.round((now - agingStart) / (1000 * 60 * 60 * 24 * 30.44));
  const expectedMonths = 18;
  const isEarly = monthsAging < expectedMonths;
  const monthsDiff = expectedMonths - monthsAging;

  return { monthsAging, expectedMonths, isEarly, monthsDiff };
}

export function ReadinessModal({ lot, onClose, onRefresh }) {
  const navigate = useNavigate();
  const explanation = getReadinessExplanation(lot);
  const [toast, setToast] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [showJustificationForm, setShowJustificationForm] = useState(false);
  const [justification, setJustification] = useState('');

  // Check if the lot needs status change to ready_to_bottle
  const needsStatusChange = lot.status === 'aging' || lot.status === 'blending';
  const agingInfo = getAgingInfo(lot);

  const handleMarkReadyToBottle = async () => {
    if (justification.trim().length < 20) return;

    setUpdating(true);
    try {
      const justificationNote = `[READY FOR BOTTLING - ${new Date().toLocaleDateString()}]\n` +
        `Aged: ${agingInfo.monthsAging} months (expected: ${agingInfo.expectedMonths} months)\n` +
        `Justification: ${justification.trim()}`;

      const existingNotes = lot.notes || '';
      const newNotes = existingNotes ? `${existingNotes}\n\n${justificationNote}` : justificationNote;

      const { error } = await updateLot(lot.id, {
        status: 'ready_to_bottle',
        notes: newNotes
      });
      if (error) throw error;

      setToast({
        message: 'Status updated to "ready_to_bottle"',
        type: 'success'
      });

      // Refresh the lot list after a brief delay
      setTimeout(() => {
        if (onRefresh) onRefresh();
        onClose();
      }, 1000);
    } catch (err) {
      setToast({
        message: `Failed to update status: ${err.message}`,
        type: 'error'
      });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setUpdating(false);
    }
  };

  const handleAction = (action) => {
    if (action.type === 'navigate') {
      // Check if route is implemented
      if (!isRouteImplemented(action.path)) {
        // Show toast for unimplemented routes
        setToast({
          message: "This page isn't available yet—coming soon.",
          type: 'info'
        });

        // Auto-hide toast after 3 seconds
        setTimeout(() => setToast(null), 3000);
        return;
      }

      navigate(action.path);
      onClose();
    }
  };

  // Categorize blockers: abnormal (red) vs expected-missing (amber)
  const abnormalBlockers = explanation.blockers.filter(b =>
    b.type === 'volume' || b.type === 'status_production' || b.type === 'name'
  );
  const expectedMissingBlockers = explanation.blockers.filter(b =>
    b.type === 'abv' || b.type === 'lab' || b.type === 'status_nearly_ready'
  );
  const hasAbnormalBlocker = abnormalBlockers.length > 0;

  return (
    <>
      {/* Backdrop to close popover */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />

      {/* Popover Content */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-xl shadow-2xl border border-gray-200 p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-bold text-lg text-gray-900">Readiness Score</h3>
            <p className="text-sm text-gray-500">{lot.name}</p>
          </div>
          <div className={`flex items-center justify-center w-12 h-12 rounded-full text-white text-xl font-bold ${
            explanation.score >= 70 ? 'bg-green-500' :
            explanation.score >= 50 ? 'bg-yellow-500' :
            'bg-red-500'
          }`}>
            {explanation.score}
          </div>
        </div>

        {/* Breakdown */}
        <div className="space-y-2 mb-4">
          <p className="text-sm font-medium text-gray-700">Score Breakdown:</p>
          {explanation.breakdown.map((item, idx) => (
            <div key={idx} className="text-sm text-gray-600 flex items-start gap-2">
              <span className="flex-shrink-0">{item.startsWith('✓') ? '✓' : item.startsWith('✗') ? '✗' : '○'}</span>
              <span>{item.substring(2)}</span>
            </div>
          ))}
        </div>

        {/* Abnormal Blockers (Red) */}
        {abnormalBlockers.length > 0 && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm font-medium text-red-800 mb-2">Critical Issues:</p>
            <ul className="space-y-2">
              {abnormalBlockers.map((blocker, idx) => (
                <li key={idx} className="text-sm text-red-700">
                  <div className="flex items-start justify-between gap-2">
                    <span>• {blocker.message}</span>
                    {blocker.action && (
                      <button
                        onClick={() => handleAction(blocker.action)}
                        className="flex-shrink-0 flex items-center gap-1 px-2 py-0.5 bg-red-100 hover:bg-red-200 text-red-800 rounded text-xs font-medium transition-colors"
                        title={blocker.action.label}
                      >
                        {blocker.action.label}
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Justification Form */}
        {showJustificationForm && (
          <div className="mb-4 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-green-800">Mark Ready for Bottling</h4>
              <button
                onClick={() => { setShowJustificationForm(false); setJustification(''); }}
                className="p-1 hover:bg-green-100 rounded"
              >
                <X className="w-4 h-4 text-green-700" />
              </button>
            </div>

            {/* Aging Info */}
            <div className={`p-3 rounded-lg mb-3 ${agingInfo.isEarly ? 'bg-amber-100' : 'bg-green-100'}`}>
              <div className="flex items-center justify-between text-sm">
                <span>Aged: <strong>{agingInfo.monthsAging} months</strong></span>
                <span className="text-gray-600">Expected: {agingInfo.expectedMonths} mo</span>
              </div>
              {agingInfo.isEarly && (
                <div className="flex items-center gap-1 mt-2 text-xs text-amber-700">
                  <AlertCircle className="w-3 h-3" />
                  {agingInfo.monthsDiff} months early
                </div>
              )}
            </div>

            <textarea
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Why is this lot ready? (e.g., optimal flavor, stable chemistry, customer deadline)"
              className="w-full px-3 py-2 border border-green-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none mb-2"
              rows={3}
            />
            {justification.trim().length < 20 && (
              <p className="text-xs text-amber-600 mb-2">Minimum 20 characters required</p>
            )}
            <button
              onClick={handleMarkReadyToBottle}
              disabled={updating || justification.trim().length < 20}
              className="w-full px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {updating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Confirm Ready for Bottling
                </>
              )}
            </button>
          </div>
        )}

        {/* Expected-Missing Blockers (Amber) */}
        {expectedMissingBlockers.length > 0 && !showJustificationForm && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm font-medium text-amber-800 mb-2">Missing Requirements:</p>
            <ul className="space-y-2">
              {expectedMissingBlockers.map((blocker, idx) => (
                <li key={idx} className="text-sm text-amber-700">
                  <div className="flex items-start justify-between gap-2">
                    <span>• {blocker.message}</span>
                    {blocker.type === 'status_nearly_ready' ? (
                      <button
                        onClick={() => setShowJustificationForm(true)}
                        className="flex-shrink-0 flex items-center gap-1 px-2 py-0.5 bg-green-100 hover:bg-green-200 text-green-800 rounded text-xs font-medium transition-colors"
                        title="Mark as ready to bottle"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        Mark Ready
                      </button>
                    ) : blocker.action && (
                      <button
                        onClick={() => handleAction(blocker.action)}
                        className="flex-shrink-0 flex items-center gap-1 px-2 py-0.5 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded text-xs font-medium transition-colors"
                        title={blocker.action.label}
                      >
                        {blocker.action.label}
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Status */}
        <div className="pt-3 border-t border-gray-100">
          {explanation.eligible ? (
            <p className="text-sm text-green-700 font-medium">✓ Ready for bottling</p>
          ) : explanation.nearlyReady ? (
            <p className="text-sm text-amber-700 font-medium">○ Nearly ready - Update status to "ready_to_bottle"</p>
          ) : (
            <p className="text-sm text-red-700 font-medium">✗ Not ready for bottling</p>
          )}
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full px-4 py-2 bg-[#7C203A] text-white rounded-lg hover:bg-[#5a1829] transition-colors"
        >
          Close
        </button>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] animate-slide-up">
          <div className={`rounded-lg shadow-lg px-4 py-3 flex items-center gap-3 max-w-md ${
            toast.type === 'success' ? 'bg-green-50 border border-green-200' :
            toast.type === 'error' ? 'bg-red-50 border border-red-200' :
            'bg-blue-50 border border-blue-200'
          }`}>
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
            ) : (
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
            )}
            <p className={`text-sm font-medium ${
              toast.type === 'success' ? 'text-green-800' :
              toast.type === 'error' ? 'text-red-800' :
              'text-blue-800'
            }`}>{toast.message}</p>
          </div>
        </div>
      )}
    </>
  );
}
