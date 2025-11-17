import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Hook to highlight search terms in the page content and scroll to first match
 * Reads the 'highlight' query parameter and finds/highlights matching text
 */
export function useSearchHighlight(contentRef) {
  const location = useLocation();

  useEffect(() => {
    // Get highlight query parameter
    const params = new URLSearchParams(location.search);
    const highlightTerm = params.get('highlight');

    if (!highlightTerm || !contentRef.current) {
      return;
    }

    const container = contentRef.current;

    // Check if search term is symbols only
    const isSymbolQuery = /^[^a-zA-Z0-9\s]+$/.test(highlightTerm);
    const searchTerm = isSymbolQuery ? highlightTerm : highlightTerm.toLowerCase();

    // Remove any existing highlights first
    const existingHighlights = container.querySelectorAll('mark.search-highlight');
    existingHighlights.forEach(mark => {
      const parent = mark.parentNode;
      parent.replaceChild(document.createTextNode(mark.textContent), mark);
      parent.normalize(); // Merge adjacent text nodes
    });

    // Find and highlight all matching text
    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          // Skip script, style, and already highlighted elements
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;

          const tagName = parent.tagName.toLowerCase();
          if (['script', 'style', 'mark'].includes(tagName)) {
            return NodeFilter.FILTER_REJECT;
          }

          // Only accept nodes that contain the search term
          const nodeText = isSymbolQuery ? node.textContent : node.textContent.toLowerCase();
          if (nodeText.includes(searchTerm)) {
            return NodeFilter.FILTER_ACCEPT;
          }

          return NodeFilter.FILTER_REJECT;
        }
      }
    );

    const textNodes = [];
    let node;
    while ((node = walker.nextNode())) {
      textNodes.push(node);
    }

    // Highlight matches in each text node
    let firstHighlight = null;
    textNodes.forEach(textNode => {
      const text = textNode.textContent;
      const compareText = isSymbolQuery ? text : text.toLowerCase();

      // Find all occurrences in this text node
      const matches = [];
      let searchIndex = 0;
      while (searchIndex < compareText.length) {
        const matchIndex = compareText.indexOf(searchTerm, searchIndex);
        if (matchIndex === -1) break;

        matches.push({
          start: matchIndex,
          end: matchIndex + searchTerm.length
        });
        searchIndex = matchIndex + 1;
      }

      if (matches.length === 0) return;

      // Create new nodes with highlights
      const fragment = document.createDocumentFragment();
      let lastIndex = 0;

      matches.forEach(match => {
        // Add text before match
        if (match.start > lastIndex) {
          fragment.appendChild(
            document.createTextNode(text.substring(lastIndex, match.start))
          );
        }

        // Add highlighted match
        const mark = document.createElement('mark');
        mark.className = 'search-highlight font-semibold text-blue-700 bg-blue-100 px-1 py-0.5 rounded';
        mark.textContent = text.substring(match.start, match.end);
        fragment.appendChild(mark);

        // Store first highlight for scrolling
        if (!firstHighlight) {
          firstHighlight = mark;
        }

        lastIndex = match.end;
      });

      // Add remaining text after last match
      if (lastIndex < text.length) {
        fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
      }

      // Replace the text node with the fragment
      textNode.parentNode.replaceChild(fragment, textNode);
    });

    // Scroll to first highlight with a slight delay to ensure rendering
    if (firstHighlight) {
      setTimeout(() => {
        firstHighlight.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });

        // Add a temporary pulse animation
        firstHighlight.classList.add('animate-pulse');
        setTimeout(() => {
          firstHighlight.classList.remove('animate-pulse');
        }, 2000);
      }, 100);
    }

    // Cleanup function
    return () => {
      const highlights = container.querySelectorAll('mark.search-highlight');
      highlights.forEach(mark => {
        const parent = mark.parentNode;
        if (parent) {
          parent.replaceChild(document.createTextNode(mark.textContent), mark);
          parent.normalize();
        }
      });
    };
  }, [location.search, contentRef]);
}
