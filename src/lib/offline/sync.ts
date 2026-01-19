/**
 * Sync Manager
 * Processes queued AI jobs when online
 */

import {
  getPendingJobs,
  getNextJob,
  updateJobStatus,
  completeJob,
  failJob,
  clearOldJobs,
  type OutboxJob,
  type TranscriptionPayload,
  type TaskExtractionPayload,
  type WhyTurnPayload,
  type WhySynthesizePayload,
} from './outbox';
import { isOnline, onNetworkChange } from './network';

// =============================================================================
// TYPES
// =============================================================================

export interface SyncState {
  isSyncing: boolean;
  lastSyncAt: string | null;
  pendingCount: number;
  error: string | null;
}

// =============================================================================
// STATE
// =============================================================================

let syncState: SyncState = {
  isSyncing: false,
  lastSyncAt: null,
  pendingCount: 0,
  error: null,
};

const syncListeners: Set<(state: SyncState) => void> = new Set();

function notifySyncListeners(): void {
  for (const listener of syncListeners) {
    try {
      listener(syncState);
    } catch (error) {
      console.error('[SyncManager] Listener error:', error);
    }
  }
}

// =============================================================================
// JOB PROCESSORS
// =============================================================================

type JobProcessor<TPayload, TResult> = (payload: TPayload) => Promise<TResult>;

const processors: Partial<Record<string, JobProcessor<any, any>>> = {
  transcription_whisper: async (payload: TranscriptionPayload) => {
    const response = await fetch('/api/transcribe/whisper', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audioBase64: payload.audioBase64,
        mimeType: payload.mimeType,
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Transcription failed');
    return data;
  },

  transcription_google: async (payload: TranscriptionPayload) => {
    const response = await fetch('/api/transcribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audioBase64: payload.audioBase64,
        mimeType: payload.mimeType,
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Transcription failed');
    return data;
  },

  task_extraction: async (payload: TaskExtractionPayload) => {
    const response = await fetch('/api/ai/extract-tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Task extraction failed');
    return data;
  },

  why_turn: async (payload: WhyTurnPayload) => {
    const response = await fetch('/api/why/turn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'WHY turn failed');
    return data;
  },

  why_synthesize: async (payload: WhySynthesizePayload) => {
    const response = await fetch('/api/why/synthesize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'WHY synthesize failed');
    return data;
  },
};

// =============================================================================
// SYNC LOGIC
// =============================================================================

/**
 * Process a single job
 */
async function processJob(job: OutboxJob): Promise<void> {
  const processor = processors[job.type];
  if (!processor) {
    console.warn('[SyncManager] No processor for job type:', job.type);
    await failJob(job.id, `No processor for type: ${job.type}`, false);
    return;
  }

  try {
    await updateJobStatus(job.id, 'processing');
    const result = await processor(job.payload);
    await completeJob(job.id, result);
    console.log('[SyncManager] Job completed:', job.id);
  } catch (error: any) {
    console.error('[SyncManager] Job failed:', job.id, error);
    await failJob(job.id, error.message || 'Unknown error');
  }
}

/**
 * Process all pending jobs
 */
async function processPendingJobs(): Promise<void> {
  if (!isOnline()) {
    console.log('[SyncManager] Offline, skipping sync');
    return;
  }

  if (syncState.isSyncing) {
    console.log('[SyncManager] Already syncing');
    return;
  }

  syncState.isSyncing = true;
  syncState.error = null;
  notifySyncListeners();

  try {
    let job = await getNextJob();
    let processed = 0;

    while (job && isOnline()) {
      await processJob(job);
      processed++;

      // Update pending count
      const pending = await getPendingJobs();
      syncState.pendingCount = pending.length;
      notifySyncListeners();

      // Get next job
      job = await getNextJob();

      // Small delay between jobs to prevent rate limiting
      if (job) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    syncState.lastSyncAt = new Date().toISOString();
    console.log('[SyncManager] Sync complete, processed:', processed);
  } catch (error: any) {
    syncState.error = error.message || 'Sync failed';
    console.error('[SyncManager] Sync error:', error);
  } finally {
    syncState.isSyncing = false;
    notifySyncListeners();
  }
}

// =============================================================================
// AUTO-SYNC
// =============================================================================

let syncInterval: ReturnType<typeof setInterval> | null = null;
let networkUnsubscribe: (() => void) | null = null;

/**
 * Start auto-sync when online
 */
export function startAutoSync(intervalMs: number = 30000): void {
  if (syncInterval) return; // Already running

  // Process immediately when coming online
  networkUnsubscribe = onNetworkChange((online) => {
    if (online) {
      console.log('[SyncManager] Back online, starting sync');
      processPendingJobs();
    }
  });

  // Periodic sync
  syncInterval = setInterval(() => {
    if (isOnline()) {
      processPendingJobs();
    }
  }, intervalMs);

  // Initial sync
  if (isOnline()) {
    processPendingJobs();
  }

  console.log('[SyncManager] Auto-sync started');
}

/**
 * Stop auto-sync
 */
export function stopAutoSync(): void {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
  if (networkUnsubscribe) {
    networkUnsubscribe();
    networkUnsubscribe = null;
  }
  console.log('[SyncManager] Auto-sync stopped');
}

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Trigger manual sync
 */
export async function syncNow(): Promise<void> {
  await processPendingJobs();
}

/**
 * Get current sync state
 */
export function getSyncState(): SyncState {
  return { ...syncState };
}

/**
 * Subscribe to sync state changes
 */
export function onSyncStateChange(
  callback: (state: SyncState) => void
): () => void {
  syncListeners.add(callback);
  return () => {
    syncListeners.delete(callback);
  };
}

/**
 * Initialize sync manager
 */
export async function initializeSyncManager(): Promise<void> {
  // Clean up old jobs
  await clearOldJobs(7);

  // Get initial pending count
  const pending = await getPendingJobs();
  syncState.pendingCount = pending.length;
  notifySyncListeners();

  console.log('[SyncManager] Initialized, pending jobs:', pending.length);
}
