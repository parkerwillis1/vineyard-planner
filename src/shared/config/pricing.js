// Pricing tiers configuration
export const PRICING_TIERS = {
  free: {
    id: 'free',
    name: 'Starter',
    tagline: 'Plan your vineyard investment',
    price: 0,
    billingPeriod: 'forever',
    modules: ['planner'],
    tools: ['Financial Planner'],
    features: [
      '1 vineyard plan',
      'Up to 10 acres',
      '10-year financial projections',
      'Loan comparison tools',
      '3 PDF exports per month'
    ],
    limits: {
      plans: 1,
      acres: 10,
      users: 1,
      pdfExportsPerMonth: 3
    }
  },
  professional: {
    id: 'professional',
    name: 'Professional',
    tagline: 'Manage your vineyard operations',
    price: 49,
    billingPeriod: 'month',
    modules: ['planner', 'vineyard'],
    tools: ['Financial Planner', 'Vineyard Operations'],
    features: [
      'Unlimited plans',
      'Up to 50 acres',
      'Satellite NDVI monitoring',
      'Task & team management',
      'Unlimited PDF exports',
      '3 team members'
    ],
    limits: {
      plans: -1, // unlimited
      acres: 50,
      blocks: 20,
      users: 3,
      pdfExportsPerMonth: -1 // unlimited
    },
    popular: false
  },
  estate: {
    id: 'estate',
    name: 'Estate',
    tagline: 'Full vineyard & winery management',
    price: 109,
    billingPeriod: 'month',
    modules: ['planner', 'vineyard', 'production', 'inventory'],
    tools: ['Financial Planner', 'Vineyard Operations', 'Wine Production'],
    features: [
      'Unlimited plans',
      'Up to 100 acres',
      'Fermentation & barrel tracking',
      'TTB compliance reports',
      'Inventory management',
      '10 team members',
      'Priority support'
    ],
    limits: {
      plans: -1,
      acres: 100,
      blocks: 100,
      users: 10,
      cases: 5000,
      pdfExportsPerMonth: -1
    },
    popular: true
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    tagline: 'Complete vineyard & winery platform',
    price: 249,
    billingPeriod: 'month',
    modules: ['planner', 'vineyard', 'production', 'inventory', 'sales'],
    tools: ['Financial Planner', 'Vineyard Operations', 'Wine Production', 'Sales & Distribution'],
    features: [
      'Unlimited plans',
      'Unlimited acres',
      'CRM & customer management',
      'Unlimited team members',
      'API access',
      'Dedicated support',
      'Custom integrations'
    ],
    limits: {
      plans: -1,
      acres: -1,
      blocks: -1,
      users: -1,
      cases: -1,
      pdfExportsPerMonth: -1
    },
    popular: false
  }
};

// Helper to get tier by module
export const getTierForModule = (moduleId) => {
  return Object.values(PRICING_TIERS).find(tier => 
    tier.modules.includes(moduleId)
  );
};

// Helper to check if tier includes module
export const tierIncludesModule = (tierId, moduleId) => {
  const tier = PRICING_TIERS[tierId];
  return tier ? tier.modules.includes(moduleId) : false;
};