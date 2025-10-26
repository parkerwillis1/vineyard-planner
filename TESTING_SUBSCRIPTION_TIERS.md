# Testing Subscription Tiers - Developer Guide

## Quick Method: Manual Database Updates (For Testing Only)

### Step 1: Create Test User Accounts

Sign up 4 different test accounts in your app:

1. `test-free@example.com` (Free tier)
2. `test-starter@example.com` (Starter tier)
3. `test-professional@example.com` (Professional tier)
4. `test-enterprise@example.com` (Enterprise tier)

### Step 2: Run SQL in Supabase SQL Editor

After creating the accounts, run this SQL to set their tiers:

```sql
-- Update test-free@example.com to Free tier (already default)
UPDATE subscriptions
SET tier = 'free',
    modules = ARRAY['planner']::TEXT[],
    status = 'active'
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'test-free@example.com'
);

-- Update test-starter@example.com to Starter tier
UPDATE subscriptions
SET tier = 'starter',
    modules = ARRAY['planner', 'vineyard']::TEXT[],
    status = 'active'
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'test-starter@example.com'
);

-- Update test-professional@example.com to Professional tier
UPDATE subscriptions
SET tier = 'professional',
    modules = ARRAY['planner', 'vineyard', 'production', 'inventory']::TEXT[],
    status = 'active'
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'test-professional@example.com'
);

-- Update test-enterprise@example.com to Enterprise tier
UPDATE subscriptions
SET tier = 'enterprise',
    modules = ARRAY['planner', 'vineyard', 'production', 'inventory', 'sales']::TEXT[],
    status = 'active'
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'test-enterprise@example.com'
);
```

### Step 3: Test Each Account

Sign in as each account and verify:

**Free Tier:**
- ✅ Can create 1 plan
- ❌ Cannot create 2nd plan (should show upgrade prompt)
- ✅ Can see usage: "Plans: 1/1"
- ✅ Settings page shows "Planner" tier

**Starter Tier:**
- ✅ Can create unlimited plans
- ✅ Settings page shows "Vineyard" tier at $29/month
- ✅ Can see usage: "Plans: X/∞"

**Professional Tier:**
- ✅ Can create unlimited plans
- ✅ Settings page shows "Vineyard + Winery" tier at $99/month
- ✅ Can see usage bars in settings

**Enterprise Tier:**
- ✅ Everything unlimited
- ✅ Settings page shows "Complete Platform" tier at $249/month

---

## Method 2: Admin Panel (More Professional)

Create an admin panel to manage user subscriptions:

### Create Admin Page

`src/pages/admin/UserManagement.jsx`:

```javascript
import { useState, useEffect } from 'react';
import { supabase } from '@/shared/lib/supabaseClient';
import { PRICING_TIERS } from '@/shared/config/pricing';

export default function UserManagement() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    // Get all users with their subscriptions
    const { data } = await supabase
      .from('subscriptions')
      .select(`
        *,
        user:auth.users(email)
      `);

    setUsers(data || []);
  };

  const updateUserTier = async (userId, newTier) => {
    const tierConfig = PRICING_TIERS[newTier];

    await supabase
      .from('subscriptions')
      .update({
        tier: newTier,
        modules: tierConfig.modules,
        status: 'active'
      })
      .eq('user_id', userId);

    loadUsers();
  };

  return (
    <div className="max-w-6xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">User Management</h1>

      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-3 text-left">Email</th>
            <th className="p-3 text-left">Current Tier</th>
            <th className="p-3 text-left">Status</th>
            <th className="p-3 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-t">
              <td className="p-3">{user.user?.email}</td>
              <td className="p-3">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                  {user.tier}
                </span>
              </td>
              <td className="p-3">{user.status}</td>
              <td className="p-3">
                <select
                  value={user.tier}
                  onChange={(e) => updateUserTier(user.user_id, e.target.value)}
                  className="border rounded px-2 py-1"
                >
                  <option value="free">Free</option>
                  <option value="starter">Starter</option>
                  <option value="professional">Professional</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### Protect Admin Panel

Add to `App.jsx`:

```javascript
import { useAuth } from '@/auth/AuthContext';

// In your routes:
{user?.email === 'your-admin-email@example.com' && (
  <Route path="/admin" element={<UserManagement />} />
)}
```

---

## Method 3: Environment-Based Dev Mode

Add a developer mode that bypasses subscription checks:

### Add to `.env.local`:

```env
VITE_DEV_MODE=true
VITE_DEV_TIER=enterprise
```

### Update `useSubscription.jsx`:

```javascript
export const useSubscription = () => {
  const context = useContext(SubscriptionContext);

  // Developer override
  if (import.meta.env.VITE_DEV_MODE === 'true') {
    return {
      ...context,
      tier: import.meta.env.VITE_DEV_TIER || 'free',
      status: 'active',
    };
  }

  return context;
};
```

Now you can test different tiers by changing `VITE_DEV_TIER` without database changes!

---

## Method 4: Stripe Test Mode (Most Realistic)

Use Stripe's test mode to simulate real subscriptions:

### Test Payment Flow:

1. Use test card: `4242 4242 4242 4242`
2. Any future expiry date
3. Any 3-digit CVC
4. Complete checkout
5. Stripe webhook updates your database automatically

### Other Test Cards:

- **Decline**: `4000 0000 0000 0002`
- **Require 3D Secure**: `4000 0025 0000 3155`
- **Insufficient funds**: `4000 0000 0000 9995`

---

## Quick Test Script

Run this in Supabase SQL Editor to quickly create test data:

```sql
-- Create a helper function to set user tier
CREATE OR REPLACE FUNCTION set_user_tier(user_email TEXT, new_tier TEXT)
RETURNS void AS $$
DECLARE
  tier_modules TEXT[];
BEGIN
  -- Determine modules based on tier
  tier_modules := CASE new_tier
    WHEN 'free' THEN ARRAY['planner']
    WHEN 'starter' THEN ARRAY['planner', 'vineyard']
    WHEN 'professional' THEN ARRAY['planner', 'vineyard', 'production', 'inventory']
    WHEN 'enterprise' THEN ARRAY['planner', 'vineyard', 'production', 'inventory', 'sales']
    ELSE ARRAY['planner']
  END;

  UPDATE subscriptions
  SET tier = new_tier,
      modules = tier_modules,
      status = 'active',
      updated_at = NOW()
  WHERE user_id = (SELECT id FROM auth.users WHERE email = user_email);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Now you can easily change tiers:
SELECT set_user_tier('test@example.com', 'enterprise');
SELECT set_user_tier('test@example.com', 'free');
```

---

## Recommended Testing Workflow

1. **Development**: Use Method 3 (env variables) for quick tier switching
2. **Staging**: Use Method 1 (SQL updates) or Method 2 (admin panel)
3. **Production**: Use Method 4 (Stripe test mode) before going live

---

## Verifying Tier Enforcement

### Test Checklist:

**Free Tier User:**
- [ ] Can create 1 plan
- [ ] Blocked from creating 2nd plan
- [ ] Sees "Plans: 1/1 (limit reached)"
- [ ] "Create New Plan" button is disabled
- [ ] Gets upgrade prompt when trying to create 2nd plan
- [ ] Settings shows Free tier

**Paid Tier User:**
- [ ] Can create unlimited plans
- [ ] Sees "Plans: X/∞"
- [ ] No limit warnings
- [ ] Settings shows correct tier and price
- [ ] Usage bars display correctly

