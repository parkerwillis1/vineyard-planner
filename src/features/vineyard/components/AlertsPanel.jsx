import React, { useState } from 'react';

/**
 * AlertsPanel - Shows active device alerts with actions
 *
 * Displays alerts sorted by severity and time.
 * Allows acknowledging and resolving alerts.
 */
export default function AlertsPanel({ alerts, onAcknowledge, onResolve }) {
  const [expandedAlert, setExpandedAlert] = useState(null);
  const [resolveNotes, setResolveNotes] = useState('');

  // Alert type styling
  const getAlertStyle = (type, severity) => {
    const styles = {
      critical: {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-700',
        icon: '🚨'
      },
      warning: {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        text: 'text-orange-700',
        icon: '⚠️'
      },
      info: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-700',
        icon: 'ℹ️'
      }
    };
    return styles[severity] || styles.warning;
  };

  const getAlertTypeIcon = (type) => {
    const icons = {
      leak: '💧',
      no_flow: '🚫',
      battery_low: '🔋',
      offline: '📡',
      anomaly: '📊',
      flow_started: '▶️',
      flow_stopped: '⏹️'
    };
    return icons[type] || '⚠️';
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const handleResolve = async (alertId) => {
    await onResolve(alertId, resolveNotes);
    setExpandedAlert(null);
    setResolveNotes('');
  };

  if (alerts.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Alerts</h3>
        <div className="text-center py-6 text-gray-400">
          <div className="text-2xl mb-2">✓</div>
          <p>No active alerts</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Alerts</h3>
          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-700">
            {alerts.filter(a => !a.acknowledged_at).length} new
          </span>
        </div>
      </div>

      <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
        {alerts.map(alert => {
          const style = getAlertStyle(alert.alert_type, alert.severity);
          const isExpanded = expandedAlert === alert.id;

          return (
            <div key={alert.id} className={`${style.bg} ${alert.acknowledged_at ? 'opacity-60' : ''}`}>
              <div
                className="p-3 cursor-pointer"
                onClick={() => setExpandedAlert(isExpanded ? null : alert.id)}
              >
                <div className="flex items-start gap-3">
                  <span className="text-lg">{getAlertTypeIcon(alert.alert_type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${style.text} ${style.border} border`}>
                        {alert.severity}
                      </span>
                      <span className="text-xs text-gray-500">{formatTime(alert.created_at)}</span>
                    </div>
                    <p className={`text-sm font-medium ${style.text} mt-1`}>
                      {alert.message}
                    </p>
                    {alert.device && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        Device: {alert.device.device_name}
                      </p>
                    )}
                  </div>
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Expanded Actions */}
              {isExpanded && (
                <div className={`px-3 pb-3 ${style.bg}`}>
                  {/* Flow rate context */}
                  {alert.flow_rate_gpm !== null && (
                    <div className="text-xs text-gray-500 mb-2">
                      Flow rate: {alert.flow_rate_gpm?.toFixed(2)} GPM
                      {alert.expected_flow_rate_gpm && (
                        <span> (expected: {alert.expected_flow_rate_gpm?.toFixed(2)} GPM)</span>
                      )}
                    </div>
                  )}

                  {/* Resolution notes */}
                  <textarea
                    placeholder="Resolution notes (optional)..."
                    value={resolveNotes}
                    onChange={(e) => setResolveNotes(e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded px-2 py-1 mb-2 resize-none"
                    rows={2}
                  />

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {!alert.acknowledged_at && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAcknowledge(alert.id);
                        }}
                        className="px-3 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded hover:bg-gray-50"
                      >
                        Acknowledge
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleResolve(alert.id);
                      }}
                      className="px-3 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700"
                    >
                      Resolve
                    </button>
                  </div>

                  {/* Acknowledged info */}
                  {alert.acknowledged_at && (
                    <p className="text-xs text-gray-400 mt-2">
                      Acknowledged {formatTime(alert.acknowledged_at)}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
