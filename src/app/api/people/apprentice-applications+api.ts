/**
 * Apprentice Application API
 *
 * GET - List applications
 * POST - Submit new application (public)
 * PATCH - Update application status
 */

import { createClient } from '@supabase/supabase-js';
import type {
  ApprenticeApplication,
  ApprenticeAppStatus,
  EducationStatus,
  RoleArchetype,
  PeopleApiResponse,
} from '@/lib/people/types';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function getSupabaseClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error('Missing Supabase credentials');
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// ============================================================================
// GET - List applications
// ============================================================================

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const workspaceId = url.searchParams.get('workspace_id');
    const status = url.searchParams.get('status');

    const supabase = getSupabaseClient();

    let query = supabase
      .from('apprentice_applications')
      .select('*')
      .order('created_at', { ascending: false });

    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data: applications, error } = await query;

    if (error) {
      console.error('[ApprenticeApps] GET error:', error);
      throw new Error('Failed to fetch applications');
    }

    return Response.json({
      success: true,
      data: applications as ApprenticeApplication[],
    } as PeopleApiResponse<ApprenticeApplication[]>);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[ApprenticeApps] GET error:', message);
    return Response.json(
      { success: false, error: message } as PeopleApiResponse<null>,
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Submit new application (public)
// ============================================================================

interface SubmitApplicationRequest {
  name: string;
  email: string;
  linkedin_url?: string;
  education_status?: EducationStatus;
  interests?: RoleArchetype[];
  availability_hours_per_week?: number;
  availability_start_date?: string;
  location_city?: string;
  location_country?: string;
  remote_ok?: boolean;
  bio?: string;
  portfolio_url?: string;
  referral_source?: string;
  workspace_id?: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SubmitApplicationRequest;

    if (!body.name || !body.email) {
      return Response.json(
        { success: false, error: 'name and email are required' } as PeopleApiResponse<null>,
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return Response.json(
        { success: false, error: 'Invalid email format' } as PeopleApiResponse<null>,
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Check for existing application with same email
    const { data: existing } = await supabase
      .from('apprentice_applications')
      .select('id, status')
      .eq('email', body.email.toLowerCase())
      .not('status', 'in', '("rejected","withdrawn")')
      .single();

    if (existing) {
      return Response.json(
        { success: false, error: 'An application with this email already exists' } as PeopleApiResponse<null>,
        { status: 409 }
      );
    }

    // Create application
    const { data: application, error } = await supabase
      .from('apprentice_applications')
      .insert({
        name: body.name.trim(),
        email: body.email.toLowerCase().trim(),
        linkedin_url: body.linkedin_url?.trim(),
        education_status: body.education_status,
        interests_json: body.interests,
        availability_hours_per_week: body.availability_hours_per_week,
        availability_start_date: body.availability_start_date,
        location_city: body.location_city?.trim(),
        location_country: body.location_country || 'UK',
        remote_ok: body.remote_ok ?? true,
        bio: body.bio?.trim(),
        portfolio_url: body.portfolio_url?.trim(),
        referral_source: body.referral_source?.trim(),
        status: 'new',
        workspace_id: body.workspace_id,
      })
      .select()
      .single();

    if (error) {
      console.error('[ApprenticeApps] POST error:', error);
      throw new Error('Failed to submit application');
    }

    // Create task drafts for screening (if workspace provided)
    if (body.workspace_id) {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 3);

      await supabase.from('task_drafts').insert([
        {
          workspace_id: body.workspace_id,
          title: `Screen apprentice application from ${body.name}`,
          notes: `Review application:\n- Email: ${body.email}\n- Education: ${body.education_status || 'Not specified'}\n- Interests: ${body.interests?.join(', ') || 'Not specified'}`,
          start_iso: new Date().toISOString(),
          due_iso: dueDate.toISOString(),
          units: 1,
          source: 'people_apprentice_pack',
          status: 'pending_confirmation',
          confidence_assignee: 50,
          confidence_due: 70,
        },
      ]);
    }

    return Response.json({
      success: true,
      data: application as ApprenticeApplication,
    } as PeopleApiResponse<ApprenticeApplication>);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[ApprenticeApps] POST error:', message);
    return Response.json(
      { success: false, error: message } as PeopleApiResponse<null>,
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH - Update application status
// ============================================================================

interface UpdateApplicationRequest {
  id: string;
  workspace_id: string;
  user_id: string;
  status?: ApprenticeAppStatus;
  convert_to_person?: boolean;
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as UpdateApplicationRequest;

    if (!body.id || !body.workspace_id) {
      return Response.json(
        { success: false, error: 'id and workspace_id are required' } as PeopleApiResponse<null>,
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Fetch existing application
    const { data: existing, error: fetchError } = await supabase
      .from('apprentice_applications')
      .select('*')
      .eq('id', body.id)
      .single();

    if (fetchError || !existing) {
      return Response.json(
        { success: false, error: 'Application not found' } as PeopleApiResponse<null>,
        { status: 404 }
      );
    }

    const updates: Partial<ApprenticeApplication> = {
      updated_at: new Date().toISOString(),
    };

    if (body.status) {
      updates.status = body.status;
      updates.processed_at = new Date().toISOString();
      updates.processed_by_user_id = body.user_id;
    }

    // Convert to person if accepted
    if (body.convert_to_person && body.status === 'accepted') {
      // Create universal_people record
      const interests = existing.interests_json as RoleArchetype[] | null;
      const roleArchetype = interests?.[0] || 'apprentice_ops';

      const { data: person, error: personError } = await supabase
        .from('universal_people')
        .insert({
          display_name: existing.name,
          person_type: 'apprentice',
          headline: `${roleArchetype.replace('apprentice_', '').replace('_', ' ')} apprentice`,
          bio: existing.bio,
          location_city: existing.location_city,
          location_country: existing.location_country || 'UK',
          timezone: 'Europe/London',
          remote_ok: existing.remote_ok ?? true,
          availability_hours_per_week: existing.availability_hours_per_week,
          availability_start_date: existing.availability_start_date,
          education_status: existing.education_status,
          role_archetypes: interests || [],
          seniority_band: 'junior',
          verification_status: 'opted_in',
          profile_visibility: 'private',
          confidence_score: 60,
          source_type: 'platform',
          source_notes: `Apprentice application${existing.referral_source ? ` (referred: ${existing.referral_source})` : ''}`,
          opted_in_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (!personError && person) {
        updates.converted_person_id = person.id;

        // Add contacts
        await supabase.from('universal_people_contacts').insert({
          person_id: person.id,
          contact_type: 'email',
          contact_value: existing.email.toLowerCase(),
          visibility: 'private',
          is_public: false,
          is_primary: true,
        });

        if (existing.linkedin_url) {
          await supabase.from('universal_people_contacts').insert({
            person_id: person.id,
            contact_type: 'linkedin',
            contact_value: existing.linkedin_url,
            visibility: 'private',
            is_public: false,
            is_primary: false,
          });
        }

        if (existing.portfolio_url) {
          await supabase.from('universal_people_contacts').insert({
            person_id: person.id,
            contact_type: 'website',
            contact_value: existing.portfolio_url,
            visibility: 'marketplace',
            is_public: true,
            is_primary: false,
          });
        }
      }
    }

    // Update application
    const { data: updated, error: updateError } = await supabase
      .from('apprentice_applications')
      .update(updates)
      .eq('id', body.id)
      .select()
      .single();

    if (updateError) {
      console.error('[ApprenticeApps] PATCH error:', updateError);
      throw new Error('Failed to update application');
    }

    return Response.json({
      success: true,
      data: updated as ApprenticeApplication,
    } as PeopleApiResponse<ApprenticeApplication>);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[ApprenticeApps] PATCH error:', message);
    return Response.json(
      { success: false, error: message } as PeopleApiResponse<null>,
      { status: 500 }
    );
  }
}
