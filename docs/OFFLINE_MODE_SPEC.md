# Offline Mode Specification

## Overview

CursorOS supports offline-first operation, allowing users to continue working without an internet connection. AI-dependent features gracefully degrade and queue operations for later processing.

## Architecture

### Core Components

1. **Storage (`lib/offline/storage.ts`)**
   - AsyncStorage-based persistence (works on iOS/Android/Web)
   - Collection-based organization
   - Automatic version tracking
   - Sync status tracking

2. **AI Outbox (`lib/offline/outbox.ts`)**
   - Job queue for AI operations
   - Priority-based processing
   - Retry logic with exponential backoff
   - Job status tracking

3. **Network Status (`lib/offline/network.ts`)**
   - Real-time online/offline detection
   - NetInfo integration
   - Event-based notifications

4. **Sync Manager (`lib/offline/sync.ts`)**
   - Automatic sync when online
   - Manual sync trigger
   - Job processors for each AI operation

## Offline Capabilities

### Fully Offline
- Manual task creation and editing
- Local task list viewing
- Cached marketplace data browsing
- Local journal/notes entry
- Scheduling (deterministic operations)

### Queued for Online
- Voice transcription (STT)
- Task extraction from text/voice
- WHY flow AI turns
- WHY flow synthesis
- Onboarding step generation

## User Interface

### Offline Banner
Shows when:
- Device is offline
- There are pending AI jobs

Banner states:
- **Offline mode** (amber): No internet connection
- **X pending** (blue): AI jobs waiting to process
- **Syncing...** (blue): Jobs being processed

### Pending AI Indicator
Small badge showing pending job count, can be added to:
- Navigation headers
- Tab icons
- Action buttons

## Job Flow

```
[User Action] → [Queue Job] → [Show Pending UI]
                    ↓
              [Go Online]
                    ↓
              [Process Job]
                    ↓
         [Update UI with Result]
```

## Collections

### task_drafts
Stores offline task drafts:
```typescript
interface OfflineTask {
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
```

### voice_recordings
Stores audio recordings awaiting transcription:
```typescript
interface OfflineVoiceRecording {
  id: string;
  audioBase64: string;
  mimeType: string;
  duration_seconds: number;
  transcript?: string;
  status: 'recorded' | 'transcribing' | 'transcribed' | 'failed';
  error?: string;
}
```

### journal_entries
Stores WHY flow entries:
```typescript
interface OfflineJournalEntry {
  id: string;
  content: string;
  type: 'why' | 'reflection' | 'brainstorm';
  conversation_id?: string;
  status: 'draft' | 'pending_ai' | 'completed';
}
```

## Job Types

| Type | Priority | Description |
|------|----------|-------------|
| transcription_whisper | 1 | OpenAI Whisper transcription |
| transcription_google | 1 | Google Speech-to-Text |
| task_extraction | 2 | Extract tasks from text |
| why_turn | 3 | WHY conversation turn |
| why_synthesize | 4 | Synthesize WHY into objectives |
| onboarding_generate | 5 | Generate onboarding outputs |

## API

### Storage
```typescript
// Create typed collection
const myCollection = createCollection<MyType>('my_collection');

// Store item
await myCollection.set('key', data);

// Get item
const item = await myCollection.get('key');

// Get all items
const items = await myCollection.getAll();

// Get unsynced items
const unsynced = await myCollection.getUnsynced();

// Mark as synced
await myCollection.markSynced('key');
```

### Outbox
```typescript
// Queue a job
const job = await queueTranscription(audioBase64, mimeType);

// Get pending jobs
const pending = await getPendingJobs();

// Get queue stats
const stats = await getQueueStats();
```

### Network
```typescript
// Check status
const online = isOnline();

// Subscribe to changes
const unsubscribe = onNetworkChange((online) => {
  console.log('Network:', online ? 'online' : 'offline');
});
```

### Sync
```typescript
// Start auto-sync
startAutoSync(30000); // Every 30 seconds

// Manual sync
await syncNow();

// Get sync state
const state = getSyncState();
```

## Initialization

Add to app root:

```typescript
import { startNetworkMonitoring, startAutoSync, initializeSyncManager } from '@/lib/offline';

useEffect(() => {
  startNetworkMonitoring();
  initializeSyncManager();
  startAutoSync();

  return () => {
    stopNetworkMonitoring();
    stopAutoSync();
  };
}, []);
```

## Error Handling

### Retry Logic
- Jobs retry up to 3 times by default
- Exponential backoff between retries
- Failed jobs are marked and can be manually retried

### Storage Errors
- Graceful degradation if storage unavailable
- Logged errors for debugging
- UI shows appropriate error states

## Testing

See OFFLINE_TEST_CHECKLIST.md for manual testing procedures.

## Future Improvements

1. **IndexedDB for Web**: Use IndexedDB directly on web for larger storage
2. **Background Sync**: Use service workers on web for true background sync
3. **Conflict Resolution**: Handle conflicts when syncing edited items
4. **Selective Sync**: Allow users to prioritize which jobs sync first
