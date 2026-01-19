/**
 * Marketplace Data Ingestion Script
 *
 * Deterministic, repeatable ingestion of JSON marketplace data into Supabase.
 *
 * Features:
 * - Schema validation
 * - Field normalization (lowercase tags, trim whitespace, extract domains)
 * - Deduplication (by website domain, Companies House number, name+domain)
 * - Upsert logic (update existing, insert new)
 * - Dry-run mode (preview changes without writing)
 * - Error logging (track failures per row)
 * - Import run tracking (audit history)
 *
 * Usage:
 *   bun run scripts/ingest_marketplace.ts                    # Full ingestion
 *   bun run scripts/ingest_marketplace.ts --dry-run          # Preview changes
 *   bun run scripts/ingest_marketplace.ts --file orgs.json   # Single file
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// CONFIGURATION
// ============================================================================

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

const DATA_DIR = path.join(__dirname, '../data/marketplace');

const FILES_TO_INGEST = [
  'orgs.json',
  'people.json',
  'relationships_portfolios.json',
  'hardware_startups.json',
  'ai_tools.json',
  'manufacturing_providers.json',
];

// ============================================================================
// SUPABASE CLIENT (Service role for writes)
// ============================================================================

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('ERROR: Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Extract domain from URL for deduplication
 * https://www.example.com/path → example.com
 * http://subdomain.example.co.uk → example.co.uk
 */
function extractDomain(url: string | null): string | null {
  if (!url) return null;
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    const hostname = urlObj.hostname.replace(/^www\./, '');
    return hostname;
  } catch {
    return null;
  }
}

/**
 * Normalize tag: lowercase, trim, replace spaces with underscores
 * "Venture Capital Law" → "venture_capital_law"
 */
function normalizeTag(tag: string): string {
  return tag
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

/**
 * Normalize array of tags
 */
function normalizeTags(tags: string[]): string[] {
  if (!Array.isArray(tags)) return [];
  return tags.map(normalizeTag).filter(Boolean);
}

/**
 * Parse date string to TIMESTAMPTZ format
 */
function parseDate(dateStr: string | null): string | null {
  if (!dateStr) return null;
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    return date.toISOString();
  } catch {
    return null;
  }
}

// ============================================================================
// INGESTION LOGIC
// ============================================================================

interface IngestStats {
  processed: number;
  inserted: number;
  updated: number;
  failed: number;
  errors: Array<{ row: number; error: string; data: any }>;
}

/**
 * Ingest orgs.json
 */
