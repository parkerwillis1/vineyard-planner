# Tier Limits Implementation Summary

## ✅ Completed

### 1. Updated Pricing Configuration (`src/shared/config/pricing.js`)

**Free Tier:**
- 1 plan
- Up to 10 acres
- Basic financial projections
- 3 PDF exports per month
- 1 user

**Professional Tier (Vineyard Operations):**
- Unlimited plans
- Up to 50 acres
- Unlimited PDF exports
- Block mapping
- Task management
- Mobile app access
- **3 team members** (updated from 2)

**Estate Tier:**
- Unlimited plans
- Up to 200 acres
- Unlimited PDF exports
- Production tracking
- Inventory management
- TTB compliance
- 10 team members
- Priority support

**Enterprise Tier:**
- Unlimited everything

### 2. Created `useTierLimits` Hook (`src/shared/hooks/useTierLimits.js`)

This hook provides utilities for checking and enforcing limits:

```javascript
const {
  tierLimits,           // Current tier's limits object
  isLimitReached,       // Check if at/over limit
  wouldExceedLimit,     // Check if action would exceed limit
  getRemainingAllowance, // Get remaining count
  getLimitDisplay,      // Get formatted limit (e.g., "10" or "Unlimited")
  getUsageDisplay,      // Get usage string (e.g., "5 / 10")
  tierName,            // Current tier name
  tierId               // Current tier ID
} = useTierLimits();
```

### 3. Updated PlansPage (`src/shared/components/PlansPage.jsx`)

**Added:**
- Plan limit enforcement - prevents creating plans beyond tier limit
- Visual indicator showing current usage (e.g., "Plans: 1 / 1")
- Warning message when limit is reached
- Disabled "Create" button when at limit
- Upgrade modal trigger when limit is hit

## 🔨 Next Steps - Need Implementation

### 1. Acres Limit Enforcement in Planner

**Location:** `src/features/planning/components/VineyardLayoutCalculator.jsx` or `PlannerShell.jsx`

**What to add:**
```javascript
import { useTierLimits } from '@/shared/hooks/useTierLimits';

// In the component
const { wouldExceedLimit, tierLimits, getUsageDisplay } = useTierLimits();

// When user inputs acres or before saving
function handleAcresChange(newAcres) {
  if (wouldExceedLimit('acres', 0, newAcres)) {
    // Show upgrade modal or warning
    setShowUpgradeModal(true);
    return;
  }
  // Allow the change
  setAcres(newAcres);
}
```

**UI to add:**
- Display acre limit indicator (e.g., "Acres: 5 / 10")
- Prevent input above limit or show warning
- Show upgrade modal when limit is exceeded

### 2. Team Members Limit Enforcement

**Location:** Where team invitations/members are managed (need to find this component)

**What to add:**
```javascript
import { useTierLimits } from '@/shared/hooks/useTierLimits';

// In the team management component
const { wouldExceedLimit, tierLimits, getUsageDisplay } = useTierLimits();

// Before sending invite
function handleInviteTeamMember() {
  const currentMemberCount = teamMembers.length;

  if (wouldExceedLimit('users', currentMemberCount)) {
    setShowUpgradeModal(true);
    return;
  }

  // Send invite
}
```

**UI to add:**
- Display team member limit (e.g., "Team: 2 / 3")
- Disable "Invite" button when at limit
- Show upgrade modal when limit is reached

### 3. PDF Export Limit Enforcement

**Location:** Where PDF exports are generated

**What to add:**
- Track monthly PDF exports in database
- Check against `tierLimits.pdfExportsPerMonth`
- Show remaining exports (e.g., "PDF Exports this month: 2 / 3")
- Reset count at start of each month

### 4. Database Schema Updates Needed

**Add to `subscriptions` table or create new `usage_tracking` table:**

```sql
CREATE TABLE usage_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  month DATE NOT NULL, -- YYYY-MM-01
  pdf_exports INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, month)
);
```

