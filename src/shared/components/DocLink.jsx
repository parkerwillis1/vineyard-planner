import React from 'react';
import { HelpCircle } from 'lucide-react';

/**
 * DocLink - A link component to embed in page descriptions
 * Links to the documentation for that specific page
 *
 * Usage:
 * <p className="text-sm text-gray-500 mt-1">
 *   Description text. <DocLink docId="operations/irrigation" />
 * </p>
 */

// Map docIds to actual documentation routes
const docRoutes = {
  // Vineyard Operations
  'operations/dashboard': '/docs/operations/dashboard',
  'operations/fields': '/docs/operations/blocks',
  'operations/blocks': '/docs/operations/blocks',
  'operations/irrigation': '/docs/operations/irrigation',
  'operations/weather': '/docs/operations/weather',
  'operations/tasks': '/docs/operations/tasks',
  'operations/spray': '/docs/operations/spray',
  'operations/spray-records': '/docs/operations/spray',
  'operations/harvest': '/docs/operations/harvest',
  'operations/team': '/docs/operations/team',
  'operations/my-vineyard': '/docs/operations/team',
  'operations/labor': '/docs/operations/labor',
  'operations/equipment': '/docs/operations/equipment',
  'operations/inventory': '/docs/operations/inventory',
  'operations/calendar': '/docs/operations/calendar',
  'operations/analytics': '/docs/operations/analytics',
  'operations/hardware': '/docs/operations/hardware',
  'operations/devices': '/docs/operations/hardware',
  'operations/archived': '/docs/operations/archived',

  // Wine Production
  'production/dashboard': '/docs/production/dashboard',
  'production/harvest': '/docs/production/harvest',
  'production/harvest-intake': '/docs/production/harvest',
  'production/fermentation': '/docs/production/fermentation',
  'production/vessels': '/docs/production/vessels',
  'production/containers': '/docs/production/vessels',
  'production/blending': '/docs/production/blending',
  'production/aging': '/docs/production/aging',
  'production/lab': '/docs/production/lab',
  'production/bottling': '/docs/production/bottling',
  'production/analytics': '/docs/production/analytics',
  'production/reports': '/docs/production/reports',
  'production/sensors': '/docs/production/sensors',
  'production/archives': '/docs/production/archives',

  // Financial Planner
  'planner/overview': '/docs/planner',
  'planner/design': '/docs/planner/design',
  'planner/vineyard-design': '/docs/planner/design',
  'planner/financial-inputs': '/docs/planner/financial-inputs',
  'planner/vineyard-setup': '/docs/planner/vineyard-setup',
  'planner/10-year-plan': '/docs/planner/ten-year-plan',
  'planner/ten-year-plan': '/docs/planner/ten-year-plan',
  'planner/details': '/docs/planner/details',
  'planner/formulas': '/docs/planner/formulas',
  'planner/best-practices': '/docs/planner/best-practices',
  'planner/business-plan': '/docs/planner/details',

  // Account
  'account/settings': '/docs/faq',
};

export function DocLink({ docId, text = "Learn how to use this page" }) {
  // Look up the route, fallback to constructed path if not found
  const docPath = docRoutes[docId] || `/docs/${docId.replace(/^(operations|production|planner)\//, '$1/')}`;

  return (
    <span className="block mt-1">
      <a
        href={docPath}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:underline"
      >
        <HelpCircle className="w-3.5 h-3.5" />
        <span>{text}</span>
      </a>
    </span>
  );
}

/**
 * PageHeader - A standardized page header with title, description, and doc link
 *
 * Usage:
 * <PageHeader
 *   title="Irrigation Management"
 *   description="Monitor soil moisture, create irrigation zones, and manage schedules"
 *   docId="operations/irrigation"
 * />
 */
export function PageHeader({ title, description, docId }) {
  return (
    <div className="pt-4">
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      <p className="text-sm text-gray-500 mt-1">
        {description}
        {docId && (
          <>
            {'. '}
            <DocLink docId={docId} />
          </>
        )}
      </p>
    </div>
  );
}

/**
 * Helper to create description with doc link for inline use
 */
export function withDocLink(description, docId) {
  return (
    <>
      {description}{'. '}
      <DocLink docId={docId} />
    </>
  );
}

export default DocLink;
