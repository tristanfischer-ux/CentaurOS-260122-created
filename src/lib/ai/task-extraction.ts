/**
 * Task Extraction via Server Route
 * Uses server-side API to keep API keys secure
 */

import Constants from 'expo-constants';
import { Platform } from 'react-native';

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
 * Get the API base URL for the current environment
 */
function getApiUrl(): string {
  if (Platform.OS === 'web') {
    return ''; // Relative URLs work on web
  }

  // For native, construct the dev server URL
  const debuggerHost = Constants.expoConfig?.hostUri;
  if (debuggerHost) {
    const host = debuggerHost.split(':').shift();
    return `http://${host}:8081`;
  }

  // Fallback to localhost
  return 'http://localhost:8081';
}

/**
 * Extract tasks from text using server-side AI
 * @param inputText - User input (voice transcript or typed text)
 * @param source - 'voice' or 'text'
 * @returns Extracted tasks with confidence scores
 */
export async function extractTasksFromText(
  inputText: string,
  source: 'voice' | 'text' = 'text'
): Promise<TaskExtractionResult> {
  console.log('[TaskExtraction] Starting extraction via server route:', {
    source,
    inputLength: inputText.length,
  });

  try {
    const apiUrl = getApiUrl();
    const url = `${apiUrl}/api/ai/extract-tasks`;

    console.log('[TaskExtraction] Calling:', url);

    // Call server-side API route (keeps API key secure)
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputText,
        source,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.log('[TaskExtraction] Server error:', data);

      // Provide user-friendly error messages
      if (data.error?.includes('API key')) {
        throw new Error('OpenAI API key is invalid or not configured');
      }
      if (data.error?.includes('quota') || data.error?.includes('rate')) {
        throw new Error('API quota exceeded. Please try again later.');
      }
      if (data.error?.includes('invalid format')) {
        throw new Error('AI returned invalid format. Please try again.');
      }

      throw new Error(data.error || `Task extraction failed: ${response.status}`);
    }

    const result: TaskExtractionResult = {
      tasks: data.tasks || [],
      non_task_notes: data.non_task_notes || '',
      clarifying_questions: data.clarifying_questions || [],
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
