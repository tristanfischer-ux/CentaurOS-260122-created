/**
 * Integrations Store
 * Manage connected integrations and their configurations
 *
 * DATA SEPARATION:
 * - INTEGRATIONS (in integrations.ts) = MARKETPLACE DATA (global catalog, no workspaceId)
 * - connectedIntegrations = COMPANY DATA (keyed by workspaceId)
 */

import { create } from 'zustand';
import type { Integration, ConnectedIntegration } from '@/lib/integrations';

// Extended interface to include workspaceId for connected integrations
export interface WorkspaceConnectedIntegration extends ConnectedIntegration {
  workspaceId: string; // 🔑 Multi-tenancy key - links integration to specific company
}

interface IntegrationsStore {
  connectedIntegrations: WorkspaceConnectedIntegration[];
  isConnecting: boolean;
  error: string | null;

  // Actions (require workspaceId for company-specific operations)
  connectIntegration: (workspaceId: string, integration: Integration, config: Record<string, string>) => Promise<void>;
  disconnectIntegration: (workspaceId: string, integrationId: string) => Promise<void>;
  updateIntegrationConfig: (workspaceId: string, integrationId: string, config: Record<string, string>) => Promise<void>;
  syncIntegration: (workspaceId: string, integrationId: string) => Promise<void>;
  getConnectedIntegration: (workspaceId: string, integrationId: string) => WorkspaceConnectedIntegration | undefined;
  isIntegrationConnected: (workspaceId: string, integrationId: string) => boolean;

  // Multi-tenancy methods
  getIntegrationsByWorkspace: (workspaceId: string) => WorkspaceConnectedIntegration[];
  getAllIntegrations: () => WorkspaceConnectedIntegration[]; // For government users
}

export const useIntegrationsStore = create<IntegrationsStore>((set, get) => ({
  connectedIntegrations: [],
  isConnecting: false,
  error: null,

  connectIntegration: async (workspaceId: string, integration: Integration, config: Record<string, string>) => {
    set({ isConnecting: true, error: null });

    try {
      // Simulate API call to connect integration
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const connectedIntegration: WorkspaceConnectedIntegration = {
        ...integration,
        workspaceId,
        status: 'connected',
        connectedAt: new Date(),
        config,
        syncStatus: 'active',
      };

      set((state) => ({
        connectedIntegrations: [...state.connectedIntegrations, connectedIntegration],
        isConnecting: false,
      }));
    } catch (error) {
      set({
        isConnecting: false,
        error: error instanceof Error ? error.message : 'Failed to connect integration',
      });
      throw error;
    }
  },

  disconnectIntegration: async (workspaceId: string, integrationId: string) => {
    set({ isConnecting: true, error: null });

    try {
      // Simulate API call to disconnect
      await new Promise((resolve) => setTimeout(resolve, 1000));

      set((state) => ({
        connectedIntegrations: state.connectedIntegrations.filter(
          (i) => !(i.id === integrationId && i.workspaceId === workspaceId)
        ),
        isConnecting: false,
      }));
    } catch (error) {
      set({
        isConnecting: false,
        error: error instanceof Error ? error.message : 'Failed to disconnect integration',
      });
      throw error;
    }
  },

  updateIntegrationConfig: async (workspaceId: string, integrationId: string, config: Record<string, string>) => {
    set({ isConnecting: true, error: null });

    try {
      // Simulate API call to update config
      await new Promise((resolve) => setTimeout(resolve, 1000));

      set((state) => ({
        connectedIntegrations: state.connectedIntegrations.map((i) =>
          i.id === integrationId && i.workspaceId === workspaceId ? { ...i, config } : i
        ),
        isConnecting: false,
      }));
    } catch (error) {
      set({
        isConnecting: false,
        error: error instanceof Error ? error.message : 'Failed to update configuration',
      });
      throw error;
    }
  },

  syncIntegration: async (workspaceId: string, integrationId: string) => {
    const integration = get().connectedIntegrations.find(
      (i) => i.id === integrationId && i.workspaceId === workspaceId
    );
    if (!integration) throw new Error('Integration not found');

    try {
      // Update sync status
      set((state) => ({
        connectedIntegrations: state.connectedIntegrations.map((i) =>
          i.id === integrationId && i.workspaceId === workspaceId
            ? { ...i, syncStatus: 'active' as const, lastSyncAt: new Date() }
            : i
        ),
      }));

      // Simulate sync API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      set((state) => ({
        connectedIntegrations: state.connectedIntegrations.map((i) =>
          i.id === integrationId && i.workspaceId === workspaceId
            ? { ...i, lastSyncAt: new Date() }
            : i
        ),
      }));
    } catch (error) {
      set((state) => ({
        connectedIntegrations: state.connectedIntegrations.map((i) =>
          i.id === integrationId && i.workspaceId === workspaceId
            ? { ...i, syncStatus: 'error' as const }
            : i
        ),
        error: error instanceof Error ? error.message : 'Sync failed',
      }));
      throw error;
    }
  },

  getConnectedIntegration: (workspaceId: string, integrationId: string) => {
    return get().connectedIntegrations.find(
      (i) => i.id === integrationId && i.workspaceId === workspaceId
    );
  },

  isIntegrationConnected: (workspaceId: string, integrationId: string) => {
    return get().connectedIntegrations.some(
      (i) => i.id === integrationId && i.workspaceId === workspaceId
    );
  },

  // Get integrations for a specific workspace
  getIntegrationsByWorkspace: (workspaceId: string) => {
    return get().connectedIntegrations.filter((i) => i.workspaceId === workspaceId);
  },

  // Get all integrations (for government users)
  getAllIntegrations: () => {
    return get().connectedIntegrations;
  },
}));

// Selector hooks for efficient access
export const useIntegrationsByWorkspace = (workspaceId: string) =>
  useIntegrationsStore((s) => s.connectedIntegrations.filter((i) => i.workspaceId === workspaceId));
