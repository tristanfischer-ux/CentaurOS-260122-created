# Clear All Supabase Data

This script completely wipes all data from your Supabase database, giving you a clean slate.

## ⚠️ WARNING

**This is irreversible!** All data will be permanently deleted:
- All financial transactions and budgets
- All workspaces, members, and memberships
- All tasks, work plans, decisions, and OKRs
- All user profiles
- Optionally, all marketplace data (suppliers, AI tools, executives, apprentices)

**Your Supabase Auth users will NOT be deleted** - those are managed separately by Supabase Auth.

## How to Run This Script

### Option 1: Via Supabase Dashboard (Recommended)

1. Open your Supabase project dashboard: https://supabase.com/dashboard
2. Click **SQL Editor** in the left sidebar
3. Click **New query**
4. Copy the contents of `clear-all-supabase-data.sql`
5. Paste into the SQL Editor
6. Review the script carefully
7. Click **Run** (or press Cmd/Ctrl + Enter)

### Option 2: Via Supabase CLI

```bash
# Make sure you're logged in to Supabase CLI
supabase login

# Link your project (if not already linked)
supabase link --project-ref YOUR_PROJECT_REF

# Run the SQL file
supabase db execute < clear-all-supabase-data.sql
```

## What Gets Deleted

### User Data (Tier 3)
- ✅ User preferences
- ✅ User skills

### Company Data (Tier 2)
- ✅ Financial transactions
- ✅ Budget targets
- ✅ Company financials
- ✅ Work plans
- ✅ Tasks
- ✅ Decisions
- ✅ OKRs
- ✅ Team members
- ✅ Memberships
- ✅ Bulk import logs

### Core Data
- ✅ Workspaces
- ✅ Profiles

### Marketplace Data (Tier 1) - OPTIONAL
By default, marketplace data is **preserved** (commented out in the script).

If you want to clear marketplace data too, uncomment these lines in the script:
```sql
DELETE FROM marketplace_reviews;
DELETE FROM apprentice_listings;
DELETE FROM executive_listings;
DELETE FROM ai_tools;
DELETE FROM suppliers;
DELETE FROM function_templates;
DELETE FROM role_definitions;
```

## What's NOT Deleted

- ❌ Supabase Auth users (managed separately by `auth.users` table)
- ❌ Database schema, tables, and policies
- ❌ Supabase project settings

## After Running This Script

1. **Refresh your app** - The app may show cached data initially
2. **Use "Clear All Data" in Settings** - This clears local AsyncStorage/MMKV cache
3. **Sign out and sign back in** - Creates a fresh session
4. Your Supabase tables are now empty and ready for real data!

## Verification

The script includes a verification query at the end that shows the row count for each table.

Expected result after running:
```
table_name              | row_count
------------------------|----------
profiles                | 0
workspaces              | 0
memberships             | 0
members                 | 0
financial_transactions  | 0
budget_targets          | 0
work_plans              | 0
tasks                   | 0
decisions               | 0
okrs                    | 0
```

## Re-seeding Data

If you want to add the seed data back for testing:

```bash
supabase db reset
```

This will:
1. Drop all tables
2. Recreate the schema
3. Run all migrations including seed data

## Troubleshooting

### Permission Denied

If you get permission errors, make sure:
1. You're using a service role key or database password
2. RLS policies allow the operation
3. You have admin access to the project

### Foreign Key Constraints

The script is ordered to delete child records before parent records to avoid foreign key constraint errors.

If you still get errors, check if there are additional foreign key relationships not covered in the script.

## Need Help?

- Check the [Supabase Documentation](https://supabase.com/docs)
- Review the database schema in `supabase-three-tier-schema.sql`
- Check migration files in `supabase/migrations/`
