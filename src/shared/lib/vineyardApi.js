import { supabase } from './supabaseClient';

/* ================================================================
   VINEYARD OPERATIONS API
   Supabase CRUD helpers for all operations tables
================================================================ */

// =====================================================
// SEASONS
// =====================================================
export async function listSeasons() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: null };

  return supabase
    .from('seasons')
    .select('*')
    .eq('user_id', user.id)
    .order('start_date', { ascending: false });
}

export async function getActiveSeason() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: null };

  return supabase
    .from('seasons')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();
}

export async function createSeason(season) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: new Error('No user logged in') };

  return supabase
    .from('seasons')
    .insert({ ...season, user_id: user.id })
    .select()
    .single();
}

export async function updateSeason(seasonId, updates) {
  return supabase
    .from('seasons')
    .update(updates)
    .eq('id', seasonId)
    .select()
    .single();
}

export async function setActiveSeason(seasonId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: new Error('No user logged in') };

  // First, deactivate all seasons
  await supabase
    .from('seasons')
    .update({ is_active: false })
    .eq('user_id', user.id);

  // Then activate the selected season
  return supabase
    .from('seasons')
    .update({ is_active: true })
    .eq('id', seasonId)
    .eq('user_id', user.id)
    .select()
    .single();
}

// =====================================================
// VINEYARD BLOCKS (Enhanced)
// =====================================================
export async function listVineyardBlocks(seasonId = null) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: null };

  let query = supabase
    .from('vineyard_blocks')
    .select('*')
    .eq('user_id', user.id)
    .order('name', { ascending: true });

  if (seasonId) {
    query = query.eq('season_id', seasonId);
  }

  return query;
}

export async function getVineyardBlock(blockId) {
  return supabase
    .from('vineyard_blocks')
    .select('*')
    .eq('id', blockId)
    .single();
}

export async function createVineyardBlock(block) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: new Error('No user logged in') };

  return supabase
    .from('vineyard_blocks')
    .insert({ ...block, user_id: user.id })
    .select()
    .single();
}

export async function updateVineyardBlock(blockId, updates) {
  return supabase
    .from('vineyard_blocks')
    .update(updates)
    .eq('id', blockId)
    .select()
    .single();
}

export async function deleteVineyardBlock(blockId) {
  return supabase
    .from('vineyard_blocks')
    .delete()
    .eq('id', blockId);
}

// =====================================================
// INVENTORY ITEMS
// =====================================================
export async function listInventoryItems(category = null) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: null };

  let query = supabase
    .from('inventory_items')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (category) {
    query = query.eq('category', category);
  }

  return query;
}

export async function getInventoryItem(itemId) {
  return supabase
    .from('inventory_items')
    .select('*')
    .eq('id', itemId)
    .single();
}

export async function createInventoryItem(item) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: new Error('No user logged in') };

  return supabase
    .from('inventory_items')
    .insert({ ...item, user_id: user.id })
    .select()
    .single();
}

export async function updateInventoryItem(itemId, updates) {
  return supabase
    .from('inventory_items')
    .update(updates)
    .eq('id', itemId)
    .select()
    .single();
}

export async function deleteInventoryItem(itemId) {
  return supabase
    .from('inventory_items')
    .update({ is_active: false })
    .eq('id', itemId);
}

export async function adjustInventoryStock(itemId, quantity, type = 'adjust', notes = '') {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: new Error('No user logged in') };

  // Create transaction
  const { error: txnError } = await supabase
    .from('inventory_transactions')
    .insert({
      user_id: user.id,
      item_id: itemId,
      transaction_type: type,
      quantity: quantity,
      notes: notes
    });

  if (txnError) return { error: txnError };

  // Update on_hand_qty
  const { data: item } = await supabase
    .from('inventory_items')
    .select('on_hand_qty')
    .eq('id', itemId)
    .single();

  if (!item) return { error: new Error('Item not found') };

  const newQty = (parseFloat(item.on_hand_qty) || 0) + quantity;

  return supabase
    .from('inventory_items')
    .update({ on_hand_qty: newQty })
    .eq('id', itemId)
    .select()
    .single();
}

// =====================================================
// INVENTORY TRANSACTIONS
// =====================================================
export async function listInventoryTransactions(itemId = null, limit = 100) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: null };

  let query = supabase
    .from('inventory_transactions')
    .select('*, inventory_items(name, category)')
    .eq('user_id', user.id)
    .order('transaction_date', { ascending: false })
    .limit(limit);

  if (itemId) {
    query = query.eq('item_id', itemId);
  }

  return query;
}

// =====================================================
// SPRAY APPLICATIONS
// =====================================================
export async function listSprayApplications(seasonId = null) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: null };

  let query = supabase
    .from('spray_applications')
    .select(`
      *,
      spray_blocks(
        block_id,
        acres_treated,
        vineyard_blocks(name)
      ),
      spray_mix_lines(
        *,
        inventory_items(name, epa_reg_no, frac_code, rei_hours, phi_days)
      )
    `)
    .eq('user_id', user.id)
    .order('application_date', { ascending: false });

  if (seasonId) {
    query = query.eq('season_id', seasonId);
  }

  return query;
}

export async function getSprayApplication(sprayId) {
  return supabase
    .from('spray_applications')
    .select(`
      *,
      spray_blocks(
        block_id,
        acres_treated,
        vineyard_blocks(name, variety)
      ),
      spray_mix_lines(
        *,
        inventory_items(name, epa_reg_no, frac_code, rei_hours, phi_days, active_ingredient)
      )
    `)
    .eq('id', sprayId)
    .single();
}

