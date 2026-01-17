# Running Supabase Migrations

## CRITICAL: You must run these migrations to create the database tables

I've created the database schema and seed data in the `supabase/migrations/` folder. You need to run these SQL files in your Supabase dashboard to create all the tables.

## Steps:

1. **Open your Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Open the SQL Editor**
   - Click "SQL Editor" in the left sidebar

3. **Run Migration 001 (Create Tables)**
   - Click "New Query"
   - Copy the entire contents of `supabase/migrations/001_data_architecture.sql`
   - Paste into the SQL editor
   - Click "Run" or press Cmd/Ctrl + Enter
   - Wait for all tables to be created (should see "Success" message)

4. **Run Migration 002 (Seed Data)**
   - Click "New Query" again
   - Copy the entire contents of `supabase/migrations/002_seed_data.sql`
   - Paste into the SQL editor
   - Click "Run"
   - This will populate your database with test data (Acme Corp workspace with sample transactions, work plans, OKRs, etc.)

## Verify Tables Were Created

After running both migrations, check that these tables exist:

### Universal Data Tables:
- ai_tools
- function_templates
- role_definitions

### Company Data Tables:
- workspaces
- members
- work_plans
- work_plan_allocations
- work_plan_audit_records
- okrs
- okr_objectives
- suppliers
- supplier_engagements
- financial_transactions
- budget_targets

### User Data Tables:
- user_preferences
- user_favorite_suppliers

You can check in the "Table Editor" section of your Supabase dashboard.

## What This Does

The migrations will create:
- **All database tables** with proper foreign keys and constraints
- **Row-Level Security (RLS) policies** to ensure workspace isolation
- **Indexes** for query performance
- **Sample data** for the "Acme Corp" test workspace

Once you've run these migrations, the app will be able to load data from Supabase!
