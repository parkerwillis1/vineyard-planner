// Lot Readiness Utilities for Bottling
// Shared logic for computing aging, readiness scores, blockers, and eligibility

// Constants
export const MIN_BOTTLING_VOLUME_GAL = 10;
export const STRICT_ELIGIBLE_STATUSES = ['ready_to_bottle'];
export const NEARLY_READY_STATUSES = ['aging', 'blending'];

/**
 * Compute aging duration in months
 * Source of truth hierarchy: aging_start_date > barrel_assignments.assigned_at > fermentation_end_date
 */
export function computeAgingMonths(lot) {
  // 1. Prefer aging_start_date if available
  if (lot.aging_start_date) {
    const startDate = new Date(lot.aging_start_date);
    const now = new Date();
    return Math.max(0, (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth()));
  }

  // 2. Fall back to earliest barrel assignment if available
  if (lot.barrel_assignments && lot.barrel_assignments.length > 0) {
    const earliestBarrel = lot.barrel_assignments
      .filter(b => b.assigned_at)
      .sort((a, b) => new Date(a.assigned_at) - new Date(b.assigned_at))[0];
    if (earliestBarrel) {
      const startDate = new Date(earliestBarrel.assigned_at);
      const now = new Date();
      return Math.max(0, (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth()));
    }
  }

  // 3. Last resort: fermentation_end_date
  if (lot.fermentation_end_date) {
    const startDate = new Date(lot.fermentation_end_date);
    const now = new Date();
    return Math.max(0, (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth()));
  }

  // No reliable aging data
  return 0;
}

/**
 * Get aging start date for display (uses same hierarchy as computeAgingMonths)
 * Returns { date: Date|null, source: string, isUnknown: boolean }
 *
 * NOTE: barrel_assignments are NOT fetched by listLots() to avoid N+1 queries.
 * The barrel_assignments code path is included for future compatibility but will
 * not execute in current implementation. This is intentional for performance.
 */
export function getAgingStartDate(lot) {
  // 1. Prefer aging_start_date (explicit field)
  if (lot.aging_start_date) {
    return {
      date: lot.aging_start_date,
      source: 'aging_start_date',
      isUnknown: false
    };
  }

  // 2. Barrel assignments (NOT FETCHED in current listLots() - included for future use)
  // This code path will not execute unless barrel_assignments are explicitly fetched
  if (lot.barrel_assignments && lot.barrel_assignments.length > 0) {
    const earliestBarrel = lot.barrel_assignments
      .filter(b => b.assigned_at)
      .sort((a, b) => new Date(a.assigned_at) - new Date(b.assigned_at))[0];
    if (earliestBarrel) {
      return {
        date: earliestBarrel.assigned_at,
        source: 'barrel_assignment',
        isUnknown: false
      };
    }
  }

  // 3. Fall back to fermentation_end_date (last resort)
  if (lot.fermentation_end_date) {
    return {
      date: lot.fermentation_end_date,
      source: 'fermentation_end',
      isUnknown: false
    };
  }

  // 4. No reliable aging data - mark as unknown
  return { date: null, source: null, isUnknown: true };
}

/**
 * Compute readiness score (0-100, higher = more ready)
 */
