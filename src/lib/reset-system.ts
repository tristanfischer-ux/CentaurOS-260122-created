/**
 * Comprehensive Reset System for CentaurOS
 *
 * This module provides a complete reset of ALL company/tenant data
 * while preserving global/marketplace catalogs and user authentication.
 *
 * CRITICAL: This clears ALL local company data including:
 * - All Zustand persisted stores
 * - All AsyncStorage data
 * - All MMKV data
 *
 * What IS preserved:
 * - User authentication (Supabase session)
 * - Global marketplace catalogs (suppliers, tools)
 *
 * What is NOT preserved (WILL BE CLEARED):
 * - All workspace/company data
 * - All team members
 * - All objectives, tasks, work plans
 * - All decisions
 * - All allocations and requests
 * - All squads and loadouts
 * - All notifications
 * - Tech tree progress
 * - Build queue
 * - Financial snapshots
 * - Dashboard layouts
 * - Messages
 * - Calendar events
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { mmkv } from '@/lib/storage/mmkv-storage';

/**
 * Dev-only flag to enable detailed logging
 */
const __DEV__ = process.env.NODE_ENV !== 'production';

/**
 * Debug report interface
 */
export interface ResetDebugReport {
  timestamp: string;
  clearedAsyncStorageKeys: string[];
  clearedMMKVKeys: string[];
  persistedStoresCleared: string[];
  totalItemsCleared: number;
  errors: string[];
}

/**
 * List of ALL Zustand stores that use persist middleware
 * These stores save data to MMKV and need explicit clearing
 */
const PERSISTED_STORE_KEYS = [
  'tech-tree-storage',              // Tech tree progress, XP, unlocks
  'allocation-request-storage',     // Allocation requests from executives
  'notification-storage',           // User notifications
  'marketplace-requests-storage',   // Marketplace service requests
  'invitation-storage',             // Team invitations
  'resource-storage',               // People, tasks, AI tools
  'company-aim-storage',            // Company vision/mission statements
  'resource-ownership-storage',     // Resource ownership assignments
  'recommendation-storage',         // AI recommendations
  'dashboard-layout-storage',       // Dashboard widget layouts
  'build-queue-storage',            // Build queue for tech tree
];

/**
 * AsyncStorage keys that contain company data
 * (Not auth-related)
 */
const ASYNC_STORAGE_COMPANY_KEYS = [
  // Auth keys (PRESERVED - do NOT include here)
  // 'auth:user',
  // 'auth:token',

  // Database entities (CLEARED)
  'db:users',
  'db:workspaces',
  'db:memberships',
  'db:objectives',
  'db:keyResults',
  'db:metricEvents',
  'db:projects',
  'db:tasks',
  'db:taskComments',
  'db:timeEntries',
  'db:reviews',
  'db:weeklyPacks',
  'db:templates',
  'db:workflowItems',
  'db:suppliers',  // Note: This is platform-wide but we clear for clean slate
  'db:supplierRecommendations',
  'db:companyProfiles',
  'db:companyConnections',
  'db:communityEvents',
  'db:eventRSVPs',
  'db:auditLogs',

  // App state (CLEARED)
  'app:currentWorkspace',

  // Store-specific AsyncStorage keys
  '@centaur-os:armory-v1',          // Armory store (loadouts, squads)
  '@centaur-os:finance-snapshots',  // Finance store
  '@centaur-os:okr-queue',          // OKR queue
  '@centaur-os:squads',             // Squad store
  '@centaur-os:okr-planner',        // OKR planner store
  '@role-storage',                  // Role selection
];

/**
 * Store instances - these need to be reset via their reset methods
 * These are imported dynamically to avoid circular dependencies
 * Using 'any' for flexibility since not all stores have reset methods
 */
export interface StoreResetHandlers {
  armoryStore?: any;
  financeStore?: any;
  organizationStore?: any;
  supplierStore?: any;
  decisionsStore?: any;
  objectivesStore?: any;
  workPlanStore?: any;
  okrStore?: any;
  queueStore?: any;
  requestStore?: any;
  messagesStore?: any;
  calendarStore?: any;
  capacityStore?: any;
  squadStore?: any;
  businessImprovementsStore?: any;
  integrationsStore?: any;
  leaderboardStore?: any;
  okrPlannerStore?: any;
  techTreeStore?: any;
}

