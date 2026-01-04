// Pricing tiers configuration
export const PRICING_TIERS = {
  free: {
    id: 'free',
    name: 'Planner',
    price: 0,
    billingPeriod: 'forever',
    modules: ['planner'],
    features: [
      '1 vineyard plan',
      'Up to 10 acres',
      'Basic financial projections',
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
    name: 'Vineyard',
    price: 49,
    billingPeriod: 'month',
    modules: ['planner', 'vineyard'],
    features: [
      'Unlimited plans',
      'Up to 50 acres',
      'Unlimited PDF exports',
      'Block mapping',
      'Task management',
      'Mobile app access',
      '2 team members'
    ],
    limits: {
      plans: -1, // unlimited
      acres: 50,
      blocks: 20,
      users: 2,
      pdfExportsPerMonth: -1 // unlimited
    },
    popular: false
  },
  estate: {
    id: 'estate',
    name: 'Vineyard + Winery',
    price: 109,
    billingPeriod: 'month',
    modules: ['planner', 'vineyard', 'production', 'inventory'],
    features: [
      'Unlimited plans',
      'Up to 200 acres',
      'Unlimited PDF exports',
      'Production tracking',
      'Inventory management',
      'TTB compliance',
      '10 team members',
      'Priority support'
    ],
    limits: {
      plans: -1,
      acres: 200,
      blocks: 100,
      users: 10,
      cases: 5000,
      pdfExportsPerMonth: -1
    },
    popular: true
  },
  enterprise: {
    id: 'enterprise',
    name: 'End-to-End Platform',
    price: 249,
    billingPeriod: 'month',
    modules: ['planner', 'vineyard', 'production', 'inventory', 'sales'],
    features: [
      'Unlimited plans',
      'Unlimited acres',
      'Unlimited PDF exports',
      'All modules',
      'CRM & sales',
      'API access',
      'Unlimited users',
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