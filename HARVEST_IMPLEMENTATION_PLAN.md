# Harvest Management System - Complete Implementation Plan

## Executive Summary

A comprehensive harvest management system integrating planning, execution, quality control, logistics, and financial tracking for vineyard operations. This system connects field operations with inventory, compliance, and business intelligence.

---

## Phase 1: Foundation & Data Model (Week 1-2)

### 1.1 Database Schema

#### Core Tables

```sql
-- Harvest Plans (Season-level master)
CREATE TABLE harvest_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  season INTEGER NOT NULL,
  name TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  status TEXT CHECK (status IN ('draft', 'active', 'closed')) DEFAULT 'draft',
  target_total_tons NUMERIC,
  actual_total_tons NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(organization_id, season)
);

-- Pick Intents (Per block/variety planning)
CREATE TABLE harvest_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES harvest_plans(id) ON DELETE CASCADE,
  block_id UUID NOT NULL REFERENCES vineyard_blocks(id) ON DELETE RESTRICT,

  -- Target Quality Metrics
  target_brix NUMERIC,
  target_ta NUMERIC,
  target_ph NUMERIC,
  target_yeast_assimilable_nitrogen NUMERIC, -- YAN

  -- Yield Estimates
  est_yield_tons NUMERIC,
  est_yield_tons_per_acre NUMERIC,
  est_clusters_per_vine INTEGER,
  est_cluster_weight_grams NUMERIC,

  -- Timing
  earliest_pick_date DATE,
  target_pick_date DATE,
  latest_pick_date DATE,
  degree_days_target NUMERIC, -- GDD accumulation

  -- Logistics
  priority INTEGER DEFAULT 50, -- 1 = highest priority
  pick_method TEXT CHECK (pick_method IN ('hand', 'machine', 'both')),
  destination_type TEXT CHECK (destination_type IN ('winery', 'sale', 'bulk')),
  destination_notes TEXT,

  -- Financial
  contracted_price_per_ton NUMERIC,
  buyer_id UUID, -- Reference to buyers table (future)

  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Scheduled Harvest Events
CREATE TABLE harvest_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  intent_id UUID NOT NULL REFERENCES harvest_intents(id) ON DELETE CASCADE,

  -- Scheduling
  scheduled_start TIMESTAMPTZ NOT NULL,
  scheduled_end TIMESTAMPTZ,
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,

  -- Status
  status TEXT CHECK (status IN (
    'planned', 'confirmed', 'in_progress',
    'weighing', 'delivered', 'closed', 'cancelled'
  )) DEFAULT 'planned',

  -- Crew & Equipment
  crew_size INTEGER,
  crew_lead_id UUID REFERENCES organization_members(id),
  machine_harvest BOOLEAN DEFAULT false,
  bins_allocated INTEGER,
  tractor_id UUID, -- Reference to equipment table
  truck_id UUID,

  -- Logistics
  destination_type TEXT CHECK (destination_type IN ('winery', 'sale', 'bulk')),
  destination_ref TEXT, -- Lot name or buyer reference
  truck_departure_time TIMESTAMPTZ,
  truck_arrival_time TIMESTAMPTZ,

  -- Totals (calculated from bins)
  total_bins INTEGER DEFAULT 0,
  total_gross_weight_lbs NUMERIC DEFAULT 0,
  total_tare_weight_lbs NUMERIC DEFAULT 0,
  total_net_weight_lbs NUMERIC DEFAULT 0,
  total_tons NUMERIC GENERATED ALWAYS AS (total_net_weight_lbs / 2000.0) STORED,

  -- Costs (calculated from labor/materials)
  labor_cost NUMERIC DEFAULT 0,
  materials_cost NUMERIC DEFAULT 0,
  equipment_cost NUMERIC DEFAULT 0,
  trucking_cost NUMERIC DEFAULT 0,
  total_cost NUMERIC GENERATED ALWAYS AS (
    COALESCE(labor_cost, 0) + COALESCE(materials_cost, 0) +
    COALESCE(equipment_cost, 0) + COALESCE(trucking_cost, 0)
  ) STORED,

  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Harvest Bins/Loads (Individual containers)
CREATE TABLE harvest_bins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES harvest_events(id) ON DELETE CASCADE,

  -- Identification
  bin_number TEXT NOT NULL, -- Physical bin ID (e.g., "BIN-001")
  bin_type TEXT CHECK (bin_type IN ('macro', 'half_ton', 'quarter_ton', 'lug', 'gondola')),

  -- Weights
  tare_weight_lbs NUMERIC,
  gross_weight_lbs NUMERIC,
  net_weight_lbs NUMERIC GENERATED ALWAYS AS (
    COALESCE(gross_weight_lbs, 0) - COALESCE(tare_weight_lbs, 0)
  ) STORED,
  tons NUMERIC GENERATED ALWAYS AS (
    (COALESCE(gross_weight_lbs, 0) - COALESCE(tare_weight_lbs, 0)) / 2000.0
  ) STORED,

  -- Quality at Weigh-In
  temp_fahrenheit NUMERIC,
  brix_measured NUMERIC,
  ta_measured NUMERIC,
  ph_measured NUMERIC,
  mog_percent NUMERIC, -- Material other than grapes
  rot_percent NUMERIC,
  visual_quality_score INTEGER CHECK (visual_quality_score BETWEEN 1 AND 10),

  -- Tracking
  picked_at TIMESTAMPTZ,
  weighed_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,

  -- Destination
  destination_lot TEXT, -- Winery lot ID
  destination_tank TEXT, -- Tank assignment

  -- Chain of Custody
  picked_by UUID REFERENCES organization_members(id),
  weighed_by UUID REFERENCES auth.users(id),

  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Field Sampling (Pre-harvest quality checks)
CREATE TABLE harvest_samples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  intent_id UUID REFERENCES harvest_intents(id) ON DELETE CASCADE,
  block_id UUID NOT NULL REFERENCES vineyard_blocks(id) ON DELETE CASCADE,

  sample_date DATE NOT NULL,
  sample_location TEXT, -- Row/vine location

  -- Berry Metrics
  brix NUMERIC,
  ta NUMERIC, -- Titratable acidity
  ph NUMERIC,
  yan NUMERIC, -- Yeast assimilable nitrogen
  malic_acid NUMERIC,
  potassium NUMERIC,

  -- Physical
  berry_weight_grams NUMERIC,
  cluster_weight_grams NUMERIC,
  clusters_per_vine INTEGER,

  -- Disease/Pest
  rot_percent NUMERIC,
  botrytis_present BOOLEAN DEFAULT false,
  powdery_mildew_present BOOLEAN DEFAULT false,
  bird_damage_percent NUMERIC,
  insect_damage_percent NUMERIC,

  -- Environmental
  degree_days_accumulated NUMERIC, -- GDD since budbreak
  rainfall_last_7_days NUMERIC,

  -- Recommendations
  ripeness_status TEXT CHECK (ripeness_status IN ('under', 'watch', 'ready', 'optimal', 'over')),
  recommended_pick_date DATE,

  sampled_by UUID REFERENCES organization_members(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Harvest Labor (Crew timesheets)
CREATE TABLE harvest_labor (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES harvest_events(id) ON DELETE CASCADE,
  worker_id UUID REFERENCES organization_members(id),

  clock_in TIMESTAMPTZ,
  clock_out TIMESTAMPTZ,
  hours NUMERIC,

  -- Piece Rate (optional)
  bins_picked INTEGER,
  piece_rate_per_bin NUMERIC,
  piece_pay NUMERIC,

  -- Hourly
  hourly_rate NUMERIC,
  hourly_pay NUMERIC,

  total_pay NUMERIC,

  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Bill of Lading
CREATE TABLE harvest_bills_of_lading (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES harvest_events(id) ON DELETE CASCADE,

  bol_number TEXT NOT NULL UNIQUE,

  -- Shipment Details
  ship_date DATE NOT NULL,
  ship_time TIME,

  -- Origin
  origin_name TEXT NOT NULL,
  origin_address TEXT,
  origin_contact TEXT,
  origin_phone TEXT,

  -- Destination
  destination_name TEXT NOT NULL,
  destination_address TEXT,
  destination_contact TEXT,
  destination_phone TEXT,

  -- Carrier
  carrier_name TEXT,
  driver_name TEXT,
  truck_number TEXT,
  trailer_number TEXT,

  -- Cargo
  total_bins INTEGER,
  total_weight_lbs NUMERIC,
  total_tons NUMERIC,
  variety TEXT,

  -- Special Instructions
  temperature_controlled BOOLEAN DEFAULT false,
  target_temp_fahrenheit NUMERIC,
  special_handling_notes TEXT,

  -- Signatures
  shipper_signature TEXT,
  driver_signature TEXT,
  receiver_signature TEXT,
  signed_at TIMESTAMPTZ,

  -- TTB Compliance
  ttb_permit_number TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Pick Tickets (Field instructions)
CREATE TABLE harvest_pick_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES harvest_events(id) ON DELETE CASCADE,

  ticket_number TEXT NOT NULL UNIQUE,

  -- Block Info
  block_name TEXT NOT NULL,
  variety TEXT,
  clone TEXT,
  rows TEXT, -- e.g., "1-15, 20-25"

  -- Instructions
  pick_method TEXT CHECK (pick_method IN ('hand', 'machine')),
  bin_type TEXT,
  target_bins INTEGER,

  -- Quality Standards
  reject_rot BOOLEAN DEFAULT true,
  reject_mog BOOLEAN DEFAULT true,
  max_temp_fahrenheit NUMERIC,

  -- Crew Assignment
  crew_lead TEXT,
  crew_size INTEGER,

  -- Timing
  start_time TIME,
  estimated_duration_hours NUMERIC,

  special_instructions TEXT,

  -- Status
  issued_at TIMESTAMPTZ DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  created_by UUID REFERENCES auth.users(id)
);
```

