/**
 * Freshness System - Diff Engine
 *
 * Compares current DB record vs extracted data to detect changes.
 * Produces structured diffs for review queue.
 *
 * RULES:
 * - Never auto-apply changes to curated data
 * - All changes go to review queue
 * - Confidence scores indicate certainty of change
 */

import type {
  DiffResult,
  DiffChange,
  ExtractedData,
  ExtractedContact,
  ChangeType,
  OrgType,
} from './types';

// ============================================================================
// CONFIGURATION
// ============================================================================

// Minimum changes required to flag as "changed"
const MIN_TAGS_CHANGED = 2;
const MIN_CONTACTS_CHANGED = 1;
const MIN_PORTFOLIO_CHANGED = 3;

// Confidence thresholds
const HIGH_CONFIDENCE = 80;
const MEDIUM_CONFIDENCE = 60;
const LOW_CONFIDENCE = 40;

// ============================================================================
// ARRAY COMPARISON UTILITIES
// ============================================================================

/**
 * Compare two arrays and return added/removed items
 */
function compareArrays<T>(
  oldArray: T[],
  newArray: T[],
  normalizer: (item: T) => string = (item) => String(item)
): { added: T[]; removed: T[]; unchanged: T[] } {
  const oldSet = new Set(oldArray.map(normalizer));
  const newSet = new Set(newArray.map(normalizer));

  const added = newArray.filter((item) => !oldSet.has(normalizer(item)));
  const removed = oldArray.filter((item) => !newSet.has(normalizer(item)));
  const unchanged = oldArray.filter((item) => newSet.has(normalizer(item)));

  return { added, removed, unchanged };
}

/**
 * Calculate similarity between two arrays (0-1)
 */
function arraySimilarity<T>(
  oldArray: T[],
  newArray: T[],
  normalizer: (item: T) => string = (item) => String(item)
): number {
  if (oldArray.length === 0 && newArray.length === 0) return 1;
  if (oldArray.length === 0 || newArray.length === 0) return 0;

  const { unchanged } = compareArrays(oldArray, newArray, normalizer);
  const totalUnique = new Set([...oldArray.map(normalizer), ...newArray.map(normalizer)]).size;

  return unchanged.length / totalUnique;
}

// ============================================================================
// CONTACT COMPARISON
// ============================================================================

interface DbContact {
  contact_type: 'email' | 'phone' | 'contact_form' | 'linkedin';
  contact_value: string;
  is_primary?: boolean;
}

/**
 * Compare extracted contacts vs database contacts
 */
function compareContacts(
  dbContacts: DbContact[],
  extractedContacts: ExtractedContact[]
): DiffChange[] {
  const changes: DiffChange[] = [];

  // Normalize for comparison
  const normalizeContact = (c: DbContact | ExtractedContact): string => {
    const type = 'contact_type' in c ? c.contact_type : c.type;
    const value = 'contact_value' in c ? c.contact_value : c.value;
    return `${type}:${value.toLowerCase()}`;
  };

  const dbNormalized = dbContacts.map((c) => ({
    type: c.contact_type,
    value: c.contact_value.toLowerCase(),
    normalized: normalizeContact(c),
  }));

  const extractedNormalized = extractedContacts.map((c) => ({
    type: c.type,
    value: c.value.toLowerCase(),
    normalized: normalizeContact({
      contact_type: c.type,
      contact_value: c.value,
    } as DbContact),
  }));

  // Find added contacts
  const dbSet = new Set(dbNormalized.map((c) => c.normalized));
  for (const contact of extractedNormalized) {
    if (!dbSet.has(contact.normalized)) {
      changes.push({
        field: `contact.${contact.type}`,
        change_type: 'added',
        old_value: null,
        new_value: contact.value,
        confidence: contact.type === 'email' ? HIGH_CONFIDENCE : MEDIUM_CONFIDENCE,
      });
    }
  }

  // Find removed contacts (emails that were on page but no longer are)
  const extractedSet = new Set(extractedNormalized.map((c) => c.normalized));
  for (const contact of dbNormalized) {
    // Only flag email removals as significant
    if (contact.type === 'email' && !extractedSet.has(contact.normalized)) {
      changes.push({
        field: `contact.${contact.type}`,
        change_type: 'removed',
        old_value: contact.value,
        new_value: null,
        confidence: MEDIUM_CONFIDENCE, // Email might just not be on this page
      });
    }
  }

  return changes;
}

// ============================================================================
// TAG COMPARISON
// ============================================================================

/**
 * Compare extracted tags vs database tags
 */
function compareTags(dbTags: string[], extractedTags: string[]): DiffChange[] {
  const changes: DiffChange[] = [];

  // Normalize tags
  const normalize = (tag: string) => tag.toLowerCase().replace(/[^a-z0-9_]/g, '');
  const { added, removed } = compareArrays(dbTags, extractedTags, normalize);

  if (added.length >= MIN_TAGS_CHANGED) {
    changes.push({
      field: 'tags',
      change_type: 'added',
      old_value: null,
      new_value: added,
      confidence: added.length >= 5 ? HIGH_CONFIDENCE : MEDIUM_CONFIDENCE,
    });
  }

  if (removed.length >= MIN_TAGS_CHANGED) {
    changes.push({
      field: 'tags',
      change_type: 'removed',
      old_value: removed,
      new_value: null,
      confidence: LOW_CONFIDENCE, // Tags missing might be page-specific
    });
  }

  return changes;
}

// ============================================================================
// PORTFOLIO COMPARISON (VC/PE)
// ============================================================================

/**
 * Compare extracted portfolio vs known portfolio
 */
function comparePortfolio(dbPortfolio: string[], extractedPortfolio: string[]): DiffChange[] {
  const changes: DiffChange[] = [];

  const normalize = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '');
  const { added, removed } = compareArrays(dbPortfolio, extractedPortfolio, normalize);

  if (added.length >= MIN_PORTFOLIO_CHANGED) {
    changes.push({
      field: 'portfolio',
      change_type: 'added',
      old_value: null,
      new_value: added.slice(0, 20), // Limit for readability
      confidence: added.length >= 10 ? HIGH_CONFIDENCE : MEDIUM_CONFIDENCE,
    });
  }

  if (removed.length >= MIN_PORTFOLIO_CHANGED) {
    changes.push({
      field: 'portfolio',
      change_type: 'removed',
      old_value: removed.slice(0, 20),
      new_value: null,
      confidence: LOW_CONFIDENCE, // Might be page layout change
    });
  }

  return changes;
}

// ============================================================================
// CAPABILITY COMPARISON (Manufacturers)
// ============================================================================

/**
 * Compare manufacturing capabilities
 */
function compareCapabilities(dbCaps: string[], extractedCaps: string[]): DiffChange[] {
  const changes: DiffChange[] = [];

  const normalize = (cap: string) => cap.toLowerCase().replace(/[^a-z0-9]/g, '');
  const { added, removed } = compareArrays(dbCaps, extractedCaps, normalize);

  if (added.length >= 1) {
    changes.push({
      field: 'capabilities',
      change_type: 'added',
      old_value: null,
      new_value: added,
      confidence: MEDIUM_CONFIDENCE,
    });
  }

  if (removed.length >= 2) {
    changes.push({
      field: 'capabilities',
      change_type: 'removed',
      old_value: removed,
      new_value: null,
      confidence: LOW_CONFIDENCE,
    });
  }

  return changes;
}

// ============================================================================
// MAIN DIFF ENGINE
// ============================================================================

export interface DbRecord {
  id: string;
  name: string;
  org_type?: OrgType;
  website?: string;
  // Tags/focus
  sector_focus?: string[];
  stage_focus?: string[];
  capability_tags?: string[];
  focus_tags?: string[];
  // Capabilities (manufacturers)
  capabilities?: string[];
  certifications?: string[];
  // Contacts (from related table)
  contacts?: DbContact[];
  // Portfolio (from related table, for VCs)
  portfolio_companies?: string[];
  // Hashes for change detection
  contact_hash?: string;
  portfolio_hash?: string;
  // Confidence
  confidence_score?: number;
  last_verified_at?: string;
}

/**
 * Main diff function - compares DB record to extracted data
 */
export function computeDiff(
  dbRecord: DbRecord,
  extractedData: ExtractedData,
  contentHash: string | null
): DiffResult {
  const changes: DiffChange[] = [];
  const orgType = dbRecord.org_type || 'external';

  // Compare contacts
  if (dbRecord.contacts && extractedData.contacts) {
    const contactChanges = compareContacts(dbRecord.contacts, extractedData.contacts);
    changes.push(...contactChanges);
  }

  // Compare tags based on org type
  if (orgType === 'VC' || orgType === 'PE' || orgType === 'Angel') {
    // Compare sector/stage focus
    if (dbRecord.sector_focus && extractedData.tags) {
      const tagChanges = compareTags(dbRecord.sector_focus, extractedData.tags);
      changes.push(...tagChanges);
    }

    // Compare portfolio
    if (dbRecord.portfolio_companies && extractedData.portfolio) {
      const portfolioChanges = comparePortfolio(
        dbRecord.portfolio_companies,
        extractedData.portfolio
      );
      changes.push(...portfolioChanges);
    }
  } else if (orgType === 'LawFirm' || orgType === 'Accountancy') {
    // Compare practice areas
    if (dbRecord.capability_tags && extractedData.practice_areas) {
      const areaChanges = compareTags(dbRecord.capability_tags, extractedData.practice_areas);
      changes.push(...areaChanges);
    }
  } else if (orgType === 'Manufacturer') {
    // Compare capabilities
    if (dbRecord.capabilities && extractedData.capabilities) {
      const capChanges = compareCapabilities(dbRecord.capabilities, extractedData.capabilities);
      changes.push(...capChanges);
    }

    // Compare certifications
    if (dbRecord.certifications && extractedData.certifications) {
      const certChanges = compareTags(dbRecord.certifications, extractedData.certifications);
      certChanges.forEach((c) => (c.field = 'certifications'));
      changes.push(...certChanges);
    }
  } else if (orgType === 'AITool') {
    // Compare categories/tags
    if (dbRecord.capability_tags && extractedData.tags) {
      const tagChanges = compareTags(dbRecord.capability_tags, extractedData.tags);
      changes.push(...tagChanges);
    }
  }

  // Calculate overall confidence
  const avgConfidence =
    changes.length > 0
      ? Math.round(changes.reduce((sum, c) => sum + c.confidence, 0) / changes.length)
      : 100;

  // Generate summary
  let summary = 'No significant changes detected';
  if (changes.length > 0) {
    const changeTypes = [...new Set(changes.map((c) => c.field))];
    summary = `Changes detected in: ${changeTypes.join(', ')}`;
  }

  return {
    has_changes: changes.length > 0,
    changes,
    summary,
    confidence: avgConfidence,
  };
}

/**
 * Determine the primary change type for review queue
 */
export function determineChangeType(diff: DiffResult): ChangeType {
  if (!diff.has_changes) {
    return 'needs_verification';
  }

  const fields = diff.changes.map((c) => c.field);

  if (fields.some((f) => f.startsWith('contact'))) {
    return 'contact_changed';
  }

  if (fields.includes('portfolio')) {
    return 'portfolio_changed';
  }

  if (
    fields.includes('tags') ||
    fields.includes('capabilities') ||
    fields.includes('certifications')
  ) {
    return 'tags_changed';
  }

  return 'content_changed';
}

/**
 * Check if confidence score should be reduced
 */
export function shouldReduceConfidence(
  dbRecord: DbRecord,
  fetchSuccess: boolean,
  httpStatus: number | null
): { reduce: boolean; newScore: number; reason: string } {
  const currentScore = dbRecord.confidence_score || 80;

  // Page not found
  if (httpStatus === 404) {
    return {
      reduce: true,
      newScore: Math.max(20, currentScore - 30),
      reason: 'Website returned 404 Not Found',
    };
  }

  // Access denied
  if (httpStatus === 403 || httpStatus === 401) {
    return {
      reduce: true,
      newScore: Math.max(40, currentScore - 20),
      reason: 'Website blocked access',
    };
  }

  // Fetch failed
  if (!fetchSuccess) {
    return {
      reduce: true,
      newScore: Math.max(50, currentScore - 10),
      reason: 'Could not fetch website',
    };
  }

  // No reduction
  return {
    reduce: false,
    newScore: currentScore,
    reason: '',
  };
}

/**
 * Generate human-readable change summary for review
 */
export function generateChangeSummary(diff: DiffResult, entityName: string): string {
  if (!diff.has_changes) {
    return `No changes detected for ${entityName}`;
  }

  const parts: string[] = [];

  for (const change of diff.changes) {
    switch (change.change_type) {
      case 'added':
        if (Array.isArray(change.new_value)) {
          parts.push(`+ ${change.field}: ${(change.new_value as string[]).slice(0, 5).join(', ')}`);
        } else {
          parts.push(`+ ${change.field}: ${change.new_value}`);
        }
        break;
      case 'removed':
        if (Array.isArray(change.old_value)) {
          parts.push(`- ${change.field}: ${(change.old_value as string[]).slice(0, 5).join(', ')}`);
        } else {
          parts.push(`- ${change.field}: ${change.old_value}`);
        }
        break;
      case 'modified':
        parts.push(`~ ${change.field}: changed`);
        break;
    }
  }

  return `Changes for ${entityName}:\n${parts.join('\n')}`;
}
