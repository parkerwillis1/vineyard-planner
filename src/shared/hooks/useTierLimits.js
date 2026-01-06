import { useMemo } from 'react';
import { useSubscription } from './useSubscription';
import { PRICING_TIERS } from '../config/pricing';

/**
 * Hook to check and enforce tier limits
 * @returns {Object} Limit checking utilities
 */
export function useTierLimits() {
  const subscription = useSubscription();

  const tierLimits = useMemo(() => {
    const tier = PRICING_TIERS[subscription.tier] || PRICING_TIERS.free;
    return tier.limits;
  }, [subscription.tier]);

  /**
   * Check if a limit has been reached
   * @param {string} limitType - Type of limit (plans, acres, users, etc.)
   * @param {number} currentValue - Current value to check against limit
   * @returns {boolean} True if limit is reached or exceeded
   */
  const isLimitReached = (limitType, currentValue) => {
    const limit = tierLimits[limitType];

    // -1 means unlimited
    if (limit === -1) return false;

    // Check if current value meets or exceeds the limit
    return currentValue >= limit;
  };

  /**
   * Check if adding more would exceed the limit
   * @param {string} limitType - Type of limit
   * @param {number} currentValue - Current value
   * @param {number} adding - Amount trying to add (default 1)
   * @returns {boolean} True if adding would exceed limit
   */
  const wouldExceedLimit = (limitType, currentValue, adding = 1) => {
    const limit = tierLimits[limitType];

    // -1 means unlimited
    if (limit === -1) return false;

    // Check if adding would push over the limit
    return (currentValue + adding) > limit;
  };

  /**
   * Get remaining allowance for a limit type
   * @param {string} limitType - Type of limit
   * @param {number} currentValue - Current value
   * @returns {number} Remaining amount (-1 for unlimited)
   */
  const getRemainingAllowance = (limitType, currentValue) => {
    const limit = tierLimits[limitType];

    // -1 means unlimited
    if (limit === -1) return -1;

    const remaining = limit - currentValue;
    return Math.max(0, remaining);
  };

  /**
   * Get formatted limit display
   * @param {string} limitType - Type of limit
   * @returns {string} Formatted limit text
   */
  const getLimitDisplay = (limitType) => {
    const limit = tierLimits[limitType];

    if (limit === -1) return 'Unlimited';
    return `${limit}`;
  };

  /**
   * Get limit with current usage
   * @param {string} limitType - Type of limit
   * @param {number} currentValue - Current usage
   * @returns {string} Formatted usage text (e.g., "5 / 10")
   */
  const getUsageDisplay = (limitType, currentValue) => {
    const limit = tierLimits[limitType];

    if (limit === -1) return `${currentValue}`;
    return `${currentValue} / ${limit}`;
  };

  return {
    tierLimits,
    isLimitReached,
    wouldExceedLimit,
    getRemainingAllowance,
    getLimitDisplay,
    getUsageDisplay,
    tierName: PRICING_TIERS[subscription.tier]?.name || 'Free',
    tierId: subscription.tier
  };
}
