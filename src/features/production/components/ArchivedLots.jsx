import React, { useState, useEffect } from 'react';
import { Archive, Filter, Calendar, Wine } from 'lucide-react';
import { supabase } from '@/shared/lib/supabaseClient';

export function ArchivedLots() {
  const [archivedLots, setArchivedLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterVintage, setFilterVintage] = useState('all');
  const [filterVarietal, setFilterVarietal] = useState('all');

  useEffect(() => {
    loadArchived();
  }, []);

  const loadArchived = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('production_lots')
        .select('*')
        .eq('user_id', user.id)
        .not('archived_at', 'is', null)
        .order('archived_at', { ascending: false });

      if (error) throw error;
      setArchivedLots(data || []);
    } catch (err) {
      console.error('Error loading archived lots:', err);
    } finally {
      setLoading(false);
    }
  };

  const vintages = [...new Set(archivedLots.map(l => l.vintage))].sort((a, b) => b - a);
  const varietals = [...new Set(archivedLots.map(l => l.varietal))].sort();

  const filteredLots = archivedLots.filter(lot => {
    const vintageMatch = filterVintage === 'all' || lot.vintage === parseInt(filterVintage);
    const varietalMatch = filterVarietal === 'all' || lot.varietal === filterVarietal;
    return vintageMatch && varietalMatch;
  });

  const vintageStats = vintages.map(vintage => ({
    vintage,
    lots: archivedLots.filter(l => l.vintage === vintage).length,
    volume: archivedLots.filter(l => l.vintage === vintage).reduce((sum, l) => sum + (l.current_volume_gallons || 0), 0)
  }));

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]"><div className="text-gray-500">Loading...</div></div>;
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="pt-4">
        <h2 className="text-2xl font-bold text-gray-900">Archived Lots</h2>
        <p className="text-gray-600 mt-1">Historical records and vintage summaries</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Filter className="w-5 h-5 text-gray-500" />
        <select
          value={filterVintage}
          onChange={(e) => setFilterVintage(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="all">All Vintages</option>
          {vintages.map(v => <option key={v} value={v}>{v}</option>)}
        </select>
        <select
          value={filterVarietal}
          onChange={(e) => setFilterVarietal(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="all">All Varietals</option>
          {varietals.map(v => <option key={v} value={v}>{v}</option>)}
        </select>
      </div>

      {/* Vintage Snapshots */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {vintageStats.map(stat => (
          <div key={stat.vintage} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-6 h-6 text-[#7C203A]" />
              <span className="text-2xl font-bold text-gray-900">{stat.vintage}</span>
            </div>
            <p className="text-sm text-gray-600">{stat.lots} lots • {stat.volume.toFixed(0)} gal</p>
          </div>
        ))}
      </div>

      {/* Archived Lots List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Archived Lots ({filteredLots.length})</h3>
        {filteredLots.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No archived lots found</p>
        ) : (
          <div className="space-y-2">
            {filteredLots.map(lot => (
              <div key={lot.id} className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{lot.name}</p>
                    <p className="text-sm text-gray-600">{lot.varietal} • {lot.vintage}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Archived: {new Date(lot.archived_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-sm">
                    {lot.current_volume_gallons?.toFixed(0) || 0} gal
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
