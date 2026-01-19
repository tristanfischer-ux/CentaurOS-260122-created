/**
 * People Verification API
 *
 * POST - Verify a person
 * GET - Get verification history for a person
 */

import { createClient } from '@supabase/supabase-js';
import type {
  VerificationChecklist,
  VerificationAuditEntry,
  PeopleApiResponse,
  ProfileVisibility,
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
// GET - Get verification history for a person
// ============================================================================

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const personId = url.searchParams.get('person_id');

    if (!personId) {
      return Response.json(
        { success: false, error: 'person_id is required' } as PeopleApiResponse<null>,
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    const { data: history, error } = await supabase
      .from('verification_audit_log')
      .select('*')
      .eq('person_id', personId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Verify] GET error:', error);
      throw new Error('Failed to fetch verification history');
    }

    return Response.json({
      success: true,
      data: history as VerificationAuditEntry[],
    } as PeopleApiResponse<VerificationAuditEntry[]>);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Verify] GET error:', message);
    return Response.json(
      { success: false, error: message } as PeopleApiResponse<null>,
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Verify a person
// ============================================================================

interface VerifyRequest {
  person_id: string;
  user_id: string;
  action: 'verify' | 'unverify' | 'flag' | 'update_visibility';
  checklist?: VerificationChecklist;
  new_visibility?: ProfileVisibility;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as VerifyRequest;

    if (!body.person_id || !body.user_id || !body.action) {
      return Response.json(
        { success: false, error: 'person_id, user_id, and action are required' } as PeopleApiResponse<null>,
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Fetch current person state
    const { data: person, error: fetchError } = await supabase
      .from('universal_people')
      .select('id, verification_status, profile_visibility, confidence_score')
      .eq('id', body.person_id)
      .single();

    if (fetchError || !person) {
      return Response.json(
        { success: false, error: 'Person not found' } as PeopleApiResponse<null>,
        { status: 404 }
      );
    }

    // Prepare updates
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    let newStatus = person.verification_status;
    let newVisibility = person.profile_visibility;

    switch (body.action) {
      case 'verify':
        if (!['opted_in', 'stub', 'invited'].includes(person.verification_status)) {
          return Response.json(
            { success: false, error: 'Person must be opted_in to verify' } as PeopleApiResponse<null>,
            { status: 400 }
          );
        }
        newStatus = 'verified';
        updates.verification_status = 'verified';
        updates.last_verified_at = new Date().toISOString();
        // Increase confidence score
        updates.confidence_score = Math.min(100, (person.confidence_score || 50) + 30);
        // Optionally set visibility to marketplace
        if (body.new_visibility === 'marketplace') {
          newVisibility = 'marketplace';
          updates.profile_visibility = 'marketplace';
        }
        break;

      case 'unverify':
        newStatus = 'opted_in';
        updates.verification_status = 'opted_in';
        // Don't change visibility - admin might want to keep private
        break;

      case 'flag':
        // Lower confidence score but don't change status
        updates.confidence_score = Math.max(0, (person.confidence_score || 50) - 20);
        break;

      case 'update_visibility':
        if (!body.new_visibility) {
          return Response.json(
            { success: false, error: 'new_visibility is required for update_visibility action' } as PeopleApiResponse<null>,
            { status: 400 }
          );
        }
        // Only verified or opted_in can be made marketplace visible
        if (body.new_visibility === 'marketplace' && !['opted_in', 'verified'].includes(person.verification_status)) {
          return Response.json(
            { success: false, error: 'Only opted_in or verified profiles can be made marketplace visible' } as PeopleApiResponse<null>,
            { status: 400 }
          );
        }
        newVisibility = body.new_visibility;
        updates.profile_visibility = body.new_visibility;
        break;
    }

    // Update person
    const { error: updateError } = await supabase
      .from('universal_people')
      .update(updates)
      .eq('id', body.person_id);

    if (updateError) {
      console.error('[Verify] Update error:', updateError);
      throw new Error('Failed to update person');
    }

    // Create audit log entry
    const { data: auditEntry, error: auditError } = await supabase
      .from('verification_audit_log')
      .insert({
        person_id: body.person_id,
        action: body.action,
        previous_status: person.verification_status,
        new_status: newStatus,
        previous_visibility: person.profile_visibility,
        new_visibility: newVisibility,
        checklist_json: body.checklist,
        verified_by_user_id: body.user_id,
      })
      .select()
      .single();

    if (auditError) {
      console.warn('[Verify] Audit log error:', auditError);
      // Don't fail the request for audit log errors
    }

    // Fetch updated person
    const { data: updatedPerson } = await supabase
      .from('universal_people')
      .select('*')
      .eq('id', body.person_id)
      .single();

    return Response.json({
      success: true,
      data: {
        person: updatedPerson,
        audit_entry: auditEntry,
      },
    } as PeopleApiResponse<{
      person: unknown;
      audit_entry: VerificationAuditEntry | null;
    }>);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Verify] POST error:', message);
    return Response.json(
      { success: false, error: message } as PeopleApiResponse<null>,
      { status: 500 }
    );
  }
}
