/**
 * Third-Party AI Tools Data for Community Marketplace
 * External AI tools that teams can use, organized by business function
 */

export type BusinessFunction = 'Sales' | 'Marketing' | 'Finance' | 'Ops' | 'Engineering' | 'Admin';

export interface ThirdPartyAITool {
  id: string;
  name: string;
  provider: string;
  purpose: string;
  functions: BusinessFunction[];
  costPerMonth: number;
  website: string;
  capabilities: string[];
  integrations: string[];
  category: 'productivity' | 'sales' | 'marketing' | 'finance' | 'engineering' | 'operations' | 'manufacturing';
  // Optional detailed fields for enhanced modal
  description?: string;
  useCases?: string[];
  keyFeatures?: string[];
  pricing?: {
    starter?: string;
    professional?: string;
    enterprise?: string;
    notes?: string;
  };
  setup?: {
    difficulty?: 'Easy' | 'Moderate' | 'Advanced';
    timeToValue?: string;
    requirements?: string[];
  };
  support?: {
    documentation?: string;
    community?: string;
    email?: boolean;
    phone?: boolean;
  };
  reviews?: {
    rating?: number;
    totalReviews?: number;
    pros?: string[];
    cons?: string[];
  };
}

export const THIRD_PARTY_AI_TOOLS: ThirdPartyAITool[] = [
  // ========== FINANCE (3 agents) ==========
  {
    id: 'ai-finance-1',
    name: 'Vic AI',
    provider: 'Vic.ai',
    purpose: 'Autonomous invoice processing and accounts payable automation',
    description: 'Vic AI is an autonomous AI agent for finance teams that processes invoices, matches purchase orders, assigns GL codes, and automates approval workflows with 95%+ accuracy. It learns your company\'s coding patterns and reduces manual data entry by 80%.',
    functions: ['Finance'],
    costPerMonth: 450,
    website: 'https://vic.ai',
    capabilities: [
      'Automated invoice extraction',
      'GL code assignment',
      'Duplicate invoice detection',
      'Purchase order matching',
      'Approval workflow automation',
      'Real-time spend analytics',
    ],
    integrations: ['QuickBooks', 'Xero', 'NetSuite', 'Slack'],
    category: 'finance',
    useCases: [
      'Reduce invoice processing time from 5 minutes to 30 seconds per invoice',
      'Automatically code 95% of invoices without human review',
      'Catch duplicate invoices and prevent overpayments',
    ],
    keyFeatures: [
      'Machine learning that adapts to your coding patterns',
      'Multi-entity and multi-currency support',
      'Real-time approval notifications in Slack',
    ],
    pricing: {
      professional: '£450/month for up to 500 invoices',
      enterprise: '£1,200/month for unlimited invoices',
      notes: 'Pricing scales with invoice volume',
    },
    setup: {
      difficulty: 'Easy',
      timeToValue: '1-2 weeks',
      requirements: ['Accounting software integration', 'Email forwarding for invoices'],
    },
    support: {
      documentation: 'Comprehensive guides and video tutorials',
      community: 'Active Slack community',
      email: true,
      phone: true,
    },
    reviews: {
      rating: 4.7,
      totalReviews: 890,
      pros: ['Saves 20+ hours/month on invoice processing', 'High accuracy on GL coding', 'Great customer support'],
      cons: ['Requires clean data to train effectively', 'Limited customization options'],
    },
  },
  {
    id: 'ai-finance-2',
    name: 'Digits AI',
    provider: 'Digits',
    purpose: 'AI-powered bookkeeping and financial insights',
    description: 'Digits is an AI-first finance platform that automates bookkeeping, generates real-time financial reports, and provides CFO-level insights. It connects to your bank accounts and categorizes every transaction automatically, giving you up-to-date financials 24/7.',
    functions: ['Finance'],
    costPerMonth: 350,
    website: 'https://digits.com',
    capabilities: [
      'Automated bookkeeping',
      'Financial reporting dashboards',
      'Cash flow forecasting',
      'Expense categorization',
      'Revenue recognition',
      'Financial health scoring',
    ],
    integrations: ['Bank accounts', 'Credit cards', 'Stripe', 'Plaid'],
    category: 'finance',
    useCases: [
      'Get real-time P&L and balance sheet without waiting for month-end close',
      'Forecast cash runway based on spending patterns',
      'Automatically categorize expenses with 98% accuracy',
    ],
    keyFeatures: [
      'Real-time financial dashboards',
      'AI-powered cash flow forecasting',
      'Automated transaction categorization',
    ],
    pricing: {
      starter: '£350/month for startups (up to £1M revenue)',
      professional: '£650/month for growing companies',
      enterprise: 'Custom pricing for enterprise',
    },
    setup: {
      difficulty: 'Easy',
      timeToValue: '1 week',
      requirements: ['Bank account access via Plaid', 'Historical transaction data'],
    },
    support: {
      documentation: 'Help center and video walkthroughs',
      community: 'Limited community support',
      email: true,
      phone: false,
    },
    reviews: {
      rating: 4.5,
      totalReviews: 1240,
      pros: ['Beautiful interface', 'Real-time financials', 'Accurate categorization'],
      cons: ['Premium pricing', 'Limited customization', 'No phone support'],
    },
  },
  {
    id: 'ai-finance-3',
    name: 'Gemini Pro',
    provider: 'Google',
    purpose: 'Financial data analysis and spreadsheet automation',
    description: 'Gemini Pro is Google\'s advanced AI model integrated into Google Workspace, enabling natural language financial analysis in Sheets. Ask questions like "What\'s our burn rate?" and get instant answers with charts and formulas automatically generated.',
    functions: ['Finance'],
    costPerMonth: 200,
    website: 'https://ai.google.dev',
    capabilities: [
      'Financial modeling',
      'Google Sheets integration',
      'Budget variance analysis',
      'Scenario planning',
      'Chart and report generation',
      'Data validation',
    ],
    integrations: ['Google Workspace', 'Sheets', 'Docs', 'Drive'],
    category: 'finance',
    useCases: [
      'Build 3-year financial models in minutes using natural language',
      'Generate variance reports comparing actuals vs budget',
      'Create scenario analyses for different growth paths',
    ],
    keyFeatures: [
      'Natural language queries in Sheets',
      'Automatic formula generation',
      'Multi-modal analysis (text, tables, charts)',
    ],
    pricing: {
      professional: '£200/month per user (Google Workspace AI add-on)',
      enterprise: 'Volume discounts available',
      notes: 'Requires Google Workspace subscription',
    },
    setup: {
      difficulty: 'Easy',
      timeToValue: '1 day',
      requirements: ['Google Workspace account', 'Google Sheets access'],
    },
    support: {
      documentation: 'Google AI documentation and tutorials',
      community: 'Large Google Workspace community',
      email: true,
      phone: false,
    },
    reviews: {
      rating: 4.3,
      totalReviews: 5600,
      pros: ['Seamless Sheets integration', 'Natural language interface', 'Fast responses'],
      cons: ['Requires Workspace subscription', 'Limited to Google ecosystem', 'Can make errors with complex formulas'],
    },
  },

  // ========== SALES (4 agents) ==========
  {
    id: 'ai-sales-1',
    name: '11x Alice',
    provider: '11x',
    purpose: 'Autonomous AI SDR for outbound sales',
    description: '11x Alice is an AI Sales Development Representative that autonomously prospects leads, crafts personalized outreach, follows up, and books meetings - all without human intervention. It operates 24/7 and can handle 1000+ outbound conversations simultaneously.',
    functions: ['Sales'],
    costPerMonth: 850,
    website: 'https://11x.ai',
    capabilities: [
      'Automated lead prospecting',
      'Personalized email sequences',
      'Multi-channel outreach',
      'Meeting scheduling',
      'Lead qualification',
      'CRM integration',
    ],
    integrations: ['Salesforce', 'HubSpot', 'LinkedIn', 'Gmail'],
    category: 'sales',
    useCases: [
      'Scale outbound to 1000+ prospects/month with consistent messaging',
      'Book 50+ qualified meetings per month on autopilot',
      'Reduce SDR headcount while maintaining pipeline velocity',
    ],
    keyFeatures: [
      'Autonomous multi-touch campaigns',
      'AI-powered personalization at scale',
      'Natural language email generation',
    ],
    pricing: {
      professional: '£850/month for up to 2,500 contacts',
      enterprise: '£2,200/month for unlimited contacts',
      notes: 'Pricing based on outreach volume',
    },
    setup: {
      difficulty: 'Moderate',
      timeToValue: '2-3 weeks',
      requirements: ['CRM integration', 'Email domain authentication', 'Target account list'],
    },
    support: {
      documentation: 'Onboarding guides and best practices',
      community: 'Private Slack workspace for customers',
      email: true,
      phone: true,
    },
    reviews: {
      rating: 4.4,
      totalReviews: 420,
      pros: ['Books real meetings', 'Saves 30+ hours/week', 'Natural-sounding emails'],
      cons: ['Expensive for early-stage startups', 'Requires good data to start', 'Limited customization'],
    },
  },
  {
    id: 'ai-sales-2',
    name: 'Gong AI',
    provider: 'Gong',
    purpose: 'Sales call analysis and revenue intelligence',
    functions: ['Sales'],
    costPerMonth: 400,
    website: 'https://gong.io',
    capabilities: [
      'Call recording and transcription',
      'Conversation insights',
      'Deal risk assessment',
      'Coaching recommendations',
      'Competitor mention tracking',
      'Revenue forecasting',
    ],
    integrations: ['Zoom', 'Salesforce', 'Slack', 'Teams'],
    category: 'sales',
  },
  {
    id: 'ai-sales-3',
    name: 'Clay AI',
    provider: 'Clay',
    purpose: 'Lead enrichment and prospecting automation',
    functions: ['Sales'],
    costPerMonth: 300,
    website: 'https://clay.com',
    capabilities: [
      'Contact data enrichment',
      'Company intelligence',
      'Tech stack detection',
      'Social media insights',
      'Intent data signals',
      'List building automation',
    ],
    integrations: ['Clearbit', 'LinkedIn', 'Salesforce', 'CSV'],
    category: 'sales',
  },
  {
    id: 'ai-sales-4',
    name: 'ElevenLabs Voice AI',
    provider: 'ElevenLabs',
    purpose: 'Sales demo voiceovers and presentation narration',
    functions: ['Sales'],
    costPerMonth: 99,
    website: 'https://elevenlabs.io',
    capabilities: [
      'Text-to-speech for demos',
      'Multi-language support',
      'Voice cloning',
      'Custom pronunciations',
      'Audio editing tools',
      'API integration',
    ],
    integrations: ['Descript', 'Adobe Premiere', 'API'],
    category: 'sales',
  },

  // ========== MARKETING (6 agents) ==========
  {
    id: 'ai-marketing-1',
    name: 'Jasper AI',
    provider: 'Jasper',
    purpose: 'Content creation for marketing campaigns',
    functions: ['Marketing'],
    costPerMonth: 200,
    website: 'https://jasper.ai',
    capabilities: [
      'Blog post generation',
      'Social media content',
      'Email campaign copy',
      'SEO optimization',
      'Brand voice consistency',
      'Content templates',
    ],
    integrations: ['WordPress', 'Webflow', 'Grammarly', 'Surfer SEO'],
    category: 'marketing',
  },
  {
    id: 'ai-marketing-2',
    name: 'Copy.ai',
    provider: 'Copy.ai',
    purpose: 'Marketing copy and workflow automation',
    functions: ['Marketing'],
    costPerMonth: 180,
    website: 'https://copy.ai',
    capabilities: [
      'Ad copy generation',
      'Product descriptions',
      'Landing page copy',
      'Email sequences',
      'A/B test variants',
      'Workflow automation',
    ],
    integrations: ['HubSpot', 'Mailchimp', 'Shopify', 'WordPress'],
    category: 'marketing',
  },
  {
    id: 'ai-marketing-3',
    name: 'Midjourney',
    provider: 'Midjourney',
    purpose: 'High-quality imagery for marketing materials',
    functions: ['Marketing'],
    costPerMonth: 60,
    website: 'https://midjourney.com',
    capabilities: [
      'Photorealistic imagery',
      'Product visualization',
      'Brand identity concepts',
      'Website hero images',
      'Pitch deck visuals',
      'Style consistency',
    ],
    integrations: ['Discord', 'Figma'],
    category: 'marketing',
  },
  {
    id: 'ai-marketing-4',
    name: 'DALL-E 3',
    provider: 'OpenAI',
    purpose: 'Marketing visuals and social media graphics',
    functions: ['Marketing'],
    costPerMonth: 120,
    website: 'https://openai.com',
    capabilities: [
      'Social media graphics',
      'Ad creative concepts',
      'Presentation visuals',
      'Product mockups',
      'Infographic elements',
      'Text rendering in images',
    ],
    integrations: ['Figma', 'Canva', 'OpenAI API'],
    category: 'marketing',
  },
  {
    id: 'ai-marketing-5',
    name: 'Perplexity Pro',
    provider: 'Perplexity',
    purpose: 'Market research and competitive intelligence',
    functions: ['Marketing'],
    costPerMonth: 80,
    website: 'https://perplexity.ai',
    capabilities: [
      'Real-time web search',
      'Competitor research',
      'Market trend analysis',
      'Citation-backed answers',
      'News monitoring',
      'Industry insights',
    ],
    integrations: ['Browser extension', 'API'],
    category: 'marketing',
  },
  {
    id: 'ai-marketing-6',
    name: 'Runway Gen-2',
    provider: 'Runway',
    purpose: 'AI video generation for marketing content',
    functions: ['Marketing'],
    costPerMonth: 250,
    website: 'https://runwayml.com',
    capabilities: [
      'Text-to-video generation',
      'Image-to-video animation',
      'Video style transfer',
      'Motion graphics',
      'Product demo videos',
      'Social media content',
    ],
    integrations: ['Adobe Premiere', 'Final Cut Pro', 'DaVinci Resolve'],
    category: 'marketing',
  },

  // ========== OPS (3 agents) ==========
  {
    id: 'ai-ops-1',
    name: 'Hebbia AI',
    provider: 'Hebbia',
    purpose: 'Document analysis and operational workflows',
    functions: ['Ops'],
    costPerMonth: 400,
    website: 'https://hebbia.ai',
    capabilities: [
      'Multi-document analysis',
      'Contract review',
      'Compliance checking',
      'Data extraction',
      'Workflow automation',
      'Knowledge synthesis',
    ],
    integrations: ['Google Drive', 'Dropbox', 'SharePoint', 'Slack'],
    category: 'operations',
  },
  {
    id: 'ai-ops-2',
    name: 'Zapier AI',
    provider: 'Zapier',
    purpose: 'Workflow automation across tools',
    functions: ['Ops'],
    costPerMonth: 150,
    website: 'https://zapier.com',
    capabilities: [
      'App integration',
      'Automated workflows',
      'Data syncing',
      'Trigger-based actions',
      'Multi-step automation',
      'AI-powered suggestions',
    ],
    integrations: ['5000+ apps', 'Slack', 'Gmail', 'Sheets', 'CRM'],
    category: 'operations',
  },
  {
    id: 'ai-ops-3',
    name: 'Harvey AI',
    provider: 'Harvey',
    purpose: 'Legal document review and compliance',
    functions: ['Ops'],
    costPerMonth: 500,
    website: 'https://harvey.ai',
    capabilities: [
      'Contract analysis',
      'Legal research',
      'Compliance checking',
      'Risk assessment',
      'Document drafting',
      'Regulatory updates',
    ],
    integrations: ['Microsoft Word', 'Google Docs', 'DocuSign'],
    category: 'operations',
  },

  // ========== ENGINEERING - Manufacturing AI (4 agents) ==========
  {
    id: 'ai-mfg-1',
    name: 'Autodesk Fusion AI',
    provider: 'Autodesk',
    purpose: 'Generative design and AI-powered CAD for manufacturing optimization',
    description: 'Autodesk Fusion 360 with AI capabilities enables engineers to create optimized designs by defining goals and constraints. The AI explores thousands of design alternatives, generating lightweight, manufacturable parts.',
    functions: ['Engineering'],
    costPerMonth: 680,
    website: 'https://autodesk.com/products/fusion-360',
    capabilities: [
      'Generative design with manufacturing constraints',
      'Topology optimization for weight reduction',
      'DFM (Design for Manufacturing) analysis',
      'Material selection optimization',
      'Cost estimation and simulation',
      'Multi-physics simulation',
    ],
    integrations: ['SolidWorks', 'Inventor', 'STEP/IGES', 'CAM software', '3D printers'],
    category: 'manufacturing',
    useCases: [
      'Optimize bracket designs for aerospace components',
      'Reduce material costs while maintaining structural integrity',
      'Generate multiple design alternatives for rapid prototyping',
    ],
    keyFeatures: [
      'AI-driven generative design engine',
      'Cloud-based collaboration',
      'Integrated CAM and simulation',
    ],
    pricing: {
      professional: '£680/month (includes AI features)',
      enterprise: 'Custom pricing for teams',
    },
    setup: {
      difficulty: 'Advanced',
      timeToValue: '2-4 weeks',
      requirements: ['Windows 10/11 or macOS', '8GB RAM minimum', 'GPU recommended'],
    },
    support: {
      documentation: 'Extensive tutorials and API docs',
      community: 'Active forums with 1M+ users',
      email: true,
      phone: true,
    },
    reviews: {
      rating: 4.6,
      totalReviews: 3200,
      pros: ['Industry-leading generative design', 'Seamless CAD to CAM workflow', 'Cloud collaboration'],
      cons: ['Steep learning curve', 'Requires powerful hardware'],
    },
  },
  {
    id: 'ai-mfg-2',
    name: 'Monolith AI',
    provider: 'Monolith',
    purpose: 'AI-powered FEA simulation that learns from your engineering data',
    description: 'Monolith uses machine learning to dramatically speed up finite element analysis (FEA) simulations. Instead of waiting hours or days for traditional FEA results, Monolith provides near-instant predictions.',
    functions: ['Engineering'],
    costPerMonth: 850,
    website: 'https://monolith.ai',
    capabilities: [
      'Instant FEA predictions using ML',
      'Multi-physics simulation acceleration',
      'Design space exploration',
      'Sensitivity analysis automation',
      'Integration with CAE tools',
      'Uncertainty quantification',
    ],
    integrations: ['ANSYS', 'Abaqus', 'LS-DYNA', 'Python', 'Excel'],
    category: 'manufacturing',
    useCases: [
      'Reduce simulation time from days to minutes',
      'Run thousands of design variations quickly',
      'Predict structural failures before physical testing',
    ],
    keyFeatures: [
      'Self-learning AI that improves over time',
      'No simulation knowledge required',
      'Explainable AI predictions',
    ],
    pricing: {
      professional: '£850/month per user',
      enterprise: 'Custom pricing',
      notes: 'ROI typically within 3 months',
    },
    setup: {
      difficulty: 'Moderate',
      timeToValue: '1-2 weeks',
      requirements: ['Historical FEA data', 'Python 3.7+', '16GB RAM'],
    },
    support: {
      documentation: 'Comprehensive guides and case studies',
      community: 'Slack workspace with engineers',
      email: true,
      phone: false,
    },
    reviews: {
      rating: 4.8,
      totalReviews: 180,
      pros: ['Dramatic time savings (10-100x faster)', 'Accurate predictions', 'Easy integration'],
      cons: ['Requires historical data', 'Premium pricing'],
    },
  },
  {
    id: 'ai-mfg-3',
    name: 'Paperless Parts',
    provider: 'Paperless Parts',
    purpose: 'AI-powered quoting and RFQ management for manufacturing',
    description: 'Paperless Parts uses AI to automatically generate accurate quotes for CNC machining, sheet metal, and 3D printing. Upload CAD files and receive instant pricing, lead times, and DFM feedback.',
    functions: ['Engineering', 'Ops'],
    costPerMonth: 500,
    website: 'https://paperlessparts.com',
    capabilities: [
      'Instant automated quoting from CAD',
      'DFM analysis and recommendations',
      'Material and finish selection',
      'Lead time estimation',
      'ERP/CRM integration',
      'Customer portal for quotes',
    ],
    integrations: ['SolidWorks', 'Fusion 360', 'QuickBooks', 'Salesforce', 'NetSuite'],
    category: 'manufacturing',
    useCases: [
      'Generate quotes in minutes instead of hours',
      'Identify manufacturing issues before production',
      'Track RFQs through entire lifecycle',
    ],
    keyFeatures: [
      'Geometric analysis AI',
      'Automated pricing algorithms',
      'Customer self-service portal',
    ],
    pricing: {
      professional: '£500/month + transaction fees',
      enterprise: 'Custom pricing for high volume',
    },
    setup: {
      difficulty: 'Easy',
      timeToValue: '1 week',
      requirements: ['CAD files in STEP/IGES', 'Pricing data', 'Web browser'],
    },
    support: {
      documentation: 'Video tutorials and setup guides',
      community: 'User forum and webinars',
      email: true,
      phone: true,
    },
    reviews: {
      rating: 4.7,
      totalReviews: 420,
      pros: ['Massive time savings on quoting', 'Improved accuracy', 'Easy to implement'],
      cons: ['Transaction fees can add up', 'Limited customization'],
    },
  },
  {
    id: 'ai-mfg-4',
    name: 'Instrumental',
    provider: 'Instrumental',
    purpose: 'AI-powered manufacturing quality inspection and root cause analysis',
    description: 'Instrumental uses computer vision and AI to automatically inspect products on manufacturing lines. Detects defects faster than human inspection and traces issues back to root causes.',
    functions: ['Engineering', 'Ops'],
    costPerMonth: 1200,
    website: 'https://instrumental.com',
    capabilities: [
      'Automated optical inspection (AOI)',
      'Defect detection and classification',
      'Root cause analysis automation',
      'Predictive quality analytics',
      'Yield improvement tracking',
      'Supplier quality monitoring',
    ],
    integrations: ['Custom cameras', 'MES systems', 'Slack', 'Jira', 'Webhooks'],
    category: 'manufacturing',
    useCases: [
      'Catch defects early in production',
      'Reduce scrap and rework costs',
      'Improve first-pass yield rates',
    ],
    keyFeatures: [
      'Computer vision AI for manufacturing',
      'Real-time defect alerts',
      'Trace defects to specific processes',
    ],
    pricing: {
      professional: '£1,200/month per production line',
      enterprise: 'Custom pricing for multiple facilities',
      notes: 'Includes hardware and software',
    },
    setup: {
      difficulty: 'Moderate',
      timeToValue: '4-6 weeks',
      requirements: ['Production line access', 'Network connectivity', 'Training data'],
    },
    support: {
      documentation: 'Implementation guides and API docs',
      community: 'Private customer Slack',
      email: true,
      phone: true,
    },
    reviews: {
      rating: 4.5,
      totalReviews: 95,
      pros: ['Significantly improves quality metrics', 'Fast detection', 'Great analytics'],
      cons: ['High initial investment', 'Requires good lighting'],
    },
  },

  // ========== ADMIN/ALL (4 agents) ==========
  {
    id: 'ai-admin-1',
    name: 'ChatGPT Enterprise',
    provider: 'OpenAI',
    purpose: 'General-purpose assistant for all team members',
    functions: ['Admin'],
    costPerMonth: 600,
    website: 'https://openai.com',
    capabilities: [
      'Email drafting',
      'Meeting summaries',
      'Task planning',
      'Problem solving',
      'Brainstorming',
      'Data privacy (enterprise)',
    ],
    integrations: ['Web', 'Mobile app', 'API', 'Microsoft Teams'],
    category: 'productivity',
  },
  {
    id: 'ai-admin-2',
    name: 'Notion AI',
    provider: 'Notion',
    purpose: 'Note-taking and knowledge management with AI',
    functions: ['Admin'],
    costPerMonth: 120,
    website: 'https://notion.so',
    capabilities: [
      'Smart note summarization',
      'Writing assistance',
      'Action item extraction',
      'Content generation',
      'Knowledge base search',
      'Translation',
    ],
    integrations: ['Notion workspace', 'Slack', 'Google Drive', 'API'],
    category: 'productivity',
  },
  {
    id: 'ai-admin-3',
    name: 'Otter.ai',
    provider: 'Otter.ai',
    purpose: 'Meeting transcription and notes automation',
    functions: ['Admin'],
    costPerMonth: 75,
    website: 'https://otter.ai',
    capabilities: [
      'Real-time transcription',
      'Meeting summaries',
      'Speaker identification',
      'Action item extraction',
      'Searchable transcripts',
      'Calendar integration',
    ],
    integrations: ['Zoom', 'Google Meet', 'Teams', 'Dropbox', 'Slack'],
    category: 'productivity',
  },
  {
    id: 'ai-admin-4',
    name: 'Grammarly Business',
    provider: 'Grammarly',
    purpose: 'Writing quality and consistency across communications',
    functions: ['Admin'],
    costPerMonth: 100,
    website: 'https://grammarly.com',
    capabilities: [
      'Grammar and spelling checks',
      'Tone detection',
      'Style guide enforcement',
      'Plagiarism detection',
      'Clarity suggestions',
      'Brand voice consistency',
    ],
    integrations: ['Browser', 'Microsoft Office', 'Google Docs', 'Slack'],
    category: 'productivity',
  },
];