/**
 * Clears all MMKV persisted Zustand stores
 */
async function clearPersistedStores(): Promise<string[]> {
  const cleared: string[] = [];

  for (const storageKey of PERSISTED_STORE_KEYS) {
    try {
      if (mmkv.contains(storageKey)) {
        mmkv.delete(storageKey);
        cleared.push(storageKey);
        if (__DEV__) {
          console.log(`[Reset] ✅ Cleared MMKV store: ${storageKey}`);
        }
      }
    } catch (error) {
      if (__DEV__) {
        console.error(`[Reset] ❌ Failed to clear MMKV store ${storageKey}:`, error);
      }
    }
  }

  return cleared;
}

/**
 * Clears all AsyncStorage company data (preserves auth)
 */
async function clearAsyncStorageCompanyData(): Promise<string[]> {
  const cleared: string[] = [];

  for (const key of ASYNC_STORAGE_COMPANY_KEYS) {
    try {
      const value = await AsyncStorage.getItem(key);
      if (value !== null) {
        await AsyncStorage.removeItem(key);
        cleared.push(key);
        if (__DEV__) {
          console.log(`[Reset] ✅ Cleared AsyncStorage key: ${key}`);
        }
      }
    } catch (error) {
      if (__DEV__) {
        console.error(`[Reset] ❌ Failed to clear AsyncStorage key ${key}:`, error);
      }
    }
  }

  return cleared;
}

/**
 * Calls reset methods on all store instances (if they exist)
 */
async function resetStoreInstances(handlers: StoreResetHandlers): Promise<void> {
  const resetPromises: Promise<void>[] = [];

  // Async resets (check if method exists)
  if (handlers.armoryStore?.reset && typeof handlers.armoryStore.reset === 'function') {
    resetPromises.push(handlers.armoryStore.reset());
  }
  if (handlers.financeStore?.reset && typeof handlers.financeStore.reset === 'function') {
    resetPromises.push(handlers.financeStore.reset());
  }
  if (handlers.queueStore?.reset && typeof handlers.queueStore.reset === 'function') {
    resetPromises.push(handlers.queueStore.reset());
  }
  if (handlers.squadStore?.reset && typeof handlers.squadStore.reset === 'function') {
    resetPromises.push(handlers.squadStore.reset());
  }
  if (handlers.okrPlannerStore?.reset && typeof handlers.okrPlannerStore.reset === 'function') {
    resetPromises.push(handlers.okrPlannerStore.reset());
  }

  // Synchronous resets (check if method exists)
  if (handlers.organizationStore?.reset && typeof handlers.organizationStore.reset === 'function') {
    handlers.organizationStore.reset();
  }
  if (handlers.supplierStore?.resetWorkspaceState && typeof handlers.supplierStore.resetWorkspaceState === 'function') {
    handlers.supplierStore.resetWorkspaceState();
  }
  if (handlers.decisionsStore?.reset && typeof handlers.decisionsStore.reset === 'function') {
    handlers.decisionsStore.reset();
  }
  if (handlers.objectivesStore?.reset && typeof handlers.objectivesStore.reset === 'function') {
    handlers.objectivesStore.reset();
  }
  if (handlers.workPlanStore?.reset && typeof handlers.workPlanStore.reset === 'function') {
    handlers.workPlanStore.reset();
  }
  if (handlers.okrStore?.reset && typeof handlers.okrStore.reset === 'function') {
    handlers.okrStore.reset();
  }
  if (handlers.requestStore?.reset && typeof handlers.requestStore.reset === 'function') {
    handlers.requestStore.reset();
  }
  if (handlers.messagesStore?.reset && typeof handlers.messagesStore.reset === 'function') {
    handlers.messagesStore.reset();
  }
  if (handlers.calendarStore?.resetToDefaults && typeof handlers.calendarStore.resetToDefaults === 'function') {
    handlers.calendarStore.resetToDefaults();
  }
  if (handlers.capacityStore?.reset && typeof handlers.capacityStore.reset === 'function') {
    handlers.capacityStore.reset();
  }
  if (handlers.businessImprovementsStore?.reset && typeof handlers.businessImprovementsStore.reset === 'function') {
    handlers.businessImprovementsStore.reset();
  }
  if (handlers.integrationsStore?.reset && typeof handlers.integrationsStore.reset === 'function') {
    handlers.integrationsStore.reset();
  }
  if (handlers.leaderboardStore?.reset && typeof handlers.leaderboardStore.reset === 'function') {
    handlers.leaderboardStore.reset();
  }
  if (handlers.techTreeStore?.resetProgress && typeof handlers.techTreeStore.resetProgress === 'function') {
    handlers.techTreeStore.resetProgress();
  }

  // Wait for all async resets to complete
  await Promise.all(resetPromises);
}

