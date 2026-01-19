/**
 * People Search API
 *
 * GET - Search marketplace for people
 * POST - Advanced search with filters
 */

import { createClient } from '@supabase/supabase-js';
import type {
  PeopleSearchFilters,
  PeopleSearchResult,
  PeopleApiResponse,
} from '@/lib/people/types';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

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
// GET - Simple search with query params
// ============================================================================

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);

    const filters: PeopleSearchFilters = {
      query: url.searchParams.get('q') || undefined,
      person_type: url.searchParams.get('person_type') as PeopleSearchFilters['person_type'],
      seniority_band: url.searchParams.get('seniority') as PeopleSearchFilters['seniority_band'],
      role_archetypes: url.searchParams.get('roles')?.split(',') as PeopleSearchFilters['role_archetypes'],
      sector_tags: url.searchParams.get('sectors')?.split(',') as PeopleSearchFilters['sector_tags'],
      stage_fit_tags: url.searchParams.get('stages')?.split(',') as PeopleSearchFilters['stage_fit_tags'],
      location_country: url.searchParams.get('country') || undefined,
      remote_ok: url.searchParams.get('remote') === 'true' ? true : undefined,
      min_hours: url.searchParams.get('min_hours') ? parseInt(url.searchParams.get('min_hours')!) : undefined,
      max_hours: url.searchParams.get('max_hours') ? parseInt(url.searchParams.get('max_hours')!) : undefined,
      limit: Math.min(parseInt(url.searchParams.get('limit') || '20'), 50),
      offset: parseInt(url.searchParams.get('offset') || '0'),
    };

    const results = await searchPeople(filters);

    return Response.json({
      success: true,
      data: results,
    } as PeopleApiResponse<PeopleSearchResult[]>);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[People Search] GET error:', message);
    return Response.json(
      { success: false, error: message } as PeopleApiResponse<null>,
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Advanced search with complex filters
// ============================================================================

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as PeopleSearchFilters;

    // Enforce limits
    body.limit = Math.min(body.limit || 20, 50);
    body.offset = body.offset || 0;

    const results = await searchPeople(body);

    return Response.json({
      success: true,
      data: results,
    } as PeopleApiResponse<PeopleSearchResult[]>);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[People Search] POST error:', message);
    return Response.json(
      { success: false, error: message } as PeopleApiResponse<null>,
      { status: 500 }
    );
  }
}

// ============================================================================
// Search Implementation
// ============================================================================

async function searchPeople(filters: PeopleSearchFilters): Promise<PeopleSearchResult[]> {
  const supabase = getSupabaseClient();

  // Use the database function for optimal performance
  const { data, error } = await supabase.rpc('search_marketplace_people', {
    p_query: filters.query || null,
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
    p_limit: filters.limit || 20,
    p_offset: filters.offset || 0,
  });

  if (error) {
    console.error('[People Search] RPC error:', error);
    throw new Error('Search failed');
  }

  if (!data || data.length === 0) {
    return [];
  }

  // Get public contacts for results
  const personIds = data.map((p: PeopleSearchResult) => p.id);

  const { data: contacts } = await supabase
    .from('universal_people_contacts')
    .select('*')
    .in('person_id', personIds)
    .eq('visibility', 'marketplace')
    .eq('is_public', true);

  // Build contact map
  const contactMap = new Map<string, typeof contacts>();
  for (const contact of contacts || []) {
    const existing = contactMap.get(contact.person_id) || [];
    existing.push(contact);
    contactMap.set(contact.person_id, existing);
  }

  // Enrich results with contacts and match explanations
  const results: PeopleSearchResult[] = data.map((person: PeopleSearchResult) => ({
    ...person,
    contacts: contactMap.get(person.id) || [],
    match_explanation: buildMatchExplanation(person, filters),
  }));

  return results;
}

function buildMatchExplanation(
  person: PeopleSearchResult,
  filters: PeopleSearchFilters
): string[] {
  const explanations: string[] = [];

  // Role match
  if (filters.role_archetypes && person.role_archetypes) {
    const matchedRoles = filters.role_archetypes.filter(r =>
      person.role_archetypes.includes(r)
    );
    if (matchedRoles.length > 0) {
      explanations.push(`Matches requested role: ${matchedRoles.join(', ')}`);
    }
  }

  // Sector match
  if (filters.sector_tags && person.sector_tags) {
    const matchedSectors = filters.sector_tags.filter(s =>
      person.sector_tags.includes(s)
    );
    if (matchedSectors.length > 0) {
      explanations.push(`Experience in: ${matchedSectors.join(', ')}`);
    }
  }

  // Stage match
  if (filters.stage_fit_tags && person.stage_fit_tags) {
    const matchedStages = filters.stage_fit_tags.filter(s =>
      person.stage_fit_tags.includes(s)
    );
    if (matchedStages.length > 0) {
      explanations.push(`Suited for: ${matchedStages.join(', ')} stage`);
    }
  }

  // Availability
  if (person.availability_hours_per_week) {
    explanations.push(`Available ${person.availability_hours_per_week} hrs/week`);
  }

  // Verification
  if (person.verification_status === 'verified') {
    explanations.push('Verified profile');
  }

  // Location
  if (person.remote_ok) {
    explanations.push('Remote OK');
  }

  return explanations;
}
