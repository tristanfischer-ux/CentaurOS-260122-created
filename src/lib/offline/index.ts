/**
 * Offline Module
 * Exports all offline functionality
 */

// Storage
export {
  setItem,
  getItem,
  removeItem,
  getCollection,
  clearCollection,
  getUnsyncedItems,
  markSynced,
  createCollection,
  getStorageInfo,
  taskDraftsCollection,
  voiceRecordingsCollection,
  journalEntriesCollection,
  type StoredItem,
  type StorageOptions,
  type OfflineTask,
  type OfflineVoiceRecording,
  type OfflineJournalEntry,
} from './storage';

// Outbox
export {
  queueJob,
  getJob,
  updateJobStatus,
  completeJob,
  failJob,
  cancelJob,
  removeJob,
  getPendingJobs,
  getJobsByType,
  getNextJob,
  getQueueStats,
  clearOldJobs,
  queueTranscription,
  queueTaskExtraction,
  queueWhyTurn,
  queueWhySynthesize,
  outboxCollection,
  type JobType,
  type JobStatus,
  type OutboxJob,
  type TranscriptionPayload,
  type TaskExtractionPayload,
  type WhyTurnPayload,
  type WhySynthesizePayload,
} from './outbox';

// Network
export {
  startNetworkMonitoring,
  stopNetworkMonitoring,
  onNetworkChange,
  checkNetworkStatus,
  isOnline,
  useNetworkStatus,
  useNetworkStore,
  type NetworkState,
} from './network';

// Sync
export {
  startAutoSync,
  stopAutoSync,
  syncNow,
  getSyncState,
  onSyncStateChange,
  initializeSyncManager,
  type SyncState,
} from './sync';