export async function createSprayApplication(spray, blocks, mixLines) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: new Error('No user logged in') };

  // 1. Create spray application
  const { data: newSpray, error: sprayError } = await supabase
    .from('spray_applications')
    .insert({ ...spray, user_id: user.id })
    .select()
    .single();

  if (sprayError) return { error: sprayError };

  // 2. Create spray_blocks entries
  const sprayBlocksData = blocks.map(block => ({
    spray_id: newSpray.id,
    block_id: block.block_id,
    acres_treated: block.acres_treated
  }));

  const { error: blocksError } = await supabase
    .from('spray_blocks')
    .insert(sprayBlocksData);

  if (blocksError) return { error: blocksError };

  // 3. Create spray_mix_lines entries
  const mixLinesData = mixLines.map(line => ({
    spray_id: newSpray.id,
    item_id: line.item_id,
    rate_per_acre: line.rate_per_acre,
    unit: line.unit,
    total_quantity: line.total_quantity,
    total_cost: line.total_cost,
    purpose: line.purpose
  }));

  const { error: mixError } = await supabase
    .from('spray_mix_lines')
    .insert(mixLinesData);

  if (mixError) return { error: mixError };

  // 4. Create inventory transactions (deduct chemicals)
  for (const line of mixLines) {
    await adjustInventoryStock(
      line.item_id,
      -line.total_quantity,
      'use',
      `Used in spray application ${newSpray.id}`
    );
  }

  // 5. Create PHI/REI locks
  await createPHIREILocks(newSpray.id, blocks, mixLines, spray.application_date);

  return { data: newSpray, error: null };
}

export async function updateSprayApplication(sprayId, updates) {
  return supabase
    .from('spray_applications')
    .update(updates)
    .eq('id', sprayId)
    .select()
    .single();
}

export async function deleteSprayApplication(sprayId) {
  // This will cascade delete spray_blocks and spray_mix_lines
  return supabase
    .from('spray_applications')
    .delete()
    .eq('id', sprayId);
}

// =====================================================
// PHI/REI LOCKS
// =====================================================
async function createPHIREILocks(sprayId, blocks, mixLines, applicationDate) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const appDateTime = new Date(applicationDate);

  for (const block of blocks) {
    for (const line of mixLines) {
      // Get item details
      const { data: item } = await supabase
        .from('inventory_items')
        .select('phi_days, rei_hours')
        .eq('id', line.item_id)
        .single();

      if (!item) continue;

      // Create PHI lock if applicable
      if (item.phi_days && item.phi_days > 0) {
        const releaseDate = new Date(appDateTime);
        releaseDate.setDate(releaseDate.getDate() + item.phi_days);

        await supabase
          .from('phi_locks')
          .insert({
            user_id: user.id,
            block_id: block.block_id,
            spray_id: sprayId,
            item_id: line.item_id,
            phi_days: item.phi_days,
            application_date: applicationDate,
            phi_release_date: releaseDate.toISOString().split('T')[0],
            is_active: true
          });
      }

      // Create REI lock if applicable
      if (item.rei_hours && item.rei_hours > 0) {
        const releaseDateTime = new Date(appDateTime);
        releaseDateTime.setHours(releaseDateTime.getHours() + item.rei_hours);

        await supabase
          .from('rei_locks')
          .insert({
            user_id: user.id,
            block_id: block.block_id,
            spray_id: sprayId,
            item_id: line.item_id,
            rei_hours: item.rei_hours,
            application_datetime: appDateTime.toISOString(),
            rei_release_datetime: releaseDateTime.toISOString(),
            is_active: true
          });
      }
    }
  }
}

export async function getActivePHILocks(blockId = null) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: null };

  const now = new Date().toISOString().split('T')[0];

  let query = supabase
    .from('phi_locks')
    .select(`
      *,
      vineyard_blocks(name),
      inventory_items(name, epa_reg_no)
    `)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .gte('phi_release_date', now);

  if (blockId) {
    query = query.eq('block_id', blockId);
  }

  return query;
}

export async function getActiveREILocks(blockId = null) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: null };

  const now = new Date().toISOString();

  let query = supabase
    .from('rei_locks')
    .select(`
      *,
      vineyard_blocks(name),
      inventory_items(name, epa_reg_no)
    `)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .gte('rei_release_datetime', now);

  if (blockId) {
    query = query.eq('block_id', blockId);
  }

  return query;
}

export async function overridePHILock(lockId, reason) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: new Error('No user logged in') };

  return supabase
    .from('phi_locks')
    .update({
      is_active: false,
      override_reason: reason,
      override_by: user.id,
      override_at: new Date().toISOString()
    })
    .eq('id', lockId)
    .select()
    .single();
}

// =====================================================
// COMPLIANCE WARNINGS
// =====================================================
export async function checkSprayCompliance(blocks, mixLines, applicationDate) {
  const warnings = [];

  // Check for PHI conflicts
  for (const block of blocks) {
    const { data: phiLocks } = await getActivePHILocks(block.block_id);
    if (phiLocks && phiLocks.length > 0) {
      warnings.push({
        warning_type: 'phi_active',
        severity: 'critical',
        message: `Block ${block.block_name} has ${phiLocks.length} active PHI restriction(s)`,
        details: { block_id: block.block_id, locks: phiLocks }
      });
    }
  }

  // Check for FRAC rotation issues
  const fracCodes = mixLines
    .map(line => line.frac_code)
    .filter(code => code && code !== '');

  if (fracCodes.length > 0) {
    // Get recent sprays on these blocks
    for (const block of blocks) {
      const { data: recentSprays } = await getRecentSpraysByBlock(block.block_id, 3);

      if (recentSprays) {
        for (const spray of recentSprays) {
          const sprayFracs = spray.spray_mix_lines
            .map(line => line.inventory_items?.frac_code)
            .filter(code => code);

          const repeated = fracCodes.filter(code => sprayFracs.includes(code));

          if (repeated.length > 0) {
            warnings.push({
              warning_type: 'frac_rotation',
              severity: 'warning',
              message: `FRAC code(s) ${repeated.join(', ')} recently used on block ${block.block_name}`,
              details: { block_id: block.block_id, frac_codes: repeated, spray_date: spray.application_date }
            });
          }
        }
      }
    }
  }

  return warnings;
}

