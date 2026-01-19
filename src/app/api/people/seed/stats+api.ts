/**
 * People Seeding Stats/Dashboard API
 *
 * GET - Get seeding statistics and metrics
 */

import { createClient } from '@supabase/supabase-js';
import type {
  SeedingStats,
  PeopleApiResponse,
  VerificationStatus,
  PersonType,
  InviteStatus,
  PartnerStatus,
  ApprenticeAppStatus,
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

interface ExtendedStats extends SeedingStats {
  // Conversion funnel
  conversion: {
    stub_to_invited: number;
    invited_to_optin: number;
    optin_to_verified: number;
    invite_response_rate: number;
  };
  // By sector
  top_sectors: Array<{ sector: string; count: number }>;
  // Recent activity
  recent_optins: number;
  recent_verifications: number;
  // Stale counts
  stale_invites_14d: number;
  stale_invites_7d: number;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const workspaceId = url.searchParams.get('workspace_id');

    const supabase = getSupabaseClient();

    // Get base stats from RPC function
    const { data: rawStats, error: statsError } = await supabase.rpc('get_seeding_stats', {
      p_workspace_id: workspaceId || null,
    });

    if (statsError) {
      console.warn('[Stats] RPC error, falling back to manual queries:', statsError);
    }

    // Initialize stats object
    const stats: ExtendedStats = {
      verification_status: {
        stub: 0,
        invited: 0,
        opted_in: 0,
        verified: 0,
      },
      person_type: {
        fractional_exec: 0,
        apprentice: 0,
        advisor: 0,
        contractor: 0,
        other: 0,
      },
      invite_status: {
        pending: 0,
        sent: 0,
        opened: 0,
        completed: 0,
        expired: 0,
        cancelled: 0,
      },
      partner_status: {
        not_contacted: 0,
        contacted: 0,
        in_conversation: 0,
        active: 0,
        paused: 0,
        declined: 0,
      },
      apprentice_app_status: {
        new: 0,
        screening: 0,
        interview: 0,
        offer: 0,
        accepted: 0,
        rejected: 0,
        withdrawn: 0,
      },
      stale_invites_count: 0,
      conversion: {
        stub_to_invited: 0,
        invited_to_optin: 0,
        optin_to_verified: 0,
        invite_response_rate: 0,
      },
      top_sectors: [],
      recent_optins: 0,
      recent_verifications: 0,
      stale_invites_14d: 0,
      stale_invites_7d: 0,
    };

    // Parse RPC results
    if (rawStats) {
      for (const row of rawStats) {
        const { stat_type, stat_key, stat_value } = row;

        if (stat_type === 'verification_status' && stat_key in stats.verification_status) {
          stats.verification_status[stat_key as VerificationStatus] = Number(stat_value);
        } else if (stat_type === 'person_type' && stat_key in stats.person_type) {
          stats.person_type[stat_key as PersonType] = Number(stat_value);
        } else if (stat_type === 'invite_status' && stat_key in stats.invite_status) {
          stats.invite_status[stat_key as InviteStatus] = Number(stat_value);
        } else if (stat_type === 'partner_status' && stat_key in stats.partner_status) {
          stats.partner_status[stat_key as PartnerStatus] = Number(stat_value);
        } else if (stat_type === 'apprentice_app_status' && stat_key in stats.apprentice_app_status) {
          stats.apprentice_app_status[stat_key as ApprenticeAppStatus] = Number(stat_value);
        } else if (stat_type === 'stale_invites') {
          stats.stale_invites_count = Number(stat_value);
          stats.stale_invites_14d = Number(stat_value);
        }
      }
    }

    // Calculate conversion rates
    const totalStubs = stats.verification_status.stub;
    const totalInvited = stats.verification_status.invited;
    const totalOptedIn = stats.verification_status.opted_in;
    const totalVerified = stats.verification_status.verified;

    const totalInvitesSent = stats.invite_status.sent + stats.invite_status.opened + stats.invite_status.completed;
    const totalInviteResponses = stats.invite_status.completed;

    if (totalStubs + totalInvited > 0) {
      stats.conversion.stub_to_invited = Math.round(
        (totalInvited / (totalStubs + totalInvited)) * 100
      );
    }

    if (totalInvited + totalOptedIn > 0) {
      stats.conversion.invited_to_optin = Math.round(
        (totalOptedIn / (totalInvited + totalOptedIn)) * 100
      );
    }

    if (totalOptedIn + totalVerified > 0) {
      stats.conversion.optin_to_verified = Math.round(
        (totalVerified / (totalOptedIn + totalVerified)) * 100
      );
    }

    if (totalInvitesSent > 0) {
      stats.conversion.invite_response_rate = Math.round(
        (totalInviteResponses / totalInvitesSent) * 100
      );
    }

    // Get top sectors
    const { data: sectorData } = await supabase
      .from('universal_people')
      .select('sector_tags');

    if (sectorData) {
      const sectorCounts: Record<string, number> = {};
      for (const person of sectorData) {
        const tags = person.sector_tags as string[] | null;
        if (tags) {
          for (const tag of tags) {
            sectorCounts[tag] = (sectorCounts[tag] || 0) + 1;
          }
        }
      }

      stats.top_sectors = Object.entries(sectorCounts)
        .map(([sector, count]) => ({ sector, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    }

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { count: recentOptins } = await supabase
      .from('universal_people')
      .select('*', { count: 'exact', head: true })
      .gte('opted_in_at', sevenDaysAgo.toISOString());

    const { count: recentVerifications } = await supabase
      .from('verification_audit_log')
      .select('*', { count: 'exact', head: true })
      .eq('action', 'verify')
      .gte('created_at', sevenDaysAgo.toISOString());

    stats.recent_optins = recentOptins || 0;
    stats.recent_verifications = recentVerifications || 0;

    // Get 7-day stale invites
    const { count: stale7d } = await supabase
      .from('people_invites')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pending', 'sent'])
      .lt('created_at', sevenDaysAgo.toISOString());

    stats.stale_invites_7d = stale7d || 0;

    return Response.json({
      success: true,
      data: stats,
    } as PeopleApiResponse<ExtendedStats>);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Stats] GET error:', message);
    return Response.json(
      { success: false, error: message } as PeopleApiResponse<null>,
      { status: 500 }
    );
  }
}
