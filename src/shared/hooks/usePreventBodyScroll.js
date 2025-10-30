import { useEffect } from 'react';

/**
 * Hook to prevent body scrolling when a modal/overlay is open
 * Automatically cleans up when the component unmounts
 */
export function usePreventBodyScroll() {
  useEffect(() => {
    // Store original styles
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    // Get scrollbar width to prevent layout shift
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    // Prevent scrolling
    document.body.style.overflow = 'hidden';

    // Add padding to compensate for removed scrollbar
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    // Cleanup: restore original styles when component unmounts
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, []);
}
