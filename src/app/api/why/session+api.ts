/**
 * WHY Flow - Create Brainstorm Session
 * POST /api/why/session
 *
 * Creates a new brainstorming session for strategic planning.
 */

import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { workspaceId, userId, initialPrompt } = await request.json();

    // Validate required fields
    if (!workspaceId || !userId) {
      return Response.json(
        { error: 'Missing required fields: workspaceId, userId' },
        { status: 400 }
      );
    }

    // Create new brainstorm session
    const { data: session, error: sessionError } = await supabase
      .from('brainstorm_sessions')
      .insert({
        workspace_id: workspaceId,
        user_id: userId,
        status: 'active',
        initial_prompt: initialPrompt || null,
      })
      .select()
      .single();

    if (sessionError) {
      console.error('[WHY Session] Failed to create session:', sessionError);
      return Response.json(
        { error: 'Failed to create brainstorm session', details: sessionError.message },
        { status: 500 }
      );
    }

    // If initial prompt provided, create first message
    if (initialPrompt) {
      const { error: messageError } = await supabase
        .from('brainstorm_messages')
        .insert({
          session_id: session.id,
          role: 'user',
          content: initialPrompt,
        });

      if (messageError) {
        console.error('[WHY Session] Failed to save initial message:', messageError);
        // Don't fail the request, just log the error
      }
    }

    console.log('[WHY Session] Created session:', session.id);

    return Response.json({
      success: true,
      session: {
        id: session.id,
        workspaceId: session.workspace_id,
        userId: session.user_id,
        status: session.status,
        createdAt: session.created_at,
      },
    });
  } catch (error) {
    console.error('[WHY Session] Unexpected error:', error);
    return Response.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
