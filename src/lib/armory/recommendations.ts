/**
 * AI Tool Recommendation Logic
 * Recommends AI tools based on member function and role
 */

import type { OrganizationMember, AIAgent } from '@/lib/organization-seed';
import type { Function as BusinessFunction, EquipmentSlot } from '@/types';
import { TOOL_EFFECTS_MAP } from './tool-effects';

export interface RecommendedTool {
  tool: AIAgent;
  score: number;
  reason: string;
  suggestedSlot: EquipmentSlot;
}

/**
 * Get recommended tools for a member based on their function
 */
export function getRecommendedToolsForMember(
  member: OrganizationMember,
  allTools: AIAgent[]
): RecommendedTool[] {
  const recommendations: RecommendedTool[] = [];

  for (const tool of allTools) {
    // Skip inactive tools
    if (tool.status !== 'active') continue;

    let score = 0;
    const reasons: string[] = [];

    // Primary function match (highest weight)
    if (tool.functions.includes(member.function)) {
      score += 100;
      reasons.push(`Matches ${member.function}`);
    }

    // Check if tool category matches function
    const toolEffects = TOOL_EFFECTS_MAP[tool.id];
    if (toolEffects) {
      const functionCategoryMap: Record<BusinessFunction, string[]> = {
        Finance: ['finance', 'productivity'],
        Sales: ['sales', 'productivity'],
        Marketing: ['marketing', 'design', 'productivity'],
        Ops: ['operations', 'productivity'],
        Engineering: ['engineering', 'design', 'productivity'],
        Admin: ['productivity'],
      };

      const relevantCategories = functionCategoryMap[member.function as BusinessFunction] || [];
      if (relevantCategories.includes(toolEffects.category)) {
        score += 50;
        reasons.push('Category match');
      }
    }

    // Role-specific bonuses
    if (member.role === 'Founder') {
      // Founders benefit from strategic/analysis tools
      if (tool.name.includes('GPT') || tool.name.includes('Analysis') || tool.name.includes('Pro')) {
        score += 30;
        reasons.push('Strategic tool');
      }
    } else if (member.role === 'FractionalExec') {
      // Execs benefit from management/oversight tools
      if (tool.name.includes('Gong') || tool.name.includes('Harvey') || tool.name.includes('Hebbia')) {
        score += 25;
        reasons.push('Management tool');
      }
    } else if (member.role === 'Apprentice') {
      // Apprentices benefit from productivity/learning tools
      if (tool.name.includes('Copilot') || tool.name.includes('Cursor') || tool.name.includes('Ghostwriter')) {
        score += 20;
        reasons.push('Learning tool');
      }
    }

    // Cost efficiency for apprentices (prefer lower cost)
    if (member.role === 'Apprentice' && tool.costPerMonth < 150) {
      score += 15;
      reasons.push('Cost-effective');
    }

    // Higher cost tools get bonus for execs and founders
    if ((member.role === 'Founder' || member.role === 'FractionalExec') && tool.costPerMonth >= 400) {
      score += 10;
      reasons.push('Enterprise-grade');
    }

    // Already used by similar roles
    const usedBy = tool.usedBy;
    if (usedBy.includes(member.id)) {
      score += 200; // Heavily prioritize already-used tools
      reasons.push('Currently using');
    } else if (usedBy.includes('All team members')) {
      score += 40;
      reasons.push('Team-wide tool');
    }

    // Only recommend if score is meaningful
    if (score > 0) {
      recommendations.push({
        tool,
        score,
        reason: reasons.join(', '),
        suggestedSlot: toolEffects?.suggestedSlot || 'utility',
      });
    }
  }

  // Sort by score descending
  return recommendations.sort((a, b) => b.score - a.score);
}

/**
 * Get a balanced starter kit for a member
 * Ensures one tool per slot: weapon, armor, utility
 */
export function getStarterKit(
  member: OrganizationMember,
  allTools: AIAgent[]
): Record<EquipmentSlot, AIAgent | null> {
  const recommended = getRecommendedToolsForMember(member, allTools);
  const starterKit: Record<EquipmentSlot, AIAgent | null> = {
    weapon: null,
    armor: null,
    utility: null,
    support: null,
  };

  // Helper to find best tool for a slot
  const findBestForSlot = (slot: EquipmentSlot): AIAgent | null => {
    const toolForSlot = recommended.find(
      (r) => r.suggestedSlot === slot && !Object.values(starterKit).includes(r.tool)
    );
    return toolForSlot?.tool || null;
  };

  // Prioritize: weapon > armor > utility > support
  starterKit.weapon = findBestForSlot('weapon');
  starterKit.armor = findBestForSlot('armor');
  starterKit.utility = findBestForSlot('utility');
  // Support is optional, only add if we have a good match
  starterKit.support = findBestForSlot('support');

  return starterKit;
}

/**
 * Filter tools by function
 */
export function getToolsByFunction(func: BusinessFunction, allTools: AIAgent[]): AIAgent[] {
  return allTools.filter(
    (tool) => tool.status === 'active' && tool.functions.includes(func)
  );
}

/**
 * Get general-purpose tools (Admin function)
 */
export function getGeneralPurposeTools(allTools: AIAgent[]): AIAgent[] {
  return allTools.filter(
    (tool) => tool.status === 'active' && tool.functions.includes('Admin')
  );
}

/**
 * Calculate member power score (base stats)
 */
export function calculateMemberPower(member: OrganizationMember): number {
  let basePower = 0;

  // Role-based power
  if (member.role === 'Founder') basePower = 100;
  else if (member.role === 'FractionalExec') basePower = 80;
  else if (member.role === 'Apprentice') basePower = 50;

  // Cost-based seniority (higher cost = more senior)
  const costMultiplier = member.costPerDay ? Math.min(member.costPerDay / 100, 20) : 0;
  basePower += costMultiplier;

  return Math.round(basePower);
}

/**
 * Calculate power bonus from equipped gear
 */
export function calculateGearBonus(equippedTools: AIAgent[]): number {
  let bonus = 0;

  for (const tool of equippedTools) {
    const toolEffects = TOOL_EFFECTS_MAP[tool.id];
    if (!toolEffects) continue;

    // Each effect tag adds power
    bonus += toolEffects.effectTags.length * 5;

    // Rarity multiplier
    if (toolEffects.rarity === 'epic') bonus += 15;
    else if (toolEffects.rarity === 'rare') bonus += 10;
    else bonus += 5;
  }

  return bonus;
}

/**
 * Calculate total member power with gear
 */
export function calculateTotalPower(
  member: OrganizationMember,
  equippedTools: AIAgent[]
): number {
  const basePower = calculateMemberPower(member);
  const gearBonus = calculateGearBonus(equippedTools);
  return basePower + gearBonus;
}
