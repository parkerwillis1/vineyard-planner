import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Search, X, FileText, Clock } from "lucide-react";
import { getAllPages } from "./docsConfig";

const RECENTLY_VIEWED_KEY = "docs_recently_viewed";
const MAX_RECENT = 5;

// Component to highlight matching text
function HighlightedText({ text, query }) {
  if (!query.trim()) {
    return <>{text}</>;
  }

  const parts = [];

  // Check if query is symbols only
  const isSymbolQuery = /^[^a-zA-Z0-9\s]+$/.test(query);

  // Use case-sensitive search for symbols, case-insensitive for text
  const searchText = isSymbolQuery ? text : text.toLowerCase();
  const searchQuery = isSymbolQuery ? query : query.toLowerCase();

  let lastIndex = 0;
  let searchIndex = 0;

  while (searchIndex < searchText.length) {
    const matchIndex = searchText.indexOf(searchQuery, searchIndex);

    if (matchIndex === -1) {
      // No more matches, add remaining text
      parts.push({ text: text.slice(lastIndex), highlight: false });
      break;
    }

    // Add text before match
    if (matchIndex > lastIndex) {
      parts.push({ text: text.slice(lastIndex, matchIndex), highlight: false });
    }

    // Add matched text
    parts.push({
      text: text.slice(matchIndex, matchIndex + query.length),
      highlight: true
    });

    lastIndex = matchIndex + query.length;
    searchIndex = lastIndex;
  }

  return (
    <>
      {parts.map((part, i) => (
        part.highlight ? (
          <mark key={i} className="font-semibold text-blue-700 bg-blue-50 px-0.5 rounded">
            {part.text}
          </mark>
        ) : (
          <span key={i}>{part.text}</span>
        )
      ))}
    </>
  );
}

// Simple substring search function (exact matches only)
function fuzzySearch(text, query) {
  if (!text || !query) return 0;

  // Check if query contains only symbols/special characters
  const isSymbolQuery = /^[^a-zA-Z0-9\s]+$/.test(query);

  if (isSymbolQuery) {
    // For symbols, do case-sensitive exact match
    if (text.includes(query)) {
      return text.indexOf(query) === 0 ? 100 : 50;
    }
  } else {
    // For regular text, do case-insensitive match
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();

    if (lowerText.includes(lowerQuery)) {
      return lowerText.indexOf(lowerQuery) === 0 ? 100 : 50;
    }
  }

  return 0;
}

