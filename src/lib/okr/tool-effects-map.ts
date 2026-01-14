/**
 * Tool Effects Map
 * Maps AI tools to their effects on planning metrics
 *
 * Each tool has:
 * - slot: weapon | armor | utility | support
 * - speedMult: multiplier on effective hours (>1 = faster)
 * - qualityMult: multiplier on quality (>1 = better)
 * - overheadDeltaPct: percentage change to overhead (-2 = reduces by 2%)
 * - reworkRiskDeltaPct: percentage change to rework risk (-10 = reduces by 10%)
 * - weeklyCostGBP: prorated weekly cost
 */

import type { ToolEffect } from './planner-types';
import type { AIAgent } from '../organization-seed';

export type ToolCategory =
  | 'automation'
  | 'verification'
  | 'analysis'
  | 'communication'
  | 'creative'
  | 'sales'
  | 'code'
  | 'design'
  | 'manufacturing';

interface ToolEffectRule {
  keywords: string[];
  slot: ToolEffect['slot'];
  speedMult: number;
  qualityMult: number;
  overheadDeltaPct: number;
  reworkRiskDeltaPct: number;
  category: ToolCategory;
}

// Rules for mapping tool purpose to effects
const TOOL_EFFECT_RULES: ToolEffectRule[] = [
  // WEAPON slot - Speed boosters
  {
    keywords: ['automat', 'workflow', 'scheduling', 'sdr', 'outreach'],
    slot: 'weapon',
    speedMult: 1.25,
    qualityMult: 1.0,
    overheadDeltaPct: 0,
    reworkRiskDeltaPct: 0,
    category: 'automation',
  },
  {
    keywords: ['code completion', 'code generation', 'copilot', 'cursor'],
    slot: 'weapon',
    speedMult: 1.30,
    qualityMult: 1.05,
    overheadDeltaPct: 0,
    reworkRiskDeltaPct: -5,
    category: 'code',
  },
  {
    keywords: ['content creation', 'copywriting', 'marketing copy'],
    slot: 'weapon',
    speedMult: 1.20,
    qualityMult: 1.0,
    overheadDeltaPct: 0,
    reworkRiskDeltaPct: 0,
    category: 'creative',
  },
  {
    keywords: ['cad', 'design', '3d model', 'generative design'],
    slot: 'weapon',
    speedMult: 1.20,
    qualityMult: 1.10,
    overheadDeltaPct: 0,
    reworkRiskDeltaPct: -5,
    category: 'design',
  },

  // ARMOR slot - Quality/Risk reducers
  {
    keywords: ['quality', 'testing', 'verification', 'inspection'],
    slot: 'armor',
    speedMult: 1.0,
    qualityMult: 1.20,
    overheadDeltaPct: -2,
    reworkRiskDeltaPct: -15,
    category: 'verification',
  },
  {
    keywords: ['legal', 'compliance', 'contract', 'regulatory'],
    slot: 'armor',
    speedMult: 1.0,
    qualityMult: 1.15,
    overheadDeltaPct: -3,
    reworkRiskDeltaPct: -10,
    category: 'verification',
  },
  {
    keywords: ['grammar', 'writing assist', 'editing'],
    slot: 'armor',
    speedMult: 1.05,
    qualityMult: 1.10,
    overheadDeltaPct: 0,
    reworkRiskDeltaPct: -8,
    category: 'verification',
  },
  {
    keywords: ['simulation', 'material', 'stress analysis'],
    slot: 'armor',
    speedMult: 0.95, // Slightly slower (takes time to simulate)
    qualityMult: 1.25,
    overheadDeltaPct: 0,
    reworkRiskDeltaPct: -20,
    category: 'manufacturing',
  },

  // UTILITY slot - Overhead reducers
  {
    keywords: ['summariz', 'report', 'meeting notes', 'transcript'],
    slot: 'utility',
    speedMult: 1.10,
    qualityMult: 1.0,
    overheadDeltaPct: -4,
    reworkRiskDeltaPct: 0,
    category: 'communication',
  },
  {
    keywords: ['integration', 'workflow automation', 'zapier'],
    slot: 'utility',
    speedMult: 1.15,
    qualityMult: 1.0,
    overheadDeltaPct: -5,
    reworkRiskDeltaPct: 0,
    category: 'automation',
  },
  {
    keywords: ['document', 'knowledge management', 'notion'],
    slot: 'utility',
    speedMult: 1.05,
    qualityMult: 1.0,
    overheadDeltaPct: -3,
    reworkRiskDeltaPct: -5,
    category: 'communication',
  },

  // SUPPORT slot - General assistants
  {
    keywords: ['assistant', 'general purpose', 'chatgpt', 'claude'],
    slot: 'support',
    speedMult: 1.10,
    qualityMult: 1.05,
    overheadDeltaPct: -2,
    reworkRiskDeltaPct: -5,
    category: 'analysis',
  },
  {
    keywords: ['research', 'intelligence', 'perplexity'],
    slot: 'support',
    speedMult: 1.15,
    qualityMult: 1.0,
    overheadDeltaPct: -2,
    reworkRiskDeltaPct: -3,
    category: 'analysis',
  },
  {
    keywords: ['call analysis', 'conversation', 'gong', 'revenue intelligence'],
    slot: 'support',
    speedMult: 1.0,
    qualityMult: 1.15,
    overheadDeltaPct: -3,
    reworkRiskDeltaPct: -5,
    category: 'sales',
  },
  {
    keywords: ['image generation', 'visual', 'midjourney', 'dall-e'],
    slot: 'support',
    speedMult: 1.20,
    qualityMult: 1.10,
    overheadDeltaPct: 0,
    reworkRiskDeltaPct: 0,
    category: 'creative',
  },
  {
    keywords: ['voice', 'text-to-speech', 'elevenlabs'],
    slot: 'support',
    speedMult: 1.15,
    qualityMult: 1.05,
    overheadDeltaPct: 0,
    reworkRiskDeltaPct: 0,
    category: 'creative',
  },
];

