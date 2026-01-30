/**
 * TTB Report Generator
 * Aggregates transactions into Form 5120.17 line items
 */

import { supabase } from './supabaseClient';
import {
  TAX_CLASSES,
  TRANSACTION_TYPES,
  TRANSACTION_LINE_NUMBERS,
  getReportingPeriod
} from './ttbUtils';

// =====================================================
// FORM STRUCTURE DEFINITIONS
// =====================================================

// Part I Section A - Bulk Wines
const BULK_ADDITION_LINES = [
  { line: 1, type: 'bulk_on_hand_begin', label: 'On hand beginning of period' },
  { line: 2, type: 'produced_fermentation', label: 'Produced by fermentation' },
  { line: 3, type: 'produced_sweetening', label: 'Produced by sweetening' },
  { line: 4, type: 'produced_spirits', label: 'Produced by addition of wine spirits' },
  { line: 5, type: 'produced_blending', label: 'Produced by blending' },
  { line: 6, type: 'produced_amelioration', label: 'Produced by amelioration' },
  { line: 7, type: 'received_bond', label: 'Received in bond from others' },
  { line: 8, type: 'bottled_dumped_bulk', label: 'Bottled wine dumped to bulk' },
  { line: 9, type: 'bulk_inventory_gain', label: 'Inventory gains' },
  { line: 10, type: 'custom_1', label: 'Custom 1' },
  { line: 11, type: 'custom_2', label: 'Custom 2' },
  { line: 12, type: null, label: 'TOTAL', isTotal: true }
];

const BULK_REMOVAL_LINES = [
  { line: 13, type: 'bulk_bottled', label: 'Bottled' },
  { line: 14, type: 'bulk_removed_taxpaid', label: 'Removed taxpaid' },
  { line: 15, type: 'bulk_transferred_bond', label: 'Transferred in bond' },
  { line: 16, type: 'bulk_exported', label: 'Exported' },
  { line: 17, type: 'bulk_destroyed', label: 'Destroyed' },
  { line: 18, type: 'bulk_distillation', label: 'Used for distillation' },
  { line: 19, type: 'bulk_vinegar', label: 'Vinegar stock' },
  { line: 20, type: 'bulk_tasting', label: 'Tasting use' },
  { line: 21, type: 'bulk_custom_3', label: 'Custom 3' },
  { line: 22, type: 'bulk_custom_4', label: 'Custom 4' },
  { line: 23, type: 'bulk_custom_5', label: 'Custom 5' },
  { line: 24, type: 'bulk_custom_6', label: 'Custom 6' },
  { line: 25, type: 'bulk_custom_7', label: 'Custom 7' },
  { line: 26, type: 'bulk_custom_8', label: 'Custom 8' },
  { line: 27, type: 'bulk_custom_9', label: 'Custom 9' },
  { line: 28, type: 'bulk_custom_10', label: 'Custom 10' },
  { line: 29, type: 'bulk_losses_other', label: 'Losses (other than inventory)' },
  { line: 30, type: 'bulk_losses_inventory', label: 'Inventory losses' },
  { line: 31, type: null, label: 'On hand end of period', isEndBalance: true },
  { line: 32, type: null, label: 'TOTAL', isTotal: true }
];

// Part I Section B - Bottled Wines
const BOTTLED_ADDITION_LINES = [
  { line: 1, type: 'bottled_on_hand_begin', label: 'On hand beginning of period' },
  { line: 2, type: 'bottled_produced', label: 'Bottled' },
  { line: 3, type: 'bottled_custom_1', label: 'Custom 1' },
  { line: 4, type: 'bottled_custom_2', label: 'Custom 2' },
  { line: 5, type: 'bottled_received_bond', label: 'Received in bond' },
  { line: 6, type: 'bottled_inventory_gain', label: 'Inventory gains' },
  { line: 7, type: null, label: 'TOTAL', isTotal: true }
];

const BOTTLED_REMOVAL_LINES = [
  { line: 8, type: 'bottled_removed_taxpaid', label: 'Removed taxpaid' },
  { line: 9, type: 'bottled_transferred_bond', label: 'Transferred in bond' },
  { line: 10, type: 'bottled_exported', label: 'Exported' },
  { line: 11, type: 'bottled_tasting', label: 'Tasting use' },
  { line: 12, type: 'bottled_breakage', label: 'Breakage/losses' },
  { line: 13, type: 'bottled_dumped_to_bulk', label: 'Dumped to bulk' },
  { line: 14, type: 'bottled_custom_3', label: 'Custom 3' },
  { line: 15, type: 'bottled_custom_4', label: 'Custom 4' },
  { line: 16, type: 'bottled_custom_5', label: 'Custom 5' },
  { line: 17, type: 'bottled_custom_6', label: 'Custom 6' },
  { line: 18, type: 'bottled_custom_7', label: 'Custom 7' },
  { line: 19, type: 'bottled_custom_8', label: 'Custom 8' },
  { line: 20, type: null, label: 'On hand end of period', isEndBalance: true },
  { line: 21, type: null, label: 'TOTAL', isTotal: true }
];

