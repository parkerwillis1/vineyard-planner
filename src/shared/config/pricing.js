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
      'Export to PDF'
    ],
    limits: {
      plans: 1,
      acres: 10,
      users: 1
    }
  },
  starter: {
    id: 'starter',
    name: 'Vineyard',
    price: 29,
    billingPeriod: 'month',
    modules: ['planner', 'vineyard'],
    features: [
      'Unlimited plans',
      'Up to 50 acres',
      'Block mapping',
      'Task management',
      'Mobile app access',
      '2 team members'
    ],
    limits: {
      plans: -1, // unlimited
      acres: 50,
      blocks: 20,
      users: 2
    },
    popular: false
  },
  professional: {
    id: 'professional',
    name: 'Vineyard + Winery',
    price: 99,
    billingPeriod: 'month',
    modules: ['planner', 'vineyard', 'production', 'inventory'],
    features: [
      'Up to 200 acres',
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
      cases: 5000
    },
    popular: true
  },
  enterprise: {
    id: 'enterprise',
    name: 'Complete Platform',
    price: 249,
    billingPeriod: 'month',
    modules: ['planner', 'vineyard', 'production', 'inventory', 'sales'],
    features: [
      'Unlimited acres',
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
      cases: -1
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