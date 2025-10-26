const PRICE_ENV_MAP = {
  starter: 'VITE_STRIPE_PRICE_STARTER',
  professional: 'VITE_STRIPE_PRICE_PROFESSIONAL',
  enterprise: 'VITE_STRIPE_PRICE_ENTERPRISE',
};

export const getPriceIdForTier = (tierId) => {
  const envVar = PRICE_ENV_MAP[tierId];
  if (!envVar) return null;
  return import.meta.env[envVar] || null;
};

export const missingStripePrices = () => {
  return Object.entries(PRICE_ENV_MAP)
    .filter(([_, envVar]) => !import.meta.env[envVar])
    .map(([tier]) => tier);
};