#### Indexes for Performance

```sql
-- Critical indexes
CREATE INDEX idx_harvest_events_status ON harvest_events(status);
CREATE INDEX idx_harvest_events_scheduled ON harvest_events(scheduled_start);
CREATE INDEX idx_harvest_events_org ON harvest_events(organization_id);
CREATE INDEX idx_harvest_bins_event ON harvest_bins(event_id);
CREATE INDEX idx_harvest_samples_block_date ON harvest_samples(block_id, sample_date DESC);
CREATE INDEX idx_harvest_intents_plan ON harvest_intents(plan_id);
CREATE INDEX idx_harvest_labor_event ON harvest_labor(event_id);
```

### 1.2 RLS Policies

```sql
-- Harvest Plans
ALTER TABLE harvest_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view org harvest plans" ON harvest_plans
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organizations o
      WHERE o.id = organization_id AND o.owner_id = auth.uid()
    ) OR
    is_organization_member(organization_id, auth.uid())
  );

CREATE POLICY "Admins can manage harvest plans" ON harvest_plans
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM organizations o
      WHERE o.id = organization_id AND o.owner_id = auth.uid()
    )
  );

-- Similar patterns for other tables...
-- (harvest_intents, harvest_events, harvest_bins, etc.)
```

### 1.3 API Layer (vineyardApi.js extensions)

