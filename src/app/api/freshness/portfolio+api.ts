/**
 * Portfolio Refresh API Endpoint
 *
 * GET  - List portfolio change sets + stats
 * POST - Approve/reject portfolio changes, or trigger portfolio job
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClientType = ReturnType<typeof createClient<any>>;

function getSupabaseClient(): SupabaseClientType {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error('Missing Supabase credentials');
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// ============================================================================
// GET - Fetch portfolio change sets and stats
// ============================================================================

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get('status') || 'pending';
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);

    const supabase = getSupabaseClient();

    // Get portfolio change sets
    const { data: changeSets, error: changeSetsError } = await supabase
      .from('portfolio_change_sets')
      .select('*')
      .eq('status', status)
      .order('detected_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (changeSetsError) {
      return Response.json({ success: false, error: changeSetsError.message }, { status: 500 });
    }

    // Get stats
    const { data: statsData, error: statsError } = await supabase.rpc('get_portfolio_stats');

    if (statsError) {
      console.error('Failed to get portfolio stats:', statsError.message);
    }

    // Get count of pending change sets
    const { count: pendingCount } = await supabase
      .from('portfolio_change_sets')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    // Get recent portfolio jobs
    const { data: recentJobs } = await supabase
      .from('freshness_jobs')
      .select('*')
      .eq('config_json->>type', 'portfolio_refresh')
      .order('started_at', { ascending: false })
      .limit(5);

    return Response.json({
      success: true,
      change_sets: changeSets || [],
      stats: statsData || {
        total_investors: 0,
        tracked_portfolios: 0,
        total_companies: 0,
        pending_changes: 0,
      },
      pending_count: pendingCount || 0,
      recent_jobs: recentJobs || [],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}

// ============================================================================
// POST - Process portfolio changes or trigger job
// ============================================================================

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, change_set_id, review_notes, run_job } = body;

    const supabase = getSupabaseClient();

    // Handle job trigger
    if (run_job) {
      const { runPortfolioRefreshJob } = await import('@/lib/freshness/portfolio/runner');
      const result = await runPortfolioRefreshJob({
        maxInvestors: body.max_investors || 20,
        rateLimit: body.rate_limit || 8,
        dryRun: body.dry_run || false,
      });
      return Response.json(result);
    }

    // Handle approve/reject
    if (!action || !change_set_id) {
      return Response.json(
        { success: false, error: 'Missing action or change_set_id' },
        { status: 400 }
      );
    }

    if (!['approve', 'reject', 'defer'].includes(action)) {
      return Response.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

    // Get the change set
    const { data: changeSet, error: getError } = await supabase
      .from('portfolio_change_sets')
      .select('*')
      .eq('id', change_set_id)
      .single();

    if (getError || !changeSet) {
      return Response.json(
        { success: false, error: 'Change set not found' },
        { status: 404 }
      );
    }

    if (changeSet.status !== 'pending') {
      return Response.json(
        { success: false, error: 'Change set already processed' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    if (action === 'approve') {
      // Apply the changes
      const added = changeSet.added_companies_json || [];
      const removed = changeSet.removed_companies_json || [];
      const renamed = changeSet.renamed_companies_json || [];

      // Add new companies
      if (added.length > 0) {
        const companiesToAdd = added.map((c: { name: string; name_normalized: string; website?: string; domain?: string; href?: string }) => ({
          investor_org_id: changeSet.investor_org_id,
          company_name: c.name,
          company_name_normalized: c.name_normalized,
          company_website: c.website || null,
          company_domain: c.domain || null,
          portfolio_href: c.href || null,
          status: 'active',
          first_seen_at: now,
          last_seen_at: now,
        }));

        const { error: addError } = await supabase
          .from('directory_portfolio_companies')
          .insert(companiesToAdd);

        if (addError) {
          console.error('Failed to add companies:', addError.message);
        }
      }

      // Mark removed companies
      if (removed.length > 0) {
        const removedIds = removed.map((c: { id: string }) => c.id);
        const { error: removeError } = await supabase
          .from('directory_portfolio_companies')
          .update({
            status: 'removed_pending_review',
            last_seen_at: now,
          })
          .in('id', removedIds);

        if (removeError) {
          console.error('Failed to mark companies as removed:', removeError.message);
        }
      }

      // Apply renames
      if (renamed.length > 0) {
        for (const r of renamed as { id: string; new_name: string; domain?: string }[]) {
          const { error: renameError } = await supabase
            .from('directory_portfolio_companies')
            .update({
              company_name: r.new_name,
              company_name_normalized: r.new_name.toLowerCase().trim(),
              company_domain: r.domain || null,
              last_seen_at: now,
            })
            .eq('id', r.id);

          if (renameError) {
            console.error('Failed to rename company:', renameError.message);
          }
        }
      }

      // Update change set status
      await supabase
        .from('portfolio_change_sets')
        .update({
          status: 'approved',
          reviewed_at: now,
          review_notes: review_notes || null,
        })
        .eq('id', change_set_id);

      // Update related review queue item
      if (changeSet.review_queue_id) {
        await supabase
          .from('freshness_review_queue')
          .update({
            status: 'approved',
            reviewed_at: now,
            review_notes: review_notes || null,
          })
          .eq('id', changeSet.review_queue_id);
      }

      // Log audit event
      await supabase.from('portfolio_audit_log').insert({
        investor_org_id: changeSet.investor_org_id,
        change_set_id: change_set_id,
        action: 'approve',
        changes_applied_json: {
          added: added.length,
          removed: removed.length,
          renamed: renamed.length,
        },
        performed_by: 'admin',
      });

      return Response.json({
        success: true,
        message: `Approved: +${added.length} -${removed.length} ~${renamed.length}`,
      });
    }

    if (action === 'reject') {
      // Update change set status
      await supabase
        .from('portfolio_change_sets')
        .update({
          status: 'rejected',
          reviewed_at: now,
          review_notes: review_notes || null,
        })
        .eq('id', change_set_id);

      // Update related review queue item
      if (changeSet.review_queue_id) {
        await supabase
          .from('freshness_review_queue')
          .update({
            status: 'rejected',
            reviewed_at: now,
            review_notes: review_notes || null,
          })
          .eq('id', changeSet.review_queue_id);
      }

      // Log audit event
      await supabase.from('portfolio_audit_log').insert({
        investor_org_id: changeSet.investor_org_id,
        change_set_id: change_set_id,
        action: 'reject',
        changes_applied_json: null,
        performed_by: 'admin',
        notes: review_notes || null,
      });

      return Response.json({
        success: true,
        message: 'Changes rejected',
      });
    }

    if (action === 'defer') {
      // Update change set status
      await supabase
        .from('portfolio_change_sets')
        .update({
          status: 'deferred',
          review_notes: review_notes || null,
        })
        .eq('id', change_set_id);

      // Update related review queue item
      if (changeSet.review_queue_id) {
        await supabase
          .from('freshness_review_queue')
          .update({
            status: 'deferred',
            review_notes: review_notes || null,
          })
          .eq('id', changeSet.review_queue_id);
      }

      return Response.json({
        success: true,
        message: 'Review deferred',
      });
    }

    return Response.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
