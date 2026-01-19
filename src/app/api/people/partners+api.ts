/**
 * Partner Organizations API
 *
 * GET - List partner orgs
 * POST - Create partner org
 * PATCH - Update partner org
 * DELETE - Delete partner org
 */

import { createClient } from '@supabase/supabase-js';
import type {
  PartnerOrg,
  PartnerOrgType,
  PartnerStatus,
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

// ============================================================================
// GET - List partner orgs
// ============================================================================

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const workspaceId = url.searchParams.get('workspace_id');
    const status = url.searchParams.get('status');
    const orgType = url.searchParams.get('org_type');

    const supabase = getSupabaseClient();

    let query = supabase
      .from('partner_orgs')
      .select('*')
      .order('priority', { ascending: false })
      .order('name', { ascending: true });

    if (workspaceId) {
      query = query.or(`workspace_id.eq.${workspaceId},workspace_id.is.null`);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (orgType) {
      query = query.eq('org_type', orgType);
    }

    const { data: partners, error } = await query;

    if (error) {
      console.error('[Partners] GET error:', error);
      throw new Error('Failed to fetch partners');
    }

    return Response.json({
      success: true,
      data: partners as PartnerOrg[],
    } as PeopleApiResponse<PartnerOrg[]>);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Partners] GET error:', message);
    return Response.json(
      { success: false, error: message } as PeopleApiResponse<null>,
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Create partner org (or bulk import)
// ============================================================================

interface CreatePartnerRequest {
  workspace_id: string;
  user_id: string;
  partner?: {
    name: string;
    org_type: PartnerOrgType;
    region?: string;
    contact_name?: string;
    contact_email?: string;
    contact_url?: string;
    notes?: string;
    volume_estimate?: number;
    priority?: 'low' | 'medium' | 'high';
  };
  bulk_import?: string; // CSV data
  create_outreach_tasks?: boolean;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreatePartnerRequest;

    if (!body.workspace_id || !body.user_id) {
      return Response.json(
        { success: false, error: 'workspace_id and user_id are required' } as PeopleApiResponse<null>,
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();
    const createdPartners: PartnerOrg[] = [];

    // Handle bulk import
    if (body.bulk_import) {
      const lines = body.bulk_import.trim().split('\n');
      if (lines.length < 2) {
        return Response.json(
          { success: false, error: 'CSV must have header row and at least one data row' } as PeopleApiResponse<null>,
          { status: 400 }
        );
      }

      const headers = lines[0].toLowerCase().split(',').map(h => h.trim());

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
        const row: Record<string, string> = {};

        headers.forEach((header, idx) => {
          row[header] = values[idx] || '';
        });

        if (!row.name) continue;

        const { data: partner, error } = await supabase
          .from('partner_orgs')
          .insert({
            name: row.name,
            org_type: row.org_type || 'university',
            region: row.region || 'UK',
            contact_name: row.contact_name,
            contact_email: row.contact_email,
            contact_url: row.contact_url,
            notes: row.notes,
            status: 'not_contacted',
            priority: 'medium',
            workspace_id: body.workspace_id,
            created_by_user_id: body.user_id,
          })
          .select()
          .single();

        if (!error && partner) {
          createdPartners.push(partner as PartnerOrg);
        }
      }
    } else if (body.partner) {
      // Single partner creation
      if (!body.partner.name) {
        return Response.json(
          { success: false, error: 'partner.name is required' } as PeopleApiResponse<null>,
          { status: 400 }
        );
      }

      const { data: partner, error } = await supabase
        .from('partner_orgs')
        .insert({
          name: body.partner.name,
          org_type: body.partner.org_type || 'university',
          region: body.partner.region || 'UK',
          contact_name: body.partner.contact_name,
          contact_email: body.partner.contact_email,
          contact_url: body.partner.contact_url,
          notes: body.partner.notes,
          volume_estimate: body.partner.volume_estimate,
          priority: body.partner.priority || 'medium',
          status: 'not_contacted',
          workspace_id: body.workspace_id,
          created_by_user_id: body.user_id,
        })
        .select()
        .single();

      if (error) {
        console.error('[Partners] POST error:', error);
        throw new Error('Failed to create partner');
      }

      createdPartners.push(partner as PartnerOrg);
    } else {
      return Response.json(
        { success: false, error: 'Either partner or bulk_import is required' } as PeopleApiResponse<null>,
        { status: 400 }
      );
    }

    // Create outreach tasks if requested
    if (body.create_outreach_tasks && createdPartners.length > 0) {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 7);

      const tasks = createdPartners.map(partner => ({
        workspace_id: body.workspace_id,
        created_by_user_id: body.user_id,
        assignee_user_id: body.user_id,
        title: `Email ${partner.name} re apprentice/talent pipeline`,
        notes: `Partner type: ${partner.org_type}\nRegion: ${partner.region}\n${partner.contact_email ? `Contact: ${partner.contact_email}` : ''}\n${partner.contact_url ? `URL: ${partner.contact_url}` : ''}`,
        start_iso: new Date().toISOString(),
        due_iso: dueDate.toISOString(),
        units: 1,
        source: 'people_outreach',
        status: 'pending_confirmation',
        confidence_assignee: 80,
        confidence_due: 60,
      }));

      await supabase.from('task_drafts').insert(tasks);
    }

    return Response.json({
      success: true,
      data: {
        created_count: createdPartners.length,
        partners: createdPartners,
      },
    } as PeopleApiResponse<{ created_count: number; partners: PartnerOrg[] }>);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Partners] POST error:', message);
    return Response.json(
      { success: false, error: message } as PeopleApiResponse<null>,
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH - Update partner org
// ============================================================================

interface UpdatePartnerRequest {
  id: string;
  workspace_id: string;
  status?: PartnerStatus;
  contact_name?: string;
  contact_email?: string;
  contact_url?: string;
  notes?: string;
  volume_estimate?: number;
  quality_score?: number;
  priority?: 'low' | 'medium' | 'high';
  next_followup_at?: string;
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as UpdatePartnerRequest;

    if (!body.id || !body.workspace_id) {
      return Response.json(
        { success: false, error: 'id and workspace_id are required' } as PeopleApiResponse<null>,
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Verify partner exists
    const { data: existing } = await supabase
      .from('partner_orgs')
      .select('id, status')
      .eq('id', body.id)
      .single();

    if (!existing) {
      return Response.json(
        { success: false, error: 'Partner not found' } as PeopleApiResponse<null>,
        { status: 404 }
      );
    }

    const updates: Partial<PartnerOrg> = {
      updated_at: new Date().toISOString(),
    };

    if (body.status !== undefined) {
      updates.status = body.status;
      // Track when contacted
      if (body.status === 'contacted' && existing.status === 'not_contacted') {
        updates.last_contacted_at = new Date().toISOString();
      }
    }
    if (body.contact_name !== undefined) updates.contact_name = body.contact_name;
    if (body.contact_email !== undefined) updates.contact_email = body.contact_email;
    if (body.contact_url !== undefined) updates.contact_url = body.contact_url;
    if (body.notes !== undefined) updates.notes = body.notes;
    if (body.volume_estimate !== undefined) updates.volume_estimate = body.volume_estimate;
    if (body.quality_score !== undefined) updates.quality_score = body.quality_score;
    if (body.priority !== undefined) updates.priority = body.priority;
    if (body.next_followup_at !== undefined) updates.next_followup_at = body.next_followup_at;

    const { data: updated, error } = await supabase
      .from('partner_orgs')
      .update(updates)
      .eq('id', body.id)
      .select()
      .single();

    if (error) {
      console.error('[Partners] PATCH error:', error);
      throw new Error('Failed to update partner');
    }

    return Response.json({
      success: true,
      data: updated as PartnerOrg,
    } as PeopleApiResponse<PartnerOrg>);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Partners] PATCH error:', message);
    return Response.json(
      { success: false, error: message } as PeopleApiResponse<null>,
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Delete partner org
// ============================================================================

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const workspaceId = url.searchParams.get('workspace_id');

    if (!id || !workspaceId) {
      return Response.json(
        { success: false, error: 'id and workspace_id are required' } as PeopleApiResponse<null>,
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('partner_orgs')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[Partners] DELETE error:', error);
      throw new Error('Failed to delete partner');
    }

    return Response.json({
      success: true,
      data: { deleted: true },
    } as PeopleApiResponse<{ deleted: boolean }>);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Partners] DELETE error:', message);
    return Response.json(
      { success: false, error: message } as PeopleApiResponse<null>,
      { status: 500 }
    );
  }
}
