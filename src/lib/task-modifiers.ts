/**
 * Task Modifier System
 * Calculates speed multipliers based on team composition, experience, and leadership
 */

import type { OrganizationMember, Skill } from './organization-seed';
import { getMemberSpeedMultiplier } from './organization-seed';

// ========== TYPES ==========

export interface TaskModifier {
  id: string;
  name: string;
  description: string;
  multiplier: number; // > 1 = faster, < 1 = slower
  category: 'leadership' | 'experience' | 'team' | 'ai' | 'skill';
}

export interface TaskSpeedCalculation {
  baseTimeUnits: number;
  adjustedTimeUnits: number;
  totalMultiplier: number;
  modifiers: TaskModifier[];
  teamComposition: {
    founders: number;
    executives: number;
    apprentices: number;
    total: number;
  };
}

// ========== CONSTANTS ==========

// Leadership modifiers - having senior people involved speeds things up
export const LEADERSHIP_MODIFIERS = {
  FOUNDER_INVOLVED: {
    id: 'founder-involved',
    name: 'Founder Oversight',
    description: 'Founder involvement accelerates decision-making',
    multiplier: 1.25, // 25% faster
    category: 'leadership' as const,
  },
  EXECUTIVE_INVOLVED: {
    id: 'executive-involved',
    name: 'Executive Leadership',
    description: 'Experienced executive guiding the work',
    multiplier: 1.15, // 15% faster
    category: 'leadership' as const,
  },
  MULTIPLE_LEADERS: {
    id: 'multiple-leaders',
    name: 'Leadership Team',
    description: 'Multiple leaders coordinating effort',
    multiplier: 1.1, // 10% faster (diminishing returns)
    category: 'leadership' as const,
  },
};

// Experience modifiers based on tenure
export const EXPERIENCE_MODIFIERS = {
  VETERAN_TEAM: {
    id: 'veteran-team',
    name: 'Veteran Team',
    description: 'Team has 3+ years average experience',
    multiplier: 1.2,
    category: 'experience' as const,
  },
  EXPERIENCED_TEAM: {
    id: 'experienced-team',
    name: 'Experienced Team',
    description: 'Team has 1-3 years average experience',
    multiplier: 1.1,
    category: 'experience' as const,
  },
  NEW_TEAM: {
    id: 'new-team',
    name: 'New Team',
    description: 'Team is still learning the ropes',
    multiplier: 0.9,
    category: 'experience' as const,
  },
};

// Team composition modifiers
export const TEAM_MODIFIERS = {
  SOLO_WORK: {
    id: 'solo-work',
    name: 'Solo Work',
    description: 'Working alone - no coordination overhead',
    multiplier: 1.0,
    category: 'team' as const,
  },
  SMALL_TEAM: {
    id: 'small-team',
    name: 'Small Team',
    description: '2-3 people - efficient collaboration',
    multiplier: 1.15,
    category: 'team' as const,
  },
  MEDIUM_TEAM: {
    id: 'medium-team',
    name: 'Medium Team',
    description: '4-6 people - good throughput with some overhead',
    multiplier: 1.1,
    category: 'team' as const,
  },
  LARGE_TEAM: {
    id: 'large-team',
    name: 'Large Team',
    description: '7+ people - coordination overhead kicks in',
    multiplier: 0.95,
    category: 'team' as const,
  },
};

// AI tool modifiers
export const AI_MODIFIERS = {
  AI_ASSISTED: {
    id: 'ai-assisted',
    name: 'AI Assisted',
    description: 'Team using AI tools effectively',
    multiplier: 1.3,
    category: 'ai' as const,
  },
  PARTIAL_AI: {
    id: 'partial-ai',
    name: 'Partial AI Usage',
    description: 'Some team members using AI tools',
    multiplier: 1.15,
    category: 'ai' as const,
  },
};

// ========== CALCULATION FUNCTIONS ==========

/**
 * Calculate years of experience for a member based on start date
 */
export function getMemberExperienceYears(member: OrganizationMember): number {
  if (!member.startDate) return 1; // Default to 1 year
  const startDate = new Date(member.startDate);
  const now = new Date();
  const years = (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
  return Math.max(0.1, years); // Minimum 0.1 years
}

/**
 * Calculate average experience of a team
 */
export function getTeamAverageExperience(members: OrganizationMember[]): number {
  if (members.length === 0) return 0;
  const totalYears = members.reduce((sum, m) => sum + getMemberExperienceYears(m), 0);
  return totalYears / members.length;
}

/**
 * Get leadership modifier based on team composition
 */
export function getLeadershipModifier(members: OrganizationMember[]): TaskModifier | null {
  const founders = members.filter(m => m.role === 'Founder');
  const executives = members.filter(m => m.role === 'FractionalExec');

  if (founders.length > 0 && executives.length > 0) {
    return LEADERSHIP_MODIFIERS.MULTIPLE_LEADERS;
  }
  if (founders.length > 0) {
    return LEADERSHIP_MODIFIERS.FOUNDER_INVOLVED;
  }
  if (executives.length > 0) {
    return LEADERSHIP_MODIFIERS.EXECUTIVE_INVOLVED;
  }
  return null;
}

/**
 * Get experience modifier based on team average
 */
export function getExperienceModifier(members: OrganizationMember[]): TaskModifier | null {
  const avgExperience = getTeamAverageExperience(members);

  if (avgExperience >= 3) {
    return EXPERIENCE_MODIFIERS.VETERAN_TEAM;
  }
  if (avgExperience >= 1) {
    return EXPERIENCE_MODIFIERS.EXPERIENCED_TEAM;
  }
  if (avgExperience < 0.5) {
    return EXPERIENCE_MODIFIERS.NEW_TEAM;
  }
  return null;
}

/**
 * Get team size modifier
 */
export function getTeamSizeModifier(memberCount: number): TaskModifier {
  if (memberCount === 1) return TEAM_MODIFIERS.SOLO_WORK;
  if (memberCount <= 3) return TEAM_MODIFIERS.SMALL_TEAM;
  if (memberCount <= 6) return TEAM_MODIFIERS.MEDIUM_TEAM;
  return TEAM_MODIFIERS.LARGE_TEAM;
}

/**
 * Get AI usage modifier based on team's AI tools
 */
export function getAIModifier(members: OrganizationMember[], aiToolCount: number): TaskModifier | null {
  if (members.length === 0) return null;

  const avgAIProficiency = members.reduce((sum, m) => sum + (m.aiProficiencyMultiplier || 1.0), 0) / members.length;

  if (aiToolCount > 0 && avgAIProficiency >= 1.2) {
    return AI_MODIFIERS.AI_ASSISTED;
  }
  if (aiToolCount > 0) {
    return AI_MODIFIERS.PARTIAL_AI;
  }
  return null;
}

/**
 * Calculate individual skill contribution to a task
 */
export function getSkillModifier(members: OrganizationMember[]): TaskModifier | null {
  if (members.length === 0) return null;

  const avgSkillMultiplier = members.reduce((sum, m) => sum + getMemberSpeedMultiplier(m), 0) / members.length;

  if (avgSkillMultiplier > 1.0) {
    return {
      id: 'skill-bonus',
      name: 'Skilled Team',
      description: `Team skills provide ${Math.round((avgSkillMultiplier - 1) * 100)}% speed boost`,
      multiplier: avgSkillMultiplier,
      category: 'skill',
    };
  }
  return null;
}

/**
 * Calculate all modifiers for a task based on assigned team
 */
export function calculateTaskModifiers(
  members: OrganizationMember[],
  aiToolCount: number = 0
): TaskModifier[] {
  const modifiers: TaskModifier[] = [];

  // Leadership modifier
  const leadershipMod = getLeadershipModifier(members);
  if (leadershipMod) modifiers.push(leadershipMod);

  // Experience modifier
  const experienceMod = getExperienceModifier(members);
  if (experienceMod) modifiers.push(experienceMod);

  // Team size modifier
  if (members.length > 0) {
    modifiers.push(getTeamSizeModifier(members.length));
  }

  // AI modifier
  const aiMod = getAIModifier(members, aiToolCount);
  if (aiMod) modifiers.push(aiMod);

  // Skill modifier
  const skillMod = getSkillModifier(members);
  if (skillMod) modifiers.push(skillMod);

  return modifiers;
}

/**
 * Calculate the total speed multiplier from all modifiers
 */
export function calculateTotalMultiplier(modifiers: TaskModifier[]): number {
  if (modifiers.length === 0) return 1.0;

  // Multiply all modifiers together
  return modifiers.reduce((total, mod) => total * mod.multiplier, 1.0);
}

/**
 * Calculate adjusted time for a task
 */
export function calculateTaskSpeed(
  baseTimeUnits: number,
  members: OrganizationMember[],
  aiToolCount: number = 0
): TaskSpeedCalculation {
  const modifiers = calculateTaskModifiers(members, aiToolCount);
  const totalMultiplier = calculateTotalMultiplier(modifiers);

  // Higher multiplier = faster = fewer time units needed
  const adjustedTimeUnits = Math.ceil(baseTimeUnits / totalMultiplier);

  return {
    baseTimeUnits,
    adjustedTimeUnits,
    totalMultiplier,
    modifiers,
    teamComposition: {
      founders: members.filter(m => m.role === 'Founder').length,
      executives: members.filter(m => m.role === 'FractionalExec').length,
      apprentices: members.filter(m => m.role === 'Apprentice').length,
      total: members.length,
    },
  };
}

/**
 * Format multiplier as percentage change
 */
export function formatMultiplierAsPercentage(multiplier: number): string {
  const percentage = Math.round((multiplier - 1) * 100);
  if (percentage > 0) return `+${percentage}%`;
  if (percentage < 0) return `${percentage}%`;
  return '0%';
}

/**
 * Get color for modifier based on whether it's positive or negative
 */
export function getModifierColor(multiplier: number): string {
  if (multiplier >= 1.2) return '#10b981'; // Green - very positive
  if (multiplier >= 1.0) return '#3b82f6'; // Blue - positive
  if (multiplier >= 0.9) return '#f59e0b'; // Amber - slight negative
  return '#ef4444'; // Red - negative
}
