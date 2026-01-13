/**
 * Centralized Supplier State Management
 * Single source of truth for supplier data across all tabs
 */

import { create } from 'zustand';
import type { Supplier } from '@/types';
import { UK_SUPPLIERS } from '@/lib/suppliers-seed';
import { v4 as uuidv4 } from 'uuid';

interface SupplierState {
  // Data
  suppliers: Supplier[];
  selectedSupplier: Supplier | null;
  favoriteSupplierIds: string[];

  // UI State
  isLoadingSuppliers: boolean;
  error: string | null;

  // Actions
  initializeSuppliers: () => void;
  getSupplierById: (id: string) => Supplier | undefined;
  getSuppliersByCapability: (capability: string) => Supplier[];
  getSuppliersByRegion: (region: string) => Supplier[];
  selectSupplier: (supplier: Supplier | null) => void;
  toggleFavorite: (supplierId: string) => void;
  searchSuppliers: (query: string) => Supplier[];
  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateSupplier: (id: string, updates: Partial<Supplier>) => void;
}

export const useSupplierStore = create<SupplierState>((set, get) => ({
  // Initial state
  suppliers: [],
  selectedSupplier: null,
  favoriteSupplierIds: [],
  isLoadingSuppliers: false,
  error: null,

  // Initialize suppliers from seed data
  initializeSuppliers: () => {
    const now = new Date().toISOString();
    const suppliers: Supplier[] = UK_SUPPLIERS.map(supplier => ({
      ...supplier,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    }));

    set({ suppliers, isLoadingSuppliers: false });
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

  // Toggle favorite supplier
  toggleFavorite: (supplierId: string) => {
    set(state => ({
      favoriteSupplierIds: state.favoriteSupplierIds.includes(supplierId)
        ? state.favoriteSupplierIds.filter(id => id !== supplierId)
        : [...state.favoriteSupplierIds, supplierId],
    }));
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
export const useFavoriteSuppliers = () => {
  const suppliers = useSupplierStore(s => s.suppliers);
  const favoriteIds = useSupplierStore(s => s.favoriteSupplierIds);
  return suppliers.filter(s => favoriteIds.includes(s.id));
};
