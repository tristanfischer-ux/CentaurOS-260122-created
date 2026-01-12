// Function Library System for Centaur OS
// Comprehensive resources for each business function

import type { Function } from '@/types';

export interface FunctionResource {
  id: string;
  type: 'person' | 'supplier' | 'ai_tool' | 'template' | 'guide' | 'checklist' | 'objective';
  title: string;
  description: string;
  category: string;
  tags: string[];
  url?: string;
  icon?: string;
}

export interface FunctionProfile {
  function: Function;
  title: string;
  description: string;
  icon: string;
  color: string;
  gradient: readonly [string, string];
  keyResponsibilities: string[];
  commonChallenges: string[];
  successMetrics: string[];
  suggestedOKRs: {
    objective: string;
    keyResults: string[];
    rationale: string;
  }[];
  resources: {
    people: FunctionResource[];
    suppliers: FunctionResource[];
    aiTools: FunctionResource[];
    templates: FunctionResource[];
    guides: FunctionResource[];
    checklists: FunctionResource[];
  };
  adviceForFounders: string[];
  adviceForExecutives: string[];
  adviceForApprentices: string[];
}

// ============================================================================
// FINANCE FUNCTION
// ============================================================================

export const FINANCE_PROFILE: FunctionProfile = {
  function: 'Finance',
  title: 'Finance & Accounting',
  description: 'Manage cash flow, financial planning, accounting, and fundraising. Ensure financial health and runway management.',
  icon: 'pound-sterling',
  color: '#10b981',
  gradient: ['#10b981', '#059669'] as const,

  keyResponsibilities: [
    'Manage monthly bookkeeping and financial close',
    'Track cash flow and runway projections',
    'Prepare financial reports for board and investors',
    'Handle payroll and expense management',
    'Manage fundraising activities and investor relations',
    'Ensure tax compliance and VAT/sales tax filing',
    'Budget planning and scenario modeling',
    'Cost optimization and burn rate management',
  ],

  commonChallenges: [
    'Limited runway creating cash pressure',
    'Complex hardware COGS and inventory management',
    'Managing multiple currencies for global suppliers',
    'R&D tax credits and grant applications',
    'Investor reporting requirements',
    'Understanding unit economics and CAC/LTV',
  ],

  successMetrics: [
    'Monthly burn rate',
    'Runway (months of cash remaining)',
    'Gross margin percentage',
    'Operating cash flow',
    'Days to close books (< 10 days)',
    'Forecast accuracy (within 10%)',
  ],

  suggestedOKRs: [
    {
      objective: 'Extend runway to 18 months',
      keyResults: [
        'Reduce monthly burn from £60k to £45k',
        'Secure £500k in new funding or revenue',
        'Improve gross margin from 40% to 55%',
      ],
      rationale: 'Healthy runway provides breathing room for product-market fit and removes fundraising pressure.',
    },
    {
      objective: 'Achieve financial operation excellence',
      keyResults: [
        'Close books within 5 business days monthly',
        'Implement automated expense tracking',
        'Reduce accounting errors to zero',
      ],
      rationale: 'Clean, fast financials enable better decision-making and investor confidence.',
    },
    {
      objective: 'Optimize unit economics',
      keyResults: [
        'Reduce COGS per unit by 25%',
        'Achieve positive contribution margin',
        'Implement activity-based costing system',
      ],
      rationale: 'Understanding true unit economics is critical for hardware startups to scale profitably.',
    },
  ],

  resources: {
    people: [
      {
        id: 'fin-exec-1',
        type: 'person',
        title: 'CFO - Hardware Startups',
        description: 'Fractional CFO with 15 years hardware startup experience. Expert in fundraising, unit economics, and inventory management.',
        category: 'Fractional Executive',
        tags: ['CFO', 'Fundraising', 'Hardware', 'Unit Economics'],
        icon: 'user',
      },
      {
        id: 'fin-exec-2',
        type: 'person',
        title: 'Financial Controller',
        description: 'Expert in accounting, bookkeeping, and financial close. QuickBooks and Xero specialist.',
        category: 'Fractional Executive',
        tags: ['Controller', 'Bookkeeping', 'Compliance'],
        icon: 'user',
      },
      {
        id: 'fin-app-1',
        type: 'person',
        title: 'Finance Apprentice',
        description: 'Junior accountant for AP/AR, expense management, and financial data entry.',
        category: 'Apprentice',
        tags: ['AP/AR', 'Data Entry', 'Bookkeeping'],
        icon: 'user',
      },
    ],

    suppliers: [
      {
        id: 'fin-sup-1',
        type: 'supplier',
        title: 'Xero',
        description: 'Cloud accounting software for small businesses. £25/mo. Integrates with banking and invoicing.',
        category: 'Accounting Software',
        tags: ['Accounting', 'Cloud', 'UK'],
        url: 'https://www.xero.com',
        icon: 'external-link',
      },
      {
        id: 'fin-sup-2',
        type: 'supplier',
        title: 'Stripe',
        description: 'Payment processing and invoicing. 1.5% + £0.20 per transaction. Essential for B2C hardware.',
        category: 'Payments',
        tags: ['Payments', 'Invoicing', 'Global'],
        url: 'https://stripe.com',
        icon: 'external-link',
      },
      {
        id: 'fin-sup-3',
        type: 'supplier',
        title: 'Carta',
        description: 'Cap table management and equity administration. Free for early-stage startups.',
        category: 'Equity Management',
        tags: ['Cap Table', 'Equity', 'Compliance'],
        url: 'https://carta.com',
        icon: 'external-link',
      },
      {
        id: 'fin-sup-4',
        type: 'supplier',
        title: 'Brex / Ramp',
        description: 'Corporate cards with expense management. 1.5% cashback, automated receipt matching.',
        category: 'Expense Management',
        tags: ['Corporate Card', 'Expenses', 'Cashback'],
        url: 'https://www.brex.com',
        icon: 'external-link',
      },
    ],

    aiTools: [
      {
        id: 'fin-ai-1',
        type: 'ai_tool',
        title: 'ChatGPT - Financial Analysis',
        description: 'Use GPT-4 to analyze financial statements, create scenario models, and draft investor updates.',
        category: 'AI Assistant',
        tags: ['GPT-4', 'Analysis', 'Modeling'],
        icon: 'bot',
      },
      {
        id: 'fin-ai-2',
        type: 'ai_tool',
        title: 'Claude - Financial Documentation',
        description: 'Generate board packs, investor reports, and financial policy documentation with Claude.',
        category: 'AI Assistant',
        tags: ['Claude', 'Documentation', 'Reports'],
        icon: 'bot',
      },
      {
        id: 'fin-ai-3',
        type: 'ai_tool',
        title: 'Fathom',
        description: 'AI-powered accounting assistant. Auto-categorizes transactions, detects anomalies.',
        category: 'AI Tool',
        tags: ['Accounting', 'Automation', 'ML'],
        url: 'https://www.fathomhq.com',
        icon: 'bot',
      },
    ],

    templates: [
      {
        id: 'fin-temp-1',
        type: 'template',
        title: 'Monthly Financial Dashboard',
        description: 'Track revenue, burn, runway, and key metrics. Google Sheets template with auto-charts.',
        category: 'Financial Reporting',
        tags: ['Dashboard', 'Metrics', 'Monthly'],
        icon: 'file-spreadsheet',
      },
      {
        id: 'fin-temp-2',
        type: 'template',
        title: '3-Statement Financial Model',
        description: 'P&L, Balance Sheet, Cash Flow integrated model. 5-year projections with scenarios.',
        category: 'Financial Modeling',
        tags: ['Model', 'Projections', 'Fundraising'],
        icon: 'file-spreadsheet',
      },
      {
        id: 'fin-temp-3',
        type: 'template',
        title: 'Unit Economics Calculator',
        description: 'Calculate COGS, contribution margin, CAC, LTV for hardware products.',
        category: 'Analysis',
        tags: ['Unit Economics', 'Hardware', 'Margin'],
        icon: 'calculator',
      },
      {
        id: 'fin-temp-4',
        type: 'template',
        title: 'Investor Update Template',
        description: 'Monthly investor update format. Covers metrics, progress, asks, and risks.',
        category: 'Investor Relations',
        tags: ['Investor Update', 'Communication'],
        icon: 'mail',
      },
    ],

    guides: [
      {
        id: 'fin-guide-1',
        type: 'guide',
        title: 'Hardware Startup Finance 101',
        description: 'Complete guide to managing finances for hardware startups: inventory, COGS, forecasting.',
        category: 'Educational',
        tags: ['Hardware', 'Fundamentals', 'Guide'],
        icon: 'book-open',
      },
      {
        id: 'fin-guide-2',
        type: 'guide',
        title: 'R&D Tax Credits (UK)',
        description: 'How to claim R&D tax credits. Eligibility, documentation, filing process.',
        category: 'Tax & Compliance',
        tags: ['Tax', 'UK', 'R&D'],
        icon: 'file-text',
      },
      {
        id: 'fin-guide-3',
        type: 'guide',
        title: 'Fundraising Financial Prep',
        description: 'What investors want to see: financial hygiene, projections, metrics.',
        category: 'Fundraising',
        tags: ['Fundraising', 'Investors', 'Due Diligence'],
        icon: 'trending-up',
      },
    ],

    checklists: [
      {
        id: 'fin-check-1',
        type: 'checklist',
        title: 'Monthly Financial Close',
        description: '15-item checklist for closing books: reconciliations, accruals, reporting.',
        category: 'Process',
        tags: ['Monthly', 'Close', 'Checklist'],
        icon: 'check-square',
      },
      {
        id: 'fin-check-2',
        type: 'checklist',
        title: 'Year-End Compliance (UK)',
        description: 'Year-end tasks: accounts filing, tax returns, Companies House submission.',
        category: 'Compliance',
        tags: ['Year-End', 'UK', 'Compliance'],
        icon: 'clipboard-check',
      },
    ],
  },

  adviceForFounders: [
    'Know your burn rate and runway at all times - this is your most critical metric',
    'Close your books fast (< 10 days) to make decisions on current data, not stale numbers',
    'Understand unit economics deeply - every hardware founder must know their COGS breakdown',
    'Separate founder salary decisions from business financial health discussions',
    'Build a 3-scenario model (conservative, base, optimistic) and update it monthly',
    'Start investor updates early, even before raising - it builds discipline and relationships',
  ],

  adviceForExecutives: [
    'Automate everything possible - your time is expensive, manual data entry is not worth it',
    'Build tight integration between accounting system and banking for real-time cash visibility',
    'Create financial dashboards that non-finance founders can actually understand',
    'Document all accounting policies and procedures - you won\'t be doing this forever',
    'Proactively flag cash concerns 6 months in advance, not when runway hits 3 months',
    'Teach the founder to read financial statements - it\'s your job to build their financial literacy',
  ],

  adviceForApprentices: [
    'Learn the "why" behind every transaction, not just how to code it',
    'Reconcile everything, every time - this habit will serve you forever',
    'Ask questions when something doesn\'t make sense - you\'re often the first to spot errors',
    'Master one accounting system deeply (Xero or QuickBooks) before learning others',
    'Understand the business model - this makes accounting 10x more interesting',
    'Track your efficiency - how long does AP take? Can you beat your own time?',
  ],
};

