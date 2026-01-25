/**
 * Third-Party AI Tools Data for Community Marketplace
 * External AI tools that teams can use, organized by business function
 *
 * DISABLED: All hardcoded AI tools have been disabled for multi-tenant architecture
 * AI tools should be loaded from Supabase
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

  // Efficiency multiplier: How much faster tasks can be completed with this AI
  // 1.0 = no speedup, 2.0 = 2x faster (half the time), 10.0 = 10x faster
  // Range: 1.0 to 20.0
  efficiencyMultiplier?: number;

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

// AI tools re-enabled with comprehensive coverage for all business functions
// Focus on: Design, Manufacturing, Sales, Marketing, Admin, and RFQ tools
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
    efficiencyMultiplier: 10,  // 10x faster for invoice processing tasks
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
    efficiencyMultiplier: 5,  // 5x faster for bookkeeping tasks
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
    efficiencyMultiplier: 3,  // 3x faster for analysis tasks
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
    efficiencyMultiplier: 20,  // 20x faster for outbound prospecting
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
    description: 'Gong AI is a revenue intelligence platform that records, transcribes, and analyzes every sales conversation to extract insights, identify risks, and accelerate deals. It uses NLP to surface key moments, track competitor mentions, and provide coaching recommendations that improve win rates by 15-25%.',
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
    useCases: [
      'Identify why deals are won or lost by analyzing 100% of sales conversations',
      'Coach reps with data-driven insights from top performers',
      'Track competitive intelligence across all customer interactions',
    ],
    keyFeatures: [
      'Automatic call recording and AI-powered transcription',
      'Deal intelligence showing risk factors and next steps',
      'Rep performance dashboards with coaching insights',
    ],
    pricing: {
      professional: '£400/month per user for up to 10 users',
      enterprise: '£1,800/month for unlimited users',
      notes: 'Annual contract required, pricing per seat',
    },
    setup: {
      difficulty: 'Moderate',
      timeToValue: '2-4 weeks',
      requirements: ['Video conferencing integration', 'CRM connection', 'Sales process documentation'],
    },
    support: {
      documentation: 'Extensive knowledge base and video library',
      community: 'Revenue Innovators community',
      email: true,
      phone: true,
    },
    reviews: {
      rating: 4.6,
      totalReviews: 3200,
      pros: ['Game-changing for sales coaching', 'Incredible call analysis', 'Easy CRM integration'],
      cons: ['Expensive for small teams', 'Learning curve for managers', 'Overwhelming amount of data'],
    },
  },
  {
    id: 'ai-sales-3',
    name: 'Clay AI',
    provider: 'Clay',
    purpose: 'Lead enrichment and prospecting automation',
    description: 'Clay AI is a data enrichment platform that combines 50+ data sources to build highly targeted prospect lists with enriched contact information. It uses AI to research companies, find decision-makers, and uncover buying signals - turning basic company names into ready-to-contact leads.',
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
    useCases: [
      'Build ICP-matched prospect lists with 95%+ accuracy on contact details',
      'Enrich inbound leads with firmographic and technographic data',
      'Identify buying signals across 50+ data sources automatically',
    ],
    keyFeatures: [
      'Waterfall enrichment across 50+ providers',
      'AI-powered research agents for custom data',
      'Real-time intent signals and job changes',
    ],
    pricing: {
      starter: '£149/month for 2,000 credits',
      professional: '£300/month for 5,000 credits',
      enterprise: 'Custom pricing for 20,000+ credits',
      notes: '1 credit = 1 data point enrichment',
    },
    setup: {
      difficulty: 'Easy',
      timeToValue: '1 week',
      requirements: ['CSV upload or CRM integration', 'Target account criteria'],
    },
    support: {
      documentation: 'Interactive tutorials and templates',
      community: 'Active Slack community',
      email: true,
      phone: false,
    },
    reviews: {
      rating: 4.8,
      totalReviews: 890,
      pros: ['Best-in-class data accuracy', 'Unmatched data source coverage', 'Intuitive spreadsheet-like UI'],
      cons: ['Credit system can get expensive', 'Steep learning curve for advanced features', 'Some data sources have limits'],
    },
  },
  {
    id: 'ai-sales-4',
    name: 'ElevenLabs Voice AI',
    provider: 'ElevenLabs',
    purpose: 'Sales demo voiceovers and presentation narration',
    description: 'ElevenLabs is an AI voice generation platform that creates natural-sounding voiceovers for sales demos, product tutorials, and presentation videos. It supports 29 languages, offers voice cloning, and produces studio-quality audio that sounds indistinguishable from human narration.',
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
    useCases: [
      'Create product demo videos with professional narration in minutes',
      'Localize sales presentations into 29 languages automatically',
      'Generate consistent voiceovers for training materials at scale',
    ],
    keyFeatures: [
      'Natural-sounding AI voices with emotional range',
      'Voice cloning to match your brand voice',
      'Real-time pronunciation control and editing',
    ],
    pricing: {
      starter: '£22/month for 30,000 characters',
      professional: '£99/month for 100,000 characters',
      enterprise: '£330/month for 500,000 characters',
      notes: 'Pricing based on character count',
    },
    setup: {
      difficulty: 'Easy',
      timeToValue: 'Immediate',
      requirements: ['Text scripts ready to convert', 'Audio export format preferences'],
    },
    support: {
      documentation: 'Quick start guides and API docs',
      community: 'Discord community',
      email: true,
      phone: false,
    },
    reviews: {
      rating: 4.7,
      totalReviews: 8900,
      pros: ['Most natural-sounding AI voices', 'Incredible voice cloning', 'Easy to use'],
      cons: ['Can be expensive for high volume', 'Voice cloning requires good source audio', 'Limited editing after generation'],
    },
  },

  // ========== MARKETING (6 agents) ==========
  {
    id: 'ai-marketing-1',
    name: 'Jasper AI',
    provider: 'Jasper',
    purpose: 'Content creation for marketing campaigns',
    description: 'Jasper AI is an AI writing assistant specialized for marketing teams that generates blog posts, social media content, ad copy, and email campaigns in your brand voice. It integrates with SEO tools and learns your brand guidelines to produce on-brand content 10x faster than manual writing.',
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
    efficiencyMultiplier: 10,  // 10x faster for content creation
    useCases: [
      'Generate 20+ blog posts per month with SEO optimization',
      'Create weeks of social media content in one sitting',
      'Write email campaigns that match your brand voice perfectly',
    ],
    keyFeatures: [
      'Brand voice training with your content samples',
      'Built-in SEO optimization with Surfer SEO',
      '50+ templates for common marketing content',
    ],
    pricing: {
      starter: '£82/month for 100,000 words',
      professional: '£200/month for unlimited words',
      enterprise: 'Custom pricing with API access',
      notes: 'Annual plans save 20%',
    },
    setup: {
      difficulty: 'Easy',
      timeToValue: '1 week',
      requirements: ['Brand voice samples', 'Content guidelines', 'SEO keywords list'],
    },
    support: {
      documentation: 'Comprehensive help center with video tutorials',
      community: 'Facebook group with 100K+ members',
      email: true,
      phone: false,
    },
    reviews: {
      rating: 4.5,
      totalReviews: 12000,
      pros: ['Huge time saver', 'Great brand voice matching', 'Excellent SEO integration'],
      cons: ['Can be repetitive without editing', 'Expensive for solo creators', 'Learning curve for best results'],
    },
  },
  {
    id: 'ai-marketing-2',
    name: 'Copy.ai',
    provider: 'Copy.ai',
    purpose: 'Marketing copy and workflow automation',
    description: 'Copy.ai is an AI copywriting platform that generates marketing copy for ads, landing pages, emails, and product descriptions. It includes workflow automation to connect multiple AI steps together and supports 95+ languages for global marketing campaigns.',
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
    useCases: [
      'Generate 10 ad copy variations for A/B testing in minutes',
      'Write compelling product descriptions for entire catalogs',
      'Automate multi-step content workflows with AI',
    ],
    keyFeatures: [
      'Workflow builder connecting multiple AI steps',
      '95+ language support for global campaigns',
      'Instant A/B test variant generation',
    ],
    pricing: {
      starter: '£36/month for 40,000 words',
      professional: '£180/month for unlimited words',
      enterprise: 'Custom pricing with priority support',
      notes: 'Free tier available with 2,000 words/month',
    },
    setup: {
      difficulty: 'Easy',
      timeToValue: 'Immediate',
      requirements: ['Marketing brief templates', 'Product information'],
    },
    support: {
      documentation: 'Help center and template library',
      community: 'Active Facebook group',
      email: true,
      phone: false,
    },
    reviews: {
      rating: 4.4,
      totalReviews: 5800,
      pros: ['Very affordable', 'Easy to use', 'Great for ecommerce'],
      cons: ['Output quality varies', 'Limited brand voice training', 'Workflow builder is basic'],
    },
  },
  {
    id: 'ai-marketing-3',
    name: 'Midjourney',
    provider: 'Midjourney',
    purpose: 'High-quality imagery for marketing materials',
    description: 'Midjourney is an AI image generation platform that creates photorealistic marketing visuals, product concepts, and brand identity assets. It excels at consistent style generation and is used by leading brands for pitch decks, website imagery, and social media content.',
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
    useCases: [
      'Generate hero images for landing pages in minutes',
      'Create product mockups before manufacturing',
      'Design consistent brand visuals across all materials',
    ],
    keyFeatures: [
      'Style reference for brand consistency',
      'Upscaling to 4K resolution',
      'Variation generator for multiple concepts',
    ],
    pricing: {
      starter: '£8/month for 200 images',
      professional: '£24/month for unlimited images (relaxed mode)',
      enterprise: '£60/month for unlimited fast generations',
      notes: 'Fast mode uses GPU minutes, relaxed is queue-based',
    },
    setup: {
      difficulty: 'Moderate',
      timeToValue: '1-2 weeks',
      requirements: ['Discord account', 'Prompt writing skills', 'Visual style references'],
    },
    support: {
      documentation: 'Discord help channels and guides',
      community: 'Massive Discord community',
      email: false,
      phone: false,
    },
    reviews: {
      rating: 4.8,
      totalReviews: 45000,
      pros: ['Best-in-class image quality', 'Incredible artistic styles', 'Active community'],
      cons: ['Discord interface is clunky', 'Steep learning curve', 'Can be hard to get exact results'],
    },
  },
  {
    id: 'ai-marketing-4',
    name: 'DALL-E 3',
    provider: 'OpenAI',
    purpose: 'Marketing visuals and social media graphics',
    description: 'DALL-E 3 is OpenAI\'s image generation model that excels at creating marketing graphics with accurate text rendering. It\'s integrated with ChatGPT for conversational image editing and produces social media graphics, ad creatives, and presentation visuals with minimal prompting.',
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
    useCases: [
      'Create social media posts with text overlays',
      'Generate ad creative variations for testing',
      'Design presentation slides with custom visuals',
    ],
    keyFeatures: [
      'Accurate text rendering in images',
      'ChatGPT integration for conversational editing',
      'High prompt adherence for precise results',
    ],
    pricing: {
      starter: '£16/month (ChatGPT Plus) for limited generations',
      professional: '£120/month via API ($0.04/image)',
      enterprise: 'Custom API pricing with volume discounts',
      notes: 'API pricing is pay-as-you-go',
    },
    setup: {
      difficulty: 'Easy',
      timeToValue: 'Immediate',
      requirements: ['OpenAI account', 'Basic prompt writing'],
    },
    support: {
      documentation: 'API documentation and guides',
      community: 'OpenAI developer forum',
      email: true,
      phone: false,
    },
    reviews: {
      rating: 4.3,
      totalReviews: 8200,
      pros: ['Best text rendering', 'Easy to use', 'ChatGPT integration'],
      cons: ['Less artistic than Midjourney', 'Limited style control', 'Can be expensive at scale'],
    },
  },
  {
    id: 'ai-marketing-5',
    name: 'Perplexity Pro',
    provider: 'Perplexity',
    purpose: 'Market research and competitive intelligence',
    description: 'Perplexity Pro is an AI research assistant that searches the web in real-time and provides citation-backed answers. It\'s ideal for market research, competitor analysis, and staying on top of industry trends - surfacing insights from across the web in seconds instead of hours of manual research.',
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
    useCases: [
      'Research competitor positioning and messaging in minutes',
      'Track industry trends and news for content ideas',
      'Get instant market insights with sources cited',
    ],
    keyFeatures: [
      'Real-time web search with AI synthesis',
      'All answers include source citations',
      'Follow-up questions for deep dives',
    ],
    pricing: {
      starter: 'Free tier with limited searches',
      professional: '£16/month for unlimited searches',
      enterprise: '£33/month per user for teams',
      notes: 'Pro includes GPT-4 and Claude access',
    },
    setup: {
      difficulty: 'Easy',
      timeToValue: 'Immediate',
      requirements: ['None - start asking questions'],
    },
    support: {
      documentation: 'Help center and tips',
      community: 'Discord community',
      email: true,
      phone: false,
    },
    reviews: {
      rating: 4.6,
      totalReviews: 2400,
      pros: ['Incredibly fast research', 'Always cites sources', 'Better than Google for insights'],
      cons: ['Can miss niche sources', 'No team collaboration features', 'Occasional outdated results'],
    },
  },
  {
    id: 'ai-marketing-6',
    name: 'Runway Gen-2',
    provider: 'Runway',
    purpose: 'AI video generation for marketing content',
    description: 'Runway Gen-2 is an AI video generation platform that turns text prompts or images into video clips. It\'s used by marketing teams to create product demo videos, social media content, and animated explainers without filming or animation skills - generating 4-second clips in under a minute.',
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
    useCases: [
      'Generate product demo videos from product images',
      'Create animated social media content',
      'Turn static mockups into video presentations',
    ],
    keyFeatures: [
      'Text-to-video with motion control',
      'Image-to-video animation in seconds',
      'Video editing with AI (extend, remove objects)',
    ],
    pricing: {
      starter: '£12/month for 125 credits',
      professional: '£28/month for 625 credits',
      enterprise: '£250/month for 2250 credits',
      notes: '1 credit = 1 second of video generation',
    },
    setup: {
      difficulty: 'Moderate',
      timeToValue: '1-2 weeks',
      requirements: ['Video editing knowledge', 'Source imagery', 'Motion prompts'],
    },
    support: {
      documentation: 'Video tutorials and guides',
      community: 'Discord community',
      email: true,
      phone: false,
    },
    reviews: {
      rating: 4.2,
      totalReviews: 1800,
      pros: ['Amazing video generation', 'Huge time saver', 'Great for social content'],
      cons: ['Expensive for high volume', 'Output can be inconsistent', 'Short clip lengths'],
    },
  },

  // ========== OPS (3 agents) ==========
  {
    id: 'ai-ops-1',
    name: 'Hebbia AI',
    provider: 'Hebbia',
    purpose: 'Document analysis and operational workflows',
    description: 'Hebbia AI is an enterprise document intelligence platform that analyzes contracts, policies, and compliance documents at scale. It uses AI to extract key clauses, identify risks, and synthesize insights across hundreds of documents - replacing weeks of manual review with minutes of AI-powered analysis.',
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
    efficiencyMultiplier: 15,  // 15x faster for document analysis
    useCases: [
      'Review 100+ supplier contracts to extract payment terms and SLAs',
      'Analyze compliance documents across multiple jurisdictions',
      'Extract structured data from unstructured reports',
    ],
    keyFeatures: [
      'Multi-document reasoning across 1000+ pages',
      'Custom extraction workflows with templates',
      'Source citations for every answer',
    ],
    pricing: {
      professional: '£400/month for 5 users',
      enterprise: '£2,000/month for unlimited users',
      notes: 'Pricing includes document processing credits',
    },
    setup: {
      difficulty: 'Moderate',
      timeToValue: '2-3 weeks',
      requirements: ['Document repository access', 'Extraction templates', 'Compliance policies'],
    },
    support: {
      documentation: 'Enterprise implementation guides',
      community: 'Customer success manager assigned',
      email: true,
      phone: true,
    },
    reviews: {
      rating: 4.5,
      totalReviews: 420,
      pros: ['Handles massive document sets', 'Accurate extractions', 'Great for compliance teams'],
      cons: ['Expensive for small teams', 'Requires clean document formatting', 'Learning curve for advanced queries'],
    },
  },
  {
    id: 'ai-ops-2',
    name: 'Zapier AI',
    provider: 'Zapier',
    purpose: 'Workflow automation across tools',
    description: 'Zapier AI is a workflow automation platform that connects 5000+ apps and uses AI to suggest, build, and optimize automations. It eliminates manual data entry and repetitive tasks by automatically moving information between your business tools - saving hours of busy work each week.',
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
    useCases: [
      'Automatically add new leads from forms to CRM and send welcome emails',
      'Sync data between your project management tool and spreadsheets',
      'Get AI suggestions for automating repetitive manual tasks',
    ],
    keyFeatures: [
      'AI-powered automation builder with natural language',
      'Multi-step workflows with conditional logic',
      'Real-time error monitoring and alerts',
    ],
    pricing: {
      starter: '£20/month for 750 tasks',
      professional: '£50/month for 2,000 tasks',
      enterprise: '£150/month for 50,000 tasks',
      notes: '1 task = 1 action performed',
    },
    setup: {
      difficulty: 'Easy',
      timeToValue: 'Immediate',
      requirements: ['App credentials', 'Workflow documentation'],
    },
    support: {
      documentation: 'Extensive help center and templates',
      community: 'Community forum and Zapier University',
      email: true,
      phone: false,
    },
    reviews: {
      rating: 4.6,
      totalReviews: 15000,
      pros: ['Connects everything', 'Easy to build automations', 'Huge time saver'],
      cons: ['Task limits can be hit quickly', 'Complex workflows get expensive', 'Occasional sync delays'],
    },
  },
  {
    id: 'ai-ops-3',
    name: 'Harvey AI',
    provider: 'Harvey',
    purpose: 'Legal document review and compliance',
    description: 'Harvey AI is a legal AI assistant built for law firms and corporate legal teams. It drafts contracts, reviews agreements for risks, conducts legal research, and stays updated on regulatory changes - providing attorney-level analysis at a fraction of the cost and time.',
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
    useCases: [
      'Review supplier contracts for unfavorable terms and liability clauses',
      'Draft NDAs and employment agreements based on templates',
      'Monitor regulatory changes in your industry',
    ],
    keyFeatures: [
      'Trained on legal precedents and case law',
      'Risk scoring for contract clauses',
      'Automated compliance monitoring',
    ],
    pricing: {
      professional: '£500/month per user',
      enterprise: 'Custom pricing for law firms',
      notes: 'Includes unlimited legal research and document review',
    },
    setup: {
      difficulty: 'Moderate',
      timeToValue: '3-4 weeks',
      requirements: ['Contract templates', 'Compliance policies', 'Legal team training'],
    },
    support: {
      documentation: 'Legal-specific training materials',
      community: 'Dedicated customer success',
      email: true,
      phone: true,
    },
    reviews: {
      rating: 4.4,
      totalReviews: 280,
      pros: ['Incredible legal research', 'Saves hours on contract review', 'Accurate risk identification'],
      cons: ['Very expensive', 'Still requires lawyer oversight', 'Limited to common law jurisdictions'],
    },
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
    description: 'ChatGPT Enterprise is OpenAI\'s most powerful AI assistant for businesses, offering GPT-4 with unlimited usage, enhanced security, and data privacy guarantees. It helps teams with everything from writing emails to analyzing data, while ensuring company data never trains OpenAI models.',
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
    useCases: [
      'Draft professional emails and responses in seconds',
      'Summarize long documents and meetings',
      'Generate reports, presentations, and business plans',
    ],
    keyFeatures: [
      'Unlimited GPT-4 usage for all team members',
      'Enterprise-grade security with SOC 2 compliance',
      'Data never used for model training',
    ],
    pricing: {
      enterprise: '£50/month per user (minimum 150 users)',
      notes: 'Annual contract required, pricing negotiable for large teams',
    },
    setup: {
      difficulty: 'Easy',
      timeToValue: 'Immediate',
      requirements: ['Minimum 150 users', 'SSO setup (optional)'],
    },
    support: {
      documentation: 'Enterprise documentation and training',
      community: 'Dedicated customer success manager',
      email: true,
      phone: true,
    },
    reviews: {
      rating: 4.7,
      totalReviews: 8900,
      pros: ['Incredibly versatile', 'Enterprise security', 'Unlimited usage'],
      cons: ['High minimum user requirement', 'Expensive for small teams', 'Requires training for best results'],
    },
  },
  {
    id: 'ai-admin-2',
    name: 'Notion AI',
    provider: 'Notion',
    purpose: 'Note-taking and knowledge management with AI',
    description: 'Notion AI is built directly into Notion workspaces to help teams write faster, think bigger, and augment their creativity. It summarizes meeting notes, generates action items, writes drafts, and searches across your entire knowledge base - making your team wiki 10x more useful.',
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
    useCases: [
      'Turn meeting notes into action items automatically',
      'Generate first drafts of documents from bullet points',
      'Search across your entire Notion workspace with AI',
    ],
    keyFeatures: [
      'AI answers questions using your team\'s knowledge',
      'Automatic action item extraction',
      '20+ languages for translation',
    ],
    pricing: {
      starter: '£8/month per user as add-on to Notion',
      notes: 'Requires existing Notion workspace subscription',
    },
    setup: {
      difficulty: 'Easy',
      timeToValue: 'Immediate',
      requirements: ['Existing Notion workspace', 'Content to work with'],
    },
    support: {
      documentation: 'Help center and templates',
      community: 'Large user community and Reddit',
      email: true,
      phone: false,
    },
    reviews: {
      rating: 4.4,
      totalReviews: 6200,
      pros: ['Seamless Notion integration', 'Great for meeting notes', 'Affordable'],
      cons: ['Limited compared to ChatGPT', 'Requires Notion workspace', 'AI quality varies'],
    },
  },
  {
    id: 'ai-admin-3',
    name: 'Otter.ai',
    provider: 'Otter.ai',
    purpose: 'Meeting transcription and notes automation',
    description: 'Otter.ai automatically joins your video meetings, records audio, transcribes conversations in real-time, and generates meeting summaries with action items. It captures every word spoken so your team can focus on the conversation instead of taking notes - perfect for distributed teams.',
    functions: ['Admin'],
    costPerMonth: 95,
    website: 'https://otter.ai',
    capabilities: [
      'Real-time transcription',
      'Speaker identification',
      'Action item detection',
      'Meeting summaries',
      'Keyword search',
      'Multi-language support',
    ],
    integrations: ['Zoom', 'Google Meet', 'Teams', 'Slack', 'Salesforce'],
    category: 'productivity',
    useCases: [
      'Never miss important details from customer calls',
      'Share meeting notes with team members who couldn\'t attend',
      'Search through months of meetings to find specific conversations',
    ],
    keyFeatures: [
      'Real-time transcription with 95%+ accuracy',
      'Automatic meeting summary generation',
      'Speaker identification for multi-person calls',
    ],
    pricing: {
      starter: '£0/month for 600 minutes (free tier)',
      professional: '£8.33/month for 6,000 minutes',
      enterprise: '£20/month per user for unlimited',
      notes: 'Pro plan is £100/year if paid annually',
    },
    setup: {
      difficulty: 'Easy',
      timeToValue: 'Immediate',
      requirements: ['Video conferencing tool integration', 'Calendar access'],
    },
    support: {
      documentation: 'Help center and video tutorials',
      community: 'User forum',
      email: true,
      phone: false,
    },
    reviews: {
      rating: 4.5,
      totalReviews: 4800,
      pros: ['Incredibly accurate transcription', 'Huge time saver', 'Great free tier'],
      cons: ['Can be slow to process long meetings', 'Struggles with heavy accents', 'Limited editing features'],
    },
  },
  {
    id: 'ai-admin-4',
    name: 'Grammarly Business',
    provider: 'Grammarly',
    purpose: 'AI writing assistant for professional communication',
    description: 'Grammarly Business is an AI-powered writing assistant that helps teams write clearly, correctly, and on-brand across all communication channels. It catches grammar mistakes, suggests better phrasing, checks tone, and ensures consistency with your brand guidelines - improving writing quality by 50%.',
    functions: ['Admin'],
    costPerMonth: 180,
    website: 'https://grammarly.com',
    capabilities: [
      'Grammar and spelling correction',
      'Tone detection',
      'Plagiarism checking',
      'Style consistency',
      'Brand voice guidelines',
      'Writing analytics',
    ],
    integrations: ['Gmail', 'Slack', 'Microsoft Office', 'Google Docs', 'Browser extension'],
    category: 'productivity',
    useCases: [
      'Ensure all customer-facing communication is professional',
      'Maintain brand voice consistency across team members',
      'Catch embarrassing typos before hitting send',
    ],
    keyFeatures: [
      'Real-time writing suggestions everywhere you type',
      'Custom style guide for brand consistency',
      'Team analytics to track writing quality',
    ],
    pricing: {
      professional: '£12/month per user for teams of 3+',
      enterprise: '£15/month per user with admin controls',
      notes: 'Annual plans save 20-30%',
    },
    setup: {
      difficulty: 'Easy',
      timeToValue: 'Immediate',
      requirements: ['Browser installation or app downloads', 'Brand style guide (optional)'],
    },
    support: {
      documentation: 'Comprehensive help center',
      community: 'User forum and webinars',
      email: true,
      phone: true,
    },
    reviews: {
      rating: 4.6,
      totalReviews: 28000,
      pros: ['Works everywhere', 'Catches subtle errors', 'Improves writing quality'],
      cons: ['Can be overly aggressive', 'Expensive for large teams', 'Some suggestions are off-brand'],
    },
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

