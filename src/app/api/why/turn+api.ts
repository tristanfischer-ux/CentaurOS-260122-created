/**
 * WHY Flow - Brainstorm Turn (Conversation)
 * POST /api/why/turn
 *
 * Handles one turn of the brainstorming conversation.
 * LLM asks one high-leverage question based on user's response.
 */

import { supabase } from '@/lib/supabase';
import { createLLMProvider } from '@/lib/providers/llm-provider';
import { WHY_TURN_SYSTEM_PROMPT, buildWhyTurnPrompt } from '@/lib/prompts/why-turn';
import { whatWhyConfig } from '@/lib/what-why-config';

export async function POST(request: Request) {
  try {
    const { sessionId, userMessage } = await request.json();

    // Validate required fields
    if (!sessionId || !userMessage) {
      return Response.json(
        { error: 'Missing required fields: sessionId, userMessage' },
        { status: 400 }
      );
    }

    // Get session
    const { data: session, error: sessionError } = await supabase
      .from('brainstorm_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      console.error('[WHY Turn] Session not found:', sessionError);
      return Response.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Check session is active
    if (session.status !== 'active') {
      return Response.json(
        { error: 'Session is not active' },
        { status: 400 }
      );
    }

    // Save user message
    const { error: userMsgError } = await supabase
      .from('brainstorm_messages')
      .insert({
        session_id: sessionId,
        role: 'user',
        content: userMessage,
      });

    if (userMsgError) {
      console.error('[WHY Turn] Failed to save user message:', userMsgError);
      return Response.json(
        { error: 'Failed to save message' },
        { status: 500 }
      );
    }

    // Get conversation history (last 10 messages)
    const { data: history, error: historyError } = await supabase
      .from('brainstorm_messages')
      .select('role, content')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(10);

    if (historyError) {
      console.error('[WHY Turn] Failed to get history:', historyError);
      return Response.json(
        { error: 'Failed to load conversation history' },
        { status: 500 }
      );
    }

    // Build conversation history for prompt
    const conversationHistory = (history || [])
      .filter(m => m.role !== 'user' || m.content !== userMessage) // Exclude the message we just added
      .map(m => ({
        role: m.role as 'user' | 'assistant',
        text: m.content,
      }));

    // Get current conversation state
    const currentState = session.conversation_state || {
      topics_covered: [],
      depth: 1,
    };

    // Build prompt
    const prompt = buildWhyTurnPrompt(userMessage, conversationHistory, currentState);

    // Call LLM
    const llm = createLLMProvider(
      whatWhyConfig.llm.provider,
      whatWhyConfig.llm.apiKey,
      whatWhyConfig.llm.model
    );

    const llmResponse = await llm.complete({
      prompt,
      systemPrompt: WHY_TURN_SYSTEM_PROMPT,
      temperature: 0.7,
      maxTokens: 1000,
      schema: {
        type: 'object',
        properties: {
          assistant_message: { type: 'string' },
          updated_state: {
            type: 'object',
            properties: {
              topics_covered: { type: 'array', items: { type: 'string' } },
              depth: { type: 'number' },
            },
          },
        },
      },
    });

    // Parse response
    let assistantMessage: string;
    let updatedState: any = currentState;

    if (llmResponse.parsed) {
      assistantMessage = llmResponse.parsed.assistant_message || llmResponse.content;
      updatedState = llmResponse.parsed.updated_state || currentState;
    } else {
      // Fallback: use raw content
      assistantMessage = llmResponse.content;
    }

    // Save assistant message
    const { error: assistantMsgError } = await supabase
      .from('brainstorm_messages')
      .insert({
        session_id: sessionId,
        role: 'assistant',
        content: assistantMessage,
      });

    if (assistantMsgError) {
      console.error('[WHY Turn] Failed to save assistant message:', assistantMsgError);
      // Don't fail the request
    }

    // Update session state
    const { error: stateError } = await supabase
      .from('brainstorm_sessions')
      .update({
        conversation_state: updatedState,
        turn_count: (session.turn_count || 0) + 1,
      })
      .eq('id', sessionId);

    if (stateError) {
      console.error('[WHY Turn] Failed to update state:', stateError);
      // Don't fail the request
    }

    console.log('[WHY Turn] Turn completed for session:', sessionId);

    return Response.json({
      success: true,
      assistantMessage,
      conversationState: updatedState,
      turnCount: (session.turn_count || 0) + 1,
    });
  } catch (error) {
    console.error('[WHY Turn] Unexpected error:', error);
    return Response.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
