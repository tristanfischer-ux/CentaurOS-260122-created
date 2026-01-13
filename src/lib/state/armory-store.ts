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
  addAITool: (memberId: string, aiToolId: string) => Promise<void>;
  removeAITool: (memberId: string, aiToolId: string) => Promise<void>;
  setEquippedTool: (memberId: string, slot: EquipmentSlot, aiToolId: string | null) => Promise<void>;
  autoEquipStarterKit: (memberId: string, member: OrganizationMember, allTools: AIAgent[]) => Promise<void>;
  clearLoadout: (memberId: string) => Promise<void>;
  removePersonLoadout: (memberId: string) => Promise<void>;

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
          aiToolIds: [],
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

        // Migrate old slot-based loadouts to new aiToolIds array format
        const migratedLoadouts = (data.personLoadouts || []).map((loadout: any) => {
          // If already has aiToolIds, use it; otherwise migrate from slots
          if (loadout.aiToolIds) {
            return loadout;
          }
          // Migrate from old slots structure
          const aiToolIds: string[] = [];
          if (loadout.slots) {
            Object.values(loadout.slots).forEach((toolId) => {
              if (toolId && typeof toolId === 'string') {
                aiToolIds.push(toolId);
              }
            });
          }
          return {
            workspaceId: loadout.workspaceId,
            memberId: loadout.memberId,
            aiToolIds,
            updatedAt: loadout.updatedAt || new Date().toISOString(),
          };
        });

        set({
          personLoadouts: migratedLoadouts,
          squads: data.squads || [],
          isInitialized: true,
        });

        // Save migrated data back to storage
        if (migratedLoadouts.some((l: any) => !data.personLoadouts?.find((o: any) => o.aiToolIds && o.memberId === l.memberId))) {
          await get().saveToStorage();
        }
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

  addAITool: async (memberId: string, aiToolId: string) => {
    set((state) => {
      const loadouts = [...state.personLoadouts];
      const loadoutIndex = loadouts.findIndex((l) => l.memberId === memberId);

      if (loadoutIndex >= 0) {
        // Ensure aiToolIds exists (migration from old slot structure)
        const currentToolIds = loadouts[loadoutIndex].aiToolIds || [];
        // Add tool if not already present
        if (!currentToolIds.includes(aiToolId)) {
          loadouts[loadoutIndex] = {
            ...loadouts[loadoutIndex],
            aiToolIds: [...currentToolIds, aiToolId],
            updatedAt: new Date().toISOString(),
          };
        }
      }

      return { personLoadouts: loadouts };
    });

    await get().saveToStorage();
  },

  removeAITool: async (memberId: string, aiToolId: string) => {
    set((state) => {
      const loadouts = [...state.personLoadouts];
      const loadoutIndex = loadouts.findIndex((l) => l.memberId === memberId);

      if (loadoutIndex >= 0) {
        const currentToolIds = loadouts[loadoutIndex].aiToolIds || [];
        loadouts[loadoutIndex] = {
          ...loadouts[loadoutIndex],
          aiToolIds: currentToolIds.filter((id) => id !== aiToolId),
          updatedAt: new Date().toISOString(),
        };
      }

      return { personLoadouts: loadouts };
    });

    await get().saveToStorage();
  },

  // Legacy method for backward compatibility - now just adds to array
  setEquippedTool: async (memberId: string, slot: EquipmentSlot, aiToolId: string | null) => {
    if (aiToolId) {
      await get().addAITool(memberId, aiToolId);
    }
  },

  autoEquipStarterKit: async (memberId: string, member: OrganizationMember, allTools: AIAgent[]) => {
    const starterKit = getStarterKit(member, allTools);
    const toolIds = Object.values(starterKit)
      .filter((tool): tool is AIAgent => tool !== null)
      .map((tool) => tool.id);

    set((state) => {
      const loadouts = [...state.personLoadouts];
      const loadoutIndex = loadouts.findIndex((l) => l.memberId === memberId);

      if (loadoutIndex >= 0) {
        loadouts[loadoutIndex] = {
          ...loadouts[loadoutIndex],
          aiToolIds: toolIds,
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
          aiToolIds: [],
          updatedAt: new Date().toISOString(),
        };
      }

      return { personLoadouts: loadouts };
    });

    await get().saveToStorage();
  },

  removePersonLoadout: async (memberId: string) => {
    set((state) => ({
      personLoadouts: state.personLoadouts.filter((l) => l.memberId !== memberId),
    }));

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
export const useSquadsByWorkspace = (workspaceId: string) =>
  useArmoryStore((s) => s.squads.filter((squad) => squad.workspaceId === workspaceId));
