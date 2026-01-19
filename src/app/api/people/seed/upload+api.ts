/**
 * People Seed Upload API
 *
 * POST - Upload CSV/JSON data to create stubs
 */

import { createClient } from '@supabase/supabase-js';
import type {
  SeedRow,
  SeedUploadResult,
  SeedSourceType,
  PeopleApiResponse,
  RoleArchetype,
  SectorTag,
} from '@/lib/people/types';
import { ROLE_ARCHETYPES, SECTOR_TAGS } from '@/lib/people/types';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function getSupabaseClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error('Missing Supabase credentials');
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// Parse CSV text to rows
function parseCSV(text: string): SeedRow[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
  const rows: SeedRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
    const row: Record<string, string> = {};

    headers.forEach((header, idx) => {
      row[header] = values[idx] || '';
    });

    if (row.name) {
      rows.push({
        name: row.name,
        linkedin_url: row.linkedin_url || row.linkedin,
        role_archetype: row.role_archetype as RoleArchetype | undefined,
        sector_tags: row.sector_tags || row.sectors,
        notes: row.notes,
        email: row.email,
      });
    }
  }

  return rows;
}

// Validate role archetype
function isValidRoleArchetype(role: string | undefined): role is RoleArchetype {
  if (!role) return false;
  return Object.keys(ROLE_ARCHETYPES).includes(role);
}

// Parse sector tags string to array
function parseSectorTags(tagsStr: string | undefined): SectorTag[] {
  if (!tagsStr) return [];
  const tags = tagsStr.split(/[;,]/).map(t => t.trim().toLowerCase());
  return tags.filter(t => SECTOR_TAGS.includes(t as SectorTag)) as SectorTag[];
}

// Normalize LinkedIn URL
function normalizeLinkedInUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  // Remove trailing slashes and ensure https
  let normalized = url.trim().replace(/\/$/, '');
  if (normalized.startsWith('linkedin.com') || normalized.startsWith('www.linkedin.com')) {
    normalized = 'https://' + normalized;
  }
  if (!normalized.includes('linkedin.com')) return undefined;
  return normalized;
}

interface UploadRequest {
  workspace_id: string;
  user_id: string;
  source_type: SeedSourceType;
  source_name?: string;
  data: string | SeedRow[]; // CSV text or JSON array
  data_format: 'csv' | 'json';
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as UploadRequest;

    if (!body.workspace_id || !body.user_id) {
      return Response.json(
        { success: false, error: 'workspace_id and user_id are required' } as PeopleApiResponse<null>,
        { status: 400 }
      );
    }

    // Parse input data
    let rows: SeedRow[];
    if (body.data_format === 'csv') {
      rows = parseCSV(body.data as string);
    } else {
      rows = body.data as SeedRow[];
    }

    if (rows.length === 0) {
      return Response.json(
        { success: false, error: 'No valid rows found in upload data' } as PeopleApiResponse<null>,
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Track results
    const result: SeedUploadResult = {
      batch_id: '',
      total_rows: rows.length,
      created: 0,
      duplicates: 0,
      errors: 0,
      created_person_ids: [],
      duplicate_matches: [],
      error_details: [],
    };

    // Create batch record
    const { data: batch, error: batchError } = await supabase
      .from('seed_batches')
      .insert({
        source_type: body.source_type,
        source_name: body.source_name,
        total_rows: rows.length,
        workspace_id: body.workspace_id,
        created_by_user_id: body.user_id,
        raw_data_json: rows,
      })
      .select()
      .single();

    if (batchError) {
      console.error('[Seed] Batch creation error:', batchError);
      // Continue without batch tracking
    } else {
      result.batch_id = batch.id;
    }

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      try {
        // Normalize LinkedIn URL
        const linkedinUrl = normalizeLinkedInUrl(row.linkedin_url);

        // Check for duplicates
        const { data: dupes } = await supabase.rpc('check_person_duplicates', {
          p_linkedin_url: linkedinUrl || '',
          p_name: row.name,
          p_email: row.email || null,
        });

        if (dupes && dupes.length > 0) {
          result.duplicates++;
          result.duplicate_matches.push({
            row_index: i,
            input_name: row.name,
            match_id: dupes[0].id,
            match_name: dupes[0].display_name,
            match_type: dupes[0].match_type,
          });
          continue;
        }

        // Determine person type from role archetype
        let personType = 'other';
        if (row.role_archetype) {
          if (row.role_archetype.startsWith('fractional_')) personType = 'fractional_exec';
          else if (row.role_archetype.startsWith('advisor_')) personType = 'advisor';
          else if (row.role_archetype.startsWith('apprentice_')) personType = 'apprentice';
          else if (row.role_archetype.startsWith('contractor_')) personType = 'contractor';
        }

        // Parse sector tags
        const sectorTags = parseSectorTags(row.sector_tags);

        // Create stub person
        const { data: person, error: personError } = await supabase
          .from('universal_people')
          .insert({
            display_name: row.name.trim(),
            person_type: personType,
            role_archetypes: isValidRoleArchetype(row.role_archetype) ? [row.role_archetype] : [],
            sector_tags: sectorTags,
            location_country: 'UK',
            timezone: 'Europe/London',
            remote_ok: true,
            notice_period_weeks: 0,
            seniority_band: personType === 'apprentice' ? 'junior' : 'senior',
            verification_status: 'stub',
            profile_visibility: 'private',
            confidence_score: 20,
            source_type: body.source_type === 'event' ? 'event' : 'manual',
            source_notes: body.source_name
              ? `${body.source_name}${row.notes ? ': ' + row.notes : ''}`
              : row.notes,
          })
          .select()
          .single();

        if (personError) {
          throw new Error(personError.message);
        }

        // Add LinkedIn contact if provided
        if (linkedinUrl) {
          await supabase.from('universal_people_contacts').insert({
            person_id: person.id,
            contact_type: 'linkedin',
            contact_value: linkedinUrl,
            visibility: 'private',
            is_public: false,
            is_primary: true,
          });
        }

        // Add email contact if provided (always private for stubs)
        if (row.email) {
          await supabase.from('universal_people_contacts').insert({
            person_id: person.id,
            contact_type: 'email',
            contact_value: row.email.toLowerCase().trim(),
            visibility: 'private',
            is_public: false,
            is_primary: true,
          });
        }

        result.created++;
        result.created_person_ids.push(person.id);
      } catch (err) {
        result.errors++;
        result.error_details.push({
          row_index: i,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    // Update batch with final counts
    if (batch?.id) {
      await supabase
        .from('seed_batches')
        .update({
          created_count: result.created,
          duplicate_count: result.duplicates,
          error_count: result.errors,
          error_details_json: result.error_details,
        })
        .eq('id', batch.id);
    }

    return Response.json({
      success: true,
      data: result,
    } as PeopleApiResponse<SeedUploadResult>);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Seed] Upload error:', message);
    return Response.json(
      { success: false, error: message } as PeopleApiResponse<null>,
      { status: 500 }
    );
  }
}
