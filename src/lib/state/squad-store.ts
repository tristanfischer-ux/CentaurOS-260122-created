/**
 * Squad Store - Manages both manual and automatic squads
 *
 * Automatic Squads: Form implicitly when 2+ people work on the same task
 * Manual Squads: Created explicitly by founders with names and functions
 */

import { create } from 'zustand';
import { mmkv } from '@/lib/storage/mmkv-storage';

export type SquadType = 'automatic' | 'manual';

export interface Squad {
  id: string;
  name: string;
  type: SquadType;
  memberIds: string[];
  function?: string; // Optional for manual squads
  taskIds?: string[]; // Tasks this squad is assigned to (for manual squads)
  objectiveIds?: string[]; // Objectives this squad is assigned to (for manual squads)
  createdAt: string;
  color?: string; // Visual identifier
}

interface SquadState {
  squads: Squad[];

  // Actions
  initializeSquads: () => Promise<void>;
  persistSquads: () => Promise<void>;

  // Manual squad management
  createSquad: (name: string, memberIds: string[], func?: string) => Squad;
  updateSquad: (id: string, updates: Partial<Squad>) => void;
  deleteSquad: (id: string) => void;
  addMemberToSquad: (squadId: string, memberId: string) => void;
  removeMemberFromSquad: (squadId: string, memberId: string) => void;
  assignSquadToTask: (squadId: string, taskId: string) => void;
  unassignSquadFromTask: (squadId: string, taskId: string) => void;

  // Queries
  getSquadById: (id: string) => Squad | undefined;
  getSquadsByMember: (memberId: string) => Squad[];
  getSquadsByTask: (taskId: string) => Squad[];
  getManualSquads: () => Squad[];
  getAutomaticSquads: () => Squad[];

  // Automatic squad detection
  detectAutomaticSquads: (taskAllocations: Array<{ taskId: string; taskTitle: string; memberIds: string[] }>) => void;
}

const SQUAD_STORAGE_KEY = '@centaur_squads';

// Generate a pastel color for squad visual identity
const generateSquadColor = (): string => {
  const colors = [
    '#93c5fd', // blue-300
    '#86efac', // green-300
    '#fbbf24', // amber-300
    '#f9a8d4', // pink-300
    '#c4b5fd', // purple-300
    '#67e8f9', // cyan-300
    '#fdba74', // orange-300
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

export const useSquadStore = create<SquadState>((set, get) => ({
  squads: [],

  initializeSquads: async () => {
    try {
      const stored = mmkv.getString(SQUAD_STORAGE_KEY);
      if (stored) {
        const squads = JSON.parse(stored);
        set({ squads });
      }
    } catch (error) {
      console.error('[SquadStore] Failed to load squads:', error);
    }
  },

  persistSquads: async () => {
    try {
      const { squads } = get();
      mmkv.set(SQUAD_STORAGE_KEY, JSON.stringify(squads));
    } catch (error) {
      console.error('[SquadStore] Failed to persist squads:', error);
    }
  },

  createSquad: (name: string, memberIds: string[], func?: string) => {
    const newSquad: Squad = {
      id: `squad_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      type: 'manual',
      memberIds,
      function: func,
      taskIds: [],
      objectiveIds: [],
      createdAt: new Date().toISOString(),
      color: generateSquadColor(),
    };

    set((state) => ({
      squads: [...state.squads, newSquad],
    }));

    get().persistSquads();
    return newSquad;
  },

  updateSquad: (id: string, updates: Partial<Squad>) => {
    set((state) => ({
      squads: state.squads.map((squad) =>
        squad.id === id ? { ...squad, ...updates } : squad
      ),
    }));
    get().persistSquads();
  },

  deleteSquad: (id: string) => {
    set((state) => ({
      squads: state.squads.filter((squad) => squad.id !== id),
    }));
    get().persistSquads();
  },

  addMemberToSquad: (squadId: string, memberId: string) => {
    set((state) => ({
      squads: state.squads.map((squad) =>
        squad.id === squadId && !squad.memberIds.includes(memberId)
          ? { ...squad, memberIds: [...squad.memberIds, memberId] }
          : squad
      ),
    }));
    get().persistSquads();
  },

  removeMemberFromSquad: (squadId: string, memberId: string) => {
    set((state) => ({
      squads: state.squads.map((squad) =>
        squad.id === squadId
          ? { ...squad, memberIds: squad.memberIds.filter((id) => id !== memberId) }
          : squad
      ),
    }));
    get().persistSquads();
  },

  assignSquadToTask: (squadId: string, taskId: string) => {
    set((state) => ({
      squads: state.squads.map((squad) =>
        squad.id === squadId && !squad.taskIds?.includes(taskId)
          ? { ...squad, taskIds: [...(squad.taskIds || []), taskId] }
          : squad
      ),
    }));
    get().persistSquads();
  },

  unassignSquadFromTask: (squadId: string, taskId: string) => {
    set((state) => ({
      squads: state.squads.map((squad) =>
        squad.id === squadId
          ? { ...squad, taskIds: squad.taskIds?.filter((id) => id !== taskId) }
          : squad
      ),
    }));
    get().persistSquads();
  },

  getSquadById: (id: string) => {
    return get().squads.find((squad) => squad.id === id);
  },

  getSquadsByMember: (memberId: string) => {
    return get().squads.filter((squad) => squad.memberIds.includes(memberId));
  },

  getSquadsByTask: (taskId: string) => {
    return get().squads.filter((squad) => squad.taskIds?.includes(taskId));
  },

  getManualSquads: () => {
    return get().squads.filter((squad) => squad.type === 'manual');
  },

  getAutomaticSquads: () => {
    return get().squads.filter((squad) => squad.type === 'automatic');
  },

  detectAutomaticSquads: (taskAllocations: Array<{ taskId: string; taskTitle: string; memberIds: string[] }>) => {
    const currentAutoSquads = get().squads.filter((s) => s.type === 'automatic');
    const manualSquads = get().squads.filter((s) => s.type === 'manual');

    // Build new automatic squads from current allocations
    const newAutoSquads: Squad[] = [];

    for (const allocation of taskAllocations) {
      // Only create squad if 2+ people on the task
      if (allocation.memberIds.length >= 2) {
        // Sort member IDs for consistent comparison
        const sortedMemberIds = [...allocation.memberIds].sort();
        const squadKey = sortedMemberIds.join(',');

        // Check if this exact squad already exists
        const existingSquad = currentAutoSquads.find((squad) => {
          const squadKey2 = [...squad.memberIds].sort().join(',');
          return squadKey === squadKey2 && squad.taskIds?.includes(allocation.taskId);
        });

        if (existingSquad) {
          // Keep the existing squad
          newAutoSquads.push(existingSquad);
        } else {
          // Create new automatic squad
          newAutoSquads.push({
            id: `auto_${allocation.taskId}_${Date.now()}`,
            name: `${allocation.taskTitle} Team`,
            type: 'automatic',
            memberIds: sortedMemberIds,
            taskIds: [allocation.taskId],
            createdAt: new Date().toISOString(),
            color: generateSquadColor(),
          });
        }
      }
    }

    // Merge: keep manual squads + new automatic squads
    set({
      squads: [...manualSquads, ...newAutoSquads],
    });
  },
}));
