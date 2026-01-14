/**
 * Recommendation Engine
 * Scores and ranks plan presets based on OKR criteria and organizational constraints
 */

import type { OKR } from '@/lib/state/okr-store';
import type { WorkPlan } from '@/lib/state/work-plan-store';
import type { OrganizationMember, AIAgent } from '@/lib/organization-seed';
import type { PlanPreset, RecommendedPlan, OKRPlan, ForecastMetrics } from './planner-types';
import { PLAN_ARCHETYPES, getPresetsForCriteria } from './plan-library';
import { computeForecast } from './forecast-engine';

interface RecommendationInputs {
  okr: OKR;
  workPlans: WorkPlan[];
  members: OrganizationMember[];
  aiAgents: AIAgent[];
  costOfDelayPerWeekGBP: number;
  targetWeeks?: number;
  currentRunwayWeeks?: number;
}

/**
 * Get top 3 recommended plans for an OKR
 */
export function getTopRecommendations(inputs: RecommendationInputs): RecommendedPlan[] {
  const {
    okr,
    workPlans,
    members,
    aiAgents,
    costOfDelayPerWeekGBP,
    targetWeeks = 8,
    currentRunwayWeeks,
  } = inputs;

  // Filter presets by function and urgency
  const matchingPresets = getPresetsForCriteria(
    okr.function,
    costOfDelayPerWeekGBP,
    currentRunwayWeeks
  );

  // If no matching presets, use all presets
  const presetsToScore = matchingPresets.length > 0 ? matchingPresets : PLAN_ARCHETYPES;

  // Check if we have enough members
  if (members.length === 0) {
    return [];
  }

  // Score each preset
  const scoredPlans = presetsToScore.map((preset) => {
    const plan = buildPlanFromPreset(preset, okr, members, targetWeeks);

    // Skip if plan has no members allocated
    if (plan.allocations.members.length === 0) {
      return null;
    }

    const forecast = computeForecast({
      okr,
      plan,
      workPlans,
      members,
      aiAgents,
    });

    const score = scorePreset(preset, forecast, {
      costOfDelayPerWeekGBP,
      targetWeeks,
      currentRunwayWeeks,
      availableMembers: members.length,
      okrFunction: okr.function,
    });

    const reasoning = explainScore(preset, forecast, {
      costOfDelayPerWeekGBP,
      targetWeeks,
      currentRunwayWeeks,
    });

    return {
      preset,
      score,
      reasoning,
      forecast,
    };
  }).filter((plan): plan is RecommendedPlan => plan !== null);

  // Sort by score descending and return top 3
  return scoredPlans
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

/**
 * Build an OKRPlan from a preset
 */
function buildPlanFromPreset(
  preset: PlanPreset,
  okr: OKR,
  members: OrganizationMember[],
  targetWeeks: number
): OKRPlan {
  const { defaultAllocations } = preset;

  // Select members based on preset requirements
  const apprentices = members.filter(m => m.role === 'Apprentice').slice(0, defaultAllocations.apprenticeCount);
  const execs = members.filter(m => m.role === 'FractionalExec').slice(0, defaultAllocations.execCount);
  const founder = defaultAllocations.founderInvolved
    ? members.filter(m => m.role === 'Founder').slice(0, 1)
    : [];

  const allocatedMembers = [...founder, ...execs, ...apprentices];

  const plan: OKRPlan = {
    id: `plan-preset-${preset.id}-${Date.now()}`,
    workspaceId: okr.workspaceId,
    okrId: okr.id,
    targetWeeks,
    costOfDelayPerWeekGBP: 0, // Will be set by user
    allocations: {
      members: allocatedMembers.map(m => ({
        memberId: m.id,
        allocationPct: defaultAllocations.allocationPct,
      })),
    },
    toolAttachments: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastAppliedPresetId: preset.id,
  };

  return plan;
}

/**
 * Score a preset (0-100)
 */
function scorePreset(
  preset: PlanPreset,
  forecast: ForecastMetrics,
  context: {
    costOfDelayPerWeekGBP: number;
    targetWeeks?: number;
    currentRunwayWeeks?: number;
    availableMembers: number;
    okrFunction: string;
  }
): number {
  let score = 50; // Base score

  // 1. Function match (0-20 points)
  const functionMatch = preset.intendedFor.functions.includes(context.okrFunction as any);
  if (functionMatch) score += 20;

  // 2. Urgency match (0-20 points)
  const [minCoD, maxCoD] = preset.intendedFor.urgencyRange;
  if (context.costOfDelayPerWeekGBP >= minCoD && context.costOfDelayPerWeekGBP <= maxCoD) {
    score += 20;
  } else {
    // Partial credit if close
    const distance = Math.min(
      Math.abs(context.costOfDelayPerWeekGBP - minCoD),
      Math.abs(context.costOfDelayPerWeekGBP - maxCoD)
    );
    const proximityScore = Math.max(0, 20 - distance / 1000);
    score += proximityScore;
  }

  // 3. Target weeks match (0-15 points)
  if (context.targetWeeks) {
    const weeksDelta = Math.abs(forecast.etaWeeksP50 - context.targetWeeks);
    if (weeksDelta === 0) {
      score += 15;
    } else if (weeksDelta <= 2) {
      score += 10;
    } else if (weeksDelta <= 4) {
      score += 5;
    }
  }

  // 4. Runway fit (0-15 points)
  if (context.currentRunwayWeeks) {
    const affordableWeeks = Math.floor(context.currentRunwayWeeks / 2); // Use max 50% of runway
    if (forecast.etaWeeksP50 <= affordableWeeks) {
      score += 15;
    } else {
      // Penalty for exceeding runway
      score -= 10;
    }
  }

  // 5. Overhead efficiency (0-10 points)
  if (forecast.overheadPct < 0.20) {
    score += 10; // Low overhead
  } else if (forecast.overheadPct < 0.35) {
    score += 5; // Moderate overhead
  } else if (forecast.overheadPct > 0.50) {
    score -= 5; // High overhead penalty
  }

  // 6. Confidence (0-10 points)
  const confidenceScore = {
    high: 10,
    medium: 5,
    low: 0,
  }[forecast.confidence];
  score += confidenceScore;

  // 7. Rework risk (0-10 points)
  if (forecast.reworkRiskPct < 15) {
    score += 10; // Low rework risk
  } else if (forecast.reworkRiskPct < 30) {
    score += 5; // Moderate rework risk
  } else {
    score -= 5; // High rework risk penalty
  }

  // Clamp score to 0-100
  return Math.max(0, Math.min(100, score));
}

/**
 * Explain why a preset scored the way it did
 */
function explainScore(
  preset: PlanPreset,
  forecast: ForecastMetrics,
  context: {
    costOfDelayPerWeekGBP: number;
    targetWeeks?: number;
    currentRunwayWeeks?: number;
  }
): string {
  const reasons: string[] = [];

  // Function match
  reasons.push(`Designed for ${preset.intendedFor.functions.join(', ')} functions`);

  // Speed vs cost
  if (forecast.etaWeeksP50 <= 4) {
    reasons.push(`Fast delivery in ${forecast.etaWeeksP50.toFixed(1)} weeks`);
  } else if (forecast.etaWeeksP50 <= 8) {
    reasons.push(`Moderate delivery in ${forecast.etaWeeksP50.toFixed(1)} weeks`);
  } else {
    reasons.push(`Slow but affordable delivery in ${forecast.etaWeeksP50.toFixed(1)} weeks`);
  }

  // Cost
  const weeklyCost = forecast.burnPerWeekGBP;
  if (weeklyCost < 5000) {
    reasons.push(`Low weekly cost £${(weeklyCost / 1000).toFixed(1)}K`);
  } else if (weeklyCost < 15000) {
    reasons.push(`Moderate weekly cost £${(weeklyCost / 1000).toFixed(1)}K`);
  } else {
    reasons.push(`High weekly cost £${(weeklyCost / 1000).toFixed(1)}K`);
  }

  // Overhead
  if (forecast.overheadPct < 0.20) {
    reasons.push(`Minimal coordination overhead (${(forecast.overheadPct * 100).toFixed(0)}%)`);
  } else if (forecast.overheadPct > 0.40) {
    reasons.push(`High coordination overhead (${(forecast.overheadPct * 100).toFixed(0)}%) - may need mitigation`);
  }

  // Rework risk
  if (forecast.reworkRiskPct > 30) {
    reasons.push(`Elevated rework risk (${forecast.reworkRiskPct.toFixed(0)}%) - consider Quality Shield tools`);
  }

  // Target match
  if (context.targetWeeks) {
    const weeksDelta = forecast.etaWeeksP50 - context.targetWeeks;
    if (weeksDelta < -2) {
      reasons.push(`Finishes ${Math.abs(weeksDelta).toFixed(0)} weeks ahead of target`);
    } else if (weeksDelta > 2) {
      reasons.push(`Will miss target by ${weeksDelta.toFixed(0)} weeks - consider Speed Run`);
    }
  }

  return reasons.join('. ');
}

/**
 * Get efficient frontier (cheapest, balanced, fastest)
 */
export function getEfficientFrontier(inputs: RecommendationInputs) {
  const recommendations = getTopRecommendations(inputs);

  if (recommendations.length === 0) {
    return null;
  }

  // Sort by cost (cheapest first)
  const sortedByCost = [...recommendations].sort(
    (a, b) => a.forecast.burnPerWeekGBP - b.forecast.burnPerWeekGBP
  );

  // Sort by speed (fastest first)
  const sortedBySpeed = [...recommendations].sort(
    (a, b) => a.forecast.etaWeeksP50 - b.forecast.etaWeeksP50
  );

  return {
    cheapest: sortedByCost[0],
    balanced: recommendations[0], // Highest score is balanced
    fastest: sortedBySpeed[0],
  };
}
