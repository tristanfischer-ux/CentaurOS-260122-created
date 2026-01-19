/**
 * Portfolio Extractor
 *
 * Deterministic extraction of portfolio company lists from HTML.
 *
 * Strategy:
 * 1. Find sections containing portfolio/investment keywords
 * 2. Extract anchor texts and hrefs within those sections
 * 3. Filter navigation/footer noise
 * 4. Normalize company names
 * 5. Mark uncertain extractions (JS-heavy, paginated)
 */

import { normalizeHtml } from '../fetch';
import { extractCompanyDomain } from './discovery';
import type { ExtractedCompany, ExtractionResult, ExtractionQuality } from './types';

// ============================================================================
// CONFIGURATION
// ============================================================================

// Section keywords that indicate portfolio content
const PORTFOLIO_SECTION_KEYWORDS = [
  'portfolio',
  'investments',
  'companies',
  'backed',
  'invested',
  'our companies',
  'portfolio companies',
  'selected investments',
  'current portfolio',
  'active investments',
];

// Navigation/footer terms to filter out
const NOISE_TERMS = [
  'home',
  'about',
  'contact',
  'team',
  'careers',
  'blog',
  'news',
  'press',
  'privacy',
  'terms',
  'legal',
  'login',
  'register',
  'sign in',
  'sign up',
  'twitter',
  'linkedin',
  'facebook',
  'instagram',
  'youtube',
  'email',
  'phone',
  'address',
  'copyright',
  'all rights reserved',
  'back to top',
  'next',
  'previous',
  'load more',
  'see more',
  'view all',
];

// Company name suffixes to normalize
const COMPANY_SUFFIXES = [
  ' ltd',
  ' ltd.',
  ' limited',
  ' inc',
  ' inc.',
  ' incorporated',
  ' corp',
  ' corp.',
  ' corporation',
  ' llc',
  ' l.l.c.',
  ' plc',
  ' p.l.c.',
  ' gmbh',
  ' ag',
  ' sa',
  ' bv',
  ' b.v.',
];

// ============================================================================
// MAIN EXTRACTOR
// ============================================================================

/**
 * Extract portfolio companies from HTML content
 *
 * @param html - Raw HTML content of portfolio page
 * @param portfolioUrl - URL of the portfolio page (for context)
 */
export function extractPortfolioCompanies(html: string, portfolioUrl: string): ExtractionResult {
  const companies: ExtractedCompany[] = [];
  const notes: string[] = [];

  // Detect JS-heavy pages
  const isJsHeavy = detectJsHeavyPage(html);
  if (isJsHeavy) {
    notes.push('Page appears to be JavaScript-heavy, extraction may be incomplete');
  }

  // Detect pagination
  const isPaginated = detectPagination(html);
  if (isPaginated) {
    notes.push('Page appears to be paginated, only first page extracted');
  }

  // Method 1: Find portfolio sections and extract from them
  const sectionCompanies = extractFromPortfolioSections(html, portfolioUrl);
  companies.push(...sectionCompanies);

  // Method 2: If no companies found, try extracting from entire page
  if (companies.length === 0) {
    const pageCompanies = extractFromEntirePage(html, portfolioUrl);
    companies.push(...pageCompanies);
    if (pageCompanies.length > 0) {
      notes.push('Extracted from entire page (no clear portfolio section found)');
    }
  }

  // Deduplicate by normalized name
  const deduped = deduplicateCompanies(companies);

  // Calculate quality
  const quality = calculateQuality(deduped.length, isJsHeavy, isPaginated, notes.length);
  const confidence = calculateConfidence(quality, deduped.length);

  return {
    companies: deduped,
    quality,
    confidence,
    notes: notes.length > 0 ? notes.join('; ') : null,
    is_paginated: isPaginated,
    is_js_heavy: isJsHeavy,
    extraction_method: 'deterministic',
  };
}

// ============================================================================
// EXTRACTION METHODS
// ============================================================================

/**
 * Extract companies from identified portfolio sections
 */
