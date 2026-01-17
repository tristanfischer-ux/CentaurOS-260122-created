/**
 * User Store
 *
 * Manages user-specific data (preferences, favorites, etc.)
 * This data is specific to the authenticated user and persists across workspaces.
 */

import { create } from 'zustand';

// ============================================================================
// TYPES
// ============================================================================

export interface UserPreferences {
  id: string;
  user_id: string;
  default_workspace_id: string | null;
  theme: 'light' | 'dark' | 'system';
  notification_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserFavoriteSupplier {
  id: string;
  user_id: string;
  supplier_id: string;
  created_at: string;
}

// ============================================================================
// STORE
// ============================================================================

interface UserStore {
  // State
  preferences: UserPreferences | null;
  favoriteSupplierIds: string[];
  isLoaded: boolean;

  // Actions
  loadUserData: (userId: string) => Promise<void>;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
  addFavoriteSupplier: (supplierId: string) => Promise<void>;
  removeFavoriteSupplier: (supplierId: string) => Promise<void>;
  clearUserData: () => void;

  // Selectors
  isFavoriteSupplier: (supplierId: string) => boolean;
}

export const useUserStore = create<UserStore>((set, get) => ({
  // Initial state
  preferences: null,
  favoriteSupplierIds: [],
  isLoaded: false,

  // Actions
  loadUserData: async (userId: string) => {
    const { supabase } = await import('../supabase');

    try {
      // Load user preferences and favorites in parallel
      const [preferencesRes, favoritesRes] = await Promise.all([
        supabase.from('user_preferences').select('*').eq('user_id', userId).single(),
        supabase.from('user_favorite_suppliers').select('supplier_id').eq('user_id', userId),
      ]);

      // If no preferences exist, create default ones
      let preferences = preferencesRes.data;
      if (!preferences && preferencesRes.error?.code === 'PGRST116') {
        // Create default preferences
        const { data: newPrefs, error: createError } = await supabase
          .from('user_preferences')
          .insert({
            user_id: userId,
            theme: 'system',
            notification_enabled: true,
          })
          .select()
          .single();

        if (!createError) {
          preferences = newPrefs;
        }
      }

      set({
        preferences: preferences || null,
        favoriteSupplierIds: favoritesRes.data?.map((f) => f.supplier_id) || [],
        isLoaded: true,
      });
    } catch (error) {
      console.error('Failed to load user data:', error);
      set({
        preferences: null,
        favoriteSupplierIds: [],
        isLoaded: true,
      });
    }
  },

  updatePreferences: async (updates: Partial<UserPreferences>) => {
    const { supabase } = await import('../supabase');
    const currentPrefs = get().preferences;

    if (!currentPrefs) {
      console.error('No preferences to update');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .update(updates)
        .eq('id', currentPrefs.id)
        .select()
        .single();

      if (error) throw error;

      set({ preferences: data });
    } catch (error) {
      console.error('Failed to update preferences:', error);
    }
  },

  addFavoriteSupplier: async (supplierId: string) => {
    const { supabase } = await import('../supabase');
    const currentPrefs = get().preferences;

    if (!currentPrefs) {
      console.error('No user preferences found');
      return;
    }

    try {
      const { error } = await supabase.from('user_favorite_suppliers').insert({
        user_id: currentPrefs.user_id,
        supplier_id: supplierId,
      });

      if (error) throw error;

      set((state) => ({
        favoriteSupplierIds: [...state.favoriteSupplierIds, supplierId],
      }));
    } catch (error) {
      console.error('Failed to add favorite supplier:', error);
    }
  },

  removeFavoriteSupplier: async (supplierId: string) => {
    const { supabase } = await import('../supabase');
    const currentPrefs = get().preferences;

    if (!currentPrefs) {
      console.error('No user preferences found');
      return;
    }

    try {
      const { error } = await supabase
        .from('user_favorite_suppliers')
        .delete()
        .eq('user_id', currentPrefs.user_id)
        .eq('supplier_id', supplierId);

      if (error) throw error;

      set((state) => ({
        favoriteSupplierIds: state.favoriteSupplierIds.filter((id) => id !== supplierId),
      }));
    } catch (error) {
      console.error('Failed to remove favorite supplier:', error);
    }
  },

  clearUserData: () => {
    set({
      preferences: null,
      favoriteSupplierIds: [],
      isLoaded: false,
    });
  },

  // Selectors
  isFavoriteSupplier: (supplierId: string) => {
    return get().favoriteSupplierIds.includes(supplierId);
  },
}));
