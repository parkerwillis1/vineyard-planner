# Harvest Management - Simplified Implementation Plan

## Overview
A practical harvest tracking system for small to medium-sized vineyards. Focus on planning, execution, and simple reporting.

---

## Core Features (4-6 Weeks Total)

### Week 1-2: Foundation & Planning

#### Database Tables

```sql
-- Harvest Tracking (one per block per season)
CREATE TABLE harvest_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  block_id UUID NOT NULL REFERENCES vineyard_blocks(id) ON DELETE CASCADE,
  season INTEGER NOT NULL, -- e.g., 2026

  -- Planning
  target_pick_date DATE,
  estimated_tons NUMERIC,
  estimated_tons_per_acre NUMERIC,

  -- Target Quality
  target_brix NUMERIC,
  target_ta NUMERIC,
  target_ph NUMERIC,

  -- Status
  status TEXT CHECK (status IN ('planned', 'in_progress', 'completed')) DEFAULT 'planned',

  -- Actuals (calculated from loads)
  actual_tons NUMERIC DEFAULT 0,
  actual_tons_per_acre NUMERIC DEFAULT 0,
  total_bins INTEGER DEFAULT 0,

  -- Dates
  actual_pick_date DATE,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(organization_id, block_id, season)
);

-- Individual Loads/Bins
CREATE TABLE harvest_loads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  harvest_id UUID NOT NULL REFERENCES harvest_tracking(id) ON DELETE CASCADE,

  -- Load Info
  load_number INTEGER, -- 1, 2, 3... for this harvest
  bin_count INTEGER DEFAULT 1,

  -- Weights
  gross_weight_lbs NUMERIC,
  tare_weight_lbs NUMERIC DEFAULT 0,
  net_weight_lbs NUMERIC GENERATED ALWAYS AS (
    COALESCE(gross_weight_lbs, 0) - COALESCE(tare_weight_lbs, 0)
  ) STORED,
  tons NUMERIC GENERATED ALWAYS AS (
    (COALESCE(gross_weight_lbs, 0) - COALESCE(tare_weight_lbs, 0)) / 2000.0
  ) STORED,

  -- Quality
  brix NUMERIC,
  ta NUMERIC,
  ph NUMERIC,
  temperature_f NUMERIC,

  -- Tracking
  picked_at TIMESTAMPTZ DEFAULT now(),
  destination TEXT, -- e.g., "Tank 5", "Sold to XYZ Winery"

  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Field Samples (pre-harvest quality checks)
CREATE TABLE harvest_field_samples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  block_id UUID NOT NULL REFERENCES vineyard_blocks(id) ON DELETE CASCADE,

  sample_date DATE NOT NULL,

  -- Berry Metrics
  brix NUMERIC,
  ta NUMERIC,
  ph NUMERIC,

  -- Observations
  berry_size TEXT, -- small, medium, large
  cluster_condition TEXT, -- excellent, good, fair, poor
  disease_pressure TEXT, -- none, low, medium, high

  -- Recommendations
  ready_to_pick BOOLEAN DEFAULT false,
  estimated_days_to_harvest INTEGER,

  sampled_by UUID REFERENCES organization_members(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_harvest_tracking_org_season ON harvest_tracking(organization_id, season);
CREATE INDEX idx_harvest_tracking_block ON harvest_tracking(block_id);
CREATE INDEX idx_harvest_loads_harvest ON harvest_loads(harvest_id);
CREATE INDEX idx_harvest_samples_block_date ON harvest_field_samples(block_id, sample_date DESC);
```

#### RLS Policies

```sql
-- harvest_tracking
ALTER TABLE harvest_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view org harvests" ON harvest_tracking
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organizations o
      WHERE o.id = organization_id AND o.owner_id = auth.uid()
    ) OR
    is_organization_member(organization_id, auth.uid())
  );

CREATE POLICY "Users can manage org harvests" ON harvest_tracking
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM organizations o
      WHERE o.id = organization_id AND o.owner_id = auth.uid()
    )
  );

-- Similar for harvest_loads and harvest_field_samples
```

