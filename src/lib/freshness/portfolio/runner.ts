/**
 * Portfolio Refresh Job Runner
 *
 * Orchestrates the portfolio verification process:
 * 1. Select investors with stale portfolios
 * 2. Discover/fetch portfolio pages
 * 3. Extract companies
 * 4. Compute diffs
 * 5. Create change sets and review items
 * 6. Create task drafts
 */

import { createClient } from '@supabase/supabase-js';
import { fetchUrl, extractDomain } from '../fetch';
import { discoverPortfolioUrl } from './discovery';
import { extractPortfolioCompanies } from './extract';
import { computePortfolioDiff, generatePortfolioChangeSummary } from './diff';
import type {
  StaleInvestor,
  PortfolioPage,
  PortfolioCompany,
  PortfolioChangeSet,
  PortfolioRefreshOptions,
  PortfolioRefreshResult,
  AddedCompany,
  RemovedCompany,
  RenamedCompany,
} from './types';

// ============================================================================
// CONFIGURATION
// ============================================================================

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Feature flags
const PORTFOLIO_REFRESH_ENABLED = process.env.PORTFOLIO_REFRESH_ENABLED !== 'false';
const PORTFOLIO_LLM_ASSIST = process.env.PORTFOLIO_LLM_ASSIST_ENABLED === 'true';
const PORTFOLIO_MAX_INVESTORS = parseInt(process.env.PORTFOLIO_MAX_INVESTORS_PER_RUN || '20', 10);
const PORTFOLIO_RATE_LIMIT = parseInt(process.env.PORTFOLIO_RATE_LIMIT_PER_MIN || '8', 10);

// Default admin IDs
const DEFAULT_ADMIN_WORKSPACE_ID = '00000000-0000-0000-0000-000000000001';
const DEFAULT_ADMIN_USER_ID = '00000000-0000-0000-0000-000000000001';

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
// MAIN JOB RUNNER
// ============================================================================

/**
 * Run a portfolio refresh job
 */
