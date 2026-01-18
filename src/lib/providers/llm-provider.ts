/**
 * LLM Provider Interface
 * Abstraction for LLM completion with mock fallback
 */

export interface LLMCompletionOptions {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  schema?: object; // For structured output
}

export interface LLMResponse {
  content: string;
  parsed?: any; // Parsed JSON if schema provided
}

export interface LLMProvider {
  complete(options: LLMCompletionOptions): Promise<LLMResponse>;
}

// ============================================================================
// ANTHROPIC PROVIDER
// ============================================================================

export class AnthropicProvider implements LLMProvider {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = 'claude-3-5-sonnet-20241022') {
    if (!apiKey) {
      throw new Error('Anthropic API key required');
    }
    this.apiKey = apiKey;
    this.model = model;
  }

  async complete(options: LLMCompletionOptions): Promise<LLMResponse> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: options.maxTokens || 4000,
        temperature: options.temperature || 0.7,
        system: options.systemPrompt || '',
        messages: [
          {
            role: 'user',
            content: options.prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const content = data.content?.[0]?.text || '';

    // Try to parse JSON if schema provided
    let parsed = undefined;
    if (options.schema && content.trim().startsWith('{')) {
      try {
        parsed = JSON.parse(content);
      } catch (e) {
        console.warn('Failed to parse LLM JSON response:', e);
      }
    }

    return {
      content,
      parsed,
    };
  }
}

// ============================================================================
// GOOGLE GEMINI PROVIDER
// ============================================================================

export class GoogleGeminiProvider implements LLMProvider {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = 'gemini-1.5-flash') {
    if (!apiKey) {
      throw new Error('Google AI API key required');
    }
    this.apiKey = apiKey;
    this.model = model;
  }

  async complete(options: LLMCompletionOptions): Promise<LLMResponse> {
    // Combine system prompt and user prompt for Gemini
    const fullPrompt = options.systemPrompt
      ? `${options.systemPrompt}\n\n${options.prompt}`
      : options.prompt;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`,
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
            temperature: options.temperature || 0.7,
            maxOutputTokens: options.maxTokens || 4000,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Google Gemini API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Try to parse JSON if schema provided
    let parsed = undefined;
    if (options.schema && content.trim().startsWith('{')) {
      try {
        parsed = JSON.parse(content);
      } catch (e) {
        console.warn('Failed to parse LLM JSON response:', e);
      }
    }

    return {
      content,
      parsed,
    };
  }
}

// ============================================================================
// MOCK PROVIDER (Dev Fallback)
// ============================================================================

export class MockLLMProvider implements LLMProvider {
  async complete(options: LLMCompletionOptions): Promise<LLMResponse> {
    console.log('[MockLLMProvider] Completing prompt (mock mode)');

    // Simple heuristic: check if prompt mentions task extraction
    if (options.prompt.toLowerCase().includes('extract') ||
        options.prompt.toLowerCase().includes('task')) {
      return this.mockTaskExtraction(options.prompt);
    }

    // Check if WHY turn generation
    if (options.prompt.toLowerCase().includes('question') ||
        options.prompt.toLowerCase().includes('brainstorm')) {
      return this.mockBrainstormTurn();
    }

    // Check if synthesis
    if (options.prompt.toLowerCase().includes('objective') ||
        options.prompt.toLowerCase().includes('synthesize')) {
      return this.mockSynthesis();
    }

    // Default: empty result
    return {
      content: JSON.stringify({
        tasks: [],
        non_task_notes: options.prompt,
      }),
      parsed: {
        tasks: [],
        non_task_notes: options.prompt,
      },
    };
  }

  private mockTaskExtraction(prompt: string): LLMResponse {
    // Very simple regex-based extraction for dev mode
    const lines = prompt.split('\n').filter(l => l.trim().length > 0);
    const tasks: any[] = [];

    for (const line of lines.slice(0, 3)) { // Max 3 tasks
      if (line.length > 10) {
        tasks.push({
          title: line.substring(0, 100),
          notes: '',
          assignee_default: 'speaker',
          due_date: null,
          units: 1,
          confidence_assignee: 30,
          confidence_due: 0,
        });
      }
    }

    const result = {
      tasks,
      non_task_notes: tasks.length === 0 ? 'No clear tasks detected in dev mode' : '',
      clarifying_questions: [],
    };

    return {
      content: JSON.stringify(result),
      parsed: result,
    };
  }

  private mockBrainstormTurn(): LLMResponse {
    const result = {
      assistant_message: "That's an interesting area to explore. Could you tell me more about your target customers and what problem you're solving for them?",
      updated_state: {
        topics_covered: ['initial_inquiry'],
        depth: 1,
      },
    };

    return {
      content: JSON.stringify(result),
      parsed: result,
    };
  }

  private mockSynthesis(): LLMResponse {
    const result = {
      objectives: [
        {
          title: 'Define target market and validate product-market fit',
          horizon: '90d',
          metric: 'Customer interviews completed',
        },
      ],
      task_drafts: [
        {
          title: 'Conduct customer discovery interviews',
          notes: 'Interview 10-15 potential customers',
          assignee_default: 'speaker',
          due_date: null,
          units: 3,
          confidence_assignee: 80,
          confidence_due: 0,
        },
      ],
      risks: ['Mock synthesis in dev mode'],
      assumptions: ['Using mock LLM provider'],
    };

    return {
      content: JSON.stringify(result),
      parsed: result,
    };
  }
}

// ============================================================================
// FACTORY
// ============================================================================

export function createLLMProvider(
  provider: string = 'mock',
  apiKey?: string,
  model?: string
): LLMProvider {
  if (provider === 'google' && apiKey) {
    return new GoogleGeminiProvider(apiKey, model);
  }

  if (provider === 'anthropic' && apiKey) {
    return new AnthropicProvider(apiKey, model);
  }

  if ((provider === 'google' || provider === 'anthropic') && !apiKey) {
    console.warn(`${provider} provider selected but no API key provided. Falling back to mock.`);
  }

  return new MockLLMProvider();
}
