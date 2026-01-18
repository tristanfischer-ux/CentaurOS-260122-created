/**
 * Centralized Supplier State Management
 * Single source of truth for supplier data across all tabs
 *
 * DATA SEPARATION:
 * - suppliers (UK_SUPPLIERS) = MARKETPLACE DATA (global supplier directory, no workspaceId)
 * - favoritesByWorkspace = COMPANY DATA (keyed by workspaceId)
 */

import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { Supplier } from '@/types';
import { UK_SUPPLIERS } from '@/lib/suppliers-seed';
import { v4 as uuidv4 } from 'uuid';

interface SupplierState {
  // MARKETPLACE DATA: Global supplier directory (available to all companies)
  suppliers: Supplier[];
  selectedSupplier: Supplier | null;

  // COMPANY DATA: Favorites keyed by workspaceId
  favoritesByWorkspace: Record<string, string[]>;

  // UI State
  isLoadingSuppliers: boolean;
  error: string | null;

  // Actions
  initializeSuppliers: () => void;
  loadSuppliersFromSupabase: (workspaceId: string) => Promise<void>;
  getSupplierById: (id: string) => Supplier | undefined;
  getSuppliersByCapability: (capability: string) => Supplier[];
  getSuppliersByRegion: (region: string) => Supplier[];
  selectSupplier: (supplier: Supplier | null) => void;

  // Company-specific favorites (requires workspaceId)
  toggleFavorite: (workspaceId: string, supplierId: string) => void;
  getFavoriteSupplierIds: (workspaceId: string) => string[];
  isFavorite: (workspaceId: string, supplierId: string) => boolean;

  searchSuppliers: (query: string) => Supplier[];
  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateSupplier: (id: string, updates: Partial<Supplier>) => void;
}

