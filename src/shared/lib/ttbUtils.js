/**
 * TTB Form 5120.17 Utilities
 * Tax class determination, constants, and helper functions
 */

// =====================================================
// TAX CLASS DEFINITIONS
// Based on TTB Form 5120.17 column structure
// =====================================================

export const TAX_CLASSES = {
  TABLE_WINE_16: 'table_wine_16',       // Column (a): Still wine ≤16%
  TABLE_WINE_21: 'table_wine_21',       // Column (b): Still wine 16-21%
  TABLE_WINE_24: 'table_wine_24',       // Column (c): Still wine 21-24%
  ARTIFICIALLY_CARBONATED: 'artificially_carbonated',  // Column (d)
  SPARKLING_BF: 'sparkling_bf',         // Column (e): Bottle fermented
  SPARKLING_BP: 'sparkling_bp',         // Column (e): Bulk process
  HARD_CIDER: 'hard_cider'              // Column (f): <8.5% from apples/pears
};

export const TAX_CLASS_LABELS = {
  [TAX_CLASSES.TABLE_WINE_16]: '(a) Table Wine - Not over 16%',
  [TAX_CLASSES.TABLE_WINE_21]: '(b) Table Wine - Over 16% to 21%',
  [TAX_CLASSES.TABLE_WINE_24]: '(c) Table Wine - Over 21% to 24%',
  [TAX_CLASSES.ARTIFICIALLY_CARBONATED]: '(d) Artificially Carbonated',
  [TAX_CLASSES.SPARKLING_BF]: '(e) Sparkling - Bottle Fermented',
  [TAX_CLASSES.SPARKLING_BP]: '(e) Sparkling - Bulk Process',
  [TAX_CLASSES.HARD_CIDER]: '(f) Hard Cider'
};

export const TAX_CLASS_SHORT_LABELS = {
  [TAX_CLASSES.TABLE_WINE_16]: '≤16%',
  [TAX_CLASSES.TABLE_WINE_21]: '16-21%',
  [TAX_CLASSES.TABLE_WINE_24]: '21-24%',
  [TAX_CLASSES.ARTIFICIALLY_CARBONATED]: 'Carbonated',
  [TAX_CLASSES.SPARKLING_BF]: 'Sparkling BF',
  [TAX_CLASSES.SPARKLING_BP]: 'Sparkling BP',
  [TAX_CLASSES.HARD_CIDER]: 'Hard Cider'
};

// Column letters for form mapping
export const TAX_CLASS_COLUMNS = {
  [TAX_CLASSES.TABLE_WINE_16]: 'a',
  [TAX_CLASSES.TABLE_WINE_21]: 'b',
  [TAX_CLASSES.TABLE_WINE_24]: 'c',
  [TAX_CLASSES.ARTIFICIALLY_CARBONATED]: 'd',
  [TAX_CLASSES.SPARKLING_BF]: 'e',
  [TAX_CLASSES.SPARKLING_BP]: 'e',
  [TAX_CLASSES.HARD_CIDER]: 'f'
};

// =====================================================
// WINE TYPES
// =====================================================

export const WINE_TYPES = {
  STILL: 'still',
  SPARKLING_BF: 'sparkling_bf',
  SPARKLING_BP: 'sparkling_bp',
  ARTIFICIALLY_CARBONATED: 'artificially_carbonated',
  HARD_CIDER: 'hard_cider'
};

export const WINE_TYPE_LABELS = {
  [WINE_TYPES.STILL]: 'Still Wine',
  [WINE_TYPES.SPARKLING_BF]: 'Sparkling (Bottle Fermented)',
  [WINE_TYPES.SPARKLING_BP]: 'Sparkling (Bulk Process)',
  [WINE_TYPES.ARTIFICIALLY_CARBONATED]: 'Artificially Carbonated',
  [WINE_TYPES.HARD_CIDER]: 'Hard Cider'
};

// =====================================================
// TRANSACTION TYPES
// Mapped to TTB Form 5120.17 line numbers
// =====================================================