#### API Functions

```javascript
// Planning
export async function listHarvestTracking(season)
export async function createHarvestTracking(harvest)
export async function updateHarvestTracking(harvestId, updates)
export async function deleteHarvestTracking(harvestId)

// Loads
export async function listHarvestLoads(harvestId)
export async function createHarvestLoad(load)
export async function updateHarvestLoad(loadId, updates)
export async function deleteHarvestLoad(loadId)

// Samples
export async function listHarvestSamples(blockId = null, season = null)
export async function createHarvestSample(sample)
export async function getLatestSampleByBlock(blockId)

// Analytics
export async function getHarvestStatistics(season)
export async function getYieldByBlock(season)
```

---

### Week 3-4: Main Interface

#### Component: HarvestTracking.jsx

**Main View - Block Status Table**

Columns:
- Block Name
- Variety
- Acres
- Est. Tons
- Latest Sample (Brix/TA/pH)
- Status (Planned/In Progress/Completed)
- Actual Tons
- Yield/Acre
- Actions (Add Sample, Start Harvest, Add Load, View Details)

Visual Design:
```
┌─────────────────────────────────────────────────────────────────────┐
│ 2026 Harvest                                    [Add Block to Harvest]│
├─────────────────────────────────────────────────────────────────────┤
│ Season Summary:                                                      │
│ 15 Blocks Planned | 8 In Progress | 5 Completed | 245.5 Total Tons  │
└─────────────────────────────────────────────────────────────────────┘

Block         | Variety  | Acres | Est    | Sample  | Status      | Actual | $/Acre | Actions
              |          |       | Tons   | Brix    |             | Tons   |        |
──────────────────────────────────────────────────────────────────────────────────────────────
North Block   | Cab Sauv | 12.5  | 45.0   | 24.2    | ● READY     | -      | -      | [Sample][Start]
South Block   | Merlot   | 8.0   | 28.0   | 23.5    | ● Picking   | 18.5   | 2.3    | [Add Load][View]
East Block    | Chard    | 6.5   | 22.0   | 21.8    | ✓ Done      | 23.2   | 3.6    | [View Details]
```

**Features:**
- Filter by status, variety
- Sort by any column
- Color-coded status indicators
- Quick actions on each row
- Season selector (dropdown)

---

### Week 4: Harvest Detail Modal

**Component: HarvestDetailModal.jsx**

**Sections:**

1. **Planning Tab**
   - Target pick date
   - Estimated yield
   - Target quality (Brix/TA/pH)
   - Notes

2. **Samples Tab**
   - Timeline of field samples
   - Chart showing Brix progression
   - Quick add sample button
   - Sample history table

3. **Loads Tab**
   - List of all loads for this harvest
   - Add new load button
   - Running totals (bins, tons)
   - Average quality metrics
   - Quick load entry form

4. **Summary Tab**
   - Actual vs estimated yield
   - Quality summary
   - Cost breakdown (if labor tracked)
   - Export to PDF

**Load Entry Form:**
```
Add Load to North Block Harvest
─────────────────────────────────
Bin Count:     [  3  ]
Gross Weight:  [ 4,500 ] lbs
Tare Weight:   [  300 ] lbs    (auto-calculated: 100 lbs per bin)
Net Weight:    4,200 lbs (2.1 tons) ← calculated

Quality (optional):
Brix:  [ 24.5 ]
TA:    [ 6.2  ]
pH:    [ 3.55 ]
Temp:  [ 68   ] °F

Destination: [ Tank 3 ▼ ]
Notes: [                    ]

[Cancel]  [Save Load]
```

---

### Week 5: Simple Reporting

**Component: HarvestReports.jsx**

**Report Types:**

1. **Yield Summary**
   - Total tons by variety
   - Tons per acre by block
   - Comparison to estimates
   - Bar charts

2. **Quality Summary**
   - Average Brix/TA/pH by variety
   - Quality distribution charts
   - Outliers highlighted

3. **Timeline**
   - Gantt-style view of harvest dates
   - See which blocks were picked when

