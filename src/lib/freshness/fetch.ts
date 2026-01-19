/**
 * Freshness System - Canonical Fetch Strategy
 *
 * Safe, respectful web fetching with:
 * - Conditional GET (ETag/If-Modified-Since)
 * - Per-host rate limiting (token bucket)
 * - Request timeout + retry (max 1 retry)
 * - Proper user-agent identification
 * - Content normalization and hashing
 *
 * RULES:
 * - Never aggressive scraping
 * - Low request rates (default 10/min per host)
 * - Respect robots.txt where feasible
 * - Only fetch official/evidence URLs
 */

import { createHash } from 'crypto';
import type { FetchOptions, FetchResult } from './types';

// ============================================================================
// CONFIGURATION
// ============================================================================

const USER_AGENT = 'CursorOS-MarketplaceVerifier/1.0 (+https://cursorosapp.com/bot)';
const DEFAULT_TIMEOUT_MS = 15000; // 15 seconds
const MAX_RETRIES = 1;
const RETRY_DELAY_MS = 2000;

// Rate limiting defaults (conservative)
const DEFAULT_REQUESTS_PER_MINUTE = 10;
const DEFAULT_MIN_INTERVAL_MS = 6000; // 6 seconds between requests to same host

// Content limits
const MAX_CONTENT_LENGTH = 5 * 1024 * 1024; // 5MB max
const EXTRACT_SNIPPET_LENGTH = 50000; // 50KB max for extraction

// ============================================================================
// RATE LIMITER (Token Bucket per host)
// ============================================================================

interface RateLimitBucket {
  tokens: number;
  lastRefill: number;
  maxTokens: number;
  refillRate: number; // tokens per ms
}

const rateLimitBuckets = new Map<string, RateLimitBucket>();

/**
 * Extract domain from URL for rate limiting
 */
export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.toLowerCase();
  } catch {
    return 'unknown';
  }
}

/**
 * Get or create rate limit bucket for a domain
 */
function getBucket(domain: string, maxRequestsPerMinute: number): RateLimitBucket {
  if (!rateLimitBuckets.has(domain)) {
    rateLimitBuckets.set(domain, {
      tokens: maxRequestsPerMinute,
      lastRefill: Date.now(),
      maxTokens: maxRequestsPerMinute,
      refillRate: maxRequestsPerMinute / 60000, // per ms
    });
  }
  return rateLimitBuckets.get(domain)!;
}

/**
 * Try to acquire a token for rate limiting
 * Returns true if allowed, false if should wait
 */
function tryAcquireToken(domain: string, maxRequestsPerMinute: number): boolean {
  const bucket = getBucket(domain, maxRequestsPerMinute);
  const now = Date.now();

  // Refill tokens based on time elapsed
  const elapsed = now - bucket.lastRefill;
  const newTokens = elapsed * bucket.refillRate;
  bucket.tokens = Math.min(bucket.maxTokens, bucket.tokens + newTokens);
  bucket.lastRefill = now;

  // Try to consume a token
  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    return true;
  }

  return false;
}

/**
 * Wait for rate limit to allow a request
 */
async function waitForRateLimit(
  domain: string,
  maxRequestsPerMinute: number,
  timeoutMs: number
): Promise<boolean> {
  const startTime = Date.now();
  const checkInterval = 500; // check every 500ms

  while (Date.now() - startTime < timeoutMs) {
    if (tryAcquireToken(domain, maxRequestsPerMinute)) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, checkInterval));
  }

  return false;
}

// ============================================================================
// CONTENT PROCESSING
// ============================================================================

/**
 * Normalize HTML for consistent hashing
 * - Strip scripts, styles, comments
 * - Collapse whitespace
 * - Lowercase
 */