export const TRANSACTION_TYPES = {
  // Part I Section A - Bulk Wine Additions (Lines 1-12)
  BULK_ON_HAND_BEGIN: 'bulk_on_hand_begin',           // Line 1
  PRODUCED_FERMENTATION: 'produced_fermentation',     // Line 2
  PRODUCED_SWEETENING: 'produced_sweetening',         // Line 3
  PRODUCED_SPIRITS: 'produced_spirits',               // Line 4
  PRODUCED_BLENDING: 'produced_blending',             // Line 5
  PRODUCED_AMELIORATION: 'produced_amelioration',     // Line 6
  RECEIVED_BOND: 'received_bond',                     // Line 7
  BOTTLED_DUMPED_BULK: 'bottled_dumped_bulk',        // Line 8
  BULK_INVENTORY_GAIN: 'bulk_inventory_gain',         // Line 9

  // Part I Section A - Bulk Wine Removals (Lines 13-32)
  BULK_BOTTLED: 'bulk_bottled',                       // Line 13
  BULK_REMOVED_TAXPAID: 'bulk_removed_taxpaid',       // Line 14
  BULK_TRANSFERRED_BOND: 'bulk_transferred_bond',     // Line 15
  BULK_EXPORTED: 'bulk_exported',                     // Line 16
  BULK_DESTROYED: 'bulk_destroyed',                   // Line 17
  BULK_DISTILLATION: 'bulk_distillation',            // Line 18
  BULK_VINEGAR: 'bulk_vinegar',                      // Line 19
  BULK_TASTING: 'bulk_tasting',                      // Line 20
  BULK_LOSSES_OTHER: 'bulk_losses_other',            // Line 29
  BULK_LOSSES_INVENTORY: 'bulk_losses_inventory',     // Line 30

  // Part I Section B - Bottled Wine Additions (Lines 1-7)
  BOTTLED_ON_HAND_BEGIN: 'bottled_on_hand_begin',     // Line 1
  BOTTLED_PRODUCED: 'bottled_produced',               // Line 2
  BOTTLED_RECEIVED_BOND: 'bottled_received_bond',     // Line 5
  BOTTLED_INVENTORY_GAIN: 'bottled_inventory_gain',   // Line 6

  // Part I Section B - Bottled Wine Removals (Lines 8-21)
  BOTTLED_REMOVED_TAXPAID: 'bottled_removed_taxpaid', // Line 8
  BOTTLED_TRANSFERRED_BOND: 'bottled_transferred_bond', // Line 9
  BOTTLED_EXPORTED: 'bottled_exported',               // Line 10
  BOTTLED_TASTING: 'bottled_tasting',                 // Line 11
  BOTTLED_BREAKAGE: 'bottled_breakage',               // Line 12
  BOTTLED_DUMPED_TO_BULK: 'bottled_dumped_to_bulk'    // Line 13
};

