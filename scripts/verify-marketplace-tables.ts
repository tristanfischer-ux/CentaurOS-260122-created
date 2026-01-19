/**
 * Verify Marketplace Directory Tables
 *
 * This script checks if the marketplace directory tables exist in the database.
 * It uses the anon key, so it can only verify table existence via RLS policies.
 *
 * Usage: bun run scripts/verify-marketplace-tables.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing environment variables:');
  console.error('   - EXPO_PUBLIC_SUPABASE_URL');
  console.error('   - EXPO_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function verifyMarketplaceTables() {
  console.log('🔍 VERIFYING MARKETPLACE DIRECTORY TABLES\n');
  console.log('='.repeat(80));

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
    'external_contacts',
    'external_evidence',
    'import_runs',
    'import_row_errors',
  ];

  console.log('\n📋 Checking marketplace tables...\n');

  const tableStatus: Record<string, boolean> = {};

  for (const tableName of tablesToCheck) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(0);

      if (error) {
        if (error.code === '42P01') {
          // Table doesn't exist
          tableStatus[tableName] = false;
          console.log(`❌ ${tableName} - NOT FOUND`);
        } else {
          // Table exists (RLS or other error)
          tableStatus[tableName] = true;
          console.log(`✅ ${tableName} - EXISTS (${error.message})`);
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

  console.log('\n' + '='.repeat(80));
  console.log(`\n📊 SUMMARY: ${existingCount}/${totalCount} tables exist\n`);

  if (existingCount === totalCount) {
    console.log('✅ ALL MARKETPLACE TABLES EXIST!');
    console.log('\n📋 Next steps:');
    console.log('   1. Add SUPABASE_SERVICE_ROLE_KEY to .env file');
    console.log('   2. Add ANTHROPIC_API_KEY to .env file');
    console.log('   3. Run: bun run scripts/ingest_marketplace.ts');
    console.log('   4. Test the API endpoints');
    return true;
  } else {
    const missingTables = tablesToCheck.filter(table => !tableStatus[table]);
    console.log('⚠️  MISSING TABLES:');
    missingTables.forEach(table => console.log(`   - ${table}`));
    console.log('\n💡 ACTION REQUIRED:');
    console.log('   1. Go to Supabase SQL Editor');
    console.log('   2. Run the SQL from: supabase/migrations/005_marketplace_directory.sql');
    console.log('   3. Re-run this script to verify');
    return false;
  }
}

// Run verification
verifyMarketplaceTables()
  .then(success => {
    console.log('\n' + '='.repeat(80));
    console.log('\n✅ Verification complete!\n');
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n❌ Verification failed:', error);
    process.exit(1);
  });
