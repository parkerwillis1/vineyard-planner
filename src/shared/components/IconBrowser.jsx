// src/shared/components/IconBrowser.jsx
// Demo component to search and browse Noun Project icons
import React, { useState } from 'react';
import { searchIcons } from '@/shared/lib/nounProjectApi';
import { NounProjectIcon } from '@/shared/components/ui/NounProjectIcon';
import { Input } from '@/shared/components/ui/input';

export function IconBrowser() {
  const [query, setQuery] = useState('');
  const [icons, setIcons] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    const results = await searchIcons(query, 20);
    setIcons(results);
    setLoading(false);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Noun Project Icon Browser</h2>

      <div className="flex gap-2 mb-6">
        <Input
          type="text"
          placeholder="Search icons (e.g., vineyard, grape, tractor)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          className="flex-1"
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          className="px-6 py-2 bg-vine-green-600 text-white rounded hover:bg-vine-green-700 disabled:opacity-50"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {icons.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {icons.map((icon) => (
            <div
              key={icon.id}
              className="border rounded-lg p-4 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-center mb-2 h-16">
                <NounProjectIcon iconId={icon.id} size={48} />
              </div>
              <div className="text-center">
                <p className="text-xs font-medium truncate">{icon.term}</p>
                <p className="text-xs text-gray-500">ID: {icon.id}</p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(icon.id.toString());
                    alert(`Icon ID ${icon.id} copied!`);
                  }}
                  className="text-xs text-vine-green-600 hover:underline mt-1"
                >
                  Copy ID
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {icons.length === 0 && !loading && query && (
        <p className="text-gray-500 text-center">No icons found. Try a different search term.</p>
      )}

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold mb-2">How to use:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Search for icons using keywords like "vineyard", "grape", "wine", etc.</li>
          <li>Click "Copy ID" on the icon you want</li>
          <li>Use it in your code: <code className="bg-gray-200 px-1 rounded">&lt;NounProjectIcon iconId={'{ID}'} size={'{24}'} /&gt;</code></li>
        </ol>
      </div>
    </div>
  );
}
