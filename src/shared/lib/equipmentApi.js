import { supabase } from './supabaseClient';

/* ================================================================
   EQUIPMENT API
   Supabase CRUD helpers for equipment management
================================================================ */

// =====================================================
// EQUIPMENT
// =====================================================

/**
 * List all equipment
 */
export async function listEquipment(includeArchived = false) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: null };

  let query = supabase
    .from('equipment')
    .select('*')
    .eq('user_id', user.id)
    .order('name', { ascending: true });

  if (!includeArchived) {
    query = query.is('archived_at', null);
  }

  return query;
}

/**
 * Get a single equipment by ID
 */
export async function getEquipment(equipmentId) {
  return supabase
    .from('equipment')
    .select('*')
    .eq('id', equipmentId)
    .single();
}

/**
 * Create new equipment
 */
export async function createEquipment(equipment) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: new Error('No user logged in') };

  return supabase
    .from('equipment')
    .insert({
      ...equipment,
      user_id: user.id
    })
    .select()
    .single();
}

/**
 * Update equipment
 */
export async function updateEquipment(equipmentId, updates) {
  return supabase
    .from('equipment')
    .update(updates)
    .eq('id', equipmentId)
    .select()
    .single();
}

/**
 * Delete equipment
 */
export async function deleteEquipment(equipmentId) {
  return supabase
    .from('equipment')
    .delete()
    .eq('id', equipmentId);
}

/**
 * Archive equipment
 */
export async function archiveEquipment(equipmentId) {
  return updateEquipment(equipmentId, { archived_at: new Date().toISOString() });
}

/**
 * Unarchive equipment
 */
export async function unarchiveEquipment(equipmentId) {
  return updateEquipment(equipmentId, { archived_at: null });
}

// =====================================================
// MAINTENANCE RECORDS
// =====================================================

/**
 * List maintenance records for equipment
 */
export async function listMaintenanceRecords(equipmentId = null, startDate = null, endDate = null) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: null };

  let query = supabase
    .from('equipment_maintenance_records')
    .select(`
      *,
      equipment(id, name, type)
    `)
    .eq('user_id', user.id)
    .order('service_date', { ascending: false });

  if (equipmentId) {
    query = query.eq('equipment_id', equipmentId);
  }

  if (startDate) {
    query = query.gte('service_date', startDate);
  }

  if (endDate) {
    query = query.lte('service_date', endDate);
  }

  return query;
}

/**
 * Get a single maintenance record
 */
export async function getMaintenanceRecord(recordId) {
  return supabase
    .from('equipment_maintenance_records')
    .select(`
      *,
      equipment(id, name, type)
    `)
    .eq('id', recordId)
    .single();
}

/**
 * Create maintenance record
 */
export async function createMaintenanceRecord(record) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: new Error('No user logged in') };

  return supabase
    .from('equipment_maintenance_records')
    .insert({
      ...record,
      user_id: user.id
    })
    .select(`
      *,
      equipment(id, name, type)
    `)
    .single();
}

/**
 * Update maintenance record
 */
export async function updateMaintenanceRecord(recordId, updates) {
  return supabase
    .from('equipment_maintenance_records')
    .update(updates)
    .eq('id', recordId)
    .select(`
      *,
      equipment(id, name, type)
    `)
    .single();
}

/**
 * Delete maintenance record
 */
export async function deleteMaintenanceRecord(recordId) {
  return supabase
    .from('equipment_maintenance_records')
    .delete()
    .eq('id', recordId);
}

// =====================================================
// MAINTENANCE SCHEDULES
// =====================================================

/**
 * List maintenance schedules
 */
