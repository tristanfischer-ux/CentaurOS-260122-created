/**
 * People Pipeline - Index API
 *
 * GET - List all pipeline relationships for workspace
 * POST - Add candidate to pipeline (from marketplace) or create stub
 */

import { createClient } from '@supabase/supabase-js';
import type {
  CompanyPeopleRelationship,
  CreateStubRequest,
  PipelineStats,
  PeopleApiResponse,
  UniversalPerson,
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
// GET - List pipeline relationships
// ============================================================================

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const workspaceId = url.searchParams.get('workspace_id');
    const stage = url.searchParams.get('stage');
    const relationshipType = url.searchParams.get('relationship_type');
    const personType = url.searchParams.get('person_type');
    const includeStats = url.searchParams.get('include_stats') === 'true';

    if (!workspaceId) {
      return Response.json(
        { success: false, error: 'workspace_id is required' } as PeopleApiResponse<null>,
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Build query
    let query = supabase
      .from('company_people_relationships')
      .select(`
        *,
        person:universal_people(
          id, display_name, headline, bio, person_type,
          location_city, location_country, remote_ok,
          availability_hours_per_week, seniority_band, role_archetypes,
          sector_tags, skill_tags, verification_status, confidence_score,
          profile_visibility
        )
      `)
      .eq('workspace_id', workspaceId)
      .neq('pipeline_stage', 'archived')
      .order('stage_changed_at', { ascending: false });

    if (stage) {
      query = query.eq('pipeline_stage', stage);
    }
    if (relationshipType) {
      query = query.eq('relationship_type', relationshipType);
    }

    const { data: relationships, error } = await query;

    if (error) {
      console.error('[Pipeline] GET error:', error);
      throw new Error('Failed to fetch pipeline');
    }

    // Filter by person_type if requested (need to filter after join)
    let filteredRelationships = relationships || [];
    if (personType) {
      filteredRelationships = filteredRelationships.filter(
        r => r.person?.person_type === personType
      );
    }

    // Optionally get pipeline stats
    let stats: PipelineStats[] | undefined;
    if (includeStats) {
      const { data: statsData } = await supabase.rpc('get_people_pipeline_stats', {
        p_workspace_id: workspaceId,
      });
      stats = statsData as PipelineStats[];
    }

    return Response.json({
      success: true,
      data: {
        relationships: filteredRelationships as CompanyPeopleRelationship[],
        stats,
      },
    } as PeopleApiResponse<{
      relationships: CompanyPeopleRelationship[];
      stats?: PipelineStats[];
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
// POST - Add to pipeline (from marketplace) or create stub
// ============================================================================

interface AddToPipelineRequest {
  workspace_id: string;
  user_id: string;
  // Either person_id (add from marketplace) or stub details
  person_id?: string;
  stub?: CreateStubRequest;
  relationship_type?: CompanyPeopleRelationship['relationship_type'];
  notes_private?: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AddToPipelineRequest;

    if (!body.workspace_id || !body.user_id) {
      return Response.json(
        { success: false, error: 'workspace_id and user_id are required' } as PeopleApiResponse<null>,
        { status: 400 }
      );
    }

    if (!body.person_id && !body.stub) {
      return Response.json(
        { success: false, error: 'Either person_id or stub details are required' } as PeopleApiResponse<null>,
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();
    let personId = body.person_id;

    // If creating a stub, insert into universal_people first
    if (body.stub) {
      if (!body.stub.display_name) {
        return Response.json(
          { success: false, error: 'stub.display_name is required' } as PeopleApiResponse<null>,
          { status: 400 }
        );
      }

      // Create stub person record
      const stubData: Partial<UniversalPerson> = {
        display_name: body.stub.display_name,
        person_type: body.stub.person_type || 'other',
        location_country: 'GB', // Default for UK-focused platform
        timezone: 'Europe/London',
        remote_ok: true,
        notice_period_weeks: 0,
        seniority_band: 'mid',
        role_archetypes: body.stub.role_archetypes || [],
        sector_tags: body.stub.sector_tags || [],
        skill_tags: [],
        stage_fit_tags: [],
        verification_status: 'stub',
        profile_visibility: 'private', // Stubs are always private
        confidence_score: 20, // Low confidence for stubs
        source_type: body.stub.source_type || 'manual',
        source_notes: body.stub.source_notes,
      };

      const { data: newPerson, error: stubError } = await supabase
        .from('universal_people')
        .insert(stubData)
        .select()
        .single();

      if (stubError) {
        console.error('[Pipeline] Stub creation error:', stubError);
        throw new Error('Failed to create stub record');
      }

      personId = newPerson.id;

      // If LinkedIn URL provided, add as private contact
      if (body.stub.linkedin_url) {
        await supabase.from('universal_people_contacts').insert({
          person_id: personId,
          contact_type: 'linkedin',
          contact_value: body.stub.linkedin_url,
          visibility: 'private',
          is_public: false,
          is_primary: false,
        });
      }
    }

    // Check if relationship already exists
    const { data: existingRel } = await supabase
      .from('company_people_relationships')
      .select('id, pipeline_stage')
      .eq('workspace_id', body.workspace_id)
      .eq('person_id', personId)
      .single();

    if (existingRel) {
      // If archived, restore to identified stage
      if (existingRel.pipeline_stage === 'archived') {
        const { data: restored, error: restoreError } = await supabase
          .from('company_people_relationships')
          .update({ pipeline_stage: 'identified' })
          .eq('id', existingRel.id)
          .select(`
            *,
            person:universal_people(
              id, display_name, headline, person_type, verification_status
            )
          `)
          .single();

        if (restoreError) {
          throw new Error('Failed to restore relationship');
        }

        return Response.json({
          success: true,
          data: restored as CompanyPeopleRelationship,
        } as PeopleApiResponse<CompanyPeopleRelationship>);
      }

      return Response.json(
        { success: false, error: 'Candidate is already in your pipeline' } as PeopleApiResponse<null>,
        { status: 409 }
      );
    }

    // Create relationship
    const { data: relationship, error: relError } = await supabase
      .from('company_people_relationships')
      .insert({
        workspace_id: body.workspace_id,
        person_id: personId,
        relationship_type: body.relationship_type || 'candidate',
        pipeline_stage: 'identified',
        owner_user_id: body.user_id,
        warm_intro_available: false,
        priority: 'med',
        notes_private: body.notes_private || body.stub?.notes_private,
        target_role_archetype: body.stub?.target_role_archetype,
        target_hours_per_week: body.stub?.target_hours_per_week,
      })
      .select(`
        *,
        person:universal_people(
          id, display_name, headline, person_type, verification_status
        )
      `)
      .single();

    if (relError) {
      console.error('[Pipeline] Relationship creation error:', relError);
      throw new Error('Failed to add to pipeline');
    }

    return Response.json({
      success: true,
      data: relationship as CompanyPeopleRelationship,
    } as PeopleApiResponse<CompanyPeopleRelationship>);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Pipeline] POST error:', message);
    return Response.json(
      { success: false, error: message } as PeopleApiResponse<null>,
      { status: 500 }
    );
  }
}
