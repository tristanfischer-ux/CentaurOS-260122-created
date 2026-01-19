/**
 * Freshness System - Public API
 *
 * Re-exports the main components of the freshness system.
 */

// Types
export type {
  OrgType,
  FreshnessPolicy,
  FreshnessJob,
  FreshnessCheck,
  FreshnessReviewItem,
  JobConfig,
  JobStats,
  EntityType,
  CheckOutcome,
  ChangeType,
  ReviewStatus,
  ReviewPriority,
  ExtractedData,
  ExtractedContact,
  DiffResult,
  DiffChange,
  FetchOptions,
  FetchResult,
  FreshnessStats,
  StaleEntity,
  FreshnessTaskDraft,
} from './types';

// Fetch utilities
export {
  fetchUrl,
  batchFetch,
  extractDomain,
  normalizeHtml,
  hashContent,
  checkRobotsAllowed,
} from './fetch';

// Extractors
export {
  extractDataFromHtml,
  extractEmails,
  extractLinkedIn,
  hasContactForm,
  extractPortfolio,
  extractLawPracticeAreas,
  extractAccountancyServices,
  extractManufacturingCapabilities,
  extractManufacturingCertifications,
  extractAIToolCategories,
  findMatchingKeywords,
  hashExtractedData,
} from './extractors';

// Diff engine
export {
  computeDiff,
  determineChangeType,
  shouldReduceConfidence,
  generateChangeSummary,
} from './diff';
export type { DbRecord } from './diff';

// Runner
export {
  runFreshnessJob,
} from './runner';
export type { RunJobOptions, RunJobResult } from './runner';
