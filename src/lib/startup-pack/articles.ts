import type { StartupPackArticle } from '@/types';

export const STARTUP_PACK_ARTICLES: StartupPackArticle[] = [
  // ==================== INCORPORATION ====================
  {
    id: 'incorporation-overview',
    sectionId: 'incorporation',
    title: 'UK Company Formation: The Essentials',
    summary: 'Everything you need to know about incorporating a UK limited company',
    contentMarkdown: `
# UK Company Formation: The Essentials

Setting up a UK limited company (Ltd) is straightforward but requires attention to detail. Here's what you need to know.

## Why a Limited Company?

A **private company limited by shares** (Ltd) is the most common structure for UK startups because:

- **Limited liability**: Your personal assets are protected from business debts
- **Tax efficiency**: Corporation tax (currently 19-25%) vs higher personal tax rates
- **Credibility**: Looks more professional to customers, suppliers, and investors
- **Shares**: You can easily issue shares to investors and employees

## What You Need to Incorporate

1. **Company name** - Must be unique and not too similar to existing names
2. **Registered office address** - A UK address for official correspondence
3. **At least one director** - Must be 16+ and not disqualified
4. **At least one shareholder** - Can be the same person as director
5. **SIC code** - Standard Industrial Classification code describing your business
6. **Share capital** - Usually starts at £1 divided into 1 ordinary share

## Companies House Registration

You can incorporate online at Companies House for £12 (standard) or £30 (same-day). You'll need:

- Memorandum of association (generated automatically online)
- Articles of association (use Model Articles or custom)
- Form IN01 with company details
- ID verification for directors/shareholders

## After Incorporation

Once incorporated, you'll receive:

- **Certificate of Incorporation** - Proof your company exists
- **Company number** - Your unique 8-digit identifier
- **Authentication code** - For filing online with Companies House

Within 3 months, you must:
- Register for Corporation Tax with HMRC
- Set up your accounting reference date
- Keep a register of members and PSCs

## Key Ongoing Obligations

- **Confirmation statement** - Annual filing (£13) confirming company details
- **Annual accounts** - Must be filed within 9 months of year-end
- **Corporation Tax return** - Due 12 months after accounting period ends
- **PSC register** - Keep updated records of people with significant control
`,
    tags: ['incorporation', 'companies-house', 'formation', 'ltd'],
    lastUpdatedISO: '2026-01-14',
    jurisdiction: 'UK',
    readTimeMinutes: 5,
  },
  {
    id: 'choosing-company-name',
    sectionId: 'incorporation',
    title: 'Choosing Your Company Name',
    summary: 'Rules and tips for selecting a compliant, memorable company name',
    contentMarkdown: `
# Choosing Your Company Name

Your company name is important - it's how customers and investors will know you. Here's what to consider.

## Companies House Rules

Your name **cannot**:
- Be the same as or too similar to an existing company
- Contain "sensitive" words without permission (e.g., "Royal", "British", "Authority")
- Be offensive or suggest illegal activity
- Use certain endings other than "Limited" or "Ltd"

## Checking Availability

1. Search the [Companies House register](https://find-and-update.company-information.service.gov.uk/)
2. Check the [UK Trade Mark database](https://trademarks.ipo.gov.uk/)
3. Search domain availability
4. Check social media handles

## Trading Name vs Company Name

You can trade under a different name than your registered company name. For example:
- Registered: "Smith Holdings Ltd"
- Trading as: "Acme Software"

But you must display your registered company name on all official documents.

## Tips for a Good Name

- **Memorable** - Easy to spell and pronounce
- **Scalable** - Won't limit you as you grow
- **Domain available** - Check .com, .co.uk, .io
- **Not too generic** - Hard to trademark generic terms
- **International** - Consider how it sounds in other languages
`,
    tags: ['company-name', 'incorporation', 'branding'],
    lastUpdatedISO: '2026-01-14',
    jurisdiction: 'UK',
    readTimeMinutes: 3,
  },

  // ==================== SHARE STRUCTURE ====================
  {
    id: 'share-structure-basics',
    sectionId: 'share-structure',
    title: 'Share Structure Basics for Founders',
    summary: 'Understanding shares, equity, and cap tables',
    contentMarkdown: `
# Share Structure Basics for Founders

Understanding your share structure is crucial for fundraising and team incentives.

## Ordinary Shares

Most startups start with **ordinary shares** - the simplest type:
- Each share = one vote
- Equal rights to dividends
- Equal rights to assets on wind-up

## How Many Shares to Issue?

Common approaches:
- **100 shares** - Simple, but makes small allocations awkward
- **1,000 shares** - Better granularity
- **10,000 shares** - Common choice, allows 0.01% precision
- **1,000,000 shares** - Maximum flexibility for employee options

> **Tip**: Issue more shares upfront. It's easier than doing a share split later.

## Founder Equity Split

No single "right" answer, but consider:
- **Who had the idea?** (less important than you think)
- **Who's working full-time?**
- **Who's bringing capital?**
- **Who has critical skills/relationships?**
- **What's everyone's opportunity cost?**

Common patterns:
- **Solo founder**: 100%
- **Two co-founders**: 50/50 or 60/40
- **Three co-founders**: 33/33/34 or skill-weighted

## What is a Cap Table?

A **capitalisation table** (cap table) tracks:
- Who owns what percentage of the company
- Share classes and their rights
- Options issued and available
- How ownership changes with each funding round

Keep your cap table simple and clean - investors will scrutinize it.

## Vesting

Founder shares should typically **vest** over time (usually 4 years with 1-year cliff):
- Protects the company if a founder leaves early
- Standard expectation from investors
- Shows commitment to the long term

Without vesting, a co-founder could leave after 6 months with 50% of the company.
`,
    tags: ['shares', 'equity', 'cap-table', 'founders'],
    lastUpdatedISO: '2026-01-14',
    jurisdiction: 'UK',
    readTimeMinutes: 5,
  },
  {
    id: 'option-pool-basics',
    sectionId: 'share-structure',
    title: 'Employee Option Pool Basics',
    summary: 'Setting aside equity for future hires',
    contentMarkdown: `
# Employee Option Pool Basics

An option pool reserves shares for future employees - essential for attracting talent.

## What is an Option Pool?

A percentage of the company set aside for employee share options. Typical sizes:
- **Pre-seed**: 5-10%
- **Seed**: 10-15%
- **Series A**: 15-20%

## Why Create One?

1. **Attract talent** - Compete with larger companies
2. **Retain employees** - Options vest over time
3. **Align interests** - Everyone benefits from company success
4. **Investor expectation** - Most investors expect a pool pre-investment

## EMI Scheme (UK)

The **Enterprise Management Incentives** (EMI) scheme is highly tax-efficient:
- Employees pay no income tax when options are granted
- Capital Gains Tax (10-20%) on sale, not income tax (up to 45%)
- Company can claim Corporation Tax deduction
- Must meet HMRC criteria (trading company, <£30m assets, <250 employees)

> **Important**: Get proper EMI documentation. HMRC requires specific valuations and filings.

## Key Terms

- **Strike price**: Price employee pays to exercise options (usually nominal at early stage)
- **Vesting**: Options earned over time (typically 4 years)
- **Cliff**: Minimum time before any options vest (typically 1 year)
- **Exercise window**: Time to exercise after leaving company
`,
    tags: ['options', 'emi', 'employees', 'equity'],
    lastUpdatedISO: '2026-01-14',
    jurisdiction: 'UK',
    readTimeMinutes: 4,
  },

  // ==================== SEIS/EIS ====================
  {
    id: 'seis-eis-overview',
    sectionId: 'seis-eis',
    title: 'SEIS and EIS: UK Tax Relief for Investors',
    summary: 'Understanding the UK\'s powerful tax-advantaged investment schemes',
    contentMarkdown: `
# SEIS and EIS: UK Tax Relief for Investors

The UK offers world-leading tax incentives for startup investors. Understanding these can help you raise capital.

## What is SEIS?

**Seed Enterprise Investment Scheme** - for very early-stage companies:
- **30% income tax relief** for investors
- **50% CGT exemption** on gains (if held 3+ years)
- **CGT reinvestment relief** - defer gains from other investments
- **Loss relief** - offset losses against income tax
- **Maximum raise**: £250,000 lifetime
- **Maximum individual investment**: £200,000/year

## What is EIS?

**Enterprise Investment Scheme** - for growing companies:
- **30% income tax relief** for investors
- **100% CGT exemption** on gains (if held 3+ years)
- **CGT deferral relief** - defer gains from other investments
- **Loss relief** - offset losses against income tax
- **Maximum raise**: £5m/year (£12m lifetime)
- **Maximum individual investment**: £1m/year (£2m for knowledge-intensive)

## Key Eligibility Requirements

Your company must:
- Be UK-based (permanent establishment)
- Have fewer than 250 employees (SEIS: 25)
- Have gross assets under £15m (SEIS: £350k)
- Be a **qualifying trade** (excludes property, finance, legal services)
- Not be listed on a stock exchange
- Be less than 7 years old (knowledge-intensive: 10 years)

## Advance Assurance

Before raising, apply for **Advance Assurance** from HMRC:
- Confirms your company likely qualifies
- Gives investors confidence
- Takes 4-6 weeks typically
- Free to apply

> **Warning**: SEIS/EIS rules are complex. Work with a specialist accountant to ensure compliance.
`,
    tags: ['seis', 'eis', 'tax-relief', 'investors', 'fundraising'],
    lastUpdatedISO: '2026-01-14',
    jurisdiction: 'UK',
    readTimeMinutes: 5,
  },

  // ==================== SHAREHOLDERS AGREEMENT ====================
  {
    id: 'shareholders-agreement-overview',
    sectionId: 'shareholders-agreement',
    title: "Why You Need a Shareholders' Agreement",
    summary: 'Protecting founders and setting governance rules from day one',
    contentMarkdown: `
# Why You Need a Shareholders' Agreement

A shareholders' agreement is a private contract between shareholders. It's not legally required, but it's essential.

## Why It Matters

- **Prevents disputes** - Clear rules when disagreements arise
- **Protects all parties** - Minority and majority shareholders
- **Investor requirement** - Most investors will require one
- **Complements Articles** - Covers what Articles don't

## Key Clauses to Include

### Reserved Matters
Decisions requiring shareholder approval:
- Issuing new shares
- Taking on significant debt
- Changing the business direction
- Selling the company
- Making large purchases

### Founder Vesting
- Shares vest over time (e.g., 4 years)
- 1-year cliff before any vesting
- Protects against early departures

### Leaver Provisions
What happens if a founder leaves:
- **Good leaver**: Keeps vested shares at fair value
- **Bad leaver**: Loses unvested shares, buys back at nominal value

### Tag-Along & Drag-Along
- **Tag-along**: Minority can sell alongside majority
- **Drag-along**: Majority can force minority to sell (important for exits)

### Pre-emption Rights
Existing shareholders have first right to buy shares before outsiders.

### Deadlock Resolution
What happens if shareholders can't agree:
- Mediation/arbitration
- Buyout mechanisms
- "Russian roulette" clauses

## When to Create One

**Before you raise money**. It's much harder to negotiate when investors are involved.

> **Important**: This is legal territory. Use a lawyer experienced with startup shareholder agreements.
`,
    tags: ['shareholders-agreement', 'governance', 'founders', 'legal'],
    lastUpdatedISO: '2026-01-14',
    jurisdiction: 'UK',
    readTimeMinutes: 5,
  },

  // ==================== ARTICLES OF ASSOCIATION ====================
  {
    id: 'articles-overview',
    sectionId: 'articles',
    title: 'Articles of Association Explained',
    summary: 'Your company\'s constitutional document',
    contentMarkdown: `
# Articles of Association Explained

Articles of Association are your company's constitutional rulebook, filed publicly with Companies House.

## What They Cover

- How shares can be issued and transferred
- Directors' powers and responsibilities
- How meetings are conducted
- Voting procedures
- Dividend distribution rules

## Model Articles vs Custom

### Model Articles
- Default template provided by Companies House
- Fine for simple companies
- Free and quick to adopt
- May need amending later

### Custom/Bespoke Articles
- Tailored to your needs
- Required for complex share structures
- Investors may require specific provisions
- Costs more upfront but saves later

## When to Customize

Consider custom articles if you need:
- Multiple share classes with different rights
- Specific pre-emption provisions
- Director appointment rights for investors
- Drag-along/tag-along rights (also in SHA)
- Specific reserved matters

## Relationship with Shareholders' Agreement

| Articles | Shareholders' Agreement |
|----------|------------------------|
| Public document | Private document |
| Binds all shareholders automatically | Only binds signatories |
| Harder to amend (75% vote) | Easier to amend (all signatories agree) |
| Enforceable by the company | Enforceable between shareholders |

Many provisions appear in both documents for extra protection.

> **Tip**: Most seed-stage startups can use Model Articles initially, then customize during a priced round when investors require specific terms.
`,
    tags: ['articles', 'constitution', 'governance', 'legal'],
    lastUpdatedISO: '2026-01-14',
    jurisdiction: 'UK',
    readTimeMinutes: 4,
  },

  // ==================== FUNDRAISING ====================
  {
    id: 'fundraising-prep-overview',
    sectionId: 'fundraising',
    title: 'Fundraising Preparation Checklist',
    summary: 'Get investor-ready before you start pitching',
    contentMarkdown: `
# Fundraising Preparation Checklist

Raising capital requires preparation. Being organized shows professionalism and speeds up due diligence.

## 1. Data Room Setup

Create a secure folder with key documents:

**Corporate**
- Certificate of Incorporation
- Articles of Association
- Shareholders' Agreement
- Cap table (current and pro-forma)
- Board resolutions

**Financial**
- Historical financials (if any)
- Current year budget/forecast
- Monthly burn rate
- Runway calculation

**Product/Business**
- Product demo or screenshots
- Key metrics dashboard
- Customer testimonials/case studies
- Competitive analysis

**Team**
- Founder CVs/bios
- Org chart
- Key hires planned
- Advisor agreements

**Legal**
- IP assignment agreements
- Key customer contracts
- Material supplier agreements
- Any litigation or disputes

## 2. Pitch Deck Structure

A good pitch deck covers (10-15 slides):

1. **Title** - Company name, tagline, logo
2. **Problem** - What pain you're solving
3. **Solution** - Your product/approach
4. **Market** - TAM, SAM, SOM
5. **Product** - Screenshots, demo
6. **Traction** - Metrics, growth, customers
7. **Business Model** - How you make money
8. **Competition** - Landscape and differentiation
9. **Team** - Why you'll win
10. **Financials** - Projections (realistic)
11. **Ask** - How much, use of funds
12. **Vision** - Where you're going

## 3. Investor Targeting

Don't spray and pray:
- Research investors who fund your stage/sector
- Get warm intros where possible
- Track everything in a CRM or spreadsheet
- Follow up professionally

## 4. Timeline

Realistic fundraising takes 3-6 months:
- Month 1-2: Preparation, warm-up meetings
- Month 2-4: Active pitching, term sheets
- Month 4-6: Due diligence, legal, closing
`,
    tags: ['fundraising', 'pitch', 'data-room', 'investors'],
    lastUpdatedISO: '2026-01-14',
    jurisdiction: 'UK',
    readTimeMinutes: 6,
  },

  // ==================== IP & TRADEMARKS ====================
  {
    id: 'ip-trademarks-overview',
    sectionId: 'ip-trademarks',
    title: 'Protecting Your Brand: Trademarks & Domains',
    summary: 'Secure your name, logo, and digital presence',
    contentMarkdown: `
# Protecting Your Brand: Trademarks & Domains

Your brand is a valuable asset. Protect it early before someone else does.

## Domain Names

### Priority Order
1. **yourcompany.com** - Gold standard
2. **yourcompany.co.uk** - Important for UK businesses
3. **yourcompany.io** - Popular for tech startups
4. **yourcompany.co** - Alternative if .com taken

### Tips
- Register multiple extensions to protect your brand
- Set up auto-renewal to avoid losing domains
- Use a reputable registrar (Google Domains, Namecheap, Cloudflare)
- Consider buying similar misspellings

## Trademarks (UK)

### What Can Be Trademarked?
- Words (company/product name)
- Logos and designs
- Slogans
- Sounds (rare)
- Shapes (rare)

### UK Trade Mark Process
1. Search existing marks at [IPO](https://www.gov.uk/search-for-trademark)
2. Choose your classes (Nice Classification - 45 categories)
3. Apply online (£170 for first class, £50 each additional)
4. Examination period (2-3 months)
5. Publication for opposition (2 months)
6. Registration certificate issued

### Common Classes for Tech Startups
- Class 9: Software, apps, electronics
- Class 35: Business services, advertising
- Class 42: SaaS, IT services, design
- Class 38: Telecommunications

## When to Register

**Register early if**:
- Your brand name is distinctive
- You're about to launch publicly
- You're raising investment
- You plan to sell branded products

**Wait if**:
- You're still testing names
- Very limited budget (focus on MVP first)
- Name is highly descriptive (harder to register)

> **Note**: ™ can be used immediately. ® only after registration is granted.
`,
    tags: ['trademark', 'domain', 'ip', 'brand'],
    lastUpdatedISO: '2026-01-14',
    jurisdiction: 'UK',
    readTimeMinutes: 4,
  },

  // ==================== BANKING & TAX ====================
  {
    id: 'banking-tax-overview',
    sectionId: 'banking-tax',
    title: 'Business Banking & Tax Setup',
    summary: 'Set up your financial infrastructure properly',
    contentMarkdown: `
# Business Banking & Tax Setup

Getting your financial foundations right saves headaches later.

## Business Bank Account

### Why You Need One
- Legal requirement to keep business/personal separate
- Easier accounting and bookkeeping
- Professional image for customers
- Required for many payment processors

### UK Options
**Traditional Banks**
- Barclays, HSBC, NatWest, Lloyds
- Established, full-service
- Can be slow to open, require branch visits

**Digital Banks** (Popular with startups)
- Tide, Starling, Monzo Business, Revolut Business
- Quick online setup (minutes)
- Good integrations with accounting software
- Usually free or low-cost

### What You Need to Open
- Certificate of Incorporation
- Company details (address, directors)
- ID verification for directors
- Proof of business address

## Accounting Software

Set this up from day one:
- **Xero** - Most popular with accountants
- **FreeAgent** - Good for small companies
- **QuickBooks** - Well-known, lots of features

Benefits:
- Connect to bank for automatic reconciliation
- Generate invoices
- Track expenses
- Prepare for tax filing

## Tax Registration

### Corporation Tax
- Register within 3 months of trading
- Current rate: 19% (<£50k profit) to 25% (>£250k)
- File returns within 12 months of accounting period
- Pay within 9 months + 1 day of period end

### VAT (If Required)
- **Mandatory** if turnover exceeds £90,000 (2024/25 threshold)
- **Voluntary** registration possible below threshold
- File quarterly returns (MTD requires digital records)
- Standard rate: 20%

### PAYE (If Hiring)
- Required if paying employees
- Register before first payday
- Deduct income tax and NI
- Real-time reporting to HMRC
`,
    tags: ['banking', 'tax', 'accounting', 'vat', 'paye'],
    lastUpdatedISO: '2026-01-14',
    jurisdiction: 'UK',
    readTimeMinutes: 5,
  },

  // ==================== EMPLOYMENT ====================
  {
    id: 'employment-basics-overview',
    sectionId: 'employment',
    title: 'Employment & Contractor Basics',
    summary: 'Hiring your first team members properly',
    contentMarkdown: `
# Employment & Contractor Basics

Getting employment right from the start protects your company and your people.

## Employee vs Contractor

### Employee
- Works under your direction and control
- Has set hours, uses your equipment
- You pay NI, provide benefits
- More rights (sick pay, holiday, redundancy)
- Higher cost, but more control

### Contractor
- Works independently
- Sets own hours, uses own equipment
- Invoices for services (including VAT if registered)
- Fewer rights, but more flexibility
- **IR35 warning**: HMRC scrutinizes "disguised employment"

## Essential Documents

### For Employees
1. **Employment contract** - Terms, salary, hours, benefits
2. **IP assignment** - Company owns work created
3. **Confidentiality agreement** - Protect sensitive info
4. **Employee handbook** - Policies and procedures

### For Contractors
1. **Consultancy agreement** - Scope, fees, deliverables
2. **IP assignment** - Crucial! Company owns deliverables
3. **Confidentiality agreement** - NDA protection

## IP Assignment is Critical

Without IP assignment, creators may own their work:
- Software code
- Designs and artwork
- Inventions and patents
- Content and copy

Include IP assignment in **every** contract, even for founders.

## Minimum Requirements (UK)

For employees, you must provide:
- Written terms within 2 months of start
- Minimum wage (£11.44/hour for 21+ in 2024)
- 28 days paid holiday (including bank holidays)
- Auto-enrollment pension (if earning £10,000+)
- Statutory sick pay
- Workplace pension contributions

## Hiring Internationally

Consider:
- **EOR (Employer of Record)** - Companies like Deel, Remote handle compliance
- **Contractor agreement** - Simpler but IR35 equivalent risks abroad
- **Local entity** - For significant presence
`,
    tags: ['employment', 'contracts', 'ir35', 'ip-assignment'],
    lastUpdatedISO: '2026-01-14',
    jurisdiction: 'UK',
    readTimeMinutes: 5,
  },

  // ==================== OPERATIONS ====================
  {
    id: 'operations-setup-overview',
    sectionId: 'operations',
    title: 'Operational Setup for Startups',
    summary: 'Tools, security, and compliance essentials',
    contentMarkdown: `
# Operational Setup for Startups

Set up your operational infrastructure to scale.

## Essential Tool Stack

### Communication
- **Slack** or **Teams** - Team chat
- **Zoom** or **Google Meet** - Video calls
- **Email** - Google Workspace or Microsoft 365

### Productivity
- **Notion** or **Confluence** - Documentation
- **Google Drive** or **OneDrive** - File storage
- **Asana**, **Linear**, or **Jira** - Project management

### Development (if technical)
- **GitHub** or **GitLab** - Code repository
- **Vercel**, **AWS**, or **GCP** - Hosting
- **Sentry** - Error tracking

### Finance
- **Xero** or **QuickBooks** - Accounting
- **Stripe** - Payments
- **Pleo** or **Soldo** - Expense cards

## Security Basics

Even small startups need basic security:

1. **Password manager** - 1Password, Bitwarden (team plans)
2. **2FA everywhere** - Especially email, banking, GitHub
3. **Device encryption** - FileVault (Mac), BitLocker (Windows)
4. **Access control** - Principle of least privilege
5. **Regular backups** - Code, documents, databases

## GDPR Basics

If you collect personal data from EU/UK residents:

### Requirements
- **Lawful basis** - Consent, contract, legitimate interest
- **Privacy policy** - What data you collect and why
- **Data subject rights** - Access, deletion, portability
- **Data processing agreements** - With third parties
- **Breach notification** - 72 hours to ICO if serious

### Quick Wins
- Add privacy policy to your website
- Use cookie consent banner
- Document what data you collect
- Minimize data collection
- Secure data storage

## Standard Operating Procedures

Create basic SOPs for:
- Onboarding new team members
- Offboarding (access revocation!)
- Customer support process
- Incident response
- Regular backups

> **Tip**: Start simple. A basic checklist is better than nothing.
`,
    tags: ['operations', 'tools', 'security', 'gdpr'],
    lastUpdatedISO: '2026-01-14',
    jurisdiction: 'UK',
    readTimeMinutes: 5,
  },
];

export function getArticlesBySectionId(sectionId: string): StartupPackArticle[] {
  return STARTUP_PACK_ARTICLES.filter(a => a.sectionId === sectionId);
}

export function getArticleById(id: string): StartupPackArticle | undefined {
  return STARTUP_PACK_ARTICLES.find(a => a.id === id);
}

export function searchArticles(query: string): StartupPackArticle[] {
  const lowerQuery = query.toLowerCase();
  return STARTUP_PACK_ARTICLES.filter(a =>
    a.title.toLowerCase().includes(lowerQuery) ||
    a.summary.toLowerCase().includes(lowerQuery) ||
    a.tags.some(t => t.toLowerCase().includes(lowerQuery))
  );
}
