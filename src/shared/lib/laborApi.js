import { supabase } from './supabaseClient';

/* ================================================================
   LABOR TRACKING API
   Supabase CRUD helpers for labor management
================================================================ */

// =====================================================
// TIME ENTRIES
// =====================================================

/**
 * List time entries
 * @param {Object} filters - Optional filters (memberId, startDate, endDate, status)
 * @returns {Promise} Supabase query response
 */
export async function listTimeEntries(filters = {}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: null };

  let query = supabase
    .from('labor_time_entries')
    .select(`
      *,
      organization_members(id, full_name, role, email, phone),
      vineyard_blocks(id, name, variety, acres)
    `)
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .order('clock_in', { ascending: false });

  if (filters.memberId) {
    query = query.eq('member_id', filters.memberId);
  }

  if (filters.startDate) {
    query = query.gte('date', filters.startDate);
  }

  if (filters.endDate) {
    query = query.lte('date', filters.endDate);
  }

  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  return query;
}

/**
 * Get a single time entry by ID
 * @param {string} entryId - Time entry ID
 * @returns {Promise} Supabase query response
 */
export async function getTimeEntry(entryId) {
  return supabase
    .from('labor_time_entries')
    .select(`
      *,
      organization_members(id, full_name, role),
      vineyard_blocks(id, name)
    `)
    .eq('id', entryId)
    .single();
}

/**
 * Create a new time entry
 * @param {Object} entry - Time entry data
 * @returns {Promise} Supabase query response
 */
export async function createTimeEntry(entry) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: new Error('No user logged in') };

  return supabase
    .from('labor_time_entries')
    .insert({
      ...entry,
      user_id: user.id
    })
    .select(`
      *,
      organization_members(id, full_name, role),
      vineyard_blocks(id, name)
    `)
    .single();
}

/**
 * Update an existing time entry
 * @param {string} entryId - Time entry ID
 * @param {Object} updates - Fields to update
 * @returns {Promise} Supabase query response
 */
export async function updateTimeEntry(entryId, updates) {
  return supabase
    .from('labor_time_entries')
    .update(updates)
    .eq('id', entryId)
    .select(`
      *,
      organization_members(id, full_name, role),
      vineyard_blocks(id, name)
    `)
    .single();
}

/**
 * Delete a time entry
 * @param {string} entryId - Time entry ID
 * @returns {Promise} Supabase query response
 */
export async function deleteTimeEntry(entryId) {
  return supabase
    .from('labor_time_entries')
    .delete()
    .eq('id', entryId);
}

/**
 * Approve time entry
 */
export async function approveTimeEntry(entryId) {
  return updateTimeEntry(entryId, { status: 'approved', approved_at: new Date().toISOString() });
}

/**
 * Reject time entry
 */
export async function rejectTimeEntry(entryId, reason = null) {
  return updateTimeEntry(entryId, { status: 'rejected', rejection_reason: reason });
}

// =====================================================
// CERTIFICATIONS
// =====================================================

/**
 * List certifications
 * @param {string} memberId - Optional member ID to filter by
 * @returns {Promise} Supabase query response
 */
export async function listCertifications(memberId = null) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: null };

  let query = supabase
    .from('labor_certifications')
    .select(`
      *,
      organization_members(id, full_name, role)
    `)
    .eq('user_id', user.id)
    .order('expiry_date', { ascending: true });

  if (memberId) {
    query = query.eq('member_id', memberId);
  }

  return query;
}

/**
 * Create certification
 */
export async function createCertification(cert) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: new Error('No user logged in') };

  return supabase
    .from('labor_certifications')
    .insert({
      ...cert,
      user_id: user.id
    })
    .select(`
      *,
      organization_members(id, full_name)
    `)
    .single();
}

/**
 * Update certification
 */
export async function updateCertification(certId, updates) {
  return supabase
    .from('labor_certifications')
    .update(updates)
    .eq('id', certId)
    .select(`
      *,
      organization_members(id, full_name)
    `)
    .single();
}

/**
 * Delete certification
 */
export async function deleteCertification(certId) {
  return supabase
    .from('labor_certifications')
    .delete()
    .eq('id', certId);
}

// =====================================================
// ANALYTICS
// =====================================================

/**
 * Get labor summary for a date range
 */
export async function getLaborSummary(startDate, endDate) {
  const { data: entries, error } = await listTimeEntries({ startDate, endDate, status: 'approved' });

  if (error || !entries) {
    return { data: null, error };
  }

  const summary = {
    totalEntries: entries.length,
    totalHours: 0,
    totalRegularHours: 0,
    totalOvertimeHours: 0,
    totalPayroll: 0,
    byMember: {},
    byTask: {},
    byField: {}
  };

  entries.forEach(entry => {
    const hours = calculateEntryHours(entry);
    summary.totalHours += hours;

    // By member
    const memberId = entry.member_id;
    if (!summary.byMember[memberId]) {
      summary.byMember[memberId] = {
        name: entry.organization_members?.full_name || 'Unknown',
        hours: 0,
        entries: 0,
        pay: 0
      };
    }
    summary.byMember[memberId].hours += hours;
    summary.byMember[memberId].entries++;

    // By task
    const task = entry.task || 'Unassigned';
    if (!summary.byTask[task]) {
      summary.byTask[task] = { hours: 0, entries: 0 };
    }
    summary.byTask[task].hours += hours;
    summary.byTask[task].entries++;

    // By field
    const fieldName = entry.vineyard_blocks?.name || 'Unassigned';
    if (!summary.byField[fieldName]) {
      summary.byField[fieldName] = { hours: 0, entries: 0 };
    }
    summary.byField[fieldName].hours += hours;
    summary.byField[fieldName].entries++;
  });

  return { data: summary, error: null };
}

/**
 * Calculate hours for a time entry
 */
function calculateEntryHours(entry) {
  if (!entry.clock_in || !entry.clock_out) return 0;

  const [inH, inM] = entry.clock_in.split(':').map(Number);
  const [outH, outM] = entry.clock_out.split(':').map(Number);

  const inMins = inH * 60 + inM;
  const outMins = outH * 60 + outM;

  let totalMins = outMins - inMins;
  if (totalMins < 0) totalMins += 24 * 60; // Handle overnight

  totalMins -= (entry.break_minutes || 0);

  return Math.max(0, totalMins / 60);
}

/**
 * Get expiring certifications
 */
export async function getExpiringCertifications(daysAhead = 30) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: null };

  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);

  return supabase
    .from('labor_certifications')
    .select(`
      *,
      organization_members(id, full_name, role)
    `)
    .eq('user_id', user.id)
    .lte('expiry_date', futureDate.toISOString().split('T')[0])
    .gte('expiry_date', new Date().toISOString().split('T')[0])
    .order('expiry_date', { ascending: true });
}
