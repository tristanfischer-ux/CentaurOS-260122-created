/**
 * Portfolio Diff Engine
 *
 * Compare previously stored portfolio vs newly extracted list.
 * Compute additions, removals, and possible renames.
 *
 * RULES:
 * - Never auto-delete relationships
 * - Mark removed as "removed_pending_review"
 * - Use fuzzy matching for potential renames
 */

import { normalizeCompanyName } from './extract';
import type {
  PortfolioCompany,
  ExtractedCompany,
  AddedCompany,
  RemovedCompany,
  RenamedCompany,
  PortfolioDiffResult,
  ExtractionQuality,
} from './types';

// ============================================================================
// CONFIGURATION
// ============================================================================

// Similarity threshold for rename detection (0-1)
const RENAME_SIMILARITY_THRESHOLD = 0.7;

// Minimum string length for fuzzy matching
const MIN_FUZZY_LENGTH = 3;

// ============================================================================
// MAIN DIFF FUNCTION
// ============================================================================

/**
 * Compare existing portfolio companies with newly extracted list
 *
 * @param existing - Currently stored portfolio companies
 * @param extracted - Newly extracted companies
 * @param extractionQuality - Quality of the extraction
 */
export function computePortfolioDiff(
  existing: PortfolioCompany[],
  extracted: ExtractedCompany[],
  extractionQuality: ExtractionQuality
): PortfolioDiffResult {
  const added: AddedCompany[] = [];
  const removed: RemovedCompany[] = [];
  const renamed: RenamedCompany[] = [];
  const unchanged: string[] = [];
  const notes: string[] = [];

  // Build lookup maps
  const existingByDomain = new Map<string, PortfolioCompany>();
  const existingByName = new Map<string, PortfolioCompany>();
  const existingActive = existing.filter((c) => c.status === 'active');

  for (const company of existingActive) {
    if (company.company_domain) {
      existingByDomain.set(company.company_domain, company);
    }
    existingByName.set(company.company_name_normalized, company);
  }

  const extractedByDomain = new Map<string, ExtractedCompany>();
  const extractedByName = new Map<string, ExtractedCompany>();

  for (const company of extracted) {
    if (company.domain) {
      extractedByDomain.set(company.domain, company);
    }
    extractedByName.set(company.name_normalized, company);
  }

  // Track matched companies
  const matchedExistingIds = new Set<string>();
  const matchedExtractedNames = new Set<string>();

  // Step 1: Match by domain (highest confidence)
  for (const [domain, extractedCompany] of extractedByDomain) {
    const existingCompany = existingByDomain.get(domain);
    if (existingCompany) {
      // Check for rename (same domain, different name)
      if (existingCompany.company_name_normalized !== extractedCompany.name_normalized) {
        renamed.push({
          id: existingCompany.id,
          old_name: existingCompany.company_name,
          new_name: extractedCompany.name,
          domain: domain,
          confidence: 90, // High confidence - same domain
        });
      } else {
        unchanged.push(existingCompany.id);
      }
      matchedExistingIds.add(existingCompany.id);
      matchedExtractedNames.add(extractedCompany.name_normalized);
    }
  }

  // Step 2: Match by normalized name
  for (const [name, extractedCompany] of extractedByName) {
    if (matchedExtractedNames.has(name)) continue;

    const existingCompany = existingByName.get(name);
    if (existingCompany && !matchedExistingIds.has(existingCompany.id)) {
      unchanged.push(existingCompany.id);
      matchedExistingIds.add(existingCompany.id);
      matchedExtractedNames.add(name);
    }
  }

  // Step 3: Find potential renames (fuzzy matching)
  const unmatchedExisting = existingActive.filter((c) => !matchedExistingIds.has(c.id));
  const unmatchedExtracted = extracted.filter((c) => !matchedExtractedNames.has(c.name_normalized));

  for (const existingCompany of unmatchedExisting) {
    // Try fuzzy match against unmatched extracted
    let bestMatch: { company: ExtractedCompany; similarity: number } | null = null;

    for (const extractedCompany of unmatchedExtracted) {
      if (matchedExtractedNames.has(extractedCompany.name_normalized)) continue;

      const similarity = calculateSimilarity(
        existingCompany.company_name_normalized,
        extractedCompany.name_normalized
      );

      if (similarity >= RENAME_SIMILARITY_THRESHOLD) {
        if (!bestMatch || similarity > bestMatch.similarity) {
          bestMatch = { company: extractedCompany, similarity };
        }
      }
    }

    if (bestMatch) {
      renamed.push({
        id: existingCompany.id,
        old_name: existingCompany.company_name,
        new_name: bestMatch.company.name,
        domain: bestMatch.company.domain,
        confidence: Math.round(bestMatch.similarity * 100),
      });
      matchedExistingIds.add(existingCompany.id);
      matchedExtractedNames.add(bestMatch.company.name_normalized);
    }
  }

  // Step 4: Identify additions (in extracted, not matched)
  for (const extractedCompany of extracted) {
    if (!matchedExtractedNames.has(extractedCompany.name_normalized)) {
      added.push({
        name: extractedCompany.name,
        name_normalized: extractedCompany.name_normalized,
        website: extractedCompany.website,
        domain: extractedCompany.domain,
        href: extractedCompany.href,
      });
    }
  }

  // Step 5: Identify removals (in existing, not matched)
  for (const existingCompany of existingActive) {
    if (!matchedExistingIds.has(existingCompany.id)) {
      removed.push({
        id: existingCompany.id,
        name: existingCompany.company_name,
        domain: existingCompany.company_domain,
        last_seen_at: existingCompany.last_seen_at,
      });
    }
  }

  // Add notes about the diff
  if (added.length > 0) notes.push(`${added.length} companies added`);
  if (removed.length > 0) notes.push(`${removed.length} companies removed`);
  if (renamed.length > 0) notes.push(`${renamed.length} potential renames`);
  if (extractionQuality === 'uncertain') {
    notes.push('Extraction quality is uncertain - review carefully');
  }

  // Calculate overall confidence
  const confidence = calculateDiffConfidence(
    extractionQuality,
    added.length,
    removed.length,
    renamed.length,
    unchanged.length
  );

  return {
    added,
    removed,
    renamed,
    unchanged,
    quality: extractionQuality,
    confidence,
    has_changes: added.length > 0 || removed.length > 0 || renamed.length > 0,
    notes,
  };
}

// ============================================================================
// SIMILARITY FUNCTIONS
// ============================================================================

/**
 * Calculate string similarity using Levenshtein distance
 */
export function calculateSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1;
  if (str1.length < MIN_FUZZY_LENGTH || str2.length < MIN_FUZZY_LENGTH) return 0;

  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1;

  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

/**
 * Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;

  // Create distance matrix
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  // Initialize first row and column
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  // Fill the matrix
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1, // deletion
        dp[i][j - 1] + 1, // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return dp[m][n];
}

/**
 * Calculate diff confidence score
 */
function calculateDiffConfidence(
  quality: ExtractionQuality,
  addedCount: number,
  removedCount: number,
  renamedCount: number,
  unchangedCount: number
): number {
  // Base confidence from extraction quality
  const qualityScores: Record<ExtractionQuality, number> = {
    high: 85,
    medium: 70,
    low: 50,
    uncertain: 35,
    unknown: 25,
  };

  let confidence = qualityScores[quality];

  // Adjust based on changes
  const totalExisting = removedCount + unchangedCount + renamedCount;

  if (totalExisting > 0) {
    // High removal rate is suspicious
    const removalRate = removedCount / totalExisting;
    if (removalRate > 0.5) {
      confidence -= 20;
    } else if (removalRate > 0.3) {
      confidence -= 10;
    }
  }

  // Many renames with low confidence is suspicious
  if (renamedCount > 5) {
    confidence -= 5;
  }

  // Many changes overall might indicate page structure change
  if (addedCount + removedCount > 20) {
    confidence -= 10;
  }

  // Some unchanged is a good sign
  if (unchangedCount > 0) {
    confidence += 5;
  }

  return Math.max(10, Math.min(95, confidence));
}

/**
 * Generate human-readable change summary
 */
export function generatePortfolioChangeSummary(diff: PortfolioDiffResult, investorName: string): string {
  const parts: string[] = [];

  parts.push(`Portfolio changes for ${investorName}:`);

  if (diff.added.length > 0) {
    parts.push(`\n+ ${diff.added.length} companies added:`);
    diff.added.slice(0, 5).forEach((c) => {
      parts.push(`  - ${c.name}${c.domain ? ` (${c.domain})` : ''}`);
    });
    if (diff.added.length > 5) {
      parts.push(`  ... and ${diff.added.length - 5} more`);
    }
  }

  if (diff.removed.length > 0) {
    parts.push(`\n- ${diff.removed.length} companies removed:`);
    diff.removed.slice(0, 5).forEach((c) => {
      parts.push(`  - ${c.name}${c.domain ? ` (${c.domain})` : ''}`);
    });
    if (diff.removed.length > 5) {
      parts.push(`  ... and ${diff.removed.length - 5} more`);
    }
  }

  if (diff.renamed.length > 0) {
    parts.push(`\n~ ${diff.renamed.length} potential renames:`);
    diff.renamed.slice(0, 5).forEach((c) => {
      parts.push(`  - "${c.old_name}" → "${c.new_name}" (${c.confidence}% confidence)`);
    });
    if (diff.renamed.length > 5) {
      parts.push(`  ... and ${diff.renamed.length - 5} more`);
    }
  }

  if (!diff.has_changes) {
    parts.push('\nNo changes detected');
  }

  parts.push(`\nExtraction quality: ${diff.quality}`);
  parts.push(`Confidence: ${diff.confidence}%`);

  if (diff.notes.length > 0) {
    parts.push(`\nNotes: ${diff.notes.join('; ')}`);
  }

  return parts.join('\n');
}