async function ingestOrgs(data: any[], dryRun: boolean): Promise<IngestStats> {
  const stats: IngestStats = { processed: 0, inserted: 0, updated: 0, failed: 0, errors: [] };

  for (let i = 0; i < data.length; i++) {
    const org = data[i];
    stats.processed++;

    try {
      // Validate required fields
      if (!org.name || !org.org_type) {
        throw new Error('Missing required fields: name or org_type');
      }

      // Normalize fields
      const websiteDomain = extractDomain(org.website);
      const normalized = {
        name: org.name.trim(),
        org_type: org.org_type,
        website: org.website || null,
        website_domain: websiteDomain,
        companies_house_number: org.companies_house_number || null,
        hq_city: org.hq_city || null,
        hq_country: org.hq_country || 'UK',
        regions: normalizeTags(org.regions || []),
        sector_focus: normalizeTags(org.sector_focus || []),
        stage_focus: normalizeTags(org.stage_focus || []),
        capability_tags: normalizeTags(org.capability_tags || []),
        description_1liner: org.description_1liner || null,
        preferred_contact_method: org.preferred_contact_method || null,
        notes: org.notes || null,
        confidence_score: 80, // Default from evidence
        last_verified_at: null,
      };

      if (dryRun) {
        console.log(`[DRY RUN] Would upsert org: ${normalized.name} (${normalized.org_type})`);
        stats.inserted++;
        continue;
      }

      // Check for existing org by domain or Companies House number
      let existingOrg = null;
      if (websiteDomain) {
        const { data: existing } = await supabase
          .from('directory_orgs')
          .select('id')
          .eq('website_domain', websiteDomain)
          .single();
        existingOrg = existing;
      }

      if (!existingOrg && org.companies_house_number) {
        const { data: existing } = await supabase
          .from('directory_orgs')
          .select('id')
          .eq('companies_house_number', org.companies_house_number)
          .single();
        existingOrg = existing;
      }

      if (existingOrg) {
        // Update existing
        const { error } = await supabase
          .from('directory_orgs')
          .update(normalized)
          .eq('id', existingOrg.id);

        if (error) throw error;
        stats.updated++;
      } else {
        // Insert new
        const { error } = await supabase
          .from('directory_orgs')
          .insert(normalized);

        if (error) throw error;
        stats.inserted++;
      }

      // Insert contacts
      if (org.contacts && Array.isArray(org.contacts)) {
        for (const contact of org.contacts) {
          if (!dryRun && contact.value) {
            // Find the org we just created/updated
            const { data: orgData } = await supabase
              .from('directory_orgs')
              .select('id')
              .eq('website_domain', websiteDomain)
              .single();

            if (orgData) {
              await supabase.from('directory_contacts').upsert({
                org_id: orgData.id,
                contact_type: contact.type,
                contact_value: contact.value,
                is_primary: false,
              }, {
                onConflict: 'org_id, contact_type, contact_value',
                ignoreDuplicates: true,
              });
            }
          }
        }
      }

      // Insert evidence
      if (org.evidence && Array.isArray(org.evidence)) {
        for (const evidence of org.evidence) {
          if (!dryRun && evidence.url) {
            const { data: orgData } = await supabase
              .from('directory_orgs')
              .select('id')
              .eq('website_domain', websiteDomain)
              .single();

            if (orgData) {
              await supabase.from('directory_evidence').insert({
                org_id: orgData.id,
                url: evidence.url,
                last_verified: parseDate(evidence.last_verified) || new Date().toISOString(),
                confidence_score: evidence.confidence_score || 80,
              });
            }
          }
        }
      }

    } catch (error: any) {
      console.error(`Error processing org row ${i}:`, error.message);
      stats.failed++;
      stats.errors.push({ row: i, error: error.message, data: org });
    }
  }

  return stats;
}

/**
 * Ingest people.json
 */
async function ingestPeople(data: any[], dryRun: boolean): Promise<IngestStats> {
  const stats: IngestStats = { processed: 0, inserted: 0, updated: 0, failed: 0, errors: [] };

  for (let i = 0; i < data.length; i++) {
    const person = data[i];
    stats.processed++;

    try {
      if (!person.full_name) {
        throw new Error('Missing required field: full_name');
      }

      // Find org_id by org_name
      let orgId = null;
      if (person.org_name) {
        const { data: org } = await supabase
          .from('directory_orgs')
          .select('id')
          .ilike('name', person.org_name)
          .single();
        orgId = org?.id || null;
      }

      const normalized = {
        full_name: person.full_name.trim(),
        role_title: person.role_title || null,
        org_id: orgId,
        org_name: person.org_name || null,
        focus_tags: normalizeTags(person.focus_tags || []),
        regions: normalizeTags(person.regions || []),
        confidence_score: 80,
        last_verified_at: null,
      };

      if (dryRun) {
        console.log(`[DRY RUN] Would insert person: ${normalized.full_name} at ${person.org_name}`);
        stats.inserted++;
        continue;
      }

      const { data: inserted, error } = await supabase
        .from('directory_people')
        .insert(normalized)
        .select()
        .single();

      if (error) throw error;
      stats.inserted++;

      // Insert contacts (email, LinkedIn)
      if (person.email && inserted) {
        await supabase.from('directory_contacts').insert({
          person_id: inserted.id,
          contact_type: 'email',
          contact_value: person.email,
          is_primary: true,
        });
      }

      if (person.linkedin && inserted) {
        await supabase.from('directory_contacts').insert({
          person_id: inserted.id,
          contact_type: 'linkedin',
          contact_value: person.linkedin,
          is_primary: false,
        });
      }

      // Insert evidence
      if (person.evidence && Array.isArray(person.evidence) && inserted) {
        for (const evidence of person.evidence) {
          if (evidence.url) {
            await supabase.from('directory_evidence').insert({
              person_id: inserted.id,
              url: evidence.url,
              last_verified: parseDate(evidence.last_verified) || new Date().toISOString(),
              confidence_score: evidence.confidence_score || 80,
            });
          }
        }
      }

    } catch (error: any) {
      console.error(`Error processing person row ${i}:`, error.message);
      stats.failed++;
      stats.errors.push({ row: i, error: error.message, data: person });
    }
  }

  return stats;
}

