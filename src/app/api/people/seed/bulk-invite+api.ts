/**
 * Bulk Invite API
 *
 * POST - Generate invites for multiple people
 * GET - Get stale invites needing follow-up
 */

import { createClient } from '@supabase/supabase-js';
import type {
  PeopleInvite,
  StaleInvite,
  InviteChannel,
  PeopleApiResponse,
} from '@/lib/people/types';

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

// Generate secure token
function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// Generate email template
function generateEmailTemplate(
  name: string,
  inviteLink: string,
  templateType: 'warm' | 'cold' | 'event' | 'referral',
  eventName?: string,
  referrerName?: string
): string {
  switch (templateType) {
    case 'warm':
      return `Hi ${name},

I'm building a curated directory of fractional executives and advisors for early-stage companies. Based on your background, I think you'd be a great fit.

The marketplace connects verified fractional leaders with startups looking for part-time exec support - no recruiters, just direct connections.

Would you be open to creating a profile? It takes 5 minutes:

${inviteLink}

You control your visibility - private until you're ready, and you can edit or remove your profile anytime.

Best regards`;

    case 'event':
      return `Hi ${name},

It was great meeting you at ${eventName || 'the event'} recently. I mentioned the fractional executive network I'm building - here's that invite link:

${inviteLink}

The marketplace is curated and verified - we only show profiles of people who've opted in, and you control exactly what's visible.

Would love to have you on board.

Best regards`;

    case 'referral':
      return `Hi ${name},

${referrerName || 'A colleague'} suggested I reach out. They mentioned your experience and thought you might be interested in joining our fractional executive network.

We're building a quality-first marketplace where verified fractional execs connect directly with early-stage companies. No spam, no recruiters - just genuine opportunities.

If you're interested, you can create your profile here:

${inviteLink}

Takes about 5 minutes. Happy to answer any questions.

Best regards`;

    case 'cold':
    default:
      return `Hi ${name},

I came across your profile and was impressed by your track record. I'm building a curated marketplace of fractional executives for early-stage companies.

We're invite-only at this stage, focused on quality over quantity. If you occasionally take on fractional work, I'd love to add you to the network:

${inviteLink}

No obligation, you control your visibility, and you can remove your profile anytime.

Best regards`;
  }
}

// Generate LinkedIn DM template
function generateLinkedInTemplate(
  name: string,
  inviteLink: string,
  templateType: 'warm' | 'cold' | 'event' | 'referral',
  eventName?: string,
  referrerName?: string
): string {
  switch (templateType) {
    case 'warm':
      return `Hi ${name}, I'm building a curated network of fractional executives for startups. Given your background, I think you'd be a great addition.

It's invite-only and takes 5 minutes to set up a profile: ${inviteLink}

You control your visibility - happy to answer any questions.`;

    case 'event':
      return `Great meeting you at ${eventName || 'the event'}! Here's the invite link I mentioned:

${inviteLink}

Takes 5 mins. Let me know if you have questions.`;

    case 'referral':
      return `Hi ${name}, ${referrerName || 'a colleague'} mentioned you might be interested in joining our fractional exec network.

It's a curated marketplace for verified fractional leaders - no spam, quality-first.

Profile takes 5 mins: ${inviteLink}`;

    case 'cold':
    default:
      return `Hi ${name}, came across your profile - impressive track record.

I'm building a verified marketplace for fractional execs. Invite-only, quality-focused. Would you be open to joining?

${inviteLink}

No recruiters, direct connections only. You control what's visible.`;
  }
}

