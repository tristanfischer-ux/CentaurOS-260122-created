/**
 * OKR Suggestions Library
 * Pre-built OKR templates for common startup objectives
 */

export interface OKRSuggestion {
  id: string;
  category: OKRCategory;
  title: string;
  description: string;
  suggestedDuration: number; // days
  keyResults: {
    title: string;
    targetValue: number;
    unit: string;
  }[];
  whyItMatters: string;
  commonPitfalls: string[];
  successMetrics: string[];
}

export type OKRCategory =
  | 'revenue-growth'
  | 'product-market-fit'
  | 'customer-acquisition'
  | 'customer-retention'
  | 'team-building'
  | 'operational-efficiency'
  | 'fundraising'
  | 'product-development'
  | 'brand-awareness'
  | 'manufacturing'
  | 'supply-chain'
  | 'sustainability';

export const OKR_CATEGORIES = [
  { id: 'revenue-growth', name: 'Revenue Growth', icon: '💰' },
  { id: 'product-market-fit', name: 'Product-Market Fit', icon: '🎯' },
  { id: 'customer-acquisition', name: 'Customer Acquisition', icon: '📈' },
  { id: 'customer-retention', name: 'Customer Retention', icon: '🔄' },
  { id: 'team-building', name: 'Team Building', icon: '👥' },
  { id: 'operational-efficiency', name: 'Operational Efficiency', icon: '⚙️' },
  { id: 'fundraising', name: 'Fundraising', icon: '💵' },
  { id: 'product-development', name: 'Product Development', icon: '🔧' },
  { id: 'brand-awareness', name: 'Brand Awareness', icon: '📣' },
  { id: 'manufacturing', name: 'Manufacturing', icon: '🏭' },
  { id: 'supply-chain', name: 'Supply Chain', icon: '🚚' },
  { id: 'sustainability', name: 'Sustainability', icon: '🌱' },
] as const;