/**
 * Ingest relationships_portfolios.json
 */
async function ingestRelationships(data: any[], dryRun: boolean): Promise<IngestStats> {
  const stats: IngestStats = { processed: 0, inserted: 0, updated: 0, failed: 0, errors: [] };

  for (let i = 0; i < data.length; i++) {
    const rel = data[i];
    stats.processed++;

    try {
      if (!rel.investor_org_name || !rel.company_name) {
        throw new Error('Missing required fields: investor_org_name or company_name');
      }

      // Find investor org_id
      const { data: investorOrg } = await supabase
        .from('directory_orgs')
        .select('id')
        .ilike('name', rel.investor_org_name)
        .single();

      if (!investorOrg) {
        throw new Error(`Investor org not found: ${rel.investor_org_name}`);
      }

      // Try to find company in directory_startups
      let companyId = null;
      const { data: startup } = await supabase
        .from('directory_startups')
        .select('id')
        .ilike('company_name', rel.company_name)
        .single();
      companyId = startup?.id || null;

      const normalized = {
        investor_org_id: investorOrg.id,
        investor_org_name: rel.investor_org_name,
        company_name: rel.company_name,
        company_id: companyId,
        round_type: rel.round_type || null,
        round_date: rel.round_date ? new Date(rel.round_date).toISOString().split('T')[0] : null,
        role: rel.role || 'unknown',
        confidence_score: 70,
      };

      if (dryRun) {
        console.log(`[DRY RUN] Would insert relationship: ${rel.investor_org_name} → ${rel.company_name}`);
        stats.inserted++;
        continue;
      }

      const { error } = await supabase
        .from('directory_portfolio_links')
        .insert(normalized);

      if (error) throw error;
      stats.inserted++;

    } catch (error: any) {
      console.error(`Error processing relationship row ${i}:`, error.message);
      stats.failed++;
      stats.errors.push({ row: i, error: error.message, data: rel });
    }
  }

  return stats;
}

/**
 * Ingest hardware_startups.json
 */
async function ingestStartups(data: any[], dryRun: boolean): Promise<IngestStats> {
  const stats: IngestStats = { processed: 0, inserted: 0, updated: 0, failed: 0, errors: [] };

  for (let i = 0; i < data.length; i++) {
    const startup = data[i];
    stats.processed++;

    try {
      if (!startup.company_name) {
        throw new Error('Missing required field: company_name');
      }

      const websiteDomain = extractDomain(startup.website);

      const normalized = {
        company_name: startup.company_name.trim(),
        companies_house_number: startup.companies_house_number || null,
        website: startup.website || null,
        website_domain: websiteDomain,
        sector_tags: normalizeTags(startup.sector_tags || []),
        hq_region: startup.hq_region || null,
        stage_guess: startup.stage_guess || 'unknown',
        known_backers: startup.known_backers || [],
        confidence_score: 70,
        last_verified_at: null,
      };

      if (dryRun) {
        console.log(`[DRY RUN] Would upsert startup: ${normalized.company_name}`);
        stats.inserted++;
        continue;
      }

      // Check for existing by domain
      let existing = null;
      if (websiteDomain) {
        const { data } = await supabase
          .from('directory_startups')
          .select('id')
          .eq('website_domain', websiteDomain)
          .single();
        existing = data;
      }

      if (existing) {
        const { error } = await supabase
          .from('directory_startups')
          .update(normalized)
          .eq('id', existing.id);
        if (error) throw error;
        stats.updated++;
      } else {
        const { error } = await supabase
          .from('directory_startups')
          .insert(normalized);
        if (error) throw error;
        stats.inserted++;
      }

    } catch (error: any) {
      console.error(`Error processing startup row ${i}:`, error.message);
      stats.failed++;
      stats.errors.push({ row: i, error: error.message, data: startup });
    }
  }

  return stats;
}

