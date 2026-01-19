/**
 * Default Onboarding Program: "Founder Zero-to-One"
 * Seed data for the onboarding system
 */

import type {
  OnboardingModule,
  OnboardingStep,
  ModuleKey,
  StageApplicability,
} from './types';

// =============================================================================
// PROGRAM DEFINITION
// =============================================================================

export const FOUNDER_ZERO_TO_ONE_PROGRAM = {
  id: 'program-founder-zero-to-one',
  name: 'Founder Zero-to-One',
  description:
    'A structured guide to take your startup from idea to operating cadence. Covers mission, market, product, go-to-market, finance, people, and ops.',
  version: '1.0.0',
  is_active: true,
  is_default: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

// =============================================================================
// MODULE DEFINITIONS
// =============================================================================

export const MODULES: Omit<OnboardingModule, 'id' | 'created_at' | 'updated_at'>[] = [
  {
    program_id: FOUNDER_ZERO_TO_ONE_PROGRAM.id,
    module_key: 'foundation',
    title: 'Foundation',
    description: 'Define your mission, constraints, and immediate success metrics.',
    icon: 'Compass',
    color: '#8b5cf6', // Purple
    order_index: 0,
    stage_applicability: {
      org_stages: ['S0', 'S1', 'S2'],
      finance_stages: ['F0', 'F1'],
      required: true,
      auto_skip_if: [
        { field: 'company_profile.mission', operator: 'exists' },
      ],
    },
    is_required: true,
  },
  {
    program_id: FOUNDER_ZERO_TO_ONE_PROGRAM.id,
    module_key: 'market',
    title: 'Market',
    description: 'Identify your ideal customer, their pains, and your target list.',
    icon: 'Users',
    color: '#3b82f6', // Blue
    order_index: 1,
    stage_applicability: {
      org_stages: ['S0', 'S1', 'S2', 'S3'],
      finance_stages: ['F0', 'F1', 'F2'],
      required: true,
    },
    is_required: true,
  },
  {
    program_id: FOUNDER_ZERO_TO_ONE_PROGRAM.id,
    module_key: 'product',
    title: 'Product',
    description: 'Define your MVP, validation plan, and prototype milestones.',
    icon: 'Package',
    color: '#10b981', // Green
    order_index: 2,
    stage_applicability: {
      org_stages: ['S0', 'S1', 'S2'],
      finance_stages: ['F0', 'F1'],
      required: true,
    },
    is_required: true,
  },
  {
    program_id: FOUNDER_ZERO_TO_ONE_PROGRAM.id,
    module_key: 'go_to_market',
    title: 'Go-to-Market',
    description: 'Plan your channels, outreach, and pipeline tracking.',
    icon: 'Rocket',
    color: '#f59e0b', // Amber
    order_index: 3,
    stage_applicability: {
      org_stages: ['S0', 'S1', 'S2', 'S3'],
      finance_stages: ['F0', 'F1', 'F2'],
      required: true,
    },
    is_required: true,
  },
  {
    program_id: FOUNDER_ZERO_TO_ONE_PROGRAM.id,
    module_key: 'finance',
    title: 'Finance',
    description: 'Establish runway, funding plan, and reporting cadence.',
    icon: 'DollarSign',
    color: '#10b981', // Green
    order_index: 4,
    stage_applicability: {
      org_stages: ['S0', 'S1', 'S2', 'S3', 'S4'],
      finance_stages: ['F0', 'F1', 'F2', 'F3'],
      required: true,
    },
    is_required: true,
  },
  {
    program_id: FOUNDER_ZERO_TO_ONE_PROGRAM.id,
    module_key: 'people',
    title: 'People',
    description: 'Identify role gaps, find candidates, and plan interviews.',
    icon: 'UserPlus',
    color: '#ec4899', // Pink
    order_index: 5,
    stage_applicability: {
      org_stages: ['S0', 'S1', 'S2', 'S3', 'S4'],
      finance_stages: ['F0', 'F1', 'F2', 'F3'],
      required: true,
    },
    is_required: true,
  },
  {
    program_id: FOUNDER_ZERO_TO_ONE_PROGRAM.id,
    module_key: 'ops',
    title: 'Operations',
    description: 'Set up weekly cadence, task ownership, and capacity planning.',
    icon: 'Settings',
    color: '#64748b', // Slate
    order_index: 6,
    stage_applicability: {
      org_stages: ['S0', 'S1', 'S2', 'S3', 'S4'],
      finance_stages: ['F0', 'F1', 'F2', 'F3'],
      required: true,
    },
    is_required: true,
  },
];

// =============================================================================
// STEP DEFINITIONS
// =============================================================================

type StepDef = Omit<OnboardingStep, 'id' | 'module_id' | 'created_at' | 'updated_at'>;

export const STEPS_BY_MODULE: Record<ModuleKey, StepDef[]> = {
  // -------------------------------------------------------------------------
  // MODULE A: FOUNDATION
  // -------------------------------------------------------------------------
  foundation: [
    {
      step_key: 'define_mission_constraints',
      title: 'Define Mission & Constraints',
      description_short: 'Articulate your company mission in 2 sentences and list 3 operating constraints.',
      description_long:
        'Your mission is why you exist. Constraints define boundaries you will not cross (e.g., no VC funding, UK-only, remote-first). This helps you make faster decisions later.',
      order_index: 0,
      required_inputs: [
        {
          key: 'transcript',
          type: 'textarea',
          label: 'Describe your mission and constraints',
          placeholder: 'Our mission is to... Our constraints are: 1) ... 2) ... 3) ...',
          required: true,
          validation: { min_length: 50 },
        },
      ],
      evidence_requirements: [
        {
          key: 'mission_statement',
          label: '2-sentence mission statement',
          type: 'text',
          description: 'A clear, concise statement of what you do and why.',
          min_length: 20,
        },
        {
          key: 'constraints_list',
          label: '3 operating constraints',
          type: 'list',
          description: 'Non-negotiable boundaries for your business.',
          min_items: 3,
        },
      ],
      outputs_templates: {
        objectives: [
          {
            title_template: 'Establish clear mission and operating constraints',
            description_template: 'Document and communicate company mission and boundaries to all stakeholders.',
            category: 'operations',
          },
        ],
        task_drafts: [
          {
            title_template: 'Document mission statement in company wiki',
            units: 1,
            assignee_hint: 'founder',
            due_offset_days: 7,
          },
          {
            title_template: 'Share constraints with team and get alignment',
            units: 1,
            assignee_hint: 'founder',
            due_offset_days: 14,
          },
        ],
      },
      gating_rules: {
        min_evidence_count: 2,
        allow_skip: false,
      },
      llm_prompt_template: `Extract from the following transcript:
1. A 2-sentence mission statement
2. 3 operating constraints

Transcript: {{transcript}}

Return JSON with:
- mission_statement: string
- constraints: string[]
- objectives: [{ title, description, category }]
- task_drafts: [{ title, units, assignee_hint, due_offset_days }]`,
      is_required: true,
    },
    {
      step_key: 'define_offer_product_wedge',
      title: 'Define Offer / Product Wedge',
      description_short: 'Describe your offer in one line and identify your target buyer.',
      description_long:
        'Your product wedge is the specific angle that makes you different. Who exactly are you selling to, and what one thing do they get?',
      order_index: 1,
      required_inputs: [
        {
          key: 'transcript',
          type: 'textarea',
          label: 'Describe your offer and target buyer',
          placeholder: 'We help [target buyer] to [outcome] by [mechanism]...',
          required: true,
          validation: { min_length: 30 },
        },
      ],
      evidence_requirements: [
        {
          key: 'offer_statement',
          label: '1-liner offer statement',
          type: 'text',
          description: 'Clear value proposition in one sentence.',
          min_length: 20,
        },
        {
          key: 'target_buyer',
          label: 'Target buyer persona',
          type: 'text',
          description: 'Who specifically is this for?',
          min_length: 10,
        },
      ],
      outputs_templates: {
        objectives: [
          {
            title_template: 'Validate product-market hypothesis',
            description_template: 'Test offer with target buyers and iterate based on feedback.',
            category: 'product',
          },
        ],
        task_drafts: [
          {
            title_template: 'Create landing page with offer statement',
            units: 2,
            assignee_hint: 'founder',
            due_offset_days: 7,
          },
        ],
      },
      gating_rules: {
        requires_step_ids: ['define_mission_constraints'],
        min_evidence_count: 2,
        allow_skip: false,
      },
      is_required: true,
    },
    {
      step_key: 'define_30_day_metric',
      title: 'Define 30-Day Success Metric',
      description_short: 'Choose one measurable target for the next 30 days.',
      description_long:
        'Pick a single north-star metric that tells you if you are making progress. Make it specific and measurable.',
      order_index: 2,
      required_inputs: [
        {
          key: 'transcript',
          type: 'textarea',
          label: 'What metric will you track?',
          placeholder: 'In 30 days, I want to achieve [X] measured by [Y]...',
          required: true,
          validation: { min_length: 20 },
        },
      ],
      evidence_requirements: [
        {
          key: 'metric_target',
          label: 'Measurable 30-day target',
          type: 'text',
          description: 'Specific number + metric name.',
          min_length: 10,
        },
      ],
      outputs_templates: {
        task_drafts: [
          {
            title_template: 'Track {{metric_target}} daily for 30 days',
            units: 1,
            assignee_hint: 'founder',
            due_offset_days: 30,
          },
          {
            title_template: 'Review 30-day metric progress',
            units: 1,
            assignee_hint: 'founder',
            due_offset_days: 30,
          },
        ],
      },
      gating_rules: {
        requires_step_ids: ['define_offer_product_wedge'],
        min_evidence_count: 1,
        allow_skip: true,
      },
      is_required: true,
    },
  ],

  // -------------------------------------------------------------------------
  // MODULE B: MARKET
  // -------------------------------------------------------------------------
  market: [
    {
      step_key: 'define_icp',
      title: 'Define ICP',
      description_short: 'Create your Ideal Customer Profile with industry, size, and pain.',
      description_long:
        'The ICP helps you focus your sales and marketing. Be specific: what industry, company size, and role are you targeting?',
      order_index: 0,
      required_inputs: [
        {
          key: 'transcript',
          type: 'textarea',
          label: 'Describe your ideal customer',
          placeholder: 'Our ideal customer is a [role] at a [company type] in [industry] who struggles with [pain]...',
          required: true,
          validation: { min_length: 50 },
        },
      ],
      evidence_requirements: [
        {
          key: 'icp_statement',
          label: 'ICP statement (industry, size, pain)',
          type: 'text',
          min_length: 30,
        },
      ],
      outputs_templates: {
        objectives: [
          {
            title_template: 'Develop and validate Ideal Customer Profile',
            category: 'growth',
          },
        ],
        task_drafts: [
          {
            title_template: 'Document ICP in sales playbook',
            units: 1,
            assignee_hint: 'founder',
            due_offset_days: 7,
          },
        ],
      },
      gating_rules: {
        min_evidence_count: 1,
        allow_skip: false,
      },
      is_required: true,
    },
    {
      step_key: 'define_pain_why_now',
      title: 'Define Pain + Why Now',
      description_short: 'List top 3 customer pains and explain the timing trigger.',
      description_long:
        'Rank customer pains by severity. Identify why this is urgent now—what changed in the market or technology?',
      order_index: 1,
      required_inputs: [
        {
          key: 'transcript',
          type: 'textarea',
          label: 'What are the top pains and why now?',
          placeholder: 'Pain 1: ... Pain 2: ... Pain 3: ... The timing is right because...',
          required: true,
          validation: { min_length: 50 },
        },
      ],
      evidence_requirements: [
        {
          key: 'top_pains',
          label: 'Top 3 pains (ranked)',
          type: 'list',
          min_items: 3,
        },
        {
          key: 'timing_trigger',
          label: 'Why now? (timing trigger)',
          type: 'text',
          min_length: 20,
        },
      ],
      outputs_templates: {
        task_drafts: [
          {
            title_template: 'Validate top pain with 5 ICP discovery calls',
            units: 3,
            assignee_hint: 'founder',
            due_offset_days: 14,
          },
        ],
      },
      gating_rules: {
        requires_step_ids: ['define_icp'],
        min_evidence_count: 2,
        allow_skip: false,
      },
      is_required: true,
    },
    {
      step_key: 'list_20_targets',
      title: 'List 20 Target Customers',
      description_short: 'Create a list of 20 specific companies or people to reach out to.',
      description_long:
        'Name real companies or people. This is your initial outbound list. Quality over quantity.',
      order_index: 2,
      required_inputs: [
        {
          key: 'transcript',
          type: 'textarea',
          label: 'List your target customers',
          placeholder: '1. Company A - Contact Name\n2. Company B - Contact Name\n...',
          required: true,
          validation: { min_length: 100 },
        },
      ],
      evidence_requirements: [
        {
          key: 'target_list',
          label: 'List of 20 target customers',
          type: 'list',
          min_items: 20,
        },
      ],
      outputs_templates: {
        task_drafts: [
          {
            title_template: 'Outreach to target #1: {{target_1}}',
            units: 1,
            assignee_hint: 'founder',
            due_offset_days: 3,
          },
          {
            title_template: 'Outreach to target #2: {{target_2}}',
            units: 1,
            assignee_hint: 'founder',
            due_offset_days: 3,
          },
          {
            title_template: 'Outreach to target #3: {{target_3}}',
            units: 1,
            assignee_hint: 'founder',
            due_offset_days: 4,
          },
          {
            title_template: 'Outreach to target #4: {{target_4}}',
            units: 1,
            assignee_hint: 'founder',
            due_offset_days: 4,
          },
          {
            title_template: 'Outreach to target #5: {{target_5}}',
            units: 1,
            assignee_hint: 'founder',
            due_offset_days: 5,
          },
        ],
      },
      gating_rules: {
        requires_step_ids: ['define_pain_why_now'],
        min_evidence_count: 1,
        allow_skip: true,
      },
      is_required: true,
    },
  ],

  // -------------------------------------------------------------------------
  // MODULE C: PRODUCT
  // -------------------------------------------------------------------------
  product: [
    {
      step_key: 'mvp_definition',
      title: 'MVP Definition',
      description_short: 'Define what "shipping" means for your MVP.',
      description_long:
        'What is the minimum you can build that delivers value? Be ruthless about scope.',
      order_index: 0,
      required_inputs: [
        {
          key: 'transcript',
          type: 'textarea',
          label: 'Describe your MVP',
          placeholder: 'Our MVP will include... We will NOT include... Shipping means...',
          required: true,
          validation: { min_length: 50 },
        },
      ],
      evidence_requirements: [
        {
          key: 'mvp_scope',
          label: 'MVP scope (what shipping means)',
          type: 'text',
          min_length: 30,
        },
      ],
      outputs_templates: {
        objectives: [
          {
            title_template: 'Ship MVP',
            description_template: 'Deliver minimum viable product to first customers.',
            category: 'product',
          },
        ],
      },
      gating_rules: {
        min_evidence_count: 1,
        allow_skip: false,
      },
      is_required: true,
    },
    {
      step_key: 'validation_plan',
      title: 'Validation Plan',
      description_short: 'Define 5 validation experiments with pass/fail criteria.',
      description_long:
        'How will you know if your product is working? Design experiments that give you clear answers.',
      order_index: 1,
      required_inputs: [
        {
          key: 'transcript',
          type: 'textarea',
          label: 'List your validation experiments',
          placeholder: 'Experiment 1: We will test [X] by [method]. Pass if [criteria]...',
          required: true,
          validation: { min_length: 100 },
        },
      ],
      evidence_requirements: [
        {
          key: 'validation_tests',
          label: '5 validation tests with pass/fail criteria',
          type: 'list',
          min_items: 5,
        },
      ],
      outputs_templates: {
        task_drafts: [
          {
            title_template: 'Run validation experiment #1',
            units: 2,
            assignee_hint: 'founder',
            due_offset_days: 7,
          },
          {
            title_template: 'Run validation experiment #2',
            units: 2,
            assignee_hint: 'founder',
            due_offset_days: 14,
          },
          {
            title_template: 'Run validation experiment #3',
            units: 2,
            assignee_hint: 'founder',
            due_offset_days: 21,
          },
          {
            title_template: 'Run validation experiment #4',
            units: 2,
            assignee_hint: 'founder',
            due_offset_days: 28,
          },
          {
            title_template: 'Run validation experiment #5',
            units: 2,
            assignee_hint: 'founder',
            due_offset_days: 35,
          },
        ],
      },
      gating_rules: {
        requires_step_ids: ['mvp_definition'],
        min_evidence_count: 1,
        allow_skip: false,
      },
      is_required: true,
    },
    {
      step_key: 'prototype_plan',
      title: 'Prototype Plan',
      description_short: 'Outline key prototype milestones and deliverables.',
      description_long:
        'For hardware startups: what physical prototypes do you need? For software: what demos or mockups?',
      order_index: 2,
      required_inputs: [
        {
          key: 'transcript',
          type: 'textarea',
          label: 'Describe your prototype milestones',
          placeholder: 'Milestone 1: [Date] - [Deliverable]...',
          required: true,
          validation: { min_length: 50 },
        },
      ],
      evidence_requirements: [
        {
          key: 'prototype_milestones',
          label: 'Key prototype milestones',
          type: 'list',
          min_items: 2,
        },
      ],
      outputs_templates: {
        task_drafts: [
          {
            title_template: 'Complete prototype milestone #1',
            units: 3,
            assignee_hint: 'founder',
            due_offset_days: 14,
          },
          {
            title_template: 'Complete prototype milestone #2',
            units: 3,
            assignee_hint: 'founder',
            due_offset_days: 28,
          },
        ],
      },
      gating_rules: {
        requires_step_ids: ['validation_plan'],
        min_evidence_count: 1,
        allow_skip: true,
      },
      is_required: false,
    },
  ],

  // -------------------------------------------------------------------------
  // MODULE D: GO-TO-MARKET
  // -------------------------------------------------------------------------
  go_to_market: [
    {
      step_key: 'channel_hypothesis',
      title: 'Channel Hypothesis',
      description_short: 'Identify 2 go-to-market channels with rationale.',
      description_long:
        'Where will you find your first customers? Pick 2 channels and explain why they are right for your ICP.',
      order_index: 0,
      required_inputs: [
        {
          key: 'transcript',
          type: 'textarea',
          label: 'Describe your channel strategy',
          placeholder: 'Channel 1: [Name] because... Channel 2: [Name] because...',
          required: true,
          validation: { min_length: 50 },
        },
      ],
      evidence_requirements: [
        {
          key: 'channels',
          label: '2 GTM channels with rationale',
          type: 'list',
          min_items: 2,
        },
      ],
      outputs_templates: {
        objectives: [
          {
            title_template: 'Validate GTM channels',
            description_template: 'Test channel hypotheses and measure CAC/conversion.',
            category: 'growth',
          },
        ],
      },
      gating_rules: {
        min_evidence_count: 1,
        allow_skip: false,
      },
      is_required: true,
    },
    {
      step_key: 'outreach_plan',
      title: 'Outreach Plan',
      description_short: 'Prepare 10 outreach messages (cold email/LinkedIn).',
      description_long:
        'Write actual messages you will send. Personalize for your ICP.',
      order_index: 1,
      required_inputs: [
        {
          key: 'transcript',
          type: 'textarea',
          label: 'Share your outreach messages',
          placeholder: 'Message 1: Subject line + body...',
          required: true,
          validation: { min_length: 200 },
        },
      ],
      evidence_requirements: [
        {
          key: 'outreach_messages',
          label: '10 prepared outreach messages',
          type: 'list',
          min_items: 10,
        },
      ],
      outputs_templates: {
        task_drafts: [
          { title_template: 'Send outreach batch 1 (messages 1-5)', units: 2, assignee_hint: 'founder', due_offset_days: 3 },
          { title_template: 'Send outreach batch 2 (messages 6-10)', units: 2, assignee_hint: 'founder', due_offset_days: 7 },
        ],
      },
      gating_rules: {
        requires_step_ids: ['channel_hypothesis'],
        min_evidence_count: 1,
        allow_skip: false,
      },
      is_required: true,
    },
    {
      step_key: 'pipeline_tracking_setup',
      title: 'Pipeline Tracking Setup',
      description_short: 'Set up CRM or spreadsheet to track leads.',
      description_long:
        'You need a system to track who you reached out to and their status. Can be as simple as a spreadsheet.',
      order_index: 2,
      required_inputs: [
        {
          key: 'pipeline_link',
          type: 'text',
          label: 'Link to your pipeline tracker',
          placeholder: 'https://airtable.com/... or Notion link',
          required: true,
        },
      ],
      evidence_requirements: [
        {
          key: 'pipeline_system',
          label: 'CRM/sheet link or system name',
          type: 'link',
        },
      ],
      outputs_templates: {
        task_drafts: [
          { title_template: 'Review pipeline weekly', units: 1, assignee_hint: 'founder', due_offset_days: 7 },
        ],
      },
      gating_rules: {
        requires_step_ids: ['outreach_plan'],
        min_evidence_count: 1,
        allow_skip: true,
      },
      is_required: true,
    },
  ],

  // -------------------------------------------------------------------------
  // MODULE E: FINANCE
  // -------------------------------------------------------------------------
  finance: [
    {
      step_key: 'runway_burn_baseline',
      title: 'Runway + Burn Baseline',
      description_short: 'Calculate your monthly burn and runway in months.',
      description_long:
        'How much are you spending per month? How many months can you survive? This is critical for planning.',
      order_index: 0,
      required_inputs: [
        {
          key: 'transcript',
          type: 'textarea',
          label: 'Describe your financial situation',
          placeholder: 'Monthly burn: £X. Current runway: Y months. Major expenses: ...',
          required: true,
          validation: { min_length: 30 },
        },
      ],
      evidence_requirements: [
        {
          key: 'monthly_burn',
          label: 'Monthly burn estimate',
          type: 'text',
          min_length: 5,
        },
        {
          key: 'runway_months',
          label: 'Runway in months',
          type: 'text',
          min_length: 1,
        },
      ],
      outputs_templates: {
        objectives: [
          {
            title_template: 'Manage runway',
            description_template: 'Maintain visibility on burn rate and extend runway as needed.',
            category: 'financial',
          },
        ],
        task_drafts: [
          { title_template: 'Set up monthly burn tracking spreadsheet', units: 1, assignee_hint: 'founder', due_offset_days: 7 },
        ],
      },
      gating_rules: {
        min_evidence_count: 2,
        allow_skip: false,
      },
      is_required: true,
    },
    {
      step_key: 'funding_plan',
      title: 'Funding Plan',
      description_short: 'Identify 3 potential funding sources with timeline.',
      description_long:
        'Who will you raise from? VCs, angels, grants, revenue? Create a prioritized list.',
      order_index: 1,
      required_inputs: [
        {
          key: 'transcript',
          type: 'textarea',
          label: 'Describe your funding strategy',
          placeholder: 'Source 1: [Name] - [Amount target] by [Date]...',
          required: true,
          validation: { min_length: 50 },
        },
      ],
      evidence_requirements: [
        {
          key: 'funding_sources',
          label: '3 target funders + timeline',
          type: 'list',
          min_items: 3,
        },
      ],
      outputs_templates: {
        task_drafts: [
          { title_template: 'Research funding source #1', units: 2, assignee_hint: 'founder', due_offset_days: 7 },
          { title_template: 'Prepare pitch for funding source #1', units: 3, assignee_hint: 'founder', due_offset_days: 14 },
        ],
      },
      gating_rules: {
        requires_step_ids: ['runway_burn_baseline'],
        min_evidence_count: 1,
        allow_skip: true,
      },
      stage_applicability: {
        finance_stages: ['F0', 'F1'], // Skip for F2+ (already funded)
      },
      is_required: false,
    },
    {
      step_key: 'reporting_cadence',
      title: 'Reporting Cadence',
      description_short: 'Define your weekly KPIs (3-5 metrics).',
      description_long:
        'What numbers will you review every week? Pick 3-5 metrics that matter.',
      order_index: 2,
      required_inputs: [
        {
          key: 'transcript',
          type: 'textarea',
          label: 'List your weekly KPIs',
          placeholder: 'KPI 1: [Name] - [How measured]\nKPI 2: ...',
          required: true,
          validation: { min_length: 50 },
        },
      ],
      evidence_requirements: [
        {
          key: 'weekly_kpis',
          label: 'Weekly KPI list (3-5 metrics)',
          type: 'list',
          min_items: 3,
        },
      ],
      outputs_templates: {
        task_drafts: [
          { title_template: 'Schedule weekly KPI review ritual', units: 1, assignee_hint: 'founder', due_offset_days: 3 },
          { title_template: 'Create KPI dashboard', units: 2, assignee_hint: 'apprentice', due_offset_days: 7 },
        ],
      },
      gating_rules: {
        requires_step_ids: ['runway_burn_baseline'],
        min_evidence_count: 1,
        allow_skip: false,
      },
      is_required: true,
    },
  ],

  // -------------------------------------------------------------------------
  // MODULE F: PEOPLE
  // -------------------------------------------------------------------------
  people: [
    {
      step_key: 'role_gaps',
      title: 'Role Gaps',
      description_short: 'Identify the top 2 missing roles or capabilities.',
      description_long:
        'What can you not do yourself? What expertise is blocking progress?',
      order_index: 0,
      required_inputs: [
        {
          key: 'transcript',
          type: 'textarea',
          label: 'Describe your biggest gaps',
          placeholder: 'Gap 1: We need someone who can... Gap 2: We lack expertise in...',
          required: true,
          validation: { min_length: 50 },
        },
      ],
      evidence_requirements: [
        {
          key: 'top_gaps',
          label: 'Top 2 role/capability gaps',
          type: 'list',
          min_items: 2,
        },
      ],
      outputs_templates: {
        objectives: [
          {
            title_template: 'Fill critical role gaps',
            description_template: 'Hire or engage fractional talent for key missing capabilities.',
            category: 'team',
          },
        ],
      },
      gating_rules: {
        min_evidence_count: 1,
        allow_skip: false,
      },
      is_required: true,
    },
    {
      step_key: 'find_candidates',
      title: 'Find Candidates',
      description_short: 'Create a shortlist of potential hires or fractional execs.',
      description_long:
        'For each gap, list at least 3 potential candidates. Use your network, LinkedIn, or the People Marketplace.',
      order_index: 1,
      required_inputs: [
        {
          key: 'transcript',
          type: 'textarea',
          label: 'List your candidate shortlist',
          placeholder: 'For [Gap 1]: 1. [Name] - [Why]...',
          required: true,
          validation: { min_length: 50 },
        },
      ],
      evidence_requirements: [
        {
          key: 'candidate_shortlist',
          label: 'Shortlist (3+ people per role)',
          type: 'list',
          min_items: 3,
        },
      ],
      outputs_templates: {
        task_drafts: [
          { title_template: 'Reach out to candidate #1', units: 1, assignee_hint: 'founder', due_offset_days: 3 },
          { title_template: 'Reach out to candidate #2', units: 1, assignee_hint: 'founder', due_offset_days: 3 },
          { title_template: 'Reach out to candidate #3', units: 1, assignee_hint: 'founder', due_offset_days: 4 },
        ],
      },
      gating_rules: {
        requires_step_ids: ['role_gaps'],
        min_evidence_count: 1,
        allow_skip: true,
      },
      is_required: true,
    },
    {
      step_key: 'interview_plan',
      title: 'Interview Plan',
      description_short: 'Create an interview scorecard with criteria.',
      description_long:
        'How will you evaluate candidates? Define 5-7 criteria with weights.',
      order_index: 2,
      required_inputs: [
        {
          key: 'transcript',
          type: 'textarea',
          label: 'Describe your interview criteria',
          placeholder: 'Criteria 1: [Name] - Weight [1-5] - How to evaluate...',
          required: true,
          validation: { min_length: 50 },
        },
      ],
      evidence_requirements: [
        {
          key: 'scorecard_criteria',
          label: 'Interview scorecard criteria',
          type: 'list',
          min_items: 5,
        },
      ],
      outputs_templates: {
        task_drafts: [
          { title_template: 'Create interview scorecard document', units: 1, assignee_hint: 'founder', due_offset_days: 5 },
        ],
      },
      gating_rules: {
        requires_step_ids: ['find_candidates'],
        min_evidence_count: 1,
        allow_skip: true,
      },
      is_required: false,
    },
  ],

  // -------------------------------------------------------------------------
  // MODULE G: OPERATIONS
  // -------------------------------------------------------------------------
  ops: [
    {
      step_key: 'weekly_cadence',
      title: 'Weekly Cadence',
      description_short: 'Define your weekly planning and review ritual.',
      description_long:
        'When do you plan the week? When do you review progress? Block time on your calendar.',
      order_index: 0,
      required_inputs: [
        {
          key: 'transcript',
          type: 'textarea',
          label: 'Describe your weekly ritual',
          placeholder: 'Monday: [Time] - Weekly planning. Friday: [Time] - Week review...',
          required: true,
          validation: { min_length: 30 },
        },
      ],
      evidence_requirements: [
        {
          key: 'weekly_ritual',
          label: 'Weekly planning ritual description',
          type: 'text',
          min_length: 20,
        },
      ],
      outputs_templates: {
        task_drafts: [
          { title_template: 'Schedule recurring weekly planning meeting', units: 1, assignee_hint: 'founder', due_offset_days: 3 },
        ],
      },
      gating_rules: {
        min_evidence_count: 1,
        allow_skip: false,
      },
      is_required: true,
    },
    {
      step_key: 'task_ownership_rules',
      title: 'Task Ownership Rules',
      description_short: 'Define RACI-lite: who owns what.',
      description_long:
        'For key areas, who is Responsible and who is Accountable? Keep it simple.',
      order_index: 1,
      required_inputs: [
        {
          key: 'transcript',
          type: 'textarea',
          label: 'Define ownership areas',
          placeholder: 'Product: [Owner]. Sales: [Owner]. Finance: [Owner]...',
          required: true,
          validation: { min_length: 30 },
        },
      ],
      evidence_requirements: [
        {
          key: 'ownership_rules',
          label: 'RACI-lite (who owns what)',
          type: 'list',
          min_items: 3,
        },
      ],
      outputs_templates: {
        objectives: [
          {
            title_template: 'Establish clear task ownership',
            description_template: 'Document and communicate area ownership to team.',
            category: 'operations',
          },
        ],
      },
      gating_rules: {
        requires_step_ids: ['weekly_cadence'],
        min_evidence_count: 1,
        allow_skip: false,
      },
      is_required: true,
    },
    {
      step_key: 'capacity_setup',
      title: 'Capacity Setup',
      description_short: 'Define capacity units per person.',
      description_long:
        'How many time units (TU) does each person have per week? This enables capacity planning.',
      order_index: 2,
      required_inputs: [
        {
          key: 'transcript',
          type: 'textarea',
          label: 'Define capacity per person',
          placeholder: '[Name]: [X] TU/week. [Name]: [Y] TU/week...',
          required: true,
          validation: { min_length: 20 },
        },
      ],
      evidence_requirements: [
        {
          key: 'capacity_units',
          label: 'Capacity units per person',
          type: 'list',
          min_items: 1,
        },
      ],
      outputs_templates: {
        task_drafts: [
          { title_template: 'Configure team capacity in CursorOS', units: 1, assignee_hint: 'founder', due_offset_days: 3 },
        ],
      },
      gating_rules: {
        requires_step_ids: ['task_ownership_rules'],
        min_evidence_count: 1,
        allow_skip: true,
      },
      is_required: true,
    },
  ],
};

// =============================================================================
// HELPER: Get all steps flattened
// =============================================================================

export function getAllSteps(): { module_key: ModuleKey; step: StepDef }[] {
  const result: { module_key: ModuleKey; step: StepDef }[] = [];
  for (const [module_key, steps] of Object.entries(STEPS_BY_MODULE)) {
    for (const step of steps) {
      result.push({ module_key: module_key as ModuleKey, step });
    }
  }
  return result;
}

// =============================================================================
// HELPER: Get step by key
// =============================================================================

export function getStepByKey(
  module_key: ModuleKey,
  step_key: string
): StepDef | undefined {
  return STEPS_BY_MODULE[module_key]?.find((s) => s.step_key === step_key);
}