export async function getRecentSpraysByBlock(blockId, limit = 5) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: null };

  return supabase
    .from('spray_applications')
    .select(`
      *,
      spray_blocks!inner(block_id, acres_treated),
      spray_mix_lines(
        *,
        inventory_items(name, frac_code)
      )
    `)
    .eq('user_id', user.id)
    .eq('spray_blocks.block_id', blockId)
    .order('application_date', { ascending: false })
    .limit(limit);
}

// =====================================================
// VINEYARD TASKS (Enhanced)
// =====================================================
export async function listVineyardTasks(filters = {}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: null };

  let query = supabase
    .from('vineyard_tasks')
    .select(`
      *,
      vineyard_blocks(name),
      task_checklist_items(id, label, is_completed)
    `)
    .eq('user_id', user.id)
    .order('due_date', { ascending: true });

  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  if (filters.block_id) {
    query = query.eq('block_id', filters.block_id);
  }

  if (filters.assigned_to) {
    query = query.eq('assigned_to', filters.assigned_to);
  }

  return query;
}

export async function createVineyardTask(task, checklistItems = []) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: new Error('No user logged in') };

  // Create task
  const { data: newTask, error: taskError } = await supabase
    .from('vineyard_tasks')
    .insert({ ...task, user_id: user.id })
    .select()
    .single();

  if (taskError) return { error: taskError };

  // Create checklist items
  if (checklistItems.length > 0) {
    const items = checklistItems.map((item, index) => ({
      task_id: newTask.id,
      label: item.label || item,
      sort_order: index
    }));

    await supabase
      .from('task_checklist_items')
      .insert(items);
  }

  return { data: newTask, error: null };
}

export async function updateVineyardTask(taskId, updates) {
  return supabase
    .from('vineyard_tasks')
    .update(updates)
    .eq('id', taskId)
    .select()
    .single();
}

export async function completeTask(taskId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: new Error('No user logged in') };

  return supabase
    .from('vineyard_tasks')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      completed_by: user.id
    })
    .eq('id', taskId)
    .select()
    .single();
}

// =====================================================
// WORKERS
// =====================================================
export async function listWorkers(status = 'active') {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: null };

  let query = supabase
    .from('workers')
    .select('*')
    .eq('user_id', user.id)
    .order('last_name', { ascending: true });

  if (status) {
    query = query.eq('status', status);
  }

  return query;
}

export async function createWorker(worker) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: new Error('No user logged in') };

  return supabase
    .from('workers')
    .insert({ ...worker, user_id: user.id })
    .select()
    .single();
}

export async function updateWorker(workerId, updates) {
  return supabase
    .from('workers')
    .update(updates)
    .eq('id', workerId)
    .select()
    .single();
}

// =====================================================
// LABOR LOGS
// =====================================================
export async function createLaborLog(log) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: new Error('No user logged in') };

  return supabase
    .from('labor_logs')
    .insert({ ...log, user_id: user.id })
    .select()
    .single();
}

export async function listLaborLogs(filters = {}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: null };

  let query = supabase
    .from('labor_logs')
    .select(`
      *,
      workers(first_name, last_name),
      vineyard_blocks(name)
    `)
    .eq('user_id', user.id)
    .order('log_date', { ascending: false });

  if (filters.worker_id) {
    query = query.eq('worker_id', filters.worker_id);
  }

  if (filters.start_date) {
    query = query.gte('log_date', filters.start_date);
  }

  if (filters.end_date) {
    query = query.lte('log_date', filters.end_date);
  }

  return query;
}

// =====================================================
// EQUIPMENT
// =====================================================
export async function listEquipment(inService = true) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: null };

  let query = supabase
    .from('equipment')
    .select('*')
    .eq('user_id', user.id)
    .order('name', { ascending: true });

  if (inService !== null) {
    query = query.eq('in_service', inService);
  }

  return query;
}

export async function createEquipment(equipment) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: new Error('No user logged in') };

  return supabase
    .from('equipment')
    .insert({ ...equipment, user_id: user.id })
    .select()
    .single();
}

export async function updateEquipment(equipmentId, updates) {
  return supabase
    .from('equipment')
    .update(updates)
    .eq('id', equipmentId)
    .select()
    .single();
}

// =====================================================
// FIELD ATTACHMENTS (Photos, Documents)
// =====================================================
export async function listFieldAttachments(fieldId = null) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: null };

  let query = supabase
    .from('field_attachments')
    .select('*')
    .eq('user_id', user.id)
    .is('archived_at', null)
    .order('created_at', { ascending: false });

  if (fieldId) {
    query = query.eq('field_id', fieldId);
  }

  return query;
}

export async function getFieldAttachment(attachmentId) {
  return supabase
    .from('field_attachments')
    .select('*')
    .eq('id', attachmentId)
    .single();
}

export async function createFieldAttachment(attachment) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: new Error('No user logged in') };

  return supabase
    .from('field_attachments')
    .insert({ ...attachment, user_id: user.id })
    .select()
    .single();
}

export async function updateFieldAttachment(attachmentId, updates) {
  return supabase
    .from('field_attachments')
    .update(updates)
    .eq('id', attachmentId)
    .select()
    .single();
}

