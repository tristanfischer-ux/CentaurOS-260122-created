import AsyncStorage from '@react-native-async-storage/async-storage';
// Import the singleton MMKV instance from mmkv-storage to avoid multiple instances
import { mmkv } from './storage/mmkv-storage';

// AsyncStorage for complex data (all domain entities)
// Since we don't have a backend for MVP, we simulate a database with AsyncStorage

const STORAGE_KEYS = {
  AUTH_USER: 'auth:user',
  AUTH_TOKEN: 'auth:token',
  USERS: 'db:users',
  WORKSPACES: 'db:workspaces',
  MEMBERSHIPS: 'db:memberships',
  OBJECTIVES: 'db:objectives',
  KEY_RESULTS: 'db:keyResults',
  METRIC_EVENTS: 'db:metricEvents',
  PROJECTS: 'db:projects',
  TASKS: 'db:tasks',
  TASK_COMMENTS: 'db:taskComments',
  TIME_ENTRIES: 'db:timeEntries',
  REVIEWS: 'db:reviews',
  WEEKLY_PACKS: 'db:weeklyPacks',
  TEMPLATES: 'db:templates',
  WORKFLOW_ITEMS: 'db:workflowItems',
  SUPPLIERS: 'db:suppliers', // Platform-wide supplier network
  SUPPLIER_RECOMMENDATIONS: 'db:supplierRecommendations',
  COMPANY_PROFILES: 'db:companyProfiles', // Platform-wide company directory
  COMPANY_CONNECTIONS: 'db:companyConnections',
  COMMUNITY_EVENTS: 'db:communityEvents',
  EVENT_RSVPS: 'db:eventRSVPs',
  AUDIT_LOGS: 'db:auditLogs',
  CURRENT_WORKSPACE: 'app:currentWorkspace',
} as const;

// Generic storage helpers
export const storage = {
  // Get item
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Error getting ${key}:`, error);
      return null;
    }
  },

  // Set item
  async set<T>(key: string, value: T): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting ${key}:`, error);
      throw error;
    }
  },

  // Remove item
  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing ${key}:`, error);
      throw error;
    }
  },

  // Clear all
  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
      mmkv.clearAll();
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  },

  // Clear all app data (for fresh start)
  async clearAllAppData(): Promise<void> {
    try {
      console.log('[Storage] Clearing all app data...');

      // Clear AsyncStorage
      await AsyncStorage.clear();

      // Clear MMKV
      mmkv.clearAll();

      console.log('[Storage] ✅ All app data cleared successfully');
    } catch (error) {
      console.error('[Storage] ❌ Error clearing app data:', error);
      throw error;
    }
  },
};

// Domain-specific storage functions
export const db = {
  // Users
  async getUsers() {
    return (await storage.get<Record<string, any>>(STORAGE_KEYS.USERS)) || {};
  },
  async setUsers(users: Record<string, any>) {
    await storage.set(STORAGE_KEYS.USERS, users);
  },

  // Workspaces
  async getWorkspaces() {
    return (await storage.get<Record<string, any>>(STORAGE_KEYS.WORKSPACES)) || {};
  },
  async setWorkspaces(workspaces: Record<string, any>) {
    await storage.set(STORAGE_KEYS.WORKSPACES, workspaces);
  },

  // Memberships
  async getMemberships() {
    return (await storage.get<Record<string, any>>(STORAGE_KEYS.MEMBERSHIPS)) || {};
  },
  async setMemberships(memberships: Record<string, any>) {
    await storage.set(STORAGE_KEYS.MEMBERSHIPS, memberships);
  },

  // Objectives
  async getObjectives() {
    return (await storage.get<Record<string, any>>(STORAGE_KEYS.OBJECTIVES)) || {};
  },
  async setObjectives(objectives: Record<string, any>) {
    await storage.set(STORAGE_KEYS.OBJECTIVES, objectives);
  },

  // Key Results
  async getKeyResults() {
    return (await storage.get<Record<string, any>>(STORAGE_KEYS.KEY_RESULTS)) || {};
  },
  async setKeyResults(keyResults: Record<string, any>) {
    await storage.set(STORAGE_KEYS.KEY_RESULTS, keyResults);
  },

  // Metric Events
  async getMetricEvents() {
    return (await storage.get<Record<string, any>>(STORAGE_KEYS.METRIC_EVENTS)) || {};
  },
  async setMetricEvents(events: Record<string, any>) {
    await storage.set(STORAGE_KEYS.METRIC_EVENTS, events);
  },

  // Projects
  async getProjects() {
    return (await storage.get<Record<string, any>>(STORAGE_KEYS.PROJECTS)) || {};
  },
  async setProjects(projects: Record<string, any>) {
    await storage.set(STORAGE_KEYS.PROJECTS, projects);
  },

  // Tasks
  async getTasks() {
    return (await storage.get<Record<string, any>>(STORAGE_KEYS.TASKS)) || {};
  },
  async setTasks(tasks: Record<string, any>) {
    await storage.set(STORAGE_KEYS.TASKS, tasks);
  },

  // Task Comments
  async getTaskComments() {
    return (await storage.get<Record<string, any>>(STORAGE_KEYS.TASK_COMMENTS)) || {};
  },
  async setTaskComments(comments: Record<string, any>) {
    await storage.set(STORAGE_KEYS.TASK_COMMENTS, comments);
  },

  // Time Entries
  async getTimeEntries() {
    return (await storage.get<Record<string, any>>(STORAGE_KEYS.TIME_ENTRIES)) || {};
  },
  async setTimeEntries(entries: Record<string, any>) {
    await storage.set(STORAGE_KEYS.TIME_ENTRIES, entries);
  },

  // Reviews
  async getReviews() {
    return (await storage.get<Record<string, any>>(STORAGE_KEYS.REVIEWS)) || {};
  },
  async setReviews(reviews: Record<string, any>) {
    await storage.set(STORAGE_KEYS.REVIEWS, reviews);
  },

  // Weekly Packs
  async getWeeklyPacks() {
    return (await storage.get<Record<string, any>>(STORAGE_KEYS.WEEKLY_PACKS)) || {};
  },
  async setWeeklyPacks(packs: Record<string, any>) {
    await storage.set(STORAGE_KEYS.WEEKLY_PACKS, packs);
  },

  // Templates
  async getTemplates() {
    return (await storage.get<Record<string, any>>(STORAGE_KEYS.TEMPLATES)) || {};
  },
  async setTemplates(templates: Record<string, any>) {
    await storage.set(STORAGE_KEYS.TEMPLATES, templates);
  },

  // Workflow Items
  async getWorkflowItems() {
    return (await storage.get<Record<string, any>>(STORAGE_KEYS.WORKFLOW_ITEMS)) || {};
  },
  async setWorkflowItems(items: Record<string, any>) {
    await storage.set(STORAGE_KEYS.WORKFLOW_ITEMS, items);
  },

  // Suppliers (platform-wide)
  async getSuppliers() {
    return (await storage.get<Record<string, any>>(STORAGE_KEYS.SUPPLIERS)) || {};
  },
  async setSuppliers(suppliers: Record<string, any>) {
    await storage.set(STORAGE_KEYS.SUPPLIERS, suppliers);
  },

  // Supplier Recommendations
  async getSupplierRecommendations() {
    return (await storage.get<Record<string, any>>(STORAGE_KEYS.SUPPLIER_RECOMMENDATIONS)) || {};
  },
  async setSupplierRecommendations(recommendations: Record<string, any>) {
    await storage.set(STORAGE_KEYS.SUPPLIER_RECOMMENDATIONS, recommendations);
  },

  // Company Profiles (platform-wide)
  async getCompanyProfiles() {
    return (await storage.get<Record<string, any>>(STORAGE_KEYS.COMPANY_PROFILES)) || {};
  },
  async setCompanyProfiles(profiles: Record<string, any>) {
    await storage.set(STORAGE_KEYS.COMPANY_PROFILES, profiles);
  },

  // Company Connections
  async getCompanyConnections() {
    return (await storage.get<Record<string, any>>(STORAGE_KEYS.COMPANY_CONNECTIONS)) || {};
  },
  async setCompanyConnections(connections: Record<string, any>) {
    await storage.set(STORAGE_KEYS.COMPANY_CONNECTIONS, connections);
  },

  // Community Events (platform-wide)
  async getCommunityEvents() {
    return (await storage.get<Record<string, any>>(STORAGE_KEYS.COMMUNITY_EVENTS)) || {};
  },
  async setCommunityEvents(events: Record<string, any>) {
    await storage.set(STORAGE_KEYS.COMMUNITY_EVENTS, events);
  },

  // Event RSVPs
  async getEventRSVPs() {
    return (await storage.get<Record<string, any>>(STORAGE_KEYS.EVENT_RSVPS)) || {};
  },
  async setEventRSVPs(rsvps: Record<string, any>) {
    await storage.set(STORAGE_KEYS.EVENT_RSVPS, rsvps);
  },

  // Audit Logs
  async getAuditLogs() {
    return (await storage.get<Record<string, any>>(STORAGE_KEYS.AUDIT_LOGS)) || {};
  },
  async setAuditLogs(logs: Record<string, any>) {
    await storage.set(STORAGE_KEYS.AUDIT_LOGS, logs);
  },
};

// Auth storage (using MMKV for speed)
export const authStorage = {
  getToken(): string | undefined {
    return mmkv.getString(STORAGE_KEYS.AUTH_TOKEN);
  },
  setToken(token: string): void {
    mmkv.set(STORAGE_KEYS.AUTH_TOKEN, token);
  },
  removeToken(): void {
    mmkv.delete(STORAGE_KEYS.AUTH_TOKEN);
  },
  async getCurrentUser() {
    return await storage.get(STORAGE_KEYS.AUTH_USER);
  },
  async setCurrentUser(user: any) {
    await storage.set(STORAGE_KEYS.AUTH_USER, user);
  },
  async removeCurrentUser() {
    await storage.remove(STORAGE_KEYS.AUTH_USER);
  },
};

// App state storage
export const appStorage = {
  async getCurrentWorkspaceId(): Promise<string | null> {
    return await storage.get<string>(STORAGE_KEYS.CURRENT_WORKSPACE);
  },
  async setCurrentWorkspaceId(workspaceId: string): Promise<void> {
    await storage.set(STORAGE_KEYS.CURRENT_WORKSPACE, workspaceId);
  },
  async removeCurrentWorkspaceId(): Promise<void> {
    await storage.remove(STORAGE_KEYS.CURRENT_WORKSPACE);
  },
};