```javascript
// Harvest Plans
export async function listHarvestPlans(filters = {})
export async function getHarvestPlan(planId)
export async function createHarvestPlan(plan)
export async function updateHarvestPlan(planId, updates)
export async function closeHarvestPlan(planId)

// Harvest Intents
export async function listHarvestIntents(planId)
export async function createHarvestIntent(intent)
export async function updateHarvestIntent(intentId, updates)
export async function deleteHarvestIntent(intentId)

// Harvest Events
export async function listHarvestEvents(filters = {})
export async function getHarvestEvent(eventId)
export async function createHarvestEvent(event)
export async function updateHarvestEvent(eventId, updates)
export async function updateHarvestEventStatus(eventId, status)

// Bins
export async function listHarvestBins(eventId)
export async function createHarvestBin(bin)
export async function updateHarvestBin(binId, updates)
export async function deleteHarvestBin(binId)

// Samples
export async function listHarvestSamples(filters = {})
export async function createHarvestSample(sample)
export async function getLatestSampleByBlock(blockId)

// Labor
export async function createHarvestLabor(labor)
export async function listHarvestLabor(eventId)

// Documents
export async function generatePickTicket(eventId)
export async function generateBillOfLading(eventId)
export async function generateBinLabels(eventId)
```

---

## Phase 2: Planning & Scheduling (Week 3-4)

### 2.1 Harvest Planning Dashboard

**Component**: `HarvestPlanning.jsx`

Features:
- Create/manage harvest plans per season
- Set season-level targets (total tons, dates)
- Overview metrics (planned vs actual, % complete)
- Quick actions (create intent, schedule event)

### 2.2 Block Readiness View

**Component**: `BlockReadiness.jsx`

