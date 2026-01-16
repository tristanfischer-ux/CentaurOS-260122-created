import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface DashboardWidget {
  id: string;
  type: 'decisions' | 'approvals' | 'capacity' | 'runway' | 'tasks' | 'team' | 'performance' | 'okrs';
  visible: boolean;
  order: number;
}

interface DashboardLayoutStore {
  widgets: DashboardWidget[];
  initializeDefaultLayout: (role: 'Founder' | 'FractionalExec' | 'Apprentice') => void;
  updateWidgetVisibility: (id: string, visible: boolean) => void;
  reorderWidgets: (widgets: DashboardWidget[]) => void;
  resetToDefault: (role: 'Founder' | 'FractionalExec' | 'Apprentice') => void;
}

const getDefaultLayout = (role: 'Founder' | 'FractionalExec' | 'Apprentice'): DashboardWidget[] => {
  if (role === 'Founder') {
    return [
      { id: 'decisions', type: 'decisions', visible: true, order: 0 },
      { id: 'approvals', type: 'approvals', visible: true, order: 1 },
      { id: 'runway', type: 'runway', visible: true, order: 2 },
      { id: 'capacity', type: 'capacity', visible: true, order: 3 },
      { id: 'okrs', type: 'okrs', visible: true, order: 4 },
      { id: 'team', type: 'team', visible: true, order: 5 },
      { id: 'performance', type: 'performance', visible: true, order: 6 },
    ];
  } else if (role === 'FractionalExec') {
    return [
      { id: 'okrs', type: 'okrs', visible: true, order: 0 },
      { id: 'tasks', type: 'tasks', visible: true, order: 1 },
      { id: 'team', type: 'team', visible: true, order: 2 },
      { id: 'capacity', type: 'capacity', visible: true, order: 3 },
      { id: 'performance', type: 'performance', visible: true, order: 4 },
      { id: 'decisions', type: 'decisions', visible: false, order: 5 },
      { id: 'approvals', type: 'approvals', visible: false, order: 6 },
    ];
  } else {
    // Apprentice
    return [
      { id: 'tasks', type: 'tasks', visible: true, order: 0 },
      { id: 'performance', type: 'performance', visible: true, order: 1 },
      { id: 'capacity', type: 'capacity', visible: true, order: 2 },
      { id: 'okrs', type: 'okrs', visible: false, order: 3 },
      { id: 'team', type: 'team', visible: false, order: 4 },
      { id: 'decisions', type: 'decisions', visible: false, order: 5 },
      { id: 'approvals', type: 'approvals', visible: false, order: 6 },
    ];
  }
};

export const useDashboardLayoutStore = create<DashboardLayoutStore>()(
  persist(
    (set, get) => ({
      widgets: getDefaultLayout('Founder'),

      initializeDefaultLayout: (role: 'Founder' | 'FractionalExec' | 'Apprentice') => {
        if (get().widgets.length === 0) {
          set({ widgets: getDefaultLayout(role) });
        }
      },

      updateWidgetVisibility: (id: string, visible: boolean) => {
        set((state: DashboardLayoutStore) => ({
          widgets: state.widgets.map((w: DashboardWidget) =>
            w.id === id ? { ...w, visible } : w
          ),
        }));
      },

      reorderWidgets: (widgets: DashboardWidget[]) => {
        set({ widgets });
      },

      resetToDefault: (role: 'Founder' | 'FractionalExec' | 'Apprentice') => {
        set({ widgets: getDefaultLayout(role) });
      },
    }),
    {
      name: 'dashboard-layout-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
