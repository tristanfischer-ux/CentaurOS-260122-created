import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  StartupPackSection,
  StartupPackArticle,
  StartupChecklistItem,
  StartupChecklistItemState,
  StartupTemplate,
  StartupPackPlan,
  StartupPackProgress,
  StartupCompanyProfile,
  StartupPackSelections,
  Role,
} from '@/types';
import { STARTUP_PACK_SECTIONS } from './sections';
import { STARTUP_PACK_ARTICLES } from './articles';
import { STARTUP_PACK_CHECKLISTS } from './checklists';
import { STARTUP_PACK_TEMPLATES, fillTemplateVariables } from './templates';

interface StartupPackState {
  // Static content (seeded)
  sections: StartupPackSection[];
  articles: StartupPackArticle[];
  checklistItems: StartupChecklistItem[];
  templates: StartupTemplate[];

  // Workspace-specific state
  planByWorkspace: Record<string, StartupPackPlan>;

  // Initialization
  isInitialized: boolean;
  initializeStartupPack: () => void;

  // Getters
  getSections: () => StartupPackSection[];
  getSectionById: (id: string) => StartupPackSection | undefined;
  getSectionArticles: (sectionId: string) => StartupPackArticle[];
  getArticleById: (id: string) => StartupPackArticle | undefined;
  getSectionChecklist: (sectionId: string) => StartupChecklistItem[];
  getChecklistItemById: (id: string) => StartupChecklistItem | undefined;
  getSectionTemplates: (sectionId: string) => StartupTemplate[];
  getTemplateById: (id: string) => StartupTemplate | undefined;

  // Workspace plan management
  getPlan: (workspaceId: string) => StartupPackPlan | undefined;
  createOrUpdatePlan: (
    workspaceId: string,
    companyProfile: StartupCompanyProfile,
    selections: StartupPackSelections
  ) => StartupPackPlan;
  deletePlan: (workspaceId: string) => void;

  // Checklist state management
  getChecklistItemState: (workspaceId: string, itemId: string) => StartupChecklistItemState | undefined;
  updateChecklistItemState: (
    workspaceId: string,
    itemId: string,
    updates: Partial<StartupChecklistItemState>
  ) => void;

  // Template variable management
  getFilledVariables: (workspaceId: string) => Record<string, string>;
  setFilledVariable: (workspaceId: string, key: string, value: string) => void;
  fillTemplate: (workspaceId: string, templateId: string) => string | undefined;

  // Progress calculation
  getProgress: (workspaceId: string) => StartupPackProgress;
  getSectionProgress: (workspaceId: string, sectionId: string) => { total: number; completed: number; percent: number };

  // Search
  searchAll: (query: string) => {
    sections: StartupPackSection[];
    articles: StartupPackArticle[];
    checklistItems: StartupChecklistItem[];
    templates: StartupTemplate[];
  };

  // RBAC check
  canEdit: (role: Role) => boolean;
  canCreatePlan: (role: Role) => boolean;
}