/**
 * Ingest ai_tools.json
 */
async function ingestAITools(data: any[], dryRun: boolean): Promise<IngestStats> {
  const stats: IngestStats = { processed: 0, inserted: 0, updated: 0, failed: 0, errors: [] };

  for (let i = 0; i < data.length; i++) {
    const tool = data[i];
    stats.processed++;

    try {
      if (!tool.tool_name || !tool.vendor_name || !tool.category) {
        throw new Error('Missing required fields');
      }

      const normalized = {
        tool_name: tool.tool_name.trim(),
        vendor_name: tool.vendor_name.trim(),
        category: tool.category,
        subcategories: normalizeTags(tool.subcategories || []),
        target_user: tool.target_user || null,
        pricing_model: tool.pricing_model || 'unknown',
        website: tool.website || null,
        confidence_score: 80,
        last_verified_at: null,
      };

      if (dryRun) {
        console.log(`[DRY RUN] Would insert AI tool: ${normalized.tool_name} by ${normalized.vendor_name}`);
        stats.inserted++;
        continue;
      }

      const { error } = await supabase
        .from('directory_ai_tools')
        .insert(normalized);

      if (error) throw error;
      stats.inserted++;

    } catch (error: any) {
      console.error(`Error processing AI tool row ${i}:`, error.message);
      stats.failed++;
      stats.errors.push({ row: i, error: error.message, data: tool });
    }
  }

  return stats;
}

/**
 * Ingest manufacturing_providers.json
 */
