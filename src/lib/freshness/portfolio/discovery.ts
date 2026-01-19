/**
 * Portfolio URL Discovery
 *
 * Safe method to find an investor's portfolio page URL.
 *
 * Strategy:
 * 1. Check existing evidence URLs flagged as portfolio
 * 2. Check investor website for obvious portfolio links
 * 3. Limit: 1 homepage fetch + 1 portfolio page fetch maximum
 */

import { fetchUrl, extractDomain } from '../fetch';
import type { DiscoveryMethod } from './types';

// ============================================================================
// CONFIGURATION
// ============================================================================

// Portfolio URL patterns to look for
const PORTFOLIO_URL_PATTERNS = [
  '/portfolio',
  '/investments',
  '/companies',
  '/our-portfolio',
  '/our-companies',
  '/backed-companies',
  '/portfolio-companies',
  '/invested',
];

// Link text patterns that suggest portfolio pages
const PORTFOLIO_LINK_PATTERNS = [
  'portfolio',
  'investments',
  'companies',
  'our portfolio',
  'backed companies',
  'portfolio companies',
];

// Patterns to exclude (navigation, footer noise)
const EXCLUDE_PATTERNS = [
  '/contact',
  '/about',
  '/team',
  '/careers',
  '/blog',
  '/news',
  '/press',
  '/privacy',
  '/terms',
  '/legal',
  '/login',
  '/register',
];

// ============================================================================
// URL DISCOVERY
// ============================================================================

export interface DiscoveryResult {
  portfolio_url: string | null;
  discovery_method: DiscoveryMethod;
  confidence: number;
  notes: string;
  homepage_fetched: boolean;
}

/**
 * Discover portfolio URL for an investor
 *
 * @param investorWebsite - The investor's main website URL
 * @param existingEvidenceUrls - Already known evidence URLs for this org
 * @param rateLimit - Rate limit for fetching (requests per minute)
 */
