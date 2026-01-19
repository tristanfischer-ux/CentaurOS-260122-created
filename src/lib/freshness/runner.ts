/**
 * Freshness System - Job Runner
 *
 * Orchestrates the freshness verification process:
 * 1. Selects stale entities based on policy
 * 2. Fetches URLs with rate limiting
 * 3. Extracts data and computes diffs
 * 4. Creates review queue items
 * 5. Creates task drafts for curators
 *
 * Can be run:
 * - Manually via API: POST /api/freshness/run
 * - Scheduled via cron (external scheduler calls API)
 */

import { createClient } from '@supabase/supabase-js';
import type {
  FreshnessJob,
  FreshnessCheck,
  FreshnessReviewItem,
  FreshnessPolicy,
  JobConfig,
  JobStats,
  OrgType,
  EntityType,
  StaleEntity,
} from './types';
import { fetchUrl, extractDomain } from './fetch';
import { extractDataFromHtml } from './extractors';
import { computeDiff, determineChangeType, shouldReduceConfidence, generateChangeSummary } from './diff';
import type { DbRecord } from './diff';

// ============================================================================
// CONFIGURATION
// ============================================================================

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Feature flags (from env)
const FRESHNESS_ENABLED = process.env.FRESHNESS_ENABLED !== 'false';
const FRESHNESS_RATE_LIMIT = parseInt(process.env.FRESHNESS_RATE_LIMIT_PER_MIN || '10', 10);
const FRESHNESS_MAX_URLS = parseInt(process.env.FRESHNESS_MAX_URLS_PER_RUN || '50', 10);
const FRESHNESS_LLM_ASSIST = process.env.FRESHNESS_LLM_ASSIST_ENABLED === 'true';

// Default workspace for task drafts (admin workspace)
const DEFAULT_ADMIN_WORKSPACE_ID = '00000000-0000-0000-0000-000000000001';
const DEFAULT_ADMIN_USER_ID = '00000000-0000-0000-0000-000000000001';

// Use any for Supabase client to avoid complex generic issues with untyped tables
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClientType = ReturnType<typeof createClient<any>>;

// ============================================================================
// SUPABASE CLIENT
// ============================================================================

