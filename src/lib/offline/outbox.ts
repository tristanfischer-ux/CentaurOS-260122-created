/**
 * AI Outbox
 * Job queue for offline AI operations
 *
 * Queues AI operations (transcription, task extraction, WHY turns) when offline
 * and processes them when back online.
 */

import { createCollection, type StoredItem } from './storage';

// =============================================================================
// TYPES
// =============================================================================

export type JobType =
  | 'transcription_whisper'
  | 'transcription_google'
  | 'task_extraction'
  | 'why_turn'
  | 'why_synthesize'
  | 'onboarding_generate';

export type JobStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface OutboxJob<TPayload = unknown, TResult = unknown> {
  id: string;
  type: JobType;
  payload: TPayload;
  status: JobStatus;
  priority: number; // Lower = higher priority
  retry_count: number;
  max_retries: number;
  error?: string;
  result?: TResult;
  created_at: string;
  updated_at: string;
  started_at?: string;
  completed_at?: string;
}

// Job payloads
export interface TranscriptionPayload {
  audioBase64: string;
  mimeType: string;
  recording_id?: string;
}

export interface TaskExtractionPayload {
  inputText: string;
  source: 'voice' | 'text';
}

export interface WhyTurnPayload {
  conversation_id: string;
  user_message: string;
  context?: string;
}

export interface WhySynthesizePayload {
  conversation_id: string;
  messages: { role: string; content: string }[];
}

// =============================================================================
// OUTBOX COLLECTION
// =============================================================================

const outboxCollection = createCollection<OutboxJob>('ai_outbox');

// =============================================================================
// JOB MANAGEMENT
// =============================================================================

/**
 * Generate unique job ID
 */
