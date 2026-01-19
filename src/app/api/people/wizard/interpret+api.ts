/**
 * Talent Matching Wizard - Interpret API
 *
 * POST - Interpret natural language request into search filters
 */

import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import type {
  WizardRequest,
  WizardInterpretation,
  WizardResponse,
  PeopleSearchFilters,
  PeopleSearchResult,
  PeopleApiResponse,
} from '@/lib/people/types';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';

const WIZARD_ENABLED = process.env.PEOPLE_WIZARD_LLM_ENABLED !== 'false';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClientType = ReturnType<typeof createClient<any>>;

function getSupabaseClient(): SupabaseClientType {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error('Missing Supabase credentials');
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// ============================================================================
// POST - Interpret request and search
// ============================================================================

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as WizardRequest;

    const input = body.transcript || body.text;

    if (!input || input.trim().length < 10) {
      return Response.json(
        { success: false, error: 'Please provide more details about who you are looking for' } as PeopleApiResponse<null>,
        { status: 400 }
      );
    }

    let interpretation: WizardInterpretation;

    // Try LLM interpretation if enabled and API key available
    if (WIZARD_ENABLED && ANTHROPIC_API_KEY) {
      interpretation = await interpretWithClaude(input);
    } else {
      // Fallback to keyword-based interpretation
      interpretation = interpretWithKeywords(input);
    }

    // Build search filters from interpretation
    const filters: PeopleSearchFilters = buildFiltersFromInterpretation(interpretation);

    // Execute search
    const supabase = getSupabaseClient();
    const { data: results, error: searchError } = await supabase.rpc('search_marketplace_people', {
      p_query: null,
      p_person_type: filters.person_type || null,
      p_seniority_band: filters.seniority_band || null,
      p_role_archetypes: filters.role_archetypes || null,
      p_sector_tags: filters.sector_tags || null,
      p_skill_tags: filters.skill_tags || null,
      p_stage_fit_tags: filters.stage_fit_tags || null,
      p_location_country: filters.location_country || null,
      p_remote_ok: filters.remote_ok ?? null,
      p_min_hours: filters.min_hours ?? null,
      p_max_hours: filters.max_hours ?? null,
      p_limit: 20,
      p_offset: 0,
    });

    if (searchError) {
      console.error('[Wizard] Search error:', searchError);
      throw new Error('Search failed');
    }

    // Build suggestions if no results
    const suggestions: string[] = [];
    if (!results || results.length === 0) {
      suggestions.push('Try broadening your search criteria');
      if (filters.stage_fit_tags?.length) {
        suggestions.push('Consider removing stage requirements');
      }
      if (filters.sector_tags?.length) {
        suggestions.push('Consider searching across more sectors');
      }
      if (!filters.remote_ok) {
        suggestions.push('Enable "remote OK" to see more candidates');
      }
    }

    const response: WizardResponse = {
      interpretation,
      search_results: (results || []) as PeopleSearchResult[],
      suggestions: suggestions.length > 0 ? suggestions : undefined,
    };

    return Response.json({
      success: true,
      data: response,
    } as PeopleApiResponse<WizardResponse>);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Wizard] POST error:', message);
    return Response.json(
      { success: false, error: message } as PeopleApiResponse<null>,
      { status: 500 }
    );
  }
}

// ============================================================================
// Claude Interpretation
// ============================================================================

