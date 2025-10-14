// Module definitions - single source of truth
export const MODULES = {
  planner: {
    id: 'planner',
    name: 'Financial Planner',
    description: 'Design your vineyard and project costs',
    icon: 'Calculator',
    requiredTier: 'free',
    route: '/planner',
    tabs: [
      { id: 'design', label: 'Design' },
      { id: 'inputs', label: 'Financial Inputs' },
      { id: 'establishment', label: 'Vineyard Setup' },
      { id: 'proj', label: '10-Year Plan' },
      { id: 'details', label: 'Details' }
    ]
  },
  vineyard: {
    id: 'vineyard',
    name: 'Vineyard Operations',
    description: 'Manage blocks, tasks, and harvest tracking',
    icon: 'MapPin',
    requiredTier: 'starter',
    comingSoon: true,
    expectedLaunch: 'Q2 2025',
    route: '/vineyard',
    tabs: [
      { id: 'blocks', label: 'Blocks & Mapping' },
      { id: 'tasks', label: 'Task Management' },
      { id: 'spray-logs', label: 'Spray Logs' },
      { id: 'harvest', label: 'Harvest Tracking' }
    ]
  },
  production: {
    id: 'production',
    name: 'Winery Production',
    description: 'Track crush, fermentation, and bottling',
    icon: 'Droplet',
    requiredTier: 'professional',
    comingSoon: true,
    expectedLaunch: 'Q4 2025',
    route: '/production',
    tabs: [
      { id: 'crush', label: 'Crush Planning' },
      { id: 'fermentation', label: 'Fermentation' },
      { id: 'barrels', label: 'Barrel Management' },
      { id: 'bottling', label: 'Bottling' }
    ]
  },
  inventory: {
    id: 'inventory',
    name: 'Inventory',
    description: 'Manage grape, wine, and bottle inventory',
    icon: 'Package',
    requiredTier: 'professional',
    comingSoon: true,
    expectedLaunch: 'Q4 2025',
    route: '/inventory',
    tabs: [
      { id: 'grapes', label: 'Grape Inventory' },
      { id: 'wine', label: 'Wine Inventory' },
      { id: 'bottles', label: 'Bottle Stock' },
      { id: 'supplies', label: 'Supplies & Materials' }
    ]
  },
  sales: {
    id: 'sales',
    name: 'Sales & Distribution',
    description: 'CRM, orders, and wine club management',
    icon: 'ShoppingCart',
    requiredTier: 'enterprise',
    comingSoon: true,
    expectedLaunch: 'Q2 2026',
    route: '/sales',
    tabs: [
      { id: 'customers', label: 'Customer Management' },
      { id: 'orders', label: 'Orders & Invoices' },
      { id: 'wine-club', label: 'Wine Club' },
      { id: 'reports', label: 'Sales Reports' }
    ]
  }
};

// Helper to get module by tab ID
export const getModuleByTab = (tabId) => {
  return Object.values(MODULES).find(module => 
    module.tabs.some(tab => tab.id === tabId)
  );
};

// Helper to get all tab IDs
export const getAllTabIds = () => {
  return Object.values(MODULES).flatMap(module => 
    module.tabs.map(tab => tab.id)
  );
};