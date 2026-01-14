/**
 * Capacity Engine
 * Tracks person-level utilization and burnout risk across all OKRs
 *
 * Key concepts:
 * - Each person has base hours/week based on role and daysPerWeek
 * - Allocations across OKRs sum to total utilization
 * - >100% utilization = overload (increases overhead across ALL plans)
 * - Burnout risk increases with sustained overload
 */

import type { OrganizationMember } from '@/lib/organization-seed';
import type { OKRPlan, MemberAllocation } from './planner-types';

const HOURS_PER_DAY = 8;
const OVERLOAD_THRESHOLD = 100; // 100% utilization
const HIGH_UTILIZATION_THRESHOLD = 85; // 85%
const BURNOUT_WEEKS_THRESHOLD = 4; // Weeks of sustained overload

export interface PersonCapacity {
  memberId: string;
  name: string;
  role: OrganizationMember['role'];
  function: string;
  baseHoursPerWeek: number;
  allocatedHoursPerWeek: number;
  utilizationPct: number;
  isOverloaded: boolean;
  allocations: {
    okrId: string;
    okrTitle: string;
    allocationPct: number;
    allocatedHours: number;
  }[];
  costPerWeekGBP: number;
  burnoutRisk: 'low' | 'medium' | 'high';
}

export interface TeamCapacity {
  totalBaseHours: number;
  totalAllocatedHours: number;
  totalUtilizationPct: number;
  totalCostPerWeekGBP: number;
  overloadedCount: number;
  underutilizedCount: number;
  members: PersonCapacity[];
}

export interface CapacityByFunction {
  function: string;
  totalHours: number;
  allocatedHours: number;
  utilizationPct: number;
  memberCount: number;
}

export interface CapacityInput {
  members: OrganizationMember[];
  plans: OKRPlan[];
  okrTitles: Map<string, string>; // okrId -> title
  overloadHistoryWeeks?: Map<string, number>; // memberId -> weeks of sustained overload
}

/**
 * Calculate base hours per week for a member
 */
export function getBaseHoursPerWeek(member: OrganizationMember): number {
  const daysPerWeek = member.daysPerWeek ?? 5;
  return daysPerWeek * HOURS_PER_DAY;
}

/**
 * Calculate burnout risk based on utilization and history
 */
export function calculateBurnoutRisk(
  utilizationPct: number,
  overloadWeeks: number
): 'low' | 'medium' | 'high' {
  if (utilizationPct <= HIGH_UTILIZATION_THRESHOLD) {
    return 'low';
  }

  if (utilizationPct > OVERLOAD_THRESHOLD && overloadWeeks >= BURNOUT_WEEKS_THRESHOLD) {
    return 'high';
  }

  if (utilizationPct > HIGH_UTILIZATION_THRESHOLD) {
    return 'medium';
  }

  return 'low';
}

/**
 * Calculate capacity for a single member across all plans
 */
export function calculatePersonCapacity(
  member: OrganizationMember,
  plans: OKRPlan[],
  okrTitles: Map<string, string>,
  overloadHistoryWeeks: number = 0
): PersonCapacity {
  const baseHours = getBaseHoursPerWeek(member);

  // Collect allocations across all plans
  const allocations: PersonCapacity['allocations'] = [];
  let totalAllocatedPct = 0;

  for (const plan of plans) {
    const memberAllocation = plan.allocations.members.find(
      (a) => a.memberId === member.id
    );
    if (memberAllocation && memberAllocation.allocationPct > 0) {
      const allocatedHours = (baseHours * memberAllocation.allocationPct) / 100;
      allocations.push({
        okrId: plan.okrId,
        okrTitle: okrTitles.get(plan.okrId) ?? 'Unknown OKR',
        allocationPct: memberAllocation.allocationPct,
        allocatedHours,
      });
      totalAllocatedPct += memberAllocation.allocationPct;
    }
  }

  const allocatedHours = (baseHours * totalAllocatedPct) / 100;
  const utilizationPct = totalAllocatedPct;
  const isOverloaded = utilizationPct > OVERLOAD_THRESHOLD;

  // Calculate cost
  const dailyCost = member.costPerDay ?? 0;
  const daysPerWeek = member.daysPerWeek ?? 5;
  const costPerWeekGBP = dailyCost * daysPerWeek * (Math.min(utilizationPct, 100) / 100);

  const burnoutRisk = calculateBurnoutRisk(utilizationPct, overloadHistoryWeeks);

  return {
    memberId: member.id,
    name: member.name,
    role: member.role,
    function: member.function,
    baseHoursPerWeek: baseHours,
    allocatedHoursPerWeek: allocatedHours,
    utilizationPct,
    isOverloaded,
    allocations,
    costPerWeekGBP,
    burnoutRisk,
  };
}

/**
 * Calculate capacity for the entire team
 */