export function normalizeHtml(html: string): string {
  let normalized = html;

  // Remove script tags and content
  normalized = normalized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove style tags and content
  normalized = normalized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  // Remove HTML comments
  normalized = normalized.replace(/<!--[\s\S]*?-->/g, '');

  // Remove all HTML tags (keep text content)
  normalized = normalized.replace(/<[^>]+>/g, ' ');

  // Decode common HTML entities
  normalized = normalized
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // Collapse whitespace
  normalized = normalized.replace(/\s+/g, ' ').trim();

  // Lowercase for comparison
  normalized = normalized.toLowerCase();

  return normalized;
}

/**
 * Hash content using SHA256
 */
export function hashContent(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

/**
 * Extract a snippet for storage (limited size)
 */
export function extractSnippet(html: string, maxLength: number = EXTRACT_SNIPPET_LENGTH): string {
  const normalized = normalizeHtml(html);
  if (normalized.length <= maxLength) {
    return normalized;
  }
  return normalized.substring(0, maxLength) + '...';
}

// ============================================================================
// FETCH IMPLEMENTATION
// ============================================================================

/**
 * Fetch a URL with all safety features
 *
 * Features:
 * - Conditional GET (ETag/If-Modified-Since)
 * - Rate limiting per host
 * - Timeout handling
 * - Retry logic (max 1 retry)
 * - Content normalization
 */
export async function fetchUrl(
  url: string,
  options: FetchOptions = {},
  rateLimit: number = DEFAULT_REQUESTS_PER_MINUTE
): Promise<FetchResult> {
  const {
    timeout_ms = DEFAULT_TIMEOUT_MS,
    conditional = true,
    etag,
    last_modified,
  } = options;

  const domain = extractDomain(url);
  const startTime = Date.now();

  // Wait for rate limit
  const acquired = await waitForRateLimit(domain, rateLimit, timeout_ms / 2);
  if (!acquired) {
    return {
      success: false,
      status: 429,
      etag: null,
      last_modified: null,
      content: null,
      content_hash: null,
      content_length: 0,
      response_time_ms: Date.now() - startTime,
      from_cache: false,
      not_modified: false,
      error: 'Rate limit exceeded - too many requests to this domain',
    };
  }

  // Build headers
  const headers: Record<string, string> = {
    'User-Agent': USER_AGENT,
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-GB,en;q=0.9',
  };

  // Add conditional headers if provided
  if (conditional && etag) {
    headers['If-None-Match'] = etag;
  }
  if (conditional && last_modified) {
    headers['If-Modified-Since'] = last_modified;
  }

  // Attempt fetch with retry
  let lastError: string | null = null;
  let retries = 0;

  while (retries <= MAX_RETRIES) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout_ms);

      const response = await fetch(url, {
        method: 'GET',
        headers,
        signal: controller.signal,
        redirect: 'follow',
      });

      clearTimeout(timeoutId);

      const responseTime = Date.now() - startTime;

      // Handle 304 Not Modified
      if (response.status === 304) {
        return {
          success: true,
          status: 304,
          etag: response.headers.get('etag'),
          last_modified: response.headers.get('last-modified'),
          content: null,
          content_hash: null,
          content_length: 0,
          response_time_ms: responseTime,
          from_cache: false,
          not_modified: true,
          error: null,
        };
      }

      // Handle error responses
      if (!response.ok) {
        return {
          success: false,
          status: response.status,
          etag: response.headers.get('etag'),
          last_modified: response.headers.get('last-modified'),
          content: null,
          content_hash: null,
          content_length: 0,
          response_time_ms: responseTime,
          from_cache: false,
          not_modified: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      // Check content length before reading
      const contentLength = parseInt(response.headers.get('content-length') || '0', 10);
      if (contentLength > MAX_CONTENT_LENGTH) {
        return {
          success: false,
          status: response.status,
          etag: response.headers.get('etag'),
          last_modified: response.headers.get('last-modified'),
          content: null,
          content_hash: null,
          content_length: contentLength,
          response_time_ms: responseTime,
          from_cache: false,
          not_modified: false,
          error: `Content too large: ${contentLength} bytes (max ${MAX_CONTENT_LENGTH})`,
        };
      }

      // Read content
      const content = await response.text();
      const normalizedContent = normalizeHtml(content);
      const contentHash = hashContent(normalizedContent);

      return {
        success: true,
        status: response.status,
        etag: response.headers.get('etag'),
        last_modified: response.headers.get('last-modified'),
        content: content,
        content_hash: contentHash,
        content_length: content.length,
        response_time_ms: responseTime,
        from_cache: false,
        not_modified: false,
        error: null,
      };
    } catch (error) {
      lastError =
        error instanceof Error
          ? error.name === 'AbortError'
            ? 'Request timeout'
            : error.message
          : 'Unknown fetch error';

      retries++;

      if (retries <= MAX_RETRIES) {
        // Wait before retry
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      }
    }
  }

  // All retries failed
  return {
    success: false,
    status: 0,
    etag: null,
    last_modified: null,
    content: null,
    content_hash: null,
    content_length: 0,
    response_time_ms: Date.now() - startTime,
    from_cache: false,
    not_modified: false,
    error: lastError || 'Fetch failed after retries',
  };
}

