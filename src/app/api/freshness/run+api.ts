/**
 * Freshness System API
 *
 * POST /api/freshness/run - Trigger a freshness verification job
 * GET /api/freshness/stats - Get freshness statistics
 * GET /api/freshness/reviews - Get pending reviews
 * POST /api/freshness/reviews/:id/approve - Approve a review
 * POST /api/freshness/reviews/:id/reject - Reject a review
 */

import { createClient } from '@supabase/supabase-js';
import { runFreshnessJob, type RunJobOptions, type RunJobResult } from '@/lib/freshness/runner';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase = createClient<any>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// ============================================================================
// POST /api/freshness/run - Trigger a freshness job
// ============================================================================

interface RunRequest {
  scope?: 'curated' | 'external' | 'all';
  frequency?: 'daily' | 'weekly' | 'monthly' | 'adhoc';
  org_types?: string[];
  max_urls?: number;
  rate_limit?: number;
  dry_run?: boolean;
  workspace_id?: string;
  user_id?: string;
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body: RunRequest = await request.json();

    const options: RunJobOptions = {
      scope: body.scope,
      frequency: body.frequency,
      orgTypes: body.org_types as RunJobOptions['orgTypes'],
      maxUrls: body.max_urls,
      rateLimit: body.rate_limit,
      dryRun: body.dry_run,
      workspaceId: body.workspace_id,
      userId: body.user_id,
    };

    console.log('[Freshness API] Starting job with options:', options);

    const result: RunJobResult = await runFreshnessJob(options);

    if (!result.success) {
      return Response.json(
        {
          success: false,
          error: result.error,
          job_id: result.jobId,
          stats: result.stats,
        },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      job_id: result.jobId,
      stats: result.stats,
    });
  } catch (error) {
    console.error('[Freshness API] Error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET /api/freshness/run - Get recent jobs and stats
// ============================================================================

export async function GET(): Promise<Response> {
  try {
    // Get recent jobs
    const { data: jobs, error: jobsError } = await supabase
      .from('freshness_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (jobsError) {
      throw new Error(`Failed to fetch jobs: ${jobsError.message}`);
    }

    // Get pending reviews count
    const { count: pendingReviews, error: reviewsError } = await supabase
      .from('freshness_review_queue')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    if (reviewsError) {
      throw new Error(`Failed to count reviews: ${reviewsError.message}`);
    }

    // Get freshness stats by org type
    const { data: stats, error: statsError } = await supabase.rpc('get_freshness_stats');

    return Response.json({
      success: true,
      recent_jobs: jobs || [],
      pending_reviews: pendingReviews || 0,
      stats: stats || [],
    });
  } catch (error) {
    console.error('[Freshness API] Error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
