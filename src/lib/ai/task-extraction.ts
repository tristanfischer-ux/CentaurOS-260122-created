/**
 * Task Extraction via OpenAI GPT API
 * Client-side AI task extraction with API key from environment
 */

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
 * Extract tasks from text using OpenAI GPT API
 * @param inputText - User input (voice transcript or typed text)
 * @param source - 'voice' or 'text'
 * @returns Extracted tasks with confidence scores
 */
export async function extractTasksFromText(
  inputText: string,
  source: 'voice' | 'text' = 'text'
): Promise<TaskExtractionResult> {
  console.log('[TaskExtraction] Starting extraction:', {
    source,
    inputLength: inputText.length,
  });

  try {
    // Get API key from environment
    const apiKey = process.env.EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error('OpenAI API key not configured. Please add it in the ENV tab.');
    }

    const systemPrompt = `You are an AI assistant that extracts actionable tasks from user input.

Your job:
1. Identify discrete, actionable tasks
2. Extract titles, notes, assignees, due dates, and estimated units (hours)
3. Provide confidence scores for assignee and due date extraction
4. Capture non-task information separately
5. Ask clarifying questions when details are ambiguous

Rules:
- A task must be actionable (e.g., "Research competitors" is a task, "I'm worried about market fit" is not)
- Default assignee is 'speaker' unless specified
- Due dates should be ISO 8601 format (YYYY-MM-DD) or null
- Units are estimated hours (default: 1 for small tasks, 2-4 for medium, 8+ for large)
- Confidence scores: 100 = explicitly stated, 70 = strongly implied, 40 = weakly implied, 0 = guessed
- Extract all tasks mentioned, even if multiple in one sentence

Return JSON in this exact format:
{
  "tasks": [
    {
      "title": "Task title (imperative form, e.g., 'Review marketing plan')",
      "notes": "Additional context or details",
      "assignee_default": "speaker",
      "due_date": "2024-01-15",
      "units": 2,
      "confidence_assignee": 100,
      "confidence_due": 70
    }
  ],
  "non_task_notes": "Any non-actionable information (observations, questions, concerns)",
  "clarifying_questions": [
    "Who should be assigned to [task]?",
    "When is [task] due?"
  ]
}`;

    const userPrompt = source === 'voice'
      ? `Extract tasks from this voice transcript:\n\n"${inputText}"\n\nRemember: voice transcripts may have errors or informal language. Interpret generously.`
      : `Extract tasks from this text input:\n\n"${inputText}"`;

    console.log('[TaskExtraction] Calling OpenAI API...');

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
        response_format: { type: 'json_object' },
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log('[TaskExtraction] OpenAI error:', errorText);

      // Provide user-friendly error messages
      if (errorText.includes('API key') || response.status === 401) {
        throw new Error('OpenAI API key is invalid or not configured');
      }
      if (errorText.includes('quota') || errorText.includes('rate') || response.status === 429) {
        throw new Error('API quota exceeded. Please try again later.');
      }

      throw new Error(`Task extraction failed: ${response.status}`);
    }

    const data = await response.json();

    if (!data.choices?.[0]?.message?.content) {
      throw new Error('No response from AI');
    }

    const content = data.choices[0].message.content;
    const parsed = JSON.parse(content);

    const result: TaskExtractionResult = {
      tasks: parsed.tasks || [],
      non_task_notes: parsed.non_task_notes || '',
      clarifying_questions: parsed.clarifying_questions || [],
    };

    console.log('[TaskExtraction] Extraction successful:', {
      tasksCount: result.tasks.length,
      hasNotes: !!result.non_task_notes,
      questionsCount: result.clarifying_questions.length,
    });

    return result;
  } catch (error: any) {
    console.log('[TaskExtraction] Extraction failed:', error);
    throw new Error(`Failed to extract tasks: ${error.message}`);
  }
}
