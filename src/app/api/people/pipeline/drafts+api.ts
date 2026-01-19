/**
 * People Pipeline - Outreach Drafts API
 *
 * POST - Generate outreach task drafts from pipeline relationship
 */

import { createClient } from '@supabase/supabase-js';
import type {
  OutreachDraftRequest,
  OutreachTemplate,
  OutreachDraft,
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

// Template definitions
const TEMPLATE_CONFIGS: Record<
  OutreachTemplate,
  {
    title: (name: string, role?: string) => string;
    notes: (name: string, role?: string) => string;
    units: number;
    source: OutreachDraft['source'];
    daysFromNow: number;
  }
> = {
  email_introduction: {
    title: (name) => `Send introduction email to ${name}`,
    notes: (name) =>
      `Draft and send an introduction email to ${name}.\n\n- Introduce yourself and the company\n- Explain why you're reaching out\n- Propose a brief call to discuss potential fit`,
    units: 1,
    source: 'people_outreach',
    daysFromNow: 1,
  },
  schedule_call: {
    title: (name) => `Schedule intro call with ${name}`,
    notes: (name) =>
      `Book an introductory call with ${name}.\n\n- 30 minute video call\n- Send calendar invite with meeting link\n- Prepare discussion points`,
    units: 1,
    source: 'people_scheduling',
    daysFromNow: 2,
  },
  send_nda: {
    title: (name) => `Send NDA to ${name}`,
    notes: (name) =>
      `Send mutual NDA for ${name} to sign.\n\n- Use standard NDA template\n- Send via DocuSign or similar\n- Track signature status`,
    units: 1,
    source: 'people_docs',
    daysFromNow: 3,
  },
  prepare_interview: {
    title: (name, role) => `Prepare interview for ${name}${role ? ` (${role})` : ''}`,
    notes: (name, role) =>
      `Prepare interview session for ${name}${role ? ` for ${role} role` : ''}.\n\n- Review their background/CV\n- Prepare role-specific questions\n- Set up interview panel if needed`,
    units: 2,
    source: 'people_scheduling',
    daysFromNow: 5,
  },
  check_references: {
    title: (name) => `Check references for ${name}`,
    notes: (name) =>
      `Conduct reference checks for ${name}.\n\n- Request 2-3 references\n- Prepare reference check questions\n- Schedule calls with references`,
    units: 2,
    source: 'people_outreach',
    daysFromNow: 7,
  },
  send_offer: {
    title: (name, role) => `Prepare and send offer to ${name}`,
    notes: (name, role) =>
      `Prepare offer letter for ${name}${role ? ` for ${role} position` : ''}.\n\n- Finalize terms (rate, hours, start date)\n- Draft offer letter\n- Get internal approval\n- Send to candidate`,
    units: 2,
    source: 'people_docs',
    daysFromNow: 10,
  },
  onboarding_checklist: {
    title: (name, role) => `Complete onboarding for ${name}`,
    notes: (name, role) =>
      `Complete onboarding checklist for ${name}${role ? ` (${role})` : ''}.\n\n- System access setup\n- Introduce to team\n- Share key documents\n- Schedule kickoff meeting`,
    units: 3,
    source: 'people_onboarding',
    daysFromNow: 14,
  },
};

interface CreateDraftsRequest extends OutreachDraftRequest {
  workspace_id: string;
  user_id: string;
}

// ============================================================================
// POST - Generate outreach drafts
// ============================================================================

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateDraftsRequest;

    if (!body.workspace_id || !body.user_id || !body.relationship_id) {
      return Response.json(
        {
          success: false,
          error: 'workspace_id, user_id, and relationship_id are required',
        } as PeopleApiResponse<null>,
        { status: 400 }
      );
    }

    if (!body.templates || body.templates.length === 0) {
      return Response.json(
        { success: false, error: 'At least one template is required' } as PeopleApiResponse<null>,
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Fetch relationship and person data
    const { data: relationship, error: relError } = await supabase
      .from('company_people_relationships')
      .select(`
        *,
        person:universal_people(id, display_name, headline)
      `)
      .eq('id', body.relationship_id)
      .eq('workspace_id', body.workspace_id)
      .single();

    if (relError || !relationship) {
      return Response.json(
        { success: false, error: 'Relationship not found' } as PeopleApiResponse<null>,
        { status: 404 }
      );
    }

    const personName = relationship.person?.display_name || 'Candidate';
    const roleName = relationship.target_role_archetype || relationship.person?.headline;

    // Generate drafts for each template
    const drafts: Partial<OutreachDraft>[] = [];
    const now = new Date();

    for (const template of body.templates) {
      const config = TEMPLATE_CONFIGS[template];
      if (!config) {
        console.warn(`[Drafts] Unknown template: ${template}`);
        continue;
      }

      const dueDate = new Date(now);
      dueDate.setDate(dueDate.getDate() + config.daysFromNow);

      drafts.push({
        workspace_id: body.workspace_id,
        created_by_user_id: body.user_id,
        assignee_user_id: body.user_id,
        title: config.title(personName, roleName),
        notes: config.notes(personName, roleName),
        start_iso: now.toISOString(),
        due_iso: dueDate.toISOString(),
        units: config.units,
        source: config.source,
        status: 'pending_confirmation',
        confidence_assignee: 80,
        confidence_due: 70,
        relationship_id: body.relationship_id,
        person_id: relationship.person_id,
        person_name: personName,
      });
    }

    if (drafts.length === 0) {
      return Response.json(
        { success: false, error: 'No valid templates provided' } as PeopleApiResponse<null>,
        { status: 400 }
      );
    }

    // Insert drafts into task_drafts table
    const { data: createdDrafts, error: insertError } = await supabase
      .from('task_drafts')
      .insert(drafts)
      .select();

    if (insertError) {
      console.error('[Drafts] Insert error:', insertError);
      throw new Error('Failed to create task drafts');
    }

    return Response.json({
      success: true,
      data: {
        drafts: createdDrafts as OutreachDraft[],
        count: createdDrafts.length,
      },
    } as PeopleApiResponse<{ drafts: OutreachDraft[]; count: number }>);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Drafts] POST error:', message);
    return Response.json(
      { success: false, error: message } as PeopleApiResponse<null>,
      { status: 500 }
    );
  }
}