export async function deleteFieldAttachment(attachmentId) {
  // Soft delete - set archived_at timestamp
  return supabase
    .from('field_attachments')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', attachmentId)
    .select()
    .single();
}

export async function archiveFieldAttachment(attachmentId) {
  // Alias for deleteFieldAttachment (soft delete)
  return deleteFieldAttachment(attachmentId);
}

export async function restoreFieldAttachment(attachmentId) {
  // Restore archived attachment
  return supabase
    .from('field_attachments')
    .update({ archived_at: null })
    .eq('id', attachmentId)
    .select()
    .single();
}

export async function permanentlyDeleteFieldAttachment(attachmentId) {
  // Get attachment info first to delete from storage
  const { data: attachment } = await supabase
    .from('field_attachments')
    .select('storage_path')
    .eq('id', attachmentId)
    .single();

  if (attachment && attachment.storage_path) {
    // Delete from storage
    await supabase.storage
      .from('field-attachments')
      .remove([attachment.storage_path]);
  }

  // Hard delete - permanently remove from database
  return supabase
    .from('field_attachments')
    .delete()
    .eq('id', attachmentId);
}

export async function listArchivedFieldAttachments(fieldId = null) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: null };

  let query = supabase
    .from('field_attachments')
    .select('*')
    .eq('user_id', user.id)
    .not('archived_at', 'is', null)
    .order('archived_at', { ascending: false });

  if (fieldId) {
    query = query.eq('field_id', fieldId);
  }

  return query;
}

// =====================================================
// FIELD YIELD HISTORY
// =====================================================
export async function listFieldYieldHistory(fieldId = null, year = null) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: null };

  let query = supabase
    .from('field_yield_history')
    .select('*, vineyard_blocks(name, variety)')
    .eq('user_id', user.id)
    .order('harvest_year', { ascending: false });

  if (fieldId) {
    query = query.eq('field_id', fieldId);
  }

  if (year) {
    query = query.eq('harvest_year', year);
  }

  return query;
}

export async function getFieldYieldHistory(yieldId) {
  return supabase
    .from('field_yield_history')
    .select('*, vineyard_blocks(name, variety, acres)')
    .eq('id', yieldId)
    .single();
}

export async function createFieldYieldHistory(yieldData) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: new Error('No user logged in') };

  return supabase
    .from('field_yield_history')
    .insert({ ...yieldData, user_id: user.id })
    .select()
    .single();
}

export async function updateFieldYieldHistory(yieldId, updates) {
  return supabase
    .from('field_yield_history')
    .update(updates)
    .eq('id', yieldId)
    .select()
    .single();
}

export async function deleteFieldYieldHistory(yieldId) {
  return supabase
    .from('field_yield_history')
    .delete()
    .eq('id', yieldId);
}

// =====================================================
// FIELD STATISTICS
// =====================================================
export async function getFieldStatistics(fieldId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: null };

  // Get yield history
  const { data: yields } = await supabase
    .from('field_yield_history')
    .select('*')
    .eq('field_id', fieldId)
    .eq('user_id', user.id)
    .order('harvest_year', { ascending: false });

  // Calculate statistics
  if (!yields || yields.length === 0) {
    return { data: { yieldsCount: 0 }, error: null };
  }

  const avgTonsPerAcre = yields.reduce((sum, y) => sum + (parseFloat(y.tons_per_acre) || 0), 0) / yields.length;
  const avgBrix = yields.reduce((sum, y) => sum + (parseFloat(y.brix) || 0), 0) / yields.filter(y => y.brix).length || 0;
  const totalRevenue = yields.reduce((sum, y) => {
    const tons = parseFloat(y.tons_harvested) || 0;
    const price = parseFloat(y.price_per_ton) || 0;
    return sum + (tons * price);
  }, 0);

  return {
    data: {
      yieldsCount: yields.length,
      avgTonsPerAcre,
      avgBrix,
      totalRevenue,
      lastHarvestYear: yields[0].harvest_year,
      yields
    },
    error: null
  };
}

// =====================================================
// TASKS
// =====================================================
export async function listTasks(filters = {}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: null };

  let query = supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .is('archived_at', null)
    .order('due_date', { ascending: true });

  // Apply filters
  if (filters.seasonId) {
    query = query.eq('season_id', filters.seasonId);
  }
  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  if (filters.type) {
    query = query.eq('type', filters.type);
  }
  if (filters.blockId) {
    query = query.contains('blocks', [filters.blockId]);
  }
  if (filters.assigneeId) {
    query = query.contains('assignees', [filters.assigneeId]);
  }

  return query;
}

export async function getTask(taskId) {
  return supabase
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .single();
}

export async function createTask(task) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: new Error('No user logged in') };

  // Get user's organization
  const { data: org } = await getOrCreateOrganization();
  if (!org) return { error: new Error('No organization found') };

  return supabase
    .from('tasks')
    .insert({ ...task, user_id: user.id, created_by: user.id, organization_id: org.id })
    .select()
    .single();
}

export async function updateTask(taskId, updates) {
  return supabase
    .from('tasks')
    .update(updates)
    .eq('id', taskId)
    .select()
    .single();
}

export async function deleteTask(taskId) {
  // Soft delete - set archived_at timestamp
  return supabase
    .from('tasks')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', taskId)
    .select()
    .single();
}

export async function archiveTask(taskId) {
  // Alias for deleteTask (soft delete)
  return deleteTask(taskId);
}

export async function restoreTask(taskId) {
  // Restore archived task
  return supabase
    .from('tasks')
    .update({ archived_at: null })
    .eq('id', taskId)
    .select()
    .single();
}

export async function permanentlyDeleteTask(taskId) {
  // Hard delete - permanently remove from database
  return supabase
    .from('tasks')
    .delete()
    .eq('id', taskId);
}