// ============================================================================
// SALES FUNCTION
// ============================================================================

export const SALES_PROFILE: FunctionProfile = {
  function: 'Sales',
  title: 'Sales & Business Development',
  description: 'Drive revenue growth through direct sales, partnerships, and channel development. Own the customer pipeline.',
  icon: 'shopping-cart',
  color: '#3b82f6',
  gradient: ['#3b82f6', '#2563eb'] as const,

  keyResponsibilities: [
    'Build and manage sales pipeline',
    'Conduct customer discovery and demos',
    'Close deals and negotiate contracts',
    'Manage key accounts and customer relationships',
    'Develop channel partnerships and distribution',
    'Create sales collateral and pitch decks',
    'Track sales metrics and revenue forecasting',
    'Coordinate with product team on customer feedback',
  ],

  commonChallenges: [
    'Long sales cycles for hardware (3-12 months)',
    'High customer acquisition cost (CAC)',
    'Competing with established brands',
    'Explaining complex technical products simply',
    'Managing inventory vs demand uncertainty',
    'Balancing direct sales vs channel partnerships',
  ],

  successMetrics: [
    'Monthly Recurring Revenue (MRR) or sales',
    'Pipeline value and conversion rates',
    'Average deal size',
    'Sales cycle length',
    'Customer Acquisition Cost (CAC)',
    'CAC payback period',
  ],

  suggestedOKRs: [
    {
      objective: 'Achieve £500k in sales this quarter',
      keyResults: [
        'Close 25 enterprise deals at £20k average',
        'Build pipeline of £1.5M (3x target)',
        'Reduce sales cycle from 120 to 90 days',
      ],
      rationale: 'Revenue growth validates product-market fit and funds further development.',
    },
    {
      objective: 'Establish channel partnerships',
      keyResults: [
        'Sign 3 distribution agreements',
        'Generate £100k in channel-sourced revenue',
        'Train 50 partner sales reps on product',
      ],
      rationale: 'Channels provide leverage and scale beyond direct sales capacity.',
    },
  ],

  resources: {
    people: [
      {
        id: 'sales-exec-1',
        type: 'person',
        title: 'VP Sales - Hardware',
        description: 'Enterprise sales leader with hardware startup experience. Expert in B2B sales cycles.',
        category: 'Fractional Executive',
        tags: ['VP Sales', 'Enterprise', 'Hardware'],
        icon: 'user',
      },
    ],

    suppliers: [
      {
        id: 'sales-sup-1',
        type: 'supplier',
        title: 'HubSpot CRM',
        description: 'Free CRM for startups. Track deals, contacts, and pipeline. £40/mo for advanced features.',
        category: 'CRM',
        tags: ['CRM', 'Pipeline', 'Free Tier'],
        url: 'https://www.hubspot.com',
        icon: 'external-link',
      },
      {
        id: 'sales-sup-2',
        type: 'supplier',
        title: 'Calendly',
        description: 'Automated meeting scheduling. £10/user/mo. Integrates with calendar and CRM.',
        category: 'Sales Tools',
        tags: ['Scheduling', 'Automation'],
        url: 'https://calendly.com',
        icon: 'external-link',
      },
    ],

    aiTools: [
      {
        id: 'sales-ai-1',
        type: 'ai_tool',
        title: 'ChatGPT - Sales Outreach',
        description: 'Generate personalized sales emails, follow-ups, and pitch variations.',
        category: 'AI Assistant',
        tags: ['GPT-4', 'Outreach', 'Copywriting'],
        icon: 'bot',
      },
      {
        id: 'sales-ai-2',
        type: 'ai_tool',
        title: 'Gong.io',
        description: 'AI call analysis. Records, transcribes, and analyzes sales calls for coaching.',
        category: 'Sales Intelligence',
        tags: ['Call Analysis', 'Coaching', 'ML'],
        url: 'https://www.gong.io',
        icon: 'bot',
      },
    ],

    templates: [
      {
        id: 'sales-temp-1',
        type: 'template',
        title: 'Sales Pipeline Tracker',
        description: 'Track every deal from lead to close. Forecast revenue and conversion rates.',
        category: 'Pipeline Management',
        tags: ['Pipeline', 'Forecasting'],
        icon: 'file-spreadsheet',
      },
      {
        id: 'sales-temp-2',
        type: 'template',
        title: 'Cold Email Sequences',
        description: '5-email outreach sequence templates for hardware products.',
        category: 'Outreach',
        tags: ['Email', 'Templates', 'Outreach'],
        icon: 'mail',
      },
    ],

    guides: [
      {
        id: 'sales-guide-1',
        type: 'guide',
        title: 'Hardware Sales Playbook',
        description: 'Complete guide to selling physical products: demos, objections, pricing.',
        category: 'Sales Strategy',
        tags: ['Hardware', 'B2B', 'Playbook'],
        icon: 'book-open',
      },
    ],

    checklists: [
      {
        id: 'sales-check-1',
        type: 'checklist',
        title: 'Pre-Demo Preparation',
        description: 'Checklist for preparing product demos: research, setup, materials.',
        category: 'Process',
        tags: ['Demo', 'Preparation'],
        icon: 'check-square',
      },
    ],
  },

  adviceForFounders: [
    'Do the first 10-20 sales yourself - no one else can sell your vision initially',
    'Sales is a skill you must learn, not delegate away as "someone else\'s job"',
    'Track every conversation in your CRM from day one - your data is gold',
    'Price based on value, not cost - hardware founders chronically underprice',
    'If customers won\'t pre-order, they probably won\'t buy - use this as validation',
  ],

  adviceForExecutives: [
    'Build a repeatable sales process before scaling the team',
    'Create battle cards for every major objection you hear',
    'Record and analyze your best sales calls - what worked?',
    'Coach, don\'t criticize - every sales rep learns differently',
    'Forecast conservatively and beat your numbers - trust is everything',
  ],

  adviceForApprentices: [
    'Listen more than you talk - the best salespeople ask great questions',
    'Learn to handle rejection without taking it personally',
    'Master your product inside and out - confidence comes from knowledge',
    'Follow up relentlessly but politely - most deals are won on the 5th touchpoint',
    'Study your best deals - what patterns led to "yes"?',
  ],
};