export async function runPortfolioRefreshJob(
  options: PortfolioRefreshOptions = {}
): Promise<PortfolioRefreshResult> {
  // Check if enabled
  if (!PORTFOLIO_REFRESH_ENABLED) {
    return {
      jobId: null,
      success: false,
      investorsChecked: 0,
      pagesChecked: 0,
      changeSetsCreated: 0,
      errorsCount: 0,
      duration_ms: 0,
      error: 'Portfolio refresh is disabled (PORTFOLIO_REFRESH_ENABLED=false)',
    };
  }

  const {
    maxInvestors = PORTFOLIO_MAX_INVESTORS,
    rateLimit = PORTFOLIO_RATE_LIMIT,
    dryRun = false,
    llmAssist = PORTFOLIO_LLM_ASSIST,
    workspaceId = DEFAULT_ADMIN_WORKSPACE_ID,
    userId = DEFAULT_ADMIN_USER_ID,
  } = options;

  const supabase = getSupabaseClient();
  const startTime = Date.now();

  let jobId: string | null = null;
  let investorsChecked = 0;
  let pagesChecked = 0;
  let changeSetsCreated = 0;
  let errorsCount = 0;

  try {
    // Create job record
    if (!dryRun) {
      const { data: job, error: jobError } = await supabase
        .from('freshness_jobs')
        .insert({
          scope: 'curated',
          job_type: 'scheduled',
          frequency: 'adhoc',
          status: 'running',
          started_at: new Date().toISOString(),
          config_json: {
            type: 'portfolio_refresh',
            max_investors: maxInvestors,
            rate_limit: rateLimit,
            llm_assist: llmAssist,
          },
        })
        .select('id')
        .single();

      if (jobError) {
        throw new Error(`Failed to create job: ${jobError.message}`);
      }
      jobId = job.id;
    }

    // Get stale investors
    console.log(`[Portfolio] Getting stale investors (max: ${maxInvestors})...`);
    const { data: staleInvestors, error: staleError } = await supabase.rpc(
      'get_stale_portfolio_investors',
      { p_limit: maxInvestors }
    );

    if (staleError) {
      throw new Error(`Failed to get stale investors: ${staleError.message}`);
    }

    const investors = (staleInvestors || []) as StaleInvestor[];
    console.log(`[Portfolio] Found ${investors.length} investors to check`);

    if (investors.length === 0) {
      if (jobId) {
        await completeJob(supabase, jobId, 'done', {
          investors_checked: 0,
          pages_checked: 0,
          change_sets_created: 0,
        });
      }
      return {
        jobId,
        success: true,
        investorsChecked: 0,
        pagesChecked: 0,
        changeSetsCreated: 0,
        errorsCount: 0,
        duration_ms: Date.now() - startTime,
      };
    }

    // Process each investor
    for (const investor of investors) {
      try {
        console.log(`[Portfolio] Processing: ${investor.investor_name}`);
        investorsChecked++;

        // Step 1: Get or discover portfolio URL
        let portfolioUrl = investor.portfolio_url;
        let portfolioPageId: string | null = null;

        if (!portfolioUrl) {
          // Discover portfolio URL
          const evidenceUrls = await getEvidenceUrls(supabase, investor.investor_org_id);
          const discovery = await discoverPortfolioUrl(investor.website, evidenceUrls, rateLimit);

          if (!discovery.portfolio_url) {
            console.log(`[Portfolio] No portfolio URL found for ${investor.investor_name}`);
            continue;
          }

          portfolioUrl = discovery.portfolio_url;

          // Save discovered URL
          if (!dryRun) {
            const { data: page } = await supabase
              .from('directory_portfolio_pages')
              .insert({
                investor_org_id: investor.investor_org_id,
                portfolio_url: portfolioUrl,
                portfolio_url_domain: extractDomain(portfolioUrl),
                discovery_method: discovery.discovery_method,
                confidence_score: discovery.confidence,
                is_primary: true,
                is_active: true,
              })
              .select('id')
              .single();

            portfolioPageId = page?.id;
          }
        } else {
          // Get existing page record
          const { data: existingPage } = await supabase
            .from('directory_portfolio_pages')
            .select('id')
            .eq('investor_org_id', investor.investor_org_id)
            .eq('portfolio_url', portfolioUrl)
            .single();

          portfolioPageId = existingPage?.id;
        }

        // Step 2: Fetch portfolio page
        const fetchResult = await fetchUrl(portfolioUrl, { timeout_ms: 15000 }, rateLimit);
        pagesChecked++;

        if (!fetchResult.success || !fetchResult.content) {
          console.log(
            `[Portfolio] Failed to fetch ${portfolioUrl}: ${fetchResult.error}`
          );
          errorsCount++;

          // Update page with error
          if (!dryRun && portfolioPageId) {
            await supabase
              .from('directory_portfolio_pages')
              .update({
                last_checked_at: new Date().toISOString(),
                last_http_status: fetchResult.status,
                extraction_quality: 'uncertain',
                extraction_notes: fetchResult.error,
              })
              .eq('id', portfolioPageId);
          }
          continue;
        }

        // Step 3: Extract companies
        const extraction = extractPortfolioCompanies(fetchResult.content, portfolioUrl);
        console.log(
          `[Portfolio] Extracted ${extraction.companies.length} companies (quality: ${extraction.quality})`
        );

        // Update page with extraction info
        if (!dryRun && portfolioPageId) {
          await supabase
            .from('directory_portfolio_pages')
            .update({
              last_checked_at: new Date().toISOString(),
              last_http_status: fetchResult.status,
              last_content_hash: fetchResult.content_hash,
              last_etag: fetchResult.etag,
              last_modified: fetchResult.last_modified,
              extraction_quality: extraction.quality,
              extraction_notes: extraction.notes,
              confidence_score: extraction.confidence,
            })
            .eq('id', portfolioPageId);
        }

        // Step 4: Get existing companies
        const { data: existingCompanies } = await supabase
          .from('directory_portfolio_companies')
          .select('*')
          .eq('investor_org_id', investor.investor_org_id)
          .eq('status', 'active');

        const existing = (existingCompanies || []) as PortfolioCompany[];

        // Step 5: Compute diff
        const diff = computePortfolioDiff(existing, extraction.companies, extraction.quality);

        if (!diff.has_changes) {
          console.log(`[Portfolio] No changes for ${investor.investor_name}`);

          // Update last_seen_at for all existing companies
          if (!dryRun && existing.length > 0) {
            await supabase
              .from('directory_portfolio_companies')
              .update({ last_seen_at: new Date().toISOString() })
              .eq('investor_org_id', investor.investor_org_id)
              .eq('status', 'active');
          }
          continue;
        }

        console.log(
          `[Portfolio] Changes: +${diff.added.length} -${diff.removed.length} ~${diff.renamed.length}`
        );

        // Step 6: Create change set
        if (!dryRun) {
          const changeSet = await createChangeSet(
            supabase,
            investor,
            portfolioUrl,
            portfolioPageId,
            diff,
            jobId,
            extraction.quality
          );

          if (changeSet) {
            changeSetsCreated++;

            // Create review queue item
            const reviewId = await createReviewItem(supabase, changeSet, investor);

            // Create task draft
            if (reviewId) {
              await createTaskDraft(
                supabase,
                changeSet,
                investor,
                reviewId,
                workspaceId,
                userId
              );
            }
          }
        } else {
          console.log(`[Portfolio] DRY RUN: Would create change set`);
          changeSetsCreated++;
        }
      } catch (investorError) {
        console.error(
          `[Portfolio] Error processing ${investor.investor_name}:`,
          investorError
        );
        errorsCount++;
      }
    }

    // Complete job
    if (jobId) {
      await completeJob(supabase, jobId, 'done', {
        investors_checked: investorsChecked,
        pages_checked: pagesChecked,
        change_sets_created: changeSetsCreated,
        errors_count: errorsCount,
      });
    }

    console.log(
      `[Portfolio] Job complete: ${investorsChecked} investors, ${changeSetsCreated} changes`
    );

    return {
      jobId,
      success: true,
      investorsChecked,
      pagesChecked,
      changeSetsCreated,
      errorsCount,
      duration_ms: Date.now() - startTime,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Portfolio] Job failed:`, errorMessage);

    if (jobId) {
      await completeJob(supabase, jobId, 'failed', {
        error_message: errorMessage,
      });
    }

    return {
      jobId,
      success: false,
      investorsChecked,
      pagesChecked,
      changeSetsCreated,
      errorsCount,
      duration_ms: Date.now() - startTime,
      error: errorMessage,
    };
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function getEvidenceUrls(
  supabase: SupabaseClientType,
  orgId: string
): Promise<string[]> {
  const { data } = await supabase
    .from('directory_evidence')
    .select('url')
    .eq('org_id', orgId);

  return (data || []).map((e: { url: string }) => e.url);
}

async function completeJob(
  supabase: SupabaseClientType,
  jobId: string,
  status: 'done' | 'failed',
  stats: Record<string, unknown>
): Promise<void> {
  await supabase
    .from('freshness_jobs')
    .update({
      status,
      finished_at: new Date().toISOString(),
      stats_json: stats,
      ...stats,
    })
    .eq('id', jobId);
}

async function createChangeSet(
  supabase: SupabaseClientType,
  investor: StaleInvestor,
  portfolioUrl: string,
  portfolioPageId: string | null,
  diff: { added: AddedCompany[]; removed: RemovedCompany[]; renamed: RenamedCompany[]; unchanged: string[]; quality: string; confidence: number; notes: string[] },
  jobId: string | null,
  quality: string
): Promise<PortfolioChangeSet | null> {
  const { data, error } = await supabase
    .from('portfolio_change_sets')
    .insert({
      investor_org_id: investor.investor_org_id,
      investor_org_name: investor.investor_name,
      portfolio_page_id: portfolioPageId,
      portfolio_url: portfolioUrl,
      detected_at: new Date().toISOString(),
      job_id: jobId,
      added_companies_json: diff.added,
      removed_companies_json: diff.removed,
      renamed_companies_json: diff.renamed,
      unchanged_count: diff.unchanged.length,
      extraction_quality: quality,
      confidence_score: diff.confidence,
      notes: diff.notes.join('; '),
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    console.error(`[Portfolio] Failed to create change set:`, error.message);
    return null;
  }

  return data as PortfolioChangeSet;
}

async function createReviewItem(
  supabase: SupabaseClientType,
  changeSet: PortfolioChangeSet,
  investor: StaleInvestor
): Promise<string | null> {
  const { data, error } = await supabase
    .from('freshness_review_queue')
    .insert({
      entity_type: 'org',
      entity_id: investor.investor_org_id,
      entity_name: investor.investor_name,
      change_type: 'portfolio_changed',
      change_summary: `Portfolio update: +${changeSet.added_companies_json.length} -${changeSet.removed_companies_json.length} ~${changeSet.renamed_companies_json.length}`,
      proposed_changes_json: {
        added: changeSet.added_companies_json,
        removed: changeSet.removed_companies_json,
        renamed: changeSet.renamed_companies_json,
        unchanged_count: changeSet.unchanged_count,
      },
      evidence_url: changeSet.portfolio_url,
      confidence_score: changeSet.confidence_score,
      priority:
        changeSet.confidence_score >= 70
          ? 'high'
          : changeSet.confidence_score >= 50
            ? 'normal'
            : 'low',
      status: 'pending',
    })
    .select('id')
    .single();

  if (error) {
    console.error(`[Portfolio] Failed to create review item:`, error.message);
    return null;
  }

  // Update change set with review ID
  await supabase
    .from('portfolio_change_sets')
    .update({ review_queue_id: data.id })
    .eq('id', changeSet.id);

  return data.id;
}

async function createTaskDraft(
  supabase: SupabaseClientType,
  changeSet: PortfolioChangeSet,
  investor: StaleInvestor,
  reviewId: string,
  workspaceId: string,
  userId: string
): Promise<string | null> {
  const addedCount = changeSet.added_companies_json.length;
  const removedCount = changeSet.removed_companies_json.length;
  const renamedCount = changeSet.renamed_companies_json.length;

  const title = `Review portfolio updates: ${investor.investor_name}`;

  // Build notes
  const addedList = changeSet.added_companies_json
    .slice(0, 5)
    .map((c: AddedCompany) => `  - ${c.name}${c.domain ? ` (${c.domain})` : ''}`)
    .join('\n');

  const removedList = changeSet.removed_companies_json
    .slice(0, 5)
    .map((c: RemovedCompany) => `  - ${c.name}`)
    .join('\n');

  const notes = `## Portfolio Update Detected

**Investor:** ${investor.investor_name}
**Portfolio URL:** ${changeSet.portfolio_url}
**Detected:** ${new Date().toISOString()}
**Confidence:** ${changeSet.confidence_score}%

### Summary
- **+${addedCount}** companies added
- **-${removedCount}** companies removed
- **~${renamedCount}** potential renames

${addedCount > 0 ? `### Added Companies\n${addedList}${addedCount > 5 ? `\n  ... and ${addedCount - 5} more` : ''}` : ''}

${removedCount > 0 ? `### Removed Companies\n${removedList}${removedCount > 5 ? `\n  ... and ${removedCount - 5} more` : ''}` : ''}

### Actions
- [ ] Review changes in Marketplace Admin
- [ ] Approve or reject portfolio updates
- [ ] Verify uncertain items manually

---
*Auto-generated by Portfolio Refresh System*
*Review ID: ${reviewId}*
*Change Set ID: ${changeSet.id}*`;

  const now = new Date();
  const dueDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

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
      source: 'portfolio_refresh',
      confidence_assignee: 70,
      confidence_due: 70,
      status: 'pending_confirmation',
    })
    .select('id')
    .single();

  if (error) {
    console.error(`[Portfolio] Failed to create task draft:`, error.message);
    return null;
  }

  // Update change set with task ID
  await supabase
    .from('portfolio_change_sets')
    .update({ task_draft_id: data.id })
    .eq('id', changeSet.id);

  return data.id;
}

// Export for testing
export { getEvidenceUrls, createChangeSet, createReviewItem, createTaskDraft };
