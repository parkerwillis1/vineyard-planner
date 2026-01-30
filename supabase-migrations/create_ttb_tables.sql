-- TTB Form 5120.17 Compliance Tables
-- Federal excise tax reporting for bonded wineries

-- =====================================================
-- 1. TTB WINERY REGISTRATION
-- Stores winery identification and reporting preferences
-- =====================================================
CREATE TABLE IF NOT EXISTS ttb_winery_registration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Federal identification
  ein TEXT,                          -- Employer Identification Number
  registry_number TEXT,              -- TTB Registry Number (BWC-XX-####)

  -- Business information
  operated_by TEXT NOT NULL,         -- Legal business name
  trade_name TEXT,                   -- DBA / Trade name

  -- Premises address
  premises_address TEXT,
  premises_city TEXT,
  premises_state TEXT,
  premises_zip TEXT,

  -- Mailing address (if different)
  mailing_address TEXT,
  mailing_city TEXT,
  mailing_state TEXT,
  mailing_zip TEXT,

  -- Reporting configuration
  reporting_period TEXT DEFAULT 'monthly'
    CHECK (reporting_period IN ('monthly', 'quarterly', 'annual')),
  fiscal_year_start INTEGER DEFAULT 1,  -- Month number (1-12)

  -- Contact information
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id)
);

-- =====================================================
-- 2. TTB TRANSACTIONS
-- Core transaction log for all reportable TTB events
-- =====================================================
CREATE TABLE IF NOT EXISTS ttb_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Classification
  transaction_type TEXT NOT NULL,    -- e.g., 'produced_fermentation', 'bulk_bottled'
  tax_class TEXT NOT NULL,           -- e.g., 'table_wine_16', 'sparkling_bf'

  -- Quantity (always in gallons for TTB reporting)
  volume_gallons DECIMAL(12, 4) NOT NULL,

  -- Related entities (nullable - may not all apply)
  -- Note: Foreign keys added conditionally below if tables exist
  lot_id UUID,
  bottling_run_id UUID,
  container_id UUID,

  -- For bond-to-bond transfers
  counterparty_registry TEXT,        -- Other winery's registry number
  counterparty_name TEXT,

  -- Transaction details
  transaction_date DATE NOT NULL,
  reference_number TEXT,             -- Invoice, bill of lading, etc.
  notes TEXT,

  -- Audit trail
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Source tracking (prevents duplicate auto-logging)
  source_event_type TEXT,            -- e.g., 'lot_status_change', 'bottling_complete'
  source_event_id UUID,

  UNIQUE(source_event_type, source_event_id, transaction_type)
);

-- Add foreign keys conditionally if referenced tables exist
DO $$
BEGIN
  -- Add FK to production_lots if it exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'production_lots') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'ttb_transactions_lot_id_fkey' AND table_name = 'ttb_transactions'
    ) THEN
      ALTER TABLE ttb_transactions
        ADD CONSTRAINT ttb_transactions_lot_id_fkey
        FOREIGN KEY (lot_id) REFERENCES production_lots(id) ON DELETE SET NULL;
    END IF;
  END IF;

  -- Add FK to bottling_runs if it exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bottling_runs') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'ttb_transactions_bottling_run_id_fkey' AND table_name = 'ttb_transactions'
    ) THEN
      ALTER TABLE ttb_transactions
        ADD CONSTRAINT ttb_transactions_bottling_run_id_fkey
        FOREIGN KEY (bottling_run_id) REFERENCES bottling_runs(id) ON DELETE SET NULL;
    END IF;
  END IF;

  -- Add FK to production_containers if it exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'production_containers') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'ttb_transactions_container_id_fkey' AND table_name = 'ttb_transactions'
    ) THEN
      ALTER TABLE ttb_transactions
        ADD CONSTRAINT ttb_transactions_container_id_fkey
        FOREIGN KEY (container_id) REFERENCES production_containers(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

-- =====================================================
-- 3. TTB REPORT PERIODS
-- Tracks generated/submitted reports
-- =====================================================
CREATE TABLE IF NOT EXISTS ttb_report_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Period definition
  period_type TEXT NOT NULL          -- monthly, quarterly, annual
    CHECK (period_type IN ('monthly', 'quarterly', 'annual')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Report status
  status TEXT DEFAULT 'draft'
    CHECK (status IN ('draft', 'reviewed', 'submitted', 'amended')),

  -- Snapshot of calculated report data
  report_data JSONB,

  -- Submission tracking
  submitted_at TIMESTAMPTZ,
  submitted_by UUID REFERENCES auth.users(id),
  confirmation_number TEXT,

  -- Amendment tracking
  amended_at TIMESTAMPTZ,
  amendment_reason TEXT,
  original_report_id UUID REFERENCES ttb_report_periods(id),

  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, period_start, period_end)
);

