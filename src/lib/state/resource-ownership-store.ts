/**
 * Resource Ownership Store
 *
 * Tracks ownership and approval history for suppliers and AI tools in Make tab
 * Supports role-based visibility (founder sees all, others see only their items)
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Role } from '@/types';

export type ResourceType = 'ai_tool' | 'supplier';

export interface ApprovalRecord {
  approvedBy: string; // User ID
  approvedByName: string;
  approvedByRole: Role;
  approvedAt: string;
  notes?: string;
}

export interface ResourceOwnership {
  id: string;
  workspaceId: string;
  resourceId: string; // ID of the AI tool or supplier
  resourceName: string;
  resourceType: ResourceType;

  // Owner information
  ownerId: string; // User ID
  ownerName: string;
  ownerRole: 'Founder' | 'FractionalExec' | 'Apprentice';

  // Approval history
  approvalHistory: ApprovalRecord[];

  // Current status
  isActive: boolean;

  // Metadata
  assignedAt: string;
  updatedAt: string;
}

interface ResourceOwnershipState {
  ownerships: ResourceOwnership[];

  // Actions
  assignOwner: (ownership: Omit<ResourceOwnership, 'id' | 'assignedAt' | 'updatedAt' | 'approvalHistory' | 'isActive'>) => ResourceOwnership;
  updateOwner: (ownershipId: string, ownerId: string, ownerName: string, ownerRole: 'Founder' | 'FractionalExec' | 'Apprentice') => void;
  recordApproval: (ownershipId: string, approval: ApprovalRecord) => void;
  setResourceActive: (ownershipId: string, isActive: boolean) => void;
  deleteOwnership: (ownershipId: string) => void;

  // Queries
  getOwnershipById: (id: string) => ResourceOwnership | undefined;
  getOwnershipByResource: (workspaceId: string, resourceId: string) => ResourceOwnership | undefined;
  getOwnershipsByWorkspace: (workspaceId: string) => ResourceOwnership[];
  getOwnershipsByOwner: (workspaceId: string, ownerId: string) => ResourceOwnership[];
  getOwnershipsByType: (workspaceId: string, resourceType: ResourceType) => ResourceOwnership[];

  // Role-based filtering
  getOwnershipsForUser: (workspaceId: string, userId: string, userRole: Role) => ResourceOwnership[];

  // Approval history
  getApprovalHistory: (ownershipId: string) => ApprovalRecord[];
}

export const useResourceOwnershipStore = create<ResourceOwnershipState>()(
  persist(
    (set, get) => ({
      ownerships: [],

      assignOwner: (ownershipData) => {
        const now = new Date().toISOString();
        const newOwnership: ResourceOwnership = {
          ...ownershipData,
          id: `own-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          approvalHistory: [],
          isActive: true,
          assignedAt: now,
          updatedAt: now,
        };

        set(state => ({
          ownerships: [...state.ownerships, newOwnership],
        }));

        return newOwnership;
      },

      updateOwner: (ownershipId, ownerId, ownerName, ownerRole) => {
        set(state => ({
          ownerships: state.ownerships.map(own =>
            own.id === ownershipId
              ? {
                  ...own,
                  ownerId,
                  ownerName,
                  ownerRole,
                  updatedAt: new Date().toISOString(),
                }
              : own
          ),
        }));
      },

      recordApproval: (ownershipId, approval) => {
        set(state => ({
          ownerships: state.ownerships.map(own =>
            own.id === ownershipId
              ? {
                  ...own,
                  approvalHistory: [...own.approvalHistory, approval],
                  updatedAt: new Date().toISOString(),
                }
              : own
          ),
        }));
      },

      setResourceActive: (ownershipId, isActive) => {
        set(state => ({
          ownerships: state.ownerships.map(own =>
            own.id === ownershipId
              ? {
                  ...own,
                  isActive,
                  updatedAt: new Date().toISOString(),
                }
              : own
          ),
        }));
      },

      deleteOwnership: (ownershipId) => {
        set(state => ({
          ownerships: state.ownerships.filter(own => own.id !== ownershipId),
        }));
      },

      getOwnershipById: (id) => {
        return get().ownerships.find(own => own.id === id);
      },

      getOwnershipByResource: (workspaceId, resourceId) => {
        return get().ownerships.find(
          own => own.workspaceId === workspaceId && own.resourceId === resourceId
        );
      },

      getOwnershipsByWorkspace: (workspaceId) => {
        return get().ownerships.filter(own => own.workspaceId === workspaceId);
      },

      getOwnershipsByOwner: (workspaceId, ownerId) => {
        return get().ownerships.filter(
          own => own.workspaceId === workspaceId && own.ownerId === ownerId
        );
      },

      getOwnershipsByType: (workspaceId, resourceType) => {
        return get().ownerships.filter(
          own => own.workspaceId === workspaceId && own.resourceType === resourceType
        );
      },

      // Founder sees all, others only see what they own
      getOwnershipsForUser: (workspaceId, userId, userRole) => {
        const allOwnerships = get().ownerships.filter(own => own.workspaceId === workspaceId);

        if (userRole === 'Founder') {
          return allOwnerships;
        }

        return allOwnerships.filter(own => own.ownerId === userId);
      },

      getApprovalHistory: (ownershipId) => {
        const ownership = get().ownerships.find(own => own.id === ownershipId);
        return ownership?.approvalHistory || [];
      },
    }),
    {
      name: 'resource-ownership-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Demo data initialization
export const initializeDemoOwnerships = (workspaceId: string) => {
  const store = useResourceOwnershipStore.getState();

  // Don't reinitialize if we already have data for this workspace
  if (store.ownerships.some(own => own.workspaceId === workspaceId)) return;

  // Sample AI Tools with owners (including apprentices)
  const aiTools = [
    {
      resourceId: 'ai-chatgpt',
      resourceName: 'ChatGPT Plus',
      ownerId: 'founder-1',
      ownerName: 'Sarah Johnson',
      ownerRole: 'Founder' as const,
    },
    {
      resourceId: 'ai-midjourney',
      resourceName: 'Midjourney',
      ownerId: 'exec-1',
      ownerName: 'Priya Sharma',
      ownerRole: 'FractionalExec' as const,
    },
    {
      resourceId: 'ai-claude',
      resourceName: 'Claude Pro',
      ownerId: 'exec-1',
      ownerName: 'Priya Sharma',
      ownerRole: 'FractionalExec' as const,
    },
    {
      resourceId: 'ai-google-vertex',
      resourceName: 'Google Vertex AI',
      ownerId: 'apprentice-1',
      ownerName: 'Alex Thompson',
      ownerRole: 'Apprentice' as const,
    },
  ];

  // Sample Suppliers with owners (including apprentices)
  const suppliers = [
    {
      resourceId: 'supplier-aws',
      resourceName: 'AWS',
      ownerId: 'founder-1',
      ownerName: 'Sarah Johnson',
      ownerRole: 'Founder' as const,
    },
    {
      resourceId: 'supplier-slack',
      resourceName: 'Slack',
      ownerId: 'exec-2',
      ownerName: 'Mike Chen',
      ownerRole: 'FractionalExec' as const,
    },
    {
      resourceId: 'supplier-notion',
      resourceName: 'Notion',
      ownerId: 'apprentice-2',
      ownerName: 'Jordan Lee',
      ownerRole: 'Apprentice' as const,
    },
  ];

  // Create AI tool ownerships
  aiTools.forEach((tool) => {
    const ownership = store.assignOwner({
      workspaceId,
      resourceId: tool.resourceId,
      resourceName: tool.resourceName,
      resourceType: 'ai_tool',
      ownerId: tool.ownerId,
      ownerName: tool.ownerName,
      ownerRole: tool.ownerRole,
    });

    // Add approval record
    store.recordApproval(ownership.id, {
      approvedBy: 'founder-1',
      approvedByName: 'Sarah Johnson',
      approvedByRole: 'Founder',
      approvedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      notes: 'Approved for team use',
    });
  });

  // Create supplier ownerships
  suppliers.forEach((supplier) => {
    const ownership = store.assignOwner({
      workspaceId,
      resourceId: supplier.resourceId,
      resourceName: supplier.resourceName,
      resourceType: 'supplier',
      ownerId: supplier.ownerId,
      ownerName: supplier.ownerName,
      ownerRole: supplier.ownerRole,
    });

    // Add approval record
    store.recordApproval(ownership.id, {
      approvedBy: 'founder-1',
      approvedByName: 'Sarah Johnson',
      approvedByRole: 'Founder',
      approvedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      notes: 'Essential infrastructure',
    });
  });
};
