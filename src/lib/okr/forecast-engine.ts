/**
 * OKR Forecast Engine
 * Pure, deterministic forecasting logic for resource planning
 */

import type { OKR } from '@/lib/state/okr-store';
import type { WorkPlan } from '@/lib/state/work-plan-store';
import type { OrganizationMember, AIAgent } from '@/lib/organization-seed';
import type { Squad } from '@/types';
import type {
  OKRPlan,
  ForecastMetrics,
  ToolEffect,
  CalibrationData,
  ForecastComparison,
} from './planner-types';

// Constants (tunable)
const HOURS_PER_WEEK = {
  Apprentice: 40,
  FractionalExec: 10,
  Founder: 15,
} as const;

const DEFAULT_TASK_HOURS = 8; // Fallback if no estimate
const BASE_OVERHEAD_PCT = 0.10; // 10% base coordination overhead
const OVERHEAD_PER_PERSON = 0.04; // +4% per additional person
const OVERHEAD_PER_FUNCTION = 0.03; // +3% per additional function
const OVERHEAD_PER_OVERLOAD = 0.06; // +6% per apprentice over capacity
const APPRENTICES_PER_EXEC = 3; // Command capacity: 1 exec manages 3 apprentices
const APPRENTICES_PER_FOUNDER = 2; // Command capacity: 1 founder manages 2 apprentices
const MIN_OVERHEAD = 0.10;
const MAX_OVERHEAD = 0.65;

// Skill multipliers
const SKILL_MATCH_MULTIPLIER = 1.0; // Perfect function match
const SKILL_ADJACENT_MULTIPLIER = 0.8; // Adjacent function
const SKILL_MISMATCH_MULTIPLIER = 0.6; // Wrong function

// Tool multipliers
const WEAPON_TOOL_SPEED_BONUS = 0.20; // +20% speed
const UTILITY_TOOL_SPEED_BONUS = 0.10; // +10% speed
const UTILITY_TOOL_OVERHEAD_REDUCTION = 0.05; // -5% overhead
const VERIFICATION_TOOL_OVERHEAD_REDUCTION = 0.02; // -2% overhead (max 6%)
const VERIFICATION_TOOL_REWORK_REDUCTION = 10; // -10% rework risk
const OPS_SUMMARIZER_OVERHEAD_REDUCTION = 0.02; // -2% overhead

// Rework risk
const BASE_REWORK_RISK = 10; // 10% base rework risk
const OVERHEAD_REWORK_FACTOR = 40; // overhead * 40 adds to rework risk
const CROSS_FUNCTION_REWORK = 5; // +5% per additional function
const MIN_REWORK_RISK = 5;
const MAX_REWORK_RISK = 60;

interface ForecastInputs {
  okr: OKR;
  plan: OKRPlan;
  workPlans: WorkPlan[];
  members: OrganizationMember[];
  aiAgents: AIAgent[];
  squads?: Squad[];
  calibration?: CalibrationData;
}

/**
 * Main forecast function - computes all metrics for a plan
 */
export function computeForecast(inputs: ForecastInputs): ForecastMetrics {
  const {
    okr,
    plan,
    workPlans,
    members,
    aiAgents,
    squads = [],
    calibration = { throughputMultiplier: 1.0, overheadMultiplier: 1.0, reworkMultiplier: 1.0 },
  } = inputs;

  // A) Calculate remaining work
  const remainingHours = calculateRemainingHours(workPlans);

  // B) Calculate burn per week
  const burnPerWeekGBP = calculateBurnPerWeek(plan, members, aiAgents);

  // C) Calculate base throughput
  const baseThroughputHours = calculateBaseThroughput(plan, members, aiAgents, okr.function);

  // D) Calculate coordination overhead
  const overheadPct = calculateOverhead(plan, members, aiAgents, calibration);

  // E) Calculate effective throughput
  const effectiveThroughput = baseThroughputHours * (1 - overheadPct);

  // F) Calculate ETA
  // Return null/inf if no throughput (prevents showing unrealistic 999 weeks)
  const etaWeeksP50 = effectiveThroughput > 0 ? remainingHours / effectiveThroughput : Infinity;

  // G) Calculate rework risk
  const reworkRiskPct = calculateReworkRisk(plan, members, aiAgents, overheadPct, calibration);

  // H) Calculate ETA P90 (with rework buffer)
  const etaWeeksP90 = etaWeeksP50 * (1.15 + (reworkRiskPct / 100) * 0.5);

  // I) Calculate total cost
  const totalCostP50 = burnPerWeekGBP * etaWeeksP50;

  // J) Calculate wasted hours and cost
  const wastedHoursPerWeek = baseThroughputHours * overheadPct;
  const wastedCostPerWeekGBP = burnPerWeekGBP * overheadPct;

  // K) Calculate expected rework cost
  const expectedReworkCostGBP = burnPerWeekGBP * (etaWeeksP50 * reworkRiskPct / 100 * 0.5);

  // L) Calculate confidence
  const confidence = calculateConfidence(overheadPct, remainingHours, calibration);

  // M) Calculate baseline comparison (without recursion)
  const comparison = calculateBaselineComparison(
    plan,
    members,
    aiAgents,
    remainingHours,
    baseThroughputHours,
    etaWeeksP50,
    totalCostP50,
    plan.costOfDelayPerWeekGBP,
    calibration
  );

  return {
    burnPerWeekGBP,
    etaWeeksP50,
    etaWeeksP90,
    totalCostP50,
    overheadPct,
    wastedHoursPerWeek,
    wastedCostPerWeekGBP,
    reworkRiskPct,
    expectedReworkCostGBP,
    confidence,
    comparison,
  };
}

