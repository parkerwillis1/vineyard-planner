import React, { useState, useEffect } from 'react';
import { Archive, Search, Calendar, Package, FileText, Eye, ChevronRight } from 'lucide-react';
import { listLots, listFermentationLogs, listArchivedFermentationLogs } from '@/shared/lib/productionApi';

export function ArchivesPage() {
  const [activeTab, setActiveTab] = useState('lots');
  const [archivedLots, setArchivedLots] = useState([]);
  const [allLogs, setAllLogs] = useState([]);
  const [selectedLot, setSelectedLot] = useState(null);
  const [lotLogs, setLotLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterVintage, setFilterVintage] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load archived lots
      const { data: lotsData, error: lotsError } = await listLots({ status: 'archived' });
      if (lotsError) throw lotsError;
      setArchivedLots(lotsData || []);

      // Load archived fermentation logs (from both archived and active lots)
      const { data: archivedLogsData, error: logsError } = await listArchivedFermentationLogs();
      if (logsError) throw logsError;
      setAllLogs(archivedLogsData || []);
    } catch (err) {
      console.error('Error loading archives:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadLogsForLot = async (lot) => {
    setSelectedLot(lot);
    const logs = allLogs.filter(log => log.lot_id === lot.id);
    setLotLogs(logs);
  };

  // Get unique vintages for filter (from both archived lots and logs)
  const logsVintages = allLogs.map(log => log.lot?.vintage).filter(Boolean);
  const allVintages = [...new Set([...archivedLots.map(lot => lot.vintage), ...logsVintages])];
  const vintages = ['all', ...allVintages].sort((a, b) => {
    if (a === 'all') return -1;
    if (b === 'all') return 1;
    return b - a;
  });

  // Filter lots
  const filteredLots = archivedLots.filter(lot => {
    const matchesSearch = lot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lot.varietal.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesVintage = filterVintage === 'all' || lot.vintage === parseInt(filterVintage);
    return matchesSearch && matchesVintage;
  });

  // Filter logs
  const filteredLogs = allLogs.filter(log => {
    // Log comes with lot data from the query
    if (!log.lot) return false;
    const matchesSearch = log.lot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.lot.varietal.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesVintage = filterVintage === 'all' || log.lot.vintage === parseInt(filterVintage);
    return matchesSearch && matchesVintage;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-[#7C203A] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading archives...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="pt-4">
        <h2 className="text-2xl font-bold text-gray-900">Archives</h2>
        <p className="text-gray-600 mt-1">View archived lots and historical fermentation data</p>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('lots')}
              className={`flex items-center gap-2 px-6 py-4 font-medium border-b-2 transition-colors ${
                activeTab === 'lots'
                  ? 'border-[#7C203A] text-[#7C203A]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Package className="w-5 h-5" />
              Archived Lots
              <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold">
                {archivedLots.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`flex items-center gap-2 px-6 py-4 font-medium border-b-2 transition-colors ${
                activeTab === 'logs'
                  ? 'border-[#7C203A] text-[#7C203A]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FileText className="w-5 h-5" />
              All Logs
              <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold">
                {allLogs.length}
              </span>
            </button>
          </nav>
        </div>

        {/* Search and Filters */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by lot name or varietal..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
              />
            </div>
            <div className="w-full md:w-48">
              <select
                value={filterVintage}
                onChange={(e) => setFilterVintage(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
              >
                {vintages.map(vintage => (
                  <option key={vintage} value={vintage}>
                    {vintage === 'all' ? 'All Vintages' : vintage}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'lots' ? (
            <ArchivedLotsView
              lots={filteredLots}
              onSelectLot={loadLogsForLot}
              selectedLot={selectedLot}
              lotLogs={lotLogs}
            />
          ) : (
            <AllLogsView
              logs={filteredLogs}
              lots={archivedLots}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Archived Lots View Component
function ArchivedLotsView({ lots, onSelectLot, selectedLot, lotLogs }) {
  if (lots.length === 0) {
    return (
      <div className="text-center py-12">
        <Archive className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 font-medium">No archived lots found</p>
        <p className="text-sm text-gray-500 mt-1">Archived lots will appear here</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Lots List */}
      <div className="lg:col-span-1 space-y-3 max-h-[600px] overflow-y-auto">
        {lots.map(lot => (
          <button
            key={lot.id}
            onClick={() => onSelectLot(lot)}
            className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
              selectedLot?.id === lot.id
                ? 'border-[#7C203A] bg-rose-50'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <div className="font-semibold text-gray-900">{lot.name}</div>
            <div className="text-sm text-gray-600">{lot.varietal} • {lot.vintage}</div>
            <div className="text-xs text-gray-500 mt-1">
              {lot.current_volume_gallons} gal
            </div>
            {lot.archived_at && (
              <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Archived {new Date(lot.archived_at).toLocaleDateString()}
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Lot Details */}
      <div className="lg:col-span-2">
        {!selectedLot ? (
          <div className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
            <Eye className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Select a lot to view details</p>
            <p className="text-sm text-gray-500 mt-1">Choose a lot from the list to see fermentation history</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Lot Summary */}
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">{selectedLot.name}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Varietal</div>
                  <div className="font-semibold text-gray-900">{selectedLot.varietal}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Vintage</div>
                  <div className="font-semibold text-gray-900">{selectedLot.vintage}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Volume</div>
                  <div className="font-semibold text-gray-900">{selectedLot.current_volume_gallons} gal</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Final Brix</div>
                  <div className="font-semibold text-gray-900">
                    {selectedLot.current_brix !== null ? `${selectedLot.current_brix}°` : '—'}
                  </div>
                </div>
              </div>
            </div>

            {/* Logs */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h4 className="font-semibold text-gray-900 mb-3">
                Fermentation Logs ({lotLogs.length})
              </h4>
              {lotLogs.length === 0 ? (
                <p className="text-gray-500 text-center py-6">No logs found</p>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {lotLogs.map(log => (
                    <LogCard key={log.id} log={log} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// All Logs View Component
function AllLogsView({ logs, lots }) {
  if (logs.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 font-medium">No fermentation logs found</p>
        <p className="text-sm text-gray-500 mt-1">Logs from archived lots will appear here</p>
      </div>
    );
  }

  // Group logs by lot
  const logsByLot = logs.reduce((acc, log) => {
    const lotId = log.lot_id;
    if (!acc[lotId]) acc[lotId] = [];
    acc[lotId].push(log);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.entries(logsByLot).map(([lotId, lotLogs]) => {
        // Get lot info from the first log (all logs in this group have the same lot)
        const lot = lotLogs[0]?.lot;
        if (!lot) return null;

        return (
          <div key={lotId} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
              <div>
                <h4 className="font-semibold text-gray-900">{lot.name}</h4>
                <p className="text-sm text-gray-600">{lot.varietal} • {lot.vintage}</p>
              </div>
              <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
                {lotLogs.length} logs
              </span>
            </div>
            <div className="space-y-3">
              {lotLogs.slice(0, 5).map(log => (
                <LogCard key={log.id} log={log} compact />
              ))}
              {lotLogs.length > 5 && (
                <div className="text-center pt-2">
                  <span className="text-sm text-gray-500">
                    +{lotLogs.length - 5} more logs
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Log Card Component
function LogCard({ log, compact = false }) {
  return (
    <div className={`rounded-lg border border-gray-200 p-3 hover:bg-gray-50 transition-colors ${compact ? 'bg-white' : 'bg-gray-50'}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="font-medium text-gray-900 text-sm">
          {new Date(log.log_date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
        {log.brix !== null && (
          <div>
            <span className="text-gray-600">Brix:</span>
            <span className="ml-1 font-medium text-gray-900">{log.brix}°</span>
          </div>
        )}
        {log.temp_f !== null && (
          <div>
            <span className="text-gray-600">Temp:</span>
            <span className="ml-1 font-medium text-gray-900">{log.temp_f}°F</span>
          </div>
        )}
        {log.ph !== null && (
          <div>
            <span className="text-gray-600">pH:</span>
            <span className="ml-1 font-medium text-gray-900">{log.ph}</span>
          </div>
        )}
        {log.ta !== null && (
          <div>
            <span className="text-gray-600">TA:</span>
            <span className="ml-1 font-medium text-gray-900">{log.ta}</span>
          </div>
        )}
      </div>

      {log.work_performed && log.work_performed.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {log.work_performed.map((work, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs"
            >
              {work.replace('_', ' ')}
            </span>
          ))}
        </div>
      )}

      {log.notes && !compact && (
        <div className="mt-2 text-xs text-gray-600 italic">
          {log.notes}
        </div>
      )}
    </div>
  );
}
