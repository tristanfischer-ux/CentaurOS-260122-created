/**
 * Marketplace Search API
 *
 * Accepts structured filters and returns ranked results from directory_orgs.
 *
 * Ranking rules:
 * - Curated results always rank above external
 * - Within curated: confidence_score DESC, last_verified_at DESC, tag match count DESC
 *
 * POST /api/marketplace/search
 * Body: {
 *   query_text?: string,
 *   filters?: {
 *     org_type?: string[],
 *     regions?: string[],
 *     sector_focus?: string[],
 *     stage_focus?: string[],
 *     capability_tags?: string[]
 *   },
 *   limit?: number
 * }
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Server-side client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

interface SearchFilters {
  org_type?: string[];
  regions?: string[];
  sector_focus?: string[];
  stage_focus?: string[];
  capability_tags?: string[];
}

interface SearchRequest {
  query_text?: string;
  filters?: SearchFilters;
  limit?: number;
}

interface SearchResult {
  id: string;
  name: string;
  org_type: string;
  website: string | null;
  website_domain: string | null;
  companies_house_number: string | null;
  hq_city: string | null;
  hq_country: string;
  regions: string[];
  sector_focus: string[];
  stage_focus: string[];
  capability_tags: string[];
  description_1liner: string | null;
  preferred_contact_method: string | null;
  notes: string | null;
  confidence_score: number;
  last_verified_at: string | null;
  created_at: string;
  updated_at: string;
  // Computed fields
  tag_match_count: number;
  is_curated: boolean;
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body: SearchRequest = await request.json();
    const { query_text, filters, limit = 20 } = body;

    // Build the base query
    let query = supabase
      .from('directory_orgs')
      .select('*');

    // Apply filters
    if (filters) {
      if (filters.org_type && filters.org_type.length > 0) {
        query = query.in('org_type', filters.org_type);
      }

      if (filters.regions && filters.regions.length > 0) {
        query = query.overlaps('regions', filters.regions);
      }

      if (filters.sector_focus && filters.sector_focus.length > 0) {
        query = query.overlaps('sector_focus', filters.sector_focus);
      }

      if (filters.stage_focus && filters.stage_focus.length > 0) {
        query = query.overlaps('stage_focus', filters.stage_focus);
      }

      if (filters.capability_tags && filters.capability_tags.length > 0) {
        query = query.overlaps('capability_tags', filters.capability_tags);
      }
    }

    // Text search on name if query_text provided
    if (query_text && query_text.trim().length > 0) {
      query = query.ilike('name', `%${query_text.trim()}%`);
    }

    // Execute query
    const { data: orgs, error } = await query;

    if (error) {
      console.error('[marketplace/search] Supabase error:', error);
      return Response.json({ error: 'Database query failed' }, { status: 500 });
    }

    if (!orgs || orgs.length === 0) {
      return Response.json({ results: [], total: 0 });
    }

    // Calculate tag match count for each org
    const allFilterTags = [
      ...(filters?.regions || []),
      ...(filters?.sector_focus || []),
      ...(filters?.stage_focus || []),
      ...(filters?.capability_tags || []),
    ];

    const results: SearchResult[] = orgs.map((org) => {
      const orgTags = [
        ...(org.regions || []),
        ...(org.sector_focus || []),
        ...(org.stage_focus || []),
        ...(org.capability_tags || []),
      ];

      const tagMatchCount = allFilterTags.filter((filterTag) =>
        orgTags.includes(filterTag)
      ).length;

      return {
        ...org,
        tag_match_count: tagMatchCount,
        is_curated: org.confidence_score >= 80,
      };
    });

    // Sort by ranking rules:
    // 1. Curated (confidence >= 80) first
    // 2. Within curated: confidence_score DESC
    // 3. last_verified_at DESC (nulls last)
    // 4. tag_match_count DESC
    results.sort((a, b) => {
      // Curated vs external
      if (a.is_curated !== b.is_curated) {
        return a.is_curated ? -1 : 1;
      }

      // Confidence score (higher is better)
      if (a.confidence_score !== b.confidence_score) {
        return b.confidence_score - a.confidence_score;
      }

      // Last verified (newer is better, nulls last)
      if (a.last_verified_at && b.last_verified_at) {
        return new Date(b.last_verified_at).getTime() - new Date(a.last_verified_at).getTime();
      }
      if (a.last_verified_at && !b.last_verified_at) return -1;
      if (!a.last_verified_at && b.last_verified_at) return 1;

      // Tag match count (more matches is better)
      return b.tag_match_count - a.tag_match_count;
    });

    // Apply limit
    const limitedResults = results.slice(0, limit);

    return Response.json({
      results: limitedResults,
      total: results.length,
    });
  } catch (err) {
    console.error('[marketplace/search] Unexpected error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
