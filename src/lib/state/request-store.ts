import { create } from 'zustand';

export type RequestType = 'task' | 'okr';
export type RequestStatus = 'pending' | 'approved' | 'rejected';

export interface TaskRequest {
  id: string;
  type: 'task';
  title: string;
  description: string;
  estimatedTimeUnits: number;
  requestedBy: string; // member ID
  requestedByName: string;
  requestedByRole: 'Founder' | 'FractionalExec' | 'Apprentice';
  function: string;
  linkedOKRTitle?: string;
  status: RequestStatus;
  requestedAt: string;
  approvedAt?: string;
  workPlanId?: string; // Once approved, links to work plan
  // Founder feedback
  founderFeedback?: string; // Commentary from founder when approving/rejecting
  reviewedBy?: string; // Who reviewed
}

export interface OKRRequest {
  id: string;
  type: 'okr';
  title: string;
  description: string;
  objectives: Array<{
    title: string;
    targetValue: number;
  }>;
  requestedBy: string; // member ID
  requestedByName: string;
  requestedByRole: 'Founder' | 'FractionalExec' | 'Apprentice';
  function: string;
  status: RequestStatus;
  requestedAt: string;
  approvedAt?: string;
  okrId?: string; // Once approved, links to OKR
  // Founder feedback
  founderFeedback?: string; // Commentary from founder when approving/rejecting
  reviewedBy?: string; // Who reviewed
}

export type Request = TaskRequest | OKRRequest;

interface RequestState {
  requests: Request[];
  addTaskRequest: (request: Omit<TaskRequest, 'id' | 'status' | 'requestedAt'>) => void;
  addOKRRequest: (request: Omit<OKRRequest, 'id' | 'status' | 'requestedAt'>) => void;
  approveRequest: (requestId: string, reviewedBy?: string, feedback?: string) => void;
  rejectRequest: (requestId: string, reviewedBy?: string, feedback?: string) => void;
  getPendingRequests: () => Request[];
  getRequestsByMember: (memberId: string) => Request[];
  initializeDemoRequests: () => void;
}

export const useRequestStore = create<RequestState>((set, get) => ({
  requests: [],

  addTaskRequest: (request) => {
    const newRequest: TaskRequest = {
      ...request,
      id: `task-req-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      status: 'pending',
      requestedAt: new Date().toISOString(),
    };
    set((state) => ({
      requests: [...state.requests, newRequest],
    }));
  },

  addOKRRequest: (request) => {
    const newRequest: OKRRequest = {
      ...request,
      id: `okr-req-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      status: 'pending',
      requestedAt: new Date().toISOString(),
    };
    set((state) => ({
      requests: [...state.requests, newRequest],
    }));
  },

  approveRequest: (requestId, reviewedBy, feedback) => {
    set((state) => ({
      requests: state.requests.map((req) =>
        req.id === requestId
          ? {
              ...req,
              status: 'approved' as RequestStatus,
              approvedAt: new Date().toISOString(),
              reviewedBy,
              founderFeedback: feedback || undefined,
            }
          : req
      ),
    }));
  },

  rejectRequest: (requestId, reviewedBy, feedback) => {
    set((state) => ({
      requests: state.requests.map((req) =>
        req.id === requestId
          ? {
              ...req,
              status: 'rejected' as RequestStatus,
              reviewedBy,
              founderFeedback: feedback || undefined,
            }
          : req
      ),
    }));
  },

  getPendingRequests: () => {
    return get().requests.filter((req) => req.status === 'pending');
  },

  getRequestsByMember: (memberId) => {
    return get().requests.filter((req) => req.requestedBy === memberId);
  },

  initializeDemoRequests: () => {
    set({
      requests: [
        {
          id: 'task-req-1',
          type: 'task',
          title: 'Build customer feedback dashboard',
          description: 'Create a real-time dashboard showing customer satisfaction scores and feedback trends',
          estimatedTimeUnits: 20,
          requestedBy: 'member-apprentice-1',
          requestedByName: 'Alex Rivera',
          requestedByRole: 'Apprentice',
          function: 'Engineering',
          linkedOKRTitle: 'Launch MVP Product',
          status: 'pending',
          requestedAt: '2026-01-14T10:30:00Z',
        },
        {
          id: 'okr-req-1',
          type: 'okr',
          title: 'Expand to European markets',
          description: 'Establish presence in 3 European countries with localized product and support',
          objectives: [
            { title: 'Launch in Germany', targetValue: 100 },
            { title: 'Launch in France', targetValue: 100 },
            { title: 'Hire 2 European sales reps', targetValue: 2 },
          ],
          requestedBy: 'member-exec-2',
          requestedByName: 'Emma Richardson',
          requestedByRole: 'FractionalExec',
          function: 'Sales',
          status: 'pending',
          requestedAt: '2026-01-13T15:20:00Z',
        },
      ],
    });
  },
}));
