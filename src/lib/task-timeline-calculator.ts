/**
 * Task Timeline Calculator
 * Calculates dynamic task completion dates based on:
 * - Team size (efficiency penalty for larger teams)
 * - Individual modifiers (leadership, collaboration, AI proficiency)
 * - AI tool usage
 */

import type { OrganizationMember } from './organization-seed';
import type { TUAllocation, AppliedAITool } from './state/work-plan-store';

/**
 * Team size efficiency penalty
 * Based on Brooks' Law and coordination overhead
 *
 * 1 person  = 1.0x (100%)
 * 2 people  = 0.95x (95% efficiency - minimal coordination)
 * 3 people  = 0.90x (90% efficiency - more coordination needed)
 * 4 people  = 0.85x (85% efficiency - significant coordination)
 * 5+ people = 0.80x (80% efficiency - substantial overhead)
 */
export function getTeamSizeEfficiency(teamSize: number): number {
  if (teamSize <= 1) return 1.0;
  if (teamSize === 2) return 0.95;
  if (teamSize === 3) return 0.90;
  if (teamSize === 4) return 0.85;
  return 0.80; // 5 or more people
}

/**
 * Calculate effective TUs per week for a task allocation considering all modifiers
 */
export function calculateEffectiveTUsPerWeek(
  allocation: TUAllocation,
  member: OrganizationMember | undefined,
  teamSize: number,
  hasAITools: boolean
): number {
  const baseTUs = allocation.squaresPerWeek;

  if (!member) return baseTUs; // Fallback if member not found

  // Start with base TUs
  let effectiveTUs = baseTUs;

  // Apply team size efficiency penalty
  const teamSizeMultiplier = getTeamSizeEfficiency(teamSize);
  effectiveTUs *= teamSizeMultiplier;

  // Apply individual modifiers
  const teamLeadership = member.teamLeadershipMultiplier ?? 1.0;
  const collaboration = member.collaborationMultiplier ?? 1.0;
  const aiProficiency = member.aiProficiencyMultiplier ?? 1.0;

  // Team leadership applies when team size > 1
  if (teamSize > 1) {
    effectiveTUs *= teamLeadership;
  }

  // Collaboration always applies (even solo work has some collaboration)
  effectiveTUs *= collaboration;

  // AI proficiency only applies if AI tools are being used
  if (hasAITools) {
    effectiveTUs *= aiProficiency;
  }

  return effectiveTUs;
}

/**
 * Calculate the total effective TUs per week for all allocations on a task
 */
export function calculateTotalEffectiveTUsPerWeek(
  allocations: TUAllocation[],
  members: OrganizationMember[],
  hasAITools: boolean
): number {
  const teamSize = allocations.length;

  return allocations.reduce((total, allocation) => {
    const member = members.find(m => m.id === allocation.memberId);
    const effectiveTUs = calculateEffectiveTUsPerWeek(
      allocation,
      member,
      teamSize,
      hasAITools
    );
    return total + effectiveTUs;
  }, 0);
}

/**
 * Calculate AI productivity multiplier from applied AI tools
 * Returns the highest multiplier if multiple AI tools are used
 */
export function calculateAIMultiplier(aiTools: AppliedAITool[]): number {
  if (!aiTools || aiTools.length === 0) return 1.0;

  // Use the highest multiplier (tools don't stack, you use the best one)
  return Math.max(...aiTools.map(tool => tool.multiplier), 1.0);
}

/**
 * Calculate the number of weeks needed to complete a task
 */
export function calculateWeeksToComplete(
  estimatedTUs: number,
  allocations: TUAllocation[],
  members: OrganizationMember[],
  aiTools: AppliedAITool[]
): number {
  if (allocations.length === 0 || estimatedTUs === 0) {
    return 0;
  }

  const hasAITools = aiTools && aiTools.length > 0;
  const effectiveTUsPerWeek = calculateTotalEffectiveTUsPerWeek(
    allocations,
    members,
    hasAITools
  );

  if (effectiveTUsPerWeek === 0) return 0;

  // AI multiplier reduces the effective TUs needed
  const aiMultiplier = calculateAIMultiplier(aiTools);
  const adjustedTUs = estimatedTUs / aiMultiplier;

  const weeks = adjustedTUs / effectiveTUsPerWeek;
  return Math.ceil(weeks * 10) / 10; // Round to 1 decimal place
}