export const TRANSACTION_TYPE_LABELS = {
  [TRANSACTION_TYPES.BULK_ON_HAND_BEGIN]: 'On hand beginning of period',
  [TRANSACTION_TYPES.PRODUCED_FERMENTATION]: 'Produced by fermentation',
  [TRANSACTION_TYPES.PRODUCED_SWEETENING]: 'Produced by sweetening',
  [TRANSACTION_TYPES.PRODUCED_SPIRITS]: 'Produced by wine spirits addition',
  [TRANSACTION_TYPES.PRODUCED_BLENDING]: 'Produced by blending',
  [TRANSACTION_TYPES.PRODUCED_AMELIORATION]: 'Produced by amelioration',
  [TRANSACTION_TYPES.RECEIVED_BOND]: 'Received in bond',
  [TRANSACTION_TYPES.BOTTLED_DUMPED_BULK]: 'Bottled wine dumped to bulk',
  [TRANSACTION_TYPES.BULK_INVENTORY_GAIN]: 'Inventory gains',
  [TRANSACTION_TYPES.BULK_BOTTLED]: 'Bottled',
  [TRANSACTION_TYPES.BULK_REMOVED_TAXPAID]: 'Removed taxpaid',
  [TRANSACTION_TYPES.BULK_TRANSFERRED_BOND]: 'Transferred in bond',
  [TRANSACTION_TYPES.BULK_EXPORTED]: 'Exported',
  [TRANSACTION_TYPES.BULK_DESTROYED]: 'Destroyed',
  [TRANSACTION_TYPES.BULK_DISTILLATION]: 'Used for distillation',
  [TRANSACTION_TYPES.BULK_VINEGAR]: 'Vinegar stock',
  [TRANSACTION_TYPES.BULK_TASTING]: 'Tasting use',
  [TRANSACTION_TYPES.BULK_LOSSES_OTHER]: 'Losses (other)',
  [TRANSACTION_TYPES.BULK_LOSSES_INVENTORY]: 'Inventory losses',
  [TRANSACTION_TYPES.BOTTLED_ON_HAND_BEGIN]: 'On hand beginning of period',
  [TRANSACTION_TYPES.BOTTLED_PRODUCED]: 'Bottled',
  [TRANSACTION_TYPES.BOTTLED_RECEIVED_BOND]: 'Received in bond',
  [TRANSACTION_TYPES.BOTTLED_INVENTORY_GAIN]: 'Inventory gains',
  [TRANSACTION_TYPES.BOTTLED_REMOVED_TAXPAID]: 'Removed taxpaid',
  [TRANSACTION_TYPES.BOTTLED_TRANSFERRED_BOND]: 'Transferred in bond',
  [TRANSACTION_TYPES.BOTTLED_EXPORTED]: 'Exported',
  [TRANSACTION_TYPES.BOTTLED_TASTING]: 'Tasting use',
  [TRANSACTION_TYPES.BOTTLED_BREAKAGE]: 'Breakage/losses',
  [TRANSACTION_TYPES.BOTTLED_DUMPED_TO_BULK]: 'Dumped to bulk'
};

// Form line number mapping
export const TRANSACTION_LINE_NUMBERS = {
  // Part I Section A
  [TRANSACTION_TYPES.BULK_ON_HAND_BEGIN]: 'A-1',
  [TRANSACTION_TYPES.PRODUCED_FERMENTATION]: 'A-2',
  [TRANSACTION_TYPES.PRODUCED_SWEETENING]: 'A-3',
  [TRANSACTION_TYPES.PRODUCED_SPIRITS]: 'A-4',
  [TRANSACTION_TYPES.PRODUCED_BLENDING]: 'A-5',
  [TRANSACTION_TYPES.PRODUCED_AMELIORATION]: 'A-6',
  [TRANSACTION_TYPES.RECEIVED_BOND]: 'A-7',
  [TRANSACTION_TYPES.BOTTLED_DUMPED_BULK]: 'A-8',
  [TRANSACTION_TYPES.BULK_INVENTORY_GAIN]: 'A-9',
  [TRANSACTION_TYPES.BULK_BOTTLED]: 'A-13',
  [TRANSACTION_TYPES.BULK_REMOVED_TAXPAID]: 'A-14',
  [TRANSACTION_TYPES.BULK_TRANSFERRED_BOND]: 'A-15',
  [TRANSACTION_TYPES.BULK_EXPORTED]: 'A-16',
  [TRANSACTION_TYPES.BULK_DESTROYED]: 'A-17',
  [TRANSACTION_TYPES.BULK_DISTILLATION]: 'A-18',
  [TRANSACTION_TYPES.BULK_VINEGAR]: 'A-19',
  [TRANSACTION_TYPES.BULK_TASTING]: 'A-20',
  [TRANSACTION_TYPES.BULK_LOSSES_OTHER]: 'A-29',
  [TRANSACTION_TYPES.BULK_LOSSES_INVENTORY]: 'A-30',

  // Part I Section B
  [TRANSACTION_TYPES.BOTTLED_ON_HAND_BEGIN]: 'B-1',
  [TRANSACTION_TYPES.BOTTLED_PRODUCED]: 'B-2',
  [TRANSACTION_TYPES.BOTTLED_RECEIVED_BOND]: 'B-5',
  [TRANSACTION_TYPES.BOTTLED_INVENTORY_GAIN]: 'B-6',
  [TRANSACTION_TYPES.BOTTLED_REMOVED_TAXPAID]: 'B-8',
  [TRANSACTION_TYPES.BOTTLED_TRANSFERRED_BOND]: 'B-9',
  [TRANSACTION_TYPES.BOTTLED_EXPORTED]: 'B-10',
  [TRANSACTION_TYPES.BOTTLED_TASTING]: 'B-11',
  [TRANSACTION_TYPES.BOTTLED_BREAKAGE]: 'B-12',
  [TRANSACTION_TYPES.BOTTLED_DUMPED_TO_BULK]: 'B-13'
};