4. **Export Options**
   - CSV download
   - Print-friendly view
   - PDF generation (simple)

---

### Week 6: Calendar Integration & Polish

**Calendar View Enhancements:**
- Show harvest events on existing calendar
- Drag-and-drop to reschedule
- Color-coded by status
- Click to open detail modal

**Mobile Optimization:**
- Touch-friendly load entry
- Large buttons for field use
- Simplified view for mobile
- Offline capability for load entry

**Quick Entry Mode:**
- Streamlined interface for repetitive load entry
- Keyboard shortcuts
- Auto-increment load numbers
- One-click save and next

---

## Simplified Data Flow

```
1. Plan Harvest
   ↓
   Create harvest_tracking record
   (target date, estimated tons, target quality)

2. Field Sampling
   ↓
   Add field samples
   (track Brix progression, ready to pick?)

3. Start Harvest
   ↓
   Update status to "in_progress"
   Set actual_pick_date

4. Add Loads
   ↓
   Create harvest_loads records
   (bin count, weights, quality)
   ↓
   Auto-update harvest_tracking totals

5. Complete
   ↓
   Update status to "completed"
   Set completed_at
   ↓
   View final yield report
```

---

## Features by Priority

### Must-Have (MVP)
✅ Block-level harvest planning
✅ Load/bin tracking with weights
✅ Field sample tracking
✅ Basic quality metrics (Brix/TA/pH)
✅ Yield calculations (actual vs estimated)
✅ Status tracking (planned → picking → done)
✅ Simple reporting (yield by block)

### Nice-to-Have (Phase 2)
- Labor cost tracking per harvest
- Photo upload (berry samples, disease)
- Calendar integration
- Export to Excel/CSV
- Historical comparisons (year over year)
- Mobile-optimized load entry

### Future
- Barcode scanning for bins
- Scale integration
- Weather overlays
- Predictive yield modeling

---

## UI Design Principles

1. **Simple & Clean**
   - No clutter
   - Clear hierarchy
   - Easy to scan

2. **Fast Data Entry**
   - Minimal clicks
   - Auto-calculations
   - Keyboard friendly

3. **Visual Feedback**
   - Color-coded status
   - Progress indicators
   - Success/error messages

4. **Mobile-Ready**
   - Touch targets > 44px
   - Large text for outdoor viewing
   - Offline capability

---

## Technical Notes

### Auto-Calculations

When a load is added:
1. Calculate net weight (gross - tare)
2. Update harvest_tracking.actual_tons (sum of all loads)
3. Update harvest_tracking.actual_tons_per_acre (tons / block acres)
4. Update harvest_tracking.total_bins (count all loads)

### Sample Progress Tracking

Show visual indicator:
- 🔴 Under-ripe (Brix < target)
- 🟡 Watch (Brix approaching target)
- 🟢 Ready (Brix at target ± 0.5)
- 🔵 Optimal (Brix at target, TA/pH in range)

### Yield Variance

Alert if:
- Actual > 120% of estimated (good problem!)
- Actual < 80% of estimated (investigate)

---

## Success Metrics

- **Planning**: Define harvest for all blocks in < 1 hour
- **Load Entry**: Add a load in < 30 seconds
- **Reporting**: Generate yield report in < 10 seconds
- **Adoption**: 100% of blocks tracked by second harvest

---

## Migration Path

If they have existing data:
1. Import blocks (already done in planner)
2. Import historical yield data (CSV upload)
3. Set baseline for estimates

---

## Timeline Summary

| Week | Focus | Deliverable |
|------|-------|-------------|
| 1-2  | Database + API | Migrations, RLS, API functions |
| 3    | Main UI | Harvest tracking table view |
| 4    | Details | Harvest detail modal, load entry |
| 5    | Reports | Simple yield and quality reports |
| 6    | Polish | Calendar integration, mobile optimization |

**Total: 6 weeks to full MVP**

---

## Getting Started

Phase 1 (This week):
1. Create database migrations
2. Add RLS policies
3. Build API functions
4. Add "Harvest" to navigation
5. Create basic shell component

Ready to start?
