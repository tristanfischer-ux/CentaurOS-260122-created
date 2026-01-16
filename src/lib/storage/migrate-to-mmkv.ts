/**
 * Migration Utility: AsyncStorage → MMKV
 *
 * Safely migrates all data from AsyncStorage to MMKV.
 * Run this once on app startup to transfer existing data.
 *
 * This migration:
 * - Reads all keys from AsyncStorage
 * - Copies data to MMKV
 * - Validates successful migration
 * - Optionally clears AsyncStorage after success
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { mmkv } from './mmkv-storage';

interface MigrationResult {
  success: boolean;
  migratedCount: number;
  failedKeys: string[];
  totalSizeMB: number;
  error?: string;
}

/**
 * Migrate all data from AsyncStorage to MMKV
 *
 * @param clearAsyncStorageAfter - If true, clears AsyncStorage after successful migration
 * @returns Migration result with statistics
 */
export async function migrateAsyncStorageToMMKV(
  clearAsyncStorageAfter: boolean = false
): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: false,
    migratedCount: 0,
    failedKeys: [],
    totalSizeMB: 0,
  };

  try {
    console.log('[MMKV Migration] Starting migration from AsyncStorage to MMKV...');

    // Get all keys from AsyncStorage
    const keys = await AsyncStorage.getAllKeys();
    console.log(`[MMKV Migration] Found ${keys.length} keys in AsyncStorage`);

    if (keys.length === 0) {
      console.log('[MMKV Migration] No data to migrate');
      result.success = true;
      return result;
    }

    // Read all data from AsyncStorage
    const stores = await AsyncStorage.multiGet(keys);
    let totalSize = 0;

    // Migrate each key-value pair
    stores.forEach(([key, value]) => {
      if (value !== null) {
        try {
          mmkv.set(key, value);
          result.migratedCount++;
          totalSize += value.length;
        } catch (error) {
          console.error(`[MMKV Migration] Failed to migrate key "${key}":`, error);
          result.failedKeys.push(key);
        }
      }
    });

    result.totalSizeMB = totalSize / (1024 * 1024);
    result.success = result.failedKeys.length === 0;

    console.log(
      `[MMKV Migration] Completed: ${result.migratedCount}/${keys.length} keys migrated (${result.totalSizeMB.toFixed(2)}MB)`
    );

    if (result.failedKeys.length > 0) {
      console.warn(`[MMKV Migration] Failed keys:`, result.failedKeys);
    }

    // Optionally clear AsyncStorage after successful migration
    if (result.success && clearAsyncStorageAfter) {
      console.log('[MMKV Migration] Clearing AsyncStorage...');
      await AsyncStorage.clear();
      console.log('[MMKV Migration] AsyncStorage cleared');
    }

    return result;
  } catch (error) {
    console.error('[MMKV Migration] Migration failed:', error);
    result.error = error instanceof Error ? error.message : 'Unknown error';
    return result;
  }
}

/**
 * Check if migration has already been completed
 * Looks for a migration flag in MMKV
 */
export function isMigrationCompleted(): boolean {
  return mmkv.getBoolean('mmkv-migration-completed') === true;
}

/**
 * Mark migration as completed
 */
export function markMigrationCompleted(): void {
  mmkv.set('mmkv-migration-completed', true);
}

/**
 * Run migration if not already completed
 *
 * Usage in _layout.tsx:
 * ```typescript
 * import { runMigrationIfNeeded } from '@/lib/storage/migrate-to-mmkv';
 *
 * useEffect(() => {
 *   runMigrationIfNeeded();
 * }, []);
 * ```
 */
export async function runMigrationIfNeeded(): Promise<void> {
  if (isMigrationCompleted()) {
    console.log('[MMKV Migration] Already completed, skipping');
    return;
  }

  console.log('[MMKV Migration] First run detected, starting migration...');

  const result = await migrateAsyncStorageToMMKV(false); // Don't clear AsyncStorage yet

  if (result.success) {
    markMigrationCompleted();
    console.log('[MMKV Migration] ✅ Migration successful and marked as completed');
  } else {
    console.error('[MMKV Migration] ❌ Migration failed, will retry on next launch');
  }
}
