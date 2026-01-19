/**
 * Offline Storage
 * IndexedDB wrapper for offline-first data persistence
 *
 * Provides a simple key-value store with collection support.
 * Works in both React Native (with AsyncStorage fallback) and web.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// =============================================================================
// TYPES
// =============================================================================

export interface StoredItem<T = unknown> {
  key: string;
  data: T;
  collection: string;
  created_at: string;
  updated_at: string;
  synced_at?: string;
  version: number;
}

export interface StorageOptions {
  collection: string;
}

// =============================================================================
// STORAGE KEY HELPERS
// =============================================================================

const STORAGE_PREFIX = '@centaur_offline:';
const COLLECTION_INDEX_KEY = `${STORAGE_PREFIX}__collections`;

function makeKey(collection: string, key: string): string {
  return `${STORAGE_PREFIX}${collection}:${key}`;
}

function parseKey(storageKey: string): { collection: string; key: string } | null {
  if (!storageKey.startsWith(STORAGE_PREFIX)) return null;
  const rest = storageKey.slice(STORAGE_PREFIX.length);
  if (rest.startsWith('__')) return null; // Internal keys
  const [collection, ...keyParts] = rest.split(':');
  return { collection, key: keyParts.join(':') };
}

// =============================================================================
// COLLECTION INDEX
// =============================================================================

async function getCollectionIndex(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(COLLECTION_INDEX_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw));
  } catch {
    return new Set();
  }
}

async function addToCollectionIndex(collection: string): Promise<void> {
  const index = await getCollectionIndex();
  if (!index.has(collection)) {
    index.add(collection);
    await AsyncStorage.setItem(COLLECTION_INDEX_KEY, JSON.stringify([...index]));
  }
}

// =============================================================================
// CORE STORAGE FUNCTIONS
// =============================================================================

/**
 * Store an item in offline storage
 */
export async function setItem<T>(
  key: string,
  data: T,
  options: StorageOptions
): Promise<StoredItem<T>> {
  const storageKey = makeKey(options.collection, key);
  const now = new Date().toISOString();

  // Check if item exists for version tracking
  let version = 1;
  try {
    const existing = await AsyncStorage.getItem(storageKey);
    if (existing) {
      const parsed = JSON.parse(existing) as StoredItem<T>;
      version = (parsed.version || 0) + 1;
    }
  } catch {
    // New item
  }

  const item: StoredItem<T> = {
    key,
    data,
    collection: options.collection,
    created_at: now,
    updated_at: now,
    version,
  };

  await AsyncStorage.setItem(storageKey, JSON.stringify(item));
  await addToCollectionIndex(options.collection);

  return item;
}

/**
 * Get an item from offline storage
 */
export async function getItem<T>(
  key: string,
  options: StorageOptions
): Promise<StoredItem<T> | null> {
  const storageKey = makeKey(options.collection, key);

  try {
    const raw = await AsyncStorage.getItem(storageKey);
    if (!raw) return null;
    return JSON.parse(raw) as StoredItem<T>;
  } catch (error) {
    console.error('[OfflineStorage] Failed to get item:', { key, error });
    return null;
  }
}

/**
 * Remove an item from offline storage
 */
export async function removeItem(
  key: string,
  options: StorageOptions
): Promise<boolean> {
  const storageKey = makeKey(options.collection, key);

  try {
    await AsyncStorage.removeItem(storageKey);
    return true;
  } catch (error) {
    console.error('[OfflineStorage] Failed to remove item:', { key, error });
    return false;
  }
}

/**
 * Get all items in a collection
 */
export async function getCollection<T>(
  collection: string
): Promise<StoredItem<T>[]> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const collectionPrefix = `${STORAGE_PREFIX}${collection}:`;
    const collectionKeys = allKeys.filter(k => k.startsWith(collectionPrefix));

    if (collectionKeys.length === 0) return [];

    const pairs = await AsyncStorage.multiGet(collectionKeys);
    const items: StoredItem<T>[] = [];

    for (const [_, value] of pairs) {
      if (value) {
        try {
          items.push(JSON.parse(value) as StoredItem<T>);
        } catch {
          // Skip invalid items
        }
      }
    }

    return items.sort((a, b) =>
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
  } catch (error) {
    console.error('[OfflineStorage] Failed to get collection:', { collection, error });
    return [];
  }
}

