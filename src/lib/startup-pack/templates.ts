import type { StartupTemplate } from '@/types';

export const STARTUP_PACK_TEMPLATES: StartupTemplate[] = [
  // ==================== CAP TABLE ====================
  {
    id: 'tpl-cap-table',
    sectionId: 'share-structure',
    title: 'Simple Cap Table Template',
    description: 'A basic capitalisation table for tracking share ownership',
    format: 'markdown',
    contentMarkdown: `# Cap Table - {{companyName}}

**Last Updated:** {{lastUpdated}}

## Share Summary

| Class | Authorised | Issued | Nominal Value |
|-------|-----------|--------|---------------|
| Ordinary | {{authorisedShares}} | {{issuedShares}} | £{{nominalValue}} |

## Shareholder Register

| Shareholder | Role | Shares | % Ownership | Vesting Status |
|-------------|------|--------|-------------|----------------|
| {{founder1Name}} | Founder | {{founder1Shares}} | {{founder1Percent}}% | {{founder1Vesting}} |
| {{founder2Name}} | Founder | {{founder2Shares}} | {{founder2Percent}}% | {{founder2Vesting}} |
| Option Pool | Reserved | {{optionPoolShares}} | {{optionPoolPercent}}% | N/A |
| **Total** | | **{{totalShares}}** | **100%** | |

## Option Pool

- **Size:** {{optionPoolPercent}}% ({{optionPoolShares}} shares)
- **Allocated:** {{allocatedOptions}} shares
- **Available:** {{availableOptions}} shares

## Notes

- All shares are ordinary shares with equal voting rights
- Vesting: 4-year vesting with 1-year cliff unless noted
- Share price: £{{sharePrice}} per share (as of {{valuationDate}})

---

*This is a simplified cap table for internal tracking. Maintain official share registers as required by law.*
`,
    variables: [
      { key: 'companyName', label: 'Company Name', required: true },
      { key: 'lastUpdated', label: 'Last Updated Date', default: new Date().toISOString().split('T')[0] },
      { key: 'authorisedShares', label: 'Authorised Shares', default: '10000' },
      { key: 'issuedShares', label: 'Issued Shares', default: '10000' },
      { key: 'nominalValue', label: 'Nominal Value', default: '0.01' },
      { key: 'founder1Name', label: 'Founder 1 Name', required: true },
      { key: 'founder1Shares', label: 'Founder 1 Shares', default: '4500' },
      { key: 'founder1Percent', label: 'Founder 1 %', default: '45' },
      { key: 'founder1Vesting', label: 'Founder 1 Vesting Status', default: '4-year, 1-year cliff' },
      { key: 'founder2Name', label: 'Founder 2 Name' },
      { key: 'founder2Shares', label: 'Founder 2 Shares', default: '4500' },
      { key: 'founder2Percent', label: 'Founder 2 %', default: '45' },
      { key: 'founder2Vesting', label: 'Founder 2 Vesting Status', default: '4-year, 1-year cliff' },
      { key: 'optionPoolShares', label: 'Option Pool Shares', default: '1000' },
      { key: 'optionPoolPercent', label: 'Option Pool %', default: '10' },
      { key: 'allocatedOptions', label: 'Allocated Options', default: '0' },
      { key: 'availableOptions', label: 'Available Options', default: '1000' },
      { key: 'totalShares', label: 'Total Shares', default: '10000' },
      { key: 'sharePrice', label: 'Share Price', default: '0.01' },
      { key: 'valuationDate', label: 'Valuation Date' },
    ],
    tags: ['cap-table', 'shares', 'equity'],
    disclaimers: [
      'This is a simplified tracking tool only.',
      'Maintain official statutory registers as required by the Companies Act.',
      'Consult an accountant for share valuations and tax implications.',
    ],
    lastUpdatedISO: '2026-01-14',
  },

  // ==================== VESTING MEMO ====================
  {
    id: 'tpl-vesting-memo',
    sectionId: 'share-structure',
    title: 'Founder Vesting Agreement Outline',
    description: 'Key terms to include in founder vesting arrangements',
    format: 'markdown',
    contentMarkdown: `# Founder Vesting Agreement - Key Terms

**Company:** {{companyName}}
**Date:** {{date}}

## Vesting Summary

| Founder | Total Shares | Vesting Period | Cliff | Start Date |
|---------|--------------|----------------|-------|------------|
| {{founder1Name}} | {{founder1Shares}} | {{vestingPeriod}} months | {{cliffPeriod}} months | {{vestingStartDate}} |
| {{founder2Name}} | {{founder2Shares}} | {{vestingPeriod}} months | {{cliffPeriod}} months | {{vestingStartDate}} |

## Key Terms

### 1. Vesting Schedule
- **Total Period:** {{vestingPeriod}} months ({{vestingYears}} years)
- **Cliff Period:** {{cliffPeriod}} months
- **Vesting Frequency:** Monthly after cliff
- **Acceleration:** [Single/Double trigger on change of control]

### 2. Cliff Details
- No shares vest until {{cliffPeriod}}-month cliff is reached
- At cliff: {{cliffPercent}}% of shares vest immediately
- Remaining shares vest monthly thereafter

### 3. Leaver Provisions

**Good Leaver:**
- Keeps all vested shares
- Unvested shares return to company at nominal value
- Good leaver events: death, disability, termination without cause

**Bad Leaver:**
- May lose some or all shares (vested and unvested)
- Buy-back at nominal value or fair market value (lower)
- Bad leaver events: resignation within cliff, termination for cause, breach of duties

### 4. Exercise and Transfer
- Shares subject to restrictions until fully vested
- Pre-emption rights apply to any proposed transfers
- Company has right of first refusal

## Next Steps

1. [ ] All founders agree to these terms
2. [ ] Engage lawyer to draft formal vesting agreement
3. [ ] Execute agreement and file appropriate notices
4. [ ] Update shareholders' agreement to reflect vesting

---

*This is an outline only. Work with a lawyer to create legally binding vesting agreements.*
`,
    variables: [
      { key: 'companyName', label: 'Company Name', required: true },
      { key: 'date', label: 'Date', default: new Date().toISOString().split('T')[0] },
      { key: 'founder1Name', label: 'Founder 1 Name', required: true },
      { key: 'founder1Shares', label: 'Founder 1 Shares' },
      { key: 'founder2Name', label: 'Founder 2 Name' },
      { key: 'founder2Shares', label: 'Founder 2 Shares' },
      { key: 'vestingPeriod', label: 'Vesting Period (months)', default: '48' },
      { key: 'vestingYears', label: 'Vesting Period (years)', default: '4' },
      { key: 'cliffPeriod', label: 'Cliff Period (months)', default: '12' },
      { key: 'cliffPercent', label: 'Cliff Vesting %', default: '25' },
      { key: 'vestingStartDate', label: 'Vesting Start Date' },
    ],
    tags: ['vesting', 'founders', 'equity'],
    disclaimers: [
      'This is an outline only, not a legal document.',
      'Consult a lawyer to create binding vesting agreements.',
      'Tax implications may apply - seek professional advice.',
    ],
    lastUpdatedISO: '2026-01-14',
  },

  // ==================== SEIS/EIS CHECKLIST ====================
  {
    id: 'tpl-seis-checklist',
    sectionId: 'seis-eis',
    title: 'SEIS/EIS Eligibility Checklist',
    description: 'Quick checklist to assess SEIS/EIS qualification',
    format: 'markdown',
    contentMarkdown: `# SEIS/EIS Eligibility Checklist

**Company:** {{companyName}}
**Date:** {{date}}

## SEIS Requirements

| Requirement | Status | Notes |
|-------------|--------|-------|
| UK permanent establishment | [ ] | Must have UK office/base |
| Fewer than 25 employees | [ ] | FTE count: _____ |
| Gross assets under £350,000 | [ ] | Current assets: £_____ |
| Less than 3 years old | [ ] | Incorporation date: {{incorporationDate}} |
| Not raised >£250,000 via SEIS | [ ] | Prior SEIS: £_____ |
| Qualifying trade | [ ] | SIC codes qualify |
| Not controlled by another company | [ ] | Independent |
| Shares are ordinary shares | [ ] | No preference shares |
| Money used for qualifying activity | [ ] | Business operations |

## EIS Requirements (additional to above)

| Requirement | Status | Notes |
|-------------|--------|-------|
| Fewer than 250 employees | [ ] | FTE count: _____ |
| Gross assets under £15m | [ ] | Current assets: £_____ |
| Less than 7 years old | [ ] | Or knowledge-intensive: 10 years |
| Not raised >£12m via EIS/VCT | [ ] | Prior raises: £_____ |
| Annual investment limit £5m | [ ] | Current year: £_____ |

## Excluded Activities (NOT eligible)

- [ ] Dealing in land, commodities, or financial instruments
- [ ] Leasing or hiring assets
- [ ] Receiving royalties or license fees
- [ ] Property development
- [ ] Operating hotels, nursing homes, or residential care
- [ ] Producing coal or steel
- [ ] Legal or accountancy services
- [ ] Farming or market gardening

## Risk Areas to Check

1. **Subsidiaries:** Do you have any? How are they funded?
2. **Connected persons:** Investors not connected to directors?
3. **Financial health:** Not "in difficulty" under EU guidelines?
4. **Use of funds:** Clear plan for investment?
5. **Trade start date:** When did you start trading?

## Next Steps

- [ ] Complete initial assessment above
- [ ] Engage SEIS/EIS specialist accountant
- [ ] Apply for Advance Assurance
- [ ] Prepare compliance documentation

---

*This checklist is for initial assessment only. SEIS/EIS rules are complex. Always seek professional advice.*
`,
    variables: [
      { key: 'companyName', label: 'Company Name', required: true },
      { key: 'date', label: 'Date', default: new Date().toISOString().split('T')[0] },
      { key: 'incorporationDate', label: 'Incorporation Date' },
    ],
    tags: ['seis', 'eis', 'eligibility', 'checklist'],
    disclaimers: [
      'This is a preliminary checklist only.',
      'SEIS/EIS rules are complex and change frequently.',
      'Always work with a qualified accountant for SEIS/EIS compliance.',
      'HMRC has final say on eligibility.',
    ],
    lastUpdatedISO: '2026-01-14',
  },

  // ==================== ADVANCE ASSURANCE CHECKLIST ====================
  {
    id: 'tpl-advance-assurance-checklist',
    sectionId: 'seis-eis',
    title: 'Advance Assurance Application Checklist',
    description: 'Documents needed for SEIS/EIS Advance Assurance',
    format: 'markdown',
    contentMarkdown: `# Advance Assurance Application Checklist

**Company:** {{companyName}}
**Applying for:** [ ] SEIS [ ] EIS [ ] Both

## Required Information

### Company Details
- [ ] Company name and number
- [ ] Registered address
- [ ] Date of incorporation
- [ ] SIC code(s)
- [ ] Website (if available)

### Business Description
- [ ] Clear description of business activities
- [ ] Products/services offered
- [ ] Target customers
- [ ] Revenue model
- [ ] Current stage (pre-revenue, trading, etc.)

### Financial Information
- [ ] Gross assets (balance sheet value)
- [ ] Number of employees (FTE)
- [ ] Previous SEIS/EIS/VCT funding
- [ ] Other state aid received

### Share Structure
- [ ] Total shares issued
- [ ] Share classes and rights
- [ ] Cap table with ownership percentages
- [ ] Any preference shares (likely disqualifying)

### Investment Details
- [ ] Amount seeking to raise
- [ ] Expected use of funds
- [ ] Breakdown of spending
- [ ] Timeline for use

### Supporting Documents
- [ ] Business plan or pitch deck
- [ ] Financial projections (optional but helpful)
- [ ] Management team CVs
- [ ] Latest accounts (if available)

## Common Reasons for Rejection

1. **Excluded trade** - Activity on the excluded list
2. **Connected investors** - Directors' family investing
3. **Financial difficulty** - Company not financially viable
4. **Use of funds** - Not for qualifying business purpose
5. **Control issues** - Company controlled by another

## Timeline

- Submit application via online form
- HMRC response: typically 4-6 weeks
- May request additional information
- Assurance valid for investment within stated parameters

## After Receiving Assurance

1. Raise investment as planned
2. Issue shares to investors
3. Submit compliance statement to HMRC
4. Receive authority to issue SEIS/EIS certificates
5. Issue certificates to investors

---

*Advance Assurance is not a guarantee. Final SEIS/EIS status confirmed after compliance statement review.*
`,
    variables: [
      { key: 'companyName', label: 'Company Name', required: true },
    ],
    tags: ['seis', 'eis', 'advance-assurance', 'hmrc'],
    disclaimers: [
      'Advance Assurance is indicative only, not a guarantee.',
      'Work with a qualified accountant to prepare your application.',
      'HMRC requirements may change.',
    ],
    lastUpdatedISO: '2026-01-14',
  },

  // ==================== INVESTOR SEIS EXPLAINER ====================
  {
    id: 'tpl-investor-seis-explainer',
    sectionId: 'seis-eis',
    title: 'SEIS/EIS Investor One-Pager',
    description: 'Simple explainer for potential investors on tax benefits',
    format: 'markdown',
    contentMarkdown: `# Investment in {{companyName}} - Tax Benefits Summary

## SEIS (Seed Enterprise Investment Scheme)

If you invest up to £{{seisAmount}} in {{companyName}}, you may be eligible for:

| Benefit | Value |
|---------|-------|
| **Income Tax Relief** | 50% of investment |
| **CGT Exemption** | 100% on SEIS shares (if held 3+ years) |
| **CGT Reinvestment Relief** | Defer gains from other investments |
| **Loss Relief** | Offset losses against income tax |

### Example: £{{seisAmount}} SEIS Investment

- Income tax relief: £{{seisIncomeTaxRelief}} (50%)
- Effective cost after relief: £{{seisEffectiveCost}}
- Maximum loss if company fails: £{{seisMaxLoss}} (after loss relief)

## EIS (Enterprise Investment Scheme)

For investments above SEIS limits, EIS offers:

| Benefit | Value |
|---------|-------|
| **Income Tax Relief** | 30% of investment |
| **CGT Exemption** | 100% on EIS shares (if held 3+ years) |
| **CGT Deferral Relief** | Defer gains from other investments |
| **Loss Relief** | Offset losses against income tax |

## Our Status

- [ ] Applied for SEIS Advance Assurance
- [ ] Applied for EIS Advance Assurance
- [ ] Received SEIS Advance Assurance
- [ ] Received EIS Advance Assurance

**Expected Assurance Date:** {{assuranceDate}}

## Key Requirements for You

To claim tax relief, you must:
- Be a UK taxpayer
- Not be connected to the company (employee, >30% shareholder, etc.)
- Hold shares for minimum 3 years
- Subscribe for new shares (not secondary purchase)

## Next Steps

1. Review our pitch deck and investment terms
2. Confirm your eligibility with your tax advisor
3. Complete subscription agreement
4. Receive SEIS/EIS certificate after we file with HMRC
5. Claim relief on your tax return

---

*This is a summary only. Tax rules are complex and individual circumstances vary. Please consult your own tax advisor before investing.*

**Contact:** {{contactEmail}}
`,
    variables: [
      { key: 'companyName', label: 'Company Name', required: true },
      { key: 'seisAmount', label: 'SEIS Investment Amount', default: '50000' },
      { key: 'seisIncomeTaxRelief', label: 'SEIS Income Tax Relief', default: '25000' },
      { key: 'seisEffectiveCost', label: 'SEIS Effective Cost', default: '25000' },
      { key: 'seisMaxLoss', label: 'SEIS Maximum Loss', default: '13750' },
      { key: 'assuranceDate', label: 'Expected Assurance Date' },
      { key: 'contactEmail', label: 'Contact Email', required: true },
    ],
    tags: ['seis', 'eis', 'investors', 'tax-relief'],
    disclaimers: [
      'This is a summary only, not tax advice.',
      'Tax rules are complex and individual circumstances vary.',
      'Investors should consult their own tax advisors.',
      'Tax relief is subject to HMRC approval and investor eligibility.',
    ],
    lastUpdatedISO: '2026-01-14',
  },

  // ==================== SHA TERM CHECKLIST ====================
  {
    id: 'tpl-sha-term-checklist',
    sectionId: 'shareholders-agreement',
    title: "Shareholders' Agreement - Key Terms Checklist",
    description: 'Terms to discuss and agree before engaging lawyers',
    format: 'markdown',
    contentMarkdown: `# Shareholders' Agreement - Key Terms Discussion

**Company:** {{companyName}}
**Founders:** {{founders}}
**Date:** {{date}}

## 1. Founder Vesting

| Term | Decision |
|------|----------|
| Vesting period | [ ] 3 years [ ] 4 years [ ] Other: _____ |
| Cliff period | [ ] 6 months [ ] 12 months [ ] Other: _____ |
| Acceleration on exit | [ ] Single trigger [ ] Double trigger [ ] None |

## 2. Leaver Provisions

| Scenario | Treatment |
|----------|-----------|
| Good leaver (death, disability, termination without cause) | [ ] Keep vested at FMV [ ] Keep vested at cost |
| Bad leaver (resignation in cliff, cause, breach) | [ ] Lose all [ ] Lose unvested at nominal |
| Voluntary resignation after cliff | [ ] Good leaver [ ] Bad leaver [ ] Intermediate |

## 3. Reserved Matters

Decisions requiring unanimous/majority shareholder approval:

- [ ] Issue new shares or securities
- [ ] Change share rights
- [ ] Declare dividends
- [ ] Borrow above £______
- [ ] Capital expenditure above £______
- [ ] Enter material contracts above £______
- [ ] Change business direction
- [ ] Hire/fire senior executives
- [ ] Sell substantial assets
- [ ] Wind up the company
- [ ] Change auditors/accountants

## 4. Board Composition

| Role | Appointed By |
|------|-------------|
| Founder directors | {{founderDirectors}} |
| Investor directors | {{investorDirectors}} |
| Independent directors | {{independentDirectors}} |
| Board chair | {{boardChair}} |
| Quorum requirement | {{quorum}} |

## 5. Transfer Restrictions

- [ ] Pre-emption rights (existing shareholders first)
- [ ] Tag-along rights (minorities can join majority sale)
- [ ] Drag-along rights (majority can force sale - at what threshold? ____%)
- [ ] Lock-up period: _____ months/years
- [ ] Permitted transfers (family trusts, etc.)

## 6. Exit Provisions

| Scenario | Process |
|----------|---------|
| Trade sale | Drag-along at ____% threshold |
| IPO | Lock-up for _____ months |
| Liquidation | Pro-rata distribution |

## 7. Deadlock Resolution

If shareholders can't agree:
- [ ] Mediation first
- [ ] Arbitration
- [ ] Buy-out mechanism
- [ ] Russian roulette clause

## 8. Non-Compete & Confidentiality

| Restriction | Duration |
|-------------|----------|
| Non-compete | _____ months after leaving |
| Non-solicit (employees) | _____ months |
| Non-solicit (customers) | _____ months |
| Confidentiality | Perpetual / _____ years |

## Next Steps

1. [ ] All founders discussed and agreed above terms
2. [ ] Document any special arrangements
3. [ ] Brief lawyer with agreed position
4. [ ] Review draft from lawyer
5. [ ] Final negotiation and signing

---

*Use this to align before engaging lawyers. Changes during legal drafting are expensive.*
`,
    variables: [
      { key: 'companyName', label: 'Company Name', required: true },
      { key: 'founders', label: 'Founder Names', required: true },
      { key: 'date', label: 'Date', default: new Date().toISOString().split('T')[0] },
      { key: 'founderDirectors', label: 'Founder Directors' },
      { key: 'investorDirectors', label: 'Investor Directors' },
      { key: 'independentDirectors', label: 'Independent Directors' },
      { key: 'boardChair', label: 'Board Chair' },
      { key: 'quorum', label: 'Quorum Requirement', default: '2 directors' },
    ],
    tags: ['shareholders-agreement', 'governance', 'founders'],
    disclaimers: [
      'This is a discussion guide, not a legal document.',
      'Always work with a qualified lawyer on shareholder agreements.',
      'Terms may need adjustment based on legal advice.',
    ],
    lastUpdatedISO: '2026-01-14',
  },

  // ==================== SHA OUTLINE ====================
  {
    id: 'tpl-sha-outline',
    sectionId: 'shareholders-agreement',
    title: "Shareholders' Agreement Outline",
    description: 'Structure and key sections for a shareholders agreement',
    format: 'markdown',
    contentMarkdown: `# Shareholders' Agreement Outline

**{{companyName}}**

## Parties

1. The Company: {{companyName}} (company number: {{companyNumber}})
2. Shareholders:
   - {{founder1Name}} ({{founder1Percent}}%)
   - {{founder2Name}} ({{founder2Percent}}%)

## Recitals

- The Company was incorporated on {{incorporationDate}}
- The Shareholders wish to regulate their relationship
- This Agreement supplements the Articles of Association

## Key Sections

### 1. Definitions and Interpretation
- Define key terms (Business, Fair Market Value, Good/Bad Leaver, etc.)

### 2. The Business
- Nature of business activities
- Commitment to business plan
- Restrictions on activities outside scope

### 3. Share Capital
- Current shareholdings
- Future issues subject to pre-emption
- No creation of other share classes without consent

### 4. Founder Vesting
- Vesting schedule (4 years, 1-year cliff)
- Treatment of shares on departure
- Acceleration provisions

### 5. Good Leaver / Bad Leaver
- Define each category
- Treatment of vested/unvested shares
- Valuation methodology
- Payment terms

### 6. Reserved Matters
- Matters requiring shareholder approval
- Thresholds and voting requirements
- Investor consent rights (if applicable)

### 7. Board and Management
- Board composition
- Appointment/removal of directors
- Meeting frequency and quorum
- Observer rights (if applicable)

### 8. Transfer of Shares
- Pre-emption rights
- Tag-along rights
- Drag-along rights
- Permitted transfers

### 9. Exit Provisions
- Sale process
- Distribution of proceeds
- IPO provisions
- Liquidation

### 10. Confidentiality
- Scope of confidential information
- Duration of obligations
- Permitted disclosures

### 11. Non-Compete
- Scope of restriction
- Geographic area
- Duration
- Non-solicitation of employees/customers

### 12. Deadlock Resolution
- Definition of deadlock
- Escalation procedure
- Resolution mechanisms

### 13. Warranties
- Shareholder warranties
- Survival period

### 14. General Provisions
- Notices
- Governing law
- Dispute resolution
- Amendments
- Entire agreement

## Schedules

- Schedule 1: Shareholders and Shareholdings
- Schedule 2: Reserved Matters
- Schedule 3: Vesting Schedule
- Schedule 4: Deed of Adherence (for new shareholders)

---

*This is an outline only. Work with a qualified lawyer to draft your actual agreement.*
`,
    variables: [
      { key: 'companyName', label: 'Company Name', required: true },
      { key: 'companyNumber', label: 'Company Number' },
      { key: 'incorporationDate', label: 'Incorporation Date' },
      { key: 'founder1Name', label: 'Founder 1 Name', required: true },
      { key: 'founder1Percent', label: 'Founder 1 %' },
      { key: 'founder2Name', label: 'Founder 2 Name' },
      { key: 'founder2Percent', label: 'Founder 2 %' },
    ],
    tags: ['shareholders-agreement', 'legal', 'governance'],
    disclaimers: [
      'THIS IS AN OUTLINE ONLY - NOT A LEGAL DOCUMENT.',
      'Work with a qualified solicitor to draft your actual agreement.',
      'Terms should be customized to your specific situation.',
      'Do not use this as a substitute for proper legal advice.',
    ],
    lastUpdatedISO: '2026-01-14',
  },

  // ==================== ARTICLES CUSTOMIZATION ====================
  {
    id: 'tpl-articles-customization-checklist',
    sectionId: 'articles',
    title: 'Articles Customization Decision Checklist',
    description: 'Decide whether you need custom articles or can use Model Articles',
    format: 'markdown',
    contentMarkdown: `# Articles of Association - Customization Decision

**Company:** {{companyName}}

## Do You Need Custom Articles?

Answer these questions to decide:

### Share Structure
- [ ] Do you need multiple share classes? (e.g., ordinary + preference)
- [ ] Do you need shares with different voting rights?
- [ ] Do you need shares with different dividend rights?
- [ ] Do you need shares with different liquidation preferences?

**If yes to any above: likely need custom articles**

### Governance
- [ ] Do you need investor director appointment rights?
- [ ] Do you need specific board composition requirements?
- [ ] Do you need weighted voting on certain matters?
- [ ] Do you need specific quorum requirements?

**If yes to any above: consider custom articles**

### Transfer Restrictions
- [ ] Do you need more restrictive transfer provisions than Model Articles?
- [ ] Do you need specific pre-emption processes?
- [ ] Do you need different rules for different share classes?

**If yes to any above: custom articles may help**

## Model Articles May Be Fine If:

- [ ] Single class of ordinary shares
- [ ] Simple one-share-one-vote structure
- [ ] No complex governance requirements
- [ ] Standard transfer restrictions acceptable
- [ ] No current investors requiring specific terms

## Recommendation

Based on your answers:

**Use Model Articles if:**
- Pre-seed/early stage
- Solo founder or simple co-founder structure
- No outside investors yet
- Planning to customize later when raising

**Use Custom Articles if:**
- Taking investment now
- Multiple share classes needed
- Complex governance requirements
- Investors requiring specific provisions

## Common Customizations

| Provision | Model Articles | Common Custom |
|-----------|---------------|---------------|
| Pre-emption | Basic rights | Detailed process + exceptions |
| Director removal | Ordinary resolution | Enhanced protection |
| Share transfers | Board approval | Detailed mechanics |
| Drag-along | Not included | Often added for exit |
| Tag-along | Not included | Often added for minority protection |

---

*When in doubt, start with Model Articles and customize when you have specific requirements.*
`,
    variables: [
      { key: 'companyName', label: 'Company Name', required: true },
    ],
    tags: ['articles', 'governance', 'model-articles'],
    disclaimers: [
      'This is a decision guide, not legal advice.',
      'Consult a lawyer for specific recommendations.',
    ],
    lastUpdatedISO: '2026-01-14',
  },

  // ==================== DATA ROOM INDEX ====================
  {
    id: 'tpl-data-room-index',
    sectionId: 'fundraising',
    title: 'Data Room Folder Structure',
    description: 'Standard data room organization for investor due diligence',
    format: 'markdown',
    contentMarkdown: `# Data Room Index - {{companyName}}

**Prepared for:** {{roundName}}
**Last Updated:** {{lastUpdated}}

## Folder Structure

\`\`\`
📁 {{companyName}} Data Room
├── 📁 1. Corporate
│   ├── Certificate of Incorporation
│   ├── Articles of Association
│   ├── Shareholders' Agreement
│   ├── Current Cap Table
│   ├── Share Certificates
│   ├── Board Resolutions
│   ├── Shareholder Resolutions
│   └── PSC Register
│
├── 📁 2. Financial
│   ├── Historical Accounts
│   ├── Management Accounts (current year)
│   ├── Financial Model / Projections
│   ├── Monthly Burn Analysis
│   ├── Runway Calculation
│   ├── Bank Statements (3 months)
│   └── Creditor/Debtor Aging
│
├── 📁 3. Commercial
│   ├── Customer Contracts
│   ├── Revenue Breakdown
│   ├── Pipeline Summary
│   ├── Pricing Documentation
│   ├── Customer Testimonials
│   └── Case Studies
│
├── 📁 4. Product
│   ├── Product Demo / Screenshots
│   ├── Product Roadmap
│   ├── Technical Architecture
│   ├── Key Metrics Dashboard
│   └── Competitive Analysis
│
├── 📁 5. Team
│   ├── Founder CVs / Bios
│   ├── Org Chart
│   ├── Key Hire Plan
│   ├── Employment Contracts (key staff)
│   └── Advisor Agreements
│
├── 📁 6. Legal & IP
│   ├── IP Assignment Agreements
│   ├── Trademark Registrations
│   ├── Patent Applications (if any)
│   ├── Domain Ownership Proof
│   ├── Terms of Service
│   └── Privacy Policy
│
├── 📁 7. Compliance
│   ├── SEIS/EIS Advance Assurance
│   ├── GDPR Documentation
│   ├── Regulatory Filings (if applicable)
│   └── Insurance Policies
│
└── 📁 8. Fundraising Materials
    ├── Pitch Deck
    ├── Executive Summary
    ├── Investment Memo
    └── Term Sheet (when agreed)
\`\`\`

## Document Checklist

### Critical (Must Have)
- [ ] Certificate of Incorporation
- [ ] Articles of Association
- [ ] Current Cap Table
- [ ] Financial Model
- [ ] Pitch Deck
- [ ] Founder CVs

### Important (Should Have)
- [ ] Shareholders' Agreement
- [ ] Management Accounts
- [ ] Customer Contracts (top 3-5)
- [ ] IP Assignment Agreements
- [ ] Product Demo
- [ ] SEIS/EIS Advance Assurance

### Good to Have
- [ ] Board Resolutions
- [ ] Employment Contracts
- [ ] Detailed Product Roadmap
- [ ] Competitive Analysis
- [ ] Customer Testimonials

---

*Keep your data room updated throughout the fundraising process. Investors appreciate organization.*
`,
    variables: [
      { key: 'companyName', label: 'Company Name', required: true },
      { key: 'roundName', label: 'Round Name', default: 'Pre-Seed Round' },
      { key: 'lastUpdated', label: 'Last Updated', default: new Date().toISOString().split('T')[0] },
    ],
    tags: ['fundraising', 'data-room', 'due-diligence'],
    lastUpdatedISO: '2026-01-14',
  },

  // ==================== PITCH DECK OUTLINE ====================
  {
    id: 'tpl-pitch-deck-outline',
    sectionId: 'fundraising',
    title: 'Pitch Deck Structure',
    description: '12-slide pitch deck template for seed-stage startups',
    format: 'markdown',
    contentMarkdown: `# Pitch Deck Outline - {{companyName}}

## Slide-by-Slide Structure

### 1. Title Slide
- Company name and logo
- Tagline (one sentence value prop)
- Your name and contact
- Round: "Raising {{raiseAmount}} {{roundType}}"

### 2. Problem
- What pain are you solving?
- Who experiences this pain?
- How big is the problem?
- Why does it matter now?

### 3. Solution
- How do you solve the problem?
- What's your unique approach?
- Why is it better than alternatives?

### 4. Product
- Screenshots or demo
- Key features
- How it works (simple)
- User experience

### 5. Market
- TAM (Total Addressable Market)
- SAM (Serviceable Addressable Market)
- SOM (Serviceable Obtainable Market)
- Market trends supporting your thesis

### 6. Business Model
- How do you make money?
- Pricing model
- Unit economics (if available)
- Path to profitability

### 7. Traction
- Key metrics
- Growth rate
- Customer logos/testimonials
- Milestones achieved

### 8. Competition
- Competitive landscape
- Your differentiation
- Barriers to entry
- Why you'll win

### 9. Go-to-Market
- Customer acquisition strategy
- Sales process
- Marketing channels
- Partnerships

### 10. Team
- Founder backgrounds
- Why you're the right team
- Key hires made/planned
- Advisors (if notable)

### 11. Financials
- Revenue projections (3 years)
- Key assumptions
- Burn rate and runway
- Path to next milestones

### 12. The Ask
- Amount raising: {{raiseAmount}}
- Use of funds breakdown
- Timeline and milestones
- What you're looking for (beyond money)

## Key Tips

**Do:**
- Keep to 12-15 slides
- One key message per slide
- Use visuals over text
- Tell a story
- Show momentum

**Don't:**
- Overcrowd slides
- Use tiny fonts
- Include everything
- Hide weaknesses
- Make unrealistic projections

---

*Practice your pitch until you can deliver it in 3 minutes, 10 minutes, or 30 minutes as needed.*
`,
    variables: [
      { key: 'companyName', label: 'Company Name', required: true },
      { key: 'raiseAmount', label: 'Raise Amount', default: '£500K' },
      { key: 'roundType', label: 'Round Type', default: 'Pre-Seed' },
    ],
    tags: ['pitch', 'fundraising', 'deck'],
    lastUpdatedISO: '2026-01-14',
  },

  // ==================== INVESTOR UPDATE ====================
  {
    id: 'tpl-investor-update',
    sectionId: 'fundraising',
    title: 'Monthly Investor Update Template',
    description: 'Structure for keeping investors informed',
    format: 'markdown',
    contentMarkdown: `# {{companyName}} - Investor Update

**{{month}} {{year}}**

## TL;DR

{{tldr}}

## Key Metrics

| Metric | This Month | Last Month | MoM Change |
|--------|-----------|------------|------------|
| Revenue | {{revenue}} | {{lastRevenue}} | {{revenueChange}} |
| Users | {{users}} | {{lastUsers}} | {{usersChange}} |
| Burn | {{burn}} | {{lastBurn}} | {{burnChange}} |
| Runway | {{runway}} months | - | - |

## Highlights ✅

1. {{highlight1}}
2. {{highlight2}}
3. {{highlight3}}

## Challenges ⚠️

1. {{challenge1}}
2. {{challenge2}}

## Asks 🙏

{{asks}}

## What's Next

- **This Month:** {{thisMonth}}
- **Next Quarter:** {{nextQuarter}}

## Team Update

{{teamUpdate}}

---

*Thank you for your support. Happy to jump on a call if you'd like to discuss anything.*

**{{founderName}}**
{{founderEmail}}
`,
    variables: [
      { key: 'companyName', label: 'Company Name', required: true },
      { key: 'month', label: 'Month', default: 'January' },
      { key: 'year', label: 'Year', default: '2026' },
      { key: 'tldr', label: 'TL;DR Summary', placeholder: '2-3 sentence summary of the month' },
      { key: 'revenue', label: 'Revenue (This Month)' },
      { key: 'lastRevenue', label: 'Revenue (Last Month)' },
      { key: 'revenueChange', label: 'Revenue Change %' },
      { key: 'users', label: 'Users (This Month)' },
      { key: 'lastUsers', label: 'Users (Last Month)' },
      { key: 'usersChange', label: 'Users Change %' },
      { key: 'burn', label: 'Monthly Burn' },
      { key: 'lastBurn', label: 'Last Month Burn' },
      { key: 'burnChange', label: 'Burn Change' },
      { key: 'runway', label: 'Runway (Months)' },
      { key: 'highlight1', label: 'Highlight 1' },
      { key: 'highlight2', label: 'Highlight 2' },
      { key: 'highlight3', label: 'Highlight 3' },
      { key: 'challenge1', label: 'Challenge 1' },
      { key: 'challenge2', label: 'Challenge 2' },
      { key: 'asks', label: 'Asks (Intros, Advice, etc.)' },
      { key: 'thisMonth', label: 'This Month Focus' },
      { key: 'nextQuarter', label: 'Next Quarter Goals' },
      { key: 'teamUpdate', label: 'Team Update' },
      { key: 'founderName', label: 'Founder Name', required: true },
      { key: 'founderEmail', label: 'Founder Email', required: true },
    ],
    tags: ['investor-update', 'fundraising', 'communication'],
    lastUpdatedISO: '2026-01-14',
  },

  // ==================== TRADEMARK FILING CHECKLIST ====================
  {
    id: 'tpl-trademark-filing-checklist',
    sectionId: 'ip-trademarks',
    title: 'UK Trademark Filing Checklist',
    description: 'Prepare for your UK IPO trademark application',
    format: 'markdown',
    contentMarkdown: `# UK Trademark Filing Checklist

**Brand/Mark:** {{brandName}}
**Date:** {{date}}

## Pre-Filing Checks

### 1. Trademark Search
- [ ] Searched UK IPO database for identical marks
- [ ] Searched for similar marks in same classes
- [ ] Checked Companies House for conflicting company names
- [ ] Checked domain availability
- [ ] Searched social media handles

### 2. Mark Assessment
- [ ] Mark is distinctive (not generic or descriptive)
- [ ] Mark doesn't contain prohibited elements
- [ ] Have clear representation of the mark (word/logo)
- [ ] Decided: word mark, figurative mark, or both?

### 3. Class Selection

Common classes for tech/SaaS startups:

| Class | Description | Relevant? |
|-------|-------------|-----------|
| 9 | Software, apps, downloadable content | [ ] |
| 35 | Business services, advertising, retail | [ ] |
| 38 | Telecommunications, streaming | [ ] |
| 41 | Education, entertainment, training | [ ] |
| 42 | SaaS, IT services, design, hosting | [ ] |

**Selected classes:** {{selectedClasses}}

## Application Details

### Mark Information
- **Type:** [ ] Word mark [ ] Figurative (logo) [ ] Combined
- **Mark text:** {{markText}}
- **Logo file:** [ ] Prepared (JPEG, min 400x400px)
- **Color claim:** [ ] Yes [ ] No (greyscale)

### Applicant Details
- **Applicant:** {{companyName}}
- **Company number:** {{companyNumber}}
- **Address:** {{address}}
- **Email:** {{email}}

### Goods/Services Description
For each class, describe specific goods/services:

{{goodsServicesDescription}}

## Cost Calculation

| Item | Cost |
|------|------|
| First class | £170 |
| Additional classes | £50 × {{additionalClasses}} = £{{additionalCost}} |
| **Total** | **£{{totalCost}}** |

## Timeline

| Stage | Duration |
|-------|----------|
| Examination | 2-3 weeks |
| Publication | 2 months |
| Registration | If no opposition |
| **Total** | ~4 months |

## Post-Filing

- [ ] Monitor for examination reports
- [ ] Respond to any objections within deadline
- [ ] Watch for opposition during publication
- [ ] Receive registration certificate
- [ ] Set up renewal reminder (10 years)

---

*Consider using a trademark attorney for complex applications or if you expect opposition.*
`,
    variables: [
      { key: 'brandName', label: 'Brand/Mark Name', required: true },
      { key: 'date', label: 'Date', default: new Date().toISOString().split('T')[0] },
      { key: 'selectedClasses', label: 'Selected Classes' },
      { key: 'markText', label: 'Mark Text' },
      { key: 'companyName', label: 'Company Name', required: true },
      { key: 'companyNumber', label: 'Company Number' },
      { key: 'address', label: 'Address' },
      { key: 'email', label: 'Email' },
      { key: 'goodsServicesDescription', label: 'Goods/Services Description' },
      { key: 'additionalClasses', label: 'Number of Additional Classes', default: '1' },
      { key: 'additionalCost', label: 'Additional Classes Cost', default: '50' },
      { key: 'totalCost', label: 'Total Cost', default: '220' },
    ],
    tags: ['trademark', 'ip', 'brand'],
    lastUpdatedISO: '2026-01-14',
  },

  // ==================== BRAND ASSETS CHECKLIST ====================
  {
    id: 'tpl-brand-assets-checklist',
    sectionId: 'ip-trademarks',
    title: 'Brand Assets Checklist',
    description: 'Document your brand elements for consistency',
    format: 'markdown',
    contentMarkdown: `# Brand Assets - {{companyName}}

**Last Updated:** {{lastUpdated}}

## Core Brand Elements

### Company Name
- **Legal name:** {{legalName}}
- **Trading name:** {{tradingName}}
- **Trademark status:** [ ] Registered [ ] Pending [ ] Not registered

### Logo
- [ ] Primary logo (color)
- [ ] Primary logo (white/reversed)
- [ ] Primary logo (black)
- [ ] Icon/mark only version
- [ ] Horizontal version
- [ ] Square/social version

**Logo files location:** {{logoLocation}}

### Colors

| Color | Hex | RGB | Usage |
|-------|-----|-----|-------|
| Primary | {{primaryHex}} | {{primaryRGB}} | Main brand color |
| Secondary | {{secondaryHex}} | {{secondaryRGB}} | Accents |
| Dark | {{darkHex}} | {{darkRGB}} | Text, backgrounds |
| Light | {{lightHex}} | {{lightRGB}} | Backgrounds |

### Typography

| Usage | Font | Weight |
|-------|------|--------|
| Headings | {{headingFont}} | {{headingWeight}} |
| Body | {{bodyFont}} | {{bodyWeight}} |
| Code/UI | {{monoFont}} | Regular |

### Tagline
**Primary:** {{tagline}}

## Digital Assets

### Domain Names
| Domain | Status | Renewal |
|--------|--------|---------|
| {{primaryDomain}} | [ ] Owned | {{primaryRenewal}} |
| {{secondaryDomain}} | [ ] Owned | {{secondaryRenewal}} |

### Social Handles
| Platform | Handle | Status |
|----------|--------|--------|
| Twitter/X | @{{twitterHandle}} | [ ] Claimed |
| LinkedIn | {{linkedinHandle}} | [ ] Claimed |
| Instagram | @{{instagramHandle}} | [ ] Claimed |
| GitHub | {{githubHandle}} | [ ] Claimed |

### Email Addresses
- info@{{domain}}
- hello@{{domain}}
- support@{{domain}}
- founders@{{domain}}

## Brand Guidelines

- [ ] Logo usage rules documented
- [ ] Color palette defined
- [ ] Typography hierarchy set
- [ ] Tone of voice guidelines
- [ ] Example applications

---

*Keep this updated and share with anyone creating brand materials.*
`,
    variables: [
      { key: 'companyName', label: 'Company Name', required: true },
      { key: 'lastUpdated', label: 'Last Updated', default: new Date().toISOString().split('T')[0] },
      { key: 'legalName', label: 'Legal Company Name' },
      { key: 'tradingName', label: 'Trading Name' },
      { key: 'logoLocation', label: 'Logo Files Location' },
      { key: 'primaryHex', label: 'Primary Color Hex', default: '#3B82F6' },
      { key: 'primaryRGB', label: 'Primary Color RGB', default: '59, 130, 246' },
      { key: 'secondaryHex', label: 'Secondary Color Hex' },
      { key: 'secondaryRGB', label: 'Secondary Color RGB' },
      { key: 'darkHex', label: 'Dark Color Hex', default: '#1E293B' },
      { key: 'darkRGB', label: 'Dark Color RGB' },
      { key: 'lightHex', label: 'Light Color Hex', default: '#F8FAFC' },
      { key: 'lightRGB', label: 'Light Color RGB' },
      { key: 'headingFont', label: 'Heading Font' },
      { key: 'headingWeight', label: 'Heading Weight', default: 'Bold' },
      { key: 'bodyFont', label: 'Body Font' },
      { key: 'bodyWeight', label: 'Body Weight', default: 'Regular' },
      { key: 'monoFont', label: 'Monospace Font', default: 'JetBrains Mono' },
      { key: 'tagline', label: 'Company Tagline' },
      { key: 'primaryDomain', label: 'Primary Domain' },
      { key: 'primaryRenewal', label: 'Primary Domain Renewal Date' },
      { key: 'secondaryDomain', label: 'Secondary Domain' },
      { key: 'secondaryRenewal', label: 'Secondary Domain Renewal Date' },
      { key: 'twitterHandle', label: 'Twitter Handle' },
      { key: 'linkedinHandle', label: 'LinkedIn Handle' },
      { key: 'instagramHandle', label: 'Instagram Handle' },
      { key: 'githubHandle', label: 'GitHub Handle' },
      { key: 'domain', label: 'Email Domain' },
    ],
    tags: ['brand', 'assets', 'design'],
    lastUpdatedISO: '2026-01-14',
  },

  // ==================== BOOKKEEPING CATEGORIES ====================
  {
    id: 'tpl-bookkeeping-categories',
    sectionId: 'banking-tax',
    title: 'Startup Bookkeeping Categories',
    description: 'Chart of accounts structure for early-stage startups',
    format: 'markdown',
    contentMarkdown: `# Bookkeeping Categories - {{companyName}}

## Income Categories

| Code | Category | Description |
|------|----------|-------------|
| 4000 | Product Revenue | Core product/service sales |
| 4010 | Subscription Revenue | Recurring subscription income |
| 4020 | Services Revenue | Consulting, implementation |
| 4030 | Other Income | Interest, grants, misc |

## Cost of Sales

| Code | Category | Description |
|------|----------|-------------|
| 5000 | Hosting & Infrastructure | AWS, GCP, servers |
| 5010 | Third-party Software | APIs, tools for product |
| 5020 | Payment Processing | Stripe fees, etc. |
| 5030 | Customer Support Tools | Intercom, Zendesk |

## Operating Expenses

### People
| Code | Category | Description |
|------|----------|-------------|
| 6000 | Salaries & Wages | Employee compensation |
| 6010 | Employer NI | National Insurance |
| 6020 | Pension Contributions | Employer pension |
| 6030 | Contractor Costs | Freelancers, agencies |
| 6040 | Recruitment | Job ads, recruiter fees |
| 6050 | Training & Development | Courses, conferences |

### Operations
| Code | Category | Description |
|------|----------|-------------|
| 6100 | Rent & Rates | Office, coworking |
| 6110 | Utilities | Electric, internet |
| 6120 | Insurance | Business, D&O, cyber |
| 6130 | Office Supplies | Equipment, furniture |
| 6140 | Travel & Subsistence | Business travel |

### Professional Services
| Code | Category | Description |
|------|----------|-------------|
| 6200 | Legal Fees | Lawyers, contracts |
| 6210 | Accounting & Bookkeeping | Accountant fees |
| 6220 | Audit Fees | If required |
| 6230 | Consultancy | Advisors, specialists |

### Sales & Marketing
| Code | Category | Description |
|------|----------|-------------|
| 6300 | Advertising | Paid ads, sponsorships |
| 6310 | Marketing Tools | CRM, email, analytics |
| 6320 | PR & Comms | PR agency, press |
| 6330 | Events & Sponsorship | Conferences, meetups |
| 6340 | Sales Tools | Outreach, demos |

### Software & Tools
| Code | Category | Description |
|------|----------|-------------|
| 6400 | Productivity Software | Slack, Notion, etc. |
| 6410 | Development Tools | GitHub, testing, CI/CD |
| 6420 | Design Tools | Figma, Adobe |
| 6430 | Finance Software | Xero, payroll |

### R&D
| Code | Category | Description |
|------|----------|-------------|
| 6500 | R&D Costs | Development, prototyping |
| 6510 | Patents & IP | Filing, maintenance |

### Bank & Finance
| Code | Category | Description |
|------|----------|-------------|
| 6600 | Bank Charges | Fees, FX |
| 6610 | Interest Paid | Loan interest |
| 6620 | Bad Debts | Write-offs |

### Other
| Code | Category | Description |
|------|----------|-------------|
| 6900 | Depreciation | Asset depreciation |
| 6910 | Sundry Expenses | Miscellaneous |

## Tips

1. **Be consistent** - Use the same category for similar expenses
2. **Receipt per transaction** - Keep proof for everything
3. **Monthly reconciliation** - Match bank to books monthly
4. **VAT tracking** - Mark VAT-able expenses clearly
5. **R&D tracking** - Separate R&D costs for potential tax credits

---

*Customize categories to match your business. Consult your accountant.*
`,
    variables: [
      { key: 'companyName', label: 'Company Name', required: true },
    ],
    tags: ['bookkeeping', 'accounting', 'finance'],
    lastUpdatedISO: '2026-01-14',
  },

  // ==================== IP ASSIGNMENT CHECKLIST ====================
  {
    id: 'tpl-ip-assignment-checklist',
    sectionId: 'employment',
    title: 'IP Assignment Checklist',
    description: 'Ensure all IP rights are properly assigned to the company',
    format: 'markdown',
    contentMarkdown: `# IP Assignment Checklist - {{companyName}}

## Why This Matters

Without proper IP assignment, creators may own their work - even if you paid them. This can cause problems when:
- Raising investment (investors will check)
- Selling the company (buyer needs clean IP)
- A team member leaves (they could claim ownership)

## Who Needs to Sign

### Founders
| Name | Role | IP Agreement | Date Signed |
|------|------|-------------|-------------|
| {{founder1}} | Co-founder | [ ] Signed | {{founder1Date}} |
| {{founder2}} | Co-founder | [ ] Signed | {{founder2Date}} |

### Employees
| Name | Role | IP Agreement | Date Signed |
|------|------|-------------|-------------|
| | | [ ] | |

### Contractors
| Name | Services | IP Agreement | Date Signed |
|------|----------|-------------|-------------|
| | | [ ] | |

### Advisors
| Name | Role | IP Agreement | Date Signed |
|------|------|-------------|-------------|
| | | [ ] | |

## What to Cover

### In Employment Contracts
- [ ] Assignment of all work-related IP to company
- [ ] Moral rights waiver where permitted
- [ ] Confirmation of no prior IP conflicts
- [ ] Ongoing duty to assign future IP

### In Contractor Agreements
- [ ] Clear scope of work and deliverables
- [ ] Full assignment of IP in deliverables
- [ ] Warranties of originality
- [ ] No third-party IP included without disclosure

### Pre-existing IP
Document any IP that existed before company formation:

| IP Description | Creator | Status | Notes |
|----------------|---------|--------|-------|
| | | [ ] Assigned [ ] Licensed | |

## Common Gaps

Watch out for:
- [ ] Work done before incorporation
- [ ] Freelancers without written agreements
- [ ] Open source contributions
- [ ] Work done in personal time
- [ ] University/employer IP from prior jobs

## Action Items

1. [ ] Audit all team members for IP agreements
2. [ ] Review all contractor agreements
3. [ ] Document any pre-existing IP
4. [ ] Address any gaps immediately
5. [ ] Create standard templates for future hires

---

*Get this sorted early. It's much harder to fix after the fact.*
`,
    variables: [
      { key: 'companyName', label: 'Company Name', required: true },
      { key: 'founder1', label: 'Founder 1 Name' },
      { key: 'founder1Date', label: 'Founder 1 Sign Date' },
      { key: 'founder2', label: 'Founder 2 Name' },
      { key: 'founder2Date', label: 'Founder 2 Sign Date' },
    ],
    tags: ['ip', 'employment', 'contracts'],
    disclaimers: [
      'Use proper legal agreements - not just a checklist.',
      'Work with a lawyer to create IP assignment documents.',
    ],
    lastUpdatedISO: '2026-01-14',
  },

  // ==================== CONTRACTOR ONBOARDING ====================
  {
    id: 'tpl-contractor-onboarding-checklist',
    sectionId: 'employment',
    title: 'Contractor Onboarding Checklist',
    description: 'Properly onboard freelancers and contractors',
    format: 'markdown',
    contentMarkdown: `# Contractor Onboarding - {{contractorName}}

**Company:** {{companyName}}
**Start Date:** {{startDate}}
**Engagement:** {{engagement}}

## Before Starting

### Legal & Compliance
- [ ] Consultancy/contractor agreement signed
- [ ] IP assignment included in agreement
- [ ] Confidentiality provisions confirmed
- [ ] IR35 status assessed (inside/outside)
- [ ] Right to work verified (if applicable)

### Commercial
- [ ] Rate agreed: {{rate}} per {{rateUnit}}
- [ ] Payment terms: {{paymentTerms}}
- [ ] Invoice process explained
- [ ] Scope of work documented
- [ ] Deliverables defined

## First Day

### Access Setup
- [ ] Email account created (if needed): {{email}}
- [ ] Slack/Teams access granted
- [ ] GitHub/GitLab access (if needed)
- [ ] Relevant shared drives
- [ ] Project management tool access

### Information Provided
- [ ] Company overview and context
- [ ] Point of contact introduced
- [ ] Project brief shared
- [ ] Relevant documentation access
- [ ] Communication expectations set

### Security
- [ ] Security policy acknowledged
- [ ] Device requirements confirmed
- [ ] Password manager invite sent
- [ ] 2FA set up on critical accounts

## Ongoing

### Communication
- [ ] Weekly check-in scheduled
- [ ] Reporting process agreed
- [ ] Escalation path clear

### Deliverables
- [ ] Milestone schedule agreed
- [ ] Review process defined
- [ ] Acceptance criteria clear

## Offboarding Prep

Know this from day one:
- Notice period: {{noticePeriod}}
- Handover requirements
- Access revocation process
- Final deliverables and IP transfer

---

*Update this checklist for each new contractor.*
`,
    variables: [
      { key: 'contractorName', label: 'Contractor Name', required: true },
      { key: 'companyName', label: 'Company Name', required: true },
      { key: 'startDate', label: 'Start Date' },
      { key: 'engagement', label: 'Engagement Description' },
      { key: 'rate', label: 'Rate' },
      { key: 'rateUnit', label: 'Rate Unit', default: 'day' },
      { key: 'paymentTerms', label: 'Payment Terms', default: '14 days from invoice' },
      { key: 'email', label: 'Email Address' },
      { key: 'noticePeriod', label: 'Notice Period', default: '1 week' },
    ],
    tags: ['contractor', 'onboarding', 'employment'],
    lastUpdatedISO: '2026-01-14',
  },

  // ==================== SECURITY CHECKLIST ====================
  {
    id: 'tpl-security-checklist',
    sectionId: 'operations',
    title: 'Startup Security Basics Checklist',
    description: 'Minimum security measures for early-stage startups',
    format: 'markdown',
    contentMarkdown: `# Security Basics Checklist - {{companyName}}

## Critical (Do Immediately)

### Password Management
- [ ] Team password manager deployed (1Password, Bitwarden)
- [ ] All team members onboarded
- [ ] Strong master passwords required
- [ ] No shared passwords in spreadsheets/docs

### Two-Factor Authentication
Enable 2FA on:
- [ ] Email (Google Workspace, M365)
- [ ] Banking and payments
- [ ] Cloud providers (AWS, GCP, Azure)
- [ ] Code repositories (GitHub, GitLab)
- [ ] Domain registrar
- [ ] Password manager
- [ ] Social media accounts

### Device Security
- [ ] Disk encryption enabled (FileVault, BitLocker)
- [ ] Screen lock after 5 minutes
- [ ] Remote wipe capability
- [ ] Auto-updates enabled

## High Priority

### Access Control
- [ ] Principle of least privilege applied
- [ ] Admin accounts separate from daily use
- [ ] Regular access reviews scheduled
- [ ] Offboarding process includes access revocation

### Code Security
- [ ] No secrets in code repositories
- [ ] Environment variables for secrets
- [ ] Secret scanning enabled
- [ ] Code review required for merges

### Data Backup
- [ ] Database backups automated
- [ ] Document backups in place
- [ ] Backup restoration tested
- [ ] Backups stored separately from production

## Important

### Communication
- [ ] Phishing awareness discussed with team
- [ ] Suspicious email reporting process
- [ ] Verified channels for sensitive info

### Vendor Security
- [ ] Key vendors reviewed for security
- [ ] DPAs signed where needed
- [ ] Third-party access documented

### Incident Response
- [ ] Know who to contact if breached
- [ ] Basic incident response plan
- [ ] Cyber insurance considered

## Nice to Have (As You Grow)

- [ ] SOC 2 preparation started
- [ ] Penetration testing scheduled
- [ ] Bug bounty program considered
- [ ] Security training program
- [ ] Detailed security policies

## Quick Wins

1. **Use a password manager** - Biggest impact, easiest win
2. **Enable 2FA everywhere** - Stop 99% of account compromises
3. **Keep software updated** - Patches fix known vulnerabilities
4. **Don't reuse passwords** - One breach shouldn't compromise all

---

*Security is a journey. Start with the basics and improve over time.*
`,
    variables: [
      { key: 'companyName', label: 'Company Name', required: true },
    ],
    tags: ['security', 'operations', 'checklist'],
    lastUpdatedISO: '2026-01-14',
  },

  // ==================== SOP STARTER ====================
  {
    id: 'tpl-sop-starter',
    sectionId: 'operations',
    title: 'SOP Starter List',
    description: 'Key standard operating procedures for startups',
    format: 'markdown',
    contentMarkdown: `# Standard Operating Procedures - {{companyName}}

## Essential SOPs to Create

### 1. Employee Onboarding
**Purpose:** Consistent, thorough onboarding for new hires

**Key Steps:**
- Pre-start: Contract, equipment, accounts
- Day 1: Welcome, introductions, setup
- Week 1: Training, context, first tasks
- Month 1: Goals, check-ins, feedback

### 2. Employee Offboarding
**Purpose:** Secure, professional departures

**Key Steps:**
- Access revocation checklist
- Equipment return
- Knowledge transfer
- Exit interview
- Final pay and documentation

### 3. Customer Support
**Purpose:** Consistent customer experience

**Key Steps:**
- Response time targets
- Escalation paths
- Common issue resolutions
- Feedback collection

### 4. Incident Response
**Purpose:** Handle issues quickly and effectively

**Key Steps:**
- Detection and triage
- Containment
- Resolution
- Post-mortem
- Communication plan

### 5. Code Deployment
**Purpose:** Safe, reliable releases

**Key Steps:**
- Code review requirements
- Testing requirements
- Deployment process
- Rollback procedure
- Monitoring checklist

### 6. Financial Close
**Purpose:** Accurate monthly financials

**Key Steps:**
- Bank reconciliation
- Invoice processing
- Expense categorization
- Report generation
- Review and approval

## SOP Template

Use this structure for each SOP:

\`\`\`
# [Process Name]

## Purpose
Why this process exists

## Scope
Who this applies to and when

## Responsibilities
Who does what

## Prerequisites
What's needed before starting

## Procedure
Step-by-step instructions

## Exceptions
When to deviate and how

## Related Documents
Links to templates, tools, etc.

## Revision History
| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | {{date}} | {{author}} | Initial |
\`\`\`

## Tips for Good SOPs

1. **Keep it simple** - A basic checklist beats a missing process
2. **Be specific** - "Send email" vs "Send welcome email using template X"
3. **Include examples** - Screenshots, sample outputs
4. **Review regularly** - Outdated SOPs are dangerous
5. **Make accessible** - Everyone should know where to find them

---

*Start with 2-3 critical SOPs. Add more as you grow.*
`,
    variables: [
      { key: 'companyName', label: 'Company Name', required: true },
      { key: 'date', label: 'Date', default: new Date().toISOString().split('T')[0] },
      { key: 'author', label: 'Author' },
    ],
    tags: ['sop', 'operations', 'processes'],
    lastUpdatedISO: '2026-01-14',
  },

  // ==================== COMPANIES HOUSE FORMS ====================
  {
    id: 'tpl-companies-house-in01',
    sectionId: 'incorporation',
    title: 'IN01 - Company Incorporation Guide',
    description: 'Step-by-step guide to completing the IN01 form for Companies House',
    format: 'markdown',
    contentMarkdown: `# IN01 - Application to Register a Company

**Form Purpose:** Register a new private limited company with Companies House

## Before You Start

You'll need:
- [ ] Proposed company name (checked for availability)
- [ ] Registered office address in UK
- [ ] Details of at least one director
- [ ] Details of at least one shareholder
- [ ] Share capital information
- [ ] SIC codes for your business activities

## Section-by-Section Guide

### Section 1: Company Details

| Field | Your Information |
|-------|------------------|
| Company name | {{companyName}} |
| Registered office | {{registeredAddress}} |
| Type | Private Limited by Shares |

**Name Rules:**
- Cannot be identical or "too similar" to existing company
- Cannot use sensitive words without permission
- Must end in "Limited" or "Ltd"

### Section 2: Directors

**Required for each director:**
- Full name
- Date of birth
- Nationality
- Business occupation
- Service address (can be registered office)
- Residential address (for Companies House records only)

**Director 1:**
| Field | Information |
|-------|-------------|
| Full name | {{director1Name}} |
| DOB | {{director1DOB}} |
| Nationality | {{director1Nationality}} |
| Occupation | {{director1Occupation}} |
| Service address | {{director1ServiceAddress}} |

### Section 3: Secretary (Optional)

Private companies don't need a company secretary.
- [ ] No secretary appointed
- [ ] Secretary appointed: {{secretaryName}}

### Section 4: Subscribers (Shareholders)

**Subscriber 1:**
| Field | Information |
|-------|-------------|
| Name | {{subscriber1Name}} |
| Address | {{subscriber1Address}} |
| Shares | {{subscriber1Shares}} shares of £{{nominalValue}} each |
| Total paid | £{{subscriber1Paid}} |

### Section 5: Statement of Capital

| Share Class | Shares | Nominal Value | Total Nominal | Paid Up | Unpaid |
|-------------|--------|---------------|---------------|---------|--------|
| Ordinary | {{totalShares}} | £{{nominalValue}} | £{{totalNominal}} | £{{totalPaid}} | £{{totalUnpaid}} |

### Section 6: Persons with Significant Control (PSC)

Anyone who:
- Holds >25% of shares
- Holds >25% of voting rights
- Has right to appoint/remove majority of directors
- Has significant influence or control

### Section 7: SIC Codes

Common codes for startups:
- **62012** - Business and domestic software development
- **62020** - Information technology consultancy
- **62090** - Other IT service activities
- **70229** - Management consultancy activities
- **73110** - Advertising agencies
- **82990** - Other business support activities

Your codes: {{sicCodes}}

### Section 8: Articles of Association

- [ ] Using Model Articles (recommended for most startups)
- [ ] Using bespoke articles (attach separately)

## How to File

**Online (Recommended):**
1. Go to gov.uk/limited-company-formation
2. Create or sign in to account
3. Complete online form
4. Pay £12 fee
5. Usually registered same day

**Paper:**
1. Download IN01 from gov.uk
2. Complete and sign
3. Post with £40 fee
4. Takes 8-10 days

## After Incorporation

You'll receive:
- Certificate of Incorporation
- Company number
- Memorandum of Association

## Next Steps

1. [ ] Open business bank account
2. [ ] Register for Corporation Tax (within 3 months)
3. [ ] Consider VAT registration if expecting >£90K turnover
4. [ ] Set up payroll if employing anyone
5. [ ] Get appropriate insurance

---

*This is a guide only. Companies House provides the official forms and guidance.*
`,
    variables: [
      { key: 'companyName', label: 'Company Name', required: true },
      { key: 'registeredAddress', label: 'Registered Office Address' },
      { key: 'director1Name', label: 'Director 1 Name' },
      { key: 'director1DOB', label: 'Director 1 DOB' },
      { key: 'director1Nationality', label: 'Director 1 Nationality', default: 'British' },
      { key: 'director1Occupation', label: 'Director 1 Occupation' },
      { key: 'director1ServiceAddress', label: 'Director 1 Service Address' },
      { key: 'secretaryName', label: 'Secretary Name (if any)' },
      { key: 'subscriber1Name', label: 'Subscriber 1 Name' },
      { key: 'subscriber1Address', label: 'Subscriber 1 Address' },
      { key: 'subscriber1Shares', label: 'Subscriber 1 Shares', default: '1' },
      { key: 'nominalValue', label: 'Nominal Value per Share', default: '1.00' },
      { key: 'subscriber1Paid', label: 'Amount Paid', default: '1.00' },
      { key: 'totalShares', label: 'Total Shares', default: '100' },
      { key: 'totalNominal', label: 'Total Nominal Value', default: '100' },
      { key: 'totalPaid', label: 'Total Paid Up', default: '100' },
      { key: 'totalUnpaid', label: 'Total Unpaid', default: '0' },
      { key: 'sicCodes', label: 'SIC Codes', default: '62012' },
    ],
    tags: ['companies-house', 'incorporation', 'IN01', 'forms'],
    disclaimers: [
      'This is a guide only - use official Companies House forms.',
      'Information requirements may change - check gov.uk for current guidance.',
    ],
    lastUpdatedISO: '2026-01-14',
  },

  {
    id: 'tpl-companies-house-cs01',
    sectionId: 'incorporation',
    title: 'CS01 - Annual Confirmation Statement Guide',
    description: 'Guide to filing your annual confirmation statement with Companies House',
    format: 'markdown',
    contentMarkdown: `# CS01 - Confirmation Statement

**Form Purpose:** Confirm your company details are correct with Companies House (required annually)

## Key Information

- **Due:** At least once every 12 months from incorporation or last CS01
- **Fee:** £13 online / £40 paper
- **Penalty:** Company can be struck off for non-filing

## What You're Confirming

The confirmation statement confirms that information at Companies House is correct as of the statement date.

### 1. Registered Office
Current address: {{registeredAddress}}

- [ ] Address is correct
- [ ] Need to update (file AD01 first)

### 2. Directors
| Name | Appointed | Current |
|------|-----------|---------|
| {{director1Name}} | {{director1Appointed}} | [ ] Correct |

- [ ] All directors listed are current
- [ ] Need to add new director (file AP01)
- [ ] Need to remove director (file TM01)

### 3. Company Secretary
- [ ] No secretary
- [ ] Secretary: {{secretaryName}} - [ ] Correct

### 4. Share Capital

**Statement of Capital:**
| Class | Number | Nominal | Total | Paid | Unpaid |
|-------|--------|---------|-------|------|--------|
| Ordinary | {{totalShares}} | £{{nominalValue}} | £{{totalNominal}} | £{{totalPaid}} | £{{totalUnpaid}} |

- [ ] Share capital is correct
- [ ] Shares have been issued since last CS01 (include SH01)

### 5. Shareholders

| Name | Shares | % |
|------|--------|---|
| {{shareholder1Name}} | {{shareholder1Shares}} | {{shareholder1Percent}}% |

- [ ] Shareholder list is correct
- [ ] Transfers have occurred (file stock transfer forms)

### 6. Persons with Significant Control (PSC)

| PSC | Nature of Control |
|-----|-------------------|
| {{psc1Name}} | {{psc1Control}} |

- [ ] PSC register is correct
- [ ] Need to update (file PSC01-PSC09 as needed)

### 7. SIC Codes

Current codes: {{sicCodes}}

- [ ] SIC codes are correct
- [ ] Business activities have changed

### 8. Trading Status

- [ ] Company is trading
- [ ] Company is dormant (different filing requirements)

## How to File

**Online (Recommended):**
1. Log in to Companies House WebFiling
2. Select "File a confirmation statement"
3. Review all sections
4. Make any updates needed
5. Confirm and pay £13
6. Instant confirmation

**Paper:**
1. Download CS01 from Companies House
2. Complete all sections
3. Sign and date
4. Post with £40 fee to Companies House
5. Allow 8-10 days for processing

## Common Mistakes to Avoid

1. **Missing the deadline** - Set calendar reminder
2. **Not updating PSC info** - Must be current
3. **Wrong share numbers** - Check against your records
4. **Forgetting dormant status** - Different requirements apply

## Filing Timeline

| Event | When |
|-------|------|
| Incorporation | Day 0 |
| First CS01 due | Within 12 months |
| Each subsequent CS01 | Within 12 months of last |

Your next due date: {{nextDueDate}}

---

*Always check Companies House for the latest requirements and fees.*
`,
    variables: [
      { key: 'companyName', label: 'Company Name', required: true },
      { key: 'registeredAddress', label: 'Registered Office Address' },
      { key: 'director1Name', label: 'Director 1 Name' },
      { key: 'director1Appointed', label: 'Director 1 Appointment Date' },
      { key: 'secretaryName', label: 'Secretary Name' },
      { key: 'totalShares', label: 'Total Shares' },
      { key: 'nominalValue', label: 'Nominal Value', default: '1.00' },
      { key: 'totalNominal', label: 'Total Nominal Value' },
      { key: 'totalPaid', label: 'Total Paid Up' },
      { key: 'totalUnpaid', label: 'Total Unpaid', default: '0' },
      { key: 'shareholder1Name', label: 'Shareholder 1 Name' },
      { key: 'shareholder1Shares', label: 'Shareholder 1 Shares' },
      { key: 'shareholder1Percent', label: 'Shareholder 1 %' },
      { key: 'psc1Name', label: 'PSC 1 Name' },
      { key: 'psc1Control', label: 'PSC 1 Nature of Control' },
      { key: 'sicCodes', label: 'SIC Codes' },
      { key: 'nextDueDate', label: 'Next CS01 Due Date' },
    ],
    tags: ['companies-house', 'confirmation-statement', 'CS01', 'annual-return'],
    lastUpdatedISO: '2026-01-14',
  },

  {
    id: 'tpl-companies-house-sh01',
    sectionId: 'share-structure',
    title: 'SH01 - Share Allotment Guide',
    description: 'Guide to notifying Companies House of new share allotments',
    format: 'markdown',
    contentMarkdown: `# SH01 - Return of Allotment of Shares

**Form Purpose:** Notify Companies House when you issue new shares

## When to File

File SH01 within **one month** of allotting new shares.

**Triggers:**
- Issuing shares to new investors
- Issuing shares to employees (EMI/options exercise)
- Issuing shares for services
- Converting loan notes to equity

## Information Required

### Company Details
- Company name: {{companyName}}
- Company number: {{companyNumber}}

### Allotment Details

**Date of allotment:** {{allotmentDate}}

| Share Class | Number Allotted | Nominal Value | Total Nominal | Amount Paid | Amount Unpaid |
|-------------|-----------------|---------------|---------------|-------------|---------------|
| {{shareClass}} | {{sharesAllotted}} | £{{nominalValue}} | £{{totalNominal}} | £{{amountPaid}} | £{{amountUnpaid}} |

### Consideration (Payment)

How were shares paid for?
- [ ] Cash: £{{cashAmount}}
- [ ] Non-cash consideration: {{nonCashDescription}}
- [ ] Both cash and non-cash

### New Statement of Capital (After Allotment)

| Share Class | Total Issued | Nominal Value | Total Nominal | Paid Up | Unpaid |
|-------------|--------------|---------------|---------------|---------|--------|
| Ordinary | {{newTotalShares}} | £{{nominalValue}} | £{{newTotalNominal}} | £{{newTotalPaid}} | £{{newTotalUnpaid}} |

### Shareholder Details (New Allottees)

| Name | Address | Shares Allotted |
|------|---------|-----------------|
| {{allottee1Name}} | {{allottee1Address}} | {{allottee1Shares}} |

## Process

### Before Filing SH01

1. **Board Resolution** - Directors must approve the allotment
2. **Shareholder Authority** - Check articles/SHA for authority limits
3. **Pre-emption** - Existing shareholders may have first right
4. **Subscription Agreement** - Document the investment terms
5. **Share Certificates** - Prepare certificates for new shareholders
6. **Update Cap Table** - Record new shareholdings

### Filing

**Online:**
1. Log in to Companies House WebFiling
2. Select "File a document"
3. Choose SH01
4. Complete details
5. No filing fee
6. Immediate confirmation

**Paper:**
1. Download SH01 from Companies House
2. Complete and sign
3. Post to Companies House
4. No fee
5. Allow 8-10 days

### After Filing

1. [ ] Update cap table
2. [ ] Issue share certificates
3. [ ] Update PSC register if needed
4. [ ] Update shareholders agreement signatories
5. [ ] For SEIS/EIS: File compliance statement

## Common Scenarios

### Seed Investment
- Investor subscribes for new shares
- File SH01 with cash consideration
- Update PSC if >25% ownership

### Employee Options Exercise
- Employee exercises vested options
- File SH01 with cash (option price)
- Usually small number of shares

### Conversion of Loan Notes
- Convertible notes convert to equity
- Non-cash consideration
- Describe loan note conversion

## Penalties

**Late filing can result in:**
- Company officers liable to fine
- No specific deadline penalty, but non-compliance is an offence

---

*File within one month of allotment. Keep accurate cap table records.*
`,
    variables: [
      { key: 'companyName', label: 'Company Name', required: true },
      { key: 'companyNumber', label: 'Company Number' },
      { key: 'allotmentDate', label: 'Date of Allotment' },
      { key: 'shareClass', label: 'Share Class', default: 'Ordinary' },
      { key: 'sharesAllotted', label: 'Shares Allotted' },
      { key: 'nominalValue', label: 'Nominal Value', default: '0.01' },
      { key: 'totalNominal', label: 'Total Nominal (This Allotment)' },
      { key: 'amountPaid', label: 'Amount Paid (This Allotment)' },
      { key: 'amountUnpaid', label: 'Amount Unpaid', default: '0' },
      { key: 'cashAmount', label: 'Cash Consideration' },
      { key: 'nonCashDescription', label: 'Non-Cash Consideration Description' },
      { key: 'newTotalShares', label: 'New Total Shares (After Allotment)' },
      { key: 'newTotalNominal', label: 'New Total Nominal Value' },
      { key: 'newTotalPaid', label: 'New Total Paid Up' },
      { key: 'newTotalUnpaid', label: 'New Total Unpaid' },
      { key: 'allottee1Name', label: 'Allottee 1 Name' },
      { key: 'allottee1Address', label: 'Allottee 1 Address' },
      { key: 'allottee1Shares', label: 'Allottee 1 Shares' },
    ],
    tags: ['companies-house', 'shares', 'SH01', 'allotment'],
    lastUpdatedISO: '2026-01-14',
  },

  {
    id: 'tpl-companies-house-psc',
    sectionId: 'incorporation',
    title: 'PSC Register Guide',
    description: 'Guide to maintaining your Persons with Significant Control register',
    format: 'markdown',
    contentMarkdown: `# Persons with Significant Control (PSC) Register

**Purpose:** Identify and record individuals who ultimately own or control your company

## Who is a PSC?

Someone is a PSC if they meet one or more of these conditions:

### Condition 1: Shareholding
Holds **more than 25%** of shares

### Condition 2: Voting Rights
Holds **more than 25%** of voting rights

### Condition 3: Director Appointment
Has the right to appoint or remove the **majority of directors**

### Condition 4: Significant Influence
Has the right to exercise, or actually exercises, **significant influence or control**

### Condition 5: Trust/Firm Control
Has the right to exercise, or actually exercises, significant influence or control over a trust or firm that meets conditions 1-4

## Registerable Details

For each PSC, record:

| Field | PSC 1 |
|-------|-------|
| Full name | {{psc1Name}} |
| Date of birth | {{psc1DOB}} |
| Nationality | {{psc1Nationality}} |
| Country of residence | {{psc1Country}} |
| Service address | {{psc1ServiceAddress}} |
| Usual residential address | {{psc1ResAddress}} |
| Date became PSC | {{psc1Date}} |
| Nature of control | {{psc1Control}} |

### Nature of Control Categories

**For shareholding (Condition 1):**
- Over 25% up to (and including) 50%
- More than 50% up to (and including) 75%
- More than 75%

**For voting rights (Condition 2):**
- Over 25% up to (and including) 50%
- More than 50% up to (and including) 75%
- More than 75%

**For other conditions:**
- Right to appoint and remove directors
- Significant influence or control
- As a trust or firm, meets conditions 1-4

## Companies House Forms

| Form | Purpose |
|------|---------|
| PSC01 | Notification of PSC individual |
| PSC02 | Notification of relevant legal entity (RLE) |
| PSC03 | Notification of other registerable person (ORP) |
| PSC04 | Change of PSC details |
| PSC07 | Notification that PSC has ceased |
| PSC08 | Update statement of no PSC |
| PSC09 | Notification that steps have been taken |

## Common Scenarios

### Scenario 1: Solo Founder
- Founder owns 100% of shares
- One PSC entry required
- Nature: More than 75% of shares and voting rights

### Scenario 2: Two Equal Co-founders (50/50)
- Each founder owns 50%
- Each is a PSC
- Nature: More than 25% up to 50% of shares and voting rights

### Scenario 3: Post-Investment
After a funding round where investors get 20%:
- Founders may still be PSCs (if >25% individually)
- Check if any investor holds >25%
- Voting rights may differ from economic rights

### Scenario 4: Relevant Legal Entity (RLE)
If a company (not individual) meets PSC conditions:
- File PSC02 for the RLE
- The RLE must have its own PSC register
- "Chain" continues until natural persons identified

## Filing Requirements

### Initial Registration
- PSC information included in IN01 at incorporation
- Or file PSC01/02/03 within 14 days of company knowing

### Changes
- File within 14 days of change
- Includes new PSC, cessation, or detail changes

### Confirmation Statement
- PSC information confirmed annually in CS01
- Must be accurate as of statement date

## Penalties

**Failure to maintain PSC register:**
- Company and officers liable to fine
- Daily default fine for continued non-compliance

**False statements:**
- Criminal offence
- Up to 2 years imprisonment and/or fine

## Your PSC Register

| Name | Nature of Control | Date | Status |
|------|-------------------|------|--------|
| {{psc1Name}} | {{psc1Control}} | {{psc1Date}} | Current |

---

*Keep your PSC register current. Review after any share transfers or new investments.*
`,
    variables: [
      { key: 'companyName', label: 'Company Name', required: true },
      { key: 'psc1Name', label: 'PSC 1 Full Name' },
      { key: 'psc1DOB', label: 'PSC 1 Date of Birth' },
      { key: 'psc1Nationality', label: 'PSC 1 Nationality' },
      { key: 'psc1Country', label: 'PSC 1 Country of Residence' },
      { key: 'psc1ServiceAddress', label: 'PSC 1 Service Address' },
      { key: 'psc1ResAddress', label: 'PSC 1 Residential Address' },
      { key: 'psc1Date', label: 'PSC 1 Date Became PSC' },
      { key: 'psc1Control', label: 'PSC 1 Nature of Control' },
    ],
    tags: ['companies-house', 'PSC', 'significant-control', 'register'],
    disclaimers: [
      'PSC requirements are complex - seek professional advice if unsure.',
      'Maintain accurate records to avoid penalties.',
    ],
    lastUpdatedISO: '2026-01-14',
  },
];

export function getTemplatesBySectionId(sectionId: string): StartupTemplate[] {
  return STARTUP_PACK_TEMPLATES.filter(t => t.sectionId === sectionId);
}

export function getTemplateById(id: string): StartupTemplate | undefined {
  return STARTUP_PACK_TEMPLATES.find(t => t.id === id);
}

export function searchTemplates(query: string): StartupTemplate[] {
  const lowerQuery = query.toLowerCase();
  return STARTUP_PACK_TEMPLATES.filter(t =>
    t.title.toLowerCase().includes(lowerQuery) ||
    t.description.toLowerCase().includes(lowerQuery) ||
    t.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
}

export function fillTemplateVariables(template: StartupTemplate, values: Record<string, string>): string {
  let content = template.contentMarkdown;

  template.variables.forEach(variable => {
    const value = values[variable.key] ?? variable.default ?? '';
    const regex = new RegExp(`\\{\\{${variable.key}\\}\\}`, 'g');
    content = content.replace(regex, value);
  });

  return content;
}