/**
 * Calculate remaining hours from work plans
 */
function calculateRemainingHours(workPlans: WorkPlan[]): number {
  // For now, use simple estimation based on status
  // In full system, would sum task.estimatedHours where status != 'done'
  let totalHours = 0;

  workPlans.forEach(wp => {
    if (wp.status === 'completed') return;

    // Estimate based on progress
    const progressRemaining = 100 - wp.progress;
    const estimatedTotalHours = DEFAULT_TASK_HOURS * 5; // Assume 5 tasks per work plan
    totalHours += (estimatedTotalHours * progressRemaining) / 100;
  });

  return totalHours || 80; // Default fallback
}

/**
 * Calculate weekly burn rate
 */
function calculateBurnPerWeek(
  plan: OKRPlan,
  members: OrganizationMember[],
  aiAgents: AIAgent[]
): number {
  let totalWeeklyCost = 0;

  // People costs
  plan.allocations.members.forEach(allocation => {
    const member = members.find(m => m.id === allocation.memberId);
    if (!member) return;

    const dailyRate = member.costPerDay || 0;
    const daysPerWeek = (member.daysPerWeek || 5);
    const weeklyCost = dailyRate * daysPerWeek;
    totalWeeklyCost += weeklyCost * (allocation.allocationPct / 100);
  });

  // AI tool costs
  plan.toolAttachments.forEach(attachment => {
    const memberAllocation = plan.allocations.members.find(a => a.memberId === attachment.memberId);
    if (!memberAllocation || memberAllocation.allocationPct === 0) return;

    attachment.toolIds.forEach(toolId => {
      const tool = aiAgents.find(a => a.id === toolId);
      if (!tool) return;

      const monthlyCost = tool.costPerMonth || 0;
      const weeklyCost = monthlyCost / 4.345;
      totalWeeklyCost += weeklyCost * (memberAllocation.allocationPct / 100);
    });
  });

  return totalWeeklyCost;
}

/**
 * Calculate base throughput (hours/week) before overhead
 */
function calculateBaseThroughput(
  plan: OKRPlan,
  members: OrganizationMember[],
  aiAgents: AIAgent[],
  okrFunction: string
): number {
  let totalThroughput = 0;

  plan.allocations.members.forEach(allocation => {
    const member = members.find(m => m.id === allocation.memberId);
    if (!member) return;

    // Base capacity
    const hoursPerWeek = HOURS_PER_WEEK[member.role] || 40;
    const allocatedHours = hoursPerWeek * (allocation.allocationPct / 100);

    // Skill multiplier
    const skillMult = getSkillMultiplier(member.function, okrFunction);

    // AI tool speed multiplier
    const toolSpeedMult = getToolSpeedMultiplier(allocation.memberId, plan, aiAgents, member.function);

    totalThroughput += allocatedHours * skillMult * toolSpeedMult;
  });

  return totalThroughput;
}

/**
 * Get skill multiplier based on function match
 */
function getSkillMultiplier(memberFunction: string, okrFunction: string): number {
  if (memberFunction === okrFunction) return SKILL_MATCH_MULTIPLIER;

  // Adjacent functions (simplified - in real system would have mapping)
  const adjacent: Record<string, string[]> = {
    'Marketing': ['Sales'],
    'Sales': ['Marketing'],
    'Engineering': ['Ops'],
    'Ops': ['Engineering'],
    'Finance': ['Admin'],
    'Admin': ['Finance'],
  };

  if (adjacent[memberFunction]?.includes(okrFunction)) {
    return SKILL_ADJACENT_MULTIPLIER;
  }

  return SKILL_MISMATCH_MULTIPLIER;
}

/**
 * Get tool speed multiplier for a member
 */