export const OKR_SUGGESTIONS: OKRSuggestion[] = [
  // Revenue Growth
  {
    id: 'revenue-growth-1',
    category: 'revenue-growth',
    title: 'Achieve £100k Monthly Recurring Revenue',
    description: 'Scale monthly recurring revenue to £100k through new customer acquisition and upsells.',
    suggestedDuration: 90,
    keyResults: [
      { title: 'Sign 50 new paying customers', targetValue: 50, unit: 'customers' },
      { title: 'Achieve £2k average contract value', targetValue: 2000, unit: '£' },
      { title: 'Maintain 95% payment collection rate', targetValue: 95, unit: '%' },
    ],
    whyItMatters: 'Reaching £100k MRR is a critical milestone that demonstrates product-market fit and enables sustainable growth. It provides the cash flow needed to invest in team expansion and product development.',
    commonPitfalls: ['Focusing only on new customers while ignoring churn', 'Discounting too heavily to close deals', 'Not tracking unit economics'],
    successMetrics: ['Net revenue retention rate', 'Customer acquisition cost (CAC)', 'Lifetime value (LTV)'],
  },
  {
    id: 'revenue-growth-2',
    category: 'revenue-growth',
    title: 'Double Revenue Quarter-over-Quarter',
    description: 'Achieve 100% revenue growth from previous quarter through aggressive sales and marketing.',
    suggestedDuration: 90,
    keyResults: [
      { title: 'Increase sales team from 2 to 5 reps', targetValue: 5, unit: 'reps' },
      { title: 'Generate 500 qualified leads per month', targetValue: 500, unit: 'leads' },
      { title: 'Close 15% of qualified opportunities', targetValue: 15, unit: '%' },
    ],
    whyItMatters: 'Rapid revenue growth demonstrates market demand and helps attract investors. Doubling revenue is a key benchmark for early-stage startups.',
    commonPitfalls: ['Hiring too fast without proper onboarding', 'Sacrificing profitability for growth', 'Ignoring customer success'],
    successMetrics: ['Revenue growth rate', 'Sales cycle length', 'Win rate'],
  },
  {
    id: 'revenue-growth-3',
    category: 'revenue-growth',
    title: 'Launch Enterprise Tier and Close 5 Enterprise Deals',
    description: 'Move upmarket by launching an enterprise product tier and closing high-value contracts.',
    suggestedDuration: 120,
    keyResults: [
      { title: 'Ship enterprise tier with SSO and API access', targetValue: 1, unit: 'tier' },
      { title: 'Close 5 enterprise deals at £10k+ ACV', targetValue: 5, unit: 'deals' },
      { title: 'Achieve 90-day sales cycle or less', targetValue: 90, unit: 'days' },
    ],
    whyItMatters: 'Enterprise customers provide larger contract values, longer retention, and more predictable revenue. Moving upmarket is essential for scaling to Series A and beyond.',
    commonPitfalls: ['Underestimating enterprise sales complexity', 'Building features before validating demand', 'Neglecting SMB customers'],
    successMetrics: ['Enterprise ACV', 'Enterprise win rate', 'Time to value'],
  },

  // Product-Market Fit
  {
    id: 'pmf-1',
    category: 'product-market-fit',
    title: 'Achieve 40%+ "Very Disappointed" PMF Score',
    description: 'Reach strong product-market fit by having 40% of users say they\'d be "very disappointed" if they could no longer use the product.',
    suggestedDuration: 90,
    keyResults: [
      { title: 'Survey 100+ active users with PMF question', targetValue: 100, unit: 'users' },
      { title: 'Achieve 40%+ "very disappointed" responses', targetValue: 40, unit: '%' },
      { title: 'Identify and fix top 5 friction points', targetValue: 5, unit: 'issues' },
    ],
    whyItMatters: 'The Sean Ellis test (40%+ "very disappointed") is the gold standard for measuring product-market fit. Achieving this milestone means you have a product worth scaling.',
    commonPitfalls: ['Surveying only power users', 'Not acting on feedback quickly', 'Confusing feature requests with core value prop'],
    successMetrics: ['PMF score over time', 'Net Promoter Score', 'Feature adoption rates'],
  },
  {
    id: 'pmf-2',
    category: 'product-market-fit',
    title: 'Achieve 60%+ Weekly Active Usage Rate',
    description: 'Drive deep product engagement with 60% of users returning weekly.',
    suggestedDuration: 90,
    keyResults: [
      { title: 'Increase WAU/MAU ratio to 60%+', targetValue: 60, unit: '%' },
      { title: 'Reduce time-to-value to under 10 minutes', targetValue: 10, unit: 'min' },
      { title: 'Achieve 3+ sessions per week per user', targetValue: 3, unit: 'sessions' },
    ],
    whyItMatters: 'High weekly active usage indicates your product has become a habit. Users who engage weekly are far more likely to convert to paid and stay long-term.',
    commonPitfalls: ['Gaming metrics with notifications', 'Not identifying core usage loop', 'Optimizing for vanity metrics'],
    successMetrics: ['DAU/MAU ratio', 'Session frequency', 'Feature stickiness'],
  },
  {
    id: 'pmf-3',
    category: 'product-market-fit',
    title: 'Define and Validate Ideal Customer Profile',
    description: 'Identify and validate your ICP by analyzing which customers get the most value.',
    suggestedDuration: 60,
    keyResults: [
      { title: 'Interview 30 best customers to find patterns', targetValue: 30, unit: 'interviews' },
      { title: 'Create ICP documentation with 10+ attributes', targetValue: 10, unit: 'attributes' },
      { title: 'Test ICP by closing 80% of leads matching profile', targetValue: 80, unit: '%' },
    ],
    whyItMatters: 'A clear ICP helps you focus marketing spend, prioritize features, and improve conversion rates. Not all customers are equal—find the ones who love you.',
    commonPitfalls: ['Making ICP too broad', 'Not updating ICP as you learn', 'Chasing customers outside ICP for revenue'],
    successMetrics: ['ICP conversion rate', 'ICP retention rate', 'ICP NPS'],
  },

  // Customer Acquisition
  {
    id: 'acquisition-1',
    category: 'customer-acquisition',
    title: 'Establish Repeatable Lead Generation Engine',
    description: 'Build a consistent system for generating 200+ qualified leads per month.',
    suggestedDuration: 90,
    keyResults: [
      { title: 'Generate 200+ qualified leads per month', targetValue: 200, unit: 'leads' },
      { title: 'Achieve £50 or less cost per lead', targetValue: 50, unit: '£' },
      { title: 'Launch 3 lead generation channels', targetValue: 3, unit: 'channels' },
    ],
    whyItMatters: 'Consistent lead generation is the foundation of predictable growth. Without a repeatable system, revenue will be unpredictable and growth will stall.',
    commonPitfalls: ['Relying on a single channel', 'Not tracking channel-level economics', 'Generating unqualified leads'],
    successMetrics: ['Cost per lead by channel', 'Lead-to-customer conversion rate', 'Channel mix'],
  },
  {
    id: 'acquisition-2',
    category: 'customer-acquisition',
    title: 'Achieve 3:1 LTV:CAC Ratio',
    description: 'Build profitable customer acquisition by achieving 3x lifetime value to customer acquisition cost ratio.',
    suggestedDuration: 90,
    keyResults: [
      { title: 'Reduce CAC to £1,000 or less', targetValue: 1000, unit: '£' },
      { title: 'Increase LTV to £3,000+', targetValue: 3000, unit: '£' },
      { title: 'Achieve 12-month or less CAC payback', targetValue: 12, unit: 'months' },
    ],
    whyItMatters: 'The 3:1 LTV:CAC ratio is the benchmark for sustainable, profitable growth. Below this, you\'re burning cash. Above this, you should invest more in acquisition.',
    commonPitfalls: ['Not accounting for all CAC costs', 'Using inflated LTV estimates', 'Ignoring churn impact on LTV'],
    successMetrics: ['LTV:CAC ratio', 'CAC payback period', 'Gross margin'],
  },
  {
    id: 'acquisition-3',
    category: 'customer-acquisition',
    title: 'Build Content Marketing Engine for Inbound Leads',
    description: 'Create content that generates 1,000+ monthly organic visitors and 50+ inbound leads.',
    suggestedDuration: 120,
    keyResults: [
      { title: 'Publish 24 high-quality blog posts', targetValue: 24, unit: 'posts' },
      { title: 'Achieve 1,000+ monthly organic visitors', targetValue: 1000, unit: 'visitors' },
      { title: 'Convert 5% of visitors to leads', targetValue: 5, unit: '%' },
    ],
    whyItMatters: 'Content marketing provides compounding returns. Every piece of content continues to drive traffic and leads for months or years, lowering CAC over time.',
    commonPitfalls: ['Writing for SEO instead of readers', 'Not promoting content', 'Expecting immediate results'],
    successMetrics: ['Organic traffic growth', 'Content conversion rate', 'Keyword rankings'],
  },

  // Customer Retention
  {
    id: 'retention-1',
    category: 'customer-retention',
    title: 'Reduce Churn to Under 3% Monthly',
    description: 'Improve product value and customer success to achieve best-in-class retention.',
    suggestedDuration: 90,
    keyResults: [
      { title: 'Reduce monthly churn from 7% to under 3%', targetValue: 3, unit: '%' },
      { title: 'Implement proactive success program for all customers', targetValue: 100, unit: '%' },
      { title: 'Achieve 90+ Net Promoter Score', targetValue: 90, unit: 'NPS' },
    ],
    whyItMatters: 'Retention is the most important SaaS metric. A 5% churn rate means you lose half your customers annually. Sub-3% churn enables compounding growth.',
    commonPitfalls: ['Not identifying churn reasons', 'Reactive vs proactive success', 'Ignoring early warning signals'],
    successMetrics: ['Net revenue retention', 'Logo retention', 'Customer health score'],
  },
  {
    id: 'retention-2',
    category: 'customer-retention',
    title: 'Achieve 120%+ Net Revenue Retention',
    description: 'Drive expansion revenue to more than offset churn through upsells and cross-sells.',
    suggestedDuration: 120,
    keyResults: [
      { title: 'Launch 2 new upsell tiers or add-ons', targetValue: 2, unit: 'tiers' },
      { title: 'Achieve 30% of customers on expansion path', targetValue: 30, unit: '%' },
      { title: 'Generate £50k expansion revenue', targetValue: 50000, unit: '£' },
    ],
    whyItMatters: '120%+ NRR means your existing customers grow faster than new customers. This is the holy grail of SaaS—it means you can grow even with no new customers.',
    commonPitfalls: ['Forcing upsells prematurely', 'Not demonstrating value first', 'Complicating pricing'],
    successMetrics: ['Net revenue retention', 'Expansion rate', 'Contraction rate'],
  },

  // Team Building
  {
    id: 'team-1',
    category: 'team-building',
    title: 'Build High-Performing Engineering Team of 5',
    description: 'Recruit, onboard, and ramp 5 exceptional engineers to 10x product velocity.',
    suggestedDuration: 120,
    keyResults: [
      { title: 'Hire 5 senior engineers with 5+ YOE', targetValue: 5, unit: 'engineers' },
      { title: 'Achieve 90+ eNPS from engineering team', targetValue: 90, unit: 'eNPS' },
      { title: 'Double sprint velocity within 90 days', targetValue: 2, unit: 'x' },
    ],
    whyItMatters: 'Product velocity determines how fast you can learn and iterate. A strong engineering team is the foundation of product-led growth.',
    commonPitfalls: ['Hiring too junior', 'Slow interview process', 'Poor onboarding'],
    successMetrics: ['Time to productivity', 'Sprint velocity', 'Employee retention'],
  },
  {
    id: 'team-2',
    category: 'team-building',
    title: 'Establish Company Culture and Values',
    description: 'Define and embed core values that attract A-players and guide decision-making.',
    suggestedDuration: 60,
    keyResults: [
      { title: 'Document 5 core company values with examples', targetValue: 5, unit: 'values' },
      { title: 'Achieve 80%+ team can recite values', targetValue: 80, unit: '%' },
      { title: 'Implement values in all hiring/review processes', targetValue: 100, unit: '%' },
    ],
    whyItMatters: 'Culture eats strategy for breakfast. Strong values create alignment, speed up decisions, and help you attract talent that fits.',
    commonPitfalls: ['Generic values like "teamwork"', 'Values on wall but not in actions', 'Not hiring/firing based on values'],
    successMetrics: ['Employee engagement score', 'Values alignment in reviews', 'Culture add in hiring'],
  },

  // Operational Efficiency
  {
    id: 'ops-1',
    category: 'operational-efficiency',
    title: 'Automate Manual Operations to Save 40 Hours/Week',
    description: 'Eliminate repetitive manual work through automation and process improvements.',
    suggestedDuration: 90,
    keyResults: [
      { title: 'Map and automate 10 manual workflows', targetValue: 10, unit: 'workflows' },
      { title: 'Reduce manual ops time by 40 hours/week', targetValue: 40, unit: 'hours' },
      { title: 'Implement 5 no-code automation tools', targetValue: 5, unit: 'tools' },
    ],
    whyItMatters: 'Manual operations do not scale. Every hour spent on manual work is an hour not spent on growth. Automation creates leverage.',
    commonPitfalls: ['Automating broken processes', 'Over-engineering solutions', 'Not measuring time savings'],
    successMetrics: ['Hours saved per week', 'Error rate reduction', 'Process cycle time'],
  },
  {
    id: 'ops-2',
    category: 'operational-efficiency',
    title: 'Implement Data-Driven Decision Making',
    description: 'Build analytics infrastructure and dashboards for real-time business insights.',
    suggestedDuration: 90,
    keyResults: [
      { title: 'Launch 5 real-time executive dashboards', targetValue: 5, unit: 'dashboards' },
      { title: 'Track 20 core business metrics daily', targetValue: 20, unit: 'metrics' },
      { title: 'Achieve 100% team reviewing metrics weekly', targetValue: 100, unit: '%' },
    ],
    whyItMatters: 'You cannot improve what you do not measure. Data-driven companies make faster, better decisions and catch problems early.',
    commonPitfalls: ['Analysis paralysis', 'Tracking vanity metrics', 'Not acting on insights'],
    successMetrics: ['Decision cycle time', 'Forecast accuracy', 'Data adoption rate'],
  },

  // Fundraising
  {
    id: 'fundraising-1',
    category: 'fundraising',
    title: 'Raise £2M Seed Round in 90 Days',
    description: 'Secure £2M in seed funding to fuel growth and extend runway to 24 months.',
    suggestedDuration: 90,
    keyResults: [
      { title: 'Pitch 50 qualified seed investors', targetValue: 50, unit: 'investors' },
      { title: 'Secure 3+ term sheets', targetValue: 3, unit: 'term sheets' },
      { title: 'Close £2M at £8M+ valuation', targetValue: 2000000, unit: '£' },
    ],
    whyItMatters: 'A strong seed round provides 24-month runway to reach key milestones. Multiple term sheets give you leverage to negotiate better terms.',
    commonPitfalls: ['Taking first term sheet', 'Not preparing data room', 'Raising too early or too late'],
    successMetrics: ['Amount raised', 'Valuation', 'Investor quality'],
  },
  {
    id: 'fundraising-2',
    category: 'fundraising',
    title: 'Build Investor Pipeline for Series A',
    description: 'Cultivate relationships with 20 Series A investors 12+ months before fundraising.',
    suggestedDuration: 120,
    keyResults: [
      { title: 'Build relationships with 20 Series A investors', targetValue: 20, unit: 'investors' },
      { title: 'Send monthly investor updates to 50+ investors', targetValue: 50, unit: 'investors' },
      { title: 'Secure 5 investor introductions to customers', targetValue: 5, unit: 'intros' },
    ],
    whyItMatters: 'The best fundraises happen when you do not need money. Building investor relationships early makes fundraising faster and easier.',
    commonPitfalls: ['Only reaching out when fundraising', 'Not leveraging warm intros', 'Ignoring smaller investors'],
    successMetrics: ['Investor meeting frequency', 'Warm intro conversion rate', 'Investor engagement'],
  },

  // Product Development
  {
    id: 'product-1',
    category: 'product-development',
    title: 'Ship Mobile App to 10k+ Users',
    description: 'Launch iOS and Android apps and drive adoption to 10,000+ active users.',
    suggestedDuration: 120,
    keyResults: [
      { title: 'Ship iOS and Android apps to app stores', targetValue: 2, unit: 'apps' },
      { title: 'Achieve 10,000 app installs', targetValue: 10000, unit: 'installs' },
      { title: 'Reach 4.5+ star rating on both stores', targetValue: 4.5, unit: 'stars' },
    ],
    whyItMatters: 'Mobile is where users spend most of their time. A mobile app increases engagement, retention, and enables push notifications.',
    commonPitfalls: ['Building too many features at launch', 'Not optimizing for app stores', 'Ignoring platform guidelines'],
    successMetrics: ['App store conversion rate', 'Daily active users', 'App ratings'],
  },
  {
    id: 'product-2',
    category: 'product-development',
    title: 'Launch API and Enable 10 Integrations',
    description: 'Build developer-friendly API and enable ecosystem of integrations.',
    suggestedDuration: 90,
    keyResults: [
      { title: 'Ship public REST API with documentation', targetValue: 1, unit: 'API' },
      { title: 'Enable 10 partner integrations', targetValue: 10, unit: 'integrations' },
      { title: 'Onboard 100+ developers using API', targetValue: 100, unit: 'developers' },
    ],
    whyItMatters: 'APIs create network effects. Every integration makes your product more valuable and harder to replace.',
    commonPitfalls: ['Poor documentation', 'Unstable API', 'No developer support'],
    successMetrics: ['API usage growth', 'Integration adoption', 'Developer NPS'],
  },

  // Brand Awareness
  {
    id: 'brand-1',
    category: 'brand-awareness',
    title: 'Establish Thought Leadership in Industry',
    description: 'Position founders as industry experts through content and speaking.',
    suggestedDuration: 120,
    keyResults: [
      { title: 'Speak at 5 industry conferences', targetValue: 5, unit: 'conferences' },
      { title: 'Publish 12 thought leadership articles', targetValue: 12, unit: 'articles' },
      { title: 'Build 10,000+ LinkedIn followers', targetValue: 10000, unit: 'followers' },
    ],
    whyItMatters: 'Thought leadership builds trust, attracts customers, and opens doors to partnerships and investors.',
    commonPitfalls: ['Self-promotion over value', 'Inconsistent presence', 'Not leveraging content'],
    successMetrics: ['Social media engagement', 'Inbound leads from content', 'Speaking opportunities'],
  },
  {
    id: 'brand-2',
    category: 'brand-awareness',
    title: 'Launch Community of 1,000 Members',
    description: 'Build engaged community around product or industry topic.',
    suggestedDuration: 120,
    keyResults: [
      { title: 'Launch Slack/Discord community', targetValue: 1, unit: 'community' },
      { title: 'Grow to 1,000+ active members', targetValue: 1000, unit: 'members' },
      { title: 'Achieve 30%+ weekly active rate', targetValue: 30, unit: '%' },
    ],
    whyItMatters: 'Communities create sticky customers, provide product feedback, and generate word-of-mouth growth.',
    commonPitfalls: ['No community guidelines', 'Not seeding discussions', 'Letting community become ghost town'],
    successMetrics: ['Member growth rate', 'Weekly active members', 'Community NPS'],
  },

  // Manufacturing (Hardware-Specific)
  {
    id: 'manufacturing-1',
    category: 'manufacturing',
    title: 'Achieve Design for Manufacturing (DFM) Certification',
    description: 'Optimize product design to reduce manufacturing costs by 30% and improve yield.',
    suggestedDuration: 90,
    keyResults: [
      { title: 'Complete DFM review with 3 manufacturers', targetValue: 3, unit: 'manufacturers' },
      { title: 'Reduce BOM cost by 30%', targetValue: 30, unit: '%' },
      { title: 'Achieve 95%+ first-pass yield', targetValue: 95, unit: '%' },
    ],
    whyItMatters: 'DFM optimization is critical for hardware margins. A 30% BOM reduction can mean the difference between profitability and burning cash.',
    commonPitfalls: ['Optimizing too early', 'Not involving manufacturers early', 'Sacrificing quality for cost'],
    successMetrics: ['BOM cost', 'Manufacturing yield', 'Assembly time'],
  },
  {
    id: 'manufacturing-2',
    category: 'manufacturing',
    title: 'Scale Production to 10,000 Units/Month',
    description: 'Build manufacturing capacity to produce 10k units/month with consistent quality.',
    suggestedDuration: 120,
    keyResults: [
      { title: 'Qualify 2 contract manufacturers', targetValue: 2, unit: 'manufacturers' },
      { title: 'Achieve 10,000 units/month capacity', targetValue: 10000, unit: 'units' },
      { title: 'Maintain under 2% defect rate', targetValue: 2, unit: '%' },
    ],
    whyItMatters: 'Scaling manufacturing is the hardest part of hardware. You need reliable production to meet demand and maintain quality.',
    commonPitfalls: ['Single manufacturer dependency', 'Not building quality controls', 'Overestimating ramp speed'],
    successMetrics: ['Production volume', 'Defect rate', 'On-time delivery'],
  },

  // Supply Chain
  {
    id: 'supply-chain-1',
    category: 'supply-chain',
    title: 'Build Resilient Multi-Source Supply Chain',
    description: 'Establish redundancy by qualifying 2-3 suppliers for all critical components.',
    suggestedDuration: 120,
    keyResults: [
      { title: 'Qualify 2+ suppliers for 100% of critical components', targetValue: 100, unit: '%' },
      { title: 'Reduce lead times by 25%', targetValue: 25, unit: '%' },
      { title: 'Build 60-day safety stock', targetValue: 60, unit: 'days' },
    ],
    whyItMatters: 'Supply chain disruptions can kill hardware companies. Multi-sourcing and safety stock protect against delays.',
    commonPitfalls: ['Single-source dependencies', 'Not stress testing suppliers', 'Insufficient safety stock'],
    successMetrics: ['Supply chain reliability', 'Average lead time', 'Stockout incidents'],
  },
  {
    id: 'supply-chain-2',
    category: 'supply-chain',
    title: 'Implement Just-in-Time Inventory Management',
    description: 'Optimize inventory levels to reduce carrying costs while avoiding stockouts.',
    suggestedDuration: 90,
    keyResults: [
      { title: 'Reduce inventory carrying costs by 40%', targetValue: 40, unit: '%' },
      { title: 'Maintain 98%+ product availability', targetValue: 98, unit: '%' },
      { title: 'Achieve 8+ inventory turns per year', targetValue: 8, unit: 'turns' },
    ],
    whyItMatters: 'Excess inventory ties up cash. JIT inventory frees up capital while maintaining availability.',
    commonPitfalls: ['Optimizing too aggressively', 'Not accounting for variability', 'Poor demand forecasting'],
    successMetrics: ['Inventory turns', 'Carrying cost', 'Stockout rate'],
  },

  // Sustainability
  {
    id: 'sustainability-1',
    category: 'sustainability',
    title: 'Achieve Carbon Neutral Operations',
    description: 'Measure, reduce, and offset carbon emissions to achieve carbon neutrality.',
    suggestedDuration: 180,
    keyResults: [
      { title: 'Complete full carbon footprint assessment', targetValue: 100, unit: '%' },
      { title: 'Reduce operational emissions by 50%', targetValue: 50, unit: '%' },
      { title: 'Offset remaining emissions with verified credits', targetValue: 100, unit: '%' },
    ],
    whyItMatters: 'Sustainability is increasingly important to customers, investors, and employees. Carbon neutrality demonstrates commitment.',
    commonPitfalls: ['Greenwashing with low-quality offsets', 'Not reducing before offsetting', 'Incomplete measurement'],
    successMetrics: ['Total carbon emissions', 'Emissions per unit', 'Offset quality'],
  },
  {
    id: 'sustainability-2',
    category: 'sustainability',
    title: 'Design Product for Circularity',
    description: 'Redesign product to be fully recyclable, repairable, and use 80% recycled materials.',
    suggestedDuration: 120,
    keyResults: [
      { title: 'Achieve 80% recycled content in materials', targetValue: 80, unit: '%' },
      { title: 'Design for 95% recyclability at end-of-life', targetValue: 95, unit: '%' },
      { title: 'Launch repair program with 5-year support', targetValue: 5, unit: 'years' },
    ],
    whyItMatters: 'Circular design reduces environmental impact and appeals to eco-conscious customers. It is also future-proof against regulations.',
    commonPitfalls: ['Greenwashing without substance', 'Higher costs without price premium', 'Complex disassembly'],
    successMetrics: ['Recycled content %', 'Recyclability rate', 'Repair rate'],
  },
];

export function getOKRsByCategory(category: OKRCategory): OKRSuggestion[] {
  return OKR_SUGGESTIONS.filter(okr => okr.category === category);
}

export function searchOKRs(query: string): OKRSuggestion[] {
  const lowerQuery = query.toLowerCase();
  return OKR_SUGGESTIONS.filter(
    okr =>
      okr.title.toLowerCase().includes(lowerQuery) ||
      okr.description.toLowerCase().includes(lowerQuery) ||
      okr.category.toLowerCase().includes(lowerQuery)
  );
}
