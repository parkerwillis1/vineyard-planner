-- =====================================================
-- TASKS SYSTEM: COMPREHENSIVE TASK MANAGEMENT FOR VINEYARD OPERATIONS
-- =====================================================

-- Task types enumeration
CREATE TYPE task_type AS ENUM (
  'vine_ops',
  'spray_prep',
  'irrigation',
  'harvest_prep',
  'maintenance',
  'admin',
  'scouting',
  'pruning',
  'canopy_management',
  'weed_control',
  'fertilization',
  'other'
);

-- Task status enumeration
CREATE TYPE task_status AS ENUM (
  'draft',
  'scheduled',
  'in_progress',
  'needs_review',
  'done',
  'archived',
  'blocked'
);

-- Task priority enumeration
CREATE TYPE task_priority AS ENUM (
  'low',
  'normal',
  'high',
  'urgent'
);

-- Cost center enumeration
CREATE TYPE cost_center AS ENUM (
  'pre_planting',
  'cultural',
  'harvest',
  'overhead',
  'equipment',
  'pest_management',
  'irrigation'
);

-- =====================================================
-- MAIN TASKS TABLE
-- =====================================================
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  season_id UUID REFERENCES seasons(id) ON DELETE SET NULL,

  -- Basic info
  title TEXT NOT NULL,
  type task_type NOT NULL DEFAULT 'vine_ops',
  status task_status NOT NULL DEFAULT 'scheduled',
  priority task_priority NOT NULL DEFAULT 'normal',

  -- Assignment
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assignees UUID[] DEFAULT '{}',

  -- Scope
  blocks UUID[] DEFAULT '{}', -- references vineyard_blocks.id
  acres_target NUMERIC,

  -- Timing
  start_date DATE,
  due_date DATE,
  planned_duration_min INTEGER,
  actual_duration_min INTEGER,
  completed_at TIMESTAMPTZ,

  -- Content
  instructions TEXT,
  safety_notes TEXT,
  notes TEXT,

  -- Advanced features
  recurrence_rule TEXT, -- iCal RRULE format
  parent_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  dependency_ids UUID[] DEFAULT '{}',
  cost_center cost_center,

  -- Geo
  geo JSONB, -- optional GPS points for work area

  -- Costs (calculated)
  labor_cost NUMERIC DEFAULT 0,
  materials_cost NUMERIC DEFAULT 0,
  equipment_cost NUMERIC DEFAULT 0,
  total_cost NUMERIC GENERATED ALWAYS AS (
    COALESCE(labor_cost, 0) + COALESCE(materials_cost, 0) + COALESCE(equipment_cost, 0)
  ) STORED,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Constraints
  CONSTRAINT valid_dates CHECK (due_date IS NULL OR start_date IS NULL OR start_date <= due_date)
);

-- Indexes
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_season_id ON tasks(season_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_start_date ON tasks(start_date);
CREATE INDEX idx_tasks_assignees ON tasks USING GIN (assignees);
CREATE INDEX idx_tasks_blocks ON tasks USING GIN (blocks);
CREATE INDEX idx_tasks_type ON tasks(type);

-- =====================================================
-- TASK CHECKLIST
-- =====================================================
CREATE TABLE task_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  label TEXT NOT NULL,
  is_done BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sort_index INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_task_checklist_task_id ON task_checklist(task_id);
CREATE INDEX idx_task_checklist_user_id ON task_checklist(user_id);

-- =====================================================
-- TASK LABOR LOGS
-- =====================================================
CREATE TABLE task_labor_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  block_id UUID REFERENCES vineyard_blocks(id) ON DELETE SET NULL,

  worker_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  worker_name TEXT, -- in case not a system user

  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  hours NUMERIC,
  hourly_rate NUMERIC,
  cost NUMERIC GENERATED ALWAYS AS (COALESCE(hours, 0) * COALESCE(hourly_rate, 0)) STORED,

  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT valid_time_range CHECK (ended_at IS NULL OR started_at IS NULL OR started_at <= ended_at)
);

CREATE INDEX idx_task_labor_logs_task_id ON task_labor_logs(task_id);
CREATE INDEX idx_task_labor_logs_user_id ON task_labor_logs(user_id);
CREATE INDEX idx_task_labor_logs_block_id ON task_labor_logs(block_id);
CREATE INDEX idx_task_labor_logs_worker_id ON task_labor_logs(worker_id);

-- =====================================================
-- TASK MATERIALS
-- =====================================================
CREATE TABLE task_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  block_id UUID REFERENCES vineyard_blocks(id) ON DELETE SET NULL,

  item_id UUID, -- references future inventory table
  item_name TEXT NOT NULL,

  phase TEXT NOT NULL CHECK (phase IN ('plan', 'actual')),
  qty NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  unit_cost NUMERIC,
  cost NUMERIC GENERATED ALWAYS AS (COALESCE(qty, 0) * COALESCE(unit_cost, 0)) STORED,

  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_task_materials_task_id ON task_materials(task_id);
CREATE INDEX idx_task_materials_user_id ON task_materials(user_id);
CREATE INDEX idx_task_materials_block_id ON task_materials(block_id);
CREATE INDEX idx_task_materials_phase ON task_materials(phase);

