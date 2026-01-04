# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
vite build

# Preview production build
npm run preview
```

## Project Overview

Trellis is a React-based SaaS application for vineyard planning and management, built with Vite, React 19, TailwindCSS, and Supabase.

## Architecture

### Module-Based Feature Structure

The application uses a **modular architecture** defined in `src/shared/config/modules.js`. Each module represents a major feature set with associated pricing tiers:

- **planner** (free tier): Financial planning and vineyard design
- **vineyard** (starter tier): Operations, block mapping, task management (coming soon)
- **production** (professional tier): Winery production tracking (coming soon)
- **inventory** (professional tier): Grape, wine, and bottle inventory (coming soon)
- **sales** (enterprise tier): CRM and distribution (coming soon)

Module access is controlled through the subscription system (`useSubscription` and `useModuleAccess` hooks).

### Directory Structure

```
src/
├── app/                    # Application-level routing and layout
│   ├── router.jsx          # Main router with ProtectedRoute wrapper
│   └── layout/             # Layout components (SiteLayout)
├── auth/                   # Authentication (AuthContext, SignIn/SignUp)
├── features/               # Feature modules (currently only planning)
│   └── planning/
│       ├── components/     # VineyardLayoutCalculator, MaterialCostsVisualizer
│       └── pages/          # PlannerShell (main planner UI)
├── shared/                 # Shared utilities and components
│   ├── components/         # Reusable UI (NavBar, ModuleNav, UpgradeModal, etc.)
│   │   └── ui/            # Base UI components (button, card, input, etc.)
│   ├── config/            # Module and pricing configuration (MODULES, PRICING_TIERS)
│   ├── hooks/             # useSubscription, useModuleAccess
│   └── lib/               # Supabase client, plansApi, saveLoadPlanner
└── pages/                  # Legacy pages (being migrated to features/)
```

### Authentication & Authorization

- **Authentication**: Managed via `AuthContext` (`src/auth/AuthContext.jsx`) wrapping Supabase auth
- **Authorization**: Subscription-based tier system controls module access
  - User's subscription tier stored in Supabase `subscriptions` table
  - `useSubscription` hook provides realtime subscription data
  - `useModuleAccess` hook determines if user can access specific modules
  - `ProtectedRoute` wrapper ensures authentication before accessing routes

### Data Persistence

**Supabase Tables:**
- `vineyard_plans`: User's saved vineyard plans (id, user_id, name, data, updated_at)
- `vineyard_profiles`: Legacy single-plan storage (being deprecated in favor of multiple plans)
- `subscriptions`: User subscription tiers and modules

**API Layer:**
- `src/shared/lib/plansApi.js`: CRUD operations for vineyard plans (listPlans, loadPlan, savePlan, createPlan, renamePlan, deletePlan)
- `src/shared/lib/saveLoadPlanner.js`: Legacy single-plan persistence (loadPlanner, savePlanner)

**Data Structure:**
Plans store a `data` object (JSONB in Supabase) containing:
- `st`: State object with vineyard parameters (acres, spacing, materials, costs)
- `projYears`: 10-year financial projections
- `calculatedLayout`: Computed vineyard layout
- `materialCosts`: Computed material costs

### State Management

The application uses **React context + local state** rather than Redux:
- `AuthContext`: User authentication state
- `SubscriptionContext`: User's subscription tier and module access
- Local state in `PlannerShell.jsx`: Planner data (st, projYears) with dirty tracking

**Dirty Tracking**: `PlannerShell` maintains `savedState` vs current state to show unsaved changes indicator. Volatile keys (like `calculatedLayout`, `lastComputed`) are excluded from dirty detection via `VOLATILE_KEYS` set.

### Import Aliases

The project uses `@/` alias for `src/`:
```javascript
import { useAuth } from '@/auth/AuthContext.jsx';
```

Configured in both `vite.config.js` and `jsconfig.json`.

## Environment Variables

Create `.env.local` with:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Note: Vite uses `VITE_` prefix (not `REACT_APP_`) for environment variables.

## Key Patterns

### Adding a New Module

1. Add module definition to `MODULES` in `src/shared/config/modules.js`
2. Add corresponding tier to `PRICING_TIERS` in `src/shared/config/pricing.js`
3. Create feature directory under `src/features/{module-name}/`
4. Add route in `src/app/router.jsx`
5. Module access is automatically handled by `useModuleAccess` hook

### Creating Feature Components

Follow the feature-based structure:
```
src/features/{feature-name}/
├── components/     # Feature-specific components
├── pages/          # Feature page shells
└── services/       # Feature-specific business logic (optional)
```

Use shared UI components from `src/shared/components/ui/` for consistency.

### Working with Supabase

All Supabase queries should:
1. Import from `@/shared/lib/supabaseClient`
2. Check for user authentication first
3. Handle errors gracefully (check for `PGRST116` "not found" error code)
4. Use `.select()` after mutations to get updated data

### Subscription Checks

Always use `useModuleAccess` or `useSubscription` hooks to check access:
```javascript
const { hasAccess, locked, reason } = useModuleAccess('vineyard');
```

Show `UpgradeModal` component when user lacks access to a feature.

## Common Gotchas

- **Dirty state tracking**: Computed fields must be in `VOLATILE_KEYS` to avoid false-positive unsaved changes
- **Environment variables**: Must use `VITE_` prefix (Vite) not `REACT_APP_` (Create React App)
- **Supabase queries**: Always use `.select()` after insert/update operations to get returned data
- **Auth checks**: Use `ProtectedRoute` wrapper for authenticated routes, not manual redirects
