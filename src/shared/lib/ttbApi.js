/**
 * TTB API
 * Supabase CRUD operations for TTB Form 5120.17 compliance
 */

import { supabase } from './supabaseClient';
import { determineTTBTaxClass, bottlesToGallons } from './ttbUtils';

// =====================================================
// WINERY REGISTRATION
// =====================================================

/**
 * Get the winery registration for the current user
 * @returns {Promise<{data: object|null, error: Error|null}>}
 */
export async function getWineryRegistration() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: new Error('No user logged in') };

  return supabase
    .from('ttb_winery_registration')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();
}

/**
 * Create or update winery registration
 * @param {object} registration - Registration data
 * @returns {Promise<{data: object|null, error: Error|null}>}
 */
export async function saveWineryRegistration(registration) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: new Error('No user logged in') };

  return supabase
    .from('ttb_winery_registration')
    .upsert({
      ...registration,
      user_id: user.id
    }, {
      onConflict: 'user_id'
    })
    .select()
    .single();
}

/**
 * Delete winery registration
 * @returns {Promise<{data: null, error: Error|null}>}
 */
export async function deleteWineryRegistration() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: new Error('No user logged in') };

  return supabase
    .from('ttb_winery_registration')
    .delete()
    .eq('user_id', user.id);
}

// =====================================================
// TTB TRANSACTIONS
// =====================================================

/**
 * List TTB transactions with optional filters
 * @param {object} filters - Filter options
 * @param {Date|string} filters.startDate - Start of date range
 * @param {Date|string} filters.endDate - End of date range
 * @param {string} filters.transactionType - Transaction type filter
 * @param {string} filters.taxClass - Tax class filter
 * @param {string} filters.lotId - Lot ID filter
 * @param {number} filters.limit - Max results (default 100)
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
export async function listTTBTransactions(filters = {}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: null };

  let query = supabase
    .from('ttb_transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('transaction_date', { ascending: false });

  if (filters.startDate) {
    query = query.gte('transaction_date', filters.startDate);
  }
  if (filters.endDate) {
    query = query.lte('transaction_date', filters.endDate);
  }
  if (filters.transactionType) {
    query = query.eq('transaction_type', filters.transactionType);
  }
  if (filters.taxClass) {
    query = query.eq('tax_class', filters.taxClass);
  }
  if (filters.lotId) {
    query = query.eq('lot_id', filters.lotId);
  }

  const limit = filters.limit || 100;
  query = query.limit(limit);

  return query;
}

/**
 * Get a single TTB transaction
 * @param {string} transactionId - Transaction UUID
 * @returns {Promise<{data: object|null, error: Error|null}>}
 */
export async function getTTBTransaction(transactionId) {
  return supabase
    .from('ttb_transactions')
    .select('*')
    .eq('id', transactionId)
    .single();
}

/**
 * Create a TTB transaction (manual entry)
 * @param {object} transaction - Transaction data
 * @returns {Promise<{data: object|null, error: Error|null}>}
 */
export async function createTTBTransaction(transaction) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: new Error('No user logged in') };

  return supabase
    .from('ttb_transactions')
    .insert({
      ...transaction,
      user_id: user.id,
      created_by: user.id
    })
    .select()
    .single();
}

/**
 * Update a TTB transaction
 * @param {string} transactionId - Transaction UUID
 * @param {object} updates - Fields to update
 * @returns {Promise<{data: object|null, error: Error|null}>}
 */
export async function updateTTBTransaction(transactionId, updates) {
  return supabase
    .from('ttb_transactions')
    .update(updates)
    .eq('id', transactionId)
    .select()
    .single();
}

/**
 * Delete a TTB transaction
 * @param {string} transactionId - Transaction UUID
 * @returns {Promise<{error: Error|null}>}
 */
export async function deleteTTBTransaction(transactionId) {
  return supabase
    .from('ttb_transactions')
    .delete()
    .eq('id', transactionId);
}

/**
 * Create TTB transaction from production event (auto-logging)
 * Prevents duplicates using source_event_type + source_event_id
 * @param {object} params - Transaction parameters
 * @param {string} params.sourceEventType - Event type (e.g., 'lot_status_change')
 * @param {string} params.sourceEventId - Source event UUID
 * @param {string} params.transactionType - TTB transaction type
 * @param {string} params.taxClass - Tax class
 * @param {number} params.volumeGallons - Volume in gallons
 * @param {string} params.lotId - Related lot UUID
 * @param {string} params.containerId - Related container UUID
 * @param {string} params.bottlingRunId - Related bottling run UUID
 * @param {Date|string} params.transactionDate - Transaction date
 * @param {string} params.notes - Optional notes
 * @returns {Promise<{data: object|null, error: Error|null}>}
 */