// Tax class columns in order
const TAX_CLASS_ORDER = [
  TAX_CLASSES.TABLE_WINE_16,
  TAX_CLASSES.TABLE_WINE_21,
  TAX_CLASSES.TABLE_WINE_24,
  TAX_CLASSES.ARTIFICIALLY_CARBONATED,
  TAX_CLASSES.SPARKLING_BF,
  TAX_CLASSES.SPARKLING_BP,
  TAX_CLASSES.HARD_CIDER
];

// =====================================================
// REPORT GENERATION
// =====================================================

/**
 * Generate a TTB 5120.17 report for a given period
 * @param {Date|string} periodStart - Start of reporting period
 * @param {Date|string} periodEnd - End of reporting period
 * @returns {Promise<{data: object, error: Error|null}>}
 */
export async function generateTTBReport(periodStart, periodEnd) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: new Error('No user logged in') };

  try {
    // Fetch all transactions for the period
    const { data: transactions, error: txError } = await supabase
      .from('ttb_transactions')
      .select('*')
      .eq('user_id', user.id)
      .gte('transaction_date', periodStart)
      .lte('transaction_date', periodEnd);

    if (txError) throw txError;

    // Fetch transactions before period start for beginning balances
    const { data: priorTransactions, error: priorError } = await supabase
      .from('ttb_transactions')
      .select('*')
      .eq('user_id', user.id)
      .lt('transaction_date', periodStart);

    if (priorError) throw priorError;

    // Calculate beginning balances from prior transactions
    const beginningBalances = calculateBalances(priorTransactions || []);

    // Aggregate current period transactions
    const periodTotals = aggregateTransactions(transactions || []);

    // Build report sections
    const bulkSection = buildBulkSection(beginningBalances.bulk, periodTotals);
    const bottledSection = buildBottledSection(beginningBalances.bottled, periodTotals);

    // Calculate summary totals
    const summary = calculateSummary(bulkSection, bottledSection);

    const reportData = {
      period: {
        start: periodStart,
        end: periodEnd,
        label: getReportingPeriod(new Date(periodStart), 'monthly').label
      },
      bulk: bulkSection,
      bottled: bottledSection,
      summary,
      transactionCount: transactions?.length || 0,
      generatedAt: new Date().toISOString()
    };

    return { data: reportData, error: null };
  } catch (error) {
    console.error('Error generating TTB report:', error);
    return { data: null, error };
  }
}

/**
 * Calculate running balances from transactions
 */
function calculateBalances(transactions) {
  const bulk = {};
  const bottled = {};

  // Initialize all tax classes to 0
  TAX_CLASS_ORDER.forEach(tc => {
    bulk[tc] = 0;
    bottled[tc] = 0;
  });

  // Sum up all transactions
  for (const tx of transactions) {
    const volume = parseFloat(tx.volume_gallons) || 0;
    const taxClass = tx.tax_class;

    if (isBulkAddition(tx.transaction_type)) {
      bulk[taxClass] = (bulk[taxClass] || 0) + volume;
    } else if (isBulkRemoval(tx.transaction_type)) {
      bulk[taxClass] = (bulk[taxClass] || 0) - volume;
    } else if (isBottledAddition(tx.transaction_type)) {
      bottled[taxClass] = (bottled[taxClass] || 0) + volume;
    } else if (isBottledRemoval(tx.transaction_type)) {
      bottled[taxClass] = (bottled[taxClass] || 0) - volume;
    }
  }

  return { bulk, bottled };
}

/**
 * Aggregate transactions by type and tax class
 */
function aggregateTransactions(transactions) {
  const totals = {};

  for (const tx of transactions) {
    const key = `${tx.transaction_type}|${tx.tax_class}`;
    totals[key] = (totals[key] || 0) + (parseFloat(tx.volume_gallons) || 0);
  }

  return totals;
}

/**
 * Build bulk wine section (Part I, Section A)
 */
