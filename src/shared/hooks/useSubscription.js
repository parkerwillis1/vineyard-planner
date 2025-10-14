import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/shared/lib/supabaseClient';
import { useAuth } from '@/auth/AuthContext';

const SubscriptionContext = createContext(null);

export const SubscriptionProvider = ({ children }) => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState({
    tier: 'free',
    modules: ['planner'],
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
        modules: ['planner'],
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
          setSubscription({
            tier: data.tier,
            modules: data.modules || [],
            status: data.status,
            trialEndsAt: data.trial_ends_at,
            cancelAt: data.cancel_at,
            loading: false
          });
        } else {
          // User exists but no subscription record - default to free
          setSubscription({
            tier: 'free',
            modules: ['planner'],
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
    const subscription = supabase
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
            setSubscription({
              tier: payload.new.tier,
              modules: payload.new.modules || [],
              status: payload.new.status,
              trialEndsAt: payload.new.trial_ends_at,
              cancelAt: payload.new.cancel_at,
              loading: false
            });
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
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