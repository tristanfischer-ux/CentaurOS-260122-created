/**
 * Freshness System - Deterministic Extractors
 *
 * Lightweight heuristic extractors for each org type.
 * These extract structured data from HTML without requiring LLM assistance.
 *
 * Extractors:
 * - VC/PE: Detect portfolio page links, extract company names
 * - Law/Accountancy: Detect practice area keywords
 * - Manufacturers: Detect capability keywords, certifications
 * - AI Tools: Detect category keywords, pricing
 * - Contacts: Detect emails, LinkedIn, contact forms
 */

import type { ExtractedData, ExtractedContact, OrgType } from './types';
import { normalizeHtml } from './fetch';

// ============================================================================
// KEYWORD DICTIONARIES
// ============================================================================

const VC_KEYWORDS = [
  'portfolio',
  'investments',
  'companies',
  'backed',
  'invested',
  'seed',
  'series',
  'venture',
  'fund',
  'capital',
  'startup',
  'founder',
];

const PE_KEYWORDS = [
  'portfolio',
  'investments',
  'buyout',
  'growth equity',
  'private equity',
  'acquisition',
  'management buyout',
  'mbo',
  'lbo',
];

const LAW_PRACTICE_AREAS = [
  'venture capital',
  'startup',
  'technology',
  'ip',
  'intellectual property',
  'patents',
  'corporate',
  'm&a',
  'mergers',
  'acquisitions',
  'employment',
  'commercial',
  'fundraising',
  'eis',
  'seis',
  'share schemes',
  'data protection',
  'gdpr',
  'fintech',
  'healthtech',
  'deeptech',
];

const ACCOUNTANCY_KEYWORDS = [
  'r&d tax',
  'tax credits',
  'audit',
  'vat',
  'payroll',
  'bookkeeping',
  'management accounts',
  'statutory accounts',
  'company secretarial',
  'startup',
  'scaleup',
  'technology',
  'eis',
  'seis',
  'share valuation',
  'due diligence',
];

const MANUFACTURING_CAPABILITIES = [
  'cnc',
  'cnc machining',
  'laser cutting',
  'waterjet',
  '3d printing',
  'additive',
  'sls',
  'sla',
  'fdm',
  'mjf',
  'dmls',
  'injection molding',
  'injection moulding',
  'die casting',
  'sheet metal',
  'fabrication',
  'welding',
  'pcb',
  'pcba',
  'electronics assembly',
  'smt',
  'through-hole',
  'cable assembly',
  'wiring harness',
];

const MANUFACTURING_CERTIFICATIONS = [
  'iso 9001',
  'iso 13485',
  'iso 14001',
  'as9100',
  'iatf 16949',
  'nadcap',
  'ce marking',
  'ukca',
  'ul',
  'rohs',
  'reach',
  'medical device',
  'aerospace',
  'automotive',
];

const AI_TOOL_CATEGORIES = [
  'sales',
  'crm',
  'marketing',
  'automation',
  'analytics',
  'forecasting',
  'lead generation',
  'outreach',
  'email',
  'design',
  'cad',
  'simulation',
  'dfm',
  'procurement',
  'manufacturing',
  'operations',
  'finance',
  'accounting',
  'support',
  'customer service',
];

// ============================================================================
// EMAIL EXTRACTION
// ============================================================================

/**
 * Extract emails from HTML content
 * Only extracts explicitly visible emails, not obfuscated ones
 */
export function extractEmails(html: string): ExtractedContact[] {
  const contacts: ExtractedContact[] = [];

  // Standard email regex
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const matches = html.match(emailRegex) || [];

  // Deduplicate and filter
  const seen = new Set<string>();
  for (const email of matches) {
    const normalized = email.toLowerCase();

    // Skip common non-person emails
    if (
      normalized.includes('noreply') ||
      normalized.includes('no-reply') ||
      normalized.includes('donotreply') ||
      normalized.includes('unsubscribe') ||
      normalized.includes('example.com') ||
      normalized.includes('test@')
    ) {
      continue;
    }

    if (!seen.has(normalized)) {
      seen.add(normalized);
      contacts.push({
        type: 'email',
        value: normalized,
      });
    }
  }

  return contacts;
}

/**
 * Check if page has a contact form
 */
export function hasContactForm(html: string): boolean {
  const lowerHtml = html.toLowerCase();

  // Look for form indicators
  const formIndicators = [
    '<form',
    'contact-form',
    'contact_form',
    'contactform',
    'wpcf7',
    'hubspot',
    'typeform',
    'jotform',
    'google-form',
    'name="contact"',
    'id="contact"',
  ];

  // Look for form field names
  const fieldIndicators = [
    'input type="email"',
    'name="email"',
    'name="message"',
    'name="enquiry"',
    'placeholder="email"',
    'placeholder="your email"',
  ];

  const hasForm = formIndicators.some((indicator) => lowerHtml.includes(indicator));
  const hasFields = fieldIndicators.some((indicator) => lowerHtml.includes(indicator));

  return hasForm || hasFields;
}

/**
 * Extract LinkedIn URLs
 */
export function extractLinkedIn(html: string): ExtractedContact[] {
  const contacts: ExtractedContact[] = [];

  // Match LinkedIn company and personal profiles
  const linkedinRegex =
    /https?:\/\/(?:www\.)?linkedin\.com\/(?:company|in|pub)\/[a-zA-Z0-9_-]+\/?/gi;
  const matches = html.match(linkedinRegex) || [];

  const seen = new Set<string>();
  for (const url of matches) {
    const normalized = url.toLowerCase().replace(/\/$/, '');
    if (!seen.has(normalized)) {
      seen.add(normalized);
      contacts.push({
        type: 'linkedin',
        value: normalized,
      });
    }
  }

  return contacts;
}

// ============================================================================
// PORTFOLIO EXTRACTION (VC/PE)
// ============================================================================

/**
 * Extract portfolio company names from VC/PE pages
 * Uses heuristics to find company listings
 */
export function extractPortfolio(html: string): string[] {
  const companies: string[] = [];
  const lowerHtml = html.toLowerCase();

  // Check if this looks like a portfolio page
  const isPortfolioPage = VC_KEYWORDS.some((kw) => lowerHtml.includes(kw));
  if (!isPortfolioPage) {
    return companies;
  }

  // Look for common portfolio list patterns
  // Pattern 1: Links with company names in anchor text
  const linkRegex = /<a[^>]*>([^<]{3,50})<\/a>/gi;
  const linkMatches = html.matchAll(linkRegex);

  for (const match of linkMatches) {
    const text = match[1].trim();
    // Filter out navigation/generic links
    if (
      text.length >= 3 &&
      text.length <= 50 &&
      !text.match(/^(home|about|contact|team|portfolio|news|blog|careers|privacy|terms)$/i) &&
      !text.includes('@') &&
      !text.startsWith('http')
    ) {
      // Check if it looks like a company name (capitalized, not a sentence)
      if (/^[A-Z][a-zA-Z0-9\s&.-]+$/.test(text) && text.split(' ').length <= 5) {
        companies.push(text);
      }
    }
  }

  // Pattern 2: List items that look like company names
  const listRegex = /<li[^>]*>([^<]{3,50})<\/li>/gi;
  const listMatches = html.matchAll(listRegex);

  for (const match of listMatches) {
    const text = match[1].trim();
    if (/^[A-Z][a-zA-Z0-9\s&.-]+$/.test(text) && text.split(' ').length <= 5) {
      if (!companies.includes(text)) {
        companies.push(text);
      }
    }
  }

  // Limit to reasonable number
  return companies.slice(0, 100);
}

// ============================================================================
// KEYWORD EXTRACTION
// ============================================================================

/**
 * Find matching keywords from a dictionary
 */
export function findMatchingKeywords(html: string, keywords: string[]): string[] {
  const normalized = normalizeHtml(html);
  const matches: string[] = [];

  for (const keyword of keywords) {
    if (normalized.includes(keyword.toLowerCase())) {
      matches.push(keyword);
    }
  }

  return matches;
}

/**
 * Extract practice areas for law firms
 */
export function extractLawPracticeAreas(html: string): string[] {
  return findMatchingKeywords(html, LAW_PRACTICE_AREAS);
}

/**
 * Extract service areas for accountancies
 */
export function extractAccountancyServices(html: string): string[] {
  return findMatchingKeywords(html, ACCOUNTANCY_KEYWORDS);
}

/**
 * Extract manufacturing capabilities
 */
export function extractManufacturingCapabilities(html: string): string[] {
  return findMatchingKeywords(html, MANUFACTURING_CAPABILITIES);
}

/**
 * Extract manufacturing certifications
 */
export function extractManufacturingCertifications(html: string): string[] {
  return findMatchingKeywords(html, MANUFACTURING_CERTIFICATIONS);
}

/**
 * Extract AI tool categories
 */
export function extractAIToolCategories(html: string): string[] {
  return findMatchingKeywords(html, AI_TOOL_CATEGORIES);
}

// ============================================================================
// MAIN EXTRACTOR
// ============================================================================

/**
 * Main extractor function - dispatches to appropriate extractor based on org type
 */
export function extractDataFromHtml(html: string, orgType: OrgType): ExtractedData {
  const data: ExtractedData = {
    contacts: [],
    tags: [],
    keywords: [],
  };

  // Always extract contacts
  const emails = extractEmails(html);
  const linkedins = extractLinkedIn(html);
  data.contacts = [...emails, ...linkedins];

  if (hasContactForm(html)) {
    data.contacts.push({
      type: 'contact_form',
      value: 'contact_form_detected',
    });
  }

  // Type-specific extraction
  switch (orgType) {
    case 'VC':
    case 'PE':
    case 'Angel':
      data.portfolio = extractPortfolio(html);
      data.keywords = findMatchingKeywords(html, [...VC_KEYWORDS, ...PE_KEYWORDS]);
      break;

    case 'LawFirm':
      data.practice_areas = extractLawPracticeAreas(html);
      data.tags = data.practice_areas.map((area) =>
        area.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
      );
      break;

    case 'Accountancy':
      data.practice_areas = extractAccountancyServices(html);
      data.tags = data.practice_areas.map((area) =>
        area.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
      );
      break;

    case 'Manufacturer':
      data.capabilities = extractManufacturingCapabilities(html);
      data.certifications = extractManufacturingCertifications(html);
      data.tags = [
        ...data.capabilities.map((c) => c.toLowerCase().replace(/\s+/g, '_')),
        ...data.certifications.map((c) => c.toLowerCase().replace(/\s+/g, '_')),
      ];
      break;

    case 'AITool':
      data.keywords = extractAIToolCategories(html);
      data.tags = data.keywords.map((kw) => kw.toLowerCase().replace(/\s+/g, '_'));
      break;

    case 'Advisor':
      // Advisors: look for focus areas
      data.keywords = findMatchingKeywords(html, [
        ...VC_KEYWORDS,
        ...LAW_PRACTICE_AREAS.slice(0, 10),
        'advisor',
        'consultant',
        'mentor',
        'board',
        'fractional',
      ]);
      break;

    case 'external':
      // External entities: minimal extraction
      data.keywords = findMatchingKeywords(html, [
        'startup',
        'technology',
        'software',
        'hardware',
        'saas',
        'b2b',
        'b2c',
      ]);
      break;
  }

  // Store raw snippet for potential LLM review
  data.raw_snippet = html.substring(0, 10000);

  return data;
}

/**
 * Hash extracted data for change detection
 * Creates a deterministic hash of key extracted fields
 */
export function hashExtractedData(data: ExtractedData): string {
  // Create a normalized, sorted representation
  const normalized = {
    contacts: (data.contacts || [])
      .map((c) => `${c.type}:${c.value}`)
      .sort()
      .join('|'),
    tags: (data.tags || []).sort().join('|'),
    portfolio: (data.portfolio || []).sort().join('|'),
    capabilities: (data.capabilities || []).sort().join('|'),
    certifications: (data.certifications || []).sort().join('|'),
    practice_areas: (data.practice_areas || []).sort().join('|'),
  };

  // Simple hash
  let hash = 0;
  const str = JSON.stringify(normalized);
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}