Features:
- Table view of all blocks with ripeness indicators
- Sample history timeline per block
- Color-coded status (under-ripe, watch, ready, optimal, over-ripe)
- Quick sample entry
- Degree days tracking
- Weather integration
- Alert system (blocks reaching optimal window)

Visual Design:
```
Block Name | Variety | Acres | Latest Sample | Brix | TA | pH | Est Yield | Status | Actions
-------------------------------------------------------------------------------------------------
North Block| Cab Sauv| 12.5  | Oct 15       | 24.2 | 6.5| 3.6| 45 tons   | READY | [Sample][Plan]
```

### 2.3 Harvest Intent Builder

**Component**: `HarvestIntentModal.jsx`

Form Fields:
- Block selection (multi-select for machine harvest)
- Target quality metrics (Brix/TA/pH/YAN)
- Estimated yield (auto-calculated from block size + historical data)
- Pick window (earliest/target/latest dates)
- Destination (winery lot, buyer, bulk)
- Contract pricing
- Priority ranking
- Notes

### 2.4 Harvest Calendar

**Component**: `HarvestCalendar.jsx`

Features:
- Month/week view
- Drag-and-drop scheduling
- Resource allocation visualization (crew, bins, trucks)
- Conflict detection (overlapping crew assignments)
- Weather overlay
- Integration with existing CalendarView

---

## Phase 3: Execution & Field Operations (Week 5-6)

### 3.1 Harvest Board (Kanban)

**Component**: `HarvestBoard.jsx`

Columns:
1. **Planned** - Scheduled events not started
2. **In Progress** - Active picking
3. **Weighing** - At weigh station
4. **Delivered** - En route or at destination
5. **Closed** - Completed and finalized

Cards Display:
- Block name, variety
- Scheduled time
- Crew size, bins allocated
- Progress (bins picked / bins target)
- Current totals (tons, avg Brix)
- Drag to move between statuses

### 3.2 Mobile Weigh Station

**Component**: `WeighStation.jsx` (Touch-optimized)

Features:
- Large, touch-friendly controls
- Real-time scale integration (serial/USB)
- Bin number scanning (barcode/QR)
- Auto-tare from bin type database
- Quick quality checks (temp, visual score)
- Bin label printing
- Running totals display
- Offline mode with sync

UI Flow:
```
1. Select active harvest event
2. Scan/enter bin number
3. Auto-fill tare weight
4. Capture gross weight (from scale or manual)
5. Net weight calculated
6. Optional: temp, Brix, visual score
7. Assign destination lot
8. Print label
9. Running total updates
```

### 3.3 Pick Ticket Generation

**Component**: `PickTicketGenerator.jsx`

Features:
- Template-based ticket generation
- Block instructions (rows to pick, reject criteria)
- Crew assignment
- Bin type and quantity
- Time estimates
- Print/PDF/Email
- QR code for mobile check-in

### 3.4 Mobile Crew App

**Component**: `CrewMobile.jsx` (Progressive Web App)

Features:
- Clock in/out
- View assigned pick ticket
- Mark bins as filled
- Report issues (equipment, quality)
- Piece-rate counter
- Photo upload (damage, disease)
- GPS location tracking

---

## Phase 4: Quality & Logistics (Week 7-8)

### 4.1 QA/Lab Interface

**Component**: `HarvestQA.jsx`

Features:
- Sample entry (field and receiving)
- Lab results tracking
- Accept/reject workflow
- Quality trends (Brix curve over time)
- Alerts (out-of-spec loads)
- Integration with winery systems

### 4.2 Bill of Lading Generator

**Component**: `BOLGenerator.jsx`

Features:
- Auto-populate from harvest event
- Shipper/consignee details
- Cargo manifest (bins, weights)
- Special handling instructions
- Digital signatures (mobile/tablet)
- TTB compliance fields
- Multi-copy printing
- Email to trucking company

### 4.3 Truck/Logistics Management

**Component**: `HarvestLogistics.jsx`

Features:
- Truck fleet management
- Route planning
- ETA tracking
- Delivery confirmation
- Driver assignments
- Capacity planning
- Integration with GPS tracking

### 4.4 Receiving/Intake

**Component**: `HarvestReceiving.jsx`

Features:
- Incoming load checklist
- QA approval workflow
- Partial accept/reject
- Create winery lot
- Update inventory
- Generate receiving report
- Chain of custody log

