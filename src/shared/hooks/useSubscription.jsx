import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/shared/lib/supabaseClient';
import { useAuth } from '@/auth/AuthContext';
import { MODULES } from '@/shared/config/modules';

const SubscriptionContext = createContext(null);

// Helper function to get modules for a tier
const getModulesForTier = (tier) => {
  const tierHierarchy = {
    free: ['free'],
    starter: ['free', 'starter'],
    professional: ['free', 'starter', 'professional'],
    enterprise: ['free', 'starter', 'professional', 'enterprise']
  };

  const allowedTiers = tierHierarchy[tier] || ['free'];

  return Object.values(MODULES)
    .filter(module => allowedTiers.includes(module.requiredTier))
    .map(module => module.id);
};

export const SubscriptionProvider = ({ children }) => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState({
    tier: 'free',
    modules: getModulesForTier('free'),
    status: 'active',
    trialEndsAt: null,
    cancelAt: null,
    loading: true
  });

  useEffect(() => {
    if (!user) {
      // Not logged in - free tier only
      setSubscription({
        tier: 'free',
        modules: getModulesForTier('free'),
        status: 'active',
        trialEndsAt: null,
        cancelAt: null,
        loading: false
      });
      return;
    }

    // Fetch user's subscription from Supabase
    const fetchSubscription = async () => {
      try {
        const { data, error } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') { // Not found is OK
          console.error('Error fetching subscription:', error);
        }

        if (data) {
          const tier = data.tier || 'free';
          console.log('[Subscription] Loaded from DB:', {
            tier,
            modules: data.modules,
            status: data.status
          });
          setSubscription({
            tier: tier,
            modules: data.modules || ['planner'], // Use actual modules from database
            status: data.status,
            trialEndsAt: data.trial_ends_at,
            cancelAt: data.cancel_at,
            loading: false
          });
        } else {
          // User exists but no subscription record - default to free
          setSubscription({
            tier: 'free',
            modules: getModulesForTier('free'),
            status: 'active',
            trialEndsAt: null,
            cancelAt: null,
            loading: false
          });
        }
      } catch (err) {
        console.error('Failed to load subscription:', err);
        setSubscription(prev => ({ ...prev, loading: false }));
      }
    };

    fetchSubscription();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('subscription-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscriptions',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.new) {
            const tier = payload.new.tier || 'free';
            setSubscription({
              tier: tier,
              modules: payload.new.modules || ['planner'], // Use actual modules from database
              status: payload.new.status,
              trialEndsAt: payload.new.trial_ends_at,
              cancelAt: payload.new.cancel_at,
              loading: false
            });
          }
        }
      )
      .subscribe();

    // Listen for network reconnection and refresh subscription
    const handleOnline = () => {
      console.log('Network reconnected, refreshing subscription...');
      fetchSubscription();
    };

    // Listen for page visibility changes (user returns to tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // User returned to the tab, refresh subscription to ensure fresh data
        fetchSubscription();
      }
    };

    window.addEventListener('online', handleOnline);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Listen for auth state changes (session refresh, etc.)
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
        console.log('Auth state changed, refreshing subscription...');
        fetchSubscription();
      }
    });

    return () => {
      channel.unsubscribe();
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      authListener?.subscription?.unsubscribe();
    };
  }, [user]);

  return (
    <SubscriptionContext.Provider value={subscription}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within SubscriptionProvider');
  }
  return context;
};