/**
 * Freshness System - Unit Tests
 *
 * Tests for:
 * - Fetch normalization and hashing
 * - Diff engine (no-change vs changed)
 * - Extractors
 * - Rate limiter
 *
 * Run with: npx jest tests/freshness.test.ts
 * Or: bun test tests/freshness.test.ts
 */

// @ts-expect-error - Using jest globals which are available at runtime
const { describe, test, expect } = globalThis;
import { normalizeHtml, hashContent, extractDomain } from '../src/lib/freshness/fetch';
import { extractEmails, extractLinkedIn, hasContactForm, findMatchingKeywords } from '../src/lib/freshness/extractors';
import { computeDiff, determineChangeType, shouldReduceConfidence, generateChangeSummary } from '../src/lib/freshness/diff';
import type { DbRecord } from '../src/lib/freshness/diff';
import type { ExtractedData } from '../src/lib/freshness/types';

// ============================================================================
// FETCH TESTS
// ============================================================================

describe('normalizeHtml', () => {
  test('removes script tags', () => {
    const html = '<div>Hello</div><script>alert("xss")</script><p>World</p>';
    const result = normalizeHtml(html);
    expect(result).not.toContain('alert');
    expect(result).toContain('hello');
    expect(result).toContain('world');
  });

  test('removes style tags', () => {
    const html = '<style>.foo { color: red; }</style><div>Content</div>';
    const result = normalizeHtml(html);
    expect(result).not.toContain('color');
    expect(result).toContain('content');
  });

  test('collapses whitespace', () => {
    const html = '<div>Hello    World\n\n\nTest</div>';
    const result = normalizeHtml(html);
    expect(result).toBe('hello world test');
  });

  test('decodes HTML entities', () => {
    const html = '<div>Hello &amp; World &lt;test&gt;</div>';
    const result = normalizeHtml(html);
    expect(result).toContain('hello & world <test>');
  });
});

describe('hashContent', () => {
  test('produces consistent hash', () => {
    const content = 'hello world';
    const hash1 = hashContent(content);
    const hash2 = hashContent(content);
    expect(hash1).toBe(hash2);
  });

  test('produces different hash for different content', () => {
    const hash1 = hashContent('hello');
    const hash2 = hashContent('world');
    expect(hash1).not.toBe(hash2);
  });

  test('produces 64-char hex string (SHA256)', () => {
    const hash = hashContent('test');
    expect(hash.length).toBe(64);
    expect(hash).toMatch(/^[a-f0-9]+$/);
  });
});

describe('extractDomain', () => {
  test('extracts domain from URL', () => {
    expect(extractDomain('https://www.example.com/path')).toBe('www.example.com');
    expect(extractDomain('http://test.co.uk')).toBe('test.co.uk');
  });

  test('handles invalid URLs', () => {
    expect(extractDomain('not-a-url')).toBe('unknown');
  });
});

// ============================================================================
// EXTRACTOR TESTS
// ============================================================================

describe('extractEmails', () => {
  test('extracts valid emails', () => {
    const html = 'Contact us at hello@example.com or sales@test.co.uk';
    const emails = extractEmails(html);
    expect(emails.length).toBe(2);
    expect(emails[0].value).toBe('hello@example.com');
    expect(emails[1].value).toBe('sales@test.co.uk');
  });

  test('filters out noreply emails', () => {
    const html = 'Email: noreply@example.com or contact@example.com';
    const emails = extractEmails(html);
    expect(emails.length).toBe(1);
    expect(emails[0].value).toBe('contact@example.com');
  });

  test('deduplicates emails', () => {
    const html = 'hello@example.com and HELLO@example.com';
    const emails = extractEmails(html);
    expect(emails.length).toBe(1);
  });
});

describe('extractLinkedIn', () => {
  test('extracts LinkedIn URLs', () => {
    const html = '<a href="https://www.linkedin.com/company/acme">Acme</a>';
    const links = extractLinkedIn(html);
    expect(links.length).toBe(1);
    expect(links[0].value).toContain('linkedin.com/company/acme');
  });

  test('extracts personal profiles', () => {
    const html = 'https://linkedin.com/in/john-doe';
    const links = extractLinkedIn(html);
    expect(links.length).toBe(1);
  });
});

describe('hasContactForm', () => {
  test('detects form elements', () => {
    const html = '<form action="/contact"><input type="email" name="email"></form>';
    expect(hasContactForm(html)).toBe(true);
  });

  test('detects form field names', () => {
    const html = '<input name="email" placeholder="Your email">';
    expect(hasContactForm(html)).toBe(true);
  });

  test('returns false for no form', () => {
    const html = '<div>Just some text</div>';
    expect(hasContactForm(html)).toBe(false);
  });
});

describe('findMatchingKeywords', () => {
  test('finds matching keywords', () => {
    const html = 'We specialize in venture capital, M&A, and startup law.';
    const keywords = ['venture capital', 'startup', 'ip', 'patents'];
    const matches = findMatchingKeywords(html, keywords);
    expect(matches).toContain('venture capital');
    expect(matches).toContain('startup');
    expect(matches).not.toContain('ip');
  });
});

// ============================================================================
// DIFF TESTS
// ============================================================================

describe('computeDiff', () => {
  const baseRecord: DbRecord = {
    id: 'test-id',
    name: 'Test Org',
    org_type: 'VC',
    sector_focus: ['fintech', 'healthtech'],
    contacts: [
      { contact_type: 'email', contact_value: 'hello@test.com', is_primary: true },
    ],
    confidence_score: 80,
  };

  test('detects no change when data matches', () => {
    const extracted: ExtractedData = {
      tags: ['fintech', 'healthtech'],
      contacts: [{ type: 'email', value: 'hello@test.com' }],
    };
    const diff = computeDiff(baseRecord, extracted, 'hash123');
    expect(diff.has_changes).toBe(false);
  });

  test('detects tag changes', () => {
    const extracted: ExtractedData = {
      tags: ['fintech', 'healthtech', 'robotics', 'deeptech'],
      contacts: [],
    };
    const diff = computeDiff(baseRecord, extracted, 'hash123');
    expect(diff.has_changes).toBe(true);
    expect(diff.changes.some((c) => c.field === 'tags')).toBe(true);
  });

  test('detects contact changes', () => {
    const extracted: ExtractedData = {
      contacts: [
        { type: 'email', value: 'hello@test.com' },
        { type: 'email', value: 'new@test.com' },
      ],
    };
    const diff = computeDiff(baseRecord, extracted, 'hash123');
    expect(diff.has_changes).toBe(true);
    expect(diff.changes.some((c) => c.field.startsWith('contact'))).toBe(true);
  });
});

describe('determineChangeType', () => {
  test('returns contact_changed for contact changes', () => {
    const diff = {
      has_changes: true,
      changes: [{ field: 'contact.email', change_type: 'added' as const, old_value: null, new_value: 'test@test.com', confidence: 80 }],
      summary: 'Test',
      confidence: 80,
    };
    expect(determineChangeType(diff)).toBe('contact_changed');
  });

  test('returns tags_changed for tag changes', () => {
    const diff = {
      has_changes: true,
      changes: [{ field: 'tags', change_type: 'added' as const, old_value: null, new_value: ['new'], confidence: 80 }],
      summary: 'Test',
      confidence: 80,
    };
    expect(determineChangeType(diff)).toBe('tags_changed');
  });

  test('returns needs_verification when no changes', () => {
    const diff = { has_changes: false, changes: [], summary: 'Test', confidence: 100 };
    expect(determineChangeType(diff)).toBe('needs_verification');
  });
});

describe('shouldReduceConfidence', () => {
  const record: DbRecord = { id: 'test', name: 'Test', confidence_score: 80 };

  test('reduces confidence on 404', () => {
    const result = shouldReduceConfidence(record, false, 404);
    expect(result.reduce).toBe(true);
    expect(result.newScore).toBeLessThan(80);
  });

  test('reduces confidence on fetch failure', () => {
    const result = shouldReduceConfidence(record, false, 0);
    expect(result.reduce).toBe(true);
  });

  test('does not reduce confidence on success', () => {
    const result = shouldReduceConfidence(record, true, 200);
    expect(result.reduce).toBe(false);
  });
});

describe('generateChangeSummary', () => {
  test('generates readable summary', () => {
    const diff = {
      has_changes: true,
      changes: [
        { field: 'tags', change_type: 'added' as const, old_value: null, new_value: ['robotics', 'ai'], confidence: 80 },
      ],
      summary: '',
      confidence: 80,
    };
    const summary = generateChangeSummary(diff, 'Test Org');
    expect(summary).toContain('Test Org');
    expect(summary).toContain('tags');
  });

  test('handles no changes', () => {
    const diff = { has_changes: false, changes: [], summary: '', confidence: 100 };
    const summary = generateChangeSummary(diff, 'Test Org');
    expect(summary).toContain('No changes');
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('Integration', () => {
  test('full extraction and diff pipeline', () => {
    const html = `
      <html>
        <head><title>Test VC</title></head>
        <body>
          <h1>Test Ventures</h1>
          <p>We invest in fintech, healthtech, and robotics startups.</p>
          <p>Contact: team@testventures.com</p>
          <a href="https://linkedin.com/company/testventures">LinkedIn</a>
        </body>
      </html>
    `;

    // Extract
    const emails = extractEmails(html);
    const linkedins = extractLinkedIn(html);
    const keywords = findMatchingKeywords(html, ['fintech', 'healthtech', 'robotics', 'deeptech']);

    expect(emails.length).toBe(1);
    expect(linkedins.length).toBe(1);
    expect(keywords).toContain('fintech');
    expect(keywords).toContain('healthtech');
    expect(keywords).toContain('robotics');

    // Diff against existing record
    const record: DbRecord = {
      id: 'test',
      name: 'Test Ventures',
      org_type: 'VC',
      sector_focus: ['fintech', 'healthtech'],
      contacts: [],
    };

    const extracted: ExtractedData = {
      tags: keywords,
      contacts: [...emails, ...linkedins],
    };

    const diff = computeDiff(record, extracted, 'hash');

    // Should detect new contact (email was not in record)
    expect(diff.has_changes).toBe(true);
  });
});

// ============================================================================
// PORTFOLIO TESTS
// ============================================================================

import { normalizeCompanyName, extractPortfolioCompanies } from '../src/lib/freshness/portfolio/extract';
import { computePortfolioDiff, calculateSimilarity } from '../src/lib/freshness/portfolio/diff';
import type { PortfolioCompany, ExtractedCompany } from '../src/lib/freshness/portfolio/types';

describe('Portfolio: normalizeCompanyName', () => {
  test('removes common suffixes', () => {
    expect(normalizeCompanyName('Acme Inc.')).toBe('acme');
    expect(normalizeCompanyName('TechCorp Ltd')).toBe('techcorp');
    expect(normalizeCompanyName('Global Solutions LLC')).toBe('global solutions');
  });

  test('normalizes whitespace', () => {
    expect(normalizeCompanyName('  Acme   Corp  ')).toBe('acme corp');
  });

  test('removes special characters', () => {
    expect(normalizeCompanyName('Tech & Co.')).toBe('tech co');
    expect(normalizeCompanyName('AI.startup')).toBe('aistartup');
  });

  test('handles already normalized names', () => {
    expect(normalizeCompanyName('acme')).toBe('acme');
  });
});

describe('Portfolio: calculateSimilarity', () => {
  test('identical strings have similarity 1', () => {
    expect(calculateSimilarity('acme', 'acme')).toBe(1);
  });

  test('completely different strings have low similarity', () => {
    const similarity = calculateSimilarity('apple', 'orange');
    expect(similarity).toBeLessThan(0.5);
  });

  test('similar strings have high similarity', () => {
    const similarity = calculateSimilarity('techcorp', 'techcorps');
    expect(similarity).toBeGreaterThan(0.8);
  });

  test('short strings return 0', () => {
    expect(calculateSimilarity('ab', 'cd')).toBe(0);
  });
});

describe('Portfolio: extractPortfolioCompanies', () => {
  test('extracts companies from portfolio section', () => {
    const html = `
      <html>
        <body>
          <section class="portfolio">
            <a href="https://acme.com">Acme Inc</a>
            <a href="https://techstartup.io">TechStartup</a>
            <a href="https://globalco.com">Global Co</a>
          </section>
        </body>
      </html>
    `;

    const result = extractPortfolioCompanies(html, 'https://vc.com/portfolio');
    expect(result.companies.length).toBe(3);
    expect(result.companies[0].name).toBe('Acme Inc');
    expect(result.companies[0].domain).toBe('acme.com');
  });

  test('filters navigation noise', () => {
    const html = `
      <html>
        <body>
          <nav>
            <a href="/about">About</a>
            <a href="/contact">Contact</a>
          </nav>
          <section class="portfolio">
            <a href="https://acme.com">Acme Inc</a>
          </section>
          <footer>
            <a href="/privacy">Privacy</a>
            <a href="https://twitter.com/vc">Twitter</a>
          </footer>
        </body>
      </html>
    `;

    const result = extractPortfolioCompanies(html, 'https://vc.com/portfolio');
    // Should only get Acme, not About/Contact/Privacy/Twitter
    const companyNames = result.companies.map(c => c.name.toLowerCase());
    expect(companyNames).not.toContain('about');
    expect(companyNames).not.toContain('contact');
    expect(companyNames).not.toContain('privacy');
  });

  test('detects JS-heavy pages', () => {
    const html = `
      <html>
        <body>
          <div id="__NEXT_DATA__">{"props":{}}</div>
          <div data-reactroot>Loading...</div>
        </body>
      </html>
    `;

    const result = extractPortfolioCompanies(html, 'https://vc.com/portfolio');
    expect(result.is_js_heavy).toBe(true);
  });
});

describe('Portfolio: computePortfolioDiff', () => {
  const makeExisting = (names: string[]): PortfolioCompany[] =>
    names.map((name, i) => ({
      id: `id-${i}`,
      investor_org_id: 'inv-1',
      company_name: name,
      company_name_normalized: name.toLowerCase(),
      company_website: null,
      company_domain: null,
      company_logo_url: null,
      source_portfolio_page_id: null,
      source_portfolio_url: null,
      source_href: null,
      matched_startup_id: null,
      match_confidence: null,
      status: 'active' as const,
      first_seen_at: new Date().toISOString(),
      last_seen_at: new Date().toISOString(),
      removed_at: null,
      confidence_score: 80,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

  const makeExtracted = (names: string[]): ExtractedCompany[] =>
    names.map(name => ({
      name,
      name_normalized: name.toLowerCase(),
      website: null,
      domain: null,
      href: null,
      logo_url: null,
      context: null,
    }));

  test('detects no changes when lists match', () => {
    const existing = makeExisting(['Acme', 'TechCo', 'Global']);
    const extracted = makeExtracted(['Acme', 'TechCo', 'Global']);

    const diff = computePortfolioDiff(existing, extracted, 'high');

    expect(diff.has_changes).toBe(false);
    expect(diff.added.length).toBe(0);
    expect(diff.removed.length).toBe(0);
    expect(diff.renamed.length).toBe(0);
  });

  test('detects added companies', () => {
    const existing = makeExisting(['Acme', 'TechCo']);
    const extracted = makeExtracted(['Acme', 'TechCo', 'NewStartup']);

    const diff = computePortfolioDiff(existing, extracted, 'high');

    expect(diff.has_changes).toBe(true);
    expect(diff.added.length).toBe(1);
    expect(diff.added[0].name).toBe('NewStartup');
  });

  test('detects removed companies', () => {
    const existing = makeExisting(['Acme', 'TechCo', 'OldCo']);
    const extracted = makeExtracted(['Acme', 'TechCo']);

    const diff = computePortfolioDiff(existing, extracted, 'high');

    expect(diff.has_changes).toBe(true);
    expect(diff.removed.length).toBe(1);
    expect(diff.removed[0].name).toBe('OldCo');
  });

  test('detects potential renames via fuzzy matching', () => {
    const existing = makeExisting(['Acme Corp', 'TechCo']);
    const extracted = makeExtracted(['Acme Corporation', 'TechCo']);

    const diff = computePortfolioDiff(existing, extracted, 'high');

    // Acme Corp -> Acme Corporation should be detected as rename
    expect(diff.renamed.length).toBe(1);
    expect(diff.renamed[0].old_name).toBe('Acme Corp');
    expect(diff.renamed[0].new_name).toBe('Acme Corporation');
  });

  test('calculates confidence based on extraction quality', () => {
    const existing = makeExisting(['Acme']);
    const extracted = makeExtracted(['Acme']);

    const highQualityDiff = computePortfolioDiff(existing, extracted, 'high');
    const lowQualityDiff = computePortfolioDiff(existing, extracted, 'uncertain');

    expect(highQualityDiff.confidence).toBeGreaterThan(lowQualityDiff.confidence);
  });
});
