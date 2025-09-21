import { supabase } from './supabaseClient';

/**
 * Load planner data for the current user.
 * Returns { data, error } where data is { st, projYears } or null if none yet.
 */
export async function loadPlanner() {
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr) return { data: null, error: userErr };
  if (!user)   return { data: null, error: null };  // not signed in

  const { data, error } = await supabase
    .from('vineyard_profiles')
    .select('data, updated_at')   // include updated_at if you want timestamp
    .eq('user_id', user.id)
    .single();                    // expect at most one row

  // If "no rows" error (PGRST116), treat as empty.
  if (error && error.code !== 'PGRST116') {
    return { data: null, error };
  }

  return {
    data: data ? data.data : null,   // unwrap outer row.data
    updatedAt: data ? data.updated_at : null,
    error: null
  };
}

/**
 * Load planner data by its row id (used by the PlansPage selector).
 * Returns { data, error } where data is { st, projYears } or null.
 */
export async function loadPlannerById(planId) {
  const { data, error } = await supabase
    .from('vineyard_plans')        // ← use your table name
    .select('data')
    .eq('id', planId)                 // ← primary‑key column
    .single();

  if (error && error.code !== 'PGRST116') {
    return { data: null, error };
  }
  return { data: data ? data.data : null, error: null };
}


/**
 * Upsert planner data for current user.
 * Accepts object: { st, projYears }
 */
export async function savePlanner(payload) {
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) {
    return { error: userErr || new Error('No user') };
  }

  const row = {
    user_id: user.id,
    data: {
      ...payload,
      version: 1,
      savedAt: new Date().toISOString()
    },
    // updated_at will auto-update if you have a trigger; if not, define column default now()
  };

  const { error } = await supabase
    .from('vineyard_profiles')
    .upsert(row, { onConflict: 'user_id' });

  return { error: error || null };
}