// ============================================================================
// MARKETING FUNCTION
// ============================================================================

export const MARKETING_PROFILE: FunctionProfile = {
  function: 'Marketing',
  title: 'Marketing & Brand',
  description: 'Build brand awareness, generate leads, and create compelling content. Drive inbound demand and community growth.',
  icon: 'megaphone',
  color: '#f59e0b',
  gradient: ['#f59e0b', '#d97706'] as const,

  keyResponsibilities: [
    'Develop and execute marketing strategy',
    'Create content (blog, video, social media)',
    'Manage social media channels and community',
    'Run paid advertising campaigns (Google, Meta, LinkedIn)',
    'Generate inbound leads and nurture prospects',
    'Build and optimize website and landing pages',
    'Track marketing metrics and attribution',
    'Coordinate product launches and campaigns',
  ],

  commonChallenges: [
    'Limited marketing budget for hardware startups',
    'Explaining complex technical products to consumers',
    'Building brand from zero awareness',
    'Measuring ROI on brand-building activities',
    'Competing for attention in crowded markets',
    'Coordinating marketing with product development timelines',
  ],

  successMetrics: [
    'Website traffic and conversion rate',
    'Lead generation volume and quality',
    'Cost per lead (CPL)',
    'Social media engagement and followers',
    'Email list growth and open rates',
    'Marketing Qualified Leads (MQLs)',
  ],

  suggestedOKRs: [
    {
      objective: 'Build awareness in target market',
      keyResults: [
        'Grow website traffic from 5k to 25k monthly visitors',
        'Achieve 10k followers on primary social channel',
        'Generate 500 email subscribers from content',
      ],
      rationale: 'Awareness creates the foundation for all future demand generation.',
    },
    {
      objective: 'Create high-converting lead engine',
      keyResults: [
        'Generate 200 qualified leads per month',
        'Reduce cost per lead from £50 to £30',
        'Improve landing page conversion from 2% to 5%',
      ],
      rationale: 'Predictable lead generation enables sales to scale profitably.',
    },
    {
      objective: 'Establish thought leadership',
      keyResults: [
        'Publish 24 high-quality blog posts',
        'Secure 5 podcast/media appearances',
        'Build email newsletter to 5k subscribers',
      ],
      rationale: 'Thought leadership builds trust and inbound demand for hardware products.',
    },
  ],

  resources: {
    people: [
      {
        id: 'mkt-exec-1',
        type: 'person',
        title: 'Head of Marketing - B2B Hardware',
        description: 'Marketing leader with hardware startup experience. Expert in demand generation and content.',
        category: 'Fractional Executive',
        tags: ['CMO', 'B2B', 'Hardware', 'Content'],
        icon: 'user',
      },
      {
        id: 'mkt-exec-2',
        type: 'person',
        title: 'Growth Marketer',
        description: 'Performance marketing specialist. Paid ads, SEO, conversion optimization.',
        category: 'Fractional Executive',
        tags: ['Growth', 'Paid Ads', 'SEO'],
        icon: 'user',
      },
      {
        id: 'mkt-app-1',
        type: 'person',
        title: 'Marketing Apprentice',
        description: 'Junior marketer for social media, content creation, and campaign execution.',
        category: 'Apprentice',
        tags: ['Social Media', 'Content', 'Design'],
        icon: 'user',
      },
    ],

    suppliers: [
      {
        id: 'mkt-sup-1',
        type: 'supplier',
        title: 'Mailchimp / ConvertKit',
        description: 'Email marketing platforms. Free tier for <1000 subscribers, then £10-30/mo.',
        category: 'Email Marketing',
        tags: ['Email', 'Automation', 'Free Tier'],
        url: 'https://mailchimp.com',
        icon: 'external-link',
      },
      {
        id: 'mkt-sup-2',
        type: 'supplier',
        title: 'Canva Pro',
        description: 'Design tool for social graphics, presentations, and marketing materials. £10/user/mo.',
        category: 'Design Tools',
        tags: ['Design', 'Graphics', 'Templates'],
        url: 'https://www.canva.com',
        icon: 'external-link',
      },
      {
        id: 'mkt-sup-3',
        type: 'supplier',
        title: 'Google Analytics & Ads',
        description: 'Free web analytics. Google Ads for paid search. Pay-per-click pricing.',
        category: 'Analytics & Ads',
        tags: ['Analytics', 'Paid Ads', 'Search'],
        url: 'https://analytics.google.com',
        icon: 'external-link',
      },
      {
        id: 'mkt-sup-4',
        type: 'supplier',
        title: 'Buffer / Hootsuite',
        description: 'Social media scheduling and management. £15/mo for 3 channels.',
        category: 'Social Media',
        tags: ['Social Media', 'Scheduling'],
        url: 'https://buffer.com',
        icon: 'external-link',
      },
    ],

    aiTools: [
      {
        id: 'mkt-ai-1',
        type: 'ai_tool',
        title: 'ChatGPT - Content Creation',
        description: 'Generate blog posts, social copy, ad variations, and email campaigns.',
        category: 'AI Assistant',
        tags: ['GPT-4', 'Content', 'Copywriting'],
        icon: 'bot',
      },
      {
        id: 'mkt-ai-2',
        type: 'ai_tool',
        title: 'Midjourney / DALL-E',
        description: 'AI image generation for marketing visuals, social media, and concepts.',
        category: 'AI Tool',
        tags: ['Images', 'AI Art', 'Visuals'],
        icon: 'bot',
      },
      {
        id: 'mkt-ai-3',
        type: 'ai_tool',
        title: 'Jasper AI',
        description: 'Marketing-focused AI writer. Templates for ads, landing pages, emails.',
        category: 'AI Tool',
        tags: ['Copywriting', 'Marketing', 'Templates'],
        url: 'https://www.jasper.ai',
        icon: 'bot',
      },
    ],

    templates: [
      {
        id: 'mkt-temp-1',
        type: 'template',
        title: 'Content Calendar',
        description: 'Plan 3 months of content: blog, social, email. Track themes and distribution.',
        category: 'Content Planning',
        tags: ['Content', 'Planning', 'Calendar'],
        icon: 'calendar',
      },
      {
        id: 'mkt-temp-2',
        type: 'template',
        title: 'Marketing Dashboard',
        description: 'Track traffic, leads, conversion rates, and campaign ROI in one view.',
        category: 'Analytics',
        tags: ['Dashboard', 'Metrics', 'ROI'],
        icon: 'file-spreadsheet',
      },
      {
        id: 'mkt-temp-3',
        type: 'template',
        title: 'Product Launch Plan',
        description: 'Complete launch checklist: pre-launch, launch day, post-launch activities.',
        category: 'Launch',
        tags: ['Launch', 'Checklist', 'Campaign'],
        icon: 'rocket',
      },
    ],

    guides: [
      {
        id: 'mkt-guide-1',
        type: 'guide',
        title: 'Hardware Marketing Playbook',
        description: 'Complete guide to marketing physical products: storytelling, demos, launch strategy.',
        category: 'Marketing Strategy',
        tags: ['Hardware', 'B2C', 'Playbook'],
        icon: 'book-open',
      },
      {
        id: 'mkt-guide-2',
        type: 'guide',
        title: 'Content Marketing for Startups',
        description: 'How to build audience through valuable content. SEO, distribution, repurposing.',
        category: 'Content Strategy',
        tags: ['Content', 'SEO', 'Distribution'],
        icon: 'file-text',
      },
    ],

    checklists: [
      {
        id: 'mkt-check-1',
        type: 'checklist',
        title: 'Pre-Launch Marketing',
        description: '30-day pre-launch checklist: landing page, email list, press kit, partnerships.',
        category: 'Launch',
        tags: ['Launch', 'Pre-Launch', 'Checklist'],
        icon: 'check-square',
      },
    ],
  },

  adviceForFounders: [
    'You are the best marketer for your product initially - no one else has your passion',
    'Focus on one channel (content, social, or paid) and dominate it before spreading thin',
    'Marketing for hardware is about storytelling and showing the product in action',
    'Build in public - document your journey, it creates authentic content',
    'Measure everything, but don\'t obsess over vanity metrics like followers',
    'Great product marketing comes from deeply understanding customer pain points',
  ],

  adviceForExecutives: [
    'Create a repeatable content engine before investing heavily in paid ads',
    'Build marketing systems and templates - make your work scalable',
    'Test quickly and fail fast - marketing is about iteration',
    'Teach the founder to be a thought leader - they\'re your best asset',
    'Balance brand building (long-term) with lead generation (short-term)',
    'Document what works so the next marketer can build on your foundation',
  ],

  adviceForApprentices: [
    'Study great marketing - follow brands you admire and reverse engineer their strategy',
    'Learn the basics: copywriting, design principles, marketing psychology',
    'Engage with your audience genuinely - social media is social first',
    'Track your metrics obsessively - know what\'s working and what\'s not',
    'Create a portfolio of your best work - content, campaigns, results',
    'Be scrappy - you don\'t need a big budget to create impact',
  ],
};