/**
 * Clear all items in a collection
 */
export async function clearCollection(collection: string): Promise<void> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const collectionPrefix = `${STORAGE_PREFIX}${collection}:`;
    const collectionKeys = allKeys.filter(k => k.startsWith(collectionPrefix));

    if (collectionKeys.length > 0) {
      await AsyncStorage.multiRemove(collectionKeys);
    }
  } catch (error) {
    console.error('[OfflineStorage] Failed to clear collection:', { collection, error });
  }
}

/**
 * Get unsynced items (no synced_at timestamp)
 */
export async function getUnsyncedItems<T>(
  collection: string
): Promise<StoredItem<T>[]> {
  const items = await getCollection<T>(collection);
  return items.filter(item => !item.synced_at);
}

/**
 * Mark an item as synced
 */
export async function markSynced(
  key: string,
  options: StorageOptions
): Promise<void> {
  const storageKey = makeKey(options.collection, key);

  try {
    const raw = await AsyncStorage.getItem(storageKey);
    if (!raw) return;

    const item = JSON.parse(raw) as StoredItem<unknown>;
    item.synced_at = new Date().toISOString();

    await AsyncStorage.setItem(storageKey, JSON.stringify(item));
  } catch (error) {
    console.error('[OfflineStorage] Failed to mark synced:', { key, error });
  }
}

// =============================================================================
// TYPED COLLECTION HELPERS
// =============================================================================

/**
 * Create a typed collection helper
 */
export function createCollection<T>(name: string) {
  return {
    set: (key: string, data: T) => setItem(key, data, { collection: name }),
    get: (key: string) => getItem<T>(key, { collection: name }),
    remove: (key: string) => removeItem(key, { collection: name }),
    getAll: () => getCollection<T>(name),
    getUnsynced: () => getUnsyncedItems<T>(name),
    markSynced: (key: string) => markSynced(key, { collection: name }),
    clear: () => clearCollection(name),
  };
}

// =============================================================================
// PREDEFINED COLLECTIONS
// =============================================================================

export interface OfflineTask {
  id: string;
  title: string;
  notes?: string;
  units: number;
  assignee_id?: string;
  due_iso?: string;
  start_iso?: string;
  status: 'draft' | 'pending' | 'confirmed';
  source: 'manual' | 'voice' | 'import';
}

export interface OfflineVoiceRecording {
  id: string;
  audioBase64: string;
  mimeType: string;
  duration_seconds: number;
  transcript?: string;
  status: 'recorded' | 'transcribing' | 'transcribed' | 'failed';
  error?: string;
}

export interface OfflineJournalEntry {
  id: string;
  content: string;
  type: 'why' | 'reflection' | 'brainstorm';
  conversation_id?: string;
  status: 'draft' | 'pending_ai' | 'completed';
}

// Pre-configured collections
export const taskDraftsCollection = createCollection<OfflineTask>('task_drafts');
export const voiceRecordingsCollection = createCollection<OfflineVoiceRecording>('voice_recordings');
export const journalEntriesCollection = createCollection<OfflineJournalEntry>('journal_entries');

// =============================================================================
// STORAGE INFO
// =============================================================================

export async function getStorageInfo(): Promise<{
  collections: string[];
  totalItems: number;
  unsyncedItems: number;
}> {
  const collections = await getCollectionIndex();
  let totalItems = 0;
  let unsyncedItems = 0;

  for (const collection of collections) {
    const items = await getCollection(collection);
    totalItems += items.length;
    unsyncedItems += items.filter(i => !i.synced_at).length;
  }

  return {
    collections: [...collections],
    totalItems,
    unsyncedItems,
  };
}
