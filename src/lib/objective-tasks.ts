/**
 * Objective-Driven Task Suggestion Engine
 *
 * This system analyzes objectives and automatically suggests proven tasks
 * that lead to achieving those objectives, with founder-level coaching explanations.
 *
 * Based on research from:
 * - Tability OKR Examples for Startups
 * - First Round Capital PMF Levels
 * - HubSpot Customer Acquisition Playbook
 */

import type { Function as TaskFunction } from '@/types';

export interface SuggestedTask {
  id: string;
  title: string;
  description: string;
  function: TaskFunction;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  estimatedHours: number;
  why: string; // Founder coaching: Why this task matters
  impact: string; // What success looks like
  dependencies?: string[]; // IDs of tasks that should be done first
  order: number; // Execution order
  milestoneType?: 'quick-win' | 'foundation' | 'breakthrough' | 'scale';
}

export interface ObjectivePattern {
  keywords: string[]; // Keywords to match in objective title/description
  category: 'revenue' | 'product' | 'customer' | 'team' | 'operations' | 'fundraising';
  stage: 'pre-launch' | 'pmf' | 'growth' | 'scale';
  tasks: SuggestedTask[];
}

/**
 * Comprehensive objective patterns with proven task sequences
 * Research-backed from startup playbooks and OKR frameworks
 */
export const OBJECTIVE_PATTERNS: ObjectivePattern[] = [
  // ============================================================================
  // REVENUE GROWTH OBJECTIVES
  // ============================================================================
  {
    keywords: ['revenue', 'sales', 'mrr', 'arr', 'grow sales', 'increase revenue'],
    category: 'revenue',
    stage: 'growth',
    tasks: [
      {
        id: 'rev-001',
        title: 'Define Ideal Customer Profile (ICP)',
        description: 'Document detailed ICP: industry, company size, pain points, budget, decision-makers. Create scoring criteria for lead qualification.',
        function: 'Sales',
        priority: 'urgent',
        estimatedHours: 8,
        order: 1,
        milestoneType: 'foundation',
        why: 'Without a clear ICP, you\'ll waste 60%+ of sales effort on wrong-fit prospects. This is THE foundation for efficient growth.',
        impact: 'Your win rate will jump from ~15% to 35%+ when targeting the right customers. Every sales hour becomes 2-3x more valuable.',
      },
      {
        id: 'rev-002',
        title: 'Build Lead Scoring System',
        description: 'Create point system (0-100) based on ICP fit, engagement level, budget signals. Automate scoring in CRM.',
        function: 'Sales',
        priority: 'high',
        estimatedHours: 6,
        order: 2,
        milestoneType: 'foundation',
        dependencies: ['rev-001'],
        why: 'Sales teams waste 50% of time on low-quality leads. Scoring ensures you chase the right prospects first.',
        impact: 'Sales pipeline becomes 3x more predictable. Close rates improve 20-30% by focusing on high-score leads.',
      },
      {
        id: 'rev-003',
        title: 'Implement Sales Playbook',
        description: 'Document: cold outreach scripts, discovery questions, demo flow, objection handling, pricing discussion framework.',
        function: 'Sales',
        priority: 'high',
        estimatedHours: 12,
        order: 3,
        milestoneType: 'foundation',
        dependencies: ['rev-001'],
        why: 'Repeatable processes beat "winging it" every time. Playbooks reduce sales cycle by 30% and improve consistency.',
        impact: 'New sales hires ramp 50% faster. Everyone delivers the same quality pitch. Win rates become predictable.',
      },
      {
        id: 'rev-004',
        title: 'Set Up Weekly Sales Metrics Dashboard',
        description: 'Track: pipeline value, conversion rates by stage, avg deal size, sales cycle length, CAC, LTV:CAC ratio.',
        function: 'Finance',
        priority: 'high',
        estimatedHours: 4,
        order: 4,
        milestoneType: 'foundation',
        why: 'You can\'t improve what you don\'t measure. Weekly metrics reveal bottlenecks before they cost you months of revenue.',
        impact: 'Identify and fix pipeline problems in days instead of quarters. Make data-driven decisions on where to invest.',
      },
      {
        id: 'rev-005',
        title: 'Launch Referral Program',
        description: 'Design incentive structure, create referral landing page, automate tracking and rewards, train team on asking for referrals.',
        function: 'Marketing',
        priority: 'medium',
        estimatedHours: 16,
        order: 5,
        milestoneType: 'quick-win',
        dependencies: ['rev-001', 'rev-003'],
        why: 'Referrals close 4x faster with 3x higher LTV than cold leads. Best customers come from happy customers.',
        impact: 'Referrals will grow to 20-30% of new pipeline within 6 months, at 1/5th the CAC of paid channels.',
      },
      {
        id: 'rev-006',
        title: 'Optimize Pricing Strategy',
        description: 'Analyze competitor pricing, survey willingness-to-pay, test 3 pricing tiers, implement value-based pricing.',
        function: 'Finance',
        priority: 'high',
        estimatedHours: 20,
        order: 6,
        milestoneType: 'breakthrough',
        dependencies: ['rev-001', 'rev-004'],
        why: 'Pricing is your biggest revenue lever. A 10% price increase beats 30% more customers for profitability.',
        impact: 'Expect 15-25% revenue increase with same customer base. Higher prices often improve perceived value.',
      },
      {
        id: 'rev-007',
        title: 'Implement Upsell Motion',
        description: 'Identify expansion triggers, create upgrade paths, train team on expansion conversations, set up usage-based alerts.',
        function: 'Sales',
        priority: 'medium',
        estimatedHours: 10,
        order: 7,
        milestoneType: 'scale',
        dependencies: ['rev-003', 'rev-006'],
        why: 'Selling to existing customers is 5-7x cheaper than new acquisition. Expansion drives 70%+ of growth at scale.',
        impact: 'Net revenue retention jumps to 110-120%. Compound growth accelerates as base expands.',
      },
    ],
  },

  // ============================================================================
  // PRODUCT-MARKET FIT OBJECTIVES
  // ============================================================================
  {
    keywords: ['product market fit', 'pmf', 'validate product', 'customer validation', 'user feedback'],
    category: 'product',
    stage: 'pmf',
    tasks: [
      {
        id: 'pmf-001',
        title: 'Conduct 30 Customer Problem Interviews',
        description: 'Interview target customers about pain points (not your solution). Use script: "Tell me about the last time you experienced [problem]..."',
        function: 'Ops',
        priority: 'urgent',
        estimatedHours: 40,
        order: 1,
        milestoneType: 'foundation',
        why: 'Most startups build solutions looking for problems. You need to deeply understand the pain BEFORE building more features.',
        impact: 'Discover the 1-2 problems worth solving vs. 10 nice-to-haves. Focus product roadmap on real needs.',
      },
      {
        id: 'pmf-002',
        title: 'Define "Aha Moment" for Your Product',
        description: 'Identify the exact action/outcome where users "get it". Map time-to-value. Example: "First project created + team invited."',
        function: 'Engineering',
        priority: 'urgent',
        estimatedHours: 8,
        order: 2,
        milestoneType: 'foundation',
        dependencies: ['pmf-001'],
        why: 'Users who hit the "aha moment" stay. Those who don\'t churn. This is your most important product metric.',
        impact: 'Retention jumps 3-5x when you optimize for fast time-to-aha. Clear north star for product decisions.',
      },
      {
        id: 'pmf-003',
        title: 'Implement Sean Ellis PMF Survey',
        description: 'Ask: "How would you feel if you could no longer use this product?" Target: 40%+ say "very disappointed."',
        function: 'Ops',
        priority: 'high',
        estimatedHours: 4,
        order: 3,
        milestoneType: 'foundation',
        dependencies: ['pmf-002'],
        why: 'This is THE metric for PMF. Below 40% = don\'t scale yet. Above 40% = you have something people genuinely need.',
        impact: 'Objective data on whether to iterate (below 40%) or accelerate (above 40%). Saves months of wasted scale effort.',
      },
      {
        id: 'pmf-004',
        title: 'Analyze Retention Cohorts',
        description: 'Build cohort analysis: Day 1, 7, 30, 90 retention by signup month. Identify when/why users churn.',
        function: 'Engineering',
        priority: 'high',
        estimatedHours: 12,
        order: 4,
        milestoneType: 'foundation',
        why: 'Retention is the truest PMF signal. If you can\'t retain, you can\'t grow sustainably. Fix retention before scaling acquisition.',
        impact: 'Pinpoint exactly where users fall off. Focus product efforts on the biggest retention killers.',
      },
      {
        id: 'pmf-005',
        title: 'Create Customer Success Playbook',
        description: 'Document onboarding sequence, success milestones, check-in cadence, red flag signals, rescue protocols.',
        function: 'Ops',
        priority: 'high',
        estimatedHours: 16,
        order: 5,
        milestoneType: 'foundation',
        dependencies: ['pmf-002', 'pmf-004'],
        why: 'PMF isn\'t just about the product—it\'s about the full experience. Success playbooks ensure every customer gets to value.',
        impact: 'Onboarding-to-active rates improve 40-60%. Churn drops as you systematically guide users to success.',
      },
      {
        id: 'pmf-006',
        title: 'Build Feature Usage Dashboard',
        description: 'Track: which features are used, by whom, how often, correlation with retention/upgrades.',
        function: 'Engineering',
        priority: 'medium',
        estimatedHours: 8,
        order: 6,
        milestoneType: 'foundation',
        dependencies: ['pmf-004'],
        why: 'Most features go unused. Data reveals what actually drives value vs. what\'s just bloat.',
        impact: 'Kill low-value features, double down on high-impact ones. Product becomes sharper and faster.',
      },
      {
        id: 'pmf-007',
        title: 'Establish Product Advisory Board',
        description: 'Recruit 5-10 power users for monthly feedback. Give them early access, listen deeply, compensate their time.',
        function: 'Ops',
        priority: 'medium',
        estimatedHours: 12,
        order: 7,
        milestoneType: 'breakthrough',
        dependencies: ['pmf-003', 'pmf-005'],
        why: 'Your best customers are your best product team. They\'ll tell you what to build next better than any internal debate.',
        impact: 'Product roadmap becomes customer-driven. Features ship with built-in demand. Launch success rate 3x higher.',
      },
    ],
  },

  // ============================================================================
  // CUSTOMER ACQUISITION OBJECTIVES
  // ============================================================================
  {
    keywords: ['customer acquisition', 'leads', 'traffic', 'signups', 'conversions', 'grow users'],
    category: 'customer',
    stage: 'growth',
    tasks: [
      {
        id: 'acq-001',
        title: 'Audit Current Acquisition Channels',
        description: 'Analyze last 90 days: traffic sources, conversion rates, CAC by channel, LTV by channel. Identify what\'s working.',
        function: 'Marketing',
        priority: 'urgent',
        estimatedHours: 8,
        order: 1,
        milestoneType: 'foundation',
        why: 'Most startups spread budget thin across 10 channels. You need to find your 1-2 channels that actually work.',
        impact: 'Cut wasted spend on underperforming channels. 2-3x ROI by doubling down on winners.',
      },
      {
        id: 'acq-002',
        title: 'Build Content Strategy for SEO',
        description: 'Keyword research (focus on problem-aware terms), content calendar, publish 2-3 high-quality articles/week.',
        function: 'Marketing',
        priority: 'high',
        estimatedHours: 20,
        order: 2,
        milestoneType: 'foundation',
        dependencies: ['acq-001'],
        why: 'SEO is your long-term compounding channel. Content you write today drives leads for years at near-zero marginal cost.',
        impact: 'Organic traffic grows 10-20% month-over-month once momentum starts. CAC approaches $0 over time.',
      },
      {
        id: 'acq-003',
        title: 'Optimize Landing Page Conversion',
        description: 'A/B test: headlines, CTAs, social proof, form length. Aim for 8-12% conversion on cold traffic.',
        function: 'Marketing',
        priority: 'urgent',
        estimatedHours: 12,
        order: 3,
        milestoneType: 'quick-win',
        why: 'If landing page converts 3% instead of 10%, you need 3x more traffic for same results. Conversion is highest-leverage.',
        impact: 'Every 1% improvement in conversion = 10-20% more customers from same traffic. Compounds across all channels.',
      },
      {
        id: 'acq-004',
        title: 'Launch Strategic Partnership Program',
        description: 'Identify 5-10 complementary products, propose co-marketing, create joint webinars/content, track referral attribution.',
        function: 'Sales',
        priority: 'high',
        estimatedHours: 24,
        order: 4,
        milestoneType: 'breakthrough',
        dependencies: ['acq-001'],
        why: 'Partnerships give you instant access to audiences that trust the partner. 10x faster than building from scratch.',
        impact: 'Each partnership brings 50-200 qualified leads. CAC is essentially zero—just time investment.',
      },
      {
        id: 'acq-005',
        title: 'Implement Retargeting Campaigns',
        description: 'Set up pixel tracking, create audience segments, design ad creative for different funnel stages.',
        function: 'Marketing',
        priority: 'medium',
        estimatedHours: 8,
        order: 5,
        milestoneType: 'quick-win',
        dependencies: ['acq-003'],
        why: 'Only 2-3% convert on first visit. Retargeting brings back the 97% who left, at 1/10th the cost of new traffic.',
        impact: 'Conversion rates 5-8x higher on retargeted traffic. Payback period drops from months to weeks.',
      },
      {
        id: 'acq-006',
        title: 'Create Lead Magnet + Email Nurture',
        description: 'Build valuable downloadable (template, guide, tool), gate it with email, create 5-email nurture sequence.',
        function: 'Marketing',
        priority: 'high',
        estimatedHours: 16,
        order: 6,
        milestoneType: 'foundation',
        dependencies: ['acq-002'],
        why: 'Most B2B buyers aren\'t ready to buy today. Email nurture keeps you top-of-mind until they are ready.',
        impact: '30-40% of leads eventually convert vs. 2-3% without nurture. Email remains highest-ROI channel.',
      },
      {
        id: 'acq-007',
        title: 'Launch Community/Forum',
        description: 'Create community space (Slack, Circle, Discord), seed with valuable content, engage daily, invite power users.',
        function: 'Marketing',
        priority: 'medium',
        estimatedHours: 20,
        order: 7,
        milestoneType: 'scale',
        dependencies: ['acq-002', 'acq-006'],
        why: 'Communities create network effects. Members recruit members. Support scales through peer-to-peer help.',
        impact: 'Communities drive 2-3x higher engagement and retention. Free word-of-mouth growth engine.',
      },
    ],
  },

  // ============================================================================
  // TEAM BUILDING OBJECTIVES
  // ============================================================================
  {
    keywords: ['hire', 'team', 'talent', 'recruiting', 'build team', 'headcount'],
    category: 'team',
    stage: 'growth',
    tasks: [
      {
        id: 'team-001',
        title: 'Define Role Requirements & Scorecard',
        description: 'For each role: mission, outcomes (not tasks), key competencies, interview scorecard, red flags.',
        function: 'Ops',
        priority: 'urgent',
        estimatedHours: 6,
        order: 1,
        milestoneType: 'foundation',
        why: 'Vague job descriptions attract vague candidates. Scorecards ensure you hire for outcomes, not just resumes.',
        impact: 'Hiring success rate jumps from 50% to 80%+. Every hire is evaluated against clear criteria.',
      },
      {
        id: 'team-002',
        title: 'Build Talent Pipeline',
        description: 'Identify where your ideal candidates hang out, post consistently, network proactively, maintain warm relationships.',
        function: 'Ops',
        priority: 'high',
        estimatedHours: 12,
        order: 2,
        milestoneType: 'foundation',
        dependencies: ['team-001'],
        why: 'Best hires come from relationships, not job boards. Pipeline means you\'re never scrambling when you need someone.',
        impact: 'Time-to-hire drops 50%. Quality goes up because you\'re choosing from people you already know.',
      },
      {
        id: 'team-003',
        title: 'Create Structured Interview Process',
        description: '4-stage process: phone screen (fit), skills assessment (work sample), team interview (culture), final (vision alignment).',
        function: 'Ops',
        priority: 'urgent',
        estimatedHours: 8,
        order: 3,
        milestoneType: 'foundation',
        dependencies: ['team-001'],
        why: 'Unstructured interviews have 14% accuracy in predicting performance. Structured interviews hit 56% accuracy.',
        impact: 'Mis-hires drop dramatically. Every candidate goes through same rigorous process—fair and effective.',
      },
      {
        id: 'team-004',
        title: 'Design Onboarding Program (30-60-90)',
        description: 'Day 1 checklist, first week goals, 30/60/90-day success milestones, buddy assignment, clear deliverables.',
        function: 'Ops',
        priority: 'high',
        estimatedHours: 12,
        order: 4,
        milestoneType: 'foundation',
        dependencies: ['team-003'],
        why: '88% of companies with strong onboarding improve retention. First 90 days determine if someone thrives or quits.',
        impact: 'New hires productive 2x faster. Regretted attrition in first year drops from 30% to under 10%.',
      },
      {
        id: 'team-005',
        title: 'Establish Weekly 1-on-1 Rhythm',
        description: 'Schedule recurring 1:1s, use consistent agenda (wins, blockers, feedback, growth), document takeaways.',
        function: 'Ops',
        priority: 'high',
        estimatedHours: 4,
        order: 5,
        milestoneType: 'foundation',
        dependencies: ['team-004'],
        why: 'Most turnover is preventable. 1:1s surface issues early and build trust that makes people want to stay.',
        impact: 'Engagement scores 30%+ higher. You catch problems before they become resignations.',
      },
      {
        id: 'team-006',
        title: 'Implement Performance Review System',
        description: 'Quarterly reviews: self-assessment, peer feedback, manager evaluation, calibration across team, growth plans.',
        function: 'Ops',
        priority: 'medium',
        estimatedHours: 16,
        order: 6,
        milestoneType: 'foundation',
        dependencies: ['team-005'],
        why: 'Without reviews, top performers feel unseen and underperformers think they\'re doing great. Feedback drives growth.',
        impact: 'Top talent retention improves 25%. Clear performance bar makes coaching and exits fair and predictable.',
      },
      {
        id: 'team-007',
        title: 'Create Career Ladders',
        description: 'Define levels, competencies per level, promotion criteria, compensation bands, examples at each level.',
        function: 'Ops',
        priority: 'medium',
        estimatedHours: 20,
        order: 7,
        milestoneType: 'scale',
        dependencies: ['team-006'],
        why: 'Top performers leave when they don\'t see a path forward. Career ladders show exactly how to grow.',
        impact: 'Retention of high performers jumps 40%. Internal promotions cheaper and faster than external hires.',
      },
    ],
  },

  // ============================================================================
  // OPERATIONAL EFFICIENCY OBJECTIVES
  // ============================================================================
  {
    keywords: ['efficiency', 'operations', 'process', 'automate', 'streamline', 'reduce costs'],
    category: 'operations',
    stage: 'growth',
    tasks: [
      {
        id: 'ops-001',
        title: 'Map Current Workflows',
        description: 'Document every recurring workflow: steps, owners, time spent, pain points, handoffs, tools used.',
        function: 'Ops',
        priority: 'urgent',
        estimatedHours: 16,
        order: 1,
        milestoneType: 'foundation',
        why: 'You can\'t optimize what you don\'t document. Most teams waste 30-40% of time on unnecessary steps they don\'t even see.',
        impact: 'Visibility into where time actually goes. Identify quick wins that save 5-10 hours/week immediately.',
      },
      {
        id: 'ops-002',
        title: 'Identify Automation Opportunities',
        description: 'Score workflows on: frequency, time cost, error rate, automation feasibility. Prioritize high-score opportunities.',
        function: 'Ops',
        priority: 'high',
        estimatedHours: 8,
        order: 2,
        milestoneType: 'foundation',
        dependencies: ['ops-001'],
        why: 'Automate the right things and you get 10x ROI. Automate the wrong things and you build a complicated mess.',
        impact: 'Clear roadmap of what to automate first. Focus engineering effort on highest-value automation.',
      },
      {
        id: 'ops-003',
        title: 'Implement Project Management System',
        description: 'Choose tool (Asana, Linear, etc), migrate all tasks, establish naming conventions, create templates, train team.',
        function: 'Ops',
        priority: 'urgent',
        estimatedHours: 12,
        order: 3,
        milestoneType: 'quick-win',
        why: 'Without a system, work lives in emails and Slack. Things fall through cracks. Chaos masquerades as busy-ness.',
        impact: 'Visibility into who\'s working on what. Nothing forgotten. Project velocity improves 20-30%.',
      },
      {
        id: 'ops-004',
        title: 'Create Standard Operating Procedures (SOPs)',
        description: 'Document top 10 recurring processes as step-by-step SOPs with screenshots, videos, FAQs.',
        function: 'Ops',
        priority: 'high',
        estimatedHours: 24,
        order: 4,
        milestoneType: 'foundation',
        dependencies: ['ops-001'],
        why: 'Every time someone asks "how do I do X," that\'s wasted time. SOPs answer once and scale infinitely.',
        impact: 'New hires ramp 50% faster. Quality becomes consistent. You stop being the bottleneck for answers.',
      },
      {
        id: 'ops-005',
        title: 'Set Up Weekly Metrics Reviews',
        description: 'Define key metrics per function, automate dashboards, hold weekly reviews, assign owners to each metric.',
        function: 'Finance',
        priority: 'high',
        estimatedHours: 8,
        order: 5,
        milestoneType: 'foundation',
        dependencies: ['ops-003'],
        why: 'What gets measured gets managed. Weekly cadence catches problems early before they become crises.',
        impact: 'Team becomes data-driven. Issues surface in days, not months. Everyone knows their numbers.',
      },
      {
        id: 'ops-006',
        title: 'Automate Top 3 Manual Workflows',
        description: 'Use no-code tools (Zapier, Make) or light code to automate highest-frequency manual tasks.',
        function: 'Engineering',
        priority: 'medium',
        estimatedHours: 20,
        order: 6,
        milestoneType: 'breakthrough',
        dependencies: ['ops-002'],
        why: 'Manual work scales linearly (more work = more people). Automation scales exponentially (more work = same people).',
        impact: 'Each automation saves 5-15 hours/week. Team can focus on strategic work instead of busy work.',
      },
      {
        id: 'ops-007',
        title: 'Implement Knowledge Base',
        description: 'Choose platform (Notion, Confluence), migrate critical docs, create templates, establish update cadence.',
        function: 'Ops',
        priority: 'medium',
        estimatedHours: 16,
        order: 7,
        milestoneType: 'foundation',
        dependencies: ['ops-004'],
        why: 'Knowledge in people\'s heads doesn\'t scale. When they leave, you lose institutional knowledge.',
        impact: 'Self-serve answers to 70%+ of questions. Onboarding faster. Less time spent answering same questions.',
      },
    ],
  },

  // ============================================================================
  // FUNDRAISING OBJECTIVES
  // ============================================================================
  {
    keywords: ['raise', 'fundraising', 'funding', 'investment', 'investors', 'capital'],
    category: 'fundraising',
    stage: 'growth',
    tasks: [
      {
        id: 'fund-001',
        title: 'Build Compelling Pitch Deck',
        description: 'Create 12-15 slide deck: problem, solution, traction, market, team, ask. Focus on storytelling + data.',
        function: 'Finance',
        priority: 'urgent',
        estimatedHours: 24,
        order: 1,
        milestoneType: 'foundation',
        why: 'Your deck is your first impression with 99% of investors. Weak deck = no meeting. Strong deck = door opener.',
        impact: 'Get in front of right investors. Strong deck can improve meeting conversion from 5% to 20%+.',
      },
      {
        id: 'fund-002',
        title: 'Create Detailed Financial Model',
        description: '3-year projections: revenue by segment, unit economics, headcount plan, burn rate, runway, key assumptions.',
        function: 'Finance',
        priority: 'urgent',
        estimatedHours: 32,
        order: 2,
        milestoneType: 'foundation',
        why: 'Investors will stress-test your numbers. A solid model shows you understand your business and can think long-term.',
        impact: 'Credibility with investors jumps. You can answer "what if" scenarios confidently. Internal planning improves too.',
      },
      {
        id: 'fund-003',
        title: 'Build Target Investor List',
        description: 'Research 100+ VCs: stage fit, sector focus, check size, portfolio, recent investments. Score and prioritize.',
        function: 'Finance',
        priority: 'high',
        estimatedHours: 16,
        order: 3,
        milestoneType: 'foundation',
        dependencies: ['fund-001'],
        why: 'Most founders waste months pitching wrong investors. Targeting = 3x more meetings from same effort.',
        impact: 'Focus energy on investors likely to say yes. Higher quality conversations. Faster path to term sheet.',
      },
      {
        id: 'fund-004',
        title: 'Secure Warm Introductions',
        description: 'Map your network to target investors, ask for intros, leverage portfolio CEOs, attend VC events.',
        function: 'Finance',
        priority: 'urgent',
        estimatedHours: 20,
        order: 4,
        milestoneType: 'breakthrough',
        dependencies: ['fund-003'],
        why: 'Warm intros convert 5-10x better than cold emails. VCs trust referrals from people they know.',
        impact: 'Meeting rate goes from 2% (cold) to 40%+ (warm). Quality of conversation starts higher.',
      },
      {
        id: 'fund-005',
        title: 'Prepare Data Room',
        description: 'Organize: financials, contracts, cap table, KPIs, IP docs, legal docs. Use secure sharing platform.',
        function: 'Finance',
        priority: 'high',
        estimatedHours: 16,
        order: 5,
        milestoneType: 'foundation',
        dependencies: ['fund-002'],
        why: 'Once investor is interested, they\'ll ask for diligence materials. Fast response = serious company. Slow = red flag.',
        impact: 'Close rounds 2-3 weeks faster. Professional data room builds confidence in your operations.',
      },
      {
        id: 'fund-006',
        title: 'Practice Pitch (10+ Rehearsals)',
        description: 'Rehearse with advisors, founders, mock investors. Time it. Anticipate tough questions. Refine story.',
        function: 'Finance',
        priority: 'high',
        estimatedHours: 12,
        order: 6,
        milestoneType: 'quick-win',
        dependencies: ['fund-001'],
        why: 'First pitch is terrible. Tenth pitch is great. Don\'t waste early opportunities on an unpolished pitch.',
        impact: 'Confidence soars. Objection handling smooth. Story flow natural. Win rate on meetings improves 2-3x.',
      },
      {
        id: 'fund-007',
        title: 'Create FOMO with Multiple Conversations',
        description: 'Schedule 15-20 investor meetings in 2-3 week window. Create competitive dynamic. Manage timeline actively.',
        function: 'Finance',
        priority: 'high',
        estimatedHours: 8,
        order: 7,
        milestoneType: 'breakthrough',
        dependencies: ['fund-004', 'fund-006'],
        why: 'VCs move fast when they fear missing out, slow when they think they have time. Compressed timeline = urgency.',
        impact: 'Better terms. Faster closes. VCs compete for allocation instead of you begging for interest.',
      },
    ],
  },
];