// ============================================================================
// OPERATIONS FUNCTION
// ============================================================================

export const OPS_PROFILE: FunctionProfile = {
  function: 'Ops',
  title: 'Operations & Supply Chain',
  description: 'Manage manufacturing, inventory, logistics, and fulfillment. Ensure products ship on time and costs stay controlled.',
  icon: 'package',
  color: '#8b5cf6',
  gradient: ['#8b5cf6', '#7c3aed'] as const,

  keyResponsibilities: [
    'Manage manufacturing and supplier relationships',
    'Oversee inventory planning and procurement',
    'Coordinate logistics and fulfillment',
    'Optimize supply chain and reduce lead times',
    'Manage quality control and product testing',
    'Handle returns, warranties, and repairs',
    'Track operational KPIs and costs',
    'Negotiate contracts and pricing with suppliers',
  ],

  commonChallenges: [
    'Managing long manufacturing lead times (8-16 weeks)',
    'Balancing inventory vs cash flow constraints',
    'Supplier reliability and quality issues',
    'Customs, duties, and international shipping complexity',
    'Forecasting demand for new hardware products',
    'Managing multiple SKUs and product variants',
  ],

  successMetrics: [
    'On-time delivery rate',
    'Inventory turnover ratio',
    'Cost of Goods Sold (COGS)',
    'Defect rate / return rate',
    'Supplier lead time',
    'Order fulfillment time',
  ],

  suggestedOKRs: [
    {
      objective: 'Achieve operational excellence',
      keyResults: [
        'Maintain 95% on-time delivery rate',
        'Reduce defect rate from 5% to 2%',
        'Keep inventory turnover above 4x annually',
      ],
      rationale: 'Operational efficiency builds customer trust and preserves margins.',
    },
    {
      objective: 'Optimize supply chain costs',
      keyResults: [
        'Reduce COGS by 15% through supplier negotiation',
        'Cut shipping costs from £8 to £5 per unit',
        'Consolidate to 3 core suppliers (from 7)',
      ],
      rationale: 'Lower costs improve margins and enable competitive pricing.',
    },
    {
      objective: 'Scale fulfillment capacity',
      keyResults: [
        'Increase fulfillment capacity from 100 to 500 units/week',
        'Implement automated inventory management system',
        'Reduce order processing time from 3 days to 1 day',
      ],
      rationale: 'Scaling operations unlocks growth without proportional cost increases.',
    },
  ],

  resources: {
    people: [
      {
        id: 'ops-exec-1',
        type: 'person',
        title: 'Head of Operations',
        description: 'Operations leader with hardware manufacturing experience. Expert in supply chain and logistics.',
        category: 'Fractional Executive',
        tags: ['COO', 'Manufacturing', 'Supply Chain'],
        icon: 'user',
      },
      {
        id: 'ops-exec-2',
        type: 'person',
        title: 'Supply Chain Manager',
        description: 'Specialist in supplier relationships, procurement, and inventory management.',
        category: 'Fractional Executive',
        tags: ['Supply Chain', 'Procurement', 'Logistics'],
        icon: 'user',
      },
      {
        id: 'ops-app-1',
        type: 'person',
        title: 'Operations Apprentice',
        description: 'Junior ops coordinator for order processing, inventory tracking, and fulfillment.',
        category: 'Apprentice',
        tags: ['Fulfillment', 'Inventory', 'Coordination'],
        icon: 'user',
      },
    ],

    suppliers: [
      {
        id: 'ops-sup-1',
        type: 'supplier',
        title: 'Alibaba / ThomasNet',
        description: 'Find and vet manufacturers. Alibaba for Asia, ThomasNet for US/UK suppliers.',
        category: 'Supplier Discovery',
        tags: ['Suppliers', 'Manufacturing', 'Sourcing'],
        url: 'https://www.alibaba.com',
        icon: 'external-link',
      },
      {
        id: 'ops-sup-2',
        type: 'supplier',
        title: 'ShipBob / ShipStation',
        description: '3PL fulfillment services. £2-5 per order. Warehousing, picking, packing, shipping.',
        category: 'Fulfillment',
        tags: ['3PL', 'Fulfillment', 'Warehousing'],
        url: 'https://www.shipbob.com',
        icon: 'external-link',
      },
      {
        id: 'ops-sup-3',
        type: 'supplier',
        title: 'Flexport',
        description: 'Freight forwarding and customs brokerage. Simplifies international shipping.',
        category: 'Logistics',
        tags: ['Freight', 'Customs', 'International'],
        url: 'https://www.flexport.com',
        icon: 'external-link',
      },
      {
        id: 'ops-sup-4',
        type: 'supplier',
        title: 'Cin7 / Fishbowl',
        description: 'Inventory management software. £200-500/mo. Track stock, orders, suppliers.',
        category: 'Inventory Software',
        tags: ['Inventory', 'Software', 'Management'],
        url: 'https://www.cin7.com',
        icon: 'external-link',
      },
    ],

    aiTools: [
      {
        id: 'ops-ai-1',
        type: 'ai_tool',
        title: 'ChatGPT - Supplier Negotiations',
        description: 'Draft supplier contracts, negotiation strategies, and procurement emails.',
        category: 'AI Assistant',
        tags: ['GPT-4', 'Negotiation', 'Contracts'],
        icon: 'bot',
      },
      {
        id: 'ops-ai-2',
        type: 'ai_tool',
        title: 'Demand Forecasting AI',
        description: 'ML-based demand prediction to optimize inventory levels and reduce stockouts.',
        category: 'AI Tool',
        tags: ['Forecasting', 'Inventory', 'ML'],
        icon: 'bot',
      },
    ],

    templates: [
      {
        id: 'ops-temp-1',
        type: 'template',
        title: 'Supplier Scorecard',
        description: 'Rate suppliers on quality, delivery, cost, communication. Track performance over time.',
        category: 'Supplier Management',
        tags: ['Suppliers', 'Scorecard', 'KPIs'],
        icon: 'file-spreadsheet',
      },
      {
        id: 'ops-temp-2',
        type: 'template',
        title: 'Bill of Materials (BOM)',
        description: 'Complete BOM template: parts, quantities, costs, suppliers for each product.',
        category: 'Manufacturing',
        tags: ['BOM', 'Manufacturing', 'Costing'],
        icon: 'file-text',
      },
      {
        id: 'ops-temp-3',
        type: 'template',
        title: 'Inventory Planning Model',
        description: 'Calculate reorder points, safety stock, and economic order quantity (EOQ).',
        category: 'Inventory',
        tags: ['Inventory', 'Planning', 'Model'],
        icon: 'calculator',
      },
    ],

    guides: [
      {
        id: 'ops-guide-1',
        type: 'guide',
        title: 'Hardware Manufacturing 101',
        description: 'Complete guide to hardware manufacturing: finding suppliers, quality control, scaling.',
        category: 'Manufacturing',
        tags: ['Hardware', 'Manufacturing', 'Guide'],
        icon: 'book-open',
      },
      {
        id: 'ops-guide-2',
        type: 'guide',
        title: 'International Shipping & Customs',
        description: 'How to navigate international logistics: incoterms, duties, documentation.',
        category: 'Logistics',
        tags: ['Shipping', 'Customs', 'International'],
        icon: 'file-text',
      },
    ],

    checklists: [
      {
        id: 'ops-check-1',
        type: 'checklist',
        title: 'New Supplier Onboarding',
        description: 'Checklist for vetting and onboarding new suppliers: audit, contracts, samples.',
        category: 'Supplier Management',
        tags: ['Suppliers', 'Onboarding', 'Checklist'],
        icon: 'check-square',
      },
      {
        id: 'ops-check-2',
        type: 'checklist',
        title: 'Product Launch Operations',
        description: 'Ops checklist for launches: inventory, fulfillment setup, supplier readiness.',
        category: 'Launch',
        tags: ['Launch', 'Operations', 'Checklist'],
        icon: 'clipboard-check',
      },
    ],
  },

  adviceForFounders: [
    'Visit your manufacturer in person at least once - relationships matter in hardware',
    'Build buffer into every timeline - manufacturing delays are inevitable',
    'Understand your BOM costs down to the penny - small changes compound at scale',
    'Negotiate payment terms aggressively - 30-60 day terms preserve cash flow',
    'Always have a backup supplier for critical components',
    'Quality issues will kill your brand faster than anything - never compromise',
  ],

  adviceForExecutives: [
    'Build strong relationships with 2-3 reliable suppliers rather than many mediocre ones',
    'Document every process - your knowledge must outlive your tenure',
    'Create contingency plans for every critical dependency',
    'Be proactive about supply chain risks - communicate issues early',
    'Balance cost optimization with reliability - cheapest isn\'t always best',
    'Teach the founder to read a P&L through an operations lens',
  ],

  adviceForApprentices: [
    'Learn to read technical drawings and understand manufacturing processes',
    'Master inventory management - it\'s the foundation of operations',
    'Build relationships with everyone in the supply chain - they\'ll help you',
    'Track everything obsessively - good ops is about data discipline',
    'Understand the "why" behind minimum order quantities and lead times',
    'Become the go-to person for order status - communication is your superpower',
  ],
};

