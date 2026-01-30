import React, { useState, useEffect } from 'react';
import { Bug, X, RefreshCw, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import {
  getNDVICacheStatus,
  clearNDVICache,
  getEvalscriptHash
} from '@/shared/lib/sentinelHubApi';

/**
 * NDVI Debug Panel - Shows cache status and debugging info
 * Useful for diagnosing "why am I seeing old imagery" issues
 */
export function NDVIDebugPanel({ blockId, ndviData, onCacheCleared }) {
  const [isOpen, setIsOpen] = useState(false);
  const [cacheStatus, setCacheStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Load cache status when panel opens
  useEffect(() => {
    if (isOpen && blockId) {
      loadCacheStatus();
    }
  }, [isOpen, blockId]);

  const loadCacheStatus = async () => {
    if (!blockId) return;
    setLoading(true);
    try {
      const status = await getNDVICacheStatus(blockId);
      setCacheStatus(status);
    } catch (err) {
      console.error('Failed to load cache status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearCache = async () => {
    if (!blockId) return;
    setLoading(true);
    try {
      await clearNDVICache(blockId);
      await loadCacheStatus();
      if (onCacheCleared) onCacheCleared();
    } catch (err) {
      console.error('Failed to clear cache:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString();
  };

  const formatAge = (hours) => {
    if (hours === undefined || hours === null) return 'N/A';
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 24) return `${hours.toFixed(1)}h`;
    return `${(hours / 24).toFixed(1)}d`;
  };

  if (!blockId) return null;

  return (
    <div className="relative">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
        title="NDVI Debug Info"
      >
        <Bug className="w-4 h-4" />
      </button>

      {/* Debug Panel Popover */}
      {isOpen && (
        <div className="absolute right-0 top-8 z-50 w-96 bg-white border border-gray-200 rounded-lg shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-gray-50 rounded-t-lg">
            <span className="font-medium text-sm text-gray-700">NDVI Cache Debug</span>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-gray-200 rounded"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-3 space-y-3 max-h-96 overflow-y-auto text-sm">
            {/* Current NDVI Data */}
            {ndviData && (
              <div className="space-y-1">
                <div className="font-medium text-gray-700">Current Response</div>
                <div className="bg-gray-50 p-2 rounded text-xs font-mono space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Scene ID:</span>
                    <span className="text-gray-900 truncate max-w-48" title={ndviData.sceneId}>
                      {ndviData.sceneId?.slice(0, 30) || 'N/A'}...
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Acquisition:</span>
                    <span className="text-gray-900">{formatDate(ndviData.acquisitionDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Cloud Cover:</span>
                    <span className="text-gray-900">{ndviData.cloudCover?.toFixed(1) ?? 'N/A'}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Cache Hit:</span>
                    <span className={ndviData.cacheHit?.ndvi ? 'text-green-600' : 'text-amber-600'}>
                      Scene: {ndviData.cacheHit?.scene ? 'HIT' : 'MISS'} |
                      NDVI: {ndviData.cacheHit?.ndvi ? 'HIT' : 'MISS'}
                    </span>
                  </div>
                  {ndviData.cacheMeta && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Stale:</span>
                        <span className={ndviData.cacheMeta.stale ? 'text-amber-600' : 'text-green-600'}>
                          {ndviData.cacheMeta.stale ? 'Yes' : 'No'}
                          {ndviData.cacheMeta.refreshing && ' (refreshing...)'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">NDVI Age:</span>
                        <span className="text-gray-900">
                          {ndviData.cacheMeta.ndviAgeDays?.toFixed(1) ?? 'N/A'} days
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Cache Key Parts */}
            {ndviData?.cacheMeta?.keyParts && (
              <div className="space-y-1">
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="flex items-center gap-1 font-medium text-gray-700"
                >
                  {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  Cache Key Parts
                </button>
                {expanded && (
                  <div className="bg-blue-50 p-2 rounded text-xs font-mono space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-500">AOI Hash:</span>
                      <span className="text-gray-900">{ndviData.cacheMeta.keyParts.aoiHash}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Eval Hash:</span>
                      <span className="text-gray-900">{ndviData.cacheMeta.keyParts.evalHash}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Resolution:</span>
                      <span className="text-gray-900">{ndviData.cacheMeta.keyParts.resolution}px</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Cloud Thresh:</span>
                      <span className="text-gray-900">{ndviData.cacheMeta.keyParts.cloudThreshold}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Date Range:</span>
                      <span className="text-gray-900">
                        {ndviData.cacheMeta.keyParts.dateRange?.from} - {ndviData.cacheMeta.keyParts.dateRange?.to}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Data Source:</span>
                      <span className="text-gray-900">{ndviData.cacheMeta.keyParts.dataCollection || 'sentinel-2-l2a'}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Cache Status from DB */}
            {cacheStatus && (
              <div className="space-y-1">
                <div className="font-medium text-gray-700">Database Cache</div>
                <div className="bg-gray-50 p-2 rounded text-xs space-y-2">
                  {/* Scene Cache */}
                  <div>
                    <div className="text-gray-500 mb-1">Scene Cache ({cacheStatus.scenes?.length || 0} entries)</div>
                    {cacheStatus.scenes?.slice(0, 2).map((s, i) => (
                      <div key={i} className="font-mono text-gray-700 truncate">
                        {s.scene_id?.slice(0, 25)}... ({formatAge(s.ageHours)} old)
                      </div>
                    ))}
                  </div>

                  {/* Result Cache */}
                  <div>
                    <div className="text-gray-500 mb-1">Result Cache ({cacheStatus.results?.length || 0} entries)</div>
                    {cacheStatus.results?.slice(0, 2).map((r, i) => (
                      <div key={i} className="font-mono text-gray-700 flex justify-between">
                        <span className={r.stale ? 'text-amber-600' : 'text-green-600'}>
                          {r.stale ? 'STALE' : 'FRESH'}
                        </span>
                        <span>{r.ageDays?.toFixed(1)}d old</span>
                        <span>{r.resolution}px</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Current Evalscript Hash */}
            <div className="text-xs text-gray-500">
              Current Evalscript: <span className="font-mono">{getEvalscriptHash()}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 p-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
            <button
              onClick={loadCacheStatus}
              disabled={loading}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={handleClearCache}
              disabled={loading}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-50 text-red-700 border border-red-200 rounded hover:bg-red-100 disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear Cache
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default NDVIDebugPanel;