export async function logTTBTransaction({
  sourceEventType,
  sourceEventId,
  transactionType,
  taxClass,
  volumeGallons,
  lotId = null,
  containerId = null,
  bottlingRunId = null,
  transactionDate = null,
  notes = null
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: new Error('No user logged in') };

  return supabase
    .from('ttb_transactions')
    .insert({
      user_id: user.id,
      created_by: user.id,
      source_event_type: sourceEventType,
      source_event_id: sourceEventId,
      transaction_type: transactionType,
      tax_class: taxClass,
      volume_gallons: volumeGallons,
      lot_id: lotId,
      container_id: containerId,
      bottling_run_id: bottlingRunId,
      transaction_date: transactionDate || new Date().toISOString().split('T')[0],
      notes
    })
    .select()
    .single();
}

/**
 * Get transactions for a specific lot
 * @param {string} lotId - Lot UUID
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
export async function getLotTTBTransactions(lotId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: null };

  return supabase
    .from('ttb_transactions')
    .select('*')
    .eq('user_id', user.id)
    .eq('lot_id', lotId)
    .order('transaction_date', { ascending: false });
}

/**
 * Get aggregated volumes by tax class for a date range
 * @param {Date|string} startDate
 * @param {Date|string} endDate
 * @returns {Promise<{data: object, error: Error|null}>}
 */
export async function getVolumesByTaxClass(startDate, endDate) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: new Error('No user logged in') };

  const { data, error } = await supabase
    .from('ttb_transactions')
    .select('transaction_type, tax_class, volume_gallons')
    .eq('user_id', user.id)
    .gte('transaction_date', startDate)
    .lte('transaction_date', endDate);

  if (error) return { data: null, error };

  // Aggregate by transaction type and tax class
  const aggregated = {};
  for (const tx of data) {
    const key = `${tx.transaction_type}|${tx.tax_class}`;
    aggregated[key] = (aggregated[key] || 0) + parseFloat(tx.volume_gallons);
  }

  return { data: aggregated, error: null };
}

// =====================================================
// TTB REPORT PERIODS
// =====================================================

/**
 * List TTB report periods
 * @param {object} filters - Filter options
 * @param {string} filters.status - Report status filter
 * @param {number} filters.year - Year filter
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
export async function listTTBReports(filters = {}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: null };

  let query = supabase
    .from('ttb_report_periods')
    .select('*')
    .eq('user_id', user.id)
    .order('period_start', { ascending: false });

  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  if (filters.year) {
    const yearStart = `${filters.year}-01-01`;
    const yearEnd = `${filters.year}-12-31`;
    query = query.gte('period_start', yearStart).lte('period_end', yearEnd);
  }

  return query;
}

/**
 * Get a single TTB report
 * @param {string} reportId - Report UUID
 * @returns {Promise<{data: object|null, error: Error|null}>}
 */
export async function getTTBReport(reportId) {
  return supabase
    .from('ttb_report_periods')
    .select('*')
    .eq('id', reportId)
    .single();
}

/**
 * Get report by period dates
 * @param {Date|string} periodStart
 * @param {Date|string} periodEnd
 * @returns {Promise<{data: object|null, error: Error|null}>}
 */
export async function getTTBReportByPeriod(periodStart, periodEnd) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: new Error('No user logged in') };

  return supabase
    .from('ttb_report_periods')
    .select('*')
    .eq('user_id', user.id)
    .eq('period_start', periodStart)
    .eq('period_end', periodEnd)
    .maybeSingle();
}

/**
 * Create or update a TTB report
 * @param {object} report - Report data
 * @returns {Promise<{data: object|null, error: Error|null}>}
 */
export async function saveTTBReport(report) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: new Error('No user logged in') };

  return supabase
    .from('ttb_report_periods')
    .upsert({
      ...report,
      user_id: user.id
    }, {
      onConflict: 'user_id,period_start,period_end'
    })
    .select()
    .single();
}

/**
 * Update report status
 * @param {string} reportId - Report UUID
 * @param {string} status - New status
 * @param {string} confirmationNumber - Optional confirmation number
 * @returns {Promise<{data: object|null, error: Error|null}>}
 */
export async function updateTTBReportStatus(reportId, status, confirmationNumber = null) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: new Error('No user logged in') };

  const updates = { status };

  if (status === 'submitted') {
    updates.submitted_at = new Date().toISOString();
    updates.submitted_by = user.id;
    if (confirmationNumber) {
      updates.confirmation_number = confirmationNumber;
    }
  }

  return supabase
    .from('ttb_report_periods')
    .update(updates)
    .eq('id', reportId)
    .select()
    .single();
}

/**
 * Delete a TTB report (only drafts)
 * @param {string} reportId - Report UUID
 * @returns {Promise<{error: Error|null}>}
 */
export async function deleteTTBReport(reportId) {
  return supabase
    .from('ttb_report_periods')
    .delete()
    .eq('id', reportId)
    .eq('status', 'draft');
}

// =====================================================
// LOT TAX CLASS MANAGEMENT
// =====================================================

/**
 * Update lot wine type and recalculate tax class
 * @param {string} lotId - Lot UUID
 * @param {string} wineType - Wine type
 * @param {number} alcoholPct - Alcohol percentage (optional)
 * @returns {Promise<{data: object|null, error: Error|null}>}
 */
export async function updateLotWineType(lotId, wineType, alcoholPct = null) {
  // Get current lot data if alcoholPct not provided
  let abv = alcoholPct;
  if (abv === null) {
    const { data: lot } = await supabase
      .from('production_lots')
      .select('current_alcohol_pct')
      .eq('id', lotId)
      .single();

    abv = lot?.current_alcohol_pct;
  }

  const taxClass = determineTTBTaxClass(abv, wineType);

  return supabase
    .from('production_lots')
    .update({
      wine_type: wineType,
      ttb_tax_class: taxClass
    })
    .eq('id', lotId)
    .select()
    .single();
}

/**
 * Update lot bond status
 * @param {string} lotId - Lot UUID
 * @param {string} bondStatus - Bond status
 * @returns {Promise<{data: object|null, error: Error|null}>}
 */
export async function updateLotBondStatus(lotId, bondStatus) {
  return supabase
    .from('production_lots')
    .update({ bond_status: bondStatus })
    .eq('id', lotId)
    .select()
    .single();
}

/**
 * Recalculate tax class for a lot based on current alcohol
 * @param {string} lotId - Lot UUID
 * @returns {Promise<{data: object|null, error: Error|null}>}
 */
export async function recalculateLotTaxClass(lotId) {
  const { data: lot, error: fetchError } = await supabase
    .from('production_lots')
    .select('wine_type, current_alcohol_pct')
    .eq('id', lotId)
    .single();

  if (fetchError) return { data: null, error: fetchError };

  const taxClass = determineTTBTaxClass(lot.current_alcohol_pct, lot.wine_type);

  return supabase
    .from('production_lots')
    .update({ ttb_tax_class: taxClass })
    .eq('id', lotId)
    .select()
    .single();
}

/**
 * Batch update tax classes for all lots
 * Useful after initial setup or migration
 * @returns {Promise<{data: {updated: number}, error: Error|null}>}
 */
export async function batchUpdateLotTaxClasses() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: new Error('No user logged in') };

  const { data: lots, error: fetchError } = await supabase
    .from('production_lots')
    .select('id, wine_type, current_alcohol_pct')
    .eq('user_id', user.id)
    .is('archived_at', null);

  if (fetchError) return { data: null, error: fetchError };

  let updated = 0;
  for (const lot of lots) {
    const taxClass = determineTTBTaxClass(lot.current_alcohol_pct, lot.wine_type || 'still');

    const { error } = await supabase
      .from('production_lots')
      .update({ ttb_tax_class: taxClass })
      .eq('id', lot.id);

    if (!error) updated++;
  }

  return { data: { updated }, error: null };
}

// =====================================================
// BOTTLED INVENTORY TTB FIELDS
// =====================================================

/**
 * Update bottled inventory TTB fields
 * @param {string} inventoryId - Inventory UUID
 * @param {object} updates - TTB fields to update
 * @returns {Promise<{data: object|null, error: Error|null}>}
 */