export function computeReadiness(lot) {
  let score = 50; // Base score

  // Volume check
  if (!lot.current_volume_gallons || lot.current_volume_gallons < MIN_BOTTLING_VOLUME_GAL) {
    score -= 30; // Low volume is a major blocker
  } else {
    score += 10;
  }

  // ABV check
  if (!lot.current_alcohol_pct || lot.current_alcohol_pct <= 0) {
    score -= 20; // Missing ABV is critical
  } else {
    score += 10;
  }

  // Status check
  if (lot.status === 'ready_to_bottle') {
    score += 20;
  } else if (lot.status === 'aging') {
    score += 10;
  } else if (lot.status === 'blending') {
    score += 5;
  }

  // Recent lab analysis - check if chemistry values are present
  const hasLabData = lot.current_ph || lot.current_ta || lot.current_alcohol_pct;
  if (hasLabData) {
    score += 10;
  } else {
    score -= 10; // No lab data
  }

  // Container assigned
  if (lot.container_name) {
    score += 5;
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Get blockers for a lot (with detailed messages for explainability)
 * Returns array of { message: string, type: string, action?: object }
 */
export function getLotBlockers(lot) {
  const blockers = [];

  if (!lot.current_volume_gallons || lot.current_volume_gallons < MIN_BOTTLING_VOLUME_GAL) {
    const vol = lot.current_volume_gallons || 0;
    blockers.push({
      message: `Volume too low: ${vol.toFixed(1)} gal (min ${MIN_BOTTLING_VOLUME_GAL} gal)`,
      type: 'volume',
      action: {
        label: 'View Transfers',
        type: 'navigate',
        path: `/production/lots/${lot.id}/transfers`
      }
    });
  }

  if (!lot.current_alcohol_pct || lot.current_alcohol_pct <= 0) {
    blockers.push({
      message: 'ABV not measured (required for labels)',
      type: 'abv',
      action: {
        label: 'Add Wine Analysis',
        type: 'navigate',
        path: `/production?view=lab&lot=${lot.id}`
      }
    });
  }

  if (!lot.name) {
    blockers.push({
      message: 'Lot name missing (required for labels)',
      type: 'name',
      action: {
        label: 'Edit Lot Details',
        type: 'navigate',
        path: `/production/lots/${lot.id}/edit`
      }
    });
  }

  if (lot.status === 'fermenting' || lot.status === 'pressing') {
    blockers.push({
      message: 'Still in production (not aged)',
      type: 'status_production'
    });
  }

  if (NEARLY_READY_STATUSES.includes(lot.status)) {
    blockers.push({
      message: `Status is "${lot.status}" (must be "ready_to_bottle")`,
      type: 'status_nearly_ready',
      action: {
        label: 'Open Lot Details',
        type: 'navigate',
        path: `/production/lots/${lot.id}`
      }
    });
  }

  // Check if any chemistry values are present (indicates lab analysis has been done)
  const hasLabData = lot.current_ph || lot.current_ta || lot.current_alcohol_pct;
  if (!hasLabData) {
    blockers.push({
      message: 'No lab analysis recorded',
      type: 'lab',
      action: {
        label: 'Add Lab Test',
        type: 'navigate',
        path: `/production?view=lab&lot=${lot.id}`
      }
    });
  }

  return blockers;
}

/**
 * Check if lot is eligible for bottling (STRICT: only ready_to_bottle)
 */
export function isLotEligible(lot) {
  return (
    (lot.current_volume_gallons || 0) >= MIN_BOTTLING_VOLUME_GAL &&
    (lot.current_alcohol_pct || 0) > 0 &&
    lot.name &&
    STRICT_ELIGIBLE_STATUSES.includes(lot.status)
  );
}

/**
 * Check if lot is nearly ready (show as disabled with hint)
 */
export function isLotNearlyReady(lot) {
  return (
    (lot.current_volume_gallons || 0) >= MIN_BOTTLING_VOLUME_GAL &&
    (lot.current_alcohol_pct || 0) > 0 &&
    lot.name &&
    NEARLY_READY_STATUSES.includes(lot.status)
  );
}

/**
 * Get readiness explanation with score breakdown
 * Returns { score, breakdown, blockers, eligible, nearlyReady }
 */
export function getReadinessExplanation(lot) {
  const explanation = {
    score: computeReadiness(lot),
    breakdown: [],
    blockers: getLotBlockers(lot),
    eligible: isLotEligible(lot),
    nearlyReady: isLotNearlyReady(lot)
  };

  // Volume
  if (lot.current_volume_gallons >= MIN_BOTTLING_VOLUME_GAL) {
    explanation.breakdown.push(`✓ Volume OK: ${lot.current_volume_gallons.toFixed(1)} gal`);
  } else {
    explanation.breakdown.push(`✗ Volume too low: ${(lot.current_volume_gallons || 0).toFixed(1)} gal`);
  }

  // ABV
  if (lot.current_alcohol_pct > 0) {
    explanation.breakdown.push(`✓ ABV measured: ${lot.current_alcohol_pct.toFixed(1)}%`);
  } else {
    explanation.breakdown.push(`✗ ABV not measured`);
  }

  // Status
  if (lot.status === 'ready_to_bottle') {
    explanation.breakdown.push(`✓ Status: ready_to_bottle`);
  } else if (NEARLY_READY_STATUSES.includes(lot.status)) {
    explanation.breakdown.push(`○ Status: ${lot.status} (nearly ready)`);
  } else {
    explanation.breakdown.push(`✗ Status: ${lot.status}`);
  }

  // Lab data - check if any chemistry values are present
  const hasLabData = lot.current_ph || lot.current_ta || lot.current_alcohol_pct;
  if (hasLabData) {
    const labValues = [];
    if (lot.current_ph) labValues.push(`pH: ${lot.current_ph}`);
    if (lot.current_ta) labValues.push(`TA: ${lot.current_ta}`);
    if (lot.current_alcohol_pct) labValues.push(`ABV: ${lot.current_alcohol_pct}%`);
    explanation.breakdown.push(`✓ Lab data: ${labValues.join(', ')}`);
  } else {
    explanation.breakdown.push(`○ No lab analysis recorded`);
  }

  // Container
  if (lot.container_name) {
    explanation.breakdown.push(`✓ Container: ${lot.container_name}`);
  }

  return explanation;
}
