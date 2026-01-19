/**
 * Run Marketplace Directory Migration
 *
 * This script applies the 005_marketplace_directory.sql migration to the database.
 * Usage: bun run scripts/run-marketplace-migration.ts
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing environment variables:');
  console.error('   - EXPO_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function runMigration() {
  console.log('🚀 RUNNING MARKETPLACE DIRECTORY MIGRATION\n');
  console.log('='.repeat(80));

  try {
    // Read the migration file
    const migrationPath = join(process.cwd(), 'supabase', 'migrations', '005_marketplace_directory.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('\n📄 Migration file loaded:', migrationPath);
    console.log(`   Size: ${migrationSQL.length} characters`);

    // Execute the migration using Supabase's RPC or direct SQL execution
    // Note: Supabase JS client doesn't have direct SQL execution for migrations
    // We need to use the REST API directly

    console.log('\n⚠️  IMPORTANT:');
    console.log('   The Supabase JS client does not support direct SQL execution for migrations.');
    console.log('   You need to run this migration manually in the Supabase SQL Editor.');
    console.log('\n📋 STEPS TO RUN MIGRATION:\n');
    console.log('   1. Go to: https://supabase.com/dashboard/project/[your-project-id]/sql');
    console.log('   2. Copy the contents of: supabase/migrations/005_marketplace_directory.sql');
    console.log('   3. Paste into the SQL Editor');
    console.log('   4. Click "Run" button');
    console.log('\n   OR use the Supabase CLI:');
    console.log('   $ supabase db push');

    // Verify if tables already exist
    console.log('\n🔍 Checking if marketplace tables already exist...\n');

    const tablesToCheck = [
      'directory_orgs',
      'directory_people',
      'directory_contacts',
      'directory_evidence',
      'directory_portfolio_links',
      'directory_startups',
      'directory_ai_tools',
      'directory_manufacturers',
      'external_entities',
      'import_runs',
    ];

    const tableStatus: Record<string, boolean> = {};

    for (const tableName of tablesToCheck) {
      try {
        const { error } = await supabase
          .from(tableName)
          .select('*')
          .limit(0);

        if (error) {
          if (error.code === '42P01') {
            // Table doesn't exist
            tableStatus[tableName] = false;
            console.log(`❌ ${tableName} - NOT FOUND`);
          } else {
            // Table exists but might have RLS
            tableStatus[tableName] = true;
            console.log(`✅ ${tableName} - EXISTS`);
          }
        } else {
          tableStatus[tableName] = true;
          console.log(`✅ ${tableName} - EXISTS`);
        }
      } catch (err: any) {
        tableStatus[tableName] = false;
        console.log(`❌ ${tableName} - ERROR: ${err.message}`);
      }
    }

    const existingCount = Object.values(tableStatus).filter(Boolean).length;
    const totalCount = tablesToCheck.length;

    console.log(`\n📊 SUMMARY: ${existingCount}/${totalCount} tables exist`);

    if (existingCount === totalCount) {
      console.log('\n✅ ALL MARKETPLACE TABLES ALREADY EXIST!');
      console.log('   Migration has already been run.');
      return true;
    } else {
      const missingTables = tablesToCheck.filter(table => !tableStatus[table]);
      console.log('\n⚠️  MISSING TABLES:');
      missingTables.forEach(table => console.log(`   - ${table}`));
      console.log('\n💡 ACTION REQUIRED:');
      console.log('   Run the SQL from supabase/migrations/005_marketplace_directory.sql in Supabase SQL Editor');
      return false;
    }
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    return false;
  }
}

// Run the migration check
runMigration()
  .then(success => {
    console.log('\n' + '='.repeat(80));
    console.log('\n✅ Migration check complete!\n');
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n❌ Migration check failed:', error);
    process.exit(1);
  });
