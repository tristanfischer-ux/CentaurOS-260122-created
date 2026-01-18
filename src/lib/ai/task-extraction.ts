/**
 * Client-Side Task Extraction with OpenAI GPT
 * Direct API calls to OpenAI from React Native
 */

import { WHAT_EXTRACT_SYSTEM_PROMPT, buildWhatExtractPrompt } from '../prompts/what-extract';

export interface TaskDraft {
  title: string;
  notes?: string;
  assignee_default: string; // 'speaker' or person name
  due_date: string | null; // ISO 8601 or null
  units: number;
  confidence_assignee: number; // 0-100
  confidence_due: number; // 0-100
}

export interface TaskExtractionResult {
  tasks: TaskDraft[];
  non_task_notes: string;
  clarifying_questions: string[];
}

/**
 * Extract tasks from text using OpenAI GPT
 * @param inputText - User input (voice transcript or typed text)
 * @param source - 'voice' or 'text'
 * @returns Extracted tasks with confidence scores
 */
export async function extractTasksFromText(
  inputText: string,
  source: 'voice' | 'text' = 'text'
): Promise<TaskExtractionResult> {
  // Get API key from environment
  const apiKey = process.env.EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY;

  console.log('[TaskExtraction] API Key check:', {
    hasOpenAIKey: !!process.env.EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY,
  });

  if (!apiKey) {
    console.error('[TaskExtraction] No API key found in environment');
    throw new Error('OpenAI API key not configured.');
  }

  console.log('[TaskExtraction] Starting extraction:', {
    source,
    inputLength: inputText.length,
    model: 'gpt-4o-mini',
  });

  try {
    // Build prompt
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
      console.error('[TaskExtraction] OpenAI API error:', errorText);

      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
      }

      throw new Error(
        errorData.error?.message || `Task extraction failed: ${response.status}`
      );
    }

    const data = await response.json();

    // Extract text from OpenAI response
    const generatedText = data.choices?.[0]?.message?.content;

    if (!generatedText) {
      console.error('[TaskExtraction] No text in response:', data);
      throw new Error('No response from AI');
    }

    console.log('[TaskExtraction] Raw AI response:', generatedText.substring(0, 200));

    // Parse JSON from response
    let extracted: TaskExtractionResult;
    try {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = generatedText.match(/```json\s*(\{[\s\S]*?\})\s*```/) ||
                        generatedText.match(/(\{[\s\S]*\})/);

      const jsonText = jsonMatch ? jsonMatch[1] : generatedText;
      extracted = JSON.parse(jsonText);
    } catch (e) {
      console.error('[TaskExtraction] Failed to parse JSON:', generatedText);
      throw new Error('AI returned invalid format. Please try again.');
    }

    // Validate and sanitize extracted data
    const tasks = (extracted.tasks || []).map((task: any) => ({
      title: String(task.title || 'Untitled task').substring(0, 200),
      notes: task.notes ? String(task.notes) : '',
      assignee_default: String(task.assignee_default || 'speaker'),
      due_date: task.due_date || null,
      // Always use at least 1 TU, and round up fractional values
      units: Math.max(1, Math.ceil(Number(task.units) || 1)),
      confidence_assignee: Math.min(100, Math.max(0, Number(task.confidence_assignee) || 0)),
      confidence_due: Math.min(100, Math.max(0, Number(task.confidence_due) || 0)),
    }));

    const result: TaskExtractionResult = {
      tasks,
      non_task_notes: extracted.non_task_notes || '',
      clarifying_questions: extracted.clarifying_questions || [],
    };

    console.log('[TaskExtraction] Extraction successful:', {
      tasksCount: tasks.length,
      hasNotes: !!result.non_task_notes,
      questionsCount: result.clarifying_questions.length,
    });

    return result;
  } catch (error: any) {
    console.error('[TaskExtraction] Extraction failed:', error);

    // Provide user-friendly error messages
    if (error.message.includes('API key')) {
      throw new Error('OpenAI API key is invalid or not configured');
    }

    if (error.message.includes('quota') || error.message.includes('rate')) {
      throw new Error('API quota exceeded. Please try again later.');
    }

    if (error.message.includes('invalid format')) {
      throw error;
    }

    throw new Error(`Failed to extract tasks: ${error.message}`);
  }
}
