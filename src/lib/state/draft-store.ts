/**
 * Draft Store - Unified Draft Management
 *
 * Drafts are SEPARATE from real tasks. They represent unconfirmed work items
 * that must be explicitly confirmed before becoming tasks.
 *
 * Sources:
 * - ai_extraction: Drafts from voice/text AI extraction
 * - marketplace: Outreach drafts from Marketplace discovery
 * - import: Drafts from external imports
 * - manual: Manually created drafts
 *
 * IMPORTANT:
 * - Drafts NEVER appear in When (timeline) or scheduling
 * - Drafts are NOT counted in performance metrics
 * - Only confirmDrafts() converts drafts to real tasks
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type DraftSource = 'ai_extraction' | 'marketplace' | 'import' | 'manual';

export interface Draft {
  id: string;
  workspaceId: string;
  title: string;
  description: string;
  createdBy: string;
  createdAt: string;

  // Optional fields
  assigneeId?: string;
  assigneeName?: string;
  dueDate?: string;
  units: number; // Time units estimate (default: 1)
  function?: 'Ops' | 'Marketing' | 'Sales' | 'Finance' | 'Engineering' | 'Admin';
  linkedObjectiveId?: string; // 🔑 Link to strategic objective
  attachments?: {
    id: string;
    name: string;
    url: string;
    type: string;
  }[];

  // Source tracking
  source: DraftSource;
  sourceMetadata?: {
    // For marketplace drafts
    marketplaceCategory?: string;
    outreachType?: 'contact' | 'quote' | 'invite';
    targetName?: string;
    targetType?: 'person' | 'supplier' | 'tool' | 'advisor';

    // For AI extraction
    confidence?: number;
    originalText?: string;
    extractionType?: 'voice' | 'text';
  };

  // Status is always pending for drafts
  status: 'pending_confirmation';
}

interface DraftState {
  drafts: Draft[];
  isLoading: boolean;
  error: string | null;

  // Actions
  addDraft: (draft: Omit<Draft, 'id' | 'createdAt' | 'status'>) => string;
  addDrafts: (drafts: Omit<Draft, 'id' | 'createdAt' | 'status'>[]) => string[];
  updateDraft: (id: string, updates: Partial<Omit<Draft, 'id' | 'createdAt' | 'status'>>) => void;
  removeDraft: (id: string) => void;
  removeDrafts: (ids: string[]) => void;
  getDraftById: (id: string) => Draft | undefined;
  getDraftsByWorkspace: (workspaceId: string) => Draft[];
  getDraftsBySource: (source: DraftSource) => Draft[];
  getDraftCount: (workspaceId?: string) => number;

  // Confirmation - this is the ONLY way to convert drafts to tasks
  // Returns the IDs of drafts that were confirmed (for UI feedback)
  confirmDrafts: (ids: string[]) => Promise<Draft[]>;

  // Clear all drafts (useful for testing or workspace switch)
  clearDrafts: (workspaceId?: string) => void;

  // Reset store
  reset: () => void;
}

// Generate UUID
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const useDraftStore = create<DraftState>()(
  persist(
    (set, get) => ({
      drafts: [],
      isLoading: false,
      error: null,

      addDraft: (draftData) => {
        const id = generateUUID();
        const draft: Draft = {
          ...draftData,
          id,
          createdAt: new Date().toISOString(),
          status: 'pending_confirmation',
          units: draftData.units || 1,
        };

        set(state => ({
          drafts: [...state.drafts, draft],
        }));

        console.log('[DraftStore] Added draft:', { id, title: draft.title, source: draft.source });
        return id;
      },

      addDrafts: (draftsData) => {
        const newDrafts: Draft[] = draftsData.map(draftData => ({
          ...draftData,
          id: generateUUID(),
          createdAt: new Date().toISOString(),
          status: 'pending_confirmation' as const,
          units: draftData.units || 1,
        }));

        set(state => ({
          drafts: [...state.drafts, ...newDrafts],
        }));

        console.log('[DraftStore] Added drafts:', newDrafts.map(d => ({ id: d.id, title: d.title })));
        return newDrafts.map(d => d.id);
      },

      updateDraft: (id, updates) => {
        set(state => ({
          drafts: state.drafts.map(draft =>
            draft.id === id ? { ...draft, ...updates } : draft
          ),
        }));
        console.log('[DraftStore] Updated draft:', id);
      },

      removeDraft: (id) => {
        set(state => ({
          drafts: state.drafts.filter(draft => draft.id !== id),
        }));
        console.log('[DraftStore] Removed draft:', id);
      },

      removeDrafts: (ids) => {
        set(state => ({
          drafts: state.drafts.filter(draft => !ids.includes(draft.id)),
        }));
        console.log('[DraftStore] Removed drafts:', ids);
      },

      getDraftById: (id) => {
        return get().drafts.find(draft => draft.id === id);
      },

      getDraftsByWorkspace: (workspaceId) => {
        return get().drafts.filter(draft => draft.workspaceId === workspaceId);
      },

      getDraftsBySource: (source) => {
        return get().drafts.filter(draft => draft.source === source);
      },

      getDraftCount: (workspaceId) => {
        const drafts = get().drafts;
        if (workspaceId) {
          return drafts.filter(d => d.workspaceId === workspaceId).length;
        }
        return drafts.length;
      },

      confirmDrafts: async (ids) => {
        const draftsToConfirm = get().drafts.filter(d => ids.includes(d.id));

        if (draftsToConfirm.length === 0) {
          console.warn('[DraftStore] No drafts found to confirm');
          return [];
        }

        // Remove from drafts (actual task creation happens in the caller)
        set(state => ({
          drafts: state.drafts.filter(draft => !ids.includes(draft.id)),
        }));

        console.log('[DraftStore] Confirmed drafts:', draftsToConfirm.map(d => ({ id: d.id, title: d.title })));
        return draftsToConfirm;
      },

      clearDrafts: (workspaceId) => {
        if (workspaceId) {
          set(state => ({
            drafts: state.drafts.filter(d => d.workspaceId !== workspaceId),
          }));
        } else {
          set({ drafts: [] });
        }
        console.log('[DraftStore] Cleared drafts', workspaceId ? `for workspace ${workspaceId}` : '(all)');
      },

      reset: () => {
        set({
          drafts: [],
          isLoading: false,
          error: null,
        });
        console.log('[DraftStore] Reset');
      },
    }),
    {
      name: 'draft-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ drafts: state.drafts }),
    }
  )
);

// Selector hooks for optimal performance
export const useDrafts = () => useDraftStore(s => s.drafts);
export const useDraftCount = (workspaceId?: string) => useDraftStore(s => s.getDraftCount(workspaceId));
export const useDraftsBySource = (source: DraftSource) => useDraftStore(s => s.getDraftsBySource(source));
