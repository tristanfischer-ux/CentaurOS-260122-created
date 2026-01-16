/**
 * MMKV Storage Adapter for Zustand Persist Middleware
 *
 * MMKV is 10x faster than AsyncStorage:
 * - Synchronous API (no bridge calls)
 * - Memory-mapped file (native performance)
 * - AES-256 encryption support
 *
 * This adapter makes MMKV compatible with Zustand's persist middleware.
 */

import { MMKV } from 'react-native-mmkv';
import { StateStorage } from 'zustand/middleware';

// Create singleton MMKV instance
export const mmkv = new MMKV();

/**
 * MMKV Storage adapter compatible with Zustand persist middleware
 *
 * Usage in Zustand store:
 * ```typescript
 * import { mmkvStorage } from '@/lib/storage/mmkv-storage';
 *
 * export const useStore = create<State>()(
 *   persist(
 *     (set) => ({ ... }),
 *     {
 *       name: 'store-name',
 *       storage: createJSONStorage(() => mmkvStorage),
 *     }
 *   )
 * );
 * ```
 */
export const mmkvStorage: StateStorage = {
  getItem: (name: string) => {
    const value = mmkv.getString(name);
    return value ?? null;
  },
  setItem: (name: string, value: string) => {
    mmkv.set(name, value);
  },
  removeItem: (name: string) => {
    mmkv.delete(name);
  },
};

/**
 * Get all keys stored in MMKV
 */
export function getAllKeys(): string[] {
  return mmkv.getAllKeys();
}

/**
 * Clear all data from MMKV
 * WARNING: This will delete ALL stored data
 */
export function clearAll(): void {
  mmkv.clearAll();
}

/**
 * Check if a key exists in MMKV
 */
export function contains(key: string): boolean {
  return mmkv.contains(key);
}

/**
 * Get storage size in bytes
 */
export function getSize(): number {
  // MMKV doesn't have a built-in size method, but we can estimate
  const keys = mmkv.getAllKeys();
  let totalSize = 0;

  keys.forEach(key => {
    const value = mmkv.getString(key);
    if (value) {
      totalSize += value.length;
    }
  });

  return totalSize;
}