// =====================================================
// BOND STATUS
// =====================================================

export const BOND_STATUS = {
  IN_BOND: 'in_bond',
  TAXPAID: 'taxpaid',
  EXPORTED: 'exported',
  TRANSFERRED: 'transferred'
};

export const BOND_STATUS_LABELS = {
  [BOND_STATUS.IN_BOND]: 'In Bond',
  [BOND_STATUS.TAXPAID]: 'Tax Paid',
  [BOND_STATUS.EXPORTED]: 'Exported',
  [BOND_STATUS.TRANSFERRED]: 'Transferred'
};

// =====================================================
// REPORTING PERIODS
// =====================================================

export const REPORTING_PERIODS = {
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
  ANNUAL: 'annual'
};

export const REPORTING_PERIOD_LABELS = {
  [REPORTING_PERIODS.MONTHLY]: 'Monthly',
  [REPORTING_PERIODS.QUARTERLY]: 'Quarterly',
  [REPORTING_PERIODS.ANNUAL]: 'Annual'
};

// =====================================================
// TAX CLASS DETERMINATION
// =====================================================

/**
 * Determine the TTB tax class based on wine type and alcohol percentage
 *
 * @param {number|null} alcoholPct - Alcohol by volume percentage
 * @param {string} wineType - Wine type (still, sparkling_bf, sparkling_bp, etc.)
 * @param {boolean} isHardCider - Whether it's made from apples/pears
 * @returns {string} Tax class identifier
 */
export function determineTTBTaxClass(alcoholPct, wineType = 'still', isHardCider = false) {
  // Hard cider takes precedence if flagged or wine_type is hard_cider
  if (isHardCider || wineType === WINE_TYPES.HARD_CIDER) {
    return TAX_CLASSES.HARD_CIDER;
  }

  // Sparkling wines
  if (wineType === WINE_TYPES.SPARKLING_BF) {
    return TAX_CLASSES.SPARKLING_BF;
  }
  if (wineType === WINE_TYPES.SPARKLING_BP) {
    return TAX_CLASSES.SPARKLING_BP;
  }

  // Artificially carbonated
  if (wineType === WINE_TYPES.ARTIFICIALLY_CARBONATED) {
    return TAX_CLASSES.ARTIFICIALLY_CARBONATED;
  }

  // Still wines classified by ABV
  const abv = parseFloat(alcoholPct);
  if (isNaN(abv) || abv <= 16) {
    return TAX_CLASSES.TABLE_WINE_16;
  }
  if (abv <= 21) {
    return TAX_CLASSES.TABLE_WINE_21;
  }
  return TAX_CLASSES.TABLE_WINE_24;
}

/**
 * Check if ABV change would result in a different tax class
 *
 * @param {number} oldAbv - Previous ABV
 * @param {number} newAbv - New ABV
 * @param {string} wineType - Wine type
 * @returns {object|null} { oldClass, newClass, warning } or null if no change
 */
export function checkTaxClassChange(oldAbv, newAbv, wineType = 'still') {
  const oldClass = determineTTBTaxClass(oldAbv, wineType);
  const newClass = determineTTBTaxClass(newAbv, wineType);

  if (oldClass !== newClass) {
    return {
      oldClass,
      newClass,
      oldLabel: TAX_CLASS_LABELS[oldClass],
      newLabel: TAX_CLASS_LABELS[newClass],
      warning: `ABV change from ${oldAbv}% to ${newAbv}% moves this wine from ${TAX_CLASS_SHORT_LABELS[oldClass]} to ${TAX_CLASS_SHORT_LABELS[newClass]} tax class.`
    };
  }

  return null;
}

