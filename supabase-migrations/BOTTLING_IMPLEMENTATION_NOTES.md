# Bottling Management - Implementation Notes

## Overview
Production-ready bottling run system with atomic completion, persistence, autosave, and resume functionality.

---

## Database Schema

### Tables Created
1. **`bottling_runs`** - Main run tracking with planning + execution data
2. **`bottled_inventory`** - Finished goods created upon completion
3. **`bottling_qc_checks`** - Timestamped QC checkpoints
4. **`bottling_issues`** - Issue/problem log during runs

### Key Relationships
```
bottling_runs
  ├─ wine_lots (FK: lot_id) - Source lot being bottled
  ├─ bottling_qc_checks (1:many) - QC checkpoints for this run
  ├─ bottling_issues (1:many) - Issues logged during run
  └─ bottled_inventory (1:1) - Inventory created on completion

bottled_inventory
  ├─ bottling_runs (FK: run_id) - Run that created this inventory
  └─ wine_lots (FK: lot_id) - Original source lot
```

---

## Status Flow

### Run Statuses
- **`draft`** - Setup in progress, can be edited/resumed/deleted
- **`active`** - Run started, counters being tracked, setup fields locked
- **`completed`** - Atomic completion executed, inventory created
- **`cancelled`** - Run cancelled, no volume deducted

### Inventory Statuses
- **`available`** - Ready for sale/allocation
- **`quarantine`** - Awaiting quality release
- **`needs_lab`** - Requires lab approval before release
- **`allocated`** - Reserved for specific customer/order
- **`sold`** - Sold and shipped

---

## Volume Units & Calculations

### Standard Units
- **Bulk wine**: Gallons (DECIMAL 10,2)
- **Bottles**: Milliliters (INTEGER)
- **Conversion**: 1 gallon = 3785.411784 ml (exact)

### Calculation Flow
```javascript
// Setup phase
net_volume_gal = bulk_volume_gal * (1 - loss_pct/100) - headspace_loss_gal
net_volume_ml = net_volume_gal * 3785.411784
estimated_bottles = floor(net_volume_ml / bottle_ml)
estimated_cases = floor(estimated_bottles / case_pack)

// Completion phase
actual_volume_used_gal = (actual_bottles * bottle_ml) / 3785.411784
lot.current_volume_gallons -= actual_volume_used_gal
```

---

## Key Features

### 1. Autosave (Debounced Draft)
- Saves run to DB every 2 seconds during setup (debounced)
- Status remains `draft` until user clicks "Start Run"
- User can navigate away and resume later

### 2. Resume Draft
- On lot selection, check for existing draft via `getDraftRunForLot(lotId)`
- Show "Resume Draft" button if found
- Loads saved configuration into UI state

### 3. Field Locking
- When status === 'active', setup fields become read-only
- Prevents accidental changes during run execution
- Only counters, QC checks, and issues can be modified

### 4. Atomic Completion (RPC)
The `complete_bottling_run()` Postgres function ensures:
- Run is in 'active' status
- Lot has sufficient volume
- Volume deduction from wine_lots
- Inventory creation in bottled_inventory
- Run marked as completed
- All in ONE transaction (rollback on any failure)

**Returns:**
```json
{
  "success": true,
  "run_id": "uuid",
  "inventory_id": "uuid",
  "volume_deducted_gal": 123.45,
  "lot_remaining_gal": 876.55
}
```

### 5. Validation Rules

**Setup Validation (before start):**
- `bulk_volume_gal > 0` - Must have volume
- `abv > 0` - Required for labels
- `label_name` not empty - Required for compliance
- `estimated_bottles > 0` - Must produce at least 1 bottle
- `estimated_bottles <= max_possible` - Can't exceed net volume

**Loss % Bounds:**
- Min: 0% (no loss)
- Max: 15% (suspicious, but allowed)
- Default: 2.5%
- Warning if > 5%

**Completion Validation (RPC):**
- Run must be 'active'
- `actual_bottles * bottle_ml` must not exceed `lot.current_volume_gallons`
- Lot must exist and be owned by user

### 6. QC Checkpoint Tracking
Each checkbox toggle:
- Upserts record in `bottling_qc_checks`
- Sets `completed_at` timestamp when checked
- Clears `completed_at` when unchecked
- Stored in DB (not just UI state)