-- =====================================================
-- 4. ALTER PRODUCTION_LOTS - Add TTB fields (if table exists)
-- =====================================================
DO $$
BEGIN
  -- Only proceed if production_lots table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'production_lots') THEN
    -- Add wine_type column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'production_lots' AND column_name = 'wine_type'
    ) THEN
      ALTER TABLE production_lots
      ADD COLUMN wine_type TEXT DEFAULT 'still'
        CHECK (wine_type IN ('still', 'sparkling_bf', 'sparkling_bp',
                             'artificially_carbonated', 'hard_cider'));
    END IF;

    -- Add ttb_tax_class column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'production_lots' AND column_name = 'ttb_tax_class'
    ) THEN
      ALTER TABLE production_lots ADD COLUMN ttb_tax_class TEXT;
    END IF;

    -- Add bond_status column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'production_lots' AND column_name = 'bond_status'
    ) THEN
      ALTER TABLE production_lots
      ADD COLUMN bond_status TEXT DEFAULT 'in_bond'
        CHECK (bond_status IN ('in_bond', 'taxpaid', 'exported', 'transferred'));
    END IF;
  END IF;
END $$;

-- =====================================================
-- 5. ALTER BOTTLED_INVENTORY - Add TTB fields (if table exists)
-- =====================================================
DO $$
BEGIN
  -- Only proceed if bottled_inventory table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bottled_inventory') THEN
    -- Add bond_status column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'bottled_inventory' AND column_name = 'bond_status'
    ) THEN
      ALTER TABLE bottled_inventory
      ADD COLUMN bond_status TEXT DEFAULT 'in_bond'
        CHECK (bond_status IN ('in_bond', 'taxpaid', 'exported', 'transferred'));
    END IF;

    -- Add ttb_tax_class column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'bottled_inventory' AND column_name = 'ttb_tax_class'
    ) THEN
      ALTER TABLE bottled_inventory ADD COLUMN ttb_tax_class TEXT;
    END IF;

    -- Add gallons_equivalent column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'bottled_inventory' AND column_name = 'gallons_equivalent'
    ) THEN
      ALTER TABLE bottled_inventory ADD COLUMN gallons_equivalent DECIMAL(12, 4);
    END IF;
  END IF;
END $$;

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_ttb_winery_registration_user
  ON ttb_winery_registration(user_id);

CREATE INDEX IF NOT EXISTS idx_ttb_transactions_user
  ON ttb_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_ttb_transactions_date
  ON ttb_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_ttb_transactions_type
  ON ttb_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_ttb_transactions_tax_class
  ON ttb_transactions(tax_class);
CREATE INDEX IF NOT EXISTS idx_ttb_transactions_lot
  ON ttb_transactions(lot_id);
CREATE INDEX IF NOT EXISTS idx_ttb_transactions_source
  ON ttb_transactions(source_event_type, source_event_id);

CREATE INDEX IF NOT EXISTS idx_ttb_report_periods_user
  ON ttb_report_periods(user_id);
