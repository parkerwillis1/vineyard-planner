import { supabase } from './supabaseClient';

/* ================================================================
   PRODUCTION API
   Supabase CRUD helpers for winery production management
================================================================ */

// =====================================================
// PRODUCTION CONTAINERS (Tanks, Barrels, Vessels)
// =====================================================

export async function listContainers() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: null };

  return supabase
    .from('production_containers')
    .select('*')
    .eq('user_id', user.id)
    .order('name', { ascending: true });
}

export async function getContainer(containerId) {
  return supabase
    .from('production_containers')
    .select('*')
    .eq('id', containerId)
    .single();
}

export async function createContainer(container) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: new Error('No user logged in') };

  return supabase
    .from('production_containers')
    .insert({ ...container, user_id: user.id })
    .select()
    .single();
}

export async function updateContainer(containerId, updates) {
  return supabase
    .from('production_containers')
    .update(updates)
    .eq('id', containerId)
    .select()
    .single();
}

export async function deleteContainer(containerId) {
  return supabase
    .from('production_containers')
    .delete()
    .eq('id', containerId);
}

export async function getAvailableContainers(minCapacityGallons = 0) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: null };

  return supabase
    .from('production_containers')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'empty')
    .gte('capacity_gallons', minCapacityGallons)
    .order('capacity_gallons', { ascending: true });
}

// =====================================================
// PRODUCTION LOTS
// =====================================================

export async function listLots(filters = {}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: null };

  let query = supabase
    .from('production_lots')
    .select(`
      *,
      container:production_containers(id, name, type, capacity_gallons),
      block:vineyard_blocks(id, name, acres)
    `)
    .eq('user_id', user.id)
    .is('archived_at', null);

  // Apply filters
  if (filters.vintage) {
    query = query.eq('vintage', filters.vintage);
  }
  if (filters.varietal) {
    query = query.eq('varietal', filters.varietal);
  }
  if (filters.status) {
    // Support both comma-separated string and array
    const statuses = Array.isArray(filters.status)
      ? filters.status
      : filters.status.split(',').map(s => s.trim());
    query = query.in('status', statuses);
  }
  if (filters.blockId) {
    query = query.eq('block_id', filters.blockId);
  }

  return query.order('created_at', { ascending: false });
}

export async function getLot(lotId) {
  return supabase
    .from('production_lots')
    .select(`
      *,
      container:production_containers(id, name, type, capacity_gallons, location),
      block:vineyard_blocks(id, name, acres, variety, clone),
      fermentation_logs(*)
    `)
    .eq('id', lotId)
    .single();
}

export async function createLot(lot) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: new Error('No user logged in') };

  return supabase
    .from('production_lots')
    .insert({ ...lot, user_id: user.id })
    .select()
    .single();
}

export async function updateLot(lotId, updates) {
  return supabase
    .from('production_lots')
    .update(updates)
    .eq('id', lotId)
    .select()
    .single();
}

export async function deleteLot(lotId) {
  return supabase
    .from('production_lots')
    .delete()
    .eq('id', lotId);
}

export async function archiveLot(lotId) {
  return supabase
    .from('production_lots')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', lotId)
    .select()
    .single();
}

export async function getActiveFermentations() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: null };

  return supabase
    .from('production_lots')
    .select(`
      *,
      container:production_containers(id, name, type),
      fermentation_logs(*)
    `)
    .eq('user_id', user.id)
    .eq('status', 'fermenting')
    .is('archived_at', null)
    .order('harvest_date', { ascending: false });
}

export async function getLotsByVintage(vintage) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: null };

  return supabase
    .from('production_lots')
    .select('*')
    .eq('user_id', user.id)
    .eq('vintage', vintage)
    .is('archived_at', null)
    .order('varietal', { ascending: true });
}

// =====================================================
// FERMENTATION LOGS
// =====================================================

export async function listFermentationLogs(lotId) {
  return supabase
    .from('fermentation_logs')
    .select('*')
    .eq('lot_id', lotId)
    .order('log_date', { ascending: false });
}

export async function createFermentationLog(log) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: new Error('No user logged in') };

  return supabase
    .from('fermentation_logs')
    .insert({ ...log, user_id: user.id, created_by: user.id })
    .select()
    .single();
}

export async function updateFermentationLog(logId, updates) {
  return supabase
    .from('fermentation_logs')
    .update(updates)
    .eq('id', logId)
    .select()
    .single();
}

export async function deleteFermentationLog(logId) {
  return supabase
    .from('fermentation_logs')
    .delete()
    .eq('id', logId);
}

export async function getLatestFermentationLog(lotId) {
  return supabase
    .from('fermentation_logs')
    .select('*')
    .eq('lot_id', lotId)
    .order('log_date', { ascending: false })
    .limit(1)
    .single();
}

// =====================================================
// BLEND COMPONENTS
// =====================================================

export async function listBlendComponents(blendLotId) {
  return supabase
    .from('blend_components')
    .select(`
      *,
      component_lot:production_lots!component_lot_id(id, name, varietal, vintage)
    `)
    .eq('blend_lot_id', blendLotId);
}

export async function createBlendComponent(blendComponent) {
  return supabase
    .from('blend_components')
    .insert(blendComponent)
    .select()
    .single();
}

export async function deleteBlendComponent(componentId) {
  return supabase
    .from('blend_components')
    .delete()
    .eq('id', componentId);
}

// =====================================================
// DASHBOARD / ANALYTICS
// =====================================================

export async function getProductionDashboardData() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: new Error('No user logged in') };

  // Get summary counts by status
  const { data: lots, error: lotsError } = await supabase
    .from('production_lots')
    .select('status, current_volume_gallons')
    .eq('user_id', user.id)
    .is('archived_at', null);

  if (lotsError) return { data: null, error: lotsError };

  // Get container utilization
  const { data: containers, error: containersError } = await supabase
    .from('production_containers')
    .select('type, capacity_gallons, current_volume_gallons, status')
    .eq('user_id', user.id);

  if (containersError) return { data: null, error: containersError };

  // Calculate summary statistics
  const lotsByStatus = lots.reduce((acc, lot) => {
    acc[lot.status] = (acc[lot.status] || 0) + 1;
    return acc;
  }, {});

  const totalVolume = lots.reduce((sum, lot) => sum + (lot.current_volume_gallons || 0), 0);

  const containerUtilization = containers.reduce((acc, container) => {
    const utilization = container.capacity_gallons > 0
      ? (container.current_volume_gallons / container.capacity_gallons) * 100
      : 0;
    acc.push({ ...container, utilization });
    return acc;
  }, []);

  return {
    data: {
      lotsByStatus,
      totalVolume,
      totalLots: lots.length,
      containers: containerUtilization,
      emptyContainers: containers.filter(c => c.status === 'empty').length,
      totalCapacity: containers.reduce((sum, c) => sum + c.capacity_gallons, 0)
    },
    error: null
  };
}