// ============================================================================
// ENGINEERING FUNCTION
// ============================================================================

export const ENGINEERING_PROFILE: FunctionProfile = {
  function: 'Engineering',
  title: 'Engineering & Product Development',
  description: 'Design, prototype, and develop hardware and software products. Turn ideas into manufacturable reality.',
  icon: 'cpu',
  color: '#06b6d4',
  gradient: ['#06b6d4', '#0891b2'] as const,

  keyResponsibilities: [
    'Design and develop product hardware and firmware',
    'Create CAD models and engineering drawings',
    'Build and test prototypes',
    'Manage product development roadmap',
    'Conduct engineering reviews and design validation',
    'Work with manufacturers on DFM (Design for Manufacturing)',
    'Handle certifications (CE, FCC, safety testing)',
    'Maintain technical documentation and specs',
  ],

  commonChallenges: [
    'Balancing feature scope vs time-to-market',
    'Manufacturing constraints conflicting with ideal design',
    'Component sourcing and supply chain disruptions',
    'Meeting regulatory and safety certification requirements',
    'Debugging hardware issues in production',
    'Managing engineering changes after tooling',
  ],

  successMetrics: [
    'Product development velocity (features shipped)',
    'Prototype-to-production timeline',
    'Defect rate and reliability metrics',
    'Engineering change order (ECO) frequency',
    'R&D spend as % of revenue',
    'Patent applications filed',
  ],

  suggestedOKRs: [
    {
      objective: 'Ship production-ready v2.0',
      keyResults: [
        'Complete engineering validation by end of Q2',
        'Pass all required certifications (CE, FCC, RoHS)',
        'Reduce BOM cost by 20% vs v1.0',
      ],
      rationale: 'Shipping improved hardware demonstrates progress and enables growth.',
    },
    {
      objective: 'Improve product reliability',
      keyResults: [
        'Reduce field failure rate from 8% to 3%',
        'Implement automated testing for 95% of functionality',
        'Achieve MTBF (Mean Time Between Failures) of 10,000 hours',
      ],
      rationale: 'Reliability builds customer trust and reduces support costs.',
    },
    {
      objective: 'Build technical IP and defensibility',
      keyResults: [
        'File 2 patents on core innovations',
        'Publish 3 technical papers or case studies',
        'Open source 1 developer tool to build ecosystem',
      ],
      rationale: 'IP and thought leadership create competitive moats.',
    },
  ],

  resources: {
    people: [
      {
        id: 'eng-exec-1',
        type: 'person',
        title: 'VP Engineering - Hardware',
        description: 'Engineering leader with hardware product development experience. Expert in DFM and certifications.',
        category: 'Fractional Executive',
        tags: ['CTO', 'Hardware', 'Product Development'],
        icon: 'user',
      },
      {
        id: 'eng-exec-2',
        type: 'person',
        title: 'Mechanical Engineer',
        description: 'CAD design, prototyping, and manufacturing engineering specialist.',
        category: 'Fractional Executive',
        tags: ['Mechanical', 'CAD', 'DFM'],
        icon: 'user',
      },
      {
        id: 'eng-exec-3',
        type: 'person',
        title: 'Firmware Engineer',
        description: 'Embedded systems and firmware development for hardware products.',
        category: 'Fractional Executive',
        tags: ['Firmware', 'Embedded', 'IoT'],
        icon: 'user',
      },
      {
        id: 'eng-app-1',
        type: 'person',
        title: 'Engineering Apprentice',
        description: 'Junior engineer for CAD work, testing, and documentation.',
        category: 'Apprentice',
        tags: ['CAD', 'Testing', 'Documentation'],
        icon: 'user',
      },
    ],

    suppliers: [
      {
        id: 'eng-sup-1',
        type: 'supplier',
        title: 'Fusion 360 / SolidWorks',
        description: 'CAD software for mechanical design. Fusion 360: £50/mo, SolidWorks: £4k/year.',
        category: 'CAD Software',
        tags: ['CAD', '3D Design', 'Engineering'],
        url: 'https://www.autodesk.com/products/fusion-360',
        icon: 'external-link',
      },
      {
        id: 'eng-sup-2',
        type: 'supplier',
        title: 'PCBWay / JLCPCB',
        description: 'PCB fabrication and assembly. Fast prototyping, low MOQs, affordable.',
        category: 'PCB Manufacturing',
        tags: ['PCB', 'Manufacturing', 'Prototyping'],
        url: 'https://www.pcbway.com',
        icon: 'external-link',
      },
      {
        id: 'eng-sup-3',
        type: 'supplier',
        title: 'GitHub / GitLab',
        description: 'Version control for firmware and software. Free for small teams.',
        category: 'Development Tools',
        tags: ['Git', 'Version Control', 'Collaboration'],
        url: 'https://github.com',
        icon: 'external-link',
      },
      {
        id: 'eng-sup-4',
        type: 'supplier',
        title: 'Element14 / DigiKey',
        description: 'Electronic component distributors. Fast shipping, broad selection.',
        category: 'Component Sourcing',
        tags: ['Components', 'Electronics', 'Supply'],
        url: 'https://www.element14.com',
        icon: 'external-link',
      },
    ],

    aiTools: [
      {
        id: 'eng-ai-1',
        type: 'ai_tool',
        title: 'GitHub Copilot',
        description: 'AI pair programmer for firmware and software development. £10/user/mo.',
        category: 'AI Tool',
        tags: ['Coding', 'AI', 'Productivity'],
        url: 'https://github.com/features/copilot',
        icon: 'bot',
      },
      {
        id: 'eng-ai-2',
        type: 'ai_tool',
        title: 'ChatGPT - Technical Documentation',
        description: 'Generate technical specs, API docs, and engineering documentation.',
        category: 'AI Assistant',
        tags: ['GPT-4', 'Documentation', 'Technical Writing'],
        icon: 'bot',
      },
    ],

    templates: [
      {
        id: 'eng-temp-1',
        type: 'template',
        title: 'Product Requirements Document (PRD)',
        description: 'Template for defining product specs, features, and acceptance criteria.',
        category: 'Product Management',
        tags: ['PRD', 'Requirements', 'Specs'],
        icon: 'file-text',
      },
      {
        id: 'eng-temp-2',
        type: 'template',
        title: 'Design Review Checklist',
        description: 'Checklist for engineering design reviews: DFM, DFT, safety, reliability.',
        category: 'Design Process',
        tags: ['Design Review', 'DFM', 'Checklist'],
        icon: 'clipboard-check',
      },
      {
        id: 'eng-temp-3',
        type: 'template',
        title: 'Test Plan Template',
        description: 'Complete test plan: unit tests, integration tests, acceptance criteria.',
        category: 'Testing',
        tags: ['Testing', 'QA', 'Validation'],
        icon: 'check-square',
      },
    ],

    guides: [
      {
        id: 'eng-guide-1',
        type: 'guide',
        title: 'Hardware Product Development Process',
        description: 'End-to-end guide: concept → prototype → EVT → DVT → PVT → production.',
        category: 'Product Development',
        tags: ['Hardware', 'Process', 'Guide'],
        icon: 'book-open',
      },
      {
        id: 'eng-guide-2',
        type: 'guide',
        title: 'Design for Manufacturing (DFM)',
        description: 'How to design hardware that\'s actually manufacturable at scale.',
        category: 'Design',
        tags: ['DFM', 'Manufacturing', 'Design'],
        icon: 'file-text',
      },
      {
        id: 'eng-guide-3',
        type: 'guide',
        title: 'Hardware Certifications Guide',
        description: 'Navigate CE, FCC, UL, RoHS certifications. Requirements and testing.',
        category: 'Certifications',
        tags: ['Certifications', 'Compliance', 'Regulatory'],
        icon: 'shield',
      },
    ],

    checklists: [
      {
        id: 'eng-check-1',
        type: 'checklist',
        title: 'Pre-Production Readiness',
        description: 'Checklist before mass production: design frozen, DFM complete, certifications passed.',
        category: 'Manufacturing',
        tags: ['Production', 'Readiness', 'Checklist'],
        icon: 'check-square',
      },
    ],
  },

  adviceForFounders: [
    'Engineering timelines always take longer than expected - add 50% buffer',
    'Invest in prototyping early - physical testing reveals issues CAD can\'t',
    'Don\'t skip design reviews - catching issues early saves months later',
    'Understand the basics of your product\'s technology - you need to sell the vision',
    'Balance innovation with manufacturability - groundbreaking designs are hard to produce',
    'Protect your IP early - file provisional patents before showing prototypes publicly',
  ],

  adviceForExecutives: [
    'Build engineering culture around documentation - tribal knowledge doesn\'t scale',
    'Create design checklists and standards - prevent repeated mistakes',
    'Communicate trade-offs clearly to founders - they need to understand engineering constraints',
    'Balance technical debt vs new features - shortcuts today create problems tomorrow',
    'Test relentlessly - hardware bugs are expensive to fix post-production',
    'Build strong relationships with your manufacturer\'s engineering team',
  ],

  adviceForApprentices: [
    'Master one CAD tool deeply before learning others',
    'Build things with your hands - physical prototyping teaches intuition',
    'Study how existing products are designed - reverse engineer competitors',
    'Learn to read datasheets and understand component specifications',
    'Ask "why" constantly - understand design decisions, don\'t just execute',
    'Document everything as you go - future you will thank present you',
  ],
};