export async function listArchivedTasks(filters = {}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: null };

  let query = supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .not('archived_at', 'is', null)
    .order('archived_at', { ascending: false });

  // Apply filters
  if (filters.seasonId) {
    query = query.eq('season_id', filters.seasonId);
  }
  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  if (filters.type) {
    query = query.eq('type', filters.type);
  }

  return query;
}

export async function updateTaskStatus(taskId, status, extraUpdates = {}) {
  const updates = { status, ...extraUpdates };

  // Auto-set completed_at when marking as done
  if (status === 'done' && !updates.completed_at) {
    updates.completed_at = new Date().toISOString();
  }

  return updateTask(taskId, updates);
}

// =====================================================
// TASK CHECKLIST
// =====================================================
export async function listTaskChecklist(taskId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: null };

  return supabase
    .from('task_checklist')
    .select('*')
    .eq('task_id', taskId)
    .eq('user_id', user.id)
    .order('sort_index', { ascending: true });
}

export async function createChecklistItem(taskId, item) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: new Error('No user logged in') };

  return supabase
    .from('task_checklist')
    .insert({ ...item, task_id: taskId, user_id: user.id })
    .select()
    .single();
}

export async function updateChecklistItem(itemId, updates) {
  // Auto-set completed_at when marking as done
  if (updates.is_done && !updates.completed_at) {
    const { data: { user } } = await supabase.auth.getUser();
    updates.completed_at = new Date().toISOString();
    if (user) {
      updates.completed_by = user.id;
    }
  }

  return supabase
    .from('task_checklist')
    .update(updates)
    .eq('id', itemId)
    .select()
    .single();
}

export async function deleteChecklistItem(itemId) {
  return supabase
    .from('task_checklist')
    .delete()
    .eq('id', itemId);
}

// =====================================================
// TASK LABOR LOGS
// =====================================================
export async function listTaskLaborLogs(taskId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: null };

  return supabase
    .from('task_labor_logs')
    .select('*')
    .eq('task_id', taskId)
    .eq('user_id', user.id)
    .order('started_at', { ascending: false });
}

export async function createTaskLaborLog(taskId, log) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: new Error('No user logged in') };

  // Auto-calculate hours if not provided
  if (!log.hours && log.started_at && log.ended_at) {
    const start = new Date(log.started_at);
    const end = new Date(log.ended_at);
    log.hours = (end - start) / (1000 * 60 * 60); // Convert ms to hours
  }

  return supabase
    .from('task_labor_logs')
    .insert({ ...log, task_id: taskId, user_id: user.id })
    .select()
    .single();
}

export async function updateTaskLaborLog(logId, updates) {
  return supabase
    .from('task_labor_logs')
    .update(updates)
    .eq('id', logId)
    .select()
    .single();
}

export async function deleteTaskLaborLog(logId) {
  return supabase
    .from('task_labor_logs')
    .delete()
    .eq('id', logId);
}

// =====================================================
// TASK MATERIALS
// =====================================================
export async function listTaskMaterials(taskId, phase = null) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: null };

  let query = supabase
    .from('task_materials')
    .select('*')
    .eq('task_id', taskId)
    .eq('user_id', user.id);

  if (phase) {
    query = query.eq('phase', phase);
  }

  return query.order('created_at', { ascending: true });
}

export async function createTaskMaterial(taskId, material) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: new Error('No user logged in') };

  return supabase
    .from('task_materials')
    .insert({ ...material, task_id: taskId, user_id: user.id })
    .select()
    .single();
}

export async function updateTaskMaterial(materialId, updates) {
  return supabase
    .from('task_materials')
    .update(updates)
    .eq('id', materialId)
    .select()
    .single();
}

export async function deleteTaskMaterial(materialId) {
  return supabase
    .from('task_materials')
    .delete()
    .eq('id', materialId);
}

// =====================================================
// TASK EQUIPMENT LOGS
// =====================================================
export async function listTaskEquipmentLogs(taskId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: null };

  return supabase
    .from('task_equipment_logs')
    .select('*')
    .eq('task_id', taskId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
}

export async function createTaskEquipmentLog(taskId, log) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: new Error('No user logged in') };

  return supabase
    .from('task_equipment_logs')
    .insert({ ...log, task_id: taskId, user_id: user.id })
    .select()
    .single();
}

export async function updateTaskEquipmentLog(logId, updates) {
  return supabase
    .from('task_equipment_logs')
    .update(updates)
    .eq('id', logId)
    .select()
    .single();
}

export async function deleteTaskEquipmentLog(logId) {
  return supabase
    .from('task_equipment_logs')
    .delete()
    .eq('id', logId);
}

// =====================================================
// TASK COMMENTS
// =====================================================
export async function listTaskComments(taskId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: null };

  return supabase
    .from('task_comments')
    .select('*')
    .eq('task_id', taskId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });
}

export async function createTaskComment(taskId, comment) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: new Error('No user logged in') };

  return supabase
    .from('task_comments')
    .insert({ comment, task_id: taskId, user_id: user.id })
    .select()
    .single();
}

export async function deleteTaskComment(commentId) {
  return supabase
    .from('task_comments')
    .delete()
    .eq('id', commentId);
}

