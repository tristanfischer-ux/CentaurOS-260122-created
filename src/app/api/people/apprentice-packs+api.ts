/**
 * Apprentice Role Packs API
 *
 * GET - List available apprentice role packs
 * POST - Apply a role pack (generate task drafts)
 */

import { createClient } from '@supabase/supabase-js';
import type {
  ApprenticeRolePack,
  OutreachDraft,
  PeopleApiResponse,
  RoleArchetype,
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

// Default apprentice role packs (seeded from taxonomy)
const DEFAULT_ROLE_PACKS: Omit<ApprenticeRolePack, 'id' | 'created_at'>[] = [
  {
    name: 'Finance Apprentice',
    description: 'FP&A, bookkeeping, and financial analysis support',
    role_archetype: 'apprentice_finance',
    skill_requirements: ['financial_modeling', 'budgeting', 'fp_and_a'],
    typical_hours_per_week: 24,
    task_templates_json: [
      { title: 'Draft finance apprentice job posting', notes: 'Create job posting for finance apprentice role', source: 'people_apprentice_pack' },
      { title: 'Set up screening criteria', notes: 'Define key skills and qualities to look for', source: 'people_apprentice_pack' },
      { title: 'Prepare interview scorecard', notes: 'Create scoring rubric for finance skills assessment', source: 'people_apprentice_pack' },
      { title: 'Create onboarding checklist', notes: 'List tools, access, and training needed', source: 'people_apprentice_pack' },
    ],
  },
  {
    name: 'Ops Apprentice',
    description: 'Process optimization, admin support, and project coordination',
    role_archetype: 'apprentice_ops',
    skill_requirements: ['process_optimization', 'project_management', 'vendor_management'],
    typical_hours_per_week: 32,
    task_templates_json: [
      { title: 'Draft ops apprentice job posting', notes: 'Create job posting for ops apprentice role', source: 'people_apprentice_pack' },
      { title: 'Set up screening criteria', notes: 'Define key skills and qualities to look for', source: 'people_apprentice_pack' },
      { title: 'Prepare interview scorecard', notes: 'Create scoring rubric for ops skills assessment', source: 'people_apprentice_pack' },
      { title: 'Create onboarding checklist', notes: 'List tools, access, and training needed', source: 'people_apprentice_pack' },
    ],
  },
  {
    name: 'Engineering Apprentice',
    description: 'Junior software development and technical support',
    role_archetype: 'apprentice_engineering',
    skill_requirements: ['software_architecture', 'devops', 'technical_hiring'],
    typical_hours_per_week: 32,
    task_templates_json: [
      { title: 'Draft engineering apprentice job posting', notes: 'Create job posting for engineering apprentice role', source: 'people_apprentice_pack' },
      { title: 'Set up technical screening', notes: 'Define coding challenges and technical requirements', source: 'people_apprentice_pack' },
      { title: 'Prepare technical interview', notes: 'Create technical assessment and pair programming exercise', source: 'people_apprentice_pack' },
      { title: 'Create engineering onboarding', notes: 'Set up dev environment, repos, and documentation access', source: 'people_apprentice_pack' },
    ],
  },
  {
    name: 'CAD/Design Apprentice',
    description: 'Mechanical design and product engineering support',
    role_archetype: 'apprentice_cad',
    skill_requirements: ['hardware_development', 'manufacturing_ops'],
    typical_hours_per_week: 32,
    task_templates_json: [
      { title: 'Draft CAD apprentice job posting', notes: 'Create job posting for CAD/design apprentice role', source: 'people_apprentice_pack' },
      { title: 'Set up CAD skills screening', notes: 'Define software proficiency and portfolio requirements', source: 'people_apprentice_pack' },
      { title: 'Prepare practical CAD assessment', notes: 'Create design challenge to evaluate skills', source: 'people_apprentice_pack' },
      { title: 'Create engineering onboarding', notes: 'Set up CAD licenses, file access, and standards docs', source: 'people_apprentice_pack' },
    ],
  },
  {
    name: 'Sales Apprentice',
    description: 'SDR, lead generation, and business development support',
    role_archetype: 'apprentice_sales',
    skill_requirements: ['sales_enablement', 'demand_gen'],
    typical_hours_per_week: 40,
    task_templates_json: [
      { title: 'Draft sales apprentice job posting', notes: 'Create job posting for sales apprentice role', source: 'people_apprentice_pack' },
      { title: 'Set up sales aptitude screening', notes: 'Define communication and resilience criteria', source: 'people_apprentice_pack' },
      { title: 'Prepare sales roleplay assessment', notes: 'Create cold call and objection handling scenarios', source: 'people_apprentice_pack' },
      { title: 'Create sales onboarding', notes: 'Set up CRM access, scripts, and training materials', source: 'people_apprentice_pack' },
    ],
  },
  {
    name: 'Marketing Apprentice',
    description: 'Content creation, campaigns, and marketing operations',
    role_archetype: 'apprentice_marketing',
    skill_requirements: ['content_marketing', 'social_media', 'marketing_automation'],
    typical_hours_per_week: 32,
    task_templates_json: [
      { title: 'Draft marketing apprentice job posting', notes: 'Create job posting for marketing apprentice role', source: 'people_apprentice_pack' },
      { title: 'Set up portfolio screening', notes: 'Define content samples and creative requirements', source: 'people_apprentice_pack' },
      { title: 'Prepare marketing assessment', notes: 'Create content brief exercise', source: 'people_apprentice_pack' },
      { title: 'Create marketing onboarding', notes: 'Set up brand guidelines, tools, and channel access', source: 'people_apprentice_pack' },
    ],
  },
  {
    name: 'Data Apprentice',
    description: 'Analytics, reporting, and data operations support',
    role_archetype: 'apprentice_data',
    skill_requirements: ['data_engineering', 'data_analytics'],
    typical_hours_per_week: 32,
    task_templates_json: [
      { title: 'Draft data apprentice job posting', notes: 'Create job posting for data apprentice role', source: 'people_apprentice_pack' },
      { title: 'Set up technical screening', notes: 'Define SQL, Python, and analytics tool requirements', source: 'people_apprentice_pack' },
      { title: 'Prepare data analysis assessment', notes: 'Create dataset exploration and insight exercise', source: 'people_apprentice_pack' },
      { title: 'Create data onboarding', notes: 'Set up database access, dashboards, and documentation', source: 'people_apprentice_pack' },
    ],
  },
];

// ============================================================================
// GET - List available role packs
// ============================================================================

export async function GET(_request: Request) {
  try {
    const supabase = getSupabaseClient();

    // Try to fetch from database first
    const { data: packs, error } = await supabase
      .from('apprentice_role_packs')
      .select('*')
      .order('name');

    if (error) {
      console.warn('[RolePacks] Database fetch failed, using defaults:', error);
      // Return default packs if table doesn't exist or is empty
      return Response.json({
        success: true,
        data: DEFAULT_ROLE_PACKS.map((pack, idx) => ({
          ...pack,
          id: `default-${idx}`,
          created_at: new Date().toISOString(),
        })),
      } as PeopleApiResponse<ApprenticeRolePack[]>);
    }

    // If no packs in database, seed with defaults
    if (!packs || packs.length === 0) {
      const { data: seededPacks, error: seedError } = await supabase
        .from('apprentice_role_packs')
        .insert(DEFAULT_ROLE_PACKS)
        .select();

      if (seedError) {
        console.warn('[RolePacks] Seeding failed, using defaults:', seedError);
        return Response.json({
          success: true,
          data: DEFAULT_ROLE_PACKS.map((pack, idx) => ({
            ...pack,
            id: `default-${idx}`,
            created_at: new Date().toISOString(),
          })),
        } as PeopleApiResponse<ApprenticeRolePack[]>);
      }

      return Response.json({
        success: true,
        data: seededPacks as ApprenticeRolePack[],
      } as PeopleApiResponse<ApprenticeRolePack[]>);
    }

    return Response.json({
      success: true,
      data: packs as ApprenticeRolePack[],
    } as PeopleApiResponse<ApprenticeRolePack[]>);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[RolePacks] GET error:', message);
    return Response.json(
      { success: false, error: message } as PeopleApiResponse<null>,
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Apply role pack (generate task drafts)
// ============================================================================

interface ApplyPackRequest {
  workspace_id: string;
  user_id: string;
  pack_id: string;
  relationship_id?: string; // Optional - if applying to specific candidate
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ApplyPackRequest;

    if (!body.workspace_id || !body.user_id || !body.pack_id) {
      return Response.json(
        {
          success: false,
          error: 'workspace_id, user_id, and pack_id are required',
        } as PeopleApiResponse<null>,
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Fetch the pack
    let pack: ApprenticeRolePack | null = null;

    if (body.pack_id.startsWith('default-')) {
      const idx = parseInt(body.pack_id.replace('default-', ''), 10);
      if (idx >= 0 && idx < DEFAULT_ROLE_PACKS.length) {
        pack = {
          ...DEFAULT_ROLE_PACKS[idx],
          id: body.pack_id,
          created_at: new Date().toISOString(),
        };
      }
    } else {
      const { data: dbPack } = await supabase
        .from('apprentice_role_packs')
        .select('*')
        .eq('id', body.pack_id)
        .single();
      pack = dbPack;
    }

    if (!pack) {
      return Response.json(
        { success: false, error: 'Role pack not found' } as PeopleApiResponse<null>,
        { status: 404 }
      );
    }

    // Generate task drafts from templates
    const now = new Date();
    const drafts: Partial<OutreachDraft>[] = [];

    pack.task_templates_json.forEach((template, idx) => {
      const dueDate = new Date(now);
      dueDate.setDate(dueDate.getDate() + (idx + 1) * 3); // Stagger by 3 days

      drafts.push({
        workspace_id: body.workspace_id,
        created_by_user_id: body.user_id,
        assignee_user_id: body.user_id,
        title: template.title,
        notes: template.notes,
        start_iso: now.toISOString(),
        due_iso: dueDate.toISOString(),
        units: 2,
        source: 'people_apprentice_pack',
        status: 'pending_confirmation',
        confidence_assignee: 80,
        confidence_due: 60,
        relationship_id: body.relationship_id,
      });
    });

    // Insert drafts
    const { data: createdDrafts, error: insertError } = await supabase
      .from('task_drafts')
      .insert(drafts)
      .select();

    if (insertError) {
      console.error('[RolePacks] Insert error:', insertError);
      throw new Error('Failed to create task drafts');
    }

    return Response.json({
      success: true,
      data: {
        pack_name: pack.name,
        drafts: createdDrafts,
        count: createdDrafts.length,
      },
    } as PeopleApiResponse<{
      pack_name: string;
      drafts: OutreachDraft[];
      count: number;
    }>);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[RolePacks] POST error:', message);
    return Response.json(
      { success: false, error: message } as PeopleApiResponse<null>,
      { status: 500 }
    );
  }
}