### 5. Block Limit Enforcement (Professional: 20, Estate: 100)

**Location:** Block mapping component

**What to add:**
- Check `tierLimits.blocks` before creating new block
- Show blocks usage (e.g., "Blocks: 15 / 20")
- Prevent creating blocks beyond limit

### 6. Cases Limit Enforcement (Estate only: 5000 cases)

**Location:** Production/inventory tracking

**What to add:**
- Check `tierLimits.cases` before adding production
- Show cases usage
- Prevent exceeding production limits

## Usage Examples

### Example 1: Enforce Acres in Planner

```jsx
import { useTierLimits } from '@/shared/hooks/useTierLimits';
import { useState } from 'react';
import { UpgradeModal } from '@/shared/components/UpgradeModal';

export default function AcresInput({ value, onChange }) {
  const { wouldExceedLimit, tierLimits, getUsageDisplay } = useTierLimits();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const handleChange = (newValue) => {
    if (wouldExceedLimit('acres', 0, newValue)) {
      setShowUpgradeModal(true);
      return;
    }
    onChange(newValue);
  };

  return (
    <div>
      <label>
        Vineyard Acres
        {tierLimits.acres !== -1 && (
          <span className="text-xs text-gray-500 ml-2">
            (Max: {tierLimits.acres})
          </span>
        )}
      </label>
      <input
        type="number"
        value={value}
        onChange={e => handleChange(Number(e.target.value))}
        max={tierLimits.acres === -1 ? undefined : tierLimits.acres}
      />

      {showUpgradeModal && (
        <UpgradeModal
          moduleId="vineyard"
          onClose={() => setShowUpgradeModal(false)}
        />
      )}
    </div>
  );
}
```

### Example 2: Team Member Limit

```jsx
export default function TeamManagement() {
  const { wouldExceedLimit, tierLimits, getUsageDisplay } = useTierLimits();
  const [teamMembers, setTeamMembers] = useState([]);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const canAddMember = !wouldExceedLimit('users', teamMembers.length);

  return (
    <div>
      <h2>Team Members {getUsageDisplay('users', teamMembers.length)}</h2>

      <button
        onClick={handleInvite}
        disabled={!canAddMember}
      >
        {canAddMember ? 'Invite Member' : 'Limit Reached'}
      </button>

      {showUpgradeModal && (
        <UpgradeModal
          moduleId="vineyard"
          onClose={() => setShowUpgradeModal(false)}
        />
      )}
    </div>
  );
}
```

## Testing Checklist

- [ ] Free tier users can only create 1 plan
- [ ] Free tier users see upgrade prompt when trying to create 2nd plan
- [ ] Free tier users can only input up to 10 acres
- [ ] Professional tier users can create unlimited plans
- [ ] Professional tier users can only add up to 50 acres
- [ ] Professional tier users can add up to 3 team members
- [ ] Estate tier users can add up to 200 acres
- [ ] Estate tier users can add up to 10 team members
- [ ] Enterprise tier users have no limits
- [ ] Upgrade modal shows correct tier when limit is reached
- [ ] Limits are enforced on backend (Supabase RLS policies)

## Backend Enforcement (TODO)

**Important:** Frontend limits are for UX only. You MUST enforce limits on the backend to prevent bypassing via API calls.

### Supabase RLS Policies Needed

```sql
-- Example: Prevent creating too many plans
CREATE POLICY "Enforce plan limits"
ON vineyard_plans
FOR INSERT
TO authenticated
WITH CHECK (
  (
    -- Get user's tier
    SELECT tier FROM subscriptions WHERE user_id = auth.uid()
  ) = 'free' AND (
    -- Count existing plans
    SELECT COUNT(*) FROM vineyard_plans WHERE user_id = auth.uid()
  ) < 1
  OR
  (
    SELECT tier FROM subscriptions WHERE user_id = auth.uid()
  ) != 'free'
);
```

You'll need similar policies for:
- Acres validation
- Team member invitations
- Block creation
- PDF export tracking