function extractFromPortfolioSections(html: string, _portfolioUrl: string): ExtractedCompany[] {
  const companies: ExtractedCompany[] = [];

  // Find section boundaries
  const sectionRegex =
    /<(section|div|article|main)[^>]*class\s*=\s*["'][^"']*(?:portfolio|companies|investments)[^"']*["'][^>]*>([\s\S]*?)<\/\1>/gi;
  const sectionMatches = [...html.matchAll(sectionRegex)];

  // Also try finding by headings
  const headingRegex = /<h[1-6][^>]*>(.*?(?:portfolio|companies|investments).*?)<\/h[1-6]>/gi;
  const headingMatches = [...html.matchAll(headingRegex)];

  // Extract from sections
  for (const match of sectionMatches) {
    const sectionHtml = match[2];
    const extracted = extractLinksFromHtml(sectionHtml);
    companies.push(...extracted);
  }

  // If headings found, extract from surrounding content
  if (sectionMatches.length === 0 && headingMatches.length > 0) {
    // Try to extract from the area after the heading
    for (const headingMatch of headingMatches) {
      const headingIndex = html.indexOf(headingMatch[0]);
      if (headingIndex >= 0) {
        // Get content after heading (up to 50KB or next major section)
        const afterHeading = html.substring(headingIndex, headingIndex + 50000);
        const extracted = extractLinksFromHtml(afterHeading);
        companies.push(...extracted);
      }
    }
  }

  return companies;
}

/**
 * Extract companies from entire page (fallback)
 */
function extractFromEntirePage(html: string, _portfolioUrl: string): ExtractedCompany[] {
  // More conservative extraction - only clear company-like links
  return extractLinksFromHtml(html, true);
}

/**
 * Extract company links from HTML snippet
 */
function extractLinksFromHtml(html: string, strict: boolean = false): ExtractedCompany[] {
  const companies: ExtractedCompany[] = [];

  // Match anchor tags
  const linkRegex = /<a\s+[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  const matches = [...html.matchAll(linkRegex)];

  for (const match of matches) {
    const href = match[1].trim();
    const rawText = match[2].replace(/<[^>]+>/g, '').trim();

    // Skip empty or very short text
    if (!rawText || rawText.length < 2) continue;

    // Skip noise terms
    if (isNoiseTerm(rawText)) continue;

    // In strict mode, require company-like characteristics
    if (strict) {
      if (!looksLikeCompanyName(rawText)) continue;
    }

    // Extract domain from href
    const domain = extractCompanyDomain(href);

    // Normalize name
    const normalized = normalizeCompanyName(rawText);

    // Skip if normalized name is too short
    if (normalized.length < 2) continue;

    companies.push({
      name: rawText,
      name_normalized: normalized,
      website: domain ? `https://${domain}` : null,
      domain: domain,
      href: href,
      logo_url: extractLogoUrl(match[0]),
      context: null,
    });
  }

  // Also extract from logo/image grids (common portfolio layout)
  const logoCompanies = extractFromLogoGrids(html);
  companies.push(...logoCompanies);

  return companies;
}

/**
 * Extract companies from logo grids (img alt text + links)
 */
function extractFromLogoGrids(html: string): ExtractedCompany[] {
  const companies: ExtractedCompany[] = [];

  // Match images with alt text that might be company names
  const imgRegex = /<a\s+[^>]*href\s*=\s*["']([^"']+)["'][^>]*>\s*<img\s+[^>]*alt\s*=\s*["']([^"']+)["'][^>]*>\s*<\/a>/gi;
  const matches = [...html.matchAll(imgRegex)];

  for (const match of matches) {
    const href = match[1].trim();
    const altText = match[2].trim();

    // Skip generic alt text
    if (isNoiseTerm(altText) || altText.toLowerCase().includes('logo')) {
      continue;
    }

    // Must look like a company name
    if (!looksLikeCompanyName(altText)) continue;

    const domain = extractCompanyDomain(href);
    const normalized = normalizeCompanyName(altText);

    if (normalized.length < 2) continue;

    companies.push({
      name: altText,
      name_normalized: normalized,
      website: domain ? `https://${domain}` : null,
      domain: domain,
      href: href,
      logo_url: extractSrcFromImgTag(match[0]),
      context: 'logo_grid',
    });
  }

  return companies;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if term is navigation/footer noise
 */
function isNoiseTerm(text: string): boolean {
  const lower = text.toLowerCase().trim();

  // Exact match noise
  if (NOISE_TERMS.includes(lower)) return true;

  // Contains noise
  for (const noise of NOISE_TERMS) {
    if (lower === noise) return true;
  }

  // Too short or too long
  if (lower.length < 2 || lower.length > 100) return true;

  // Looks like a URL or email
  if (lower.includes('@') || lower.startsWith('http')) return true;

  // Just numbers
  if (/^\d+$/.test(lower)) return true;

  return false;
}

/**
 * Check if text looks like a company name
 */
function looksLikeCompanyName(text: string): boolean {
  const lower = text.toLowerCase().trim();

  // Must start with letter or number
  if (!/^[a-z0-9]/i.test(text)) return false;

  // Reasonable length (2-60 chars)
  if (text.length < 2 || text.length > 60) return false;

  // Not too many words (companies usually 1-5 words)
  if (text.split(/\s+/).length > 6) return false;

  // Has at least one capital letter (company names usually capitalized)
  if (!/[A-Z]/.test(text)) return false;

  return true;
}

/**
 * Normalize company name for comparison
 */
export function normalizeCompanyName(name: string): string {
  let normalized = name.toLowerCase().trim();

  // Remove company suffixes
  for (const suffix of COMPANY_SUFFIXES) {
    if (normalized.endsWith(suffix)) {
      normalized = normalized.slice(0, -suffix.length).trim();
    }
  }

  // Collapse whitespace
  normalized = normalized.replace(/\s+/g, ' ');

  // Remove special characters except spaces and hyphens
  normalized = normalized.replace(/[^a-z0-9\s-]/g, '');

  return normalized.trim();
}

/**
 * Extract logo URL from img tag
 */
function extractLogoUrl(html: string): string | null {
  const srcMatch = html.match(/src\s*=\s*["']([^"']+)["']/i);
  return srcMatch ? srcMatch[1] : null;
}

/**
 * Extract src from img tag
 */
function extractSrcFromImgTag(html: string): string | null {
  const srcMatch = html.match(/<img[^>]*src\s*=\s*["']([^"']+)["']/i);
  return srcMatch ? srcMatch[1] : null;
}

/**
 * Detect if page is JavaScript-heavy
 */
function detectJsHeavyPage(html: string): boolean {
  const normalizedLength = normalizeHtml(html).length;
  const rawLength = html.length;

  // If normalized content is very small compared to raw, likely JS-heavy
  if (normalizedLength < rawLength * 0.1) return true;

  // Check for common SPA frameworks
  const spaIndicators = [
    '__NEXT_DATA__',
    '__NUXT__',
    'react-root',
    'ng-app',
    'data-reactroot',
    'vue-app',
  ];

  return spaIndicators.some((indicator) => html.includes(indicator));
}

/**
 * Detect if page has pagination
 */
function detectPagination(html: string): boolean {
  const paginationIndicators = [
    'data-page',
    'class="pagination"',
    'class="pager"',
    'page=2',
    'page/2',
    'load-more',
    'loadMore',
    'infinite-scroll',
    'aria-label="Page',
    'aria-label="pagination"',
  ];

  const lower = html.toLowerCase();
  return paginationIndicators.some((indicator) => lower.includes(indicator.toLowerCase()));
}

/**
 * Calculate extraction quality
 */
function calculateQuality(
  companyCount: number,
  isJsHeavy: boolean,
  isPaginated: boolean,
  noteCount: number
): ExtractionQuality {
  if (isJsHeavy && companyCount < 3) return 'uncertain';
  if (companyCount === 0) return 'uncertain';
  if (isJsHeavy || isPaginated) return 'medium';
  if (noteCount > 1) return 'medium';
  if (companyCount >= 5) return 'high';
  return 'medium';
}

/**
 * Calculate confidence score
 */
function calculateConfidence(quality: ExtractionQuality, companyCount: number): number {
  const baseScores: Record<ExtractionQuality, number> = {
    high: 85,
    medium: 65,
    low: 45,
    uncertain: 30,
    unknown: 20,
  };

  let score = baseScores[quality];

  // Adjust based on company count
  if (companyCount >= 10) score += 5;
  if (companyCount >= 20) score += 5;
  if (companyCount < 3) score -= 10;

  return Math.max(10, Math.min(95, score));
}

/**
 * Deduplicate companies by normalized name and domain
 */
function deduplicateCompanies(companies: ExtractedCompany[]): ExtractedCompany[] {
  const seen = new Map<string, ExtractedCompany>();

  for (const company of companies) {
    // Prefer domain-based dedup, fallback to name
    const key = company.domain || company.name_normalized;

    if (!seen.has(key)) {
      seen.set(key, company);
    } else {
      // Keep the one with more info (domain, website, logo)
      const existing = seen.get(key)!;
      const existingScore =
        (existing.domain ? 1 : 0) + (existing.website ? 1 : 0) + (existing.logo_url ? 1 : 0);
      const newScore =
        (company.domain ? 1 : 0) + (company.website ? 1 : 0) + (company.logo_url ? 1 : 0);

      if (newScore > existingScore) {
        seen.set(key, company);
      }
    }
  }

  return Array.from(seen.values());
}
