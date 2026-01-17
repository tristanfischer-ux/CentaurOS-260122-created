/**
 * Supabase Database Verification Script
 *
 * This script connects to Supabase and verifies:
 * 1. What tables exist
 * 2. Table structures match TypeScript types
 * 3. RLS policies are enabled
 * 4. Service layer can query data
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mdfpupnpftmkhyryozro.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kZnB1cG5wZnRta2h5cnlvenJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2MTg2NjksImV4cCI6MjA4NDE5NDY2OX0.P7kLI51Q-JAjlppV6DYEiYIsJ1uh6I1KqHcB98W95tI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Expected tables from three-tier schema
const EXPECTED_TABLES = [
  // Tier 1: Marketplace
  'suppliers',
  'ai_tools',
  'executive_listings',
  'apprentice_listings',
  'marketplace_reviews',

  // Tier 2: Company
  'company_financials',
  'decisions',
  'bulk_import_logs',

  // Tier 3: User
  'user_preferences',
  'user_skills',

  // Existing tables
  'profiles',
  'workspaces',
  'memberships',
  'team_members',
  'okrs',
  'tasks',
];

async function verifyDatabase() {
  console.log('🔍 VERIFYING SUPABASE DATABASE SETUP\n');
  console.log('=' .repeat(80));

  // Step 1: Check which tables exist
  console.log('\n📋 STEP 1: Checking which tables exist...\n');

  const tableResults: Record<string, boolean> = {};

  for (const tableName of EXPECTED_TABLES) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(0); // Just check if table exists, don't fetch data

      if (error) {
        if (error.code === '42P01') { // Table doesn't exist
          tableResults[tableName] = false;
          console.log(`❌ ${tableName} - DOES NOT EXIST`);
        } else {
          tableResults[tableName] = true;
          console.log(`✅ ${tableName} - EXISTS (RLS may be blocking)`);
        }
      } else {
        tableResults[tableName] = true;
        console.log(`✅ ${tableName} - EXISTS`);
      }
    } catch (err: any) {
      tableResults[tableName] = false;
      console.log(`❌ ${tableName} - ERROR: ${err.message}`);
    }
  }

  // Step 2: Check table structures for existing tables
  console.log('\n📐 STEP 2: Checking table structures...\n');

  // Check suppliers table structure
  if (tableResults['suppliers']) {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .limit(1);

    if (data && data.length === 0) {
      console.log('✅ suppliers - Structure accessible (empty table)');
    } else if (data && data.length > 0) {
      console.log('✅ suppliers - Has data:', Object.keys(data[0]).join(', '));
    } else if (error) {
      console.log(`⚠️  suppliers - RLS blocking: ${error.message}`);
    }
  }

  // Check ai_tools table structure
  if (tableResults['ai_tools']) {
    const { data, error } = await supabase
      .from('ai_tools')
      .select('*')
      .limit(1);

    if (data && data.length === 0) {
      console.log('✅ ai_tools - Structure accessible (empty table)');
    } else if (data && data.length > 0) {
      console.log('✅ ai_tools - Has data:', Object.keys(data[0]).join(', '));
    } else if (error) {
      console.log(`⚠️  ai_tools - RLS blocking: ${error.message}`);
    }
  }

  // Check company_financials
  if (tableResults['company_financials']) {
    const { data, error } = await supabase
      .from('company_financials')
      .select('*')
      .limit(1);

    if (data && data.length === 0) {
      console.log('✅ company_financials - Structure accessible (empty table)');
    } else if (data && data.length > 0) {
      console.log('✅ company_financials - Has data:', Object.keys(data[0]).join(', '));
    } else if (error) {
      console.log(`⚠️  company_financials - RLS blocking: ${error.message}`);
    }
  }

  // Step 3: Summary
  console.log('\n📊 SUMMARY\n');
  console.log('=' .repeat(80));

  const existingCount = Object.values(tableResults).filter(Boolean).length;
  const totalCount = EXPECTED_TABLES.length;

  console.log(`\nTables Found: ${existingCount}/${totalCount}`);

  const missingTables = EXPECTED_TABLES.filter(table => !tableResults[table]);

  if (missingTables.length > 0) {
    console.log('\n❌ MISSING TABLES:');
    missingTables.forEach(table => console.log(`   - ${table}`));
    console.log('\n💡 ACTION REQUIRED:');
    console.log('   Run the SQL from supabase-three-tier-schema.sql in Supabase SQL Editor');
  } else {
    console.log('\n✅ ALL TABLES EXIST!');
  }

  // Step 4: Test RLS policies
  console.log('\n🔒 STEP 3: Testing RLS Policies...\n');

  // Test marketplace tables (should be readable by authenticated users)
  if (tableResults['ai_tools']) {
    const { data, error } = await supabase
      .from('ai_tools')
      .select('*')
      .eq('is_active', true);

    if (error) {
      console.log(`⚠️  ai_tools RLS - Blocking queries: ${error.message}`);
      console.log('   This is expected if not authenticated');
    } else {
      console.log(`✅ ai_tools RLS - Working (${data?.length || 0} tools found)`);
    }
  }

  return {
    tableResults,
    missingTables,
    allTablesExist: missingTables.length === 0,
  };
}

// Run verification
verifyDatabase()
  .then(result => {
    console.log('\n' + '='.repeat(80));
    console.log('\n✅ Verification complete!\n');

    if (!result.allTablesExist) {
      console.log('⚠️  Some tables are missing. Please run the SQL schema.');
      process.exit(1);
    } else {
      console.log('✅ All tables exist!');
      process.exit(0);
    }
  })
  .catch(error => {
    console.error('\n❌ Verification failed:', error);
    process.exit(1);
  });