/**
 * Analyze an objective and suggest relevant tasks
 */
export function suggestTasksForObjective(
  objectiveTitle: string,
  objectiveDescription?: string
): SuggestedTask[] {
  const searchText = `${objectiveTitle} ${objectiveDescription || ''}`.toLowerCase();

  // Find matching patterns
  const matchedPatterns = OBJECTIVE_PATTERNS.filter(pattern =>
    pattern.keywords.some(keyword => searchText.includes(keyword.toLowerCase()))
  );

  if (matchedPatterns.length === 0) {
    return [];
  }

  // Get tasks from best matching pattern (first match for now, could be improved with scoring)
  const bestPattern = matchedPatterns[0];

  return bestPattern.tasks.sort((a, b) => a.order - b.order);
}

/**
 * Get coaching explanation for why these tasks matter
 */
export function getObjectiveCoaching(category: ObjectivePattern['category']): string {
  const coaching = {
    revenue: 'Revenue growth isn\'t about working harder—it\'s about working smarter. These tasks create a repeatable, scalable revenue engine. Execute them in order and you\'ll see results in 30-60 days.',
    product: 'Product-market fit is the foundation everything else builds on. Without it, growth is a leaky bucket. These tasks help you systematically validate and strengthen PMF before you scale.',
    customer: 'Acquisition is expensive and competitive. These tasks help you build multiple channels, optimize conversion at every step, and create compounding growth loops that get cheaper over time.',
    team: 'Your team is your leverage. Great hiring compounds—each great hire attracts more great hires. These tasks create systems that scale quality hiring and retention.',
    operations: 'Operations seem boring until you realize they\'re the difference between chaos and scale. These tasks free up 20-30% of your team\'s time for strategic work.',
    fundraising: 'Fundraising is a full-time job for 2-3 months. These tasks create urgency, credibility, and FOMO—the three ingredients for closing rounds quickly on good terms.',
  };

  return coaching[category];
}

/**
 * Calculate estimated time to complete all suggested tasks
 */
export function calculateTotalEffort(tasks: SuggestedTask[]): {
  totalHours: number;
  totalDays: number;
  byMilestone: Record<string, number>;
} {
  const totalHours = tasks.reduce((sum, task) => sum + task.estimatedHours, 0);

  const byMilestone: Record<string, number> = {};
  tasks.forEach(task => {
    const type = task.milestoneType || 'other';
    byMilestone[type] = (byMilestone[type] || 0) + task.estimatedHours;
  });

  return {
    totalHours,
    totalDays: Math.ceil(totalHours / 8), // Assuming 8-hour days
    byMilestone,
  };
}