export const useSupplierStore = create<SupplierState>((set, get) => ({
  // Initial state
  suppliers: [],
  selectedSupplier: null,
  favoritesByWorkspace: {},
  isLoadingSuppliers: false,
  error: null,

  // Initialize suppliers from seed data (MARKETPLACE DATA)
  initializeSuppliers: () => {
    // DISABLED: No longer auto-loading UK supplier marketplace data
    // Users should start with empty supplier list
    // Start with empty supplier list for fresh users
    set({ suppliers: [], isLoadingSuppliers: false });
  },

  loadSuppliersFromSupabase: async (workspaceId: string) => {
    set({ isLoadingSuppliers: true, error: null });

    try {
      // Load suppliers from Supabase
      const { data: suppliersData, error: suppliersError } = await supabase
        .from('suppliers')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (suppliersError) {
        console.error('Error loading suppliers:', suppliersError);
        set({ error: suppliersError.message, isLoadingSuppliers: false });
        return;
      }

      // Transform Supabase data to Supplier format
      const suppliers: Supplier[] = (suppliersData || []).map((s: any) => ({
        id: s.id,
        name: s.name || '',
        description: s.description || '',
        capabilities: [], // Not in current schema
        region: 'UK' as const,
        location: {
          city: '',
          country: 'UK',
        },
        contact: {
          email: '',
          website: s.website || '',
        },
        certifications: [],
        status: 'approved' as const,
        recommendedByWorkspaceIds: [],
        createdAt: s.created_at || new Date().toISOString(),
        updatedAt: s.created_at || new Date().toISOString(),
      }));

      set({ suppliers, isLoadingSuppliers: false });
    } catch (err) {
      console.error('Error loading suppliers from Supabase:', err);
      set({ error: err instanceof Error ? err.message : 'Failed to load suppliers', isLoadingSuppliers: false });
    }
  },

  // Get supplier by ID (used across tabs)
  getSupplierById: (id: string) => {
    return get().suppliers.find(s => s.id === id);
  },

  // Get suppliers by capability
  getSuppliersByCapability: (capability: string) => {
    return get().suppliers.filter(s =>
      s.capabilities.some(c =>
        c.toLowerCase().includes(capability.toLowerCase())
      )
    );
  },

  // Get suppliers by region
  getSuppliersByRegion: (region: string) => {
    return get().suppliers.filter(s => s.region === region);
  },

  // Select supplier (for modal views)
  selectSupplier: (supplier: Supplier | null) => {
    set({ selectedSupplier: supplier });
  },

  // Toggle favorite supplier (COMPANY-SPECIFIC)
  toggleFavorite: (workspaceId: string, supplierId: string) => {
    set(state => {
      const currentFavorites = state.favoritesByWorkspace[workspaceId] || [];
      const updatedFavorites = currentFavorites.includes(supplierId)
        ? currentFavorites.filter(id => id !== supplierId)
        : [...currentFavorites, supplierId];

      return {
        favoritesByWorkspace: {
          ...state.favoritesByWorkspace,
          [workspaceId]: updatedFavorites,
        },
      };
    });
  },

  // Get favorite supplier IDs for a specific workspace
  getFavoriteSupplierIds: (workspaceId: string) => {
    return get().favoritesByWorkspace[workspaceId] || [];
  },

  // Check if a supplier is favorited by a workspace
  isFavorite: (workspaceId: string, supplierId: string) => {
    const favorites = get().favoritesByWorkspace[workspaceId] || [];
    return favorites.includes(supplierId);
  },

  // Search suppliers by name, description, or capabilities
  searchSuppliers: (query: string) => {
    const lowerQuery = query.toLowerCase();
    return get().suppliers.filter(s =>
      s.name.toLowerCase().includes(lowerQuery) ||
      s.description.toLowerCase().includes(lowerQuery) ||
      s.capabilities.some(c => c.toLowerCase().includes(lowerQuery)) ||
      (s.detailedDescription && s.detailedDescription.toLowerCase().includes(lowerQuery))
    );
  },

  // Add new supplier (for recommendations)
  addSupplier: async (supplierData: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const tempId = `temp-${Date.now()}`;
    const newSupplier: Supplier = {
      ...supplierData,
      id: tempId,
      createdAt: now,
      updatedAt: now,
    };

    // Optimistic update
    set(state => ({
      suppliers: [...state.suppliers, newSupplier],
    }));

    try {
      // Transform to Supabase format (note: suppliers table schema may differ)
      const supabaseSupplier = {
        name: supplierData.name,
        description: supplierData.description,
        website: supplierData.contact?.website || '',
        workspace_id: '00000000-0000-0000-0000-000000000001', // Default workspace or pass as param
      };

      const { data, error } = await supabase
        .from('suppliers')
        .insert(supabaseSupplier)
        .select()
        .single();

      if (error) throw error;

      // Replace temp with real data
      const realSupplier: Supplier = {
        ...newSupplier,
        id: data.id,
        createdAt: data.created_at || now,
        updatedAt: data.created_at || now,
      };

      set(state => ({
        suppliers: state.suppliers.map(s => s.id === tempId ? realSupplier : s),
      }));
    } catch (err) {
      // Rollback on error
      set(state => ({
        suppliers: state.suppliers.filter(s => s.id !== tempId),
      }));
      console.error('Failed to add supplier:', err);
      throw err;
    }
  },

  // Update existing supplier
  updateSupplier: async (id: string, updates: Partial<Supplier>) => {
    // Store previous state for rollback
    const previousSuppliers = get().suppliers;

    // Optimistic update
    set(state => ({
      suppliers: state.suppliers.map(s =>
        s.id === id
          ? { ...s, ...updates, updatedAt: new Date().toISOString() }
          : s
      ),
    }));

    try {
      // Transform updates to Supabase format
      const supabaseUpdates: any = {};
      if (updates.name !== undefined) supabaseUpdates.name = updates.name;
      if (updates.description !== undefined) supabaseUpdates.description = updates.description;
      if (updates.contact?.website !== undefined) supabaseUpdates.website = updates.contact.website;

      const { data, error } = await supabase
        .from('suppliers')
        .update(supabaseUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Update with real data from server
      const current = get().suppliers.find(s => s.id === id);
      if (current) {
        set(state => ({
          suppliers: state.suppliers.map(s =>
            s.id === id ? { ...current, ...updates, updatedAt: new Date().toISOString() } : s
          ),
        }));
      }
    } catch (err) {
      // Rollback on error
      set({ suppliers: previousSuppliers });
      console.error('Failed to update supplier:', err);
      throw err;
    }
  },
}));

// Selectors for efficient access
export const useSuppliers = () => useSupplierStore(s => s.suppliers);
export const useSelectedSupplier = () => useSupplierStore(s => s.selectedSupplier);

// Company-specific selector for favorite suppliers
export const useFavoriteSuppliers = (workspaceId: string) => {
  const suppliers = useSupplierStore(s => s.suppliers);
  const favoriteIds = useSupplierStore(s => s.favoritesByWorkspace[workspaceId] || []);
  return suppliers.filter(s => favoriteIds.includes(s.id));
};