export const useStartupPackStore = create<StartupPackState>()(
  persist(
    (set, get) => ({
      // Initial state
      sections: [],
      articles: [],
      checklistItems: [],
      templates: [],
      planByWorkspace: {},
      isInitialized: false,

      // Initialize with seed data
      initializeStartupPack: () => {
        if (get().isInitialized) return;

        set({
          sections: STARTUP_PACK_SECTIONS,
          articles: STARTUP_PACK_ARTICLES,
          checklistItems: STARTUP_PACK_CHECKLISTS,
          templates: STARTUP_PACK_TEMPLATES,
          isInitialized: true,
        });
      },

      // Getters
      getSections: () => {
        const { sections } = get();
        return [...sections].sort((a, b) => a.order - b.order);
      },

      getSectionById: (id: string) => {
        return get().sections.find(s => s.id === id);
      },

      getSectionArticles: (sectionId: string) => {
        return get().articles.filter(a => a.sectionId === sectionId);
      },

      getArticleById: (id: string) => {
        return get().articles.find(a => a.id === id);
      },

      getSectionChecklist: (sectionId: string) => {
        return get().checklistItems
          .filter(c => c.sectionId === sectionId)
          .sort((a, b) => a.order - b.order);
      },

      getChecklistItemById: (id: string) => {
        return get().checklistItems.find(c => c.id === id);
      },

      getSectionTemplates: (sectionId: string) => {
        return get().templates.filter(t => t.sectionId === sectionId);
      },

      getTemplateById: (id: string) => {
        return get().templates.find(t => t.id === id);
      },

      // Plan management
      getPlan: (workspaceId: string) => {
        return get().planByWorkspace[workspaceId];
      },

      createOrUpdatePlan: (workspaceId, companyProfile, selections) => {
        const existingPlan = get().planByWorkspace[workspaceId];
        const now = new Date().toISOString();

        const newPlan: StartupPackPlan = {
          id: existingPlan?.id ?? `plan-${workspaceId}-${Date.now()}`,
          workspaceId,
          companyProfile,
          selections,
          checklistItemStates: existingPlan?.checklistItemStates ?? {},
          filledVariables: existingPlan?.filledVariables ?? {
            companyName: companyProfile.companyName,
            founders: companyProfile.founders.join(', '),
          },
          createdAt: existingPlan?.createdAt ?? now,
          updatedAt: now,
          createdOKRId: existingPlan?.createdOKRId,
        };

        set(state => ({
          planByWorkspace: {
            ...state.planByWorkspace,
            [workspaceId]: newPlan,
          },
        }));

        return newPlan;
      },

      deletePlan: (workspaceId: string) => {
        set(state => {
          const { [workspaceId]: _, ...rest } = state.planByWorkspace;
          return { planByWorkspace: rest };
        });
      },

      // Checklist state
      getChecklistItemState: (workspaceId: string, itemId: string) => {
        const plan = get().planByWorkspace[workspaceId];
        return plan?.checklistItemStates[itemId];
      },

      updateChecklistItemState: (workspaceId, itemId, updates) => {
        set(state => {
          const plan = state.planByWorkspace[workspaceId];
          if (!plan) {
            // Create a minimal plan if it doesn't exist
            const now = new Date().toISOString();
            const newPlan: StartupPackPlan = {
              id: `plan-${workspaceId}-${Date.now()}`,
              workspaceId,
              companyProfile: {
                companyName: '',
                jurisdiction: 'UK',
                founders: [],
                industry: '',
                fundraisingIntent: false,
              },
              selections: {
                wantsSEIS: false,
                wantsEIS: false,
                needsTrademark: false,
                raisingRoundType: 'pre-seed',
                hasCofounder: false,
                hasDomain: false,
                hasIncorporated: false,
                hasDataRoom: false,
              },
              checklistItemStates: {
                [itemId]: {
                  itemId,
                  status: 'not_started',
                  ...updates,
                },
              },
              filledVariables: {},
              createdAt: now,
              updatedAt: now,
            };
            return {
              planByWorkspace: {
                ...state.planByWorkspace,
                [workspaceId]: newPlan,
              },
            };
          }

          const existingState = plan.checklistItemStates[itemId] ?? {
            itemId,
            status: 'not_started',
          };

          const updatedState: StartupChecklistItemState = {
            ...existingState,
            ...updates,
            completedAt: updates.status === 'done' ? new Date().toISOString() : existingState.completedAt,
          };

          return {
            planByWorkspace: {
              ...state.planByWorkspace,
              [workspaceId]: {
                ...plan,
                checklistItemStates: {
                  ...plan.checklistItemStates,
                  [itemId]: updatedState,
                },
                updatedAt: new Date().toISOString(),
              },
            },
          };
        });
      },

      // Template variables
      getFilledVariables: (workspaceId: string) => {
        const plan = get().planByWorkspace[workspaceId];
        return plan?.filledVariables ?? {};
      },

      setFilledVariable: (workspaceId, key, value) => {
        set(state => {
          const plan = state.planByWorkspace[workspaceId];
          if (!plan) return state;

          return {
            planByWorkspace: {
              ...state.planByWorkspace,
              [workspaceId]: {
                ...plan,
                filledVariables: {
                  ...plan.filledVariables,
                  [key]: value,
                },
                updatedAt: new Date().toISOString(),
              },
            },
          };
        });
      },

      fillTemplate: (workspaceId, templateId) => {
        const template = get().getTemplateById(templateId);
        if (!template) return undefined;

        const variables = get().getFilledVariables(workspaceId);
        return fillTemplateVariables(template, variables);
      },

      // Progress calculation
      getProgress: (workspaceId: string) => {
        const { checklistItems, planByWorkspace } = get();
        const plan = planByWorkspace[workspaceId];

        const totalItems = checklistItems.length;
        let completedItems = 0;
        let inProgressItems = 0;
        let criticalRemaining = 0;

        checklistItems.forEach(item => {
          const state = plan?.checklistItemStates[item.id];
          if (state?.status === 'done') {
            completedItems++;
          } else if (state?.status === 'in_progress') {
            inProgressItems++;
          }

          if (item.priority === 'critical' && state?.status !== 'done') {
            criticalRemaining++;
          }
        });

        const percentComplete = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

        // Get next actions (incomplete critical items first, then high priority)
        const nextActions = checklistItems
          .filter(item => {
            const state = plan?.checklistItemStates[item.id];
            return state?.status !== 'done';
          })
          .sort((a, b) => {
            const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
          })
          .slice(0, 5);

        return {
          totalItems,
          completedItems,
          inProgressItems,
          percentComplete,
          criticalRemaining,
          nextActions,
        };
      },

      getSectionProgress: (workspaceId: string, sectionId: string) => {
        const sectionItems = get().getSectionChecklist(sectionId);
        const plan = get().planByWorkspace[workspaceId];

        const total = sectionItems.length;
        const completed = sectionItems.filter(item => {
          const state = plan?.checklistItemStates[item.id];
          return state?.status === 'done';
        }).length;

        return {
          total,
          completed,
          percent: total > 0 ? Math.round((completed / total) * 100) : 0,
        };
      },

      // Search
      searchAll: (query: string) => {
        const lowerQuery = query.toLowerCase();
        const { sections, articles, checklistItems, templates } = get();

        return {
          sections: sections.filter(s =>
            s.title.toLowerCase().includes(lowerQuery) ||
            s.description.toLowerCase().includes(lowerQuery) ||
            s.tags.some(t => t.toLowerCase().includes(lowerQuery))
          ),
          articles: articles.filter(a =>
            a.title.toLowerCase().includes(lowerQuery) ||
            a.summary.toLowerCase().includes(lowerQuery) ||
            a.tags.some(t => t.toLowerCase().includes(lowerQuery))
          ),
          checklistItems: checklistItems.filter(c =>
            c.title.toLowerCase().includes(lowerQuery) ||
            c.description.toLowerCase().includes(lowerQuery)
          ),
          templates: templates.filter(t =>
            t.title.toLowerCase().includes(lowerQuery) ||
            t.description.toLowerCase().includes(lowerQuery) ||
            t.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
          ),
        };
      },

      // RBAC
      canEdit: (role: Role) => {
        return role === 'Founder' || role === 'FractionalExec';
      },

      canCreatePlan: (role: Role) => {
        return role === 'Founder';
      },
    }),
    {
      name: 'startup-pack-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        planByWorkspace: state.planByWorkspace,
        isInitialized: state.isInitialized,
      }),
    }
  )
);

