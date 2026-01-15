/**
 * Tech Tree System - Data Models
 * RPG-style progression system for Fractional Foundry
 */

export type NodeType = 'main' | 'side-quest';
export type NodeState = 'locked' | 'available' | 'in-progress' | 'completed';
export type ActId = 1 | 2 | 3;

/**
 * A single task within a task pack
 */
export interface TaskItem {
  id: string;
  title: string;
  description: string;
  tuEstimate: number; // Time Units required
  completed: boolean;
}

/**
 * Task pack template - what you must complete to unlock the node
 */
export interface TaskPack {
  id: string;
  title: string;
  description: string;
  tasks: TaskItem[];
  totalTUEstimate: number;
}

/**
 * What unlocks when you complete a node
 */
export interface NodeUnlock {
  type: 'ai-tool' | 'feature' | 'buff' | 'template';
  itemId: string; // Reference to the unlocked item
  title: string;
  description: string;
}

/**
 * Buff applied when node is completed (for side quests)
 */
export interface NodeBuff {
  id: string;
  name: string;
  description: string;
  effect: {
    type: 'speed' | 'quality' | 'cost-reduction' | 'capacity';
    value: number; // e.g., 1.15 for 15% boost
  };
}

/**
 * Proof requirement for boss gates
 */
export interface ProofRequirement {
  type: 'screenshot' | 'url' | 'file' | 'metric';
  description: string;
  required: boolean;
}

/**
 * Tech Tree Node Definition
 */
export interface TechNode {
  id: string;
  actId: ActId; // Which act (1, 2, or 3)
  type: NodeType;
  title: string;
  subtitle: string;
  description: string;

  // Visual position on constellation map
  position: { x: number; y: number };

  // Prerequisites
  prerequisiteNodeIds: string[];

  // Progression
  researchCostTU: number; // TU cost to research/unlock availability
  taskPack: TaskPack; // What you must complete

  // Rewards
  xpReward: number;
  unlocks: NodeUnlock[];
  buff?: NodeBuff; // For side quests

  // Boss gate
  isBossGate: boolean;
  proofRequired?: ProofRequirement[];

  // Story/flavor
  storyText?: string;
  tags: string[];
}

/**
 * User's progress on a specific node
 */
export interface TechNodeProgress {
  nodeId: string;
  state: NodeState;

  // Research phase
  researchStartedAt?: string;
  researchCompletedAt?: string;
  tuInvestedInResearch: number;

  // Task completion phase
  taskPackStartedAt?: string;
  completedTaskIds: string[];

  // Completion
  completedAt?: string;
  proofSubmitted?: {
    type: string;
    data: string; // URL, file path, etc.
    submittedAt: string;
  }[];
}

/**
 * User's overall Tech Tree progression
 */
export interface TechTreeState {
  userId: string; // Or workspaceId

  // XP & Levels
  currentXP: number;
  currentLevel: number;
  xpToNextLevel: number;

  // Node progress
  nodeProgress: Record<string, TechNodeProgress>; // nodeId -> progress

  // Active buffs
  activeBuffs: NodeBuff[];

  // Stats
  totalNodesCompleted: number;
  totalXPEarned: number;
  currentAct: ActId;

  // Timestamps
  createdAt: string;
  lastUpdatedAt: string;
}

/**
 * XP calculation
 */
export interface XPCalculation {
  level: number;
  currentXP: number;
  xpToNextLevel: number;
  xpForCurrentLevel: number; // XP required to reach current level
  percentToNextLevel: number; // 0-100
}

/**
 * Helper function to calculate XP requirements
 */
export function calculateXPForLevel(level: number): number {
  // Exponential curve: Level 1 = 100 XP, Level 2 = 250 XP, Level 3 = 450 XP, etc.
  return Math.floor(100 * Math.pow(level, 1.5));
}

export function calculateLevelFromXP(totalXP: number): XPCalculation {
  let level = 1;
  let xpRequired = 0;

  while (xpRequired <= totalXP) {
    level++;
    xpRequired += calculateXPForLevel(level);
  }

  level--; // Go back to the level we actually reached
  const xpForCurrentLevel = level > 1 ? calculateXPForLevel(level) : 0;
  const currentXP = totalXP - (level > 1 ? xpRequired - calculateXPForLevel(level + 1) : 0);
  const xpToNextLevel = calculateXPForLevel(level + 1);
  const percentToNextLevel = (currentXP / xpToNextLevel) * 100;

  return {
    level,
    currentXP,
    xpToNextLevel,
    xpForCurrentLevel,
    percentToNextLevel,
  };
}