/**
 * Main reset function - clears ALL company data
 *
 * @param storeHandlers - Optional store reset handlers for fine-grained control
 * @returns Debug report with details of what was cleared
 */
export async function resetAllCompanyData(
  storeHandlers?: StoreResetHandlers
): Promise<ResetDebugReport> {
  const report: ResetDebugReport = {
    timestamp: new Date().toISOString(),
    clearedAsyncStorageKeys: [],
    clearedMMKVKeys: [],
    persistedStoresCleared: [],
    totalItemsCleared: 0,
    errors: [],
  };

  if (__DEV__) {
    console.log('[Reset] 🔄 Starting comprehensive company data reset...');
  }

  try {
    // 1. Clear all Zustand persisted stores (MMKV)
    if (__DEV__) console.log('[Reset] Step 1: Clearing persisted Zustand stores...');
    report.clearedMMKVKeys = await clearPersistedStores();
    report.persistedStoresCleared = [...report.clearedMMKVKeys];

    // 2. Clear AsyncStorage company data (preserve auth)
    if (__DEV__) console.log('[Reset] Step 2: Clearing AsyncStorage company data...');
    report.clearedAsyncStorageKeys = await clearAsyncStorageCompanyData();

    // 3. Reset store instances (if provided)
    if (storeHandlers) {
      if (__DEV__) console.log('[Reset] Step 3: Resetting store instances...');
      await resetStoreInstances(storeHandlers);
    }

    // Calculate totals
    report.totalItemsCleared =
      report.clearedAsyncStorageKeys.length +
      report.clearedMMKVKeys.length;

    if (__DEV__) {
      console.log('[Reset] ✅ Reset complete!');
      console.log('[Reset] 📊 Summary:');
      console.log(`  - AsyncStorage keys cleared: ${report.clearedAsyncStorageKeys.length}`);
      console.log(`  - MMKV stores cleared: ${report.clearedMMKVKeys.length}`);
      console.log(`  - Total items cleared: ${report.totalItemsCleared}`);
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    report.errors.push(errorMessage);
    if (__DEV__) {
      console.error('[Reset] ❌ Reset failed:', error);
    }
  }

  return report;
}

/**
 * Get current data counts (for verification)
 * Returns counts of various data types to verify reset worked
 */
export async function getDataCounts(): Promise<{
  asyncStorageKeys: number;
  mmkvKeys: number;
  // Add more specific counts as needed
}> {
  let asyncCount = 0;
  let mmkvCount = 0;

  try {
    // Count AsyncStorage company keys
    for (const key of ASYNC_STORAGE_COMPANY_KEYS) {
      const value = await AsyncStorage.getItem(key);
      if (value !== null) {
        asyncCount++;
      }
    }

    // Count MMKV persisted stores
    for (const key of PERSISTED_STORE_KEYS) {
      if (mmkv.contains(key)) {
        mmkvCount++;
      }
    }
  } catch (error) {
    if (__DEV__) {
      console.error('[Reset] Failed to get data counts:', error);
    }
  }

  return {
    asyncStorageKeys: asyncCount,
    mmkvKeys: mmkvCount,
  };
}

/**
 * Format debug report for display
 */
export function formatDebugReport(report: ResetDebugReport): string {
  const lines: string[] = [
    '🔄 RESET DEBUG REPORT',
    `⏰ ${new Date(report.timestamp).toLocaleString()}`,
    '',
    '📦 AsyncStorage Keys Cleared:',
    ...report.clearedAsyncStorageKeys.map(key => `  ✅ ${key}`),
    '',
    '💾 MMKV Stores Cleared:',
    ...report.clearedMMKVKeys.map(key => `  ✅ ${key}`),
    '',
    `📊 Total Items Cleared: ${report.totalItemsCleared}`,
  ];

  if (report.errors.length > 0) {
    lines.push('');
    lines.push('❌ Errors:');
    lines.push(...report.errors.map(err => `  • ${err}`));
  }

  return lines.join('\n');
}
