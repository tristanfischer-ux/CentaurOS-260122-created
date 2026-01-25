/**
 * Marketplace Wizard Interpret API
 *
 * Converts natural language requests into structured search filters.
 * Uses Claude API server-side only.
 *
 * POST /api/marketplace/wizard/interpret
 * Body: {
 *   natural_language_query: string
 * }
 *
 * Response: {
 *   filters: {
 *     org_type?: string[],
 *     regions?: string[],
 *     sector_focus?: string[],
 *     stage_focus?: string[],
 *     capability_tags?: string[]
 *   },
 *   reasoning: string
 * }
 */

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.EXPO_PUBLIC_CENTAUROS_ANTHROPIC_API_KEY!,
});

interface InterpretRequest {
  natural_language_query: string;
}

interface SearchFilters {
  org_type?: string[];
  regions?: string[];
  sector_focus?: string[];
  stage_focus?: string[];
  capability_tags?: string[];
}

interface InterpretResponse {
  filters: SearchFilters;
  reasoning: string;
}

const SYSTEM_PROMPT = `You are a marketplace search assistant for Centaur OS, helping hardware startup founders find relevant organizations.

Your task is to convert natural language queries into structured search filters.

Available filter fields:
- org_type: ['VC', 'PE', 'Angel', 'LawFirm', 'Accountancy', 'Manufacturer', 'Advisor']
- regions: ['London', 'Cambridge', 'Scotland', 'UK-wide', 'Europe', 'USA', 'Global', etc.]
- sector_focus: ['robotics', 'deeptech', 'AI', 'medtech', 'life_sciences', 'IoT', 'hardware', 'manufacturing', 'technology', etc.]
- stage_focus: ['pre-seed', 'seed', 'series_a', 'series_b', 'series_c', 'growth']
- capability_tags: ['venture_capital_law', 'tech_transactions', 'eis', 'seis', 'cnc', 'injection_molding', 'pcba', '3d_printing', 'laser_cutting', 'iso13485', etc.]

Guidelines:
1. Be inclusive - if unsure, include multiple related tags
2. For geographic queries, include both specific cities and broader regions
3. For stage queries, include adjacent stages (e.g., "early stage" → ['pre-seed', 'seed', 'series_a'])
4. Normalize sector terms (e.g., "robotics" and "automation" → ['robotics', 'automation', 'AI'])
5. If query mentions "investors" or "funding", set org_type to ['VC', 'PE', 'Angel']
6. If query mentions "lawyers" or "legal", set org_type to ['LawFirm']
7. If query mentions "accountants" or "tax", set org_type to ['Accountancy']
8. If query mentions "manufacturing" or "suppliers", set org_type to ['Manufacturer']

Respond with JSON only in this format:
{
  "filters": {
    "org_type": [...],
    "regions": [...],
    "sector_focus": [...],
    "stage_focus": [...],
    "capability_tags": [...]
  },
  "reasoning": "Brief explanation of how you interpreted the query"
}`;

export async function POST(request: Request): Promise<Response> {
  try {
    const body: InterpretRequest = await request.json();
    const { natural_language_query } = body;

    if (!natural_language_query || natural_language_query.trim().length === 0) {
      return Response.json(
        { error: 'natural_language_query is required' },
        { status: 400 }
      );
    }

    // Call Claude API
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20241022',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: natural_language_query,
        },
      ],
    });

    // Extract JSON response
    const textContent = message.content.find((block: Anthropic.ContentBlock) => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      console.error('[wizard/interpret] No text content in Claude response');
      return Response.json(
        { error: 'Failed to interpret query' },
        { status: 500 }
      );
    }

    // Parse JSON from Claude's response
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[wizard/interpret] No JSON found in Claude response:', textContent.text);
      return Response.json(
        { error: 'Failed to parse interpretation' },
        { status: 500 }
      );
    }

    const interpretation: InterpretResponse = JSON.parse(jsonMatch[0]);

    return Response.json(interpretation);
  } catch (err) {
    console.error('[wizard/interpret] Unexpected error:', err);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