// ============================================================================
// ADMIN FUNCTION
// ============================================================================

export const ADMIN_PROFILE: FunctionProfile = {
  function: 'Admin',
  title: 'Admin & People Operations',
  description: 'Manage HR, legal, compliance, and administrative operations. Keep the company running smoothly.',
  icon: 'briefcase',
  color: '#ec4899',
  gradient: ['#ec4899', '#db2777'] as const,

  keyResponsibilities: [
    'Manage HR operations (hiring, onboarding, offboarding)',
    'Handle payroll and benefits administration',
    'Ensure legal compliance and regulatory filings',
    'Manage contracts and legal documentation',
    'Coordinate office operations and facilities',
    'Oversee insurance policies and risk management',
    'Maintain employee records and policies',
    'Handle employee relations and workplace issues',
  ],

  commonChallenges: [
    'Limited budget for comprehensive benefits packages',
    'Navigating complex employment law across jurisdictions',
    'Managing contractor vs employee classifications',
    'Scaling HR processes as team grows',
    'Maintaining compliance with data protection (GDPR)',
    'Balancing employee needs with company constraints',
  ],

  successMetrics: [
    'Employee satisfaction and retention rate',
    'Time to hire (days)',
    'Onboarding completion rate',
    'Compliance audit pass rate',
    'HR cost per employee',
    'Employee handbook and policy coverage',
  ],

  suggestedOKRs: [
    {
      objective: 'Build scalable HR foundation',
      keyResults: [
        'Implement HRIS system (BambooHR or similar)',
        'Document all core HR policies and employee handbook',
        'Reduce onboarding time from 2 weeks to 3 days',
      ],
      rationale: 'Strong HR systems enable scaling and reduce compliance risk.',
    },
    {
      objective: 'Improve employee experience',
      keyResults: [
        'Achieve 4.0+ employee satisfaction score',
        'Reduce turnover rate from 30% to 15%',
        'Implement quarterly performance reviews',
      ],
      rationale: 'Happy employees are more productive and stay longer.',
    },
    {
      objective: 'Ensure legal and compliance excellence',
      keyResults: [
        'Pass compliance audit with zero findings',
        'Update all contracts to current legal standards',
        'Implement data protection policies (GDPR compliant)',
      ],
      rationale: 'Compliance protects the company and builds investor confidence.',
    },
  ],

  resources: {
    people: [
      {
        id: 'admin-exec-1',
        type: 'person',
        title: 'Head of People (HR)',
        description: 'HR leader with startup experience. Expert in building HR systems from scratch.',
        category: 'Fractional Executive',
        tags: ['HR', 'People Ops', 'Startups'],
        icon: 'user',
      },
      {
        id: 'admin-exec-2',
        type: 'person',
        title: 'Startup Lawyer',
        description: 'Corporate attorney specializing in startups. Contracts, compliance, IP.',
        category: 'Fractional Executive',
        tags: ['Legal', 'Contracts', 'Compliance'],
        icon: 'user',
      },
      {
        id: 'admin-app-1',
        type: 'person',
        title: 'Admin Apprentice',
        description: 'Junior admin for scheduling, document management, and operational support.',
        category: 'Apprentice',
        tags: ['Admin', 'Operations', 'Support'],
        icon: 'user',
      },
    ],

    suppliers: [
      {
        id: 'admin-sup-1',
        type: 'supplier',
        title: 'BambooHR / Rippling',
        description: 'HRIS platforms for payroll, benefits, onboarding. £5-15/employee/mo.',
        category: 'HR Software',
        tags: ['HRIS', 'Payroll', 'Benefits'],
        url: 'https://www.bamboohr.com',
        icon: 'external-link',
      },
      {
        id: 'admin-sup-2',
        type: 'supplier',
        title: 'Deel / Remote',
        description: 'Global payroll and contractor management. Simplifies international hiring.',
        category: 'Global Payroll',
        tags: ['Payroll', 'Contractors', 'International'],
        url: 'https://www.deel.com',
        icon: 'external-link',
      },
      {
        id: 'admin-sup-3',
        type: 'supplier',
        title: 'Rocket Lawyer / LegalZoom',
        description: 'DIY legal documents and affordable legal advice. £30-100/mo plans.',
        category: 'Legal Services',
        tags: ['Legal', 'Contracts', 'Templates'],
        url: 'https://www.rocketlawyer.com',
        icon: 'external-link',
      },
      {
        id: 'admin-sup-4',
        type: 'supplier',
        title: 'DocuSign',
        description: 'E-signature platform. £10-25/user/mo. Essential for remote hiring.',
        category: 'Document Management',
        tags: ['E-Signature', 'Contracts', 'Remote'],
        url: 'https://www.docusign.com',
        icon: 'external-link',
      },
    ],

    aiTools: [
      {
        id: 'admin-ai-1',
        type: 'ai_tool',
        title: 'ChatGPT - HR Documentation',
        description: 'Generate job descriptions, employee handbooks, policy documents.',
        category: 'AI Assistant',
        tags: ['GPT-4', 'HR', 'Documentation'],
        icon: 'bot',
      },
      {
        id: 'admin-ai-2',
        type: 'ai_tool',
        title: 'Harvey AI',
        description: 'AI legal assistant for contract review and legal research.',
        category: 'AI Tool',
        tags: ['Legal', 'Contracts', 'AI'],
        url: 'https://www.harvey.ai',
        icon: 'bot',
      },
    ],

    templates: [
      {
        id: 'admin-temp-1',
        type: 'template',
        title: 'Employee Handbook',
        description: 'Complete employee handbook template: policies, benefits, code of conduct.',
        category: 'HR Documentation',
        tags: ['Handbook', 'Policies', 'HR'],
        icon: 'book',
      },
      {
        id: 'admin-temp-2',
        type: 'template',
        title: 'Employment Contracts (UK)',
        description: 'UK-compliant employment contract templates for employees and contractors.',
        category: 'Legal',
        tags: ['Contracts', 'Employment', 'UK'],
        icon: 'file-text',
      },
      {
        id: 'admin-temp-3',
        type: 'template',
        title: 'Onboarding Checklist',
        description: 'Complete onboarding checklist: IT setup, paperwork, training, introductions.',
        category: 'HR Process',
        tags: ['Onboarding', 'Checklist', 'HR'],
        icon: 'check-square',
      },
    ],

    guides: [
      {
        id: 'admin-guide-1',
        type: 'guide',
        title: 'UK Employment Law Basics',
        description: 'Essential guide to UK employment law for startups: contracts, rights, compliance.',
        category: 'Legal',
        tags: ['UK', 'Employment Law', 'Compliance'],
        icon: 'scale',
      },
      {
        id: 'admin-guide-2',
        type: 'guide',
        title: 'Building HR Systems from Zero',
        description: 'How to build HR infrastructure in a startup: processes, tools, policies.',
        category: 'HR',
        tags: ['HR', 'Systems', 'Startups'],
        icon: 'book-open',
      },
      {
        id: 'admin-guide-3',
        type: 'guide',
        title: 'GDPR Compliance for Startups',
        description: 'Practical GDPR compliance guide: data handling, privacy policies, consent.',
        category: 'Compliance',
        tags: ['GDPR', 'Privacy', 'Compliance'],
        icon: 'shield',
      },
    ],

    checklists: [
      {
        id: 'admin-check-1',
        type: 'checklist',
        title: 'New Hire Onboarding',
        description: 'Complete checklist for onboarding: contracts, IT, training, introductions.',
        category: 'HR Process',
        tags: ['Onboarding', 'Hiring', 'Checklist'],
        icon: 'user-plus',
      },
      {
        id: 'admin-check-2',
        type: 'checklist',
        title: 'Annual Compliance Review',
        description: 'Annual compliance checklist: filings, audits, policy updates, insurance.',
        category: 'Compliance',
        tags: ['Compliance', 'Annual', 'Audit'],
        icon: 'clipboard-check',
      },
    ],
  },

  adviceForFounders: [
    'Invest in HR early - bad hires are expensive, good systems prevent them',
    'Document everything in writing - verbal agreements create legal risk',
    'Treat contractors fairly but maintain proper classification (employment law matters)',
    'Build company culture intentionally - it\'s easier to create than fix',
    'Get proper legal advice for equity, fundraising, and employment - DIY can backfire',
    'Make time for people issues - ignoring them makes them worse',
  ],

  adviceForExecutives: [
    'Build HR systems that scale - your processes will be used by the next person',
    'Be proactive about compliance - catch issues before they become problems',
    'Create templates for everything - repetitive tasks should be systematized',
    'Balance employee advocacy with business needs - you serve both',
    'Document difficult conversations and decisions - protect the company legally',
    'Teach the founder HR basics - they need to understand employment law',
  ],

  adviceForApprentices: [
    'Master confidentiality - HR requires absolute discretion',
    'Learn employment law basics - understand the rules you\'re enforcing',
    'Develop empathy - you\'re often dealing with people\'s livelihoods',
    'Be detail-oriented - small mistakes in HR have big consequences',
    'Build systems thinking - HR is about processes, not just tasks',
    'Stay organized - juggling multiple HR processes requires discipline',
  ],
};

// Export all function profiles
export const FUNCTION_PROFILES: Record<Function, FunctionProfile> = {
  Finance: FINANCE_PROFILE,
  Sales: SALES_PROFILE,
  Marketing: MARKETING_PROFILE,
  Ops: OPS_PROFILE,
  Engineering: ENGINEERING_PROFILE,
  Admin: ADMIN_PROFILE,
};

export function getFunctionProfile(func: Function): FunctionProfile {
  return FUNCTION_PROFILES[func];
}

export function getAllFunctionProfiles(): FunctionProfile[] {
  return Object.values(FUNCTION_PROFILES);
}
