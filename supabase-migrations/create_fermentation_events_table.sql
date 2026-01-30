-- Fermentation Events Table
-- Tracks nutrient additions, deviations, interventions, and sensory flags during fermentation
-- This enables decision support, learning across vintages, and proper traceability

CREATE TABLE IF NOT EXISTS fermentation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id UUID NOT NULL REFERENCES lots(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),

  -- Event timing
  event_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Event classification
  event_type TEXT NOT NULL CHECK (event_type IN (
    'nutrient',           -- Nutrient additions (DAP, Fermaid, etc.)
    'deviation',          -- Problems/issues (stuck ferment, H2S, temp spike)
    'intervention',       -- Corrective actions taken
    'sensory_flag',       -- Notable sensory observations
    'milestone',          -- Key fermentation milestones
    'oxygen',             -- Oxygen management (delestage, rack & return)
    'other'
  )),

  -- Category within event type
  category TEXT, -- e.g., 'dap', 'fermaid_k', 'stuck_ferment', 'h2s', 'temp_spike', etc.

  -- For nutrient additions
  dosage DECIMAL(10,2),
  dosage_unit TEXT CHECK (dosage_unit IN ('g', 'g/hL', 'mL', 'mL/hL', 'ppm', 'oz', 'lb')),
  yan_reading DECIMAL(10,2), -- Optional YAN measurement

  -- For deviations/incidents
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,

  -- For oxygen/extraction management
  intensity TEXT CHECK (intensity IN ('light', 'moderate', 'aggressive')),
  extraction_goal TEXT CHECK (extraction_goal IN ('color', 'tannin', 'aromatics', 'general')),

  -- Readings at time of event (snapshot)
  brix_at_event DECIMAL(5,2),
  temp_at_event DECIMAL(5,1),
  ph_at_event DECIMAL(4,2),

  -- Recommendation & learning
  recommended_action TEXT,      -- What the system suggested
  action_taken TEXT,            -- What the winemaker actually did
  winemaker_override BOOLEAN DEFAULT FALSE, -- Did they ignore the recommendation?
  override_reason TEXT,         -- Why they ignored it

  -- Outcome tracking (for learning)
  outcome_notes TEXT,           -- What happened after this intervention
  effectiveness_rating INTEGER CHECK (effectiveness_rating BETWEEN 1 AND 5), -- 1=ineffective, 5=very effective

  -- General
  notes TEXT,

  -- Indexes for common queries
  CONSTRAINT valid_nutrient_dosage CHECK (
    event_type != 'nutrient' OR (dosage IS NOT NULL AND dosage_unit IS NOT NULL)
  )
);

-- Indexes
CREATE INDEX idx_fermentation_events_lot_id ON fermentation_events(lot_id);
CREATE INDEX idx_fermentation_events_event_type ON fermentation_events(event_type);
CREATE INDEX idx_fermentation_events_event_date ON fermentation_events(event_date DESC);
CREATE INDEX idx_fermentation_events_user_id ON fermentation_events(user_id);
CREATE INDEX idx_fermentation_events_resolved ON fermentation_events(resolved) WHERE resolved = FALSE;

-- RLS Policies
ALTER TABLE fermentation_events ENABLE ROW LEVEL SECURITY;

-- Users can only see their own events
CREATE POLICY "Users can view own fermentation events"
  ON fermentation_events FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own events
CREATE POLICY "Users can insert own fermentation events"
  ON fermentation_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own events
CREATE POLICY "Users can update own fermentation events"
  ON fermentation_events FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own events
CREATE POLICY "Users can delete own fermentation events"
  ON fermentation_events FOR DELETE
  USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_fermentation_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER fermentation_events_updated_at
  BEFORE UPDATE ON fermentation_events
  FOR EACH ROW
  EXECUTE FUNCTION update_fermentation_events_updated_at();

-- Comments for documentation
COMMENT ON TABLE fermentation_events IS 'Tracks all fermentation events including nutrient additions, deviations, interventions, and sensory flags';
COMMENT ON COLUMN fermentation_events.event_type IS 'Type of event: nutrient, deviation, intervention, sensory_flag, milestone, oxygen, other';
COMMENT ON COLUMN fermentation_events.winemaker_override IS 'True if the winemaker ignored the system recommendation';
COMMENT ON COLUMN fermentation_events.effectiveness_rating IS 'Post-hoc rating of how effective the intervention was (1-5)';
