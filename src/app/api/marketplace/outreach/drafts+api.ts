/**
 * Marketplace Outreach Drafts API
 *
 * Generates task drafts for outreach to selected marketplace organizations.
 * Integrates with the existing task_drafts table.
 *
 * POST /api/marketplace/outreach/drafts
 * Body: {
 *   workspace_id: string,
 *   user_id: string,
 *   selected_org_ids: string[],
 *   outreach_context?: {
 *     purpose: string,  // e.g., "Seeking Series A funding"
 *     message_template?: string
 *   }
 * }
 */

import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const anthropic = new Anthropic({
  apiKey: process.env.EXPO_PUBLIC_CENTAUROS_ANTHROPIC_API_KEY!,
});

interface OutreachRequest {
  workspace_id: string;
  user_id: string;
  selected_org_ids: string[];
  outreach_context?: {
    purpose: string;
    message_template?: string;
  };
}

interface TaskDraft {
  workspace_id: string;
  created_by_user_id: string;
  assignee_user_id: string;
  title: string;
  notes: string;
  start_iso: string;
  due_iso: string | null;
  units: number;
  source: string;
  confidence_assignee: number;
  confidence_due: number | null;
  status: string;
}

const DRAFT_GENERATION_SYSTEM_PROMPT = `You are an outreach task assistant for hardware startup founders.

Your job is to create concise, actionable task drafts for reaching out to specific organizations (VCs, law firms, accountancies, manufacturers).

For each organization, generate:
1. A clear, actionable task title (max 200 chars)
2. Task notes with:
   - Why this org is relevant
   - Best contact method (based on org's preferred_contact_method)
   - Suggested talking points
   - Any key facts (confidence score, recent activity)

Guidelines:
- Title format: "Reach out to [Org Name] - [Purpose]"
- Notes should be bullet points, max 2000 chars
- Be specific and actionable
- Reference the org's focus areas and capabilities
- Suggest realistic next steps

Respond with JSON only in this format:
{
  "title": "...",
  "notes": "..."
}`;

export async function POST(request: Request): Promise<Response> {
  try {
    const body: OutreachRequest = await request.json();
    const { workspace_id, user_id, selected_org_ids, outreach_context } = body;

    // Validation
    if (!workspace_id || !user_id || !selected_org_ids || selected_org_ids.length === 0) {
      return Response.json(
        { error: 'Missing required fields: workspace_id, user_id, selected_org_ids' },
        { status: 400 }
      );
    }

    // Fetch selected organizations
    const { data: orgs, error: orgsError } = await supabase
      .from('directory_orgs')
      .select('*')
      .in('id', selected_org_ids);

    if (orgsError) {
      console.error('[outreach/drafts] Error fetching orgs:', orgsError);
      return Response.json({ error: 'Failed to fetch organizations' }, { status: 500 });
    }

    if (!orgs || orgs.length === 0) {
      return Response.json(
        { error: 'No organizations found with provided IDs' },
        { status: 404 }
      );
    }

    // Generate task drafts for each org
    const drafts: TaskDraft[] = [];
    const now = new Date();
    const defaultDueDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

    for (const org of orgs) {
      try {
        // Build context for Claude
        const orgContext = {
          name: org.name,
          org_type: org.org_type,
          website: org.website,
          regions: org.regions,
          sector_focus: org.sector_focus,
          stage_focus: org.stage_focus,
          capability_tags: org.capability_tags,
          description: org.description_1liner,
          preferred_contact_method: org.preferred_contact_method,
          confidence_score: org.confidence_score,
          notes: org.notes,
        };

        const userPurpose = outreach_context?.purpose || 'General outreach';

        // Call Claude to generate task draft
        const message = await anthropic.messages.create({
          model: 'claude-sonnet-4-5-20241022',
          max_tokens: 512,
          system: DRAFT_GENERATION_SYSTEM_PROMPT,
          messages: [
            {
              role: 'user',
              content: `Generate an outreach task for this organization:

${JSON.stringify(orgContext, null, 2)}

Outreach purpose: ${userPurpose}
${outreach_context?.message_template ? `\nMessage template to reference:\n${outreach_context.message_template}` : ''}`,
            },
          ],
        });

        // Parse response
        const textContent = message.content.find((block: Anthropic.ContentBlock) => block.type === 'text');
        if (!textContent || textContent.type !== 'text') {
          console.error('[outreach/drafts] No text content for org:', org.name);
          continue;
        }

        const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          console.error('[outreach/drafts] No JSON found for org:', org.name);
          continue;
        }

        const taskContent = JSON.parse(jsonMatch[0]);

        // Create draft object
        const draft: TaskDraft = {
          workspace_id,
          created_by_user_id: user_id,
          assignee_user_id: user_id,
          title: taskContent.title.substring(0, 200), // Ensure max 200 chars
          notes: taskContent.notes.substring(0, 2000), // Ensure max 2000 chars
          start_iso: now.toISOString(),
          due_iso: defaultDueDate.toISOString(),
          units: 1,
          source: 'marketplace_outreach',
          confidence_assignee: 100, // User explicitly selected these
          confidence_due: 70, // Default 7-day due date is a guess
          status: 'pending_confirmation',
        };

        drafts.push(draft);
      } catch (err) {
        console.error('[outreach/drafts] Error generating draft for org:', org.name, err);
        // Continue with other orgs
      }
    }

    if (drafts.length === 0) {
      return Response.json(
        { error: 'Failed to generate any task drafts' },
        { status: 500 }
      );
    }

    // Insert drafts into database
    const { data: insertedDrafts, error: insertError } = await supabase
      .from('task_drafts')
      .insert(drafts)
      .select();

    if (insertError) {
      console.error('[outreach/drafts] Error inserting drafts:', insertError);
      return Response.json({ error: 'Failed to save task drafts' }, { status: 500 });
    }

    // Log event for each draft
    const events = insertedDrafts.map((draft) => ({
      workspace_id,
      draft_id: draft.id,
      event_type: 'draft_created',
      payload_json: { source: 'marketplace_outreach', org_type: 'directory_org' },
      created_by_user_id: user_id,
    }));

    await supabase.from('task_events').insert(events);

    return Response.json({
      success: true,
      drafts: insertedDrafts,
      count: insertedDrafts.length,
    });
  } catch (err) {
    console.error('[outreach/drafts] Unexpected error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
