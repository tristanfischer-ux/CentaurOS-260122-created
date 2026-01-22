/**
 * Marketplace Requests Store
 * Manages hiring requests from the marketplace
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from '@/lib/storage/mmkv-storage';

export interface MarketplaceRequest {
  id: string;
  workspaceId: string;
  candidateId: string; // ID from MARKETPLACE_EXECUTIVES
  candidateName: string;
  candidateRole: 'FractionalExec' | 'Apprentice';
  candidateFunction: string;
  requestedBy: string; // User ID or name
  status: 'pending' | 'approved' | 'rejected';
  proposedDaysPerWeek: number;
  proposedDayRate: number;
  notes?: string;
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  // Commentary fields for approval/rejection
  approvalNotes?: string; // Notes when approving (optional)
  rejectionReason?: string; // Reason when rejecting (required)
}

interface MarketplaceRequestsState {
  requests: MarketplaceRequest[];

  // Actions
  createRequest: (request: Omit<MarketplaceRequest, 'id' | 'requestedAt' | 'status'>) => string;
  approveRequest: (requestId: string, reviewedBy: string, notes?: string) => void;
  rejectRequest: (requestId: string, reviewedBy: string, reason: string) => void;
  getPendingRequests: () => MarketplaceRequest[];
  getRequestByCandidate: (candidateId: string) => MarketplaceRequest | undefined;
}

export const useMarketplaceRequestsStore = create<MarketplaceRequestsState>()(
  persist(
    (set, get) => ({
      requests: [],

      createRequest: (request) => {
        const newRequest: MarketplaceRequest = {
          ...request,
          id: `req-${Date.now()}`,
          status: 'pending',
          requestedAt: new Date().toISOString(),
        };

        set((state) => ({
          requests: [...state.requests, newRequest],
        }));

        return newRequest.id;
      },

      approveRequest: (requestId, reviewedBy, notes) => {
        set((state) => ({
          requests: state.requests.map((req) =>
            req.id === requestId
              ? {
                  ...req,
                  status: 'approved' as const,
                  reviewedAt: new Date().toISOString(),
                  reviewedBy,
                  approvalNotes: notes || undefined,
                }
              : req
          ),
        }));
      },

      rejectRequest: (requestId, reviewedBy, reason) => {
        set((state) => ({
          requests: state.requests.map((req) =>
            req.id === requestId
              ? {
                  ...req,
                  status: 'rejected' as const,
                  reviewedAt: new Date().toISOString(),
                  reviewedBy,
                  rejectionReason: reason,
                }
              : req
          ),
        }));
      },

      getPendingRequests: () => {
        return get().requests.filter((req) => req.status === 'pending');
      },

      getRequestByCandidate: (candidateId) => {
        return get().requests.find((req) => req.candidateId === candidateId);
      },
    }),
    {
      name: 'marketplace-requests-storage',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
