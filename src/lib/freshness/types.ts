/**
 * Freshness System Types
 *
 * Type definitions for the marketplace data freshness verification system.
 */

// ============================================================================
// POLICY TYPES
// ============================================================================

export type OrgType =
  | 'VC'
  | 'PE'
  | 'Angel'
  | 'LawFirm'
  | 'Accountancy'
  | 'Manufacturer'
  | 'AITool'
  | 'Advisor'
  | 'external';

export interface FreshnessPolicy {
  id: string;
  org_type: OrgType;
  default_frequency_days: number;
  stale_after_days: number;
  max_urls_per_run: number;
  max_requests_per_minute: number;
  priority: number;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// JOB TYPES
// ============================================================================

export type JobScope = 'curated' | 'external' | 'all';
export type JobType = 'scheduled' | 'manual' | 'triggered';
export type JobFrequency = 'daily' | 'weekly' | 'monthly' | 'adhoc';
export type JobStatus = 'scheduled' | 'running' | 'done' | 'failed' | 'cancelled';

export interface FreshnessJob {
  id: string;
  scope: JobScope;
  job_type: JobType;
  frequency: JobFrequency;
  status: JobStatus;
  scheduled_for: string | null;
  started_at: string | null;
  finished_at: string | null;
  entities_checked: number;
  urls_fetched: number;
  changes_detected: number;
  review_items_created: number;
  errors_count: number;
  stats_json: JobStats;
  config_json: JobConfig;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface JobStats {
  by_org_type?: Record<string, number>;
  by_outcome?: Record<string, number>;
  duration_ms?: number;
  avg_response_time_ms?: number;
}

export interface JobConfig {
  max_urls?: number;
  rate_limit?: number;
  org_types?: OrgType[];
  skip_cached?: boolean;
  llm_assist?: boolean;
}

// ============================================================================
// CHECK TYPES
// ============================================================================

export type EntityType = 'org' | 'person' | 'tool' | 'manufacturer' | 'startup' | 'external';
export type UrlType = 'primary' | 'portfolio' | 'team' | 'about' | 'contact';
export type CheckOutcome = 'pending' | 'no_change' | 'changed' | 'error' | 'blocked' | 'timeout' | 'not_found';

export interface FreshnessCheck {
  id: string;
  job_id: string | null;
  entity_type: EntityType;
  entity_id: string;
  entity_name: string | null;
  url: string;
  url_type: UrlType;
  fetched_at: string | null;
  http_status: number | null;
  response_time_ms: number | null;
  etag: string | null;
  last_modified: string | null;
  content_hash: string | null;
  content_length: number | null;
  extract_json: ExtractedData | null;
  diff_json: DiffResult | null;
  confidence_score: number;
  outcome: CheckOutcome;
  error_text: string | null;
  retry_count: number;
  created_at: string;
}

export interface ExtractedData {
  tags?: string[];
  contacts?: ExtractedContact[];
  portfolio?: string[];
  keywords?: string[];
  practice_areas?: string[];
  certifications?: string[];
  capabilities?: string[];
  last_updated?: string;
  raw_snippet?: string;
}

export interface ExtractedContact {
  type: 'email' | 'phone' | 'linkedin' | 'contact_form';
  value: string;
  context?: string;
}

// ============================================================================
// DIFF TYPES
// ============================================================================

export interface DiffResult {
  has_changes: boolean;
  changes: DiffChange[];
  summary: string;
  confidence: number;
}

export interface DiffChange {
  field: string;
  change_type: 'added' | 'removed' | 'modified';
  old_value: unknown;
  new_value: unknown;
  confidence: number;
}

// ============================================================================
// REVIEW QUEUE TYPES
// ============================================================================

export type ChangeType =
  | 'contact_changed'
  | 'tags_changed'
  | 'portfolio_changed'
  | 'content_changed'
  | 'not_found'
  | 'needs_verification'
  | 'confidence_dropped';

export type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'merged' | 'deferred';
export type ReviewPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface FreshnessReviewItem {
  id: string;
  entity_type: EntityType;
  entity_id: string;
  entity_name: string;
  check_id: string | null;
  job_id: string | null;
  change_type: ChangeType;
  change_summary: string;
  proposed_changes_json: ProposedChanges;
  evidence_url: string | null;
  evidence_snapshot: string | null;
  confidence_score: number;
  status: ReviewStatus;
  priority: ReviewPriority;
  reviewer_user_id: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  task_draft_id: string | null;
  task_draft_created_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProposedChanges {
  [field: string]: {
    old: unknown;
    new: unknown;
    confidence: number;
  };
}

// ============================================================================
// URL CACHE TYPES
// ============================================================================

export interface UrlCacheEntry {
  id: string;
  url: string;
  url_domain: string;
  last_fetched_at: string;
  last_status: number | null;
  last_etag: string | null;
  last_modified: string | null;
  content_hash: string | null;
  content_length: number | null;
  fetch_count: number;
  consecutive_errors: number;
  robots_blocked: boolean;
  robots_checked_at: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// FETCH TYPES
// ============================================================================

export interface FetchOptions {
  timeout_ms?: number;
  use_cache?: boolean;
  conditional?: boolean;
  etag?: string;
  last_modified?: string;
}

export interface FetchResult {
  success: boolean;
  status: number;
  etag: string | null;
  last_modified: string | null;
  content: string | null;
  content_hash: string | null;
  content_length: number;
  response_time_ms: number;
  from_cache: boolean;
  not_modified: boolean;
  error: string | null;
}

// ============================================================================
// STATS TYPES
// ============================================================================

export interface FreshnessStats {
  org_type: string;
  total_count: number;
  fresh_count: number;
  stale_count: number;
  unknown_count: number;
  pending_reviews: number;
  avg_confidence: number;
}

export interface StaleEntity {
  entity_id: string;
  entity_type: EntityType;
  entity_name: string;
  website: string;
  last_verified_at: string | null;
  days_since_verified: number;
  confidence_score: number;
}

// ============================================================================
// TASK DRAFT TYPES (for integration with existing system)
// ============================================================================

export interface FreshnessTaskDraft {
  workspace_id: string;
  created_by_user_id: string;
  assignee_user_id: string;
  title: string;
  notes: string;
  start_iso: string;
  due_iso: string | null;
  units: number;
  source: 'freshness_review';
  confidence_assignee: number;
  confidence_due: number | null;
  status: 'pending_confirmation';
  metadata_json?: {
    review_id: string;
    entity_type: EntityType;
    entity_id: string;
    change_type: ChangeType;
  };
}