export async function discoverPortfolioUrl(
  investorWebsite: string,
  existingEvidenceUrls: string[] = [],
  rateLimit: number = 10
): Promise<DiscoveryResult> {
  // 1. Check existing evidence URLs first
  const evidencePortfolio = findPortfolioInEvidence(existingEvidenceUrls);
  if (evidencePortfolio) {
    return {
      portfolio_url: evidencePortfolio,
      discovery_method: 'evidence',
      confidence: 90,
      notes: 'Found portfolio URL in existing evidence',
      homepage_fetched: false,
    };
  }

  // 2. Try common portfolio URL patterns without fetching
  const baseUrl = normalizeBaseUrl(investorWebsite);
  if (!baseUrl) {
    return {
      portfolio_url: null,
      discovery_method: 'auto',
      confidence: 0,
      notes: 'Invalid investor website URL',
      homepage_fetched: false,
    };
  }

  // 3. Fetch homepage and look for portfolio links
  const homepageResult = await fetchUrl(baseUrl, { timeout_ms: 10000 }, rateLimit);

  if (!homepageResult.success || !homepageResult.content) {
    // Fallback: try common patterns blindly
    const guessedUrl = guessPortfolioUrl(baseUrl);
    return {
      portfolio_url: guessedUrl,
      discovery_method: 'auto',
      confidence: 30,
      notes: `Homepage fetch failed (${homepageResult.error}), guessed URL pattern`,
      homepage_fetched: true,
    };
  }

  // 4. Extract portfolio link from homepage
  const extractedUrl = extractPortfolioLinkFromHtml(homepageResult.content, baseUrl);

  if (extractedUrl) {
    return {
      portfolio_url: extractedUrl.url,
      discovery_method: 'auto',
      confidence: extractedUrl.confidence,
      notes: extractedUrl.notes,
      homepage_fetched: true,
    };
  }

  // 5. Fallback: try common patterns
  const guessedUrl = guessPortfolioUrl(baseUrl);
  return {
    portfolio_url: guessedUrl,
    discovery_method: 'auto',
    confidence: 40,
    notes: 'No portfolio link found on homepage, guessed common pattern',
    homepage_fetched: true,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check evidence URLs for portfolio page
 */
function findPortfolioInEvidence(evidenceUrls: string[]): string | null {
  for (const url of evidenceUrls) {
    const lowerUrl = url.toLowerCase();
    if (PORTFOLIO_URL_PATTERNS.some((pattern) => lowerUrl.includes(pattern))) {
      return url;
    }
  }
  return null;
}

/**
 * Normalize base URL (ensure https, no trailing slash)
 */
function normalizeBaseUrl(website: string): string | null {
  try {
    let url = website.trim();
    if (!url.startsWith('http')) {
      url = 'https://' + url;
    }
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return null;
  }
}

/**
 * Guess portfolio URL from common patterns
 */
function guessPortfolioUrl(baseUrl: string): string {
  // Most common pattern
  return `${baseUrl}/portfolio`;
}

/**
 * Extract portfolio link from HTML content
 */
function extractPortfolioLinkFromHtml(
  html: string,
  baseUrl: string
): { url: string; confidence: number; notes: string } | null {
  const lowerHtml = html.toLowerCase();

  // Look for anchor tags with portfolio-related hrefs or text
  const linkRegex = /<a\s+[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  const matches = [...html.matchAll(linkRegex)];

  const candidates: Array<{ href: string; text: string; score: number }> = [];

  for (const match of matches) {
    const href = match[1];
    const linkText = match[2].replace(/<[^>]+>/g, '').trim().toLowerCase();
    const fullMatch = match[0].toLowerCase();

    // Skip excluded patterns
    if (EXCLUDE_PATTERNS.some((pattern) => href.toLowerCase().includes(pattern))) {
      continue;
    }

    // Skip external links
    if (href.startsWith('http') && !href.includes(extractDomain(baseUrl))) {
      continue;
    }

    // Score based on patterns
    let score = 0;

    // Check href patterns
    for (const pattern of PORTFOLIO_URL_PATTERNS) {
      if (href.toLowerCase().includes(pattern)) {
        score += 50;
        break;
      }
    }

    // Check link text patterns
    for (const pattern of PORTFOLIO_LINK_PATTERNS) {
      if (linkText.includes(pattern)) {
        score += 40;
        break;
      }
    }

    // Bonus for nav/header context
    if (fullMatch.includes('nav') || fullMatch.includes('menu')) {
      score += 10;
    }

    if (score > 0) {
      candidates.push({ href, text: linkText, score });
    }
  }

  if (candidates.length === 0) {
    return null;
  }

  // Sort by score and pick best
  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0];

  // Resolve relative URLs
  let resolvedUrl: string;
  try {
    resolvedUrl = new URL(best.href, baseUrl).toString();
  } catch {
    resolvedUrl = `${baseUrl}${best.href.startsWith('/') ? '' : '/'}${best.href}`;
  }

  // Calculate confidence based on score
  const confidence = Math.min(90, best.score);

  return {
    url: resolvedUrl,
    confidence,
    notes: `Found link with text "${best.text}" and score ${best.score}`,
  };
}

/**
 * Validate that a URL looks like a portfolio page
 */
export function isLikelyPortfolioUrl(url: string): boolean {
  const lowerUrl = url.toLowerCase();
  return PORTFOLIO_URL_PATTERNS.some((pattern) => lowerUrl.includes(pattern));
}

/**
 * Extract domain from company href
 */
export function extractCompanyDomain(href: string | null): string | null {
  if (!href) return null;

  try {
    // Skip internal links
    if (href.startsWith('/') || href.startsWith('#')) {
      return null;
    }

    const url = new URL(href.startsWith('http') ? href : `https://${href}`);
    const hostname = url.hostname.toLowerCase().replace(/^www\./, '');

    // Skip common non-company domains
    const skipDomains = [
      'linkedin.com',
      'twitter.com',
      'facebook.com',
      'instagram.com',
      'youtube.com',
      'crunchbase.com',
      'pitchbook.com',
    ];

    if (skipDomains.some((d) => hostname.includes(d))) {
      return null;
    }

    return hostname;
  } catch {
    return null;
  }
}
