import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Book,
  Search,
  ExternalLink,
  ChevronRight,
  Grape,
  Factory,
  Calculator,
  Settings,
  Home
} from 'lucide-react';
import { docsContent, getDoc, getDocsByTool, searchDocs } from './docsContent';

const toolIcons = {
  Planner: Calculator,
  Operations: Grape,
  Production: Factory,
  Account: Settings
};

const toolColors = {
  Planner: 'text-blue-600 bg-blue-50',
  Operations: 'text-green-600 bg-green-50',
  Production: 'text-purple-600 bg-purple-50',
  Account: 'text-gray-600 bg-gray-50'
};

export function DocsPage() {
  const { '*': docPath } = useParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // docPath comes from the route wildcard
  const docId = docPath || null;
  const doc = docId ? getDoc(docId) : null;

  // Base path for docs navigation
  const basePath = '/docs/page';

  useEffect(() => {
    if (searchQuery.length > 2) {
      setSearchResults(searchDocs(searchQuery));
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  // If viewing a specific doc
  if (doc) {
    const Icon = toolIcons[doc.tool] || Book;
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(basePath)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${toolColors[doc.tool]}`}>
                    {doc.tool}
                  </span>
                  <ChevronRight className="w-4 h-4" />
                  <span>Documentation</span>
                </div>
                <h1 className="text-xl font-bold text-gray-900">{doc.title}</h1>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Description */}
            <div className="p-6 bg-gray-50 border-b border-gray-200">
              <p className="text-gray-600">{doc.description}</p>
            </div>

            {/* Sections */}
            <div className="divide-y divide-gray-100">
              {doc.sections.map((section, idx) => (
                <div key={idx} className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    {section.title}
                  </h2>
                  <div className="prose prose-gray max-w-none">
                    {section.content.split('\n\n').map((paragraph, pIdx) => {
                      // Check for picture placeholder
                      if (paragraph.includes('[PICTURE NEEDED:')) {
                        const match = paragraph.match(/\[PICTURE NEEDED: (.*?)\]/);
                        return (
                          <div
                            key={pIdx}
                            className="my-4 p-4 bg-amber-50 border border-amber-200 rounded-lg"
                          >
                            <p className="text-amber-800 text-sm font-medium">
                              📷 {match ? match[1] : 'Image placeholder'}
                            </p>
                          </div>
                        );
                      }

                      // Check for table
                      if (paragraph.includes('|') && paragraph.includes('---')) {
                        const lines = paragraph.trim().split('\n');
                        const headers = lines[0].split('|').filter(Boolean).map(h => h.trim());
                        const rows = lines.slice(2).map(line =>
                          line.split('|').filter(Boolean).map(cell => cell.trim())
                        );

                        return (
                          <div key={pIdx} className="my-4 overflow-x-auto">
                            <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
                              <thead className="bg-gray-50">
                                <tr>
                                  {headers.map((h, i) => (
                                    <th key={i} className="px-4 py-2 text-left text-sm font-semibold text-gray-900 border-b">
                                      {h}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {rows.map((row, rIdx) => (
                                  <tr key={rIdx}>
                                    {row.map((cell, cIdx) => (
                                      <td key={cIdx} className="px-4 py-2 text-sm text-gray-600">
                                        {cell === '✓' ? (
                                          <span className="text-green-600">✓</span>
                                        ) : cell === '-' ? (
                                          <span className="text-gray-300">—</span>
                                        ) : cell}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        );
                      }

                      // Check for list
                      if (paragraph.match(/^[-*•]\s/m) || paragraph.match(/^\d+\.\s/m)) {
                        const items = paragraph.split('\n').filter(Boolean);
                        const isOrdered = items[0].match(/^\d+\./);

                        const ListTag = isOrdered ? 'ol' : 'ul';
                        return (
                          <ListTag key={pIdx} className={`my-3 ${isOrdered ? 'list-decimal' : 'list-disc'} list-inside space-y-1`}>
                            {items.map((item, iIdx) => {
                              const text = item.replace(/^[-*•]\s*/, '').replace(/^\d+\.\s*/, '');
                              // Handle bold text
                              const parts = text.split(/\*\*(.*?)\*\*/g);
                              return (
                                <li key={iIdx} className="text-gray-600">
                                  {parts.map((part, partIdx) =>
                                    partIdx % 2 === 1 ? (
                                      <strong key={partIdx} className="font-semibold text-gray-900">{part}</strong>
                                    ) : (
                                      <span key={partIdx}>{part}</span>
                                    )
                                  )}
                                </li>
                              );
                            })}
                          </ListTag>
                        );
                      }

                      // Regular paragraph with bold text support
                      const parts = paragraph.split(/\*\*(.*?)\*\*/g);
                      return (
                        <p key={pIdx} className="my-3 text-gray-600 leading-relaxed">
                          {parts.map((part, partIdx) =>
                            partIdx % 2 === 1 ? (
                              <strong key={partIdx} className="font-semibold text-gray-900">{part}</strong>
                            ) : (
                              <span key={partIdx}>{part}</span>
                            )
                          )}
                        </p>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Related Docs */}
            {doc.relatedDocs && doc.relatedDocs.length > 0 && (
              <div className="p-6 bg-gray-50 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Related Documentation</h3>
                <div className="flex flex-wrap gap-2">
                  {doc.relatedDocs.map(relId => {
                    const relDoc = getDoc(relId);
                    if (!relDoc) return null;
                    return (
                      <Link
                        key={relId}
                        to={`${basePath}/${relId}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        {relDoc.title}
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Documentation index
  const plannerDocs = getDocsByTool('Planner');
  const operationsDocs = getDocsByTool('Operations');
  const productionDocs = getDocsByTool('Production');
  const accountDocs = getDocsByTool('Account');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-6">
            <Link
              to="/"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Home className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Documentation</h1>
              <p className="text-gray-600">Learn how to use every feature in Trellis</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documentation..."
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
              <p className="text-sm text-gray-500 mb-3">{searchResults.length} results found</p>
              <div className="space-y-2">
                {searchResults.map(result => (
                  <Link
                    key={result.id}
                    to={`${basePath}/${result.id}`}
                    className="block p-3 hover:bg-gray-50 rounded-lg transition-colors"
                    onClick={() => setSearchQuery('')}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${toolColors[result.tool]}`}>
                        {result.tool}
                      </span>
                      <span className="font-medium text-gray-900">{result.title}</span>
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-1">{result.description}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Planner Docs */}
        <DocSection
          title="Planner"
          description="Financial planning and vineyard design tools"
          icon={Calculator}
          color="blue"
          docs={plannerDocs}
        />

        {/* Operations Docs */}
        <DocSection
          title="Operations"
          description="Vineyard management and daily operations"
          icon={Grape}
          color="green"
          docs={operationsDocs}
        />

        {/* Production Docs */}
        <DocSection
          title="Production"
          description="Winery production and cellar management"
          icon={Factory}
          color="purple"
          docs={productionDocs}
        />

        {/* Account Docs */}
        <DocSection
          title="Account"
          description="User settings and preferences"
          icon={Settings}
          color="gray"
          docs={accountDocs}
        />
      </div>
    </div>
  );
}

function DocSection({ title, description, icon: Icon, color, docs }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    gray: 'bg-gray-50 text-gray-600 border-gray-200'
  };

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {docs.map(doc => (
          <Link
            key={doc.id}
            to={`/docs/page/${doc.id}`}
            className="p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all"
          >
            <h3 className="font-medium text-gray-900 mb-1">{doc.title}</h3>
            <p className="text-sm text-gray-500 line-clamp-2">{doc.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default DocsPage;