-- =====================================================
-- TASK EQUIPMENT LOGS
-- =====================================================
CREATE TABLE task_equipment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  block_id UUID REFERENCES vineyard_blocks(id) ON DELETE SET NULL,

  equipment_id UUID, -- references future equipment table
  equipment_name TEXT NOT NULL,

  hours NUMERIC,
  hourly_rate NUMERIC,
  cost NUMERIC GENERATED ALWAYS AS (COALESCE(hours, 0) * COALESCE(hourly_rate, 0)) STORED,

  fuel_used NUMERIC,
  fuel_unit TEXT,

  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_task_equipment_logs_task_id ON task_equipment_logs(task_id);
CREATE INDEX idx_task_equipment_logs_user_id ON task_equipment_logs(user_id);
CREATE INDEX idx_task_equipment_logs_block_id ON task_equipment_logs(block_id);

-- =====================================================
-- TASK COMMENTS
-- =====================================================
CREATE TABLE task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  comment TEXT NOT NULL,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX idx_task_comments_user_id ON task_comments(user_id);

-- =====================================================
-- TASK ATTACHMENTS
-- =====================================================
CREATE TABLE task_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size_bytes INTEGER,
  storage_path TEXT NOT NULL,
  mime_type TEXT,

  title TEXT,
  description TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_task_attachments_task_id ON task_attachments(task_id);
CREATE INDEX idx_task_attachments_user_id ON task_attachments(user_id);

-- =====================================================
-- TASK TEMPLATES
-- =====================================================
CREATE TABLE task_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  type task_type NOT NULL,

  title_template TEXT NOT NULL,
  instructions_template TEXT,
  safety_notes_template TEXT,

  default_priority task_priority DEFAULT 'normal',
  default_duration_min INTEGER,
  default_cost_center cost_center,

  checklist_template JSONB, -- array of {label: string}
  materials_template JSONB, -- array of {item_name, qty, unit}

  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_task_templates_user_id ON task_templates(user_id);
CREATE INDEX idx_task_templates_type ON task_templates(type);

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Tasks
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tasks" ON tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks" ON tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks" ON tasks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks" ON tasks
  FOR DELETE USING (auth.uid() = user_id);

-- Task Checklist
ALTER TABLE task_checklist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own task checklists" ON task_checklist
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own task checklists" ON task_checklist
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own task checklists" ON task_checklist
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own task checklists" ON task_checklist
  FOR DELETE USING (auth.uid() = user_id);

-- Task Labor Logs
ALTER TABLE task_labor_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own task labor logs" ON task_labor_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own task labor logs" ON task_labor_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own task labor logs" ON task_labor_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own task labor logs" ON task_labor_logs
  FOR DELETE USING (auth.uid() = user_id);

-- Task Materials
ALTER TABLE task_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own task materials" ON task_materials
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own task materials" ON task_materials
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own task materials" ON task_materials
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own task materials" ON task_materials
  FOR DELETE USING (auth.uid() = user_id);

-- Task Equipment Logs
ALTER TABLE task_equipment_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own task equipment logs" ON task_equipment_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own task equipment logs" ON task_equipment_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own task equipment logs" ON task_equipment_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own task equipment logs" ON task_equipment_logs
  FOR DELETE USING (auth.uid() = user_id);

-- Task Comments
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own task comments" ON task_comments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own task comments" ON task_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own task comments" ON task_comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own task comments" ON task_comments
  FOR DELETE USING (auth.uid() = user_id);

-- Task Attachments
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own task attachments" ON task_attachments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own task attachments" ON task_attachments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own task attachments" ON task_attachments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own task attachments" ON task_attachments
  FOR DELETE USING (auth.uid() = user_id);

-- Task Templates
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own task templates" ON task_templates
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own task templates" ON task_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own task templates" ON task_templates
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own task templates" ON task_templates
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_checklist_updated_at
  BEFORE UPDATE ON task_checklist
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_labor_logs_updated_at
  BEFORE UPDATE ON task_labor_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_materials_updated_at
  BEFORE UPDATE ON task_materials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_equipment_logs_updated_at
  BEFORE UPDATE ON task_equipment_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_comments_updated_at
  BEFORE UPDATE ON task_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_attachments_updated_at
  BEFORE UPDATE ON task_attachments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_templates_updated_at
  BEFORE UPDATE ON task_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE tasks IS 'Core task management for vineyard operations';
COMMENT ON TABLE task_checklist IS 'Subtasks/checklist items for tasks';
COMMENT ON TABLE task_labor_logs IS 'Labor time tracking for tasks';
COMMENT ON TABLE task_materials IS 'Materials planned and used for tasks';
COMMENT ON TABLE task_equipment_logs IS 'Equipment usage tracking for tasks';
COMMENT ON TABLE task_comments IS 'Comments and notes on tasks';
COMMENT ON TABLE task_attachments IS 'Files and photos attached to tasks';
COMMENT ON TABLE task_templates IS 'Reusable task templates';

COMMENT ON COLUMN tasks.recurrence_rule IS 'iCal RRULE format for recurring tasks';
COMMENT ON COLUMN tasks.dependency_ids IS 'Array of task IDs that must complete before this task';
COMMENT ON COLUMN tasks.total_cost IS 'Sum of labor + materials + equipment costs';