// =====================================================
// TASK STATISTICS & ANALYTICS
// =====================================================
export async function getTaskStatistics(filters = {}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: null };

  let query = supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id);

  if (filters.seasonId) {
    query = query.eq('season_id', filters.seasonId);
  }

  const { data: tasks, error } = await query;
  if (error || !tasks) return { data: null, error };

  const stats = {
    total: tasks.length,
    byStatus: {},
    byType: {},
    byPriority: {},
    overdue: 0,
    dueToday: 0,
    dueThisWeek: 0,
    totalCost: 0,
    avgDuration: 0
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekFromNow = new Date(today);
  weekFromNow.setDate(weekFromNow.getDate() + 7);

  tasks.forEach(task => {
    // By status
    stats.byStatus[task.status] = (stats.byStatus[task.status] || 0) + 1;

    // By type
    stats.byType[task.type] = (stats.byType[task.type] || 0) + 1;

    // By priority
    stats.byPriority[task.priority] = (stats.byPriority[task.priority] || 0) + 1;

    // Due date checks
    if (task.due_date) {
      const dueDate = new Date(task.due_date);
      dueDate.setHours(0, 0, 0, 0);

      if (dueDate < today && task.status !== 'done' && task.status !== 'archived') {
        stats.overdue++;
      } else if (dueDate.getTime() === today.getTime()) {
        stats.dueToday++;
      } else if (dueDate >= today && dueDate <= weekFromNow) {
        stats.dueThisWeek++;
      }
    }

    // Costs
    stats.totalCost += parseFloat(task.total_cost) || 0;

    // Duration
    if (task.actual_duration_min) {
      stats.avgDuration += task.actual_duration_min;
    }
  });

  // Calculate averages
  const completedTasks = tasks.filter(t => t.actual_duration_min);
  stats.avgDuration = completedTasks.length > 0
    ? stats.avgDuration / completedTasks.length
    : 0;

  return { data: stats, error: null };
}

// =====================================================
// ORGANIZATIONS
// =====================================================
export async function getOrCreateOrganization() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: new Error('No user logged in') };

  // Check if user owns an organization
  let { data: org, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('owner_id', user.id)
    .single();

  // If error is NOT "not found", return it (likely a table doesn't exist)
  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching organization:', error);
    return { data: null, error: new Error(`Failed to fetch organization. Please ensure the 'organizations' table exists in Supabase. Error: ${error.message}`) };
  }

  // If no organization exists, create one
  if (!org) {
    console.log('Creating new organization for user:', user.id);
    const { data: newOrg, error: createError } = await supabase
      .from('organizations')
      .insert({
        owner_id: user.id,
        name: `${user.email?.split('@')[0]}'s Vineyard`,
        email: user.email
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating organization:', createError);
      return { data: null, error: new Error(`Failed to create organization. Error: ${createError.message}`) };
    }

    console.log('Organization created successfully:', newOrg);

    // IMPORTANT: Add the owner as an admin organization member
    // This is required for RLS policies on tasks and other tables
    const { error: memberError } = await supabase
      .from('organization_members')
      .insert({
        organization_id: newOrg.id,
        user_id: user.id,
        email: user.email,
        full_name: user.email?.split('@')[0] || 'Owner',
        role: 'admin',
        job_title: 'Owner',
        can_view_costs: true,
        can_manage_team: true,
        can_manage_blocks: true,
        can_manage_tasks: true,
        can_approve_tasks: true,
        is_active: true,
        joined_at: new Date().toISOString()
      });

    if (memberError) {
      console.error('Error adding owner as organization member:', memberError);
      // Don't fail the whole operation, just log the error
      // The organization still exists and owner can access via owner_id
    }

    return { data: newOrg, error: null };
  }

  return { data: org, error: null };
}

export async function updateOrganization(orgId, updates) {
  return supabase
    .from('organizations')
    .update(updates)
    .eq('id', orgId)
    .select()
    .single();
}

// =====================================================
// ORGANIZATION MEMBERS (formerly TEAM MEMBERS)
// =====================================================
export async function listOrganizationMembers() {
  const { data: org } = await getOrCreateOrganization();
  if (!org) return { data: [], error: null };

  return supabase
    .from('organization_members')
    .select('*')
    .eq('organization_id', org.id)
    .order('full_name', { ascending: true });
}

export async function listTeamMembers() {
  return listOrganizationMembers();
}

export async function getOrganizationMember(memberId) {
  return supabase
    .from('organization_members')
    .select('*')
    .eq('id', memberId)
    .single();
}

export async function createOrganizationMember(member) {
  const { data: org } = await getOrCreateOrganization();
  if (!org) return { error: new Error('No organization found') };

  return supabase
    .from('organization_members')
    .insert({ ...member, organization_id: org.id })
    .select()
    .single();
}

export async function updateOrganizationMember(memberId, updates) {
  return supabase
    .from('organization_members')
    .update(updates)
    .eq('id', memberId)
    .select()
    .single();
}

export async function deleteOrganizationMember(memberId) {
  return supabase
    .from('organization_members')
    .delete()
    .eq('id', memberId);
}

export async function sendMemberInvitation(memberId) {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return { error: new Error('Not authenticated') };
    }

    const response = await supabase.functions.invoke('send-invitation', {
      body: { memberId },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (response.error) {
      // Check if it's a connection error (Edge Function not deployed)
      if (response.error.message?.includes('Failed to send a request') ||
          response.error.message?.includes('fetch failed')) {
        return {
          error: new Error('Email service not configured. Deploy the Supabase Edge Function to enable automatic emails.')
        };
      }
      return { error: response.error };
    }

    return { data: response.data, error: null };
  } catch (error) {
    console.error('Error sending invitation:', error);
    return {
      error: new Error('Failed to send invitation email. The email service may not be configured yet.')
    };
  }
}