async function interpretWithClaude(input: string): Promise<WizardInterpretation> {
  const client = new Anthropic({
    apiKey: ANTHROPIC_API_KEY,
  });

  const systemPrompt = `You are a talent matching assistant for a platform connecting companies with fractional executives and apprentices.

Your task is to interpret a user's request for hiring help and extract structured information.

Available role archetypes:
- Fractional executives: fractional_ceo, fractional_coo, fractional_cfo, fractional_cto, fractional_cmo, fractional_cpo, fractional_cro, fractional_chro, fractional_cso, fractional_cdo
- Advisors: advisor_board, advisor_strategic, advisor_technical, advisor_industry, advisor_investor
- Contractors: contractor_engineering, contractor_design, contractor_marketing, contractor_sales, contractor_ops, contractor_finance
- Apprentices: apprentice_finance, apprentice_ops, apprentice_engineering, apprentice_cad, apprentice_sales, apprentice_marketing, apprentice_data

Available sector tags:
saas, fintech, healthtech, edtech, proptech, hardware, robotics, manufacturing, consumer, ecommerce, b2b, enterprise, ai_ml, cybersecurity, climatetech, deeptech

Available stage fit tags:
idea, mvp, pre_seed, seed, series_a, series_b, series_c_plus, growth, scale, turnaround, exit

Respond with a JSON object (no markdown, just valid JSON):
{
  "role": "primary role archetype from list above",
  "role_alternatives": ["alternative roles if applicable"],
  "sectors": ["relevant sector tags"],
  "stages": ["relevant stage fit tags"],
  "location": "country if mentioned, null otherwise",
  "remote_ok": true/false/null,
  "hours_per_week": number or null,
  "urgency": "low"/"medium"/"high" based on language used,
  "additional_requirements": ["any specific skills or requirements mentioned"],
  "raw_intent": "one sentence summary of what they need",
  "confidence": 0-100 how confident you are in the interpretation
}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: `Interpret this hiring request:\n\n"${input}"`,
      },
    ],
  });

  // Extract text content
  const textContent = response.content.find(c => c.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    console.error('[Wizard] No text response from Claude');
    return interpretWithKeywords(input);
  }

  try {
    const parsed = JSON.parse(textContent.text);
    return {
      role: parsed.role,
      role_alternatives: parsed.role_alternatives,
      sectors: parsed.sectors,
      stages: parsed.stages,
      location: parsed.location,
      remote_ok: parsed.remote_ok,
      hours_per_week: parsed.hours_per_week,
      urgency: parsed.urgency,
      additional_requirements: parsed.additional_requirements,
      raw_intent: parsed.raw_intent,
      confidence: parsed.confidence || 70,
    };
  } catch (parseError) {
    console.error('[Wizard] Failed to parse Claude response:', parseError);
    return interpretWithKeywords(input);
  }
}

// ============================================================================
// Keyword-based Fallback
// ============================================================================

function interpretWithKeywords(input: string): WizardInterpretation {
  const lowered = input.toLowerCase();

  // Role detection
  let role: WizardInterpretation['role'];
  const roleAlternatives: WizardInterpretation['role_alternatives'] = [];

  if (lowered.includes('coo') || lowered.includes('operations') || lowered.includes('ops')) {
    role = 'fractional_coo';
  } else if (lowered.includes('cfo') || lowered.includes('finance') || lowered.includes('financial')) {
    role = 'fractional_cfo';
  } else if (lowered.includes('cto') || lowered.includes('technology') || lowered.includes('tech lead')) {
    role = 'fractional_cto';
  } else if (lowered.includes('cmo') || lowered.includes('marketing')) {
    role = 'fractional_cmo';
  } else if (lowered.includes('cpo') || lowered.includes('product')) {
    role = 'fractional_cpo';
  } else if (lowered.includes('sales') || lowered.includes('revenue') || lowered.includes('cro')) {
    role = 'fractional_cro';
  } else if (lowered.includes('hr') || lowered.includes('people') || lowered.includes('chro')) {
    role = 'fractional_chro';
  } else if (lowered.includes('ceo') || lowered.includes('leader') || lowered.includes('strategy')) {
    role = 'fractional_ceo';
  }

  // Apprentice detection
  if (lowered.includes('apprentice') || lowered.includes('junior') || lowered.includes('intern')) {
    if (lowered.includes('finance') || lowered.includes('fp&a')) {
      role = 'apprentice_finance';
    } else if (lowered.includes('ops') || lowered.includes('operations')) {
      role = 'apprentice_ops';
    } else if (lowered.includes('engineering') || lowered.includes('developer')) {
      role = 'apprentice_engineering';
    } else if (lowered.includes('cad') || lowered.includes('design')) {
      role = 'apprentice_cad';
    } else if (lowered.includes('sales')) {
      role = 'apprentice_sales';
    } else if (lowered.includes('marketing')) {
      role = 'apprentice_marketing';
    } else {
      role = 'apprentice_ops'; // Default apprentice type
    }
  }

  // Sector detection
  const sectors: WizardInterpretation['sectors'] = [];
  if (lowered.includes('fintech') || lowered.includes('financial services')) sectors.push('fintech');
  if (lowered.includes('saas') || lowered.includes('software')) sectors.push('saas');
  if (lowered.includes('hardware') || lowered.includes('physical product')) sectors.push('hardware');
  if (lowered.includes('health') || lowered.includes('medical')) sectors.push('healthtech');
  if (lowered.includes('edtech') || lowered.includes('education')) sectors.push('edtech');
  if (lowered.includes('ecommerce') || lowered.includes('retail')) sectors.push('ecommerce');
  if (lowered.includes('ai') || lowered.includes('machine learning')) sectors.push('ai_ml');
  if (lowered.includes('manufacturing')) sectors.push('manufacturing');
  if (lowered.includes('robotics')) sectors.push('robotics');
  if (lowered.includes('climate') || lowered.includes('green') || lowered.includes('sustainable')) sectors.push('climatetech');

  // Stage detection
  const stages: WizardInterpretation['stages'] = [];
  if (lowered.includes('pre-seed') || lowered.includes('preseed')) stages.push('pre_seed');
  if (lowered.includes('seed')) stages.push('seed');
  if (lowered.includes('series a')) stages.push('series_a');
  if (lowered.includes('series b')) stages.push('series_b');
  if (lowered.includes('series c') || lowered.includes('late stage')) stages.push('series_c_plus');
  if (lowered.includes('growth')) stages.push('growth');
  if (lowered.includes('scale') || lowered.includes('scaling')) stages.push('scale');
  if (lowered.includes('turnaround')) stages.push('turnaround');
  if (lowered.includes('mvp') || lowered.includes('early')) stages.push('mvp');

  // Hours detection
  let hoursPerWeek: number | undefined;
  const hoursMatch = lowered.match(/(\d+)\s*(?:hours?|hrs?)/);
  const daysMatch = lowered.match(/(\d+)\s*days?/);
  if (hoursMatch) {
    hoursPerWeek = parseInt(hoursMatch[1]);
  } else if (daysMatch) {
    hoursPerWeek = parseInt(daysMatch[1]) * 8;
  }

  // Remote detection
  const remoteOk = lowered.includes('remote') ? true : undefined;

  // Urgency detection
  let urgency: WizardInterpretation['urgency'] = 'medium';
  if (lowered.includes('urgent') || lowered.includes('asap') || lowered.includes('immediately')) {
    urgency = 'high';
  } else if (lowered.includes('eventually') || lowered.includes('no rush') || lowered.includes('planning')) {
    urgency = 'low';
  }

  return {
    role,
    role_alternatives: roleAlternatives.length > 0 ? roleAlternatives : undefined,
    sectors: sectors.length > 0 ? sectors : undefined,
    stages: stages.length > 0 ? stages : undefined,
    location: undefined,
    remote_ok: remoteOk,
    hours_per_week: hoursPerWeek,
    urgency,
    additional_requirements: undefined,
    raw_intent: `Looking for ${role || 'talent'}${sectors.length > 0 ? ` in ${sectors.join('/')}` : ''}`,
    confidence: 50, // Lower confidence for keyword-based
  };
}

// ============================================================================
// Build Filters from Interpretation
// ============================================================================

function buildFiltersFromInterpretation(interpretation: WizardInterpretation): PeopleSearchFilters {
  const filters: PeopleSearchFilters = {
    limit: 20,
    offset: 0,
  };

  // Role
  if (interpretation.role) {
    const allRoles = [interpretation.role];
    if (interpretation.role_alternatives) {
      allRoles.push(...interpretation.role_alternatives);
    }
    filters.role_archetypes = allRoles as PeopleSearchFilters['role_archetypes'];

    // Infer person type from role
    if (interpretation.role.startsWith('apprentice_')) {
      filters.person_type = 'apprentice';
    } else if (interpretation.role.startsWith('fractional_')) {
      filters.person_type = 'fractional_exec';
    } else if (interpretation.role.startsWith('advisor_')) {
      filters.person_type = 'advisor';
    } else if (interpretation.role.startsWith('contractor_')) {
      filters.person_type = 'contractor';
    }
  }

  // Sectors
  if (interpretation.sectors && interpretation.sectors.length > 0) {
    filters.sector_tags = interpretation.sectors as PeopleSearchFilters['sector_tags'];
  }

  // Stages
  if (interpretation.stages && interpretation.stages.length > 0) {
    filters.stage_fit_tags = interpretation.stages as PeopleSearchFilters['stage_fit_tags'];
  }

  // Location
  if (interpretation.location) {
    filters.location_country = interpretation.location;
  }

  // Remote
  if (interpretation.remote_ok !== undefined) {
    filters.remote_ok = interpretation.remote_ok;
  }

  // Hours
  if (interpretation.hours_per_week) {
    // Search for people available at least that many hours
    filters.min_hours = Math.max(interpretation.hours_per_week - 4, 0);
  }

  return filters;
}