function getToolSpeedMultiplier(
  memberId: string,
  plan: OKRPlan,
  aiAgents: AIAgent[],
  memberFunction: string
): number {
  const attachment = plan.toolAttachments.find(a => a.memberId === memberId);
  if (!attachment) return 1.0;

  let speedMult = 1.0;

  attachment.toolIds.forEach(toolId => {
    const tool = aiAgents.find(a => a.id === toolId);
    if (!tool) return;

    // Check if tool functions match member function (simplified)
    const toolMatchesFunction = tool.functions.includes(memberFunction);

    // Weapon slot: +20% speed if function match
    if (toolMatchesFunction) {
      speedMult += WEAPON_TOOL_SPEED_BONUS;
    }

    // Utility tools: +10% speed
    if (tool.purpose.toLowerCase().includes('automat')) {
      speedMult += UTILITY_TOOL_SPEED_BONUS;
    }
  });

  return speedMult;
}

/**
 * Calculate coordination overhead
 */
function calculateOverhead(
  plan: OKRPlan,
  members: OrganizationMember[],
  aiAgents: AIAgent[],
  calibration: CalibrationData
): number {
  const allocatedMembers = plan.allocations.members.filter(a => a.allocationPct > 0);
  const teamSize = allocatedMembers.length;

  if (teamSize === 0) return MIN_OVERHEAD;

  // Count roles
  let apprenticeCount = 0;
  let execCount = 0;
  let founderCount = 0;
  const functions = new Set<string>();

  allocatedMembers.forEach(allocation => {
    const member = members.find(m => m.id === allocation.memberId);
    if (!member) return;

    if (member.role === 'Apprentice') apprenticeCount++;
    if (member.role === 'FractionalExec') execCount++;
    if (member.role === 'Founder') founderCount++;

    functions.add(member.function);
  });

  // Calculate command capacity
  const commandCapacity = (execCount * APPRENTICES_PER_EXEC) + (founderCount * APPRENTICES_PER_FOUNDER);
  const overload = Math.max(0, apprenticeCount - commandCapacity);

  // Base overhead
  let overhead = BASE_OVERHEAD_PCT;

  // Team size overhead
  overhead += OVERHEAD_PER_PERSON * (teamSize - 1);

  // Cross-function overhead
  const crossFunctionCount = functions.size;
  overhead += OVERHEAD_PER_FUNCTION * (crossFunctionCount - 1);

  // Overload overhead
  overhead += OVERHEAD_PER_OVERLOAD * overload;

  // Tool reductions
  const hasVerificationTools = checkForVerificationTools(plan, aiAgents);
  const hasOpsSummarizer = checkForOpsSummarizer(plan, aiAgents);

  if (hasVerificationTools) {
    overhead -= Math.min(0.06, VERIFICATION_TOOL_OVERHEAD_REDUCTION * 3); // Max 6% reduction
  }

  if (hasOpsSummarizer) {
    overhead -= OPS_SUMMARIZER_OVERHEAD_REDUCTION;
  }

  // Apply calibration
  overhead *= calibration.overheadMultiplier;

  // Clamp
  return Math.max(MIN_OVERHEAD, Math.min(MAX_OVERHEAD, overhead));
}

/**
 * Check if plan has verification tools
 */
function checkForVerificationTools(plan: OKRPlan, aiAgents: AIAgent[]): boolean {
  return plan.toolAttachments.some(attachment =>
    attachment.toolIds.some(toolId => {
      const tool = aiAgents.find(a => a.id === toolId);
      return tool?.purpose.toLowerCase().includes('verif') ||
             tool?.purpose.toLowerCase().includes('quality') ||
             tool?.purpose.toLowerCase().includes('test');
    })
  );
}

/**
 * Check if plan has ops summarizer tools
 */
function checkForOpsSummarizer(plan: OKRPlan, aiAgents: AIAgent[]): boolean {
  return plan.toolAttachments.some(attachment =>
    attachment.toolIds.some(toolId => {
      const tool = aiAgents.find(a => a.id === toolId);
      return tool?.purpose.toLowerCase().includes('summariz') ||
             tool?.purpose.toLowerCase().includes('report');
    })
  );
}

/**
 * Calculate rework risk percentage
 */
function calculateReworkRisk(
  plan: OKRPlan,
  members: OrganizationMember[],
  aiAgents: AIAgent[],
  overheadPct: number,
  calibration: CalibrationData
): number {
  let risk = BASE_REWORK_RISK;

  // Overhead increases rework risk
  risk += overheadPct * OVERHEAD_REWORK_FACTOR;

  // Cross-function complexity
  const functions = new Set<string>();
  plan.allocations.members.forEach(allocation => {
    const member = members.find(m => m.id === allocation.memberId);
    if (member) functions.add(member.function);
  });

  risk += (functions.size - 1) * CROSS_FUNCTION_REWORK;

  // Verification tools reduce risk
  if (checkForVerificationTools(plan, aiAgents)) {
    risk -= VERIFICATION_TOOL_REWORK_REDUCTION;
  }

  // Apply calibration
  risk *= calibration.reworkMultiplier;

  // Clamp
  return Math.max(MIN_REWORK_RISK, Math.min(MAX_REWORK_RISK, risk));
}

