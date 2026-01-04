import { supabase } from './supabaseClient';

/**
 * Activate a 2-week free trial for the current user
 * @returns {Object} { success: boolean, subscription: Object | null, error: string | null }
 */
export async function activateTrial() {
  try {
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        subscription: null,
        error: 'You must be signed in to activate a trial.'
      };
    }

    // Check if user already has a subscription record
    const { data: existingSubscription, error: fetchError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 means no rows found, which is fine
      console.error('[Trial] Error fetching subscription:', fetchError);
      return {
        success: false,
        subscription: null,
        error: 'Failed to check subscription status.'
      };
    }

    // Check if user already used their trial
    if (existingSubscription?.trial_ends_at) {
      return {
        success: false,
        subscription: existingSubscription,
        error: 'You have already used your free trial.'
      };
    }

    // Calculate trial end date (14 days from now)
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    // Update subscription to activate trial
    const { data: updatedSubscription, error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'trialing',
        trial_ends_at: trialEndsAt.toISOString(),
        tier: 'starter', // Give them starter tier during trial
        modules: ['planner', 'vineyard'] // Unlock planner + vineyard operations
      })
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('[Trial] Error activating trial:', updateError);
      return {
        success: false,
        subscription: null,
        error: 'Failed to activate trial. Please try again.'
      };
    }

    console.log('[Trial] Trial activated successfully:', updatedSubscription);

    return {
      success: true,
      subscription: updatedSubscription,
      error: null
    };
  } catch (error) {
    console.error('[Trial] Unexpected error:', error);
    return {
      success: false,
      subscription: null,
      error: 'An unexpected error occurred.'
    };
  }
}

/**
 * Check trial status for the current user
 * @returns {Object} { hasUsedTrial: boolean, isCurrentlyTrialing: boolean, daysRemaining: number | null }
 */
export async function checkTrialStatus() {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        hasUsedTrial: false,
        isCurrentlyTrialing: false,
        daysRemaining: null
      };
    }

    const { data: subscription, error: fetchError } = await supabase
      .from('subscriptions')
      .select('status, trial_ends_at')
      .eq('user_id', user.id)
      .single();

    if (fetchError || !subscription) {
      return {
        hasUsedTrial: false,
        isCurrentlyTrialing: false,
        daysRemaining: null
      };
    }

    const hasUsedTrial = !!subscription.trial_ends_at;
    const isCurrentlyTrialing = subscription.status === 'trialing';

    let daysRemaining = null;
    if (isCurrentlyTrialing && subscription.trial_ends_at) {
      const now = new Date();
      const endDate = new Date(subscription.trial_ends_at);
      const diffTime = endDate - now;
      daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    return {
      hasUsedTrial,
      isCurrentlyTrialing,
      daysRemaining
    };
  } catch (error) {
    console.error('[Trial] Error checking trial status:', error);
    return {
      hasUsedTrial: false,
      isCurrentlyTrialing: false,
      daysRemaining: null
    };
  }
}