// Default fallback effect
const DEFAULT_EFFECT: Omit<ToolEffect, 'toolId' | 'weeklyCostGBP'> = {
  slot: 'support',
  speedMult: 1.05,
  qualityMult: 1.0,
  overheadDeltaPct: 0,
  reworkRiskDeltaPct: 0,
};

/**
 * Calculate weekly cost from monthly cost
 */
function monthlyToWeekly(monthlyCost: number): number {
  return monthlyCost / 4.345; // Average weeks per month
}

/**
 * Get tool effect for a single AI agent
 */
export function getToolEffect(agent: AIAgent): ToolEffect {
  const purposeLower = agent.purpose.toLowerCase();
  const nameLower = agent.name.toLowerCase();
  const searchText = `${purposeLower} ${nameLower}`;

  // Find matching rule
  const matchedRule = TOOL_EFFECT_RULES.find((rule) =>
    rule.keywords.some((keyword) => searchText.includes(keyword))
  );

  const weeklyCostGBP = monthlyToWeekly(agent.costPerMonth || 0);

  if (matchedRule) {
    return {
      toolId: agent.id,
      slot: matchedRule.slot,
      speedMult: matchedRule.speedMult,
      qualityMult: matchedRule.qualityMult,
      overheadDeltaPct: matchedRule.overheadDeltaPct,
      reworkRiskDeltaPct: matchedRule.reworkRiskDeltaPct,
      weeklyCostGBP,
    };
  }

  // Default effect
  return {
    ...DEFAULT_EFFECT,
    toolId: agent.id,
    weeklyCostGBP,
  };
}

/**
 * Build a map of all tool effects for quick lookup
 */
export function buildToolEffectsMap(agents: AIAgent[]): Map<string, ToolEffect> {
  const map = new Map<string, ToolEffect>();
  for (const agent of agents) {
    map.set(agent.id, getToolEffect(agent));
  }
  return map;
}

/**
 * Get tools grouped by slot
 */
export function groupToolsBySlot(agents: AIAgent[]): {
  weapon: AIAgent[];
  armor: AIAgent[];
  utility: AIAgent[];
  support: AIAgent[];
} {
  const result = {
    weapon: [] as AIAgent[],
    armor: [] as AIAgent[],
    utility: [] as AIAgent[],
    support: [] as AIAgent[],
  };

  for (const agent of agents) {
    const effect = getToolEffect(agent);
    result[effect.slot].push(agent);
  }

  return result;
}