/**
 * Calculate the end date for a task based on start date and allocations
 * @param startDate - ISO date string (YYYY-MM-DD)
 * @param estimatedTUs - Total TUs required for the task
 * @param allocations - Team member allocations
 * @param members - Organization members for looking up modifiers
 * @param aiTools - Applied AI tools
 * @returns ISO date string (YYYY-MM-DD)
 */
export function calculateEndDate(
  startDate: string,
  estimatedTUs: number,
  allocations: TUAllocation[],
  members: OrganizationMember[],
  aiTools: AppliedAITool[]
): string {
  if (!startDate || allocations.length === 0) {
    return '';
  }

  const weeks = calculateWeeksToComplete(estimatedTUs, allocations, members, aiTools);
  const days = Math.ceil(weeks * 7); // Convert weeks to days

  const start = new Date(startDate);
  const end = new Date(start);
  end.setDate(end.getDate() + days);

  return end.toISOString().split('T')[0];
}

/**
 * Calculate the completion time in days for display
 */
export function calculateCompletionDays(
  estimatedTUs: number,
  allocations: TUAllocation[],
  members: OrganizationMember[],
  aiTools: AppliedAITool[]
): number {
  const weeks = calculateWeeksToComplete(estimatedTUs, allocations, members, aiTools);
  return Math.ceil(weeks * 7);
}

/**
 * Get a detailed breakdown of efficiency factors for debugging/display
 */
export interface EfficiencyBreakdown {
  baseTUsPerWeek: number;
  teamSizeEfficiency: number;
  avgTeamLeadership: number;
  avgCollaboration: number;
  avgAIProficiency: number;
  aiMultiplier: number;
  effectiveTUsPerWeek: number;
  weeksToComplete: number;
  daysToComplete: number;
}

export function getEfficiencyBreakdown(
  estimatedTUs: number,
  allocations: TUAllocation[],
  members: OrganizationMember[],
  aiTools: AppliedAITool[]
): EfficiencyBreakdown {
  const teamSize = allocations.length;
  const hasAITools = aiTools && aiTools.length > 0;

  const baseTUsPerWeek = allocations.reduce((sum, a) => sum + a.squaresPerWeek, 0);
  const teamSizeEfficiency = getTeamSizeEfficiency(teamSize);

  // Calculate averages
  let totalLeadership = 0;
  let totalCollaboration = 0;
  let totalAIProficiency = 0;

  allocations.forEach(allocation => {
    const member = members.find(m => m.id === allocation.memberId);
    if (member) {
      totalLeadership += member.teamLeadershipMultiplier ?? 1.0;
      totalCollaboration += member.collaborationMultiplier ?? 1.0;
      totalAIProficiency += member.aiProficiencyMultiplier ?? 1.0;
    }
  });

  const count = allocations.length || 1;
  const avgTeamLeadership = totalLeadership / count;
  const avgCollaboration = totalCollaboration / count;
  const avgAIProficiency = totalAIProficiency / count;

  const aiMultiplier = calculateAIMultiplier(aiTools);
  const effectiveTUsPerWeek = calculateTotalEffectiveTUsPerWeek(allocations, members, hasAITools);
  const weeksToComplete = calculateWeeksToComplete(estimatedTUs, allocations, members, aiTools);
  const daysToComplete = Math.ceil(weeksToComplete * 7);

  return {
    baseTUsPerWeek,
    teamSizeEfficiency,
    avgTeamLeadership,
    avgCollaboration,
    avgAIProficiency,
    aiMultiplier,
    effectiveTUsPerWeek,
    weeksToComplete,
    daysToComplete,
  };
}