/**
 * Get the form column letter for a tax class
 *
 * @param {string} taxClass - Tax class identifier
 * @returns {string} Column letter (a-f)
 */
export function getTaxClassColumn(taxClass) {
  return TAX_CLASS_COLUMNS[taxClass] || 'a';
}

// =====================================================
// VOLUME CONVERSIONS
// =====================================================

const LITERS_PER_GALLON = 3.78541;
const ML_PER_GALLON = 3785.41;

/**
 * Convert liters to gallons
 * @param {number} liters
 * @returns {number} gallons
 */
export function litersToGallons(liters) {
  return liters / LITERS_PER_GALLON;
}

/**
 * Convert gallons to liters
 * @param {number} gallons
 * @returns {number} liters
 */
export function gallonsToLiters(gallons) {
  return gallons * LITERS_PER_GALLON;
}

/**
 * Calculate gallons from bottle count and size
 * @param {number} bottles - Number of bottles
 * @param {number} bottleMl - Bottle size in ml (default 750)
 * @returns {number} gallons
 */
export function bottlesToGallons(bottles, bottleMl = 750) {
  return (bottles * bottleMl) / ML_PER_GALLON;
}

/**
 * Calculate case equivalent in gallons
 * @param {number} cases - Number of cases
 * @param {number} bottlesPerCase - Bottles per case (default 12)
 * @param {number} bottleMl - Bottle size in ml (default 750)
 * @returns {number} gallons
 */
export function casesToGallons(cases, bottlesPerCase = 12, bottleMl = 750) {
  return bottlesToGallons(cases * bottlesPerCase, bottleMl);
}

// =====================================================
// DATE HELPERS
// =====================================================

/**
 * Get the reporting period dates for a given date
 * @param {Date} date - Reference date
 * @param {string} periodType - 'monthly', 'quarterly', 'annual'
 * @returns {object} { start, end, label }
 */
export function getReportingPeriod(date, periodType = 'monthly') {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = d.getMonth();

  switch (periodType) {
    case REPORTING_PERIODS.MONTHLY: {
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0);
      const label = start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      return { start, end, label };
    }

    case REPORTING_PERIODS.QUARTERLY: {
      const quarter = Math.floor(month / 3);
      const start = new Date(year, quarter * 3, 1);
      const end = new Date(year, (quarter + 1) * 3, 0);
      const label = `Q${quarter + 1} ${year}`;
      return { start, end, label };
    }

    case REPORTING_PERIODS.ANNUAL: {
      const start = new Date(year, 0, 1);
      const end = new Date(year, 11, 31);
      const label = `${year}`;
      return { start, end, label };
    }

    default:
      throw new Error(`Unknown period type: ${periodType}`);
  }
}

/**
 * Get available reporting periods for dropdown
 * @param {string} periodType - 'monthly', 'quarterly', 'annual'
 * @param {number} yearsBack - How many years to include
 * @returns {Array} Array of { value, label, start, end }
 */
export function getAvailablePeriods(periodType = 'monthly', yearsBack = 2) {
  const periods = [];
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  for (let y = currentYear; y >= currentYear - yearsBack; y--) {
    switch (periodType) {
      case REPORTING_PERIODS.MONTHLY: {
        const endMonth = y === currentYear ? currentMonth : 11;
        for (let m = endMonth; m >= 0; m--) {
          const start = new Date(y, m, 1);
          const end = new Date(y, m + 1, 0);
          periods.push({
            value: `${y}-${String(m + 1).padStart(2, '0')}`,
            label: start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
            start,
            end
          });
        }
        break;
      }

      case REPORTING_PERIODS.QUARTERLY: {
        const endQuarter = y === currentYear ? Math.floor(currentMonth / 3) : 3;
        for (let q = endQuarter; q >= 0; q--) {
          const start = new Date(y, q * 3, 1);
          const end = new Date(y, (q + 1) * 3, 0);
          periods.push({
            value: `${y}-Q${q + 1}`,
            label: `Q${q + 1} ${y}`,
            start,
            end
          });
        }
        break;
      }

      case REPORTING_PERIODS.ANNUAL: {
        const start = new Date(y, 0, 1);
        const end = new Date(y, 11, 31);
        periods.push({
          value: `${y}`,
          label: `${y}`,
          start,
          end
        });
        break;
      }
    }
  }

  return periods;
}

