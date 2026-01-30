import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/shared/lib/supabaseClient';
import { useAuth } from '@/auth/AuthContext';
import { useSubscription } from './useSubscription';
import { PRICING_TIERS } from '@/shared/config/pricing';

/**
 * Hook to track and enforce usage limits (PDF exports, plans, etc.)
 * Automatically resets monthly counters
 */
export const useUsageLimits = () => {
  const { user } = useAuth();
  const { tier, loading: subscriptionLoading } = useSubscription();
  const [usage, setUsage] = useState({
    pdfExportsThisMonth: 0,
    plansCount: 0,
    loading: true
  });

  const tierLimits = PRICING_TIERS[tier]?.limits || PRICING_TIERS.free.limits;

  // Fetch current usage from Supabase
  const fetchUsage = useCallback(async () => {
    if (!user) {
      setUsage({ pdfExportsThisMonth: 0, plansCount: 0, loading: false });
      return;
    }

    try {
      // Get current month/year for tracking
      const now = new Date();
      const currentMonth = now.getMonth() + 1; // 1-12
      const currentYear = now.getFullYear();

      // Fetch usage record for current month
      const { data: usageData, error: usageError } = await supabase
        .from('usage_tracking')
        .select('*')
        .eq('user_id', user.id)
        .eq('month', currentMonth)
        .eq('year', currentYear)
        .maybeSingle();

      // Ignore errors: PGRST116 = no rows, 42P01 = table doesn't exist
      if (usageError && usageError.code !== 'PGRST116' && usageError.code !== '42P01') {
        console.error('Error fetching usage:', usageError);
      }

      // Count user's plans
      const { count: plansCount, error: plansError } = await supabase
        .from('vineyard_plans')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (plansError) {
        console.error('Error counting plans:', plansError);
      }

      setUsage({
        pdfExportsThisMonth: usageData?.pdf_exports || 0,
        plansCount: plansCount || 0,
        loading: false
      });
    } catch (err) {
      console.error('Failed to load usage:', err);
      setUsage(prev => ({ ...prev, loading: false }));
    }
  }, [user]);

  useEffect(() => {
    if (!subscriptionLoading) {
      fetchUsage();
    }
  }, [subscriptionLoading, fetchUsage]);

  // Check if user can perform an action
  const canExportPDF = useCallback(() => {
    if (tierLimits.pdfExportsPerMonth === -1) return { allowed: true }; // unlimited

    const remaining = tierLimits.pdfExportsPerMonth - usage.pdfExportsThisMonth;
    return {
      allowed: remaining > 0,
      remaining,
      limit: tierLimits.pdfExportsPerMonth,
      used: usage.pdfExportsThisMonth
    };
  }, [tierLimits.pdfExportsPerMonth, usage.pdfExportsThisMonth]);

  const canCreatePlan = useCallback(() => {
    if (tierLimits.plans === -1) return { allowed: true }; // unlimited

    const remaining = tierLimits.plans - usage.plansCount;
    return {
      allowed: remaining > 0,
      remaining,
      limit: tierLimits.plans,
      used: usage.plansCount
    };
  }, [tierLimits.plans, usage.plansCount]);

  // Increment PDF export count
  const trackPDFExport = useCallback(async () => {
    if (!user) return false;

    const check = canExportPDF();
    if (!check.allowed) return false;

    try {
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      // Upsert usage record
      const { error } = await supabase
        .from('usage_tracking')
        .upsert({
          user_id: user.id,
          month: currentMonth,
          year: currentYear,
          pdf_exports: usage.pdfExportsThisMonth + 1
        }, {
          onConflict: 'user_id,month,year'
        });

      // Ignore if table doesn't exist (42P01), but still update local state
      if (error && error.code !== '42P01') {
        console.error('Error tracking PDF export:', error);
        return false;
      }

      // Update local state
      setUsage(prev => ({
        ...prev,
        pdfExportsThisMonth: prev.pdfExportsThisMonth + 1
      }));

      return true;
    } catch (err) {
      console.error('Failed to track PDF export:', err);
      return false;
    }
  }, [user, usage.pdfExportsThisMonth, canExportPDF]);

  return {
    usage,
    limits: tierLimits,
    tier,
    canExportPDF,
    canCreatePlan,
    trackPDFExport,
    loading: usage.loading || subscriptionLoading,
    refreshUsage: fetchUsage
  };
};