function generateJobId(): string {
  return `job_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Queue a new job
 */
export async function queueJob<TPayload>(
  type: JobType,
  payload: TPayload,
  options: {
    priority?: number;
    max_retries?: number;
  } = {}
): Promise<OutboxJob<TPayload>> {
  const id = generateJobId();
  const now = new Date().toISOString();

  const job: OutboxJob<TPayload> = {
    id,
    type,
    payload,
    status: 'pending',
    priority: options.priority ?? 5,
    retry_count: 0,
    max_retries: options.max_retries ?? 3,
    created_at: now,
    updated_at: now,
  };

  await outboxCollection.set(id, job as OutboxJob);
  console.log('[AIOutbox] Job queued:', { id, type });

  return job;
}

/**
 * Get a job by ID
 */
export async function getJob(id: string): Promise<OutboxJob | null> {
  const stored = await outboxCollection.get(id);
  return stored?.data ?? null;
}

/**
 * Update job status
 */
export async function updateJobStatus(
  id: string,
  status: JobStatus,
  extras?: Partial<OutboxJob>
): Promise<void> {
  const stored = await outboxCollection.get(id);
  if (!stored) return;

  const job = stored.data;
  job.status = status;
  job.updated_at = new Date().toISOString();

  if (status === 'processing' && !job.started_at) {
    job.started_at = job.updated_at;
  }
  if (status === 'completed' || status === 'failed') {
    job.completed_at = job.updated_at;
  }

  Object.assign(job, extras);
  await outboxCollection.set(id, job);

  console.log('[AIOutbox] Job status updated:', { id, status });
}

/**
 * Mark job as completed with result
 */
export async function completeJob<TResult>(
  id: string,
  result: TResult
): Promise<void> {
  await updateJobStatus(id, 'completed', { result });
}

/**
 * Mark job as failed
 */
export async function failJob(
  id: string,
  error: string,
  retry: boolean = true
): Promise<void> {
  const stored = await outboxCollection.get(id);
  if (!stored) return;

  const job = stored.data;

  if (retry && job.retry_count < job.max_retries) {
    // Increment retry and set back to pending
    await updateJobStatus(id, 'pending', {
      retry_count: job.retry_count + 1,
      error,
    });
    console.log('[AIOutbox] Job will retry:', { id, retryCount: job.retry_count + 1 });
  } else {
    // Max retries reached
    await updateJobStatus(id, 'failed', { error });
    console.log('[AIOutbox] Job failed permanently:', { id, error });
  }
}

/**
 * Cancel a job
 */
export async function cancelJob(id: string): Promise<void> {
  await updateJobStatus(id, 'cancelled');
}

/**
 * Remove a job from the queue
 */
export async function removeJob(id: string): Promise<void> {
  await outboxCollection.remove(id);
  console.log('[AIOutbox] Job removed:', { id });
}

// =============================================================================
// QUEUE OPERATIONS
// =============================================================================

/**
 * Get all pending jobs sorted by priority
 */
export async function getPendingJobs(): Promise<OutboxJob[]> {
  const allItems = await outboxCollection.getAll();
  return allItems
    .map(item => item.data)
    .filter(job => job.status === 'pending')
    .sort((a, b) => {
      // Sort by priority first, then by created_at
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
}

/**
 * Get jobs by type
 */
export async function getJobsByType(type: JobType): Promise<OutboxJob[]> {
  const allItems = await outboxCollection.getAll();
  return allItems
    .map(item => item.data)
    .filter(job => job.type === type);
}

/**
 * Get the next job to process
 */
export async function getNextJob(): Promise<OutboxJob | null> {
  const pending = await getPendingJobs();
  return pending[0] ?? null;
}

/**
 * Get queue statistics
 */
export async function getQueueStats(): Promise<{
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  total: number;
  byType: Record<JobType, number>;
}> {
  const allItems = await outboxCollection.getAll();
  const jobs = allItems.map(item => item.data);

  const stats = {
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    total: jobs.length,
    byType: {} as Record<JobType, number>,
  };

  for (const job of jobs) {
    if (job.status === 'pending') stats.pending++;
    if (job.status === 'processing') stats.processing++;
    if (job.status === 'completed') stats.completed++;
    if (job.status === 'failed') stats.failed++;

    stats.byType[job.type] = (stats.byType[job.type] || 0) + 1;
  }

  return stats;
}

/**
 * Clear completed jobs older than a certain age
 */
export async function clearOldJobs(maxAgeDays: number = 7): Promise<number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - maxAgeDays);

  const allItems = await outboxCollection.getAll();
  let removed = 0;

  for (const item of allItems) {
    const job = item.data;
    if (
      (job.status === 'completed' || job.status === 'cancelled') &&
      new Date(job.updated_at) < cutoff
    ) {
      await outboxCollection.remove(job.id);
      removed++;
    }
  }

  console.log('[AIOutbox] Cleared old jobs:', { removed });
  return removed;
}

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Queue a transcription job
 */
export async function queueTranscription(
  audioBase64: string,
  mimeType: string,
  recording_id?: string
): Promise<OutboxJob<TranscriptionPayload>> {
  return queueJob<TranscriptionPayload>('transcription_whisper', {
    audioBase64,
    mimeType,
    recording_id,
  }, { priority: 1 }); // High priority
}

/**
 * Queue a task extraction job
 */
export async function queueTaskExtraction(
  inputText: string,
  source: 'voice' | 'text'
): Promise<OutboxJob<TaskExtractionPayload>> {
  return queueJob<TaskExtractionPayload>('task_extraction', {
    inputText,
    source,
  }, { priority: 2 });
}

/**
 * Queue a WHY turn job
 */
export async function queueWhyTurn(
  conversation_id: string,
  user_message: string,
  context?: string
): Promise<OutboxJob<WhyTurnPayload>> {
  return queueJob<WhyTurnPayload>('why_turn', {
    conversation_id,
    user_message,
    context,
  }, { priority: 3 });
}

/**
 * Queue a WHY synthesize job
 */
export async function queueWhySynthesize(
  conversation_id: string,
  messages: { role: string; content: string }[]
): Promise<OutboxJob<WhySynthesizePayload>> {
  return queueJob<WhySynthesizePayload>('why_synthesize', {
    conversation_id,
    messages,
  }, { priority: 4 });
}

// =============================================================================
// EXPORT
// =============================================================================

export { outboxCollection };
