/**
 * Armory Store
 * RPG-style equipment and squad management
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PersonLoadout, Squad, EquipmentSlot, Function as BusinessFunction } from '@/types';
import type { OrganizationMember, AIAgent } from '@/lib/organization-seed';
import { getStarterKit } from '../armory/recommendations';

const ARMORY_STORAGE_KEY = '@centaur-os:armory-v1';

interface ArmoryState {
  personLoadouts: PersonLoadout[];
  squads: Squad[];
  isInitialized: boolean;

  // Initialization
  initializeArmory: (workspaceId: string, members: OrganizationMember[], allTools: AIAgent[]) => Promise<void>;
  loadFromStorage: () => Promise<void>;
  saveToStorage: () => Promise<void>;

  // Loadout management
  getLoadoutForMember: (memberId: string) => PersonLoadout | undefined;
  setEquippedTool: (memberId: string, slot: EquipmentSlot, aiToolId: string | null) => Promise<void>;
  autoEquipStarterKit: (memberId: string, member: OrganizationMember, allTools: AIAgent[]) => Promise<void>;
  clearLoadout: (memberId: string) => Promise<void>;

  // Squad management
  createSquad: (payload: Omit<Squad, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Squad>;
  updateSquad: (id: string, updates: Partial<Omit<Squad, 'id' | 'workspaceId' | 'createdAt'>>) => Promise<void>;
  deleteSquad: (id: string) => Promise<void>;
  getSquadById: (id: string) => Squad | undefined;
  getSquadsByWorkspace: (workspaceId: string) => Squad[];
  getSquadsByLeader: (leaderMemberId: string) => Squad[];
  assignLeader: (squadId: string, leaderMemberId: string) => Promise<void>;
  assignApprentice: (squadId: string, apprenticeMemberId: string) => Promise<void>;
  removeApprentice: (squadId: string, apprenticeMemberId: string) => Promise<void>;
  deploySquadToOKR: (squadId: string, okrId: string) => Promise<void>;
  deploySquadToWorkPlan: (squadId: string, workPlanId: string) => Promise<void>;
  clearDeployment: (squadId: string) => Promise<void>;

  // Utility
  reset: () => Promise<void>;
}

export const useArmoryStore = create<ArmoryState>((set, get) => ({
  personLoadouts: [],
  squads: [],
  isInitialized: false,

  // ========== INITIALIZATION ==========

  initializeArmory: async (workspaceId: string, members: OrganizationMember[], allTools: AIAgent[]) => {
    // Load existing data first
    await get().loadFromStorage();

    const state = get();
    const existingLoadouts = state.personLoadouts;
    const newLoadouts: PersonLoadout[] = [];

    // Create loadouts for members who don't have one
    for (const member of members) {
      if (member.workspaceId !== workspaceId) continue;
      if (member.status !== 'active') continue;

      const existingLoadout = existingLoadouts.find((l) => l.memberId === member.id);
      if (!existingLoadout) {
        // Create empty loadout
        newLoadouts.push({
          workspaceId,
          memberId: member.id,
          slots: {
            weapon: null,
            armor: null,
            utility: null,
            support: null,
          },
          updatedAt: new Date().toISOString(),
        });
      }
    }

    if (newLoadouts.length > 0) {
      set((state) => ({
        personLoadouts: [...state.personLoadouts, ...newLoadouts],
        isInitialized: true,
      }));
      await get().saveToStorage();
    } else {
      set({ isInitialized: true });
    }
  },

  loadFromStorage: async () => {
    try {
      const json = await AsyncStorage.getItem(ARMORY_STORAGE_KEY);
      if (json) {
        const data = JSON.parse(json);
        set({
          personLoadouts: data.personLoadouts || [],
          squads: data.squads || [],
          isInitialized: true,
        });
      }
    } catch (error) {
      console.error('Failed to load armory from storage:', error);
    }
  },

  saveToStorage: async () => {
    try {
      const { personLoadouts, squads } = get();
      const data = { personLoadouts, squads };
      await AsyncStorage.setItem(ARMORY_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save armory to storage:', error);
    }
  },

  // ========== LOADOUT MANAGEMENT ==========

  getLoadoutForMember: (memberId: string) => {
    return get().personLoadouts.find((l) => l.memberId === memberId);
  },

  setEquippedTool: async (memberId: string, slot: EquipmentSlot, aiToolId: string | null) => {
    set((state) => {
      const loadouts = [...state.personLoadouts];
      const loadoutIndex = loadouts.findIndex((l) => l.memberId === memberId);

      if (loadoutIndex >= 0) {
        loadouts[loadoutIndex] = {
          ...loadouts[loadoutIndex],
          slots: {
            ...loadouts[loadoutIndex].slots,
            [slot]: aiToolId,
          },
          updatedAt: new Date().toISOString(),
        };
      }

      return { personLoadouts: loadouts };
    });

    await get().saveToStorage();
  },

  autoEquipStarterKit: async (memberId: string, member: OrganizationMember, allTools: AIAgent[]) => {
    const starterKit = getStarterKit(member, allTools);

    set((state) => {
      const loadouts = [...state.personLoadouts];
      const loadoutIndex = loadouts.findIndex((l) => l.memberId === memberId);

      if (loadoutIndex >= 0) {
        loadouts[loadoutIndex] = {
          ...loadouts[loadoutIndex],
          slots: {
            weapon: starterKit.weapon?.id || null,
            armor: starterKit.armor?.id || null,
            utility: starterKit.utility?.id || null,
            support: starterKit.support?.id || null,
          },
          updatedAt: new Date().toISOString(),
        };
      }

      return { personLoadouts: loadouts };
    });

    await get().saveToStorage();
  },

  clearLoadout: async (memberId: string) => {
    set((state) => {
      const loadouts = [...state.personLoadouts];
      const loadoutIndex = loadouts.findIndex((l) => l.memberId === memberId);

      if (loadoutIndex >= 0) {
        loadouts[loadoutIndex] = {
          ...loadouts[loadoutIndex],
          slots: {
            weapon: null,
            armor: null,
            utility: null,
            support: null,
          },
          updatedAt: new Date().toISOString(),
        };
      }

      return { personLoadouts: loadouts };
    });

    await get().saveToStorage();
  },

  // ========== SQUAD MANAGEMENT ==========

  createSquad: async (payload) => {
    const newSquad: Squad = {
      id: `squad_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...payload,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    set((state) => ({
      squads: [...state.squads, newSquad],
    }));

    await get().saveToStorage();
    return newSquad;
  },

  updateSquad: async (id, updates) => {
    set((state) => {
      const squads = [...state.squads];
      const squadIndex = squads.findIndex((s) => s.id === id);

      if (squadIndex >= 0) {
        squads[squadIndex] = {
          ...squads[squadIndex],
          ...updates,
          updatedAt: new Date().toISOString(),
        };
      }

      return { squads };
    });

    await get().saveToStorage();
  },

  deleteSquad: async (id) => {
    set((state) => ({
      squads: state.squads.filter((s) => s.id !== id),
    }));

    await get().saveToStorage();
  },

  getSquadById: (id) => {
    return get().squads.find((s) => s.id === id);
  },

  getSquadsByWorkspace: (workspaceId) => {
    return get().squads.filter((s) => s.workspaceId === workspaceId);
  },

  getSquadsByLeader: (leaderMemberId) => {
    return get().squads.filter((s) => s.leaderMemberId === leaderMemberId);
  },

  assignLeader: async (squadId, leaderMemberId) => {
    await get().updateSquad(squadId, { leaderMemberId });
  },

  assignApprentice: async (squadId, apprenticeMemberId) => {
    const squad = get().getSquadById(squadId);
    if (!squad) return;

    if (!squad.apprenticeMemberIds.includes(apprenticeMemberId)) {
      await get().updateSquad(squadId, {
        apprenticeMemberIds: [...squad.apprenticeMemberIds, apprenticeMemberId],
      });
    }
  },

  removeApprentice: async (squadId, apprenticeMemberId) => {
    const squad = get().getSquadById(squadId);
    if (!squad) return;

    await get().updateSquad(squadId, {
      apprenticeMemberIds: squad.apprenticeMemberIds.filter((id) => id !== apprenticeMemberId),
    });
  },

  deploySquadToOKR: async (squadId, okrId) => {
    await get().updateSquad(squadId, {
      deployedOKRId: okrId,
      deployedWorkPlanId: undefined,
    });
  },

  deploySquadToWorkPlan: async (squadId, workPlanId) => {
    await get().updateSquad(squadId, {
      deployedWorkPlanId: workPlanId,
      deployedOKRId: undefined,
    });
  },

  clearDeployment: async (squadId) => {
    await get().updateSquad(squadId, {
      deployedOKRId: undefined,
      deployedWorkPlanId: undefined,
    });
  },

  // ========== UTILITY ==========

  reset: async () => {
    set({
      personLoadouts: [],
      squads: [],
      isInitialized: false,
    });
    await AsyncStorage.removeItem(ARMORY_STORAGE_KEY);
  },
}));

// Selector hooks
export const usePersonLoadouts = () => useArmoryStore((s) => s.personLoadouts);
export const useSquads = () => useArmoryStore((s) => s.squads);
export const useLoadoutForMember = (memberId: string) => useArmoryStore((s) => s.getLoadoutForMember(memberId));
export const useSquadsByWorkspace = (workspaceId: string) => useArmoryStore((s) => s.getSquadsByWorkspace(workspaceId));
