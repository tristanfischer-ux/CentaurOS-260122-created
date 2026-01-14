/**
 * Marketplace Requests Store
 * Manages hiring requests from the marketplace
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
}

interface MarketplaceRequestsState {
  requests: MarketplaceRequest[];

  // Actions
  createRequest: (request: Omit<MarketplaceRequest, 'id' | 'requestedAt' | 'status'>) => string;
  approveRequest: (requestId: string, reviewedBy: string) => void;
  rejectRequest: (requestId: string, reviewedBy: string) => void;
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

      approveRequest: (requestId, reviewedBy) => {
        set((state) => ({
          requests: state.requests.map((req) =>
            req.id === requestId
              ? {
                  ...req,
                  status: 'approved' as const,
                  reviewedAt: new Date().toISOString(),
                  reviewedBy,
                }
              : req
          ),
        }));
      },

      rejectRequest: (requestId, reviewedBy) => {
        set((state) => ({
          requests: state.requests.map((req) =>
            req.id === requestId
              ? {
                  ...req,
                  status: 'rejected' as const,
                  reviewedAt: new Date().toISOString(),
                  reviewedBy,
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
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
