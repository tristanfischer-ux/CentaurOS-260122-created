import { create } from 'zustand';
import type {
  User,
  Workspace,
  Membership,
  Objective,
  KeyResult,
  Project,
  Task,
  Review,
  WeeklyPack,
  Template,
  TaskComment,
  MetricEvent,
  AuditLog,
  TimeEntry,
  Role,
} from '@/types';
import { authStorage, appStorage } from '../storage';

interface AppState {
  // Auth
  currentUser: User | null;
  isAuthenticated: boolean;
  authToken: string | null;

  // Current context
  currentWorkspaceId: string | null;
  currentWorkspace: Workspace | null;
  currentMembership: Membership | null;

  // Data (in-memory cache)
  workspaces: Record<string, Workspace>;
  memberships: Record<string, Membership>;
  users: Record<string, User>;
  objectives: Record<string, Objective>;
  keyResults: Record<string, KeyResult>;
  metricEvents: Record<string, MetricEvent>;
  projects: Record<string, Project>;
  tasks: Record<string, Task>;
  taskComments: Record<string, TaskComment>;
  timeEntries: Record<string, TimeEntry>;
  reviews: Record<string, Review>;
  weeklyPacks: Record<string, WeeklyPack>;
  templates: Record<string, Template>;
  auditLogs: Record<string, AuditLog>;

  // UI state
  isLoading: boolean;
  error: string | null;

  // Actions
  setCurrentUser: (user: User | null) => void;
  setAuthToken: (token: string | null) => void;
  setCurrentWorkspace: (workspaceId: string | null) => void;
  setWorkspaces: (workspaces: Record<string, Workspace>) => void;
  setMemberships: (memberships: Record<string, Membership>) => void;
  setUsers: (users: Record<string, User>) => void;
  setObjectives: (objectives: Record<string, Objective>) => void;
  setKeyResults: (keyResults: Record<string, KeyResult>) => void;
  setMetricEvents: (events: Record<string, MetricEvent>) => void;
  setProjects: (projects: Record<string, Project>) => void;
  setTasks: (tasks: Record<string, Task>) => void;
  setTaskComments: (comments: Record<string, TaskComment>) => void;
  setTimeEntries: (entries: Record<string, TimeEntry>) => void;
  setReviews: (reviews: Record<string, Review>) => void;
  setWeeklyPacks: (packs: Record<string, WeeklyPack>) => void;
  setTemplates: (templates: Record<string, Template>) => void;
  setAuditLogs: (logs: Record<string, AuditLog>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => void;
  initialize: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  currentUser: null,
  isAuthenticated: false,
  authToken: null,
  currentWorkspaceId: null,
  currentWorkspace: null,
  currentMembership: null,
  workspaces: {},
  memberships: {},
  users: {},
  objectives: {},
  keyResults: {},
  metricEvents: {},
  projects: {},
  tasks: {},
  taskComments: {},
  timeEntries: {},
  reviews: {},
  weeklyPacks: {},
  templates: {},
  auditLogs: {},
  isLoading: false,
  error: null,

  // Actions
  setCurrentUser: (user) => {
    set({ currentUser: user, isAuthenticated: !!user });
    if (user) {
      authStorage.setCurrentUser(user);
    } else {
      authStorage.removeCurrentUser();
    }
  },

  setAuthToken: (token) => {
    set({ authToken: token });
    if (token) {
      authStorage.setToken(token);
    } else {
      authStorage.removeToken();
    }
  },

  setCurrentWorkspace: (workspaceId) => {
    const state = get();
    const workspace = workspaceId ? state.workspaces[workspaceId] : null;
    const membership = workspaceId
      ? Object.values(state.memberships).find(
          (m) => m.workspaceId === workspaceId && m.userId === state.currentUser?.id
        )
      : null;

    set({
      currentWorkspaceId: workspaceId,
      currentWorkspace: workspace ?? null,
      currentMembership: membership ?? null,
    });

    if (workspaceId) {
      appStorage.setCurrentWorkspaceId(workspaceId);
    } else {
      appStorage.removeCurrentWorkspaceId();
    }
  },

  setWorkspaces: (workspaces) => set({ workspaces }),
  setMemberships: (memberships) => set({ memberships }),
  setUsers: (users) => set({ users }),
  setObjectives: (objectives) => set({ objectives }),
  setKeyResults: (keyResults) => set({ keyResults }),
  setMetricEvents: (events) => set({ metricEvents: events }),
  setProjects: (projects) => set({ projects }),
  setTasks: (tasks) => set({ tasks }),
  setTaskComments: (comments) => set({ taskComments: comments }),
  setTimeEntries: (entries) => set({ timeEntries: entries }),
  setReviews: (reviews) => set({ reviews }),
  setWeeklyPacks: (packs) => set({ weeklyPacks: packs }),
  setTemplates: (templates) => set({ templates }),
  setAuditLogs: (logs) => set({ auditLogs: logs }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  logout: async () => {
    authStorage.removeToken();
    await authStorage.removeCurrentUser();
    await appStorage.removeCurrentWorkspaceId();
    set({
      currentUser: null,
      isAuthenticated: false,
      authToken: null,
      currentWorkspaceId: null,
      currentWorkspace: null,
      currentMembership: null,
    });
  },

  initialize: async () => {
    try {
      const user = await authStorage.getCurrentUser();
      const token = authStorage.getToken();
      const workspaceId = await appStorage.getCurrentWorkspaceId();

      set({
        currentUser: (user as User) ?? null,
        isAuthenticated: !!user && !!token,
        authToken: token ?? null,
        currentWorkspaceId: workspaceId,
      });
    } catch (error) {
      console.error('Failed to initialize app state:', error);
    }
  },
}));

// Selectors for efficient access
export const useCurrentUser = () => useAppStore((s) => s.currentUser);
export const useIsAuthenticated = () => useAppStore((s) => s.isAuthenticated);
export const useCurrentWorkspace = () => useAppStore((s) => s.currentWorkspace);
export const useCurrentMembership = () => useAppStore((s) => s.currentMembership);
export const useCurrentRole = (): Role | null => useAppStore((s) => s.currentMembership?.role ?? null);
