/**
 * People Pipeline - Single Relationship API
 *
 * GET - Get relationship by ID (with person data)
 * PATCH - Update relationship (stage, priority, notes)
 * DELETE - Archive relationship
 */

import { createClient } from '@supabase/supabase-js';
import type {
  CompanyPeopleRelationship,
  UpdateRelationshipRequest,
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

// ============================================================================
// GET - Get single relationship with person data
// ============================================================================

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const url = new URL(request.url);
    const workspaceId = url.searchParams.get('workspace_id');

    if (!workspaceId) {
      return Response.json(
        { success: false, error: 'workspace_id is required' } as PeopleApiResponse<null>,
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    const { data: relationship, error } = await supabase
      .from('company_people_relationships')
      .select(`
        *,
        person:universal_people(
          id, display_name, headline, bio, person_type,
          location_city, location_country, timezone, remote_ok,
          availability_hours_per_week, seniority_band, role_archetypes,
          sector_tags, skill_tags, stage_fit_tags, verification_status,
          confidence_score, profile_visibility
        )
      `)
      .eq('id', params.id)
      .eq('workspace_id', workspaceId)
      .single();

    if (error || !relationship) {
      return Response.json(
        { success: false, error: 'Relationship not found' } as PeopleApiResponse<null>,
        { status: 404 }
      );
    }

    // Fetch interactions
    const { data: interactions } = await supabase
      .from('company_people_interactions')
      .select('*')
      .eq('relationship_id', params.id)
      .order('occurred_at', { ascending: false })
      .limit(20);

    // Fetch documents
    const { data: docs } = await supabase
      .from('company_people_docs')
      .select('*')
      .eq('relationship_id', params.id)
      .order('created_at', { ascending: false });

    // Fetch public contacts if person is marketplace visible
    let contacts = null;
    if (relationship.person?.profile_visibility === 'marketplace') {
      const { data: contactData } = await supabase
        .from('universal_people_contacts')
        .select('*')
        .eq('person_id', relationship.person_id)
        .eq('is_public', true);
      contacts = contactData;
    }

    return Response.json({
      success: true,
      data: {
        ...relationship,
        interactions: interactions || [],
        docs: docs || [],
        contacts: contacts || [],
      },
    } as PeopleApiResponse<CompanyPeopleRelationship & {
      interactions: unknown[];
      docs: unknown[];
      contacts: unknown[];
    }>);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Pipeline] GET error:', message);
    return Response.json(
      { success: false, error: message } as PeopleApiResponse<null>,
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH - Update relationship
// ============================================================================

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const url = new URL(request.url);
    const workspaceId = url.searchParams.get('workspace_id');
    const body = (await request.json()) as UpdateRelationshipRequest;

    if (!workspaceId) {
      return Response.json(
        { success: false, error: 'workspace_id is required' } as PeopleApiResponse<null>,
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Verify relationship belongs to workspace
    const { data: existing } = await supabase
      .from('company_people_relationships')
      .select('id, pipeline_stage')
      .eq('id', params.id)
      .eq('workspace_id', workspaceId)
      .single();

    if (!existing) {
      return Response.json(
        { success: false, error: 'Relationship not found' } as PeopleApiResponse<null>,
        { status: 404 }
      );
    }

    // Build update object
    const updateData: Partial<CompanyPeopleRelationship> = {};

    if (body.pipeline_stage !== undefined) {
      updateData.pipeline_stage = body.pipeline_stage;
      // stage_changed_at will be updated by trigger
    }
    if (body.relationship_type !== undefined) {
      updateData.relationship_type = body.relationship_type;
    }
    if (body.priority !== undefined) {
      updateData.priority = body.priority;
    }
    if (body.notes_private !== undefined) {
      updateData.notes_private = body.notes_private;
    }
    if (body.target_role_archetype !== undefined) {
      updateData.target_role_archetype = body.target_role_archetype;
    }
    if (body.target_hours_per_week !== undefined) {
      updateData.target_hours_per_week = body.target_hours_per_week;
    }
    if (body.target_start_date !== undefined) {
      updateData.target_start_date = body.target_start_date;
    }
    if (body.owner_user_id !== undefined) {
      updateData.owner_user_id = body.owner_user_id;
    }
    if (body.warm_intro_available !== undefined) {
      updateData.warm_intro_available = body.warm_intro_available;
    }

    if (Object.keys(updateData).length === 0) {
      return Response.json(
        { success: false, error: 'No fields to update' } as PeopleApiResponse<null>,
        { status: 400 }
      );
    }

    const { data: updated, error } = await supabase
      .from('company_people_relationships')
      .update(updateData)
      .eq('id', params.id)
      .select(`
        *,
        person:universal_people(
          id, display_name, headline, person_type, verification_status
        )
      `)
      .single();

    if (error) {
      console.error('[Pipeline] PATCH error:', error);
      throw new Error('Failed to update relationship');
    }

    return Response.json({
      success: true,
      data: updated as CompanyPeopleRelationship,
    } as PeopleApiResponse<CompanyPeopleRelationship>);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Pipeline] PATCH error:', message);
    return Response.json(
      { success: false, error: message } as PeopleApiResponse<null>,
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Archive relationship (move to archived stage)
// ============================================================================

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const url = new URL(request.url);
    const workspaceId = url.searchParams.get('workspace_id');

    if (!workspaceId) {
      return Response.json(
        { success: false, error: 'workspace_id is required' } as PeopleApiResponse<null>,
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Verify relationship belongs to workspace
    const { data: existing } = await supabase
      .from('company_people_relationships')
      .select('id')
      .eq('id', params.id)
      .eq('workspace_id', workspaceId)
      .single();

    if (!existing) {
      return Response.json(
        { success: false, error: 'Relationship not found' } as PeopleApiResponse<null>,
        { status: 404 }
      );
    }

    // Archive by setting stage to 'archived'
    const { error } = await supabase
      .from('company_people_relationships')
      .update({ pipeline_stage: 'archived' })
      .eq('id', params.id);

    if (error) {
      console.error('[Pipeline] DELETE error:', error);
      throw new Error('Failed to archive relationship');
    }

    return Response.json({
      success: true,
      data: { id: params.id, archived: true },
    } as PeopleApiResponse<{ id: string; archived: boolean }>);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Pipeline] DELETE error:', message);
    return Response.json(
      { success: false, error: message } as PeopleApiResponse<null>,
      { status: 500 }
    );
  }
}
