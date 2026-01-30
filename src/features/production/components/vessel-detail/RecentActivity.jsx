import React, { useState } from 'react';
import { Clock, Activity, Grape, Droplet, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

export function RecentActivity({ history = [], onViewAll }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const displayHistory = isExpanded ? history : history.slice(0, 3);

  const eventConfig = {
    lot_assigned: { icon: Grape, color: 'text-green-600', bg: 'bg-green-100', label: 'Lot Assigned' },
    lot_removed: { icon: Droplet, color: 'text-gray-600', bg: 'bg-gray-100', label: 'Lot Removed' },
    cip: { icon: Sparkles, color: 'text-emerald-600', bg: 'bg-emerald-100', label: 'CIP Completed' },
    maintenance: { icon: Clock, color: 'text-orange-600', bg: 'bg-orange-100', label: 'Maintenance' },
    volume_change: { icon: Droplet, color: 'text-[#7C203A]', bg: 'bg-[#7C203A]/10', label: 'Volume Changed' },
    fill: { icon: Droplet, color: 'text-[#7C203A]', bg: 'bg-[#7C203A]/10', label: 'Filled' },
    empty: { icon: Droplet, color: 'text-gray-400', bg: 'bg-gray-100', label: 'Emptied' },
    chemistry_reading: { icon: Activity, color: 'text-purple-600', bg: 'bg-purple-100', label: 'Chemistry Reading' },
    racked: { icon: Droplet, color: 'text-blue-600', bg: 'bg-blue-100', label: 'Racked' },
    topped_off: { icon: Droplet, color: 'text-cyan-600', bg: 'bg-cyan-100', label: 'Topped Off' }
  };

  const getEventConfig = (type) => {
    return eventConfig[type] || { icon: Activity, color: 'text-gray-600', bg: 'bg-gray-100', label: type };
  };

  if (history.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Recent Activity</h3>
        </div>
        <div className="text-center py-6">
          <Activity className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">No activity recorded yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Recent Activity</h3>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-xs text-[#7C203A] hover:underline font-medium"
          >
            View All
          </button>
        )}
      </div>

      {/* Activity List */}
      <div className="px-5 pb-3">
        <div className="space-y-3">
          {displayHistory.map((event, index) => {
            const config = getEventConfig(event.event_type);
            const EventIcon = config.icon;

            return (
              <div key={event.id || index} className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full ${config.bg} flex items-center justify-center flex-shrink-0`}>
                  <EventIcon className={`w-4 h-4 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-gray-900">
                      {config.label}
                    </p>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {new Date(event.event_date || event.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  {event.notes && (
                    <p className="text-xs text-gray-600 mt-0.5 truncate">{event.notes}</p>
                  )}
                  {event.volume_change !== null && event.volume_change !== 0 && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {event.volume_change > 0 ? '+' : ''}{event.volume_change.toFixed(1)} gal
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Expand/Collapse Button */}
      {history.length > 3 && (
        <div className="px-5 pb-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-center gap-1 py-2 text-xs text-gray-600 hover:text-gray-900 transition-colors"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Show {history.length - 3} More
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
