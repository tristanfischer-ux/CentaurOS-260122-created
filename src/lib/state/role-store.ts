/**
 * Role Store - Manages role-based view switching
 * Allows users to switch between Founder, Executive, and Apprentice views
 */
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Role } from '@/types';

// Define valid role views for the app
export type RoleView = 'Founder' | 'FractionalExec' | 'Apprentice';

interface RoleState {
  // Current active role view (determines what UI the user sees)
  activeRole: RoleView;

  // Whether the role has been explicitly set by the user
  isRoleSet: boolean;

  // Loading state
  isLoading: boolean;

  // Actions
  setActiveRole: (role: RoleView) => void;
  initialize: () => Promise<void>;
}

const ROLE_STORAGE_KEY = '@centaur_active_role';

export const useRoleStore = create<RoleState>((set) => ({
  activeRole: 'Founder',
  isRoleSet: false,
  isLoading: true,

  setActiveRole: async (role: RoleView) => {
    set({ activeRole: role, isRoleSet: true });
    try {
      await AsyncStorage.setItem(ROLE_STORAGE_KEY, role);
    } catch (error) {
      console.error('Failed to save role to storage:', error);
    }
  },

  initialize: async () => {
    try {
      const savedRole = await AsyncStorage.getItem(ROLE_STORAGE_KEY);
      if (savedRole && ['Founder', 'FractionalExec', 'Apprentice'].includes(savedRole)) {
        set({
          activeRole: savedRole as RoleView,
          isRoleSet: true,
          isLoading: false
        });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Failed to load role from storage:', error);
      set({ isLoading: false });
    }
  },
}));

// Selectors
export const useActiveRole = () => useRoleStore((s) => s.activeRole);
export const useIsRoleSet = () => useRoleStore((s) => s.isRoleSet);
