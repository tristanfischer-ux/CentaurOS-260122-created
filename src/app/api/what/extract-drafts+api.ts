/**
 * WHAT Flow - Extract Drafts API
 * POST /api/what/extract-drafts
 *
 * Extracts task drafts from user input using LLM
 */

import { supabase } from '@/lib/supabase';
import { createLLMProvider } from '@/lib/providers/llm-provider';
import { WHAT_EXTRACT_SYSTEM_PROMPT, buildWhatExtractPrompt } from '@/lib/prompts/what-extract';
import { whatWhyConfig, validateWhatWhyConfig } from '@/lib/what-why-config';

export async function POST(request: Request) {
  try {
    // Validate config
    validateWhatWhyConfig();

    // Parse request
    const body = await request.json();
    const { inputText, source, workspaceId, userId } = body;

    if (!inputText || !workspaceId || !userId) {
      return Response.json(
        { error: 'Missing required fields: inputText, workspaceId, userId' },
        { status: 400 }
      );
    }

    if (source !== 'voice' && source !== 'text') {
      return Response.json(
        { error: 'Invalid source. Must be "voice" or "text"' },
        { status: 400 }
      );
    }

    // Create LLM provider
    const llm = createLLMProvider(
      whatWhyConfig.llm.provider,
      whatWhyConfig.llm.apiKey,
      whatWhyConfig.llm.model
    );

    // Build prompt and extract tasks
    const prompt = buildWhatExtractPrompt(inputText, source);

    const llmResponse = await llm.complete({
      prompt,
      systemPrompt: WHAT_EXTRACT_SYSTEM_PROMPT,
      temperature: 0.3,
      schema: {},
    });

    // Parse LLM response
    let extracted;
    try {
      extracted = llmResponse.parsed || JSON.parse(llmResponse.content);
    } catch (e) {
      console.error('Failed to parse LLM response:', llmResponse.content);
      return Response.json(
        { error: 'LLM returned invalid JSON' },
        { status: 500 }
      );
    }

    const { tasks = [], non_task_notes = '', clarifying_questions = [] } = extracted;

    // Save drafts to database
    const drafts = [];

    for (const task of tasks) {
      const { data: draft, error } = await supabase
        .from('task_drafts')
        .insert({
          workspace_id: workspaceId,
          created_by_user_id: userId,
          assignee_user_id: task.assignee_default === 'speaker' ? userId : null,
          title: task.title,
          notes: task.notes || '',
          start_iso: new Date().toISOString(),
          due_iso: task.due_date || null,
          units: task.units || 1,
          source: source === 'voice' ? 'what_voice' : 'what_text',
          confidence_assignee: task.confidence_assignee || 0,
          confidence_due: task.confidence_due || 0,
          status: 'pending_confirmation',
          transcript_ref: source === 'voice' ? inputText : null,
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving draft:', error);
        continue;
      }

      drafts.push(draft);

      // Log event
      await supabase.from('task_events').insert({
        workspace_id: workspaceId,
        draft_id: draft.id,
        event_type: 'draft_created',
        payload_json: {
          source,
          extracted_from: inputText.substring(0, 200),
        },
        created_by_user_id: userId,
      });
    }

    return Response.json({
      success: true,
      drafts,
      non_task_notes,
      clarifying_questions,
      metadata: {
        tasks_extracted: drafts.length,
        provider: whatWhyConfig.llm.provider,
      },
    });
  } catch (error: any) {
    console.error('[extract-drafts] Error:', error);
    return Response.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