---

## Phase 5: Financial & Reporting (Week 9-10)

### 5.1 Harvest Costing

**Component**: `HarvestCosting.jsx`

Features:
- Cost per ton by block
- Labor breakdown (hourly vs piece-rate)
- Equipment costs (depreciation + fuel)
- Materials (bins, fuel, repairs)
- Trucking/hauling
- Overhead allocation
- Budget vs actual
- Variance analysis

### 5.2 Yield Analytics

**Component**: `HarvestYieldReports.jsx`

Features:
- Yield by block (tons, tons/acre)
- Quality trends (avg Brix, TA, pH by variety)
- Pick rate efficiency (tons/hour, bins/hour)
- Historical comparisons (YoY)
- Predictive modeling (future years)
- Export to Excel/PDF

### 5.3 Sales & Revenue

**Component**: `HarvestSales.jsx`

Features:
- Grape sales invoicing
- Pricing by variety/quality tier
- Buyer management
- Contract tracking
- Payment status
- Revenue projections
- Integration with accounting

### 5.4 Regulatory Compliance

**Component**: `HarvestCompliance.jsx`

Features:
- TTB reporting (crushed fruit tracking)
- Traceability logs (field to tank)
- Organic certification docs
- Labor law compliance (hours, breaks)
- Food safety (temperature logs)
- Audit trail (all transactions)

---

## Phase 6: Advanced Features (Week 11-12)

### 6.1 Predictive Analytics

**Component**: `HarvestForecasting.jsx`

Features:
- Machine learning for yield prediction
- Optimal pick date recommendations
- Weather pattern analysis
- Quality forecasting (Brix progression)
- Risk assessment (rot, heat damage)
- Scenario planning (what-if analysis)

### 6.2 Mobile-First Enhancements

Features:
- Offline-first architecture
- Background sync
- Push notifications (alerts, assignments)
- Camera integration (photo docs)
- Voice notes
- Geofencing (auto clock-in)
- NFC/RFID bin tagging

### 6.3 Integration Ecosystem

Integrations:
- Weather APIs (hourly forecasts)
- Scale hardware (Avery Weigh-Tronix, Rice Lake)
- Label printers (Zebra, Dymo)
- GPS tracking (Samsara, Verizon Connect)
- Accounting (QuickBooks, Xero)
- Winery software (VinBalance, WineDirect)
- TTB reporting (BevNet, Tax & Trade Bureau)

### 6.4 Advanced Reporting

Features:
- Custom report builder
- Scheduled reports (email/SMS)
- Dashboard widgets
- Data export (CSV, JSON, API)
- Business intelligence (Power BI, Tableau)
- Graphical analytics (charts, heatmaps)

---

## Phase 7: Polish & Production (Week 13-14)

### 7.1 User Experience Refinements

- Responsive design (mobile, tablet, desktop)
- Accessibility (WCAG 2.1 AA)
- Dark mode support
- Keyboard shortcuts
- Bulk operations
- Undo/redo
- Auto-save drafts
- Contextual help

### 7.2 Performance Optimization

- Database query optimization
- Caching strategy (Redis)
- Image optimization
- Code splitting
- Lazy loading
- Service workers
- CDN integration

### 7.3 Security Hardening

- Input validation
- SQL injection prevention
- XSS protection
- CSRF tokens
- Rate limiting
- Audit logging
- Role-based access control
- Data encryption

### 7.4 Testing & QA

- Unit tests (Vitest)
- Integration tests
- E2E tests (Playwright)
- Load testing
- Security scanning
- Browser compatibility
- Mobile device testing

---

## Technical Architecture

### Frontend Stack
- **Framework**: React 19 + Vite
- **State**: React Context + Local State
- **Routing**: React Router v6
- **UI**: TailwindCSS + shadcn/ui
- **Charts**: Recharts / Chart.js
- **Forms**: React Hook Form + Zod validation
- **Tables**: TanStack Table
- **PDF**: jsPDF / react-pdf
- **Printing**: Print.js
- **Offline**: Workbox (service workers)

### Backend Stack
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage (images, PDFs)
- **Real-time**: Supabase Realtime (board updates)
- **Edge Functions**: Supabase Edge Functions (complex calculations)

### Mobile Strategy
- Progressive Web App (PWA)
- Responsive design (mobile-first)
- Touch-optimized UI
- Offline-capable
- Home screen install
- Push notifications

