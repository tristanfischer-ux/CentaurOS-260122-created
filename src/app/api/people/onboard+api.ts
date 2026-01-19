/**
 * People Onboarding API
 *
 * POST - Complete onboarding for invited person
 * GET  - Validate invite token and get prefill data
 */

import { createClient } from '@supabase/supabase-js';
import type {
  OnboardingRequest,
  UniversalPerson,
  PeopleApiResponse,
  PeopleInvite,
} from '@/lib/people/types';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const CONSENT_VERSION = '2026-01';

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
// GET - Validate invite token and return prefill data
// ============================================================================

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return Response.json(
        { success: false, error: 'Missing invite token' } as PeopleApiResponse<null>,
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Find invite by token
    const { data: invite, error: inviteError } = await supabase
      .from('people_invites')
      .select('*')
      .eq('token', token)
      .single();

    if (inviteError || !invite) {
      return Response.json(
        { success: false, error: 'Invalid invite token' } as PeopleApiResponse<null>,
        { status: 404 }
      );
    }

    // Check if expired
    if (new Date(invite.expires_at) < new Date()) {
      return Response.json(
        { success: false, error: 'Invite has expired' } as PeopleApiResponse<null>,
        { status: 410 }
      );
    }

    // Check if already completed
    if (invite.status === 'completed') {
      return Response.json(
        { success: false, error: 'Invite has already been used' } as PeopleApiResponse<null>,
        { status: 410 }
      );
    }

    // Check if cancelled
    if (invite.status === 'cancelled') {
      return Response.json(
        { success: false, error: 'Invite has been cancelled' } as PeopleApiResponse<null>,
        { status: 410 }
      );
    }

    // Mark invite as opened (if first time)
    if (invite.status === 'pending' || invite.status === 'sent') {
      await supabase
        .from('people_invites')
        .update({ status: 'opened', opened_at: new Date().toISOString() })
        .eq('id', invite.id);
    }

    return Response.json({
      success: true,
      data: {
        email: invite.email,
        prefill_name: invite.prefill_name,
        prefill_role_archetypes: invite.prefill_role_archetypes,
        prefill_source_notes: invite.prefill_source_notes,
      },
    } as PeopleApiResponse<Partial<PeopleInvite>>);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[People Onboard] GET error:', message);
    return Response.json(
      { success: false, error: message } as PeopleApiResponse<null>,
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Complete onboarding
// ============================================================================

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as OnboardingRequest;

    // Validate required fields
    if (!body.token) {
      return Response.json(
        { success: false, error: 'Missing invite token' } as PeopleApiResponse<null>,
        { status: 400 }
      );
    }

    if (!body.display_name || body.display_name.trim().length < 2) {
      return Response.json(
        { success: false, error: 'Display name is required (min 2 characters)' } as PeopleApiResponse<null>,
        { status: 400 }
      );
    }

    if (!body.consent_agreed) {
      return Response.json(
        { success: false, error: 'You must agree to the Terms of Service and Privacy Policy' } as PeopleApiResponse<null>,
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Validate invite token
    const { data: invite, error: inviteError } = await supabase
      .from('people_invites')
      .select('*')
      .eq('token', body.token)
      .single();

    if (inviteError || !invite) {
      return Response.json(
        { success: false, error: 'Invalid invite token' } as PeopleApiResponse<null>,
        { status: 404 }
      );
    }

    if (new Date(invite.expires_at) < new Date()) {
      return Response.json(
        { success: false, error: 'Invite has expired' } as PeopleApiResponse<null>,
        { status: 410 }
      );
    }

    if (invite.status === 'completed') {
      return Response.json(
        { success: false, error: 'Invite has already been used' } as PeopleApiResponse<null>,
        { status: 410 }
      );
    }

    // Check for existing profile with same email
    if (body.contacts?.some(c => c.contact_type === 'email')) {
      const email = body.contacts.find(c => c.contact_type === 'email')?.contact_value;
      if (email) {
        const { data: existingContact } = await supabase
          .from('universal_people_contacts')
          .select('person_id')
          .eq('contact_type', 'email')
          .eq('contact_value', email.toLowerCase())
          .single();

        if (existingContact) {
          return Response.json(
            { success: false, error: 'A profile with this email already exists' } as PeopleApiResponse<null>,
            { status: 409 }
          );
        }
      }
    }

    // Create the profile
    const { data: person, error: personError } = await supabase
      .from('universal_people')
      .insert({
        display_name: body.display_name.trim(),
        person_type: body.person_type || 'other',
        headline: body.headline?.trim(),
        bio: body.bio?.trim(),
        role_archetypes: body.role_archetypes || [],
        sector_tags: body.sector_tags || [],
        skill_tags: body.skill_tags || [],
        stage_fit_tags: body.stage_fit_tags || [],
        seniority_band: body.seniority_band || 'mid',
        location_city: body.location_city?.trim(),
        location_country: body.location_country || 'UK',
        remote_ok: body.remote_ok ?? true,
        availability_hours_per_week: body.availability_hours_per_week,
        availability_start_date: body.availability_start_date,
        education_status: body.education_status,
        profile_visibility: body.profile_visibility || 'private',
        verification_status: 'opted_in',
        source_type: 'platform',
        source_notes: invite.prefill_source_notes,
        opted_in_at: new Date().toISOString(),
        consent_version: CONSENT_VERSION,
        confidence_score: 60, // Opted-in gets higher base score than stub
      })
      .select()
      .single();

    if (personError || !person) {
      console.error('[People Onboard] Create person error:', personError);
      return Response.json(
        { success: false, error: 'Failed to create profile' } as PeopleApiResponse<null>,
        { status: 500 }
      );
    }

    // Add contacts if provided
    if (body.contacts && body.contacts.length > 0) {
      const contactsToInsert = body.contacts.map((c, index) => ({
        person_id: person.id,
        contact_type: c.contact_type,
        contact_value: c.contact_value.trim().toLowerCase(),
        visibility: body.profile_visibility === 'marketplace' && c.is_public ? 'marketplace' : 'private',
        is_public: c.is_public,
        is_primary: index === 0 && c.contact_type === 'email',
      }));

      const { error: contactsError } = await supabase
        .from('universal_people_contacts')
        .insert(contactsToInsert);

      if (contactsError) {
        console.error('[People Onboard] Create contacts error:', contactsError);
        // Don't fail the whole operation, profile is still created
      }
    }

    // Mark invite as completed
    await supabase
      .from('people_invites')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        person_id: person.id,
      })
      .eq('id', invite.id);

    // If invite was from a workspace, create relationship
    if (invite.invited_by_workspace_id) {
      await supabase
        .from('company_people_relationships')
        .insert({
          workspace_id: invite.invited_by_workspace_id,
          person_id: person.id,
          relationship_type: body.person_type === 'apprentice' ? 'apprentice' : 'candidate',
          pipeline_stage: 'contacted', // They responded to invite
          owner_user_id: invite.invited_by_user_id,
          target_role_archetype: body.role_archetypes?.[0],
          target_hours_per_week: body.availability_hours_per_week,
        });
    }

    return Response.json({
      success: true,
      data: person as UniversalPerson,
    } as PeopleApiResponse<UniversalPerson>);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[People Onboard] POST error:', message);
    return Response.json(
      { success: false, error: message } as PeopleApiResponse<null>,
      { status: 500 }
    );
  }
}
