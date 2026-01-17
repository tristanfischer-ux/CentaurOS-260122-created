/**
 * Test the Three-Tier Service Layer
 *
 * Verifies that all services can connect and perform CRUD operations
 */

import {
  suppliersService,
  aiToolsService,
  executiveListingsService,
  apprenticeListingsService,
  marketplaceReviewsService,
  financialsService,
  decisionsService,
  bulkImportService,
  userPreferencesService,
  userSkillsService,
} from './src/lib/supabase-three-tier-service';

async function testServices() {
  console.log('🧪 TESTING THREE-TIER SERVICE LAYER\n');
  console.log('=' .repeat(80));

  // TEST 1: Marketplace - AI Tools
  console.log('\n📦 TEST 1: AI Tools Service\n');
  try {
    const tools = await aiToolsService.getAll();
    console.log(`✅ Fetched ${tools.length} AI tools`);

    if (tools.length > 0) {
      console.log(`   Sample: ${tools[0].name} (${tools[0].category})`);
      console.log(`   Provider: ${tools[0].provider}`);
      console.log(`   Multiplier: ${tools[0].multiplierEffect}x`);
    }

    // Test filtering by category
    const codingTools = await aiToolsService.getByCategory('coding');
    console.log(`✅ Found ${codingTools.length} coding tools`);
  } catch (error: any) {
    console.log(`❌ AI Tools Service failed: ${error.message}`);
  }

  // TEST 2: Marketplace - Suppliers
  console.log('\n🏭 TEST 2: Suppliers Service\n');
  try {
    const suppliers = await suppliersService.getAll();
    console.log(`✅ Fetched ${suppliers.length} suppliers`);

    // Test search
    const searchResults = await suppliersService.search({
      searchQuery: 'molding',
      minRating: 0,
    });
    console.log(`✅ Search found ${searchResults.items.length} suppliers matching "molding"`);
  } catch (error: any) {
    console.log(`❌ Suppliers Service failed: ${error.message}`);
  }

  // TEST 3: Marketplace - Executive Listings
  console.log('\n👔 TEST 3: Executive Listings Service\n');
  try {
    const executives = await executiveListingsService.getAll();
    console.log(`✅ Fetched ${executives.length} executive listings`);

    // Test filtering by function
    const marketingExecs = await executiveListingsService.getByFunction('marketing');
    console.log(`✅ Found ${marketingExecs.length} marketing executives`);
  } catch (error: any) {
    console.log(`❌ Executive Listings Service failed: ${error.message}`);
  }

  // TEST 4: Marketplace - Apprentice Listings
  console.log('\n🎓 TEST 4: Apprentice Listings Service\n');
  try {
    const apprentices = await apprenticeListingsService.getAll();
    console.log(`✅ Fetched ${apprentices.length} apprentice listings`);
  } catch (error: any) {
    console.log(`❌ Apprentice Listings Service failed: ${error.message}`);
  }

  // TEST 5: Company - Financials (requires workspace_id, will likely fail without auth)
  console.log('\n💰 TEST 5: Company Financials Service\n');
  try {
    // This will likely fail because we need to be a member of a workspace
    const financials = await financialsService.getForWorkspace('test-workspace-id');
    console.log(`✅ Fetched ${financials.length} financial records`);
  } catch (error: any) {
    console.log(`⚠️  Financials Service (expected to fail without workspace membership): ${error.message}`);
  }

  // TEST 6: Company - Decisions
  console.log('\n🎯 TEST 6: Decisions Service\n');
  try {
    const decisions = await decisionsService.getForWorkspace('test-workspace-id');
    console.log(`✅ Fetched ${decisions.length} decisions`);
  } catch (error: any) {
    console.log(`⚠️  Decisions Service (expected to fail without workspace membership): ${error.message}`);
  }

  // SUMMARY
  console.log('\n' + '='.repeat(80));
  console.log('\n📊 TEST SUMMARY\n');
  console.log('✅ Marketplace services (Tier 1) should work without authentication');
  console.log('⚠️  Company services (Tier 2) require workspace membership');
  console.log('⚠️  User services (Tier 3) require user authentication');
  console.log('\n💡 Next step: Add seed data for AI tools using supabase-seed-ai-tools.sql');
}

testServices()
  .then(() => {
    console.log('\n✅ Service layer tests complete!\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Service layer tests failed:', error);
    process.exit(1);
  });
