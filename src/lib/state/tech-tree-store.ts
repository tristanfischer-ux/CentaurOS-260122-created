/**
 * Tech Tree Zustand Store
 * Manages progression, unlocks, XP, and node states
 */

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { mmkvStorage } from '@/lib/storage/mmkv-storage';
import {
  TechNode,
  TechNodeProgress,
  TechTreeState,
  NodeState,
  NodeBuff,
  calculateLevelFromXP,
  TaskItem,
} from '@/lib/types/tech-tree-types';
import { TECH_TREE_NODES } from '@/lib/data/tech-tree-nodes';

interface TechTreeStore extends TechTreeState {
  // Initialization
  initialize: () => void;

  // Node state queries
  getNodeState: (nodeId: string) => NodeState;
  getNodeProgress: (nodeId: string) => TechNodeProgress | undefined;
  isNodeUnlocked: (nodeId: string) => boolean;
  canStartNode: (nodeId: string) => boolean;
  getAvailableNodes: () => TechNode[];
  getCompletedNodes: () => TechNode[];

  // Node actions
  startResearch: (nodeId: string) => void;
  completeResearch: (nodeId: string) => void;
  startTaskPack: (nodeId: string) => void;
  completeTask: (nodeId: string, taskId: string) => void;
  submitProof: (nodeId: string, proofType: string, proofData: string) => void;
  completeNode: (nodeId: string) => void;

  // XP & Levels
  addXP: (amount: number) => void;
  getCurrentLevel: () => number;

  // Buffs
  getActiveBuffs: () => NodeBuff[];
  hasActiveBuff: (buffId: string) => boolean;

  // Reset (for testing)
  resetProgress: () => void;
}

const INITIAL_STATE: TechTreeState = {
  userId: 'default',
  currentXP: 0,
  currentLevel: 1,
  xpToNextLevel: 100,
  nodeProgress: {},
  activeBuffs: [],
  totalNodesCompleted: 0,
  totalXPEarned: 0,
  currentAct: 1,
  createdAt: new Date().toISOString(),
  lastUpdatedAt: new Date().toISOString(),
};

