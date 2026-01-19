/**
 * UI State Store
 * Ephemeral UI state that doesn't need persistence
 * Used for cross-component communication like navigation signals
 */

import { create } from 'zustand';

interface UIState {
  // Signal to open the new task drawer on Tasks tab
  openNewTaskDrawer: boolean;

  // Actions
  triggerNewTaskDrawer: () => void;
  clearNewTaskDrawer: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  openNewTaskDrawer: false,

  triggerNewTaskDrawer: () => set({ openNewTaskDrawer: true }),
  clearNewTaskDrawer: () => set({ openNewTaskDrawer: false }),
}));

// Selectors
export const useOpenNewTaskDrawer = () => useUIStore((s) => s.openNewTaskDrawer);
export const useTriggerNewTaskDrawer = () => useUIStore((s) => s.triggerNewTaskDrawer);
export const useClearNewTaskDrawer = () => useUIStore((s) => s.clearNewTaskDrawer);