/**
 * Check if a URL is likely blocked by robots.txt
 * Note: This is a simple heuristic check, not full robots.txt parsing
 */
export async function checkRobotsAllowed(
  url: string,
  rateLimit: number = DEFAULT_REQUESTS_PER_MINUTE
): Promise<{ allowed: boolean; reason?: string }> {
  const domain = extractDomain(url);

  try {
    const robotsUrl = `https://${domain}/robots.txt`;
    const result = await fetchUrl(robotsUrl, { timeout_ms: 5000 }, rateLimit);

    if (!result.success || !result.content) {
      // If we can't fetch robots.txt, assume allowed
      return { allowed: true, reason: 'robots.txt not found or inaccessible' };
    }

    const robotsContent = result.content.toLowerCase();
    const urlPath = new URL(url).pathname.toLowerCase();

    // Very simple check: look for "disallow: /" for all user agents
    // A full implementation would parse robots.txt properly
    const lines = robotsContent.split('\n');
    let inOurSection = false;
    let inAllSection = false;

    for (const line of lines) {
      const trimmed = line.trim().toLowerCase();

      if (trimmed.startsWith('user-agent:')) {
        const agent = trimmed.replace('user-agent:', '').trim();
        inOurSection = agent.includes('cursorosmarketplaceverifier') || agent === '*';
        inAllSection = agent === '*';
      }

      if ((inOurSection || inAllSection) && trimmed.startsWith('disallow:')) {
        const disallowed = trimmed.replace('disallow:', '').trim();
        if (disallowed === '/') {
          return { allowed: false, reason: 'robots.txt disallows all paths' };
        }
        if (urlPath.startsWith(disallowed)) {
          return { allowed: false, reason: `robots.txt disallows ${disallowed}` };
        }
      }
    }

    return { allowed: true };
  } catch {
    // On error, assume allowed
    return { allowed: true, reason: 'Could not check robots.txt' };
  }
}

/**
 * Batch fetch multiple URLs with rate limiting
 * Processes sequentially to respect rate limits
 */
export async function batchFetch(
  urls: Array<{ url: string; etag?: string; last_modified?: string }>,
  rateLimit: number = DEFAULT_REQUESTS_PER_MINUTE,
  onProgress?: (completed: number, total: number) => void
): Promise<Map<string, FetchResult>> {
  const results = new Map<string, FetchResult>();

  for (let i = 0; i < urls.length; i++) {
    const { url, etag, last_modified } = urls[i];

    const result = await fetchUrl(
      url,
      {
        conditional: true,
        etag,
        last_modified,
      },
      rateLimit
    );

    results.set(url, result);

    if (onProgress) {
      onProgress(i + 1, urls.length);
    }

    // Small delay between requests for politeness
    if (i < urls.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, DEFAULT_MIN_INTERVAL_MS));
    }
  }

  return results;
}