export const useTechTreeStore = create<TechTreeStore>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      initialize: () => {
        const state = get();
        console.log('[TechTree] Initialize called, nodeProgress keys:', Object.keys(state.nodeProgress).length);

        // Always ensure the first node is unlocked if no progress exists
        const firstNode = TECH_TREE_NODES.find((n: TechNode) => n.prerequisiteNodeIds.length === 0);

        if (!firstNode) {
          console.warn('[TechTree] No first node found!');
          return;
        }

        // If no progress at all, or first node is missing, initialize it
        if (Object.keys(state.nodeProgress).length === 0 || !state.nodeProgress[firstNode.id]) {
          console.log('[TechTree] Initializing first node:', firstNode.id);
          set({
            nodeProgress: {
              ...state.nodeProgress,
              [firstNode.id]: {
                nodeId: firstNode.id,
                state: 'available',
                tuInvestedInResearch: 0,
                completedTaskIds: [],
              },
            },
          });
        } else {
          console.log('[TechTree] Already initialized, first node state:', state.nodeProgress[firstNode.id]?.state);
        }
      },

      getNodeState: (nodeId: string): NodeState => {
        const progress = get().nodeProgress[nodeId];
        if (!progress) return 'locked';
        return progress.state;
      },

      getNodeProgress: (nodeId: string) => {
        return get().nodeProgress[nodeId];
      },

      isNodeUnlocked: (nodeId: string): boolean => {
        const state = get().getNodeState(nodeId);
        return state !== 'locked';
      },

      canStartNode: (nodeId: string): boolean => {
        const node = TECH_TREE_NODES.find((n: TechNode) => n.id === nodeId);
        if (!node) return false;

        // Check if all prerequisites are completed
        const allPrereqsCompleted = node.prerequisiteNodeIds.every((prereqId: string) => {
          const prereqState = get().getNodeState(prereqId);
          return prereqState === 'completed';
        });

        return allPrereqsCompleted;
      },

      getAvailableNodes: () => {
        const state = get();
        return TECH_TREE_NODES.filter((node: TechNode) => {
          const nodeState = state.getNodeState(node.id);
          return nodeState === 'available' || nodeState === 'in-progress';
        });
      },

      getCompletedNodes: () => {
        const state = get();
        return TECH_TREE_NODES.filter((node: TechNode) => {
          const nodeState = state.getNodeState(node.id);
          return nodeState === 'completed';
        });
      },

      startResearch: (nodeId: string) => {
        const state = get();
        const currentProgress = state.nodeProgress[nodeId];

        if (!currentProgress || currentProgress.state !== 'available') {
          console.warn('Cannot start research - node not available');
          return;
        }

        set({
          nodeProgress: {
            ...state.nodeProgress,
            [nodeId]: {
              ...currentProgress,
              state: 'in-progress',
              researchStartedAt: new Date().toISOString(),
            },
          },
          lastUpdatedAt: new Date().toISOString(),
        });
      },

      completeResearch: (nodeId: string) => {
        const state = get();
        const currentProgress = state.nodeProgress[nodeId];

        if (!currentProgress || currentProgress.state !== 'in-progress') {
          console.warn('Cannot complete research - invalid state');
          return;
        }

        set({
          nodeProgress: {
            ...state.nodeProgress,
            [nodeId]: {
              ...currentProgress,
              researchCompletedAt: new Date().toISOString(),
            },
          },
          lastUpdatedAt: new Date().toISOString(),
        });
      },

      startTaskPack: (nodeId: string) => {
        const state = get();
        const currentProgress = state.nodeProgress[nodeId];

        set({
          nodeProgress: {
            ...state.nodeProgress,
            [nodeId]: {
              ...currentProgress,
              taskPackStartedAt: new Date().toISOString(),
            },
          },
          lastUpdatedAt: new Date().toISOString(),
        });
      },

      completeTask: (nodeId: string, taskId: string) => {
        const state = get();
        const currentProgress = state.nodeProgress[nodeId];

        if (!currentProgress) return;

        const completedTaskIds = [...currentProgress.completedTaskIds];
        if (!completedTaskIds.includes(taskId)) {
          completedTaskIds.push(taskId);
        }

        set({
          nodeProgress: {
            ...state.nodeProgress,
            [nodeId]: {
              ...currentProgress,
              completedTaskIds,
            },
          },
          lastUpdatedAt: new Date().toISOString(),
        });
      },

      submitProof: (nodeId: string, proofType: string, proofData: string) => {
        const state = get();
        const currentProgress = state.nodeProgress[nodeId];

        if (!currentProgress) return;

        const proofSubmitted = currentProgress.proofSubmitted || [];
        proofSubmitted.push({
          type: proofType,
          data: proofData,
          submittedAt: new Date().toISOString(),
        });

        set({
          nodeProgress: {
            ...state.nodeProgress,
            [nodeId]: {
              ...currentProgress,
              proofSubmitted,
            },
          },
          lastUpdatedAt: new Date().toISOString(),
        });
      },

      completeNode: (nodeId: string) => {
        const state = get();
        const node = TECH_TREE_NODES.find((n: TechNode) => n.id === nodeId);
        const currentProgress = state.nodeProgress[nodeId];

        if (!node || !currentProgress) return;

        // Mark node as completed
        const updatedProgress = {
          ...state.nodeProgress,
          [nodeId]: {
            ...currentProgress,
            state: 'completed' as NodeState,
            completedAt: new Date().toISOString(),
          },
        };

        // Unlock dependent nodes
        const dependentNodes = TECH_TREE_NODES.filter((n: TechNode) =>
          n.prerequisiteNodeIds.includes(nodeId)
        );

        dependentNodes.forEach((depNode: TechNode) => {
          const canUnlock = depNode.prerequisiteNodeIds.every((prereqId: string) => {
            if (prereqId === nodeId) return true; // We just completed this
            return state.nodeProgress[prereqId]?.state === 'completed';
          });

          if (canUnlock && !updatedProgress[depNode.id]) {
            updatedProgress[depNode.id] = {
              nodeId: depNode.id,
              state: 'available',
              tuInvestedInResearch: 0,
              completedTaskIds: [],
            };
          }
        });

        // Add buffs if this is a side quest
        const newBuffs = node.buff ? [...state.activeBuffs, node.buff] : state.activeBuffs;

        // Calculate new XP and level
        const newTotalXP = state.totalXPEarned + node.xpReward;
        const xpCalc = calculateLevelFromXP(newTotalXP);

        set({
          nodeProgress: updatedProgress,
          activeBuffs: newBuffs,
          totalNodesCompleted: state.totalNodesCompleted + 1,
          totalXPEarned: newTotalXP,
          currentXP: xpCalc.currentXP,
          currentLevel: xpCalc.level,
          xpToNextLevel: xpCalc.xpToNextLevel,
          lastUpdatedAt: new Date().toISOString(),
        });
      },

      addXP: (amount: number) => {
        const state = get();
        const newTotalXP = state.totalXPEarned + amount;
        const xpCalc = calculateLevelFromXP(newTotalXP);

        set({
          totalXPEarned: newTotalXP,
          currentXP: xpCalc.currentXP,
          currentLevel: xpCalc.level,
          xpToNextLevel: xpCalc.xpToNextLevel,
          lastUpdatedAt: new Date().toISOString(),
        });
      },

      getCurrentLevel: () => {
        return get().currentLevel;
      },

      getActiveBuffs: () => {
        return get().activeBuffs;
      },

      hasActiveBuff: (buffId: string) => {
        return get().activeBuffs.some((buff) => buff.id === buffId);
      },

      resetProgress: () => {
        set({
          ...INITIAL_STATE,
          createdAt: new Date().toISOString(),
          lastUpdatedAt: new Date().toISOString(),
        });
        get().initialize();
      },
    }),
    {
      name: 'tech-tree-storage',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
