/**
 * People Invites API
 *
 * GET - List invites for current workspace
 * POST - Create new invite
 * DELETE - Cancel invite
 */

import { createClient } from '@supabase/supabase-js';
import type { PeopleInvite, PeopleApiResponse, RoleArchetype } from '@/lib/people/types';

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

// Helper to generate secure token
function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// ============================================================================
// GET - List invites for workspace
// ============================================================================

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const workspaceId = url.searchParams.get('workspace_id');
    const status = url.searchParams.get('status');

    if (!workspaceId) {
      return Response.json(
        { success: false, error: 'workspace_id is required' } as PeopleApiResponse<null>,
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    let query = supabase
      .from('people_invites')
      .select('*')
      .eq('invited_by_workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: invites, error } = await query;

    if (error) {
      console.error('[Invites] GET error:', error);
      throw new Error('Failed to fetch invites');
    }

    return Response.json({
      success: true,
      data: invites as PeopleInvite[],
    } as PeopleApiResponse<PeopleInvite[]>);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Invites] GET error:', message);
    return Response.json(
      { success: false, error: message } as PeopleApiResponse<null>,
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Create new invite
// ============================================================================

interface CreateInviteRequest {
  workspace_id: string;
  user_id: string;
  email: string;
  prefill_name?: string;
  prefill_role_archetypes?: RoleArchetype[];
  prefill_source_notes?: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateInviteRequest;

    if (!body.workspace_id || !body.user_id || !body.email) {
      return Response.json(
        { success: false, error: 'workspace_id, user_id, and email are required' } as PeopleApiResponse<null>,
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

    // Check if email already has a pending invite
    const { data: existingInvite } = await supabase
      .from('people_invites')
      .select('id, status')
      .eq('email', body.email.toLowerCase())
      .eq('status', 'pending')
      .single();

    if (existingInvite) {
      return Response.json(
        { success: false, error: 'An invite is already pending for this email' } as PeopleApiResponse<null>,
        { status: 409 }
      );
    }

    // Check if person already exists with this email
    const { data: existingPerson } = await supabase
      .from('universal_people_contacts')
      .select('person_id')
      .eq('contact_type', 'email')
      .eq('contact_value', body.email.toLowerCase())
      .single();

    if (existingPerson) {
      return Response.json(
        { success: false, error: 'A person with this email already exists in the system' } as PeopleApiResponse<null>,
        { status: 409 }
      );
    }

    // Generate secure token
    const token = generateToken();

    // Set expiry to 7 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create invite
    const { data: invite, error } = await supabase
      .from('people_invites')
      .insert({
        email: body.email.toLowerCase(),
        token,
        invited_by_user_id: body.user_id,
        invited_by_workspace_id: body.workspace_id,
        prefill_name: body.prefill_name,
        prefill_role_archetypes: body.prefill_role_archetypes,
        prefill_source_notes: body.prefill_source_notes,
        status: 'pending',
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('[Invites] Create error:', error);
      throw new Error('Failed to create invite');
    }

    // Note: Email sending would be handled here in production
    // For now, we just return the invite with the token
    console.log(`[Invites] Created invite for ${body.email}, token: ${token}`);

    return Response.json({
      success: true,
      data: invite as PeopleInvite,
    } as PeopleApiResponse<PeopleInvite>);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Invites] POST error:', message);
    return Response.json(
      { success: false, error: message } as PeopleApiResponse<null>,
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Cancel invite
// ============================================================================

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const inviteId = url.searchParams.get('id');
    const workspaceId = url.searchParams.get('workspace_id');

    if (!inviteId || !workspaceId) {
      return Response.json(
        { success: false, error: 'id and workspace_id are required' } as PeopleApiResponse<null>,
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Verify invite belongs to workspace
    const { data: invite } = await supabase
      .from('people_invites')
      .select('id, status')
      .eq('id', inviteId)
      .eq('invited_by_workspace_id', workspaceId)
      .single();

    if (!invite) {
      return Response.json(
        { success: false, error: 'Invite not found' } as PeopleApiResponse<null>,
        { status: 404 }
      );
    }

    if (invite.status === 'completed') {
      return Response.json(
        { success: false, error: 'Cannot cancel a completed invite' } as PeopleApiResponse<null>,
        { status: 400 }
      );
    }

    // Update status to cancelled
    const { error } = await supabase
      .from('people_invites')
      .update({ status: 'cancelled' })
      .eq('id', inviteId);

    if (error) {
      console.error('[Invites] Cancel error:', error);
      throw new Error('Failed to cancel invite');
    }

    return Response.json({
      success: true,
      data: { id: inviteId, status: 'cancelled' },
    } as PeopleApiResponse<{ id: string; status: string }>);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Invites] DELETE error:', message);
    return Response.json(
      { success: false, error: message } as PeopleApiResponse<null>,
      { status: 500 }
    );
  }
}