function buildBulkSection(beginningBalances, periodTotals) {
  const section = {
    additions: [],
    removals: [],
    columns: TAX_CLASS_ORDER
  };

  // Build additions
  for (const lineDef of BULK_ADDITION_LINES) {
    const row = {
      line: lineDef.line,
      label: lineDef.label,
      isTotal: lineDef.isTotal,
      values: {}
    };

    if (lineDef.isTotal) {
      // Calculate totals across all addition lines
      TAX_CLASS_ORDER.forEach(tc => {
        let total = 0;
        section.additions.forEach(addRow => {
          total += addRow.values[tc] || 0;
        });
        row.values[tc] = total;
      });
    } else if (lineDef.line === 1) {
      // Beginning balance
      TAX_CLASS_ORDER.forEach(tc => {
        row.values[tc] = Math.max(0, beginningBalances[tc] || 0);
      });
    } else if (lineDef.type) {
      // Regular line - get from period totals
      TAX_CLASS_ORDER.forEach(tc => {
        const key = `${lineDef.type}|${tc}`;
        row.values[tc] = periodTotals[key] || 0;
      });
    }

    section.additions.push(row);
  }

  // Build removals
  const additionsTotal = section.additions.find(r => r.isTotal);

  for (const lineDef of BULK_REMOVAL_LINES) {
    const row = {
      line: lineDef.line,
      label: lineDef.label,
      isTotal: lineDef.isTotal,
      isEndBalance: lineDef.isEndBalance,
      values: {}
    };

    if (lineDef.isEndBalance) {
      // Calculate end balance: Total Additions - Sum of Removals (lines 13-30)
      TAX_CLASS_ORDER.forEach(tc => {
        const totalAdditions = additionsTotal?.values[tc] || 0;
        let totalRemovals = 0;
        section.removals.forEach(remRow => {
          if (!remRow.isTotal && !remRow.isEndBalance) {
            totalRemovals += remRow.values[tc] || 0;
          }
        });
        row.values[tc] = Math.max(0, totalAdditions - totalRemovals);
      });
    } else if (lineDef.isTotal) {
      // Total should equal Total Additions
      TAX_CLASS_ORDER.forEach(tc => {
        row.values[tc] = additionsTotal?.values[tc] || 0;
      });
    } else if (lineDef.type) {
      // Regular removal line
      TAX_CLASS_ORDER.forEach(tc => {
        const key = `${lineDef.type}|${tc}`;
        row.values[tc] = periodTotals[key] || 0;
      });
    }

    section.removals.push(row);
  }

  return section;
}

/**
 * Build bottled wine section (Part I, Section B)
 */
function buildBottledSection(beginningBalances, periodTotals) {
  const section = {
    additions: [],
    removals: [],
    columns: TAX_CLASS_ORDER
  };

  // Build additions
  for (const lineDef of BOTTLED_ADDITION_LINES) {
    const row = {
      line: lineDef.line,
      label: lineDef.label,
      isTotal: lineDef.isTotal,
      values: {}
    };

    if (lineDef.isTotal) {
      TAX_CLASS_ORDER.forEach(tc => {
        let total = 0;
        section.additions.forEach(addRow => {
          total += addRow.values[tc] || 0;
        });
        row.values[tc] = total;
      });
    } else if (lineDef.line === 1) {
      TAX_CLASS_ORDER.forEach(tc => {
        row.values[tc] = Math.max(0, beginningBalances[tc] || 0);
      });
    } else if (lineDef.type) {
      TAX_CLASS_ORDER.forEach(tc => {
        const key = `${lineDef.type}|${tc}`;
        row.values[tc] = periodTotals[key] || 0;
      });
    }

    section.additions.push(row);
  }

  // Build removals
  const additionsTotal = section.additions.find(r => r.isTotal);

  for (const lineDef of BOTTLED_REMOVAL_LINES) {
    const row = {
      line: lineDef.line,
      label: lineDef.label,
      isTotal: lineDef.isTotal,
      isEndBalance: lineDef.isEndBalance,
      values: {}
    };

    if (lineDef.isEndBalance) {
      TAX_CLASS_ORDER.forEach(tc => {
        const totalAdditions = additionsTotal?.values[tc] || 0;
        let totalRemovals = 0;
        section.removals.forEach(remRow => {
          if (!remRow.isTotal && !remRow.isEndBalance) {
            totalRemovals += remRow.values[tc] || 0;
          }
        });
        row.values[tc] = Math.max(0, totalAdditions - totalRemovals);
      });
    } else if (lineDef.isTotal) {
      TAX_CLASS_ORDER.forEach(tc => {
        row.values[tc] = additionsTotal?.values[tc] || 0;
      });
    } else if (lineDef.type) {
      TAX_CLASS_ORDER.forEach(tc => {
        const key = `${lineDef.type}|${tc}`;
        row.values[tc] = periodTotals[key] || 0;
      });
    }

    section.removals.push(row);
  }

  return section;
}

