/**
 * Sort utility functions for consistent ordering across the app
 */

/**
 * Natural number comparison for sorting strings with numbers
 * e.g., "Field 1", "Field 2", "Field 10" instead of "Field 1", "Field 10", "Field 2"
 */
export function naturalCompare(a, b) {
  const aMatch = a.match(/(\d+)/);
  const bMatch = b.match(/(\d+)/);
  if (aMatch && bMatch) {
    return parseInt(aMatch[1], 10) - parseInt(bMatch[1], 10);
  }
  return a.localeCompare(b);
}

/**
 * Sort an array of objects by a name property using natural number ordering
 * @param {Array} items - Array of objects with a name property
 * @param {string} nameKey - The key to use for sorting (default: 'name')
 * @returns {Array} - Sorted array (new array, doesn't mutate original)
 */
export function sortByName(items, nameKey = 'name') {
  return [...items].sort((a, b) => naturalCompare(a[nameKey] || '', b[nameKey] || ''));
}

/**
 * Sort comparator function for use with .sort() on arrays of objects with name property
 * @param {string} nameKey - The key to use for sorting (default: 'name')
 * @returns {Function} - Comparator function for .sort()
 */
export function naturalSortComparator(nameKey = 'name') {
  return (a, b) => naturalCompare(a[nameKey] || '', b[nameKey] || '');
}