export function calculateTeamCapacity(input: CapacityInput): TeamCapacity {
  const { members, plans, okrTitles, overloadHistoryWeeks = new Map() } = input;

  const memberCapacities = members.map((member) =>
    calculatePersonCapacity(
      member,
      plans,
      okrTitles,
      overloadHistoryWeeks.get(member.id) ?? 0
    )
  );

  const totalBaseHours = memberCapacities.reduce(
    (sum, c) => sum + c.baseHoursPerWeek,
    0
  );
  const totalAllocatedHours = memberCapacities.reduce(
    (sum, c) => sum + c.allocatedHoursPerWeek,
    0
  );
  const totalCostPerWeekGBP = memberCapacities.reduce(
    (sum, c) => sum + c.costPerWeekGBP,
    0
  );
  const totalUtilizationPct =
    totalBaseHours > 0 ? (totalAllocatedHours / totalBaseHours) * 100 : 0;

  const overloadedCount = memberCapacities.filter((c) => c.isOverloaded).length;
  const underutilizedCount = memberCapacities.filter(
    (c) => c.utilizationPct < 50
  ).length;

  return {
    totalBaseHours,
    totalAllocatedHours,
    totalUtilizationPct: Math.round(totalUtilizationPct * 10) / 10,
    totalCostPerWeekGBP: Math.round(totalCostPerWeekGBP),
    overloadedCount,
    underutilizedCount,
    members: memberCapacities,
  };
}

/**
 * Calculate capacity grouped by function
 */
export function calculateCapacityByFunction(
  teamCapacity: TeamCapacity
): CapacityByFunction[] {
  const byFunction = new Map<string, CapacityByFunction>();

  for (const member of teamCapacity.members) {
    const existing = byFunction.get(member.function);
    if (existing) {
      existing.totalHours += member.baseHoursPerWeek;
      existing.allocatedHours += member.allocatedHoursPerWeek;
      existing.memberCount += 1;
    } else {
      byFunction.set(member.function, {
        function: member.function,
        totalHours: member.baseHoursPerWeek,
        allocatedHours: member.allocatedHoursPerWeek,
        utilizationPct: 0, // Will calculate below
        memberCount: 1,
      });
    }
  }

  // Calculate utilization for each function
  return Array.from(byFunction.values()).map((func) => ({
    ...func,
    utilizationPct:
      func.totalHours > 0
        ? Math.round((func.allocatedHours / func.totalHours) * 100 * 10) / 10
        : 0,
  }));
}

/**
 * Find available capacity for a given function
 */
export function findAvailableCapacity(
  teamCapacity: TeamCapacity,
  targetFunction: string,
  minAvailablePct: number = 25
): PersonCapacity[] {
  return teamCapacity.members.filter((member) => {
    // Match function or allow cross-function for founders/execs
    const functionMatch =
      member.function === targetFunction ||
      member.role === 'Founder' ||
      member.role === 'FractionalExec';

    // Has available capacity
    const availablePct = 100 - member.utilizationPct;
    const hasCapacity = availablePct >= minAvailablePct;

    return functionMatch && hasCapacity;
  });
}

/**
 * Calculate impact of adding allocation to an OKR
 */
export function calculateAllocationImpact(
  currentCapacity: TeamCapacity,
  newAllocations: MemberAllocation[]
): {
  newOverloadedCount: number;
  additionalCostPerWeek: number;
  affectedMembers: {
    memberId: string;
    name: string;
    currentUtilization: number;
    newUtilization: number;
    willBeOverloaded: boolean;
  }[];
} {
  const affectedMembers: {
    memberId: string;
    name: string;
    currentUtilization: number;
    newUtilization: number;
    willBeOverloaded: boolean;
  }[] = [];

  let additionalCostPerWeek = 0;

  for (const allocation of newAllocations) {
    const member = currentCapacity.members.find(
      (m) => m.memberId === allocation.memberId
    );
    if (!member) continue;

    const newUtilization = member.utilizationPct + allocation.allocationPct;
    const willBeOverloaded = newUtilization > OVERLOAD_THRESHOLD;

    affectedMembers.push({
      memberId: member.memberId,
      name: member.name,
      currentUtilization: member.utilizationPct,
      newUtilization,
      willBeOverloaded,
    });

    // Calculate additional cost
    const dailyCost = (member.costPerWeekGBP / (member.utilizationPct || 100)) * 100;
    additionalCostPerWeek +=
      (dailyCost * Math.min(allocation.allocationPct, 100 - member.utilizationPct)) / 100;
  }

  const newOverloadedCount = affectedMembers.filter((m) => m.willBeOverloaded)
    .length;

  return {
    newOverloadedCount,
    additionalCostPerWeek: Math.round(additionalCostPerWeek),
    affectedMembers,
  };
}

/**
 * Get capacity utilization summary for display
 */
export function getCapacitySummary(teamCapacity: TeamCapacity): {
  totalUtilization: string;
  healthStatus: 'healthy' | 'warning' | 'critical';
  overloadedNames: string[];
  underutilizedNames: string[];
} {
  const healthStatus: 'healthy' | 'warning' | 'critical' =
    teamCapacity.overloadedCount > 2
      ? 'critical'
      : teamCapacity.overloadedCount > 0
      ? 'warning'
      : 'healthy';

  return {
    totalUtilization: `${teamCapacity.totalUtilizationPct}%`,
    healthStatus,
    overloadedNames: teamCapacity.members
      .filter((m) => m.isOverloaded)
      .map((m) => m.name),
    underutilizedNames: teamCapacity.members
      .filter((m) => m.utilizationPct < 50)
      .map((m) => m.name),
  };
}
