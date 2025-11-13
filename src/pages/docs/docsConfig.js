// Documentation navigation structure
export const docsNavigation = [
  {
    title: "Getting Started",
    items: [
      { title: "Overview", href: "/docs" },
      { title: "Quick Start", href: "/docs/getting-started/quick-start" },
      { title: "Core Concepts", href: "/docs/getting-started/concepts" },
    ],
  },
  {
    title: "Vineyard Planner",
    items: [
      { title: "Overview", href: "/docs/planner" },
      { title: "Design Tab", href: "/docs/planner/design" },
      { title: "Financial Inputs", href: "/docs/planner/financial-inputs" },
      { title: "Vineyard Setup", href: "/docs/planner/vineyard-setup" },
      { title: "10-Year Plan", href: "/docs/planner/ten-year-plan" },
      { title: "Details Tab", href: "/docs/planner/details" },
      { title: "Financial Formulas", href: "/docs/planner/formulas" },
      { title: "Best Practices", href: "/docs/planner/best-practices" },
    ],
  },
  {
    title: "Vineyard Operations",
    items: [
      { title: "Overview", href: "/docs/operations" },
      { title: "Block Management", href: "/docs/operations/blocks" },
      { title: "Irrigation System", href: "/docs/operations/irrigation" },
      { title: "Task Management", href: "/docs/operations/tasks" },
      { title: "Spray Records", href: "/docs/operations/spray" },
      { title: "Team Management", href: "/docs/operations/team" },
      { title: "Calendar View", href: "/docs/operations/calendar" },
      { title: "Analytics Dashboard", href: "/docs/operations/analytics" },
      { title: "Hardware Integration", href: "/docs/operations/hardware" },
    ],
  },
  {
    title: "Resources",
    items: [
      { title: "FAQ", href: "/docs/faq" },
      { title: "Troubleshooting", href: "/docs/troubleshooting" },
      { title: "Support", href: "/docs/support" },
    ],
  },
];

// Breadcrumb helper
export function getBreadcrumbs(pathname) {
  const parts = pathname.split('/').filter(Boolean);
  const breadcrumbs = [{ title: 'Docs', href: '/docs' }];

  let currentPath = '';
  for (let i = 1; i < parts.length; i++) {
    currentPath += '/' + parts[i];
    const fullPath = '/docs' + currentPath;

    // Find the title from navigation
    let title = parts[i].split('-').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');

    // Try to find exact match in navigation
    for (const section of docsNavigation) {
      const item = section.items.find(item => item.href === fullPath);
      if (item) {
        title = item.title;
        break;
      }
    }

    breadcrumbs.push({ title, href: fullPath });
  }

  return breadcrumbs;
}