// ============================================================================
// GET - Get stale invites needing follow-up
// ============================================================================

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const workspaceId = url.searchParams.get('workspace_id');
    const daysStale = parseInt(url.searchParams.get('days_stale') || '14', 10);

    if (!workspaceId) {
      return Response.json(
        { success: false, error: 'workspace_id is required' } as PeopleApiResponse<null>,
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    const { data: staleInvites, error } = await supabase.rpc('get_stale_invites', {
      p_workspace_id: workspaceId,
      p_days_stale: daysStale,
    });

    if (error) {
      console.error('[BulkInvite] GET error:', error);
      throw new Error('Failed to fetch stale invites');
    }

    return Response.json({
      success: true,
      data: staleInvites as StaleInvite[],
    } as PeopleApiResponse<StaleInvite[]>);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[BulkInvite] GET error:', message);
    return Response.json(
      { success: false, error: message } as PeopleApiResponse<null>,
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Generate bulk invites
// ============================================================================

interface BulkInviteRequest {
  workspace_id: string;
  user_id: string;
  person_ids: string[];
  channel: InviteChannel;
  template_type?: 'warm' | 'cold' | 'event' | 'referral';
  event_name?: string;
  referrer_name?: string;
  create_tasks?: boolean;
}

interface InviteResult {
  person_id: string;
  person_name: string;
  invite_id: string;
  invite_link: string;
  email_template: string;
  linkedin_template: string;
  task_id?: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as BulkInviteRequest;

    if (!body.workspace_id || !body.user_id || !body.person_ids?.length) {
      return Response.json(
        { success: false, error: 'workspace_id, user_id, and person_ids are required' } as PeopleApiResponse<null>,
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();
    const results: InviteResult[] = [];
    const templateType = body.template_type || 'warm';
    const baseUrl = process.env.EXPO_PUBLIC_APP_URL || 'https://app.fractionalfoundry.com';

    for (const personId of body.person_ids) {
      try {
        // Fetch person details
        const { data: person, error: personError } = await supabase
          .from('universal_people')
          .select('id, display_name, verification_status')
          .eq('id', personId)
          .single();

        if (personError || !person) {
          console.warn(`[BulkInvite] Person not found: ${personId}`);
          continue;
        }

        // Check if already has pending invite
        const { data: existingInvite } = await supabase
          .from('people_invites')
          .select('id')
          .eq('person_id', personId)
          .eq('status', 'pending')
          .single();

        if (existingInvite) {
          console.warn(`[BulkInvite] Person already has pending invite: ${personId}`);
          continue;
        }

        // Get email if available
        const { data: emailContact } = await supabase
          .from('universal_people_contacts')
          .select('contact_value')
          .eq('person_id', personId)
          .eq('contact_type', 'email')
          .limit(1)
          .single();

        // Generate invite
        const token = generateToken();
        const inviteLink = `${baseUrl}/join/${token}`;
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30); // 30 day expiry

        const { data: invite, error: inviteError } = await supabase
          .from('people_invites')
          .insert({
            person_id: personId,
            email: emailContact?.contact_value || '',
            token,
            invited_by_user_id: body.user_id,
            invited_by_workspace_id: body.workspace_id,
            prefill_name: person.display_name,
            status: 'pending',
            invite_type: 'marketplace',
            channel: body.channel,
            template_used: templateType,
            expires_at: expiresAt.toISOString(),
          })
          .select()
          .single();

        if (inviteError) {
          console.error(`[BulkInvite] Invite creation error for ${personId}:`, inviteError);
          continue;
        }

        // Update person to invited status
        if (person.verification_status === 'stub') {
          await supabase
            .from('universal_people')
            .update({ verification_status: 'invited' })
            .eq('id', personId);
        }

        // Generate templates
        const emailTemplate = generateEmailTemplate(
          person.display_name,
          inviteLink,
          templateType,
          body.event_name,
          body.referrer_name
        );

        const linkedinTemplate = generateLinkedInTemplate(
          person.display_name,
          inviteLink,
          templateType,
          body.event_name,
          body.referrer_name
        );

        const result: InviteResult = {
          person_id: personId,
          person_name: person.display_name,
          invite_id: invite.id,
          invite_link: inviteLink,
          email_template: emailTemplate,
          linkedin_template: linkedinTemplate,
        };

        // Create task draft if requested
        if (body.create_tasks !== false) {
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + 2);

          const { data: task } = await supabase
            .from('task_drafts')
            .insert({
              workspace_id: body.workspace_id,
              created_by_user_id: body.user_id,
              assignee_user_id: body.user_id,
              title: `Send invite to ${person.display_name} for Fractional Foundry marketplace`,
              notes: `Channel: ${body.channel}\n\nInvite link: ${inviteLink}\n\n${body.channel === 'email' ? 'Email template:\n' + emailTemplate : 'LinkedIn DM template:\n' + linkedinTemplate}`,
              start_iso: new Date().toISOString(),
              due_iso: dueDate.toISOString(),
              units: 1,
              source: 'people_outreach',
              status: 'pending_confirmation',
              confidence_assignee: 90,
              confidence_due: 80,
            })
            .select()
            .single();

          if (task) {
            result.task_id = task.id;
          }
        }

        results.push(result);
      } catch (err) {
        console.error(`[BulkInvite] Error processing ${personId}:`, err);
      }
    }

    return Response.json({
      success: true,
      data: {
        invited_count: results.length,
        invites: results,
      },
    } as PeopleApiResponse<{
      invited_count: number;
      invites: InviteResult[];
    }>);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[BulkInvite] POST error:', message);
    return Response.json(
      { success: false, error: message } as PeopleApiResponse<null>,
      { status: 500 }
    );
  }
}
