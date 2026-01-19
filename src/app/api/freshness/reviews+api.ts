/**
 * Freshness Review Queue API
 *
 * GET /api/freshness/reviews - Get pending reviews
 * POST /api/freshness/reviews - Approve/Reject a review
 */

import { createClient } from '@supabase/supabase-js';

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
// GET /api/freshness/reviews - Get reviews with filters
// ============================================================================

export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get('status') || 'pending';
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);
    const entityType = url.searchParams.get('entity_type');
    const priority = url.searchParams.get('priority');

    let query = supabase
      .from('freshness_review_queue')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (entityType) {
      query = query.eq('entity_type', entityType);
    }

    if (priority) {
      query = query.eq('priority', priority);
    }

    const { data: reviews, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch reviews: ${error.message}`);
    }

    return Response.json({
      success: true,
      reviews: reviews || [],
      total: count || reviews?.length || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('[Freshness Reviews API] Error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/freshness/reviews - Process a review (approve/reject)
// ============================================================================

interface ReviewAction {
  review_id: string;
  action: 'approve' | 'reject' | 'defer';
  reviewer_user_id?: string;
  review_notes?: string;
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body: ReviewAction = await request.json();
    const { review_id, action, reviewer_user_id, review_notes } = body;

    if (!review_id || !action) {
      return Response.json(
        { error: 'Missing required fields: review_id, action' },
        { status: 400 }
      );
    }

    // Get the review item
    const { data: review, error: reviewError } = await supabase
      .from('freshness_review_queue')
      .select('*')
      .eq('id', review_id)
      .single();

    if (reviewError || !review) {
      return Response.json({ error: 'Review not found' }, { status: 404 });
    }

    const now = new Date().toISOString();

    if (action === 'approve') {
      // Apply the proposed changes to the entity
      const proposedChanges = review.proposed_changes_json as Record<
        string,
        { old: unknown; new: unknown; confidence: number }
      >;

      // Determine table name
      const tableName =
        review.entity_type === 'org'
          ? 'directory_orgs'
          : review.entity_type === 'tool'
            ? 'directory_ai_tools'
            : review.entity_type === 'manufacturer'
              ? 'directory_manufacturers'
              : review.entity_type === 'startup'
                ? 'directory_startups'
                : review.entity_type === 'person'
                  ? 'directory_people'
                  : 'external_entities';

      // Build update object from proposed changes
      const updates: Record<string, unknown> = {
        last_verified_at: now,
        freshness_status: 'fresh',
      };

      // Apply specific field changes
      for (const [field, change] of Object.entries(proposedChanges)) {
        if (field === 'confidence_score') {
          updates.confidence_score = change.new;
        } else if (field === 'tags') {
          // Merge tags - this is entity-type specific
          if (review.entity_type === 'org') {
            updates.capability_tags = change.new;
          }
        } else if (field === 'capabilities') {
          updates.capabilities = change.new;
        } else if (field === 'certifications') {
          updates.certifications = change.new;
        }
        // Contact changes are handled separately via directory_contacts table
      }

      // Update the entity
      const { error: updateError } = await supabase
        .from(tableName)
        .update(updates)
        .eq('id', review.entity_id);

      if (updateError) {
        console.error('[Freshness Reviews API] Failed to update entity:', updateError);
        return Response.json(
          { error: `Failed to update entity: ${updateError.message}` },
          { status: 500 }
        );
      }

      // Update review status
      await supabase
        .from('freshness_review_queue')
        .update({
          status: 'approved',
          reviewed_at: now,
          reviewer_user_id: reviewer_user_id,
          review_notes: review_notes,
        })
        .eq('id', review_id);

      // Log audit event
      await supabase.from('freshness_audit_log').insert({
        entity_type: review.entity_type,
        entity_id: review.entity_id,
        review_id: review_id,
        action: 'approved',
        performed_by_user_id: reviewer_user_id,
        performed_at: now,
        details_json: {
          proposed_changes: proposedChanges,
          applied_updates: updates,
        },
      });

      return Response.json({
        success: true,
        message: 'Review approved and changes applied',
        entity_id: review.entity_id,
      });
    } else if (action === 'reject') {
      // Just mark as rejected, don't apply changes
      await supabase
        .from('freshness_review_queue')
        .update({
          status: 'rejected',
          reviewed_at: now,
          reviewer_user_id: reviewer_user_id,
          review_notes: review_notes,
        })
        .eq('id', review_id);

      // Log audit event
      await supabase.from('freshness_audit_log').insert({
        entity_type: review.entity_type,
        entity_id: review.entity_id,
        review_id: review_id,
        action: 'rejected',
        performed_by_user_id: reviewer_user_id,
        performed_at: now,
        details_json: {
          reason: review_notes,
        },
      });

      return Response.json({
        success: true,
        message: 'Review rejected',
      });
    } else if (action === 'defer') {
      // Mark as deferred for later review
      await supabase
        .from('freshness_review_queue')
        .update({
          status: 'deferred',
          reviewed_at: now,
          reviewer_user_id: reviewer_user_id,
          review_notes: review_notes,
        })
        .eq('id', review_id);

      return Response.json({
        success: true,
        message: 'Review deferred',
      });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[Freshness Reviews API] Error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