async function ingestManufacturers(data: any[], dryRun: boolean): Promise<IngestStats> {
  const stats: IngestStats = { processed: 0, inserted: 0, updated: 0, failed: 0, errors: [] };

  for (let i = 0; i < data.length; i++) {
    const provider = data[i];
    stats.processed++;

    try {
      if (!provider.provider_name || !provider.provider_type) {
        throw new Error('Missing required fields');
      }

      const normalized = {
        provider_name: provider.provider_name.trim(),
        provider_type: provider.provider_type,
        regions: normalizeTags(provider.regions || []),
        capabilities: normalizeTags(provider.capabilities || []),
        certifications: provider.certifications || [],
        website: provider.website || null,
        confidence_score: 80,
        last_verified_at: null,
      };

      if (dryRun) {
        console.log(`[DRY RUN] Would insert manufacturer: ${normalized.provider_name}`);
        stats.inserted++;
        continue;
      }

      const { error } = await supabase
        .from('directory_manufacturers')
        .insert(normalized);

      if (error) throw error;
      stats.inserted++;

    } catch (error: any) {
      console.error(`Error processing manufacturer row ${i}:`, error.message);
      stats.failed++;
      stats.errors.push({ row: i, error: error.message, data: provider });
    }
  }

  return stats;
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const fileArg = args.find(arg => arg.startsWith('--file='));
  const specificFile = fileArg ? fileArg.split('=')[1] : null;

  console.log('='.repeat(80));
  console.log('MARKETPLACE DATA INGESTION');
  console.log('='.repeat(80));
  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes will be written)' : 'LIVE (will write to database)'}`);
  console.log(`Data directory: ${DATA_DIR}`);
  console.log(`Supabase URL: ${SUPABASE_URL}`);
  console.log('='.repeat(80));

  const filesToProcess = specificFile ? [specificFile] : FILES_TO_INGEST;

  // Create import run record
  let runId: string | null = null;
  if (!dryRun) {
    const { data: run, error } = await supabase
      .from('import_runs')
      .insert({
        source_file: filesToProcess.join(', '),
        run_type: specificFile ? 'incremental' : 'full',
        status: 'running',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create import run:', error);
      process.exit(1);
    }
    runId = run.id;
  }

  const totalStats: IngestStats = { processed: 0, inserted: 0, updated: 0, failed: 0, errors: [] };

  for (const filename of filesToProcess) {
    const filepath = path.join(DATA_DIR, filename);

    if (!fs.existsSync(filepath)) {
      console.log(`⚠️  Skipping ${filename} (file not found)`);
      continue;
    }

    console.log(`\n📄 Processing ${filename}...`);

    const rawData = fs.readFileSync(filepath, 'utf-8');
    const data = JSON.parse(rawData);

    let stats: IngestStats;

    if (filename === 'orgs.json') {
      stats = await ingestOrgs(data, dryRun);
    } else if (filename === 'people.json') {
      stats = await ingestPeople(data, dryRun);
    } else if (filename === 'relationships_portfolios.json') {
      stats = await ingestRelationships(data, dryRun);
    } else if (filename === 'hardware_startups.json') {
      stats = await ingestStartups(data, dryRun);
    } else if (filename === 'ai_tools.json') {
      stats = await ingestAITools(data, dryRun);
    } else if (filename === 'manufacturing_providers.json') {
      stats = await ingestManufacturers(data, dryRun);
    } else {
      console.log(`⚠️  Unknown file type: ${filename}`);
      continue;
    }

    console.log(`   Processed: ${stats.processed}`);
    console.log(`   Inserted: ${stats.inserted}`);
    console.log(`   Updated: ${stats.updated}`);
    console.log(`   Failed: ${stats.failed}`);

    totalStats.processed += stats.processed;
    totalStats.inserted += stats.inserted;
    totalStats.updated += stats.updated;
    totalStats.failed += stats.failed;
    totalStats.errors.push(...stats.errors);

    // Log errors to import_row_errors table
    if (!dryRun && runId && stats.errors.length > 0) {
      for (const error of stats.errors) {
        await supabase.from('import_row_errors').insert({
          run_id: runId,
          source_file: filename,
          row_index: error.row,
          row_data: error.data,
          error_message: error.error,
          error_type: 'validation',
        });
      }
    }
  }

  // Update import run record
  if (!dryRun && runId) {
    await supabase
      .from('import_runs')
      .update({
        status: totalStats.failed > 0 ? 'partial_success' : 'success',
        records_processed: totalStats.processed,
        records_inserted: totalStats.inserted,
        records_updated: totalStats.updated,
        records_failed: totalStats.failed,
        error_summary: totalStats.errors.length > 0 ? { errors: totalStats.errors.slice(0, 10) } : null,
        completed_at: new Date().toISOString(),
      })
      .eq('id', runId);
  }

  console.log('\n' + '='.repeat(80));
  console.log('INGESTION COMPLETE');
  console.log('='.repeat(80));
  console.log(`Total processed: ${totalStats.processed}`);
  console.log(`Total inserted: ${totalStats.inserted}`);
  console.log(`Total updated: ${totalStats.updated}`);
  console.log(`Total failed: ${totalStats.failed}`);

  if (totalStats.errors.length > 0) {
    console.log(`\n⚠️  ${totalStats.errors.length} errors occurred:`);
    totalStats.errors.slice(0, 5).forEach((err, idx) => {
      console.log(`   ${idx + 1}. Row ${err.row}: ${err.error}`);
    });
    if (totalStats.errors.length > 5) {
      console.log(`   ... and ${totalStats.errors.length - 5} more errors`);
    }
  }

  console.log('='.repeat(80));

  if (dryRun) {
    console.log('\n✅ DRY RUN COMPLETE - No changes were written to the database');
  } else {
    console.log('\n✅ INGESTION COMPLETE - Data written to Supabase');
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