export async function updateBottledInventoryTTB(inventoryId, updates) {
  return supabase
    .from('bottled_inventory')
    .update(updates)
    .eq('id', inventoryId)
    .select()
    .single();
}

/**
 * Calculate and set gallons equivalent for bottled inventory
 * @param {string} inventoryId - Inventory UUID
 * @returns {Promise<{data: object|null, error: Error|null}>}
 */
export async function calculateBottledGallons(inventoryId) {
  const { data: inventory, error: fetchError } = await supabase
    .from('bottled_inventory')
    .select('bottles_count, bottle_ml')
    .eq('id', inventoryId)
    .single();

  if (fetchError) return { data: null, error: fetchError };

  const gallons = bottlesToGallons(inventory.bottles_count, inventory.bottle_ml);

  return supabase
    .from('bottled_inventory')
    .update({ gallons_equivalent: gallons })
    .eq('id', inventoryId)
    .select()
    .single();
}

// =====================================================
// BULK OPERATIONS FOR REPORTING
// =====================================================

/**
 * Get current bulk wine inventory by tax class
 * @returns {Promise<{data: object, error: Error|null}>}
 */
export async function getBulkInventoryByTaxClass() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: new Error('No user logged in') };

  const { data: lots, error } = await supabase
    .from('production_lots')
    .select('ttb_tax_class, current_volume_gallons, bond_status')
    .eq('user_id', user.id)
    .is('archived_at', null)
    .not('status', 'eq', 'bottled');

  if (error) return { data: null, error };

  // Aggregate by tax class
  const inventory = {};
  for (const lot of lots) {
    const taxClass = lot.ttb_tax_class || 'table_wine_16';
    if (!inventory[taxClass]) {
      inventory[taxClass] = { in_bond: 0, taxpaid: 0, total: 0 };
    }

    const volume = parseFloat(lot.current_volume_gallons) || 0;
    inventory[taxClass].total += volume;

    if (lot.bond_status === 'taxpaid') {
      inventory[taxClass].taxpaid += volume;
    } else {
      inventory[taxClass].in_bond += volume;
    }
  }

  return { data: inventory, error: null };
}

/**
 * Get current bottled inventory by tax class
 * @returns {Promise<{data: object, error: Error|null}>}
 */
export async function getBottledInventoryByTaxClass() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: new Error('No user logged in') };

  const { data: items, error } = await supabase
    .from('bottled_inventory')
    .select('ttb_tax_class, gallons_equivalent, bottles_count, bottle_ml, bond_status')
    .eq('user_id', user.id)
    .in('status', ['available', 'quarantine', 'needs_lab']);

  if (error) return { data: null, error };

  // Aggregate by tax class
  const inventory = {};
  for (const item of items) {
    const taxClass = item.ttb_tax_class || 'table_wine_16';
    if (!inventory[taxClass]) {
      inventory[taxClass] = { in_bond: 0, taxpaid: 0, total: 0, bottles: 0 };
    }

    // Use stored gallons_equivalent or calculate
    const gallons = item.gallons_equivalent || bottlesToGallons(item.bottles_count, item.bottle_ml);
    inventory[taxClass].total += gallons;
    inventory[taxClass].bottles += item.bottles_count;

    if (item.bond_status === 'taxpaid') {
      inventory[taxClass].taxpaid += gallons;
    } else {
      inventory[taxClass].in_bond += gallons;
    }
  }

  return { data: inventory, error: null };
}

/**
 * Get production summary for a period (for Part VII - In Fermenters)
 * @returns {Promise<{data: object, error: Error|null}>}
 */
export async function getActiveFermentationsByTaxClass() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: new Error('No user logged in') };

  const { data: lots, error } = await supabase
    .from('production_lots')
    .select('ttb_tax_class, current_volume_gallons, varietal')
    .eq('user_id', user.id)
    .eq('status', 'fermenting')
    .is('archived_at', null);

  if (error) return { data: null, error };

  const summary = {};
  for (const lot of lots) {
    const taxClass = lot.ttb_tax_class || 'table_wine_16';
    if (!summary[taxClass]) {
      summary[taxClass] = { volume: 0, count: 0 };
    }
    summary[taxClass].volume += parseFloat(lot.current_volume_gallons) || 0;
    summary[taxClass].count += 1;
  }

  return { data: summary, error: null };
}
