/**
 * Allocation Request Store
 *
 * Manages resource allocation requests from executives to founders.
 * When an exec wants to allocate an apprentice, they create a request
 * that the founder must approve (unless delegation is enabled).
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from '@/lib/storage/mmkv-storage';

export type AllocationRequestStatus = 'pending' | 'approved' | 'rejected' | 'withdrawn';

export interface AllocationRequest {
  id: string;
  // Who is requesting
  requesterId: string;
  requesterName: string;
  requesterRole: 'FractionalExec';

  // Who is being allocated
  apprenticeId: string;
  apprenticeName: string;

  // What task/objective
  taskId?: string;
  taskTitle?: string;
  objectiveId?: string;
  objectiveTitle?: string;

  // Allocation details
  timeUnitsPerWeek: number; // How many TU/week
  durationWeeks?: number; // For how long (optional)
  justification: string; // Why this allocation is needed

  // Status
  status: AllocationRequestStatus;
  createdAt: string;
  updatedAt: string;

  // Response
  responderId?: string;
  responderName?: string;
  responseNote?: string;
  respondedAt?: string;
}

export interface DelegationSettings {
  // If true, execs can allocate their direct reports without approval
  directReportDelegation: boolean;

  // If true, execs can allocate ANY available apprentice without approval
  fullDelegation: boolean;

  // Maximum TU per week an exec can allocate without approval (0 = always need approval)
  autoApprovalThreshold: number;

  // Updated by
  lastUpdatedBy?: string;
  lastUpdatedAt?: string;
}

interface AllocationRequestStore {
  requests: AllocationRequest[];
  delegationSettings: DelegationSettings;

  // Actions
  createRequest: (request: Omit<AllocationRequest, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => AllocationRequest;
  approveRequest: (requestId: string, responderId: string, responderName: string, note?: string) => void;
  rejectRequest: (requestId: string, responderId: string, responderName: string, note?: string) => void;
  withdrawRequest: (requestId: string) => void;

  // Queries
  getPendingRequests: () => AllocationRequest[];
  getRequestsByRequester: (requesterId: string) => AllocationRequest[];
  getRequestsByApprentice: (apprenticeId: string) => AllocationRequest[];
  getRequestById: (id: string) => AllocationRequest | undefined;

  // Delegation settings
  updateDelegationSettings: (settings: Partial<DelegationSettings>, updatedBy: string) => void;

  // Check if approval is needed
  needsApproval: (requesterId: string, apprenticeId: string, isDirectReport: boolean, timeUnits: number) => boolean;
}

const DEFAULT_DELEGATION_SETTINGS: DelegationSettings = {
  directReportDelegation: false,
  fullDelegation: false,
  autoApprovalThreshold: 0,
};

export const useAllocationRequestStore = create<AllocationRequestStore>()(
  persist(
    (set, get) => ({
      requests: [],
      delegationSettings: DEFAULT_DELEGATION_SETTINGS,

      createRequest: (requestData) => {
        const request: AllocationRequest = {
          ...requestData,
          id: `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          requests: [request, ...state.requests],
        }));

        return request;
      },

      approveRequest: (requestId, responderId, responderName, note) => {
        set((state) => ({
          requests: state.requests.map((req) =>
            req.id === requestId
              ? {
                  ...req,
                  status: 'approved' as const,
                  responderId,
                  responderName,
                  responseNote: note,
                  respondedAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }
              : req
          ),
        }));
      },

      rejectRequest: (requestId, responderId, responderName, note) => {
        set((state) => ({
          requests: state.requests.map((req) =>
            req.id === requestId
              ? {
                  ...req,
                  status: 'rejected' as const,
                  responderId,
                  responderName,
                  responseNote: note,
                  respondedAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }
              : req
          ),
        }));
      },

      withdrawRequest: (requestId) => {
        set((state) => ({
          requests: state.requests.map((req) =>
            req.id === requestId
              ? {
                  ...req,
                  status: 'withdrawn' as const,
                  updatedAt: new Date().toISOString(),
                }
              : req
          ),
        }));
      },

      getPendingRequests: () => {
        return get().requests.filter((req) => req.status === 'pending');
      },

      getRequestsByRequester: (requesterId) => {
        return get().requests.filter((req) => req.requesterId === requesterId);
      },

      getRequestsByApprentice: (apprenticeId) => {
        return get().requests.filter((req) => req.apprenticeId === apprenticeId);
      },

      getRequestById: (id) => {
        return get().requests.find((req) => req.id === id);
      },

      updateDelegationSettings: (settings, updatedBy) => {
        set((state) => ({
          delegationSettings: {
            ...state.delegationSettings,
            ...settings,
            lastUpdatedBy: updatedBy,
            lastUpdatedAt: new Date().toISOString(),
          },
        }));
      },

      needsApproval: (requesterId, apprenticeId, isDirectReport, timeUnits) => {
        const { delegationSettings } = get();

        // Full delegation means no approval needed
        if (delegationSettings.fullDelegation) {
          return false;
        }

        // Direct report delegation for direct reports only
        if (isDirectReport && delegationSettings.directReportDelegation) {
          return false;
        }

        // Auto-approval threshold
        if (delegationSettings.autoApprovalThreshold > 0 && timeUnits <= delegationSettings.autoApprovalThreshold) {
          return false;
        }

        // Default: approval needed
        return true;
      },
    }),
    {
      name: 'allocation-request-storage',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);

// Seed some sample requests for demo
export const seedAllocationRequests = () => {
  const store = useAllocationRequestStore.getState();

  // Only seed if empty
  if (store.requests.length === 0) {
    // Sample pending request
    store.createRequest({
      requesterId: 'exec-2',
      requesterName: 'Emma Richardson',
      requesterRole: 'FractionalExec',
      apprenticeId: 'apprentice-5',
      apprenticeName: 'Omar Hassan',
      taskId: 'wp-s1',
      taskTitle: 'Sales Demo Automation',
      timeUnitsPerWeek: 4,
      durationWeeks: 3,
      justification: 'Omar has strong technical skills that would help automate our sales demo process. He could build the integration while James focuses on outreach.',
    });

    // Another pending request
    store.createRequest({
      requesterId: 'exec-3',
      requesterName: 'David Park',
      requesterRole: 'FractionalExec',
      apprenticeId: 'apprentice-7',
      apprenticeName: 'Lucas Silva',
      objectiveId: 'okr-1',
      objectiveTitle: 'Product Launch Marketing',
      timeUnitsPerWeek: 6,
      durationWeeks: 4,
      justification: 'Need Lucas to create technical documentation and marketing materials for the engineering team. His content skills would help with our product launch.',
    });
  }
};