/**
 * Get recommended tools for a role and function
 */
export function getRecommendedTools(
  agents: AIAgent[],
  role: 'Founder' | 'FractionalExec' | 'Apprentice',
  businessFunction: string
): AIAgent[] {
  // Filter agents that match the function
  const functionMatches = agents.filter(
    (agent) =>
      agent.functions.includes(businessFunction) || agent.functions.includes('Admin')
  );

  // Sort by relevance and cost-effectiveness
  const effectsMap = buildToolEffectsMap(functionMatches);

  return functionMatches.sort((a, b) => {
    const effectA = effectsMap.get(a.id)!;
    const effectB = effectsMap.get(b.id)!;

    // Calculate impact score (speed + quality - overhead)
    const scoreA =
      effectA.speedMult + effectA.qualityMult - effectA.overheadDeltaPct / 100;
    const scoreB =
      effectB.speedMult + effectB.qualityMult - effectB.overheadDeltaPct / 100;

    return scoreB - scoreA; // Higher score first
  });
}

/**
 * Calculate combined effect of multiple tools
 */
export function combinedToolEffect(
  toolIds: string[],
  effectsMap: Map<string, ToolEffect>
): {
  totalSpeedMult: number;
  totalQualityMult: number;
  totalOverheadDelta: number;
  totalReworkDelta: number;
  totalWeeklyCost: number;
  slotsCovered: Set<ToolEffect['slot']>;
} {
  let totalSpeedMult = 1.0;
  let totalQualityMult = 1.0;
  let totalOverheadDelta = 0;
  let totalReworkDelta = 0;
  let totalWeeklyCost = 0;
  const slotsCovered = new Set<ToolEffect['slot']>();

  for (const toolId of toolIds) {
    const effect = effectsMap.get(toolId);
    if (!effect) continue;

    // Multiplicative for speed/quality
    totalSpeedMult *= effect.speedMult;
    totalQualityMult *= effect.qualityMult;

    // Additive for deltas
    totalOverheadDelta += effect.overheadDeltaPct;
    totalReworkDelta += effect.reworkRiskDeltaPct;
    totalWeeklyCost += effect.weeklyCostGBP;

    slotsCovered.add(effect.slot);
  }

  // Cap speed multiplier to avoid unrealistic values
  totalSpeedMult = Math.min(totalSpeedMult, 2.0);
  totalQualityMult = Math.min(totalQualityMult, 1.5);

  // Cap delta reductions
  totalOverheadDelta = Math.max(totalOverheadDelta, -20);
  totalReworkDelta = Math.max(totalReworkDelta, -50);

  return {
    totalSpeedMult: Math.round(totalSpeedMult * 100) / 100,
    totalQualityMult: Math.round(totalQualityMult * 100) / 100,
    totalOverheadDelta,
    totalReworkDelta,
    totalWeeklyCost: Math.round(totalWeeklyCost),
    slotsCovered,
  };
}

/**
 * Get slot color for display
 */
export function getSlotColor(slot: ToolEffect['slot']): string {
  switch (slot) {
    case 'weapon':
      return '#ef4444'; // Red
    case 'armor':
      return '#3b82f6'; // Blue
    case 'utility':
      return '#10b981'; // Green
    case 'support':
      return '#8b5cf6'; // Purple
    default:
      return '#64748b'; // Gray
  }
}

/**
 * Get slot icon name (for lucide)
 */
export function getSlotIcon(slot: ToolEffect['slot']): string {
  switch (slot) {
    case 'weapon':
      return 'Zap';
    case 'armor':
      return 'Shield';
    case 'utility':
      return 'Wrench';
    case 'support':
      return 'HeartHandshake';
    default:
      return 'Circle';
  }
}

/**
 * Get slot label
 */
export function getSlotLabel(slot: ToolEffect['slot']): string {
  switch (slot) {
    case 'weapon':
      return 'Speed Booster';
    case 'armor':
      return 'Quality Shield';
    case 'utility':
      return 'Overhead Reducer';
    case 'support':
      return 'General Assistant';
    default:
      return 'Tool';
  }
}
