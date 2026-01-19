/**
 * Task Extraction API
 * POST /api/ai/extract-tasks
 *
 * Server-side route for extracting tasks from text using OpenAI
 * Keeps API keys secure on the server
 */

import { WHAT_EXTRACT_SYSTEM_PROMPT, buildWhatExtractPrompt } from '@/lib/prompts/what-extract';

export interface TaskDraft {
  title: string;
  notes?: string;
  assignee_default: string;
  due_date: string | null;
  units: number;
  confidence_assignee: number;
  confidence_due: number;
}

export interface TaskExtractionResult {
  tasks: TaskDraft[];
  non_task_notes: string;
  clarifying_questions: string[];
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { inputText, source = 'text' } = body;

    if (!inputText || typeof inputText !== 'string') {
      return Response.json(
        { error: 'No input text provided' },
        { status: 400 }
      );
    }

    // Get API key from environment (server-side only, not EXPO_PUBLIC_)
    const apiKey = process.env.OPENAI_API_KEY ||
                   process.env.EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY;

    if (!apiKey) {
      console.error('[TaskExtraction API] No OpenAI API key found');
      return Response.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    console.log('[TaskExtraction API] Processing:', {
      source,
      inputLength: inputText.length,
    });

    // Build prompts
    const systemPrompt = WHAT_EXTRACT_SYSTEM_PROMPT;
    const userPrompt = buildWhatExtractPrompt(inputText, source);

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[TaskExtraction API] OpenAI error:', errorText);

      let errorMessage = `OpenAI API error: ${response.status}`;
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error?.message || errorMessage;
      } catch {
        // Use default error message
      }

      return Response.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    const data = await response.json();
    const generatedText = data.choices?.[0]?.message?.content;

    if (!generatedText) {
      console.error('[TaskExtraction API] No text in response');
      return Response.json(
        { error: 'No response from AI' },
        { status: 500 }
      );
    }

    console.log('[TaskExtraction API] Raw AI response:', generatedText.substring(0, 200));

    // Parse JSON from response
    let extracted: TaskExtractionResult;
    try {
      const jsonMatch = generatedText.match(/```json\s*(\{[\s\S]*?\})\s*```/) ||
                        generatedText.match(/(\{[\s\S]*\})/);
      const jsonText = jsonMatch ? jsonMatch[1] : generatedText;
      extracted = JSON.parse(jsonText);
    } catch (e) {
      console.error('[TaskExtraction API] Failed to parse JSON:', generatedText);
      return Response.json(
        { error: 'AI returned invalid format' },
        { status: 500 }
      );
    }

    // Validate and sanitize
    const tasks = (extracted.tasks || []).map((task: any) => ({
      title: String(task.title || 'Untitled task').substring(0, 200),
      notes: task.notes ? String(task.notes) : '',
      assignee_default: String(task.assignee_default || 'speaker'),
      due_date: task.due_date || null,
      units: Math.max(1, Math.ceil(Number(task.units) || 1)),
      confidence_assignee: Math.min(100, Math.max(0, Number(task.confidence_assignee) || 0)),
      confidence_due: Math.min(100, Math.max(0, Number(task.confidence_due) || 0)),
    }));

    const result: TaskExtractionResult = {
      tasks,
      non_task_notes: extracted.non_task_notes || '',
      clarifying_questions: extracted.clarifying_questions || [],
    };

    console.log('[TaskExtraction API] Success:', {
      tasksCount: tasks.length,
      hasNotes: !!result.non_task_notes,
      questionsCount: result.clarifying_questions.length,
    });

    return Response.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('[TaskExtraction API] Unexpected error:', error);
    return Response.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
