import { useMemo } from 'react';
import { useSubscription } from './useSubscription';
import { MODULES } from '../config/modules';
import { PRICING_TIERS } from '../config/pricing';

// ✅ SIMPLIFIED: Just returns the access info, doesn't need moduleId as param anymore
export const useAllModuleAccess = () => {
  const subscription = useSubscription();

  return useMemo(() => {
    const accessMap = {};
    
    Object.entries(MODULES).forEach(([moduleId, module]) => {
      const hasAccess = subscription.modules.includes(moduleId);

      if (hasAccess) {
        accessMap[moduleId] = {
          hasAccess: true,
          locked: false
        };
      } else if (module.comingSoon) {
        accessMap[moduleId] = {
          hasAccess: false,
          locked: true,
          reason: 'coming-soon',
          message: `Coming Soon! Expected launch: ${module.expectedLaunch}`,
          cta: 'Join Waitlist'
        };
      } else {
        const requiredTier = PRICING_TIERS[module.requiredTier];
        accessMap[moduleId] = {
          hasAccess: false,
          locked: true,
          reason: 'upgrade-required',
          message: `Unlock ${module.name} with ${requiredTier.name} tier`,
          cta: 'Upgrade Now',
          requiredTier: module.requiredTier,
          currentTier: subscription.tier
        };
      }
    });
    
    return accessMap;
  }, [subscription]);
};

// ✅ Keep original for single module checks (used elsewhere)
export const useModuleAccess = (moduleId) => {
  const allAccess = useAllModuleAccess();
  return allAccess[moduleId] || { hasAccess: false, locked: true, reason: 'not-found' };
};