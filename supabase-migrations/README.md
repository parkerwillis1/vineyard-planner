# Database Migrations

This directory contains SQL migration files for the Vineyard Planner database.

## Running Migrations

To run a migration, execute the SQL file in your Supabase SQL Editor:

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor (Database > SQL Editor)
3. Copy the contents of the migration file
4. Paste into a new query
5. Click "Run"

## Available Migrations

### create_irrigation_schedules.sql
Creates the irrigation schedules table and updates irrigation_events table for recurring irrigation schedules.

**What it does:**
- Creates `irrigation_schedules` table for recurring irrigation automation
- Adds `source` column to `irrigation_events` ('manual', 'schedule', 'webhook')
- Adds `schedule_id` foreign key to link events to schedules
- Includes RLS policies for data security

**When to run:**
- **REQUIRED** to use the Irrigation Scheduling feature in the Irrigation Management page

**Tables created:**
- irrigation_schedules

**Tables modified:**
- irrigation_events (adds source, schedule_id columns)

---

### create_field_yield_history.sql
Creates the field yield history table for tracking harvest data.

**What it does:**
- Creates `field_yield_history` table with harvest metrics (tons, brix, pH, TA, etc.)
- Enables yield tracking per field per year
- Includes RLS policies for data security

**When to run:**
- **REQUIRED** to use the Yield History feature in field detail pages

**Tables created:**
- field_yield_history

---

### create_field_attachments.sql
Creates the field attachments table and storage bucket for field photos.

**What it does:**
- Creates `field_attachments` table for storing photo metadata
- Creates storage bucket for photo files
- Includes soft delete support with `archived_at`
- Sets up RLS policies for storage and database

**When to run:**
- **REQUIRED** to use the Photos feature in field detail pages

**Tables created:**
- field_attachments

**Storage buckets created:**
- field-attachments

---

### create_production_tables.sql
Creates all tables for the Winery Production module.

**What it does:**
- Creates `production_containers` table for vessels (tanks, barrels, totes)
- Creates `production_lots` table for tracking wine lots from crush to bottle
- Creates `fermentation_logs` table for daily cellar monitoring
- Creates `blend_components` table for tracking blend recipes
- Includes vineyard-winery integration via block_id foreign key
- Sets up comprehensive RLS policies and indexes

**When to run:**
- **REQUIRED** to use the Winery Production module

**Tables created:**
- production_containers
- production_lots
- fermentation_logs
- blend_components

---

### add_fermentation_fields.sql
Adds fermentation workflow tracking fields to production_lots table.

**What it does:**
- Adds `fermentation_start_date` for tracking when primary fermentation starts
- Adds `target_fermentation_days` for setting fermentation duration goals (typically 10-21 days)
- Adds `press_date` for recording when wine is pressed
- Adds `so2_ppm` for tracking sulfite additions
- Adds `yeast_strain` for recording yeast used in fermentation
- Creates performance indexes for date fields

**When to run:**
- **REQUIRED** to use the Fermentation Tracker workflow (timer, vessel assignment, press tracking)
- Must be run AFTER `create_production_tables.sql`

**Tables modified:**
- production_lots

---

### add_task_rbac.sql
Implements Role-Based Access Control (RBAC) for tasks with Admin, Manager, and Member roles.

**What it does:**
- Adds `manager_id` column to `organization_members` to establish manager-member hierarchy
- Adds `visibility` column to `tasks` for controlling task visibility (private/team/organization)
- Updates RLS policies to enforce role-based access:
  - **Admin**: Can see and manage all tasks
  - **Manager**: Can see own tasks + created tasks + team member tasks
  - **Member**: Can only see assigned tasks + own created tasks
- Adds organization settings for default task visibility
- Creates helper function `get_user_team_members()` for retrieving team members

**When to run:**
- **OPTIONAL** - Recommended for organizations with multiple team members and managers
- Run this migration to enable proper task visibility based on user roles
- Safe to run on existing data (backward compatible)

**Tables modified:**
- organization_members (adds manager_id)
- tasks (adds visibility column)
- organizations (adds task_visibility_default, managers_see_all_tasks)

**RLS policies updated:**
- tasks (all SELECT, INSERT, UPDATE, DELETE policies)

**Functions created:**
- get_user_team_members(UUID)

**See Also:**
- `TASK_RBAC_DESIGN.md` - Complete design documentation and implementation guide

---

### add_archived_at_columns.sql
Adds soft delete functionality to existing tables.

**What it does:**
- Adds `archived_at` timestamp columns to tables (harvest_field_samples, tasks, vineyard_blocks)
- Creates indexes for better query performance
- Enables archive/restore functionality throughout the app

**When to run:**
- Run this migration to enable the Archive feature in Settings > Archived

**Tables affected:**
- harvest_field_samples
- tasks
- vineyard_blocks

## Migration Order

Migrations should be run in the following order:
1. **create_field_attachments.sql** (REQUIRED for Photos feature)
2. **create_field_yield_history.sql** (REQUIRED for Yield History feature)
3. **create_irrigation_schedules.sql** (REQUIRED for Irrigation Scheduling feature)
4. **create_production_tables.sql** (REQUIRED for Winery Production module)
5. **add_fermentation_fields.sql** (REQUIRED for Fermentation Tracker - run after create_production_tables.sql)
6. add_archived_at_columns.sql (Optional - required for Archive feature)
6. add_field_metrics_to_blocks.sql
7. add_soil_and_custom_fields_to_blocks.sql
8. add_custom_fields_to_blocks.sql
9. add_flow_rate_to_blocks.sql
10. alter_subscriptions_add_stripe_columns.sql
11. subscriptions.sql
12. usage_tracking.sql

## Notes

- All migrations use `IF NOT EXISTS` / `IF EXISTS` clauses to be safely re-runnable
- Migrations are idempotent - running them multiple times won't cause errors
- Always backup your database before running migrations in production
