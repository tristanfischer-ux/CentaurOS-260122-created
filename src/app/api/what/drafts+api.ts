/**
 * WHAT Flow - Get Drafts API
 * GET /api/what/drafts?workspaceId=xxx&userId=xxx
 */

import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const workspaceId = url.searchParams.get('workspaceId');
    const userId = url.searchParams.get('userId');

    if (!workspaceId || !userId) {
      return Response.json(
        { error: 'Missing workspaceId or userId' },
        { status: 400 }
      );
    }

    const { data: drafts, error } = await supabase
      .from('task_drafts')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('status', 'pending_confirmation')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return Response.json({ success: true, drafts });
  } catch (error: any) {
    console.error('[get-drafts] Error:', error);
    return Response.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/what/drafts (update draft)
 */
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { draftId, updates, userId } = body;

    if (!draftId || !updates || !userId) {
      return Response.json(
        { error: 'Missing draftId, updates, or userId' },
        { status: 400 }
      );
    }

    const { data: draft, error } = await supabase
      .from('task_drafts')
      .update(updates)
      .eq('id', draftId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Log event
    await supabase.from('task_events').insert({
      workspace_id: draft.workspace_id,
      draft_id: draftId,
      event_type: 'draft_edited',
      payload_json: { updates },
      created_by_user_id: userId,
    });

    return Response.json({ success: true, draft });
  } catch (error: any) {
    console.error('[update-draft] Error:', error);
    return Response.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
