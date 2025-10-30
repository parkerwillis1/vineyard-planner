import { supabase } from './supabaseClient';

/* -------- CRUD helpers -------- */

export async function listPlans() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: null };

  return supabase
    .from('vineyard_plans')
    .select('id, name, updated_at, data')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });
}

export async function loadPlan(planId) {
  console.log('📥 loadPlan called:', planId);
  
  const { data, error } = await supabase
    .from('vineyard_plans')
    .select('data, updated_at')
    .eq('id', planId)
    .single();
  
  console.log('📥 loadPlan result:', { data, error });
  
  if (error) {
    console.error('❌ loadPlan error:', error);
    return { data: null, error };
  }
  
  // Return the nested data object plus metadata
  return { 
    data: data?.data ? {
      ...data.data,
      savedAt: data.updated_at
    } : null, 
    error: null 
  };
}

export async function savePlan(planId, payload) {
  console.log('📤 savePlan START', { 
    planId, 
    payloadKeys: Object.keys(payload),
    stKeys: payload.st ? Object.keys(payload.st) : 'NO ST',
    payloadSize: JSON.stringify(payload).length 
  });
  
  // Verify payload has required data
  if (!payload || !payload.st) {
    const error = new Error('Invalid payload: missing st');
    console.error('❌ savePlan validation failed:', error);
    return { error };
  }

  try {
    const result = await supabase
      .from('vineyard_plans')
      .update({ 
        data: payload,  // This should be a plain object, Supabase will convert to jsonb
        updated_at: new Date().toISOString() 
      })
      .eq('id', planId)
      .select('id, data, updated_at');
    
    console.log('📥 savePlan result:', {
      error: result.error,
      dataReturned: !!result.data,
      rowsAffected: result.data?.length,
      savedData: result.data?.[0]?.data ? 'YES' : 'NO'
    });
    
    if (result.error) {
      console.error('❌ savePlan error:', result.error);
    } else if (!result.data || result.data.length === 0) {
      console.error('⚠️ savePlan: No rows updated! Plan ID may not exist or user_id mismatch');
    } else {
      console.log('✅ savePlan successful');
    }
    
    return result;
  } catch (err) {
    console.error('💥 savePlan exception:', err);
    return { error: err };
  }
}

export async function createPlan(name, payload = null) {
  console.log('📝 createPlan called:', { name, hasPayload: !!payload });
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: new Error('No user logged in') };
  }

  const result = await supabase
    .from('vineyard_plans')
    .insert({
      user_id: user.id,
      name,
      data: payload || {},  // Ensure it's never null
    })
    .select('id, name, data')
    .single();
  
  console.log('📝 createPlan result:', result);
  return result;
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