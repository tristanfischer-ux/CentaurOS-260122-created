/**
 * Privacy Store
 * Manages privacy preferences and restricted access grants
 */

import { create } from 'zustand';
import type {
  RestrictedCategory,
  RestrictedAccessGrant,
  PrivacyPreferences,
  TaskVisibility,
  PrivacyAuditLog,
} from '@/types/privacy';
import { storage } from '@/lib/storage';

interface PrivacyStore {
  // Restricted access grants (HR, Legal, Executive, etc.)
  restrictedAccessGrants: RestrictedAccessGrant[];

  // User privacy preferences
  preferences: PrivacyPreferences;

  // Audit logs (optional, for compliance)
  auditLogs: PrivacyAuditLog[];

  // === ACTIONS ===

  // Grant restricted access to a user
  grantRestrictedAccess: (
    workspaceId: string,
    userId: string,
    category: RestrictedCategory,
    grantedBy: string,
    expiresAt?: string
  ) => void;

  // Revoke restricted access from a user
  revokeRestrictedAccess: (workspaceId: string, userId: string, category: RestrictedCategory) => void;

  // Check if a user has restricted access to a category
  hasRestrictedAccess: (workspaceId: string, userId: string, category: RestrictedCategory) => boolean;

  // Get all users with restricted access to a category
  getUsersWithRestrictedAccess: (workspaceId: string, category: RestrictedCategory) => string[];

  // Set default visibility preference
  setDefaultVisibility: (visibility: TaskVisibility) => void;

  // Set founder override preference
  setFounderOverride: (allow: boolean) => void;

  // Set privacy badges visibility
  setShowPrivacyBadges: (show: boolean) => void;

  // Add audit log entry
  addAuditLog: (log: Omit<PrivacyAuditLog, 'id' | 'timestamp'>) => void;

  // Get audit logs for a resource
  getAuditLogsForResource: (resourceId: string) => PrivacyAuditLog[];

  // Hydrate from storage
  hydrate: (workspaceId: string) => Promise<void>;

  // Persist to storage
  persist: (workspaceId: string) => Promise<void>;

  // Reset store
  reset: () => void;
}

const DEFAULT_PREFERENCES: PrivacyPreferences = {
  defaultVisibility: 'company',
  allowFounderOverride: true,
  showPrivacyBadges: true,
};

export const usePrivacyStore = create<PrivacyStore>((set, get) => ({
  restrictedAccessGrants: [],
  preferences: DEFAULT_PREFERENCES,
  auditLogs: [],

  grantRestrictedAccess: (workspaceId, userId, category, grantedBy, expiresAt) => {
    const grant: RestrictedAccessGrant = {
      id: `grant_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      workspaceId,
      userId,
      category,
      grantedBy,
      grantedAt: new Date().toISOString(),
      expiresAt,
    };

    set((state) => ({
      restrictedAccessGrants: [...state.restrictedAccessGrants, grant],
    }));

    // Log the action
    get().addAuditLog({
      workspaceId,
      userId: grantedBy,
      action: 'access_grant',
      resourceType: 'member',
      resourceId: userId,
      details: { category, expiresAt },
    });

    console.log(`[PrivacyStore] Granted ${category} access to user ${userId}`);
  },

  revokeRestrictedAccess: (workspaceId, userId, category) => {
    set((state) => ({
      restrictedAccessGrants: state.restrictedAccessGrants.filter(
        (grant) =>
          !(grant.workspaceId === workspaceId && grant.userId === userId && grant.category === category)
      ),
    }));

    // Log the action
    get().addAuditLog({
      workspaceId,
      userId,
      action: 'access_revoke',
      resourceType: 'member',
      resourceId: userId,
      details: { category },
    });

    console.log(`[PrivacyStore] Revoked ${category} access from user ${userId}`);
  },

  hasRestrictedAccess: (workspaceId, userId, category) => {
    const now = new Date();
    return get().restrictedAccessGrants.some(
      (grant) =>
        grant.workspaceId === workspaceId &&
        grant.userId === userId &&
        grant.category === category &&
        (!grant.expiresAt || new Date(grant.expiresAt) > now)
    );
  },

  getUsersWithRestrictedAccess: (workspaceId, category) => {
    const now = new Date();
    return get()
      .restrictedAccessGrants.filter(
        (grant) =>
          grant.workspaceId === workspaceId &&
          grant.category === category &&
          (!grant.expiresAt || new Date(grant.expiresAt) > now)
      )
      .map((grant) => grant.userId);
  },

  setDefaultVisibility: (visibility) => {
    set((state) => ({
      preferences: {
        ...state.preferences,
        defaultVisibility: visibility,
      },
    }));
    console.log(`[PrivacyStore] Default visibility set to ${visibility}`);
  },

  setFounderOverride: (allow) => {
    set((state) => ({
      preferences: {
        ...state.preferences,
        allowFounderOverride: allow,
      },
    }));
    console.log(`[PrivacyStore] Founder override set to ${allow}`);
  },

  setShowPrivacyBadges: (show) => {
    set((state) => ({
      preferences: {
        ...state.preferences,
        showPrivacyBadges: show,
      },
    }));
    console.log(`[PrivacyStore] Show privacy badges set to ${show}`);
  },

  addAuditLog: (log) => {
    const fullLog: PrivacyAuditLog = {
      ...log,
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date().toISOString(),
    };

    set((state) => ({
      auditLogs: [...state.auditLogs, fullLog],
    }));

    if (__DEV__) {
      console.log('[PrivacyStore] Audit log:', fullLog);
    }
  },

  getAuditLogsForResource: (resourceId) => {
    return get()
      .auditLogs.filter((log) => log.resourceId === resourceId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  hydrate: async (workspaceId) => {
    try {
      const [grants, preferences, logs] = await Promise.all([
        storage.get<RestrictedAccessGrant[]>(`privacy_grants_${workspaceId}`),
        storage.get<PrivacyPreferences>(`privacy_preferences_${workspaceId}`),
        storage.get<PrivacyAuditLog[]>(`privacy_logs_${workspaceId}`),
      ]);

      set({
        restrictedAccessGrants: grants || [],
        preferences: preferences || DEFAULT_PREFERENCES,
        auditLogs: logs || [],
      });

      console.log(`[PrivacyStore] Hydrated for workspace ${workspaceId}`);
    } catch (error) {
      console.error('[PrivacyStore] Hydration failed:', error);
    }
  },

  persist: async (workspaceId) => {
    try {
      const state = get();
      await Promise.all([
        storage.set(`privacy_grants_${workspaceId}`, state.restrictedAccessGrants),
        storage.set(`privacy_preferences_${workspaceId}`, state.preferences),
        storage.set(`privacy_logs_${workspaceId}`, state.auditLogs),
      ]);

      console.log(`[PrivacyStore] Persisted for workspace ${workspaceId}`);
    } catch (error) {
      console.error('[PrivacyStore] Persistence failed:', error);
    }
  },

  reset: () => {
    set({
      restrictedAccessGrants: [],
      preferences: DEFAULT_PREFERENCES,
      auditLogs: [],
    });
    console.log('[PrivacyStore] Reset complete');
  },
}));
