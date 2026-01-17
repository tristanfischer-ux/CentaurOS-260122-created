/**
 * Centralized Supplier State Management
 * Single source of truth for supplier data across all tabs
 *
 * DATA SEPARATION:
 * - suppliers (UK_SUPPLIERS) = MARKETPLACE DATA (global supplier directory, no workspaceId)
 * - favoritesByWorkspace = COMPANY DATA (keyed by workspaceId)
 */

import { create } from 'zustand';
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
    // const now = new Date().toISOString();
    // const suppliers: Supplier[] = UK_SUPPLIERS.map(supplier => ({
    //   ...supplier,
    //   id: uuidv4(),
    //   createdAt: now,
    //   updatedAt: now,
    // }));
    //
    // set({ suppliers, isLoadingSuppliers: false });

    // Start with empty supplier list for fresh users
    set({ suppliers: [], isLoadingSuppliers: false });
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
  addSupplier: (supplierData) => {
    const now = new Date().toISOString();
    const newSupplier: Supplier = {
      ...supplierData,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };

    set(state => ({
      suppliers: [...state.suppliers, newSupplier],
    }));
  },

  // Update existing supplier
  updateSupplier: (id: string, updates: Partial<Supplier>) => {
    set(state => ({
      suppliers: state.suppliers.map(s =>
        s.id === id
          ? { ...s, ...updates, updatedAt: new Date().toISOString() }
          : s
      ),
    }));
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