CREATE INDEX IF NOT EXISTS idx_ttb_report_periods_dates
  ON ttb_report_periods(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_ttb_report_periods_status
  ON ttb_report_periods(status);

-- Indexes for production_lots (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'production_lots') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_production_lots_wine_type') THEN
      CREATE INDEX idx_production_lots_wine_type ON production_lots(wine_type);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_production_lots_tax_class') THEN
      CREATE INDEX idx_production_lots_tax_class ON production_lots(ttb_tax_class);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_production_lots_bond_status') THEN
      CREATE INDEX idx_production_lots_bond_status ON production_lots(bond_status);
    END IF;
  END IF;
END $$;

-- Indexes for bottled_inventory (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bottled_inventory') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_bottled_inventory_bond_status') THEN
      CREATE INDEX idx_bottled_inventory_bond_status ON bottled_inventory(bond_status);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_bottled_inventory_tax_class') THEN
      CREATE INDEX idx_bottled_inventory_tax_class ON bottled_inventory(ttb_tax_class);
    END IF;
  END IF;
END $$;

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE ttb_winery_registration ENABLE ROW LEVEL SECURITY;
ALTER TABLE ttb_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ttb_report_periods ENABLE ROW LEVEL SECURITY;

-- TTB Winery Registration Policies
CREATE POLICY "Users can view their own winery registration"
  ON ttb_winery_registration FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own winery registration"
  ON ttb_winery_registration FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own winery registration"
  ON ttb_winery_registration FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own winery registration"
  ON ttb_winery_registration FOR DELETE
  USING (auth.uid() = user_id);

-- TTB Transactions Policies
CREATE POLICY "Users can view their own TTB transactions"
  ON ttb_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own TTB transactions"
  ON ttb_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own TTB transactions"
  ON ttb_transactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own TTB transactions"
  ON ttb_transactions FOR DELETE
  USING (auth.uid() = user_id);

-- TTB Report Periods Policies
CREATE POLICY "Users can view their own TTB reports"
  ON ttb_report_periods FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own TTB reports"
  ON ttb_report_periods FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own TTB reports"
  ON ttb_report_periods FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own TTB reports"
  ON ttb_report_periods FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- UPDATE TRIGGERS
-- =====================================================
CREATE TRIGGER ttb_winery_registration_updated_at
  BEFORE UPDATE ON ttb_winery_registration
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER ttb_report_periods_updated_at
  BEFORE UPDATE ON ttb_report_periods
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TRANSACTION TYPE REFERENCE (as comments)
-- =====================================================
-- Bulk Wine Additions (Part I, Section A):
--   produced_fermentation     (Line 2) - Wine produced by fermentation
--   produced_sweetening       (Line 3) - Produced by sweetening
--   produced_spirits          (Line 4) - Produced by addition of wine spirits
--   produced_blending         (Line 5) - Produced by blending (cross-tax-class)
--   produced_amelioration     (Line 6) - Produced by amelioration
--   received_bond             (Line 7) - Received in bond from others
--   bottled_dumped_bulk       (Line 8) - Bottled wine dumped to bulk
--   inventory_gain            (Line 9) - Inventory gains
--
-- Bulk Wine Removals (Part I, Section A):
--   bulk_bottled              (Line 13) - Bottled
--   bulk_removed_taxpaid      (Line 14) - Removed taxpaid
--   bulk_transferred_bond     (Line 15) - Transferred in bond
--   bulk_exported             (Line 16) - Exported
--   bulk_destroyed            (Line 17) - Destroyed
--   bulk_used_distillation    (Line 18) - Used for distillation
--   bulk_vinegar              (Line 19) - Used as vinegar stock
--   bulk_tasting              (Line 20) - Tasting use
--   bulk_losses_other         (Line 29) - Losses (other than inventory)
--   bulk_losses_inventory     (Line 30) - Inventory losses
--
-- Bottled Wine Additions (Part I, Section B):
--   bottled_produced          (Line 2) - Bottled (from bottling run)
--   bottled_received_bond     (Line 5) - Received in bond
--   bottled_inventory_gain    (Line 6) - Inventory gains
--
-- Bottled Wine Removals (Part I, Section B):
--   bottled_removed_taxpaid   (Line 8) - Removed taxpaid
--   bottled_transferred_bond  (Line 9) - Transferred in bond
--   bottled_exported          (Line 10) - Exported
--   bottled_tasting           (Line 11) - Tasting use
--   bottled_breakage          (Line 12) - Breakage/losses
--   bottled_dumped_bulk       (Line 13) - Dumped to bulk

COMMENT ON TABLE ttb_winery_registration IS 'TTB Form 5120.17 winery registration and reporting configuration';
COMMENT ON TABLE ttb_transactions IS 'Individual TTB-reportable transactions for 5120.17 line items';
COMMENT ON TABLE ttb_report_periods IS 'Generated TTB 5120.17 reports by reporting period';