/**
 * Format date for TTB form (MM/DD/YYYY)
 * @param {Date|string} date
 * @returns {string}
 */
export function formatTTBDate(date) {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric'
  });
}

// =====================================================
// FORM VALIDATION
// =====================================================

/**
 * Validate winery registration data
 * @param {object} data - Registration data
 * @returns {object} { valid, errors }
 */
export function validateWineryRegistration(data) {
  const errors = {};

  // Required fields for TTB compliance
  if (!data.operated_by?.trim()) {
    errors.operated_by = 'Business name is required';
  }

  if (!data.ein?.trim()) {
    errors.ein = 'EIN is required';
  } else if (!/^\d{2}-?\d{7}$/.test(data.ein.replace(/-/g, ''))) {
    errors.ein = 'EIN must be 9 digits (XX-XXXXXXX)';
  }

  if (!data.registry_number?.trim()) {
    errors.registry_number = 'TTB Registry Number is required';
  } else if (!/^BWC-[A-Z]{2}-\d+$/.test(data.registry_number)) {
    errors.registry_number = 'Registry number format: BWC-XX-####';
  }

  if (!data.premises_address?.trim()) {
    errors.premises_address = 'Premises address is required';
  }

  if (!data.premises_city?.trim()) {
    errors.premises_city = 'City is required';
  }

  if (!data.premises_state?.trim()) {
    errors.premises_state = 'State is required';
  } else if (!/^[A-Z]{2}$/.test(data.premises_state)) {
    errors.premises_state = 'Use 2-letter state code';
  }

  if (!data.premises_zip?.trim()) {
    errors.premises_zip = 'ZIP code is required';
  } else if (!/^\d{5}(-\d{4})?$/.test(data.premises_zip)) {
    errors.premises_zip = 'ZIP must be 5 or 9 digits';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Format EIN for display (XX-XXXXXXX)
 * @param {string} ein
 * @returns {string}
 */
export function formatEIN(ein) {
  if (!ein) return '';
  const digits = ein.replace(/\D/g, '');
  if (digits.length !== 9) return ein;
  return `${digits.slice(0, 2)}-${digits.slice(2)}`;
}

// =====================================================
// EXPORT HELPERS
// =====================================================

/**
 * Get all tax classes in order for form display
 * @returns {Array} Array of { id, label, column }
 */
export function getTaxClassesForForm() {
  return [
    { id: TAX_CLASSES.TABLE_WINE_16, label: TAX_CLASS_LABELS[TAX_CLASSES.TABLE_WINE_16], column: 'a' },
    { id: TAX_CLASSES.TABLE_WINE_21, label: TAX_CLASS_LABELS[TAX_CLASSES.TABLE_WINE_21], column: 'b' },
    { id: TAX_CLASSES.TABLE_WINE_24, label: TAX_CLASS_LABELS[TAX_CLASSES.TABLE_WINE_24], column: 'c' },
    { id: TAX_CLASSES.ARTIFICIALLY_CARBONATED, label: TAX_CLASS_LABELS[TAX_CLASSES.ARTIFICIALLY_CARBONATED], column: 'd' },
    { id: TAX_CLASSES.SPARKLING_BF, label: TAX_CLASS_LABELS[TAX_CLASSES.SPARKLING_BF], column: 'e' },
    { id: TAX_CLASSES.SPARKLING_BP, label: TAX_CLASS_LABELS[TAX_CLASSES.SPARKLING_BP], column: 'e' },
    { id: TAX_CLASSES.HARD_CIDER, label: TAX_CLASS_LABELS[TAX_CLASSES.HARD_CIDER], column: 'f' }
  ];
}

/**
 * Get wine types for dropdown
 * @returns {Array} Array of { value, label }
 */
export function getWineTypeOptions() {
  return Object.entries(WINE_TYPE_LABELS).map(([value, label]) => ({
    value,
    label
  }));
}

/**
 * Get transaction types for dropdown (grouped by section)
 * @returns {object} { bulk_additions, bulk_removals, bottled_additions, bottled_removals }
 */
export function getTransactionTypeOptions() {
  return {
    bulk_additions: [
      { value: TRANSACTION_TYPES.PRODUCED_FERMENTATION, label: 'Produced by fermentation', line: 'A-2' },
      { value: TRANSACTION_TYPES.PRODUCED_SWEETENING, label: 'Produced by sweetening', line: 'A-3' },
      { value: TRANSACTION_TYPES.PRODUCED_SPIRITS, label: 'Produced by wine spirits', line: 'A-4' },
      { value: TRANSACTION_TYPES.PRODUCED_BLENDING, label: 'Produced by blending', line: 'A-5' },
      { value: TRANSACTION_TYPES.PRODUCED_AMELIORATION, label: 'Produced by amelioration', line: 'A-6' },
      { value: TRANSACTION_TYPES.RECEIVED_BOND, label: 'Received in bond', line: 'A-7' },
      { value: TRANSACTION_TYPES.BOTTLED_DUMPED_BULK, label: 'Dumped from bottle to bulk', line: 'A-8' },
      { value: TRANSACTION_TYPES.BULK_INVENTORY_GAIN, label: 'Inventory gains', line: 'A-9' }
    ],
    bulk_removals: [
      { value: TRANSACTION_TYPES.BULK_BOTTLED, label: 'Bottled', line: 'A-13' },
      { value: TRANSACTION_TYPES.BULK_REMOVED_TAXPAID, label: 'Removed taxpaid', line: 'A-14' },
      { value: TRANSACTION_TYPES.BULK_TRANSFERRED_BOND, label: 'Transferred in bond', line: 'A-15' },
      { value: TRANSACTION_TYPES.BULK_EXPORTED, label: 'Exported', line: 'A-16' },
      { value: TRANSACTION_TYPES.BULK_TASTING, label: 'Tasting use', line: 'A-20' },
      { value: TRANSACTION_TYPES.BULK_LOSSES_OTHER, label: 'Losses (other)', line: 'A-29' },
      { value: TRANSACTION_TYPES.BULK_LOSSES_INVENTORY, label: 'Inventory losses', line: 'A-30' }
    ],
    bottled_additions: [
      { value: TRANSACTION_TYPES.BOTTLED_PRODUCED, label: 'Bottled', line: 'B-2' },
      { value: TRANSACTION_TYPES.BOTTLED_RECEIVED_BOND, label: 'Received in bond', line: 'B-5' },
      { value: TRANSACTION_TYPES.BOTTLED_INVENTORY_GAIN, label: 'Inventory gains', line: 'B-6' }
    ],
    bottled_removals: [
      { value: TRANSACTION_TYPES.BOTTLED_REMOVED_TAXPAID, label: 'Removed taxpaid', line: 'B-8' },
      { value: TRANSACTION_TYPES.BOTTLED_TRANSFERRED_BOND, label: 'Transferred in bond', line: 'B-9' },
      { value: TRANSACTION_TYPES.BOTTLED_EXPORTED, label: 'Exported', line: 'B-10' },
      { value: TRANSACTION_TYPES.BOTTLED_TASTING, label: 'Tasting use', line: 'B-11' },
      { value: TRANSACTION_TYPES.BOTTLED_BREAKAGE, label: 'Breakage/losses', line: 'B-12' },
      { value: TRANSACTION_TYPES.BOTTLED_DUMPED_TO_BULK, label: 'Dumped to bulk', line: 'B-13' }
    ]
  };
}