function getSupabaseClient(): SupabaseClientType {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

// ============================================================================
// JOB MANAGEMENT
// ============================================================================

/**
 * Create a new freshness job
 */
async function createJob(
  supabase: SupabaseClientType,
  config: JobConfig & { scope: 'curated' | 'external' | 'all'; frequency: 'daily' | 'weekly' | 'monthly' | 'adhoc' }
): Promise<FreshnessJob> {
  const { data, error } = await supabase
    .from('freshness_jobs')
    .insert({
      scope: config.scope,
      job_type: 'scheduled',
      frequency: config.frequency,
      status: 'running',
      started_at: new Date().toISOString(),
      config_json: config,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create job: ${error.message}`);
  return data as FreshnessJob;
}

/**
 * Update job status and stats
 */
async function updateJob(
  supabase: SupabaseClientType,
  jobId: string,
  updates: Partial<FreshnessJob>
): Promise<void> {
  const { error } = await supabase.from('freshness_jobs').update(updates).eq('id', jobId);

  if (error) console.error(`Failed to update job ${jobId}:`, error.message);
}

/**
 * Complete a job
 */
async function completeJob(
  supabase: SupabaseClientType,
  jobId: string,
  stats: JobStats,
  status: 'done' | 'failed' = 'done',
  errorMessage?: string
): Promise<void> {
  await updateJob(supabase, jobId, {
    status,
    finished_at: new Date().toISOString(),
    stats_json: stats,
    error_message: errorMessage,
  });
}

// ============================================================================
// ENTITY SELECTION
// ============================================================================

/**
 * Get policies for all org types
 */
async function getPolicies(
  supabase: SupabaseClientType
): Promise<Map<OrgType, FreshnessPolicy>> {
  const { data, error } = await supabase.from('freshness_policies').select('*').eq('enabled', true);

  if (error) throw new Error(`Failed to fetch policies: ${error.message}`);

  const policies = new Map<OrgType, FreshnessPolicy>();
  for (const policy of (data || []) as FreshnessPolicy[]) {
    policies.set(policy.org_type as OrgType, policy);
  }
  return policies;
}

/**
 * Get stale entities that need checking
 */
async function getStaleEntities(
  supabase: SupabaseClientType,
  orgTypes: OrgType[] | undefined,
  maxUrls: number
): Promise<StaleEntity[]> {
  // Use the database function if available, otherwise manual query
  const allEntities: StaleEntity[] = [];
  const typesToCheck = orgTypes || ['VC', 'PE', 'Angel', 'LawFirm', 'Accountancy', 'Manufacturer', 'AITool', 'Advisor'];

  for (const orgType of typesToCheck) {
    const { data, error } = await supabase.rpc('get_stale_entities', {
      p_org_type: orgType,
      p_limit: Math.ceil(maxUrls / typesToCheck.length),
    });

    if (error) {
      console.error(`Failed to get stale entities for ${orgType}:`, error.message);
      continue;
    }

    if (data) {
      allEntities.push(...(data as StaleEntity[]));
    }
  }

  // Sort by days since verified (oldest first) and limit
  return allEntities
    .sort((a, b) => b.days_since_verified - a.days_since_verified)
    .slice(0, maxUrls);
}

// Entity record interface for database results
interface EntityRecord {
  id: string;
  name?: string;
  provider_name?: string;
  tool_name?: string;
  company_name?: string;
  org_type?: OrgType;
  website?: string;
  sector_focus?: string[];
  stage_focus?: string[];
  capability_tags?: string[];
  focus_tags?: string[];
  capabilities?: string[];
  certifications?: string[];
  contact_hash?: string;
  portfolio_hash?: string;
  confidence_score?: number;
  last_verified_at?: string;
}

interface ContactRecord {
  contact_type: 'email' | 'phone' | 'contact_form' | 'linkedin';
  contact_value: string;
  is_primary: boolean;
}

interface PortfolioRecord {
  company_name: string;
}

/**
 * Get full entity record with contacts
 */
async function getEntityRecord(
  supabase: SupabaseClientType,
  entityType: EntityType,
  entityId: string
): Promise<DbRecord | null> {
  let tableName: string;
  switch (entityType) {
    case 'org':
      tableName = 'directory_orgs';
      break;
    case 'person':
      tableName = 'directory_people';
      break;
    case 'tool':
      tableName = 'directory_ai_tools';
      break;
    case 'manufacturer':
      tableName = 'directory_manufacturers';
      break;
    case 'startup':
      tableName = 'directory_startups';
      break;
    case 'external':
      tableName = 'external_entities';
      break;
    default:
      return null;
  }

  // Get entity
  const { data: entityData, error } = await supabase.from(tableName).select('*').eq('id', entityId).single();

  if (error || !entityData) return null;

  const entity = entityData as EntityRecord;

  // Get contacts for orgs and people
  let contacts: ContactRecord[] = [];
  if (entityType === 'org') {
    const { data: contactData } = await supabase
      .from('directory_contacts')
      .select('contact_type, contact_value, is_primary')
      .eq('org_id', entityId);
    contacts = (contactData || []) as ContactRecord[];
  } else if (entityType === 'person') {
    const { data: contactData } = await supabase
      .from('directory_contacts')
      .select('contact_type, contact_value, is_primary')
      .eq('person_id', entityId);
    contacts = (contactData || []) as ContactRecord[];
  }

  // Get portfolio for VCs
  let portfolioCompanies: string[] = [];
  if (entityType === 'org' && entity.org_type && ['VC', 'PE', 'Angel'].includes(entity.org_type)) {
    const { data: portfolioData } = await supabase
      .from('directory_portfolio_links')
      .select('company_name')
      .eq('investor_org_id', entityId);
    portfolioCompanies = ((portfolioData || []) as PortfolioRecord[]).map((p) => p.company_name);
  }

  return {
    id: entity.id,
    name: entity.name || entity.provider_name || entity.tool_name || entity.company_name || 'Unknown',
    org_type: entity.org_type,
    website: entity.website,
    sector_focus: entity.sector_focus,
    stage_focus: entity.stage_focus,
    capability_tags: entity.capability_tags,
    focus_tags: entity.focus_tags,
    capabilities: entity.capabilities,
    certifications: entity.certifications,
    contacts: contacts,
    portfolio_companies: portfolioCompanies,
    contact_hash: entity.contact_hash,
    portfolio_hash: entity.portfolio_hash,
    confidence_score: entity.confidence_score,
    last_verified_at: entity.last_verified_at,
  };
}

// ============================================================================
// CHECK PROCESSING
// ============================================================================

interface UrlCacheRecord {
  last_etag?: string;
  last_modified?: string;
}

/**
 * Process a single entity check
 */
async function processEntityCheck(
  supabase: SupabaseClientType,
  jobId: string,
  entity: StaleEntity,
  rateLimit: number
): Promise<{ check: Partial<FreshnessCheck>; reviewItem?: Partial<FreshnessReviewItem> }> {
  const check: Partial<FreshnessCheck> = {
    job_id: jobId,
    entity_type: entity.entity_type,
    entity_id: entity.entity_id,
    entity_name: entity.entity_name,
    url: entity.website,
    url_type: 'primary',
    outcome: 'pending',
  };

  // Get full entity record
  const dbRecord = await getEntityRecord(supabase, entity.entity_type, entity.entity_id);
  if (!dbRecord) {
    check.outcome = 'error';
    check.error_text = 'Entity not found in database';
    return { check };
  }

  // Check URL cache for conditional request headers
  const { data: cacheData } = await supabase
    .from('freshness_url_cache')
    .select('last_etag, last_modified')
    .eq('url', entity.website)
    .single();

  const cacheEntry = cacheData as UrlCacheRecord | null;

  // Fetch the URL
  const fetchResult = await fetchUrl(
    entity.website,
    {
      etag: cacheEntry?.last_etag,
      last_modified: cacheEntry?.last_modified,
      conditional: true,
    },
    rateLimit
  );

  check.fetched_at = new Date().toISOString();
  check.http_status = fetchResult.status;
  check.response_time_ms = fetchResult.response_time_ms;
  check.etag = fetchResult.etag;
  check.last_modified = fetchResult.last_modified;
  check.content_hash = fetchResult.content_hash;
  check.content_length = fetchResult.content_length;

  // Handle fetch errors
  if (!fetchResult.success) {
    check.outcome = fetchResult.status === 404 ? 'not_found' : fetchResult.status === 429 ? 'blocked' : 'error';
    check.error_text = fetchResult.error;

    // Check if confidence should be reduced
    const confidenceCheck = shouldReduceConfidence(dbRecord, false, fetchResult.status);
    if (confidenceCheck.reduce) {
      // Create review item for confidence drop
      return {
        check,
        reviewItem: {
          entity_type: entity.entity_type,
          entity_id: entity.entity_id,
          entity_name: entity.entity_name,
          change_type: 'confidence_dropped',
          change_summary: confidenceCheck.reason,
          proposed_changes_json: {
            confidence_score: {
              old: dbRecord.confidence_score,
              new: confidenceCheck.newScore,
              confidence: 80,
            },
          },
          evidence_url: entity.website,
          confidence_score: 80,
          priority: fetchResult.status === 404 ? 'high' : 'normal',
        },
      };
    }

    return { check };
  }

  // Handle 304 Not Modified
  if (fetchResult.not_modified) {
    check.outcome = 'no_change';
    check.confidence_score = 100;
    return { check };
  }

  // Extract data from content
  const orgType = dbRecord.org_type || 'external';
  const extractedData = extractDataFromHtml(fetchResult.content!, orgType);
  check.extract_json = extractedData;

  // Compute diff
  const diff = computeDiff(dbRecord, extractedData, fetchResult.content_hash);
  check.diff_json = diff;
  check.confidence_score = diff.confidence;

  if (!diff.has_changes) {
    check.outcome = 'no_change';
    return { check };
  }

  // Changes detected - create review item
  check.outcome = 'changed';

  const reviewItem: Partial<FreshnessReviewItem> = {
    entity_type: entity.entity_type,
    entity_id: entity.entity_id,
    entity_name: entity.entity_name,
    job_id: jobId,
    change_type: determineChangeType(diff),
    change_summary: generateChangeSummary(diff, entity.entity_name),
    proposed_changes_json: diff.changes.reduce(
      (acc, change) => {
        acc[change.field] = {
          old: change.old_value,
          new: change.new_value,
          confidence: change.confidence,
        };
        return acc;
      },
      {} as Record<string, { old: unknown; new: unknown; confidence: number }>
    ),
    evidence_url: entity.website,
    evidence_snapshot: extractedData.raw_snippet?.substring(0, 1000),
    confidence_score: diff.confidence,
    priority: diff.confidence >= 80 ? 'high' : diff.confidence >= 60 ? 'normal' : 'low',
  };

  return { check, reviewItem };
}

// ============================================================================
// REVIEW & TASK CREATION
// ============================================================================

interface InsertResult {
  id: string;
}

/**
 * Create a review queue item
 */
async function createReviewItem(
  supabase: SupabaseClientType,
  item: Partial<FreshnessReviewItem>,
  checkId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from('freshness_review_queue')
    .insert({
      entity_type: item.entity_type,
      entity_id: item.entity_id,
      entity_name: item.entity_name,
      check_id: checkId,
      job_id: item.job_id,
      change_type: item.change_type,
      change_summary: item.change_summary,
      proposed_changes_json: item.proposed_changes_json,
      evidence_url: item.evidence_url,
      evidence_snapshot: item.evidence_snapshot,
      confidence_score: item.confidence_score,
      priority: item.priority,
      status: 'pending',
    })
    .select('id')
    .single();

  if (error) {
    console.error('Failed to create review item:', error.message);
    return null;
  }

  return (data as InsertResult).id;
}

/**
 * Create a task draft for a review item
 */
async function createTaskDraft(
  supabase: SupabaseClientType,
  reviewItem: Partial<FreshnessReviewItem>,
  reviewId: string,
  workspaceId: string = DEFAULT_ADMIN_WORKSPACE_ID,
  userId: string = DEFAULT_ADMIN_USER_ID
): Promise<string | null> {
  // Generate task title based on change type
  let title: string;
  switch (reviewItem.change_type) {
    case 'contact_changed':
      title = `Verify contact info changed: ${reviewItem.entity_name}`;
      break;
    case 'portfolio_changed':
      title = `Review portfolio update: ${reviewItem.entity_name}`;
      break;
    case 'tags_changed':
      title = `Review focus area changes: ${reviewItem.entity_name}`;
      break;
    case 'not_found':
      title = `Website not found: ${reviewItem.entity_name}`;
      break;
    case 'confidence_dropped':
      title = `Verify stale entry: ${reviewItem.entity_name}`;
      break;
    default:
      title = `Review marketplace entry: ${reviewItem.entity_name}`;
  }

  // Generate notes
  const now = new Date();
  const notes = `## Automated Freshness Check

**Entity:** ${reviewItem.entity_name}
**Change Type:** ${reviewItem.change_type}
**Confidence:** ${reviewItem.confidence_score}%
**Detected:** ${now.toISOString()}

### What Changed
${reviewItem.change_summary}

### Evidence
- URL: ${reviewItem.evidence_url}
- Snapshot: ${reviewItem.evidence_snapshot ? 'Available in review queue' : 'Not available'}

### Actions
- [ ] Review the proposed changes
- [ ] Approve or reject in Marketplace Admin
- [ ] Verify source if uncertain

---
*This task was auto-generated by the Freshness System.*
*Review ID: ${reviewId}*`;

  const dueDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const { data, error } = await supabase
    .from('task_drafts')
    .insert({
      workspace_id: workspaceId,
      created_by_user_id: userId,
      assignee_user_id: userId,
      title: title.substring(0, 200),
      notes: notes.substring(0, 2000),
      start_iso: now.toISOString(),
      due_iso: dueDate.toISOString(),
      units: 1,
      source: 'freshness_review',
      confidence_assignee: 70,
      confidence_due: 70,
      status: 'pending_confirmation',
    })
    .select('id')
    .single();

  if (error) {
    console.error('Failed to create task draft:', error.message);
    return null;
  }

  const insertResult = data as InsertResult;

  // Update review item with task draft ID
  await supabase
    .from('freshness_review_queue')
    .update({
      task_draft_id: insertResult.id,
      task_draft_created_at: now.toISOString(),
    })
    .eq('id', reviewId);

  return insertResult.id;
}

// ============================================================================
// MAIN JOB RUNNER
// ============================================================================

export interface RunJobOptions {
  scope?: 'curated' | 'external' | 'all';
  frequency?: 'daily' | 'weekly' | 'monthly' | 'adhoc';
  orgTypes?: OrgType[];
  maxUrls?: number;
  rateLimit?: number;
  dryRun?: boolean;
  workspaceId?: string;
  userId?: string;
}

export interface RunJobResult {
  jobId: string | null;
  success: boolean;
  stats: JobStats;
  error?: string;
}

/**
 * Run a freshness verification job
 */
export async function runFreshnessJob(options: RunJobOptions = {}): Promise<RunJobResult> {
  // Check if enabled
  if (!FRESHNESS_ENABLED) {
    return {
      jobId: null,
      success: false,
      stats: {},
      error: 'Freshness system is disabled (FRESHNESS_ENABLED=false)',
    };
  }

  const {
    scope = 'curated',
    frequency = 'adhoc',
    orgTypes,
    maxUrls = FRESHNESS_MAX_URLS,
    rateLimit = FRESHNESS_RATE_LIMIT,
    dryRun = false,
    workspaceId = DEFAULT_ADMIN_WORKSPACE_ID,
    userId = DEFAULT_ADMIN_USER_ID,
  } = options;

  const supabase = getSupabaseClient();
  const startTime = Date.now();

  // Initialize stats
  const stats: JobStats = {
    by_org_type: {},
    by_outcome: {},
    duration_ms: 0,
    avg_response_time_ms: 0,
  };

  let job: FreshnessJob | null = null;
  let totalResponseTime = 0;
  let checksProcessed = 0;
  let changesDetected = 0;
  let reviewItemsCreated = 0;
  let errorsCount = 0;

  try {
    // Create job record (unless dry run)
    if (!dryRun) {
      job = await createJob(supabase, {
        scope,
        frequency,
        max_urls: maxUrls,
        rate_limit: rateLimit,
        org_types: orgTypes,
        llm_assist: FRESHNESS_LLM_ASSIST,
      });
    }

    // Get stale entities
    console.log(`[Freshness] Getting stale entities (max: ${maxUrls})...`);
    const staleEntities = await getStaleEntities(supabase, orgTypes, maxUrls);
    console.log(`[Freshness] Found ${staleEntities.length} stale entities`);

    if (staleEntities.length === 0) {
      if (job) {
        await completeJob(supabase, job.id, { ...stats, duration_ms: Date.now() - startTime });
      }
      return {
        jobId: job?.id || null,
        success: true,
        stats: { ...stats, duration_ms: Date.now() - startTime },
      };
    }

    // Process each entity
    for (const entity of staleEntities) {
      try {
        console.log(`[Freshness] Checking: ${entity.entity_name} (${entity.website})`);

        const result = await processEntityCheck(supabase, job?.id || 'dry-run', entity, rateLimit);

        // Update stats
        checksProcessed++;
        const orgType = entity.entity_type === 'org' ? 'org' : entity.entity_type;
        stats.by_org_type![orgType] = (stats.by_org_type![orgType] || 0) + 1;
        stats.by_outcome![result.check.outcome || 'unknown'] = (stats.by_outcome![result.check.outcome || 'unknown'] || 0) + 1;
        totalResponseTime += result.check.response_time_ms || 0;

        if (result.check.outcome === 'changed' || result.check.outcome === 'not_found') {
          changesDetected++;
        }

        if (result.check.outcome === 'error') {
          errorsCount++;
        }

        // Save check record (unless dry run)
        if (!dryRun) {
          const { data: checkData, error: checkError } = await supabase
            .from('freshness_checks')
            .insert(result.check)
            .select('id')
            .single();

          if (checkError) {
            console.error(`[Freshness] Failed to save check:`, checkError.message);
            errorsCount++;
            continue;
          }

          const checkResult = checkData as InsertResult;

          // Create review item if needed
          if (result.reviewItem) {
            const reviewId = await createReviewItem(supabase, result.reviewItem, checkResult.id);

            if (reviewId) {
              reviewItemsCreated++;

              // Create task draft
              await createTaskDraft(supabase, result.reviewItem, reviewId, workspaceId, userId);
            }
          }

          // Update entity last_verified_at if no changes
          if (result.check.outcome === 'no_change') {
            const tableName =
              entity.entity_type === 'org'
                ? 'directory_orgs'
                : entity.entity_type === 'tool'
                  ? 'directory_ai_tools'
                  : entity.entity_type === 'manufacturer'
                    ? 'directory_manufacturers'
                    : entity.entity_type === 'startup'
                      ? 'directory_startups'
                      : entity.entity_type === 'person'
                        ? 'directory_people'
                        : 'external_entities';

            await supabase
              .from(tableName)
              .update({
                last_verified_at: new Date().toISOString(),
                freshness_status: 'fresh',
                last_check_id: checkResult.id,
              })
              .eq('id', entity.entity_id);
          }

          // Update URL cache
          if (result.check.url) {
            const domain = extractDomain(result.check.url);
            await supabase.from('freshness_url_cache').upsert(
              {
                url: result.check.url,
                url_domain: domain,
                last_fetched_at: result.check.fetched_at,
                last_status: result.check.http_status,
                last_etag: result.check.etag,
                last_modified: result.check.last_modified,
                content_hash: result.check.content_hash,
                content_length: result.check.content_length,
              },
              { onConflict: 'url' }
            );
          }
        }
      } catch (entityError) {
        console.error(`[Freshness] Error processing ${entity.entity_name}:`, entityError);
        errorsCount++;
      }
    }

    // Finalize stats
    stats.duration_ms = Date.now() - startTime;
    stats.avg_response_time_ms = checksProcessed > 0 ? Math.round(totalResponseTime / checksProcessed) : 0;

    // Complete job
    if (job) {
      await updateJob(supabase, job.id, {
        entities_checked: checksProcessed,
        urls_fetched: checksProcessed,
        changes_detected: changesDetected,
        review_items_created: reviewItemsCreated,
        errors_count: errorsCount,
      });
      await completeJob(supabase, job.id, stats, errorsCount > checksProcessed / 2 ? 'failed' : 'done');
    }

    console.log(`[Freshness] Job complete: ${checksProcessed} checked, ${changesDetected} changes, ${reviewItemsCreated} reviews`);

    return {
      jobId: job?.id || null,
      success: true,
      stats,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Freshness] Job failed:`, errorMessage);

    if (job) {
      await completeJob(supabase, job.id, { ...stats, duration_ms: Date.now() - startTime }, 'failed', errorMessage);
    }

    return {
      jobId: job?.id || null,
      success: false,
      stats: { ...stats, duration_ms: Date.now() - startTime },
      error: errorMessage,
    };
  }
}

// Export for testing
export { getStaleEntities, processEntityCheck, createReviewItem, createTaskDraft, getPolicies };
