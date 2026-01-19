/**
 * People Pipeline - Interactions API
 *
 * POST - Log a new interaction for a relationship
 */

import { createClient } from '@supabase/supabase-js';
import type {
  CompanyPeopleInteraction,
  InteractionType,
  PeopleApiResponse,
} from '@/lib/people/types';

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

interface LogInteractionRequest {
  workspace_id: string;
  user_id: string;
  relationship_id: string;
  interaction_type: InteractionType;
  summary: string;
  occurred_at?: string;
  next_steps?: string;
}

// ============================================================================
// POST - Log interaction
// ============================================================================

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LogInteractionRequest;

    if (!body.workspace_id || !body.user_id || !body.relationship_id) {
      return Response.json(
        {
          success: false,
          error: 'workspace_id, user_id, and relationship_id are required',
        } as PeopleApiResponse<null>,
        { status: 400 }
      );
    }

    if (!body.interaction_type || !body.summary) {
      return Response.json(
        { success: false, error: 'interaction_type and summary are required' } as PeopleApiResponse<null>,
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Verify relationship exists and belongs to workspace
    const { data: relationship, error: relError } = await supabase
      .from('company_people_relationships')
      .select('id, workspace_id')
      .eq('id', body.relationship_id)
      .eq('workspace_id', body.workspace_id)
      .single();

    if (relError || !relationship) {
      return Response.json(
        { success: false, error: 'Relationship not found' } as PeopleApiResponse<null>,
        { status: 404 }
      );
    }

    // Create interaction
    const { data: interaction, error: insertError } = await supabase
      .from('company_people_interactions')
      .insert({
        relationship_id: body.relationship_id,
        interaction_type: body.interaction_type,
        summary: body.summary,
        occurred_at: body.occurred_at || new Date().toISOString(),
        next_steps: body.next_steps,
        logged_by_user_id: body.user_id,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[Interactions] Insert error:', insertError);
      throw new Error('Failed to log interaction');
    }

    return Response.json({
      success: true,
      data: interaction as CompanyPeopleInteraction,
    } as PeopleApiResponse<CompanyPeopleInteraction>);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Interactions] POST error:', message);
    return Response.json(
      { success: false, error: message } as PeopleApiResponse<null>,
      { status: 500 }
    );
  }
}
