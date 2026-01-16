/**
 * Talent Invitation Store
 *
 * Manages invitations from founders to executives/apprentices with rate negotiation
 * Supports unaffiliated users who can sign up to receive invitations
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from '@/lib/storage/mmkv-storage';

export type InvitationStatus =
  | 'pending'           // Initial invitation sent
  | 'counter_offered'   // Candidate countered with different rate
  | 'accepted'          // Both parties agreed
  | 'rejected'          // Candidate rejected
  | 'withdrawn';        // Founder withdrew invitation

export type NegotiationType =
  | 'hourly_rate'
  | 'daily_rate'
  | 'monthly_retainer';

export interface RateProposal {
  proposedBy: 'founder' | 'candidate';
  amount: number;
  currency: string;
  type: NegotiationType;
  daysPerWeek?: number; // For fractional executives
  hoursPerWeek?: number; // For apprentices
  message?: string;
  timestamp: string;
}

export interface TalentInvitation {
  id: string;
  workspaceId: string; // Company extending the invitation
  companyName: string;

  // Candidate info
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  candidateRole: 'FractionalExec' | 'Apprentice';
  candidateFunction: string; // Marketing, Engineering, etc.

  // Invitation details
  position: string;
  description: string;
  startDate: string;

  // Rate negotiation history
  rateHistory: RateProposal[];
  currentRate?: RateProposal; // Latest rate proposal

  // Status
  status: InvitationStatus;

  // Metadata
  createdBy: string; // Founder userId
  createdAt: string;
  updatedAt: string;
  respondedAt?: string;
}

export interface UnaffiliatedUser {
  id: string;
  email: string;
  name: string;
  role: 'FractionalExec' | 'Apprentice';
  functions: string[]; // Areas of expertise
  bio?: string;
  hourlyRate?: number;
  dailyRate?: number;
  availability: {
    daysPerWeek?: number;
    startDate?: string;
  };
  profileComplete: boolean;
  createdAt: string;
}

interface InvitationState {
  invitations: TalentInvitation[];
  unaffiliatedUsers: UnaffiliatedUser[];

  // Invitation management
  createInvitation: (invitation: Omit<TalentInvitation, 'id' | 'createdAt' | 'updatedAt' | 'rateHistory' | 'status'>) => TalentInvitation;
  respondToInvitation: (invitationId: string, response: 'accept' | 'reject' | 'counter', counterRate?: RateProposal) => void;
  updateInvitationRate: (invitationId: string, newRate: RateProposal) => void;
  withdrawInvitation: (invitationId: string) => void;

  // Queries
  getInvitationById: (id: string) => TalentInvitation | undefined;
  getInvitationsByWorkspace: (workspaceId: string) => TalentInvitation[];
  getInvitationsByCandidate: (candidateEmail: string) => TalentInvitation[];
  getPendingInvitations: (candidateEmail: string) => TalentInvitation[];

  // Unaffiliated user management
  registerUnaffiliatedUser: (user: Omit<UnaffiliatedUser, 'id' | 'createdAt'>) => UnaffiliatedUser;
  updateUnaffiliatedUser: (userId: string, updates: Partial<UnaffiliatedUser>) => void;
  getUnaffiliatedUserByEmail: (email: string) => UnaffiliatedUser | undefined;
  searchUnaffiliatedUsers: (filters: { role?: 'FractionalExec' | 'Apprentice'; functions?: string[] }) => UnaffiliatedUser[];
}

export const useInvitationStore = create<InvitationState>()(
  persist(
    (set, get) => ({
      invitations: [],
      unaffiliatedUsers: [],

      createInvitation: (invitationData) => {
        const now = new Date().toISOString();
        const newInvitation: TalentInvitation = {
          ...invitationData,
          id: `inv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          status: 'pending',
          rateHistory: invitationData.currentRate ? [invitationData.currentRate] : [],
          createdAt: now,
          updatedAt: now,
        };

        set(state => ({
          invitations: [...state.invitations, newInvitation],
        }));

        return newInvitation;
      },

      respondToInvitation: (invitationId, response, counterRate) => {
        const now = new Date().toISOString();

        set(state => ({
          invitations: state.invitations.map(inv => {
            if (inv.id !== invitationId) return inv;

            let newStatus: InvitationStatus;
            let updatedHistory = [...inv.rateHistory];
            let updatedCurrentRate = inv.currentRate;

            if (response === 'accept') {
              newStatus = 'accepted';
            } else if (response === 'reject') {
              newStatus = 'rejected';
            } else if (response === 'counter' && counterRate) {
              newStatus = 'counter_offered';
              updatedHistory.push(counterRate);
              updatedCurrentRate = counterRate;
            } else {
              return inv; // Invalid response
            }

            return {
              ...inv,
              status: newStatus,
              rateHistory: updatedHistory,
              currentRate: updatedCurrentRate,
              respondedAt: now,
              updatedAt: now,
            };
          }),
        }));
      },

      updateInvitationRate: (invitationId, newRate) => {
        const now = new Date().toISOString();

        set(state => ({
          invitations: state.invitations.map(inv => {
            if (inv.id !== invitationId) return inv;

            return {
              ...inv,
              rateHistory: [...inv.rateHistory, newRate],
              currentRate: newRate,
              status: newRate.proposedBy === 'founder' ? 'pending' : 'counter_offered',
              updatedAt: now,
            };
          }),
        }));
      },

      withdrawInvitation: (invitationId) => {
        const now = new Date().toISOString();

        set(state => ({
          invitations: state.invitations.map(inv =>
            inv.id === invitationId
              ? { ...inv, status: 'withdrawn', updatedAt: now }
              : inv
          ),
        }));
      },

      getInvitationById: (id) => {
        return get().invitations.find(inv => inv.id === id);
      },

      getInvitationsByWorkspace: (workspaceId) => {
        return get().invitations.filter(inv => inv.workspaceId === workspaceId);
      },

      getInvitationsByCandidate: (candidateEmail) => {
        return get().invitations.filter(inv => inv.candidateEmail === candidateEmail);
      },

      getPendingInvitations: (candidateEmail) => {
        return get().invitations.filter(
          inv => inv.candidateEmail === candidateEmail &&
                 (inv.status === 'pending' || inv.status === 'counter_offered')
        );
      },

      registerUnaffiliatedUser: (userData) => {
        const now = new Date().toISOString();
        const newUser: UnaffiliatedUser = {
          ...userData,
          id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: now,
        };

        set(state => ({
          unaffiliatedUsers: [...state.unaffiliatedUsers, newUser],
        }));

        return newUser;
      },

      updateUnaffiliatedUser: (userId, updates) => {
        set(state => ({
          unaffiliatedUsers: state.unaffiliatedUsers.map(user =>
            user.id === userId ? { ...user, ...updates } : user
          ),
        }));
      },

      getUnaffiliatedUserByEmail: (email) => {
        return get().unaffiliatedUsers.find(user => user.email === email);
      },

      searchUnaffiliatedUsers: (filters) => {
        let users = get().unaffiliatedUsers;

        if (filters.role) {
          users = users.filter(user => user.role === filters.role);
        }

        if (filters.functions && filters.functions.length > 0) {
          users = users.filter(user =>
            filters.functions!.some(func => user.functions.includes(func))
          );
        }

        return users;
      },
    }),
    {
      name: 'invitation-storage',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);

// Demo data for testing
export const initializeDemoInvitations = () => {
  const store = useInvitationStore.getState();

  // Don't reinitialize if we already have data
  if (store.invitations.length > 0) return;

  // Create some demo unaffiliated users
  store.registerUnaffiliatedUser({
    email: 'jane.designer@example.com',
    name: 'Jane Designer',
    role: 'Apprentice',
    functions: ['Marketing', 'Ops'],
    bio: 'Experienced product designer with 3 years at top startups',
    hourlyRate: 45,
    availability: {
      daysPerWeek: 5,
      startDate: new Date().toISOString(),
    },
    profileComplete: true,
  });

  store.registerUnaffiliatedUser({
    email: 'mike.growth@example.com',
    name: 'Mike Chen',
    role: 'FractionalExec',
    functions: ['Marketing', 'Sales'],
    bio: 'Growth marketing expert, scaled 5 startups to $1M ARR',
    dailyRate: 800,
    availability: {
      daysPerWeek: 3,
      startDate: new Date().toISOString(),
    },
    profileComplete: true,
  });

  // Create a demo invitation
  store.createInvitation({
    workspaceId: 'workspace-demo-company',
    companyName: 'Demo Hardware Startup',
    candidateId: 'user-unaffiliated-1',
    candidateName: 'Jane Designer',
    candidateEmail: 'jane.designer@example.com',
    candidateRole: 'Apprentice',
    candidateFunction: 'Marketing',
    position: 'Marketing Apprentice',
    description: 'Help with social media content, website updates, and user research',
    startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: 'founder-1',
    currentRate: {
      proposedBy: 'founder',
      amount: 40,
      currency: 'GBP',
      type: 'hourly_rate',
      hoursPerWeek: 40,
      message: 'We think this is a fair rate to start. Open to discussion!',
      timestamp: new Date().toISOString(),
    },
  });
};
