import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, Info } from 'lucide-react';
import { getReadinessExplanation } from '@/shared/lib/lotReadiness';

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

export function ReadinessModal({ lot, onClose }) {
  const navigate = useNavigate();
  const explanation = getReadinessExplanation(lot);
  const [toast, setToast] = useState(null);

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

        {/* Expected-Missing Blockers (Amber) */}
        {expectedMissingBlockers.length > 0 && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm font-medium text-amber-800 mb-2">Missing Requirements:</p>
            <ul className="space-y-2">
              {expectedMissingBlockers.map((blocker, idx) => (
                <li key={idx} className="text-sm text-amber-700">
                  <div className="flex items-start justify-between gap-2">
                    <span>• {blocker.message}</span>
                    {blocker.action && (
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
          <div className="bg-blue-50 border border-blue-200 rounded-lg shadow-lg px-4 py-3 flex items-center gap-3 max-w-md">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <p className="text-sm text-blue-800 font-medium">{toast.message}</p>
          </div>
        </div>
      )}
    </>
  );
}
