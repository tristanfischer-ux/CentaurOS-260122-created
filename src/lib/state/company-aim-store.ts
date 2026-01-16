/**
 * Company Aim Store
 *
 * Manages the high-level macro aim/purpose of the company.
 * The aim is the ultimate goal that gives meaning to all activities.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from '@/lib/storage/mmkv-storage';

export interface CompanyAim {
  id: string;
  workspaceId: string;
  aim: string; // The high-level macro aim
  why: string; // Why this aim matters
  notAbout: string; // What the company is NOT about (e.g., "not just about valuation")
  createdAt: string;
  updatedAt: string;
}

interface CompanyAimState {
  aims: CompanyAim[];

  // Getters
  getAimByWorkspace: (workspaceId: string) => CompanyAim | undefined;

  // Actions
  setAim: (workspaceId: string, aim: string, why: string, notAbout: string) => void;
  updateAim: (workspaceId: string, aim: string, why: string, notAbout: string) => void;
  clearAim: (workspaceId: string) => void;
}

export const useCompanyAimStore = create<CompanyAimState>()(
  persist(
    (set, get) => ({
      aims: [],

      getAimByWorkspace: (workspaceId: string) => {
        return get().aims.find((a) => a.workspaceId === workspaceId);
      },

      setAim: (workspaceId: string, aim: string, why: string, notAbout: string) => {
        const existingAim = get().getAimByWorkspace(workspaceId);

        if (existingAim) {
          // Update existing aim
          set((state) => ({
            aims: state.aims.map((a) =>
              a.workspaceId === workspaceId
                ? { ...a, aim, why, notAbout, updatedAt: new Date().toISOString() }
                : a
            ),
          }));
        } else {
          // Create new aim
          const newAim: CompanyAim = {
            id: `aim-${Date.now()}`,
            workspaceId,
            aim,
            why,
            notAbout,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          set((state) => ({
            aims: [...state.aims, newAim],
          }));
        }
      },

      updateAim: (workspaceId: string, aim: string, why: string, notAbout: string) => {
        set((state) => ({
          aims: state.aims.map((a) =>
            a.workspaceId === workspaceId
              ? { ...a, aim, why, notAbout, updatedAt: new Date().toISOString() }
              : a
          ),
        }));
      },

      clearAim: (workspaceId: string) => {
        set((state) => ({
          aims: state.aims.filter((a) => a.workspaceId !== workspaceId),
        }));
      },
    }),
    {
      name: 'company-aim-storage',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