export async function listMaintenanceSchedules(equipmentId = null, activeOnly = false) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: null };

  let query = supabase
    .from('equipment_maintenance_schedules')
    .select(`
      *,
      equipment(id, name, type)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (equipmentId) {
    query = query.eq('equipment_id', equipmentId);
  }

  if (activeOnly) {
    query = query.eq('is_active', true);
  }

  return query;
}

/**
 * Create maintenance schedule
 */
export async function createMaintenanceSchedule(schedule) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: new Error('No user logged in') };

  return supabase
    .from('equipment_maintenance_schedules')
    .insert({
      ...schedule,
      user_id: user.id
    })
    .select(`
      *,
      equipment(id, name, type)
    `)
    .single();
}

/**
 * Update maintenance schedule
 */
export async function updateMaintenanceSchedule(scheduleId, updates) {
  return supabase
    .from('equipment_maintenance_schedules')
    .update(updates)
    .eq('id', scheduleId)
    .select(`
      *,
      equipment(id, name, type)
    `)
    .single();
}

/**
 * Delete maintenance schedule
 */
export async function deleteMaintenanceSchedule(scheduleId) {
  return supabase
    .from('equipment_maintenance_schedules')
    .delete()
    .eq('id', scheduleId);
}

/**
 * Get overdue maintenance
 */
export async function getOverdueMaintenance() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: null };

  const today = new Date().toISOString().split('T')[0];

  return supabase
    .from('equipment_maintenance_schedules')
    .select(`
      *,
      equipment(id, name, type, current_hours)
    `)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .or(`next_due_date.lt.${today},next_due_hours.lt.0`)
    .order('next_due_date', { ascending: true });
}

/**
 * Get upcoming maintenance (next 30 days)
 */
export async function getUpcomingMaintenance(daysAhead = 30) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: null };

  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + daysAhead);

  return supabase
    .from('equipment_maintenance_schedules')
    .select(`
      *,
      equipment(id, name, type, current_hours)
    `)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .gte('next_due_date', today.toISOString().split('T')[0])
    .lte('next_due_date', futureDate.toISOString().split('T')[0])
    .order('next_due_date', { ascending: true });
}

// =====================================================
// USAGE LOGS
// =====================================================

/**
 * List usage logs
 */
export async function listUsageLogs(equipmentId = null, startDate = null, endDate = null) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: null };

  let query = supabase
    .from('equipment_usage_logs')
    .select(`
      *,
      equipment(id, name, type),
      organization_members(id, full_name),
      vineyard_blocks(id, name)
    `)
    .eq('user_id', user.id)
    .order('usage_date', { ascending: false });

  if (equipmentId) {
    query = query.eq('equipment_id', equipmentId);
  }

  if (startDate) {
    query = query.gte('usage_date', startDate);
  }

  if (endDate) {
    query = query.lte('usage_date', endDate);
  }

  return query;
}

/**
 * Create usage log
 */
export async function createUsageLog(log) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: new Error('No user logged in') };

  // Calculate hours_used if start and end hours provided
  if (log.start_hours && log.end_hours && !log.hours_used) {
    log.hours_used = parseFloat(log.end_hours) - parseFloat(log.start_hours);
  }

  return supabase
    .from('equipment_usage_logs')
    .insert({
      ...log,
      user_id: user.id
    })
    .select(`
      *,
      equipment(id, name, type),
      organization_members(id, full_name),
      vineyard_blocks(id, name)
    `)
    .single();
}

/**
 * Update usage log
 */
export async function updateUsageLog(logId, updates) {
  // Recalculate hours_used if start or end hours changed
  if ((updates.start_hours || updates.end_hours) && !updates.hours_used) {
    const { data: existing } = await supabase
      .from('equipment_usage_logs')
      .select('start_hours, end_hours')
      .eq('id', logId)
      .single();

    if (existing) {
      const startHours = updates.start_hours || existing.start_hours;
      const endHours = updates.end_hours || existing.end_hours;
      if (startHours && endHours) {
        updates.hours_used = parseFloat(endHours) - parseFloat(startHours);
      }
    }
  }

  return supabase
    .from('equipment_usage_logs')
    .update(updates)
    .eq('id', logId)
    .select(`
      *,
      equipment(id, name, type),
      organization_members(id, full_name),
      vineyard_blocks(id, name)
    `)
    .single();
}

/**
 * Delete usage log
 */
export async function deleteUsageLog(logId) {
  return supabase
    .from('equipment_usage_logs')
    .delete()
    .eq('id', logId);
}

// =====================================================
// FUEL LOGS
// =====================================================

/**
 * List fuel logs
 */
export async function listFuelLogs(equipmentId = null, startDate = null, endDate = null) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: null };

  let query = supabase
    .from('equipment_fuel_logs')
    .select(`
      *,
      equipment(id, name, type)
    `)
    .eq('user_id', user.id)
    .order('fill_date', { ascending: false });

  if (equipmentId) {
    query = query.eq('equipment_id', equipmentId);
  }

  if (startDate) {
    query = query.gte('fill_date', startDate);
  }

  if (endDate) {
    query = query.lte('fill_date', endDate);
  }

  return query;
}

/**
 * Create fuel log
 */
export async function createFuelLog(log) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: new Error('No user logged in') };

  // Calculate total_cost if not provided
  if (!log.total_cost && log.gallons && log.cost_per_gallon) {
    log.total_cost = parseFloat(log.gallons) * parseFloat(log.cost_per_gallon);
  }

  return supabase
    .from('equipment_fuel_logs')
    .insert({
      ...log,
      user_id: user.id
    })
    .select(`
      *,
      equipment(id, name, type)
    `)
    .single();
}

/**
 * Update fuel log
 */
export async function updateFuelLog(logId, updates) {
  // Recalculate total_cost if gallons or cost_per_gallon changed
  if ((updates.gallons || updates.cost_per_gallon) && !updates.total_cost) {
    const { data: existing } = await supabase
      .from('equipment_fuel_logs')
      .select('gallons, cost_per_gallon')
      .eq('id', logId)
      .single();

    if (existing) {
      const gallons = updates.gallons || existing.gallons;
      const costPerGallon = updates.cost_per_gallon || existing.cost_per_gallon;
      if (gallons && costPerGallon) {
        updates.total_cost = parseFloat(gallons) * parseFloat(costPerGallon);
      }
    }
  }

  return supabase
    .from('equipment_fuel_logs')
    .update(updates)
    .eq('id', logId)
    .select(`
      *,
      equipment(id, name, type)
    `)
    .single();
}

/**
 * Delete fuel log
 */
export async function deleteFuelLog(logId) {
  return supabase
    .from('equipment_fuel_logs')
    .delete()
    .eq('id', logId);
}

// =====================================================
// EXPENSES
// =====================================================

/**
 * List equipment expenses
 */
export async function listEquipmentExpenses(equipmentId = null, startDate = null, endDate = null) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: null };

  let query = supabase
    .from('equipment_expenses')
    .select(`
      *,
      equipment(id, name, type)
    `)
    .eq('user_id', user.id)
    .order('expense_date', { ascending: false });

  if (equipmentId) {
    query = query.eq('equipment_id', equipmentId);
  }

  if (startDate) {
    query = query.gte('expense_date', startDate);
  }

  if (endDate) {
    query = query.lte('expense_date', endDate);
  }

  return query;
}

/**
 * Create equipment expense
 */
export async function createEquipmentExpense(expense) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: new Error('No user logged in') };

  return supabase
    .from('equipment_expenses')
    .insert({
      ...expense,
      user_id: user.id
    })
    .select(`
      *,
      equipment(id, name, type)
    `)
    .single();
}

/**
 * Update equipment expense
 */
export async function updateEquipmentExpense(expenseId, updates) {
  return supabase
    .from('equipment_expenses')
    .update(updates)
    .eq('id', expenseId)
    .select(`
      *,
      equipment(id, name, type)
    `)
    .single();
}

/**
 * Delete equipment expense
 */
export async function deleteEquipmentExpense(expenseId) {
  return supabase
    .from('equipment_expenses')
    .delete()
    .eq('id', expenseId);
}

// =====================================================
// ATTACHMENTS
// =====================================================

/**
 * List equipment attachments
 */
export async function listEquipmentAttachments(parentEquipmentId = null) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: null };

  let query = supabase
    .from('equipment_attachments')
    .select('*')
    .eq('user_id', user.id)
    .order('name', { ascending: true });

  if (parentEquipmentId) {
    query = query.eq('parent_equipment_id', parentEquipmentId);
  }

  return query;
}

/**
 * Create equipment attachment
 */
export async function createEquipmentAttachment(attachment) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: new Error('No user logged in') };

  return supabase
    .from('equipment_attachments')
    .insert({
      ...attachment,
      user_id: user.id
    })
    .select()
    .single();
}

/**
 * Update equipment attachment
 */
export async function updateEquipmentAttachment(attachmentId, updates) {
  return supabase
    .from('equipment_attachments')
    .update(updates)
    .eq('id', attachmentId)
    .select()
    .single();
}

/**
 * Delete equipment attachment
 */
export async function deleteEquipmentAttachment(attachmentId) {
  return supabase
    .from('equipment_attachments')
    .delete()
    .eq('id', attachmentId);
}

// =====================================================
// ANALYTICS & REPORTS
// =====================================================

/**
 * Get equipment summary
 */
export async function getEquipmentSummary() {
  const { data: equipment, error: equipmentError } = await listEquipment();
  const { data: expenses, error: expensesError } = await listEquipmentExpenses();
  const { data: fuelLogs, error: fuelError } = await listFuelLogs();

  if (equipmentError || expensesError || fuelError) {
    return { data: null, error: equipmentError || expensesError || fuelError };
  }

  const summary = {
    totalEquipment: equipment?.length || 0,
    totalValue: equipment?.reduce((sum, eq) => sum + (parseFloat(eq.purchase_price) || 0), 0) || 0,
    byStatus: {},
    byType: {},
    totalExpenses: expenses?.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0) || 0,
    totalFuelCost: fuelLogs?.reduce((sum, log) => sum + (parseFloat(log.total_cost) || 0), 0) || 0,
    expensesByType: {},
    recentExpenses: expenses?.slice(0, 10) || []
  };

  // Group by status
  equipment?.forEach(eq => {
    const status = eq.status || 'unknown';
    if (!summary.byStatus[status]) {
      summary.byStatus[status] = { count: 0, value: 0 };
    }
    summary.byStatus[status].count++;
    summary.byStatus[status].value += parseFloat(eq.purchase_price) || 0;
  });

  // Group by type
  equipment?.forEach(eq => {
    const type = eq.type || 'unknown';
    if (!summary.byType[type]) {
      summary.byType[type] = { count: 0, value: 0 };
    }
    summary.byType[type].count++;
    summary.byType[type].value += parseFloat(eq.purchase_price) || 0;
  });

  // Group expenses by type
  expenses?.forEach(exp => {
    const type = exp.expense_type || 'unknown';
    if (!summary.expensesByType[type]) {
      summary.expensesByType[type] = { count: 0, total: 0 };
    }
    summary.expensesByType[type].count++;
    summary.expensesByType[type].total += parseFloat(exp.amount) || 0;
  });

  return { data: summary, error: null };
}

/**
 * Get equipment cost per hour
 */
export async function getEquipmentCostPerHour(equipmentId, startDate = null, endDate = null) {
  const { data: equipment } = await getEquipment(equipmentId);
  const { data: expenses } = await listEquipmentExpenses(equipmentId, startDate, endDate);
  const { data: usageLogs } = await listUsageLogs(equipmentId, startDate, endDate);

  if (!equipment || !expenses || !usageLogs) {
    return { data: null, error: new Error('Failed to fetch data') };
  }

  const totalExpenses = expenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);
  const totalHours = usageLogs.reduce((sum, log) => sum + (parseFloat(log.hours_used) || 0), 0);

  return {
    data: {
      totalExpenses,
      totalHours,
      costPerHour: totalHours > 0 ? totalExpenses / totalHours : 0
    },
    error: null
  };
}

/**
 * Get fuel efficiency
 */
export async function getFuelEfficiency(equipmentId, startDate = null, endDate = null) {
  const { data: fuelLogs } = await listFuelLogs(equipmentId, startDate, endDate);
  const { data: usageLogs } = await listUsageLogs(equipmentId, startDate, endDate);

  if (!fuelLogs || !usageLogs) {
    return { data: null, error: new Error('Failed to fetch data') };
  }

  const totalGallons = fuelLogs.reduce((sum, log) => sum + (parseFloat(log.gallons) || 0), 0);
  const totalHours = usageLogs.reduce((sum, log) => sum + (parseFloat(log.hours_used) || 0), 0);
  const totalCost = fuelLogs.reduce((sum, log) => sum + (parseFloat(log.total_cost) || 0), 0);

  return {
    data: {
      totalGallons,
      totalHours,
      totalCost,
      gallonsPerHour: totalHours > 0 ? totalGallons / totalHours : 0,
      costPerHour: totalHours > 0 ? totalCost / totalHours : 0
    },
    error: null
  };
}