// Helper functions
export function getAIToolsByFunction(func: BusinessFunction | 'all'): ThirdPartyAITool[] {
  if (func === 'all') {
    return THIRD_PARTY_AI_TOOLS;
  }
  return THIRD_PARTY_AI_TOOLS.filter(tool => tool.functions.includes(func));
}

export function getTotalAIToolsCount(): number {
  return THIRD_PARTY_AI_TOOLS.length;
}

export function getCategoryColor(category: string): { bg: string; text: string; border: string; iconColor: string } {
  const colors: Record<string, { bg: string; text: string; border: string; iconColor: string }> = {
    productivity: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-900 dark:text-blue-100', border: 'border-blue-200 dark:border-blue-800', iconColor: '#3b82f6' },
    sales: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-900 dark:text-emerald-100', border: 'border-emerald-200 dark:border-emerald-800', iconColor: '#10b981' },
    marketing: { bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-900 dark:text-pink-100', border: 'border-pink-200 dark:border-pink-800', iconColor: '#ec4899' },
    finance: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-900 dark:text-purple-100', border: 'border-purple-200 dark:border-purple-800', iconColor: '#a855f7' },
    engineering: { bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-900 dark:text-cyan-100', border: 'border-cyan-200 dark:border-cyan-800', iconColor: '#06b6d4' },
    operations: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-900 dark:text-amber-100', border: 'border-amber-200 dark:border-amber-800', iconColor: '#f59e0b' },
    manufacturing: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-900 dark:text-orange-100', border: 'border-orange-200 dark:border-orange-800', iconColor: '#f97316' },
  };
  return colors[category] || colors.productivity;
}
