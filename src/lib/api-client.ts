/**
 * API Client
 *
 * Abstraction layer for backend communication.
 * Currently uses local storage, but can be swapped to HTTP/Supabase.
 *
 * Usage:
 * - Import apiClient and use its methods
 * - When ready for production, update the implementation here
 * - All consuming code stays the same
 */

import { config, isFeatureEnabled } from './config';
import { db, authStorage } from './storage';

// =============================================================================
// TYPES
// =============================================================================

export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
  status: 'success' | 'error';
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface QueryOptions {
  page?: number;
  pageSize?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
  filters?: Record<string, any>;
}

// =============================================================================
// API CLIENT CLASS
// =============================================================================

class ApiClient {
  private baseUrl: string;
  private timeout: number;

  constructor() {
    this.baseUrl = config.api.baseUrl;
    this.timeout = config.api.timeout;
  }

  // ---------------------------------------------------------------------------
  // PRIVATE HELPERS
  // ---------------------------------------------------------------------------

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = authStorage.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return {
        data: null,
        error: {
          code: `HTTP_${response.status}`,
          message: error.message || response.statusText,
          details: error,
        },
        status: 'error',
      };
    }

    const data = await response.json();
    return { data, error: null, status: 'success' };
  }

  private async fetchWithRetry<T>(
    url: string,
    options: RequestInit,
    retries = config.api.retryAttempts
  ): Promise<ApiResponse<T>> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return this.handleResponse<T>(response);
    } catch (error: any) {
      if (retries > 0 && error.name !== 'AbortError') {
        await new Promise((resolve) => setTimeout(resolve, config.api.retryDelay));
        return this.fetchWithRetry<T>(url, options, retries - 1);
      }

      return {
        data: null,
        error: {
          code: error.name || 'NETWORK_ERROR',
          message: error.message || 'Network request failed',
        },
        status: 'error',
      };
    }
  }

  // ---------------------------------------------------------------------------
  // PUBLIC METHODS - These work with both local and remote backends
  // ---------------------------------------------------------------------------

  /**
   * Check if backend sync is enabled
   */
  isBackendEnabled(): boolean {
    return isFeatureEnabled('enableBackendSync');
  }

  /**
   * Generic GET request
   */
  async get<T>(endpoint: string, options?: QueryOptions): Promise<ApiResponse<T>> {
    if (!this.isBackendEnabled()) {
      // Local storage fallback - implement per entity
      return { data: null, error: { code: 'LOCAL_ONLY', message: 'Using local storage' }, status: 'error' };
    }

    const url = new URL(`${this.baseUrl}${endpoint}`);
    if (options) {
      Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      });
    }

    const headers = await this.getAuthHeaders();
    return this.fetchWithRetry<T>(url.toString(), {
      method: 'GET',
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }

  /**
   * Generic POST request
   */
  async post<T>(endpoint: string, body: any): Promise<ApiResponse<T>> {
    if (!this.isBackendEnabled()) {
      return { data: null, error: { code: 'LOCAL_ONLY', message: 'Using local storage' }, status: 'error' };
    }

    const headers = await this.getAuthHeaders();
    return this.fetchWithRetry<T>(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  /**
   * Generic PUT request
   */
  async put<T>(endpoint: string, body: any): Promise<ApiResponse<T>> {
    if (!this.isBackendEnabled()) {
      return { data: null, error: { code: 'LOCAL_ONLY', message: 'Using local storage' }, status: 'error' };
    }

    const headers = await this.getAuthHeaders();
    return this.fetchWithRetry<T>(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  /**
   * Generic PATCH request
   */
  async patch<T>(endpoint: string, body: any): Promise<ApiResponse<T>> {
    if (!this.isBackendEnabled()) {
      return { data: null, error: { code: 'LOCAL_ONLY', message: 'Using local storage' }, status: 'error' };
    }

    const headers = await this.getAuthHeaders();
    return this.fetchWithRetry<T>(`${this.baseUrl}${endpoint}`, {
      method: 'PATCH',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  /**
   * Generic DELETE request
   */
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    if (!this.isBackendEnabled()) {
      return { data: null, error: { code: 'LOCAL_ONLY', message: 'Using local storage' }, status: 'error' };
    }

    const headers = await this.getAuthHeaders();
    return this.fetchWithRetry<T>(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }
}

// =============================================================================
// SINGLETON EXPORT
// =============================================================================

export const apiClient = new ApiClient();

// =============================================================================
// ENTITY-SPECIFIC API FUNCTIONS
// These provide a clean interface and handle local/remote switching
// =============================================================================

/**
 * Work Plans API
 */
export const workPlansApi = {
  async getAll(workspaceId: string) {
    if (!apiClient.isBackendEnabled()) {
      // Use local storage
      const { useWorkPlanStore } = await import('./state/work-plan-store');
      return { data: useWorkPlanStore.getState().workPlans, error: null, status: 'success' as const };
    }
    return apiClient.get(`/workspaces/${workspaceId}/work-plans`);
  },

  async getById(workspaceId: string, id: string) {
    if (!apiClient.isBackendEnabled()) {
      const { useWorkPlanStore } = await import('./state/work-plan-store');
      const plan = useWorkPlanStore.getState().workPlans.find((wp) => wp.id === id);
      return { data: plan || null, error: null, status: 'success' as const };
    }
    return apiClient.get(`/workspaces/${workspaceId}/work-plans/${id}`);
  },

  async create(workspaceId: string, data: any) {
    if (!apiClient.isBackendEnabled()) {
      const { useWorkPlanStore } = await import('./state/work-plan-store');
      useWorkPlanStore.getState().addWorkPlan(data);
      return { data, error: null, status: 'success' as const };
    }
    return apiClient.post(`/workspaces/${workspaceId}/work-plans`, data);
  },

  async update(workspaceId: string, id: string, data: any) {
    if (!apiClient.isBackendEnabled()) {
      const { useWorkPlanStore } = await import('./state/work-plan-store');
      useWorkPlanStore.getState().updateWorkPlan(id, data);
      return { data: { id, ...data }, error: null, status: 'success' as const };
    }
    return apiClient.patch(`/workspaces/${workspaceId}/work-plans/${id}`, data);
  },

  async delete(workspaceId: string, id: string) {
    if (!apiClient.isBackendEnabled()) {
      const { useWorkPlanStore } = await import('./state/work-plan-store');
      useWorkPlanStore.getState().deleteWorkPlan(id);
      return { data: { success: true }, error: null, status: 'success' as const };
    }
    return apiClient.delete(`/workspaces/${workspaceId}/work-plans/${id}`);
  },
};

/**
 * Organization Members API
 */
export const membersApi = {
  async getAll(workspaceId: string) {
    if (!apiClient.isBackendEnabled()) {
      const { useOrganizationStore } = await import('./state/organization-store');
      return { data: useOrganizationStore.getState().members, error: null, status: 'success' as const };
    }
    return apiClient.get(`/workspaces/${workspaceId}/members`);
  },

  async getById(workspaceId: string, id: string) {
    if (!apiClient.isBackendEnabled()) {
      const { useOrganizationStore } = await import('./state/organization-store');
      const member = useOrganizationStore.getState().members.find((m) => m.id === id);
      return { data: member || null, error: null, status: 'success' as const };
    }
    return apiClient.get(`/workspaces/${workspaceId}/members/${id}`);
  },

  async create(workspaceId: string, data: any) {
    if (!apiClient.isBackendEnabled()) {
      const { useOrganizationStore } = await import('./state/organization-store');
      useOrganizationStore.getState().addMember(data);
      return { data, error: null, status: 'success' as const };
    }
    return apiClient.post(`/workspaces/${workspaceId}/members`, data);
  },

  async update(workspaceId: string, id: string, data: any) {
    if (!apiClient.isBackendEnabled()) {
      const { useOrganizationStore } = await import('./state/organization-store');
      useOrganizationStore.getState().updateMember(id, data);
      return { data: { id, ...data }, error: null, status: 'success' as const };
    }
    return apiClient.patch(`/workspaces/${workspaceId}/members/${id}`, data);
  },
};

/**
 * OKRs API
 */
export const okrsApi = {
  async getAll(workspaceId: string) {
    if (!apiClient.isBackendEnabled()) {
      const { useOKRStore } = await import('./state/okr-store');
      return { data: useOKRStore.getState().okrs, error: null, status: 'success' as const };
    }
    return apiClient.get(`/workspaces/${workspaceId}/okrs`);
  },

  async getById(workspaceId: string, id: string) {
    if (!apiClient.isBackendEnabled()) {
      const { useOKRStore } = await import('./state/okr-store');
      const okr = useOKRStore.getState().okrs.find((o) => o.id === id);
      return { data: okr || null, error: null, status: 'success' as const };
    }
    return apiClient.get(`/workspaces/${workspaceId}/okrs/${id}`);
  },

  async create(workspaceId: string, data: any) {
    if (!apiClient.isBackendEnabled()) {
      const { useOKRStore } = await import('./state/okr-store');
      useOKRStore.getState().addOKR(data);
      return { data, error: null, status: 'success' as const };
    }
    return apiClient.post(`/workspaces/${workspaceId}/okrs`, data);
  },

  async update(workspaceId: string, id: string, data: any) {
    if (!apiClient.isBackendEnabled()) {
      const { useOKRStore } = await import('./state/okr-store');
      useOKRStore.getState().updateOKR(id, data);
      return { data: { id, ...data }, error: null, status: 'success' as const };
    }
    return apiClient.patch(`/workspaces/${workspaceId}/okrs/${id}`, data);
  },
};

/**
 * Allocation Requests API
 */
export const allocationRequestsApi = {
  async getAll(workspaceId: string) {
    if (!apiClient.isBackendEnabled()) {
      const { useAllocationRequestStore } = await import('./state/allocation-request-store');
      return { data: useAllocationRequestStore.getState().requests, error: null, status: 'success' as const };
    }
    return apiClient.get(`/workspaces/${workspaceId}/allocation-requests`);
  },

  async getPending(workspaceId: string) {
    if (!apiClient.isBackendEnabled()) {
      const { useAllocationRequestStore } = await import('./state/allocation-request-store');
      const requests = useAllocationRequestStore.getState().requests.filter((r) => r.status === 'pending');
      return { data: requests, error: null, status: 'success' as const };
    }
    return apiClient.get(`/workspaces/${workspaceId}/allocation-requests?status=pending`);
  },

  async create(workspaceId: string, data: any) {
    if (!apiClient.isBackendEnabled()) {
      const { useAllocationRequestStore } = await import('./state/allocation-request-store');
      const request = useAllocationRequestStore.getState().createRequest(data);
      return { data: request, error: null, status: 'success' as const };
    }
    return apiClient.post(`/workspaces/${workspaceId}/allocation-requests`, data);
  },

  async approve(workspaceId: string, id: string, responderId: string, responderName: string, note?: string) {
    if (!apiClient.isBackendEnabled()) {
      const { useAllocationRequestStore } = await import('./state/allocation-request-store');
      useAllocationRequestStore.getState().approveRequest(id, responderId, responderName, note);
      return { data: { success: true }, error: null, status: 'success' as const };
    }
    return apiClient.post(`/workspaces/${workspaceId}/allocation-requests/${id}/approve`, { note });
  },

  async reject(workspaceId: string, id: string, responderId: string, responderName: string, note?: string) {
    if (!apiClient.isBackendEnabled()) {
      const { useAllocationRequestStore } = await import('./state/allocation-request-store');
      useAllocationRequestStore.getState().rejectRequest(id, responderId, responderName, note);
      return { data: { success: true }, error: null, status: 'success' as const };
    }
    return apiClient.post(`/workspaces/${workspaceId}/allocation-requests/${id}/reject`, { note });
  },
};
