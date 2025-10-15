import { supabase } from './supabaseClient';

/* -------- CRUD helpers -------- */

export async function listPlans() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: null };

  return supabase
    .from('vineyard_plans')
    .select('id, name, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });
}

export async function loadPlan(planId) {
  const { data, error } = await supabase
    .from('vineyard_plans')
    .select('data')
    .eq('id', planId)
    .single();
  return { data: data?.data ?? null, error };
}

export async function savePlan(planId, payload) {
  console.log('📤 savePlan called:', { planId, payload });
  
  const result = await supabase
    .from('vineyard_plans')
    .update({ 
      data: payload, 
      updated_at: new Date().toISOString() 
    })
    .eq('id', planId)
    .select(); // ⭐ ADD .select() to return the updated row
  
  console.log('📥 savePlan result:', result);
  return result;
}

export async function createPlan(name, payload = null) {
  const { data: { user } } = await supabase.auth.getUser();
  return supabase.from('vineyard_plans').insert({
    user_id: user.id,
    name,
    data: payload,
  }).select('id').single();
}

export async function renamePlan(planId, newName) {
  return supabase
    .from('vineyard_plans')
    .update({ name: newName })
    .eq('id', planId);
}

export async function deletePlan(planId) {
  return supabase
    .from('vineyard_plans')
    .delete()
    .eq('id', planId);
}