export async function getCurrentUserRole() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: null };

  // Check if user owns an organization
  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('owner_id', user.id)
    .single();

  if (org) {
    return {
      data: {
        role: 'admin',
        organization_id: org.id,
        can_view_costs: true,
        can_manage_team: true,
        can_manage_blocks: true,
        can_manage_tasks: true,
        can_approve_tasks: true
      },
      error: null
    };
  }

  // Check if user is an organization member
  const { data: member, error } = await supabase
    .from('organization_members')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  if (error && error.code !== 'PGRST116') {
    return { data: null, error };
  }

  return { data: member, error: null };
}

// =====================================================
// HARVEST TRACKING
// =====================================================
export async function listHarvestTracking(season = null) {
  const { data: org } = await getOrCreateOrganization();
  if (!org) return { data: [], error: null };

  let query = supabase
    .from('harvest_tracking')
    .select(`
      *,
      vineyard_blocks(name, variety, acres)
    `)
    .eq('organization_id', org.id)
    .order('target_pick_date', { ascending: true });

  if (season) {
    query = query.eq('season', season);
  }

  return query;
}

export async function getHarvestTracking(harvestId) {
  return supabase
    .from('harvest_tracking')
    .select(`
      *,
      vineyard_blocks(name, variety, acres)
    `)
    .eq('id', harvestId)
    .single();
}

export async function createHarvestTracking(harvest) {
  const { data: org } = await getOrCreateOrganization();
  if (!org) return { error: new Error('No organization found') };

  return supabase
    .from('harvest_tracking')
    .insert({ ...harvest, organization_id: org.id })
    .select()
    .single();
}

export async function updateHarvestTracking(harvestId, updates) {
  return supabase
    .from('harvest_tracking')
    .update(updates)
    .eq('id', harvestId)
    .select()
    .single();
}

export async function deleteHarvestTracking(harvestId) {
  return supabase
    .from('harvest_tracking')
    .delete()
    .eq('id', harvestId);
}

export async function startHarvest(harvestId) {
  return supabase
    .from('harvest_tracking')
    .update({
      status: 'in_progress',
      started_at: new Date().toISOString(),
      actual_pick_date: new Date().toISOString().split('T')[0]
    })
    .eq('id', harvestId)
    .select()
    .single();
}

export async function completeHarvest(harvestId) {
  return supabase
    .from('harvest_tracking')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString()
    })
    .eq('id', harvestId)
    .select()
    .single();
}

// =====================================================
// HARVEST LOADS
// =====================================================
export async function listHarvestLoads(harvestId) {
  return supabase
    .from('harvest_loads')
    .select('*')
    .eq('harvest_id', harvestId)
    .order('picked_at', { ascending: true });
}

export async function getHarvestLoad(loadId) {
  return supabase
    .from('harvest_loads')
    .select('*')
    .eq('id', loadId)
    .single();
}

export async function createHarvestLoad(load) {
  const { data: org } = await getOrCreateOrganization();
  if (!org) return { error: new Error('No organization found') };

  // Get current load count for this harvest to set load_number
  const { data: existingLoads } = await supabase
    .from('harvest_loads')
    .select('load_number')
    .eq('harvest_id', load.harvest_id)
    .order('load_number', { ascending: false })
    .limit(1);

  const nextLoadNumber = existingLoads && existingLoads.length > 0
    ? (existingLoads[0].load_number || 0) + 1
    : 1;

  const { data: newLoad, error: createError } = await supabase
    .from('harvest_loads')
    .insert({
      ...load,
      organization_id: org.id,
      load_number: nextLoadNumber
    })
    .select()
    .single();

  if (createError) return { error: createError };

  // Update harvest_tracking totals
  await updateHarvestTotals(load.harvest_id);

  return { data: newLoad, error: null };
}

export async function updateHarvestLoad(loadId, updates) {
  const { data: load } = await supabase
    .from('harvest_loads')
    .select('harvest_id')
    .eq('id', loadId)
    .single();

  const { data: updatedLoad, error } = await supabase
    .from('harvest_loads')
    .update(updates)
    .eq('id', loadId)
    .select()
    .single();

  if (error) return { error };

  // Update harvest_tracking totals
  if (load) {
    await updateHarvestTotals(load.harvest_id);
  }

  return { data: updatedLoad, error: null };
}

export async function deleteHarvestLoad(loadId) {
  const { data: load } = await supabase
    .from('harvest_loads')
    .select('harvest_id')
    .eq('id', loadId)
    .single();

  const { error } = await supabase
    .from('harvest_loads')
    .delete()
    .eq('id', loadId);

  if (error) return { error };

  // Update harvest_tracking totals
  if (load) {
    await updateHarvestTotals(load.harvest_id);
  }

  return { error: null };
}

// Helper function to update harvest totals from loads
async function updateHarvestTotals(harvestId) {
  // Get all loads for this harvest
  const { data: loads } = await supabase
    .from('harvest_loads')
    .select('tons, bin_count')
    .eq('harvest_id', harvestId);

  if (!loads) return;

  // Calculate totals
  const actualTons = loads.reduce((sum, load) => sum + (parseFloat(load.tons) || 0), 0);
  const totalBins = loads.reduce((sum, load) => sum + (parseInt(load.bin_count) || 0), 0);

  // Get block acres for tons per acre calculation
  const { data: harvest } = await supabase
    .from('harvest_tracking')
    .select('vineyard_blocks(acres)')
    .eq('id', harvestId)
    .single();

  const acres = harvest?.vineyard_blocks?.acres || 1;
  const actualTonsPerAcre = actualTons / acres;

  // Update harvest_tracking
  await supabase
    .from('harvest_tracking')
    .update({
      actual_tons: actualTons,
      actual_tons_per_acre: actualTonsPerAcre,
      total_bins: totalBins
    })
    .eq('id', harvestId);
}

