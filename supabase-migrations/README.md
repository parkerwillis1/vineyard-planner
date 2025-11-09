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
4. add_archived_at_columns.sql (Optional - required for Archive feature)
5. add_field_metrics_to_blocks.sql
6. add_soil_and_custom_fields_to_blocks.sql
7. add_custom_fields_to_blocks.sql
8. add_flow_rate_to_blocks.sql
9. alter_subscriptions_add_stripe_columns.sql
10. subscriptions.sql
11. usage_tracking.sql

## Notes

- All migrations use `IF NOT EXISTS` / `IF EXISTS` clauses to be safely re-runnable
- Migrations are idempotent - running them multiple times won't cause errors
- Always backup your database before running migrations in production