### 7. Issue Logging
Each issue added:
- Inserts into `bottling_issues` immediately
- Includes severity, timestamp, description
- Part of run audit trail
- Can be marked as resolved later

---

## API Functions

### Bottling Runs
```javascript
listBottlingRuns({ status, lot_id })     // List runs with filters
getBottlingRun(runId)                    // Get run + QC + issues
getDraftRunForLot(lotId)                 // Find resumable draft
createBottlingRun(runData)               // Create new draft
updateBottlingRun(runId, updates)        // Autosave updates
startBottlingRun(runId)                  // draft → active
completeBottlingRun(runId, bottles, cases) // Atomic RPC
cancelBottlingRun(runId)                 // Mark cancelled
deleteBottlingRun(runId)                 // Delete draft only
```

### QC & Issues
```javascript
toggleQCCheck(runId, checkType, completed, notes)
getQCChecks(runId)
createBottlingIssue(runId, { description, severity })
getBottlingIssues(runId)
resolveBottlingIssue(issueId, resolutionNotes)
```

### Inventory
```javascript
listBottledInventory({ status, sku })
getInventoryBySKU(sku)
updateInventoryStatus(inventoryId, status)
```

---

## Component Integration

### BottlingManagement.jsx Updates Needed

**On Mount:**
1. Load lots
2. Load existing runs (for "Active Runs" list)
3. Check for draft on lot selection

**Autosave Implementation:**
```javascript
useEffect(() => {
  if (runData.lot_id && currentStep === 1) {
    const timer = setTimeout(async () => {
      if (runData.run_id) {
        await updateBottlingRun(runData.run_id, {
          bottle_ml: runData.bottle_ml,
          closure_type: runData.closure_type,
          // ... all setup fields
        });
      } else {
        const { data } = await createBottlingRun(runData);
        setRunData(prev => ({ ...prev, run_id: data.id }));
      }
    }, 2000); // 2 second debounce

    return () => clearTimeout(timer);
  }
}, [runData /* all relevant fields */]);
```

**Resume Draft:**
```javascript
async function selectLot(lot) {
  // Check for existing draft
  const { data: draft } = await getDraftRunForLot(lot.id);

  if (draft) {
    // Show resume option
    const resume = confirm('Resume existing draft for this lot?');
    if (resume) {
      loadDraft(draft);
      setCurrentStep(1);
      return;
    }
  }

  // Start fresh
  initializeNewRun(lot);
}
```

**Start Run:**
```javascript
async function startRun() {
  if (!runData.run_id) {
    // Save draft first
    const { data } = await createBottlingRun(runData);
    setRunData(prev => ({ ...prev, run_id: data.id }));
  }

  // Transition to active
  const { data, error } = await startBottlingRun(runData.run_id);
  if (error) {
    alert('Failed to start run: ' + error.message);
    return;
  }

  setRunData(prev => ({ ...prev, status: 'active', started_at: data.started_at }));
  setCurrentStep(3);
}
```

**QC Toggle:**
```javascript
async function toggleQC(checkType) {
  const newState = !runData.qc_checks[checkType];

  // Update DB
  await toggleQCCheck(runData.run_id, checkType, newState);

  // Update UI
  setRunData(prev => ({
    ...prev,
    qc_checks: {
      ...prev.qc_checks,
      [checkType]: newState
    }
  }));
}
```

**Add Issue:**
```javascript
async function addIssue() {
  const { data, error } = await createBottlingIssue(runData.run_id, {
    description: issueForm.description,
    severity: issueForm.severity
  });

  if (!error) {
    setRunData(prev => ({
      ...prev,
      issues: [...prev.issues, data]
    }));
  }
}
```

**Complete Run (Atomic):**
```javascript
async function completeRun() {
  setExporting(true);

  try {
    const { data, error } = await completeBottlingRun(
      runData.run_id,
      runData.bottles_filled,
      runData.cases_packed
    );

    if (error) throw error;

    // Success - data contains inventory_id, volume_deducted, etc
    setRunData(prev => ({
      ...prev,
      status: 'completed',
      completed_at: new Date().toISOString(),
      inventory_id: data.inventory_id
    }));

    setCurrentStep(4);
  } catch (err) {
    alert(`Completion failed: ${err.message}`);
  } finally {
    setExporting(false);
  }
}
```