---

## Data Flow Examples

### Harvest Event Lifecycle

```
1. CREATE Intent (HarvestIntentModal)
   ↓
2. SCHEDULE Event (HarvestCalendar)
   ↓
3. GENERATE Pick Ticket (PickTicketGenerator)
   ↓
4. ASSIGN Crew (HarvestBoard)
   ↓
5. START Picking (CrewMobile - clock in)
   ↓
6. WEIGH Bins (WeighStation)
   ↓
7. GENERATE BOL (BOLGenerator)
   ↓
8. DELIVER (HarvestLogistics)
   ↓
9. RECEIVE (HarvestReceiving - QA check)
   ↓
10. CLOSE (HarvestBoard - finalize costs)
    ↓
11. REPORT (HarvestYieldReports)
```

### Real-time Updates

```
Weigh Station (Bin created)
  ↓
Supabase Realtime
  ↓
Harvest Board (Card updates with new bin count)
  ↓
Harvest Event (Total tons recalculated)
  ↓
Dashboard (Season totals updated)
```

---

## Migration Strategy

### From Existing System
1. Import historical harvest data
2. Map existing blocks
3. Preserve yield history
4. Link to financial records

### Training Plan
1. Admin training (planning, setup)
2. Field supervisor training (scheduling, tickets)
3. Crew training (mobile app, clock in/out)
4. Weigh station operator training
5. QA/lab training (sample entry)

---

## Success Metrics

### Operational
- Time to create harvest plan: < 30 min
- Weigh station throughput: > 40 bins/hour
- Mobile app offline capability: 100% field coverage
- Data accuracy: > 99% (weight, quality)

### Business
- Labor cost reduction: 15-20%
- Waste reduction (reject tons): 10%
- Improved quality tracking: 100% bins sampled
- Faster closeout: same-day vs 1-week

### User Satisfaction
- User adoption: > 90% within 2 weeks
- Mobile app rating: > 4.5/5
- Support tickets: < 5 per week
- Feature requests: continuous improvement

---

## Risk Mitigation

### Technical Risks
- **Scale failure**: Manual weight entry fallback
- **Network outage**: Offline mode + sync
- **Data loss**: Automated backups every 15 min
- **Performance**: Database indexing + caching

### Operational Risks
- **User error**: Input validation + warnings
- **Weather delays**: Flexible scheduling + alerts
- **Equipment failure**: Equipment redundancy
- **Crew shortage**: Real-time capacity tracking

---

## Future Enhancements (Beyond Phase 7)

### Year 2
- AI-powered quality grading (computer vision)
- Drone integration (aerial ripeness assessment)
- Blockchain traceability
- Multi-vineyard/multi-region support
- White-label platform for consultants

### Year 3
- Marketplace (buy/sell grapes)
- Weather insurance integration
- Sustainability tracking (carbon, water)
- Predictive maintenance (equipment)
- Advanced fermentation tracking

---

## Estimated Timeline

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1: Foundation | 2 weeks | Database migrations |
| Phase 2: Planning | 2 weeks | Phase 1 complete |
| Phase 3: Execution | 2 weeks | Phase 2 complete |
| Phase 4: Quality | 2 weeks | Phase 3 complete |
| Phase 5: Financial | 2 weeks | Phase 4 complete |
| Phase 6: Advanced | 2 weeks | Phase 5 complete |
| Phase 7: Polish | 2 weeks | Phase 6 complete |
| **Total** | **14 weeks** | - |

---

## Resource Requirements

### Development Team
- 1 Full-stack developer (you + Claude)
- Testing: Self + beta users
- Design: TailwindCSS + existing patterns

### Infrastructure
- Supabase Pro plan (~$25/month)
- Domain + hosting
- Label printer hardware
- Scale integration (optional)

### Time Commitment
- Weeks 1-4: 20 hours/week (foundation + planning)
- Weeks 5-10: 25 hours/week (core features)
- Weeks 11-14: 15 hours/week (polish + testing)

---

## Getting Started (Phase 1)

We will begin with:

1. **Create database migrations** (harvest tables)
2. **Set up RLS policies** (security)
3. **Build API layer** (CRUD operations)
4. **Create basic UI shell** (navigation, routing)
5. **Implement Harvest Plans** (season-level management)

**Estimated Phase 1 Completion**: 2 weeks from start

Ready to proceed with Phase 1?
