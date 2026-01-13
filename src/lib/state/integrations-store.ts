/**
 * Integrations Store
 * Manage connected integrations and their configurations
 */

import { create } from 'zustand';
import type { Integration, ConnectedIntegration } from '@/lib/integrations';

interface IntegrationsStore {
  connectedIntegrations: ConnectedIntegration[];
  isConnecting: boolean;
  error: string | null;

  // Actions
  connectIntegration: (integration: Integration, config: Record<string, string>) => Promise<void>;
  disconnectIntegration: (integrationId: string) => Promise<void>;
  updateIntegrationConfig: (integrationId: string, config: Record<string, string>) => Promise<void>;
  syncIntegration: (integrationId: string) => Promise<void>;
  getConnectedIntegration: (integrationId: string) => ConnectedIntegration | undefined;
  isIntegrationConnected: (integrationId: string) => boolean;
}

export const useIntegrationsStore = create<IntegrationsStore>((set, get) => ({
  connectedIntegrations: [],
  isConnecting: false,
  error: null,

  connectIntegration: async (integration: Integration, config: Record<string, string>) => {
    set({ isConnecting: true, error: null });

    try {
      // Simulate API call to connect integration
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const connectedIntegration: ConnectedIntegration = {
        ...integration,
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

  disconnectIntegration: async (integrationId: string) => {
    set({ isConnecting: true, error: null });

    try {
      // Simulate API call to disconnect
      await new Promise((resolve) => setTimeout(resolve, 1000));

      set((state) => ({
        connectedIntegrations: state.connectedIntegrations.filter((i) => i.id !== integrationId),
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

  updateIntegrationConfig: async (integrationId: string, config: Record<string, string>) => {
    set({ isConnecting: true, error: null });

    try {
      // Simulate API call to update config
      await new Promise((resolve) => setTimeout(resolve, 1000));

      set((state) => ({
        connectedIntegrations: state.connectedIntegrations.map((i) =>
          i.id === integrationId ? { ...i, config } : i
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

  syncIntegration: async (integrationId: string) => {
    const integration = get().connectedIntegrations.find((i) => i.id === integrationId);
    if (!integration) throw new Error('Integration not found');

    try {
      // Update sync status
      set((state) => ({
        connectedIntegrations: state.connectedIntegrations.map((i) =>
          i.id === integrationId ? { ...i, syncStatus: 'active' as const, lastSyncAt: new Date() } : i
        ),
      }));

      // Simulate sync API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      set((state) => ({
        connectedIntegrations: state.connectedIntegrations.map((i) =>
          i.id === integrationId ? { ...i, lastSyncAt: new Date() } : i
        ),
      }));
    } catch (error) {
      set((state) => ({
        connectedIntegrations: state.connectedIntegrations.map((i) =>
          i.id === integrationId ? { ...i, syncStatus: 'error' as const } : i
        ),
        error: error instanceof Error ? error.message : 'Sync failed',
      }));
      throw error;
    }
  },

  getConnectedIntegration: (integrationId: string) => {
    return get().connectedIntegrations.find((i) => i.id === integrationId);
  },

  isIntegrationConnected: (integrationId: string) => {
    return get().connectedIntegrations.some((i) => i.id === integrationId);
  },
}));