**Counter Updates (Persist):**
```javascript
// Debounced counter save
useEffect(() => {
  if (runData.status === 'active' && runData.run_id) {
    const timer = setTimeout(async () => {
      await updateBottlingRun(runData.run_id, {
        actual_bottles: runData.bottles_filled,
        actual_cases: runData.cases_packed
      });
    }, 1000); // 1 second debounce

    return () => clearTimeout(timer);
  }
}, [runData.bottles_filled, runData.cases_packed]);
```

---

## Export Functions (Use DB Data)

### Run Sheet PDF
```javascript
async function exportRunSheet(runId) {
  // Fetch complete run from DB
  const { data: run } = await getBottlingRun(runId);

  // Generate PDF from DB data (not UI state)
  generateRunSheetPDF({
    run,
    qc_checks: run.bottling_qc_checks,
    issues: run.bottling_issues
  });
}
```

### Label Data CSV
```javascript
async function exportLabelData(runId) {
  const { data: run } = await getBottlingRun(runId);

  const labelData = {
    label_name: run.label_name,
    varietal: run.varietal,
    vintage: run.vintage,
    appellation: run.appellation,
    abv: run.abv,
    lot_code: run.lot_code,
    bottle_ml: run.bottle_ml,
    bottles_count: run.actual_bottles
  };

  exportToCSV([labelData], 'label-data');
}
```

---

## Security Considerations

### Row Level Security (RLS)
- All tables have RLS enabled
- Users can only access their own data
- Enforced at database level (can't be bypassed)

### Atomic RPC Security
- `SECURITY DEFINER` - runs with elevated privileges
- Still checks `auth.uid()` to ensure ownership
- Validates all inputs before mutations
- Rollback on any failure

### Status Transitions
- `startBottlingRun()` only works if status === 'draft'
- `completeBottlingRun()` only works if status === 'active'
- Prevents invalid state transitions

---

## Migration Instructions

1. **Run SQL Migration:**
   ```bash
   # Copy contents of create_bottling_tables.sql
   # Paste into Supabase SQL Editor
   # Execute
   ```

2. **Verify Tables:**
   ```sql
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name LIKE 'bottling%';
   ```

3. **Test RPC Function:**
   ```sql
   -- Should fail with 'Run not found'
   SELECT complete_bottling_run(
     gen_random_uuid(),
     100,
     8
   );
   ```

4. **Check RLS Policies:**
   ```sql
   SELECT tablename, policyname FROM pg_policies
   WHERE tablename LIKE 'bottling%';
   ```

---

## Assumptions & Conventions

### Status Names
- Use lowercase with underscores: `ready_to_bottle`, `needs_lab`
- Consistent with existing lot statuses

### Volume Precision
- Gallons: 2 decimal places (e.g., 123.45 gal)
- ABV: 1 decimal place (e.g., 13.5%)
- Loss %: 1 decimal place (e.g., 2.5%)

### SKU Generation
- Format: `{sku_prefix}-{lot_code}`
- Example: `BOT-2024-CAB-a1b2`
- Stored in both `bottling_runs.sku` and `bottled_inventory.sku`

### Timestamp Fields
- `created_at`: When record was created
- `updated_at`: Auto-updated on any change
- `started_at`: When run status changed to active
- `completed_at`: When run status changed to completed

---

## Testing Checklist

- [ ] Create draft run, navigate away, resume
- [ ] Autosave during setup (check DB directly)
- [ ] Validation errors prevent start
- [ ] Field locking when status === active
- [ ] QC toggles persist to DB
- [ ] Issue log persists to DB
- [ ] Counter changes autosave
- [ ] Completion fails if insufficient volume
- [ ] Completion creates inventory record
- [ ] Lot volume correctly deducted
- [ ] Lot status changes to 'bottled' if empty
- [ ] PDF exports use DB data, not UI state
- [ ] Can't start/complete someone else's run (RLS)

---

## Future Enhancements

- **Dry Goods Tracking**: Deduct bottles, corks, labels from inventory
- **Batch Printing**: Generate case/bottle labels in bulk
- **Mobile App**: Handheld counter app during bottling
- **Auto-detection**: Camera integration for fill-level QC
- **Cost Tracking**: COGS per bottle (materials + labor)
- **Multi-run Scheduling**: Calendar view of scheduled runs
- **Line Efficiency**: Bottles/hour tracking
- **Waste Tracking**: Breakage, rejected bottles
