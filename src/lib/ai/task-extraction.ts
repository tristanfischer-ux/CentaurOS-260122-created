/**
 * Client-Side Task Extraction with Google Gemini
 * Direct API calls to Google Gemini AI from React Native
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
 * Extract tasks from text using Google Gemini AI
 * @param inputText - User input (voice transcript or typed text)
 * @param source - 'voice' or 'text'
 * @returns Extracted tasks with confidence scores
 */
export async function extractTasksFromText(
  inputText: string,
  source: 'voice' | 'text' = 'text'
): Promise<TaskExtractionResult> {
  // Get API key from environment
  const apiKey =
    process.env.EXPO_PUBLIC_GOOGLE_AI_API_KEY ||
    process.env.EXPO_PUBLIC_VIBECODE_GOOGLE_API_KEY;

  console.log('[TaskExtraction] API Key check:', {
    hasGoogleKey: !!process.env.EXPO_PUBLIC_GOOGLE_AI_API_KEY,
    hasVibeKey: !!process.env.EXPO_PUBLIC_VIBECODE_GOOGLE_API_KEY,
  });

  if (!apiKey) {
    console.error('[TaskExtraction] No API key found in environment');
    throw new Error('Google API key not configured. Please add EXPO_PUBLIC_GOOGLE_AI_API_KEY to your environment variables.');
  }

  const model = 'gemini-1.5-flash';

  console.log('[TaskExtraction] Starting extraction:', {
    source,
    inputLength: inputText.length,
    model,
  });

  try {
    // Build prompt
    const systemPrompt = WHAT_EXTRACT_SYSTEM_PROMPT;
    const userPrompt = buildWhatExtractPrompt(inputText, source);

    // Combine system and user prompts for Gemini
    const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;

    // Call Google Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: fullPrompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.3, // Low temperature for consistent JSON output
            maxOutputTokens: 4000,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[TaskExtraction] Gemini API error:', errorText);

      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      throw new Error(
        errorData.error?.message || `Task extraction failed: ${response.status}`
      );
    }

    const data = await response.json();

    // Extract text from Gemini response
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

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
      units: Math.max(1, Number(task.units) || 1),
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
      throw new Error('Google API key is invalid or not configured');
    }

    if (error.message.includes('quota')) {
      throw new Error('Google API quota exceeded. Please try again later.');
    }

    if (error.message.includes('invalid format')) {
      throw error;
    }

    throw new Error(`Failed to extract tasks: ${error.message}`);
  }
}