// =====================================================
// HARVEST FIELD SAMPLES
// =====================================================
export async function listHarvestSamples(blockId = null, season = null) {
  const { data: org } = await getOrCreateOrganization();
  if (!org) return { data: [], error: null };

  let query = supabase
    .from('harvest_field_samples')
    .select(`
      *,
      vineyard_blocks(name, variety),
      organization_members(full_name)
    `)
    .eq('organization_id', org.id)
    .is('archived_at', null)
    .order('sample_date', { ascending: false });

  if (blockId) {
    query = query.eq('block_id', blockId);
  }

  if (season) {
    const startDate = `${season}-01-01`;
    const endDate = `${season}-12-31`;
    query = query.gte('sample_date', startDate).lte('sample_date', endDate);
  }

  return query;
}

export async function getHarvestSample(sampleId) {
  return supabase
    .from('harvest_field_samples')
    .select(`
      *,
      vineyard_blocks(name, variety),
      organization_members(full_name)
    `)
    .eq('id', sampleId)
    .single();
}

export async function createHarvestSample(sample) {
  const { data: { user } } = await supabase.auth.getUser();
  const { data: org } = await getOrCreateOrganization();
  if (!org) return { error: new Error('No organization found') };

  // Get the organization member ID for the current user
  let sampledById = sample.sampled_by;
  if (!sampledById && user?.id) {
    const { data: member } = await supabase
      .from('organization_members')
      .select('id')
      .eq('user_id', user.id)
      .eq('organization_id', org.id)
      .single();

    sampledById = member?.id;
  }

  return supabase
    .from('harvest_field_samples')
    .insert({
      ...sample,
      organization_id: org.id,
      sampled_by: sampledById
    })
    .select()
    .single();
}

export async function updateHarvestSample(sampleId, updates) {
  return supabase
    .from('harvest_field_samples')
    .update(updates)
    .eq('id', sampleId)
    .select()
    .single();
}

export async function deleteHarvestSample(sampleId) {
  // Soft delete - set archived_at timestamp
  return supabase
    .from('harvest_field_samples')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', sampleId)
    .select()
    .single();
}

export async function archiveHarvestSample(sampleId) {
  // Alias for deleteHarvestSample (soft delete)
  return deleteHarvestSample(sampleId);
}

export async function restoreHarvestSample(sampleId) {
  // Restore archived sample
  return supabase
    .from('harvest_field_samples')
    .update({ archived_at: null })
    .eq('id', sampleId)
    .select()
    .single();
}

export async function permanentlyDeleteHarvestSample(sampleId) {
  // Hard delete - permanently remove from database
  return supabase
    .from('harvest_field_samples')
    .delete()
    .eq('id', sampleId);
}

export async function listArchivedHarvestSamples(blockId = null, season = null) {
  const { data: org } = await getOrCreateOrganization();
  if (!org) return { data: [], error: null };

  let query = supabase
    .from('harvest_field_samples')
    .select(`
      *,
      vineyard_blocks(name, variety),
      organization_members(full_name)
    `)
    .eq('organization_id', org.id)
    .not('archived_at', 'is', null)
    .order('archived_at', { ascending: false });

  if (blockId) {
    query = query.eq('block_id', blockId);
  }

  if (season) {
    const startDate = `${season}-01-01`;
    const endDate = `${season}-12-31`;
    query = query.gte('sample_date', startDate).lte('sample_date', endDate);
  }

  return query;
}

export async function getLatestSampleByBlock(blockId) {
  return supabase
    .from('harvest_field_samples')
    .select('*')
    .eq('block_id', blockId)
    .order('sample_date', { ascending: false })
    .limit(1)
    .single();
}

// =====================================================
// HARVEST ANALYTICS
// =====================================================
export async function getHarvestStatistics(season) {
  const { data: org } = await getOrCreateOrganization();
  if (!org) return { data: null, error: null };

  // Get all harvests for the season
  let query = supabase
    .from('harvest_tracking')
    .select(`
      *,
      vineyard_blocks(name, variety, acres)
    `)
    .eq('organization_id', org.id);

  if (season) {
    query = query.eq('season', season);
  }

  const { data: harvests, error } = await query;
  if (error || !harvests) return { data: null, error };

  const stats = {
    totalBlocks: harvests.length,
    planned: harvests.filter(h => h.status === 'planned').length,
    inProgress: harvests.filter(h => h.status === 'in_progress').length,
    completed: harvests.filter(h => h.status === 'completed').length,
    totalEstimatedTons: 0,
    totalActualTons: 0,
    totalBins: 0,
    byVariety: {}
  };

  harvests.forEach(harvest => {
    stats.totalEstimatedTons += parseFloat(harvest.estimated_tons) || 0;
    stats.totalActualTons += parseFloat(harvest.actual_tons) || 0;
    stats.totalBins += parseInt(harvest.total_bins) || 0;

    const variety = harvest.vineyard_blocks?.variety || 'Unknown';
    if (!stats.byVariety[variety]) {
      stats.byVariety[variety] = {
        blocks: 0,
        estimatedTons: 0,
        actualTons: 0
      };
    }
    stats.byVariety[variety].blocks++;
    stats.byVariety[variety].estimatedTons += parseFloat(harvest.estimated_tons) || 0;
    stats.byVariety[variety].actualTons += parseFloat(harvest.actual_tons) || 0;
  });

  return { data: stats, error: null };
}

export async function getYieldByBlock(season) {
  const { data: org } = await getOrCreateOrganization();
  if (!org) return { data: [], error: null };

  let query = supabase
    .from('harvest_tracking')
    .select(`
      *,
      vineyard_blocks(name, variety, acres)
    `)
    .eq('organization_id', org.id)
    .order('actual_tons_per_acre', { ascending: false });

  if (season) {
    query = query.eq('season', season);
  }

  return query;
}