// Initialize on import
if (useStartupPackStore.getState().sections.length === 0) {
  useStartupPackStore.getState().initializeStartupPack();
}

// Export helper for OKR/Work Plan integration
export function generateSetupOKRData(workspaceId: string) {
  const store = useStartupPackStore.getState();
  const plan = store.getPlan(workspaceId);
  const progress = store.getProgress(workspaceId);

  return {
    okrTitle: 'Company Setup & Investor Readiness',
    okrDescription: `Complete foundational company setup tasks. ${progress.totalItems} items across 10 areas including incorporation, share structure, SEIS/EIS, and operational setup.`,
    keyResults: [
      {
        title: 'Complete critical setup items',
        targetValue: store.checklistItems.filter(c => c.priority === 'critical').length,
        currentValue: 0,
        unit: 'items',
      },
      {
        title: 'Achieve investor readiness',
        targetValue: 100,
        currentValue: progress.percentComplete,
        unit: '%',
      },
    ],
    workPlans: store.getSections().map(section => ({
      title: section.title,
      description: section.description,
      function: 'Admin' as const,
      tasks: store.getSectionChecklist(section.id).map(item => ({
        title: item.title,
        description: item.description,
        priority: item.priority === 'critical' ? 'urgent' : item.priority === 'high' ? 'high' : item.priority === 'medium' ? 'medium' : 'low',
        estimatedHours: item.estimatedHours ?? 2,
        ownerRoleHint: item.ownerRoleHint,
      })),
    })),
  };
}