/**
 * Calculate summary totals
 */
function calculateSummary(bulkSection, bottledSection) {
  const summary = {
    totalBulkProduced: 0,
    totalBulkBottled: 0,
    totalBulkOnHand: 0,
    totalBottledProduced: 0,
    totalBottledRemoved: 0,
    totalBottledOnHand: 0,
    byTaxClass: {}
  };

  TAX_CLASS_ORDER.forEach(tc => {
    const bulkProduced = bulkSection.additions.find(r => r.line === 2)?.values[tc] || 0;
    const bulkBottled = bulkSection.removals.find(r => r.line === 13)?.values[tc] || 0;
    const bulkEndBalance = bulkSection.removals.find(r => r.isEndBalance)?.values[tc] || 0;

    const bottledProduced = bottledSection.additions.find(r => r.line === 2)?.values[tc] || 0;
    const bottledRemoved = bottledSection.removals.find(r => r.line === 8)?.values[tc] || 0;
    const bottledEndBalance = bottledSection.removals.find(r => r.isEndBalance)?.values[tc] || 0;

    summary.totalBulkProduced += bulkProduced;
    summary.totalBulkBottled += bulkBottled;
    summary.totalBulkOnHand += bulkEndBalance;
    summary.totalBottledProduced += bottledProduced;
    summary.totalBottledRemoved += bottledRemoved;
    summary.totalBottledOnHand += bottledEndBalance;

    summary.byTaxClass[tc] = {
      bulkProduced,
      bulkBottled,
      bulkOnHand: bulkEndBalance,
      bottledProduced,
      bottledRemoved,
      bottledOnHand: bottledEndBalance
    };
  });

  return summary;
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

function isBulkAddition(type) {
  return [
    TRANSACTION_TYPES.BULK_ON_HAND_BEGIN,
    TRANSACTION_TYPES.PRODUCED_FERMENTATION,
    TRANSACTION_TYPES.PRODUCED_SWEETENING,
    TRANSACTION_TYPES.PRODUCED_SPIRITS,
    TRANSACTION_TYPES.PRODUCED_BLENDING,
    TRANSACTION_TYPES.PRODUCED_AMELIORATION,
    TRANSACTION_TYPES.RECEIVED_BOND,
    TRANSACTION_TYPES.BOTTLED_DUMPED_BULK,
    TRANSACTION_TYPES.BULK_INVENTORY_GAIN
  ].includes(type);
}

function isBulkRemoval(type) {
  return [
    TRANSACTION_TYPES.BULK_BOTTLED,
    TRANSACTION_TYPES.BULK_REMOVED_TAXPAID,
    TRANSACTION_TYPES.BULK_TRANSFERRED_BOND,
    TRANSACTION_TYPES.BULK_EXPORTED,
    TRANSACTION_TYPES.BULK_DESTROYED,
    TRANSACTION_TYPES.BULK_DISTILLATION,
    TRANSACTION_TYPES.BULK_VINEGAR,
    TRANSACTION_TYPES.BULK_TASTING,
    TRANSACTION_TYPES.BULK_LOSSES_OTHER,
    TRANSACTION_TYPES.BULK_LOSSES_INVENTORY
  ].includes(type);
}

function isBottledAddition(type) {
  return [
    TRANSACTION_TYPES.BOTTLED_ON_HAND_BEGIN,
    TRANSACTION_TYPES.BOTTLED_PRODUCED,
    TRANSACTION_TYPES.BOTTLED_RECEIVED_BOND,
    TRANSACTION_TYPES.BOTTLED_INVENTORY_GAIN
  ].includes(type);
}

function isBottledRemoval(type) {
  return [
    TRANSACTION_TYPES.BOTTLED_REMOVED_TAXPAID,
    TRANSACTION_TYPES.BOTTLED_TRANSFERRED_BOND,
    TRANSACTION_TYPES.BOTTLED_EXPORTED,
    TRANSACTION_TYPES.BOTTLED_TASTING,
    TRANSACTION_TYPES.BOTTLED_BREAKAGE,
    TRANSACTION_TYPES.BOTTLED_DUMPED_TO_BULK
  ].includes(type);
}

// =====================================================
// EXPORT FUNCTIONS
// =====================================================

export {
  BULK_ADDITION_LINES,
  BULK_REMOVAL_LINES,
  BOTTLED_ADDITION_LINES,
  BOTTLED_REMOVAL_LINES,
  TAX_CLASS_ORDER
};