export default function DocsSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Get recently viewed pages from localStorage
  const getRecentlyViewed = () => {
    try {
      const recent = localStorage.getItem(RECENTLY_VIEWED_KEY);
      return recent ? JSON.parse(recent) : [];
    } catch (e) {
      return [];
    }
  };

  // Add current page to recently viewed
  useEffect(() => {
    const allPages = getAllPages();
    const currentPage = allPages.find(page => page.href === location.pathname);

    if (currentPage) {
      const recent = getRecentlyViewed();
      const filtered = recent.filter(item => item.href !== currentPage.href);
      const updated = [currentPage, ...filtered].slice(0, MAX_RECENT);

      try {
        localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updated));
      } catch (e) {
        // Ignore localStorage errors
      }
    }
  }, [location.pathname]);

  // Get search results
  const getResults = () => {
    const allPages = getAllPages();

    if (!query.trim()) {
      return [];
    }

    // Search across title, description, content, keywords, and section
    const results = allPages
      .map(page => {
        const titleScore = fuzzySearch(page.title, query);
        const descScore = fuzzySearch(page.description || "", query);
        const keywordsScore = fuzzySearch(page.keywords || "", query);
        const sectionScore = fuzzySearch(page.section, query);

        // Search through content snippets
        let contentScore = 0;
        let matchingSnippet = "";
        if (page.content && Array.isArray(page.content)) {
          for (const snippet of page.content) {
            const snippetScore = fuzzySearch(snippet, query);
            if (snippetScore > contentScore) {
              contentScore = snippetScore;
              matchingSnippet = snippet;
            }
          }
        }

        const score = Math.max(titleScore, descScore * 0.8, contentScore * 0.95, keywordsScore * 0.7, sectionScore * 0.5);

        // Use content snippet if available, otherwise fall back to keywords
        let displaySnippet = matchingSnippet || page.description || "";

        return { ...page, score, displaySnippet };
      })
      .filter(page => page.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    return results;
  };

  const results = getResults();
  const recentlyViewed = getRecentlyViewed();
  const showRecent = !query.trim() && recentlyViewed.length > 0;
  const showSuggested = !query.trim() && !showRecent;

  // Suggested pages (popular docs)
  const suggested = [
    { title: "Quick Start", href: "/docs/getting-started/quick-start" },
    { title: "Financial Inputs", href: "/docs/planner/financial-inputs" },
    { title: "Block Management", href: "/docs/operations/blocks" },
    { title: "Irrigation System", href: "/docs/operations/irrigation" },
  ];

  const displayItems = query.trim()
    ? results
    : showRecent
    ? recentlyViewed
    : suggested;

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) {
        // Open search with Cmd+K or Ctrl+K or /
        if ((e.metaKey || e.ctrlKey) && e.key === "k") {
          e.preventDefault();
          setIsOpen(true);
          setTimeout(() => inputRef.current?.focus(), 0);
        } else if (e.key === "/" && document.activeElement?.tagName !== "INPUT") {
          e.preventDefault();
          setIsOpen(true);
          setTimeout(() => inputRef.current?.focus(), 0);
        }
        return;
      }

      // Navigation within search
      switch (e.key) {
        case "Escape":
          setIsOpen(false);
          setQuery("");
          setSelectedIndex(0);
          break;
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex(i => Math.min(i + 1, displayItems.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex(i => Math.max(i - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (displayItems[selectedIndex]) {
            navigate(displayItems[selectedIndex].href);
            setIsOpen(false);
            setQuery("");
            setSelectedIndex(0);
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedIndex, displayItems, navigate]);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
        setQuery("");
        setSelectedIndex(0);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleItemClick = (href) => {
    // Pass the search query as a URL parameter so destination page can highlight it
    const url = query.trim() ? `${href}?highlight=${encodeURIComponent(query.trim())}` : href;
    navigate(url);
    setIsOpen(false);
    setQuery("");
    setSelectedIndex(0);
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder="Search docs..."
          className="w-full pl-10 pr-16 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vine-green-500 focus:border-transparent"
        />
        {isOpen && query && (
          <button
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className="absolute right-12 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 text-xs font-semibold text-gray-500 bg-gray-100 rounded pointer-events-none">
          /
        </kbd>
      </div>

      {/* Search Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl max-h-[500px] overflow-y-auto z-50">
          {displayItems.length === 0 && query.trim() && (
            <div className="p-8 text-center text-gray-500">
              <p className="text-sm">No results found for "{query}"</p>
            </div>
          )}

          {displayItems.length === 0 && !query.trim() && !showRecent && (
            <div className="p-4">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">
                Suggested
              </div>
              {suggested.map((item, index) => (
                <button
                  key={item.href}
                  onClick={() => handleItemClick(item.href)}
                  className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-md text-left transition-colors ${
                    index === selectedIndex
                      ? "bg-vine-green-50 text-vine-green-700"
                      : "hover:bg-gray-50"
                  }`}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <FileText className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900">{item.title}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {showRecent && (
            <div className="p-4">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">
                Recently viewed
              </div>
              {recentlyViewed.map((item, index) => (
                <button
                  key={item.href}
                  onClick={() => handleItemClick(item.href)}
                  className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-md text-left transition-colors ${
                    index === selectedIndex
                      ? "bg-vine-green-50 text-vine-green-700"
                      : "hover:bg-gray-50"
                  }`}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <Clock className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{item.title}</span>
                      <span className="text-xs text-gray-400">›</span>
                      <span className="text-xs text-gray-500">{item.section}</span>
                    </div>
                    {item.description && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{item.description}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {query.trim() && results.length > 0 && (
            <div className="p-3">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3">
                Results
              </div>
              <div className="space-y-0.5">
                {results.map((item, index) => (
                  <button
                    key={item.href}
                    onClick={() => handleItemClick(item.href)}
                    className={`w-full flex items-start gap-3 px-3 py-3 rounded-md text-left transition-colors ${
                      index === selectedIndex
                        ? "bg-blue-50 border border-blue-200"
                        : "hover:bg-gray-50 border border-transparent"
                    }`}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                  <FileText className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 mb-0.5">
                      <HighlightedText text={item.title} query={query} />
                    </div>
                    {item.displaySnippet && (
                      <p className="text-xs text-gray-600 line-clamp-2 mb-1">
                        <HighlightedText text={item.displaySnippet} query={query} />
                      </p>
                    )}
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <span>Home</span>
                      <span>›</span>
                      <span>{item.section}</span>
                    </div>
                  </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Footer hint */}
          <div className="border-t border-gray-200 px-4 py-2 bg-gray-50 text-xs text-gray-500 flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-xs">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-xs">↓</kbd>
              to navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-xs">↵</kbd>
              to select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-xs">esc</kbd>
              to close
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
