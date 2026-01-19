/**
 * Portfolio Refresh System - Types
 *
 * Type definitions for the portfolio relationship refresh system.
 */

// ============================================================================
// PORTFOLIO PAGE TYPES
// ============================================================================

export type DiscoveryMethod = 'manual' | 'auto' | 'evidence';
export type ExtractionQuality = 'high' | 'medium' | 'low' | 'uncertain' | 'unknown';
export type PortfolioCompanyStatus = 'active' | 'removed_pending_review' | 'removed' | 'exited' | 'acquired' | 'unknown';
export type ChangeSetStatus = 'pending' | 'approved' | 'rejected' | 'merged' | 'deferred';

export interface PortfolioPage {
  id: string;
  investor_org_id: string;
  portfolio_url: string;
  portfolio_url_domain: string | null;
  discovery_method: DiscoveryMethod;
  discovered_at: string;
  last_checked_at: string | null;
  last_content_hash: string | null;
  last_http_status: number | null;
  last_etag: string | null;
  last_modified: string | null;
  confidence_score: number;
  extraction_quality: ExtractionQuality;
  extraction_notes: string | null;
  is_primary: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// PORTFOLIO COMPANY TYPES
// ============================================================================

export interface PortfolioCompany {
  id: string;
  investor_org_id: string;
  company_name: string;
  company_name_normalized: string;
  company_website: string | null;
  company_domain: string | null;
  company_logo_url: string | null;
  source_portfolio_page_id: string | null;
  source_portfolio_url: string | null;
  source_href: string | null;
  matched_startup_id: string | null;
  match_confidence: number | null;
  status: PortfolioCompanyStatus;
  first_seen_at: string;
  last_seen_at: string;
  removed_at: string | null;
  confidence_score: number;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// EXTRACTED COMPANY (from HTML)
// ============================================================================

export interface ExtractedCompany {
  name: string;
  name_normalized: string;
  website: string | null;
  domain: string | null;
  href: string | null;
  logo_url: string | null;
  context: string | null; // surrounding text
}

export interface ExtractionResult {
  companies: ExtractedCompany[];
  quality: ExtractionQuality;
  confidence: number;
  notes: string | null;
  is_paginated: boolean;
  is_js_heavy: boolean;
  extraction_method: 'deterministic' | 'llm_assisted';
}

// ============================================================================
// CHANGE SET TYPES
// ============================================================================

export interface AddedCompany {
  name: string;
  name_normalized: string;
  website: string | null;
  domain: string | null;
  href: string | null;
}

export interface RemovedCompany {
  id: string;
  name: string;
  domain: string | null;
  last_seen_at: string;
}

export interface RenamedCompany {
  id: string;
  old_name: string;
  new_name: string;
  domain: string | null;
  confidence: number;
}

export interface PortfolioChangeSet {
  id: string;
  investor_org_id: string;
  investor_org_name: string;
  portfolio_page_id: string | null;
  portfolio_url: string;
  detected_at: string;
  job_id: string | null;
  check_id: string | null;
  added_companies_json: AddedCompany[];
  removed_companies_json: RemovedCompany[];
  renamed_companies_json: RenamedCompany[];
  unchanged_count: number;
  extraction_quality: ExtractionQuality;
  confidence_score: number;
  notes: string | null;
  review_queue_id: string | null;
  task_draft_id: string | null;
  status: ChangeSetStatus;
  reviewed_by_user_id: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// DIFF RESULT
// ============================================================================

export interface PortfolioDiffResult {
  added: AddedCompany[];
  removed: RemovedCompany[];
  renamed: RenamedCompany[];
  unchanged: string[]; // company IDs
  quality: ExtractionQuality;
  confidence: number;
  has_changes: boolean;
  notes: string[];
}

// ============================================================================
// STALE INVESTOR (from DB function)
// ============================================================================

export interface StaleInvestor {
  investor_org_id: string;
  investor_name: string;
  org_type: string;
  website: string;
  portfolio_url: string | null;
  last_checked_at: string | null;
  days_since_checked: number;
}

// ============================================================================
// PORTFOLIO STATS
// ============================================================================

export interface PortfolioStats {
  total_investors: number;
  investors_with_portfolios: number;
  total_portfolio_companies: number;
  active_companies: number;
  pending_changes: number;
  avg_confidence: number;
}

// ============================================================================
// JOB OPTIONS
// ============================================================================

export interface PortfolioRefreshOptions {
  maxInvestors?: number;
  rateLimit?: number;
  dryRun?: boolean;
  llmAssist?: boolean;
  orgTypes?: string[];
  workspaceId?: string;
  userId?: string;
}

export interface PortfolioRefreshResult {
  jobId: string | null;
  success: boolean;
  investorsChecked: number;
  pagesChecked: number;
  changeSetsCreated: number;
  errorsCount: number;
  duration_ms: number;
  error?: string;
}