/**
 * Calculate forecast confidence
 */
function calculateConfidence(
  overheadPct: number,
  remainingHours: number,
  calibration: CalibrationData
): 'high' | 'medium' | 'low' {
  // High confidence if:
  // - overhead < 25%
  // - has work estimated
  // - calibration is stable (close to 1.0)

  const calibrationStable =
    Math.abs(calibration.throughputMultiplier - 1.0) < 0.2 &&
    Math.abs(calibration.overheadMultiplier - 1.0) < 0.2;

  if (overheadPct < 0.25 && remainingHours > 0 && calibrationStable) {
    return 'high';
  }

  if (overheadPct > 0.45 || remainingHours === 0) {
    return 'low';
  }

  return 'medium';
}

/**
 * Calculate baseline comparison (non-recursive version)
 */
function calculateBaselineComparison(
  plan: OKRPlan,
  members: OrganizationMember[],
  aiAgents: AIAgent[],
  remainingHours: number,
  baseThroughputHours: number,
  currentEta: number,
  currentCost: number,
  costOfDelayPerWeek: number,
  calibration: CalibrationData
): ForecastComparison {
  // Find first apprentice for baseline
  const apprentice = members.find(m => m.role === 'Apprentice');
  if (!apprentice) {
    // No apprentice available, return zero comparison
    return {
      baselineEtaWeeks: currentEta,
      baselineCostGBP: currentCost,
      weeksSaved: 0,
      extraCostGBP: 0,
      costPerWeekSaved: 0,
      netAccelerationValuePerWeek: 0,
    };
  }

  // Calculate baseline metrics manually (1 apprentice at 100%, no tools)
  const baselineHoursPerWeek = HOURS_PER_WEEK.Apprentice;
  const baselineOverhead = MIN_OVERHEAD; // Single person, minimal overhead
  const baselineEffectiveThroughput = baselineHoursPerWeek * (1 - baselineOverhead);
  const baselineEta = baselineEffectiveThroughput > 0 ? remainingHours / baselineEffectiveThroughput : Infinity;

  const apprenticeDailyRate = apprentice.costPerDay || 0;
  const apprenticeDaysPerWeek = apprentice.daysPerWeek || 5;
  const baselineWeeklyCost = apprenticeDailyRate * apprenticeDaysPerWeek;
  const baselineTotalCost = baselineWeeklyCost * baselineEta;

  const weeksSaved = baselineEta - currentEta;
  const extraCostGBP = currentCost - baselineTotalCost;
  const costPerWeekSaved = weeksSaved > 0 ? extraCostGBP / weeksSaved : 0;
  const netAccelerationValuePerWeek = costOfDelayPerWeek - costPerWeekSaved;

  return {
    baselineEtaWeeks: baselineEta,
    baselineCostGBP: baselineTotalCost,
    weeksSaved,
    extraCostGBP,
    costPerWeekSaved,
    netAccelerationValuePerWeek,
  };
}

/**
 * Get tool effects for AI agents (simplified mapping)
 */
export function getToolEffects(toolId: string, aiAgents: AIAgent[]): ToolEffect | null {
  const tool = aiAgents.find(a => a.id === toolId);
  if (!tool) return null;

  const weeklyCost = tool.costPerMonth / 4.345;

  // Simplified effect mapping based on tool purpose
  const purpose = tool.purpose.toLowerCase();

  if (purpose.includes('automat')) {
    return {
      toolId,
      slot: 'weapon',
      speedMult: 1.2,
      qualityMult: 1.0,
      overheadDeltaPct: 0,
      reworkRiskDeltaPct: 0,
      weeklyCostGBP: weeklyCost,
    };
  }

  if (purpose.includes('quality') || purpose.includes('test') || purpose.includes('verif')) {
    return {
      toolId,
      slot: 'armor',
      speedMult: 1.0,
      qualityMult: 1.15,
      overheadDeltaPct: -2,
      reworkRiskDeltaPct: -10,
      weeklyCostGBP: weeklyCost,
    };
  }

  if (purpose.includes('report') || purpose.includes('summariz')) {
    return {
      toolId,
      slot: 'utility',
      speedMult: 1.1,
      qualityMult: 1.0,
      overheadDeltaPct: -2,
      reworkRiskDeltaPct: 0,
      weeklyCostGBP: weeklyCost,
    };
  }

  // Default support tool
  return {
    toolId,
    slot: 'support',
    speedMult: 1.05,
    qualityMult: 1.05,
    overheadDeltaPct: 0,
    reworkRiskDeltaPct: 0,
    weeklyCostGBP: weeklyCost,
  };
}
