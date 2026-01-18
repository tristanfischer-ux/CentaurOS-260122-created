/**
 * WHY Flow - Synthesize Brainstorm into Objectives + Tasks
 * POST /api/why/synthesize
 *
 * Analyzes entire brainstorm conversation and generates:
 * - Strategic objectives (max 7)
 * - Task drafts linked to objectives (max 15)
 */

import { supabase } from '@/lib/supabase';
import { createLLMProvider } from '@/lib/providers/llm-provider';
import { WHY_SYNTHESIZE_SYSTEM_PROMPT, buildWhySynthesizePrompt } from '@/lib/prompts/why-synthesize';
import { whatWhyConfig } from '@/lib/what-why-config';

export async function POST(request: Request) {
  try {
    const { sessionId, workspaceId, userId } = await request.json();

    // Validate required fields
    if (!sessionId || !workspaceId || !userId) {
      return Response.json(
        { error: 'Missing required fields: sessionId, workspaceId, userId' },
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
      console.error('[WHY Synthesize] Session not found:', sessionError);
      return Response.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Get all messages from session
    const { data: messages, error: messagesError } = await supabase
      .from('brainstorm_messages')
      .select('role, content')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('[WHY Synthesize] Failed to get messages:', messagesError);
      return Response.json(
        { error: 'Failed to load conversation' },
        { status: 500 }
      );
    }

    if (!messages || messages.length < 2) {
      return Response.json(
        { error: 'Not enough conversation to synthesize (need at least 2 messages)' },
        { status: 400 }
      );
    }

    // Build conversation history
    const conversationHistory = messages.map(m => ({
      role: m.role as 'user' | 'assistant',
      text: m.content,
    }));

    // Extract domain from initial prompt or first user message
    const domain = session.initial_prompt || conversationHistory.find(m => m.role === 'user')?.text || 'General strategy';

    // Build prompt
    const prompt = buildWhySynthesizePrompt(domain, conversationHistory);

    // Call LLM
    const llm = createLLMProvider(
      whatWhyConfig.llm.provider,
      whatWhyConfig.llm.apiKey,
      whatWhyConfig.llm.model
    );

    console.log('[WHY Synthesize] Calling LLM for synthesis...');

    const llmResponse = await llm.complete({
      prompt,
      systemPrompt: WHY_SYNTHESIZE_SYSTEM_PROMPT,
      temperature: 0.3, // Lower temperature for consistency
      maxTokens: 4000,
      schema: {
        type: 'object',
        properties: {
          objectives: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                horizon: { type: 'string' },
                metric: { type: 'string' },
              },
            },
          },
          task_drafts: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                notes: { type: 'string' },
                assignee_default: { type: 'string' },
                due_date: { type: 'string' },
                units: { type: 'number' },
                confidence_assignee: { type: 'number' },
                confidence_due: { type: 'number' },
                objective_index: { type: 'number' },
              },
            },
          },
          risks: { type: 'array', items: { type: 'string' } },
          assumptions: { type: 'array', items: { type: 'string' } },
        },
      },
    });

    // Parse response
    if (!llmResponse.parsed) {
      console.error('[WHY Synthesize] Failed to parse LLM response');
      return Response.json(
        { error: 'Failed to parse synthesis results' },
        { status: 500 }
      );
    }

    const synthesis = llmResponse.parsed;

    // Validate synthesis
    if (!synthesis.objectives || !Array.isArray(synthesis.objectives)) {
      return Response.json(
        { error: 'Invalid synthesis: missing objectives' },
        { status: 500 }
      );
    }

    if (!synthesis.task_drafts || !Array.isArray(synthesis.task_drafts)) {
      return Response.json(
        { error: 'Invalid synthesis: missing task_drafts' },
        { status: 500 }
      );
    }

    // Limit to max 7 objectives, max 15 tasks
    const objectives = synthesis.objectives.slice(0, 7);
    const taskDrafts = synthesis.task_drafts.slice(0, 15);

    console.log('[WHY Synthesize] Generated', objectives.length, 'objectives and', taskDrafts.length, 'task drafts');

    // Save objectives
    const objectivesToInsert = objectives.map((obj: any) => ({
      workspace_id: workspaceId,
      session_id: sessionId,
      title: obj.title,
      horizon: obj.horizon || null,
      metric: obj.metric || null,
      progress: 0, // Start at 0%
    }));

    const { data: savedObjectives, error: objError } = await supabase
      .from('objectives')
      .insert(objectivesToInsert)
      .select();

    if (objError) {
      console.error('[WHY Synthesize] Failed to save objectives:', objError);
      return Response.json(
        { error: 'Failed to save objectives', details: objError.message },
        { status: 500 }
      );
    }

    // Create objective index mapping
    const objectiveIdMap = new Map<number, string>();
    savedObjectives?.forEach((obj: any, idx: number) => {
      objectiveIdMap.set(idx, obj.id);
    });

    // Save task drafts
    const draftsToInsert = taskDrafts.map((draft: any) => ({
      workspace_id: workspaceId,
      session_id: sessionId,
      title: draft.title,
      notes: draft.notes || null,
      assignee_id: null, // Will be set on confirmation
      start_iso: new Date().toISOString().split('T')[0], // Today
      due_iso: draft.due_date || null,
      units: draft.units || 1,
      source: 'why_brainstorm',
      status: 'pending_confirmation',
      confidence_assignee: draft.confidence_assignee || 50,
      confidence_due: draft.confidence_due || 50,
      objective_id: draft.objective_index !== undefined ? objectiveIdMap.get(draft.objective_index) : null,
    }));

    const { data: savedDrafts, error: draftsError } = await supabase
      .from('task_drafts')
      .insert(draftsToInsert)
      .select();

    if (draftsError) {
      console.error('[WHY Synthesize] Failed to save drafts:', draftsError);
      return Response.json(
        { error: 'Failed to save task drafts', details: draftsError.message },
        { status: 500 }
      );
    }

    // Update session status
    const { error: statusError } = await supabase
      .from('brainstorm_sessions')
      .update({
        status: 'synthesized',
        synthesis_result: {
          objectives_count: objectives.length,
          tasks_count: taskDrafts.length,
          risks: synthesis.risks || [],
          assumptions: synthesis.assumptions || [],
        },
      })
      .eq('id', sessionId);

    if (statusError) {
      console.error('[WHY Synthesize] Failed to update session:', statusError);
      // Don't fail the request
    }

    console.log('[WHY Synthesize] Synthesis complete for session:', sessionId);

    return Response.json({
      success: true,
      objectives: savedObjectives?.map((obj: any) => ({
        id: obj.id,
        title: obj.title,
        horizon: obj.horizon,
        metric: obj.metric,
        progress: obj.progress,
      })) || [],
      taskDrafts: savedDrafts?.map((draft: any) => ({
        id: draft.id,
        title: draft.title,
        notes: draft.notes,
        dueDate: draft.due_iso,
        units: draft.units,
        objectiveId: draft.objective_id,
        confidenceAssignee: draft.confidence_assignee,
        confidenceDue: draft.confidence_due,
      })) || [],
      risks: synthesis.risks || [],
      assumptions: synthesis.assumptions || [],
    });
  } catch (error) {
    console.error('[WHY Synthesize] Unexpected error:', error);
    return Response.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
