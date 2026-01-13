/**
 * Work Plan Templates
 * Pre-built templates for different business functions
 */

export type BusinessFunction =
  | 'Marketing'
  | 'Engineering'
  | 'Sales'
  | 'Product'
  | 'Operations'
  | 'Finance'
  | 'HR'
  | 'Design';

export interface WorkPlanTemplate {
  id: string;
  name: string;
  function: BusinessFunction;
  description: string;
  estimatedDuration: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  tasks: {
    title: string;
    description: string;
    estimatedHours: number;
    skills: string[];
    order: number;
  }[];
  deliverables: string[];
  aiToolsSuggested: string[];
  tags: string[];
}

export const MARKETING_TEMPLATES: WorkPlanTemplate[] = [
  {
    id: 'mkt-social-campaign',
    name: 'Social Media Campaign',
    function: 'Marketing',
    description: 'Launch a comprehensive social media campaign across platforms with content calendar, visuals, and analytics',
    estimatedDuration: '2 weeks',
    difficulty: 'Intermediate',
    tasks: [
      {
        title: 'Content Calendar Creation',
        description: 'Plan 2 weeks of daily posts across Instagram, LinkedIn, Twitter with strategic themes and timing',
        estimatedHours: 8,
        skills: ['Content Strategy', 'Social Media Marketing'],
        order: 1,
      },
      {
        title: 'Visual Asset Creation',
        description: 'Design graphics, carousels, and short-form videos for all planned posts using brand guidelines',
        estimatedHours: 16,
        skills: ['Graphic Design', 'Video Editing', 'Canva'],
        order: 2,
      },
      {
        title: 'Copywriting & CTAs',
        description: 'Write engaging captions with clear calls-to-action optimized for each platform',
        estimatedHours: 6,
        skills: ['Copywriting', 'Marketing'],
        order: 3,
      },
      {
        title: 'Schedule & Launch',
        description: 'Upload content to scheduling tool, set optimal post times, and launch campaign',
        estimatedHours: 4,
        skills: ['Social Media Tools', 'Project Management'],
        order: 4,
      },
      {
        title: 'Monitor & Report',
        description: 'Track engagement metrics daily and create end-of-campaign performance report',
        estimatedHours: 6,
        skills: ['Analytics', 'Reporting'],
        order: 5,
      },
    ],
    deliverables: [
      '14-day content calendar',
      '28+ social media posts',
      'Engagement analytics report',
      'Recommendations for next campaign',
    ],
    aiToolsSuggested: ['ChatGPT for copywriting', 'Midjourney for graphics', 'Buffer for scheduling'],
    tags: ['Social Media', 'Content Marketing', 'Brand Awareness'],
  },
  {
    id: 'mkt-email-sequence',
    name: 'Email Nurture Sequence',
    function: 'Marketing',
    description: 'Build an automated email nurture sequence to convert leads into customers',
    estimatedDuration: '1 week',
    difficulty: 'Beginner',
    tasks: [
      {
        title: 'Define Audience & Goals',
        description: 'Identify target audience segments and conversion goals for the sequence',
        estimatedHours: 3,
        skills: ['Marketing Strategy', 'Customer Research'],
        order: 1,
      },
      {
        title: 'Email Copywriting',
        description: 'Write 5 emails with compelling subject lines, body copy, and CTAs',
        estimatedHours: 8,
        skills: ['Email Marketing', 'Copywriting'],
        order: 2,
      },
      {
        title: 'Email Design',
        description: 'Design responsive email templates that match brand guidelines',
        estimatedHours: 6,
        skills: ['Email Design', 'HTML/CSS'],
        order: 3,
      },
      {
        title: 'Setup Automation',
        description: 'Configure email automation in Mailchimp/HubSpot with triggers and timing',
        estimatedHours: 4,
        skills: ['Marketing Automation', 'Technical Setup'],
        order: 4,
      },
      {
        title: 'Test & Launch',
        description: 'Send test emails, check rendering across devices, and activate sequence',
        estimatedHours: 3,
        skills: ['QA Testing', 'Project Management'],
        order: 5,
      },
    ],
    deliverables: [
      '5-email nurture sequence',
      'Responsive email templates',
      'Automated workflow in ESP',
      'Testing report',
    ],
    aiToolsSuggested: ['ChatGPT for email copy', 'Jasper for subject lines'],
    tags: ['Email Marketing', 'Lead Nurture', 'Automation'],
  },
];

export const ENGINEERING_TEMPLATES: WorkPlanTemplate[] = [
  {
    id: 'eng-api-endpoint',
    name: 'REST API Endpoint Development',
    function: 'Engineering',
    description: 'Design, develop, test, and deploy a new REST API endpoint with documentation',
    estimatedDuration: '1 week',
    difficulty: 'Intermediate',
    tasks: [
      {
        title: 'API Design & Spec',
        description: 'Design endpoint schema, request/response structure, and error handling',
        estimatedHours: 4,
        skills: ['API Design', 'System Architecture'],
        order: 1,
      },
      {
        title: 'Database Schema',
        description: 'Create or modify database tables, indexes, and migrations',
        estimatedHours: 3,
        skills: ['Database Design', 'SQL'],
        order: 2,
      },
      {
        title: 'Backend Implementation',
        description: 'Write controller, service layer, validation, and error handling logic',
        estimatedHours: 12,
        skills: ['Backend Development', 'Node.js/Python'],
        order: 3,
      },
      {
        title: 'Unit & Integration Tests',
        description: 'Write comprehensive tests covering happy path and edge cases',
        estimatedHours: 6,
        skills: ['Testing', 'Jest/Pytest'],
        order: 4,
      },
      {
        title: 'Documentation',
        description: 'Write API documentation with examples, parameters, and response codes',
        estimatedHours: 3,
        skills: ['Technical Writing', 'OpenAPI'],
        order: 5,
      },
      {
        title: 'Code Review & Deploy',
        description: 'Submit PR, address review comments, merge, and deploy to production',
        estimatedHours: 4,
        skills: ['Git', 'CI/CD', 'DevOps'],
        order: 6,
      },
    ],
    deliverables: [
      'Production API endpoint',
      'Test suite with 90%+ coverage',
      'API documentation',
      'Deployment logs',
    ],
    aiToolsSuggested: ['GitHub Copilot for code', 'ChatGPT for documentation'],
    tags: ['Backend', 'API Development', 'Testing'],
  },
  {
    id: 'eng-feature-implementation',
    name: 'Full-Stack Feature Implementation',
    function: 'Engineering',
    description: 'Build a complete feature with frontend UI, backend logic, and database changes',
    estimatedDuration: '2 weeks',
    difficulty: 'Advanced',
    tasks: [
      {
        title: 'Requirements & Technical Design',
        description: 'Review requirements, design architecture, and create technical specification',
        estimatedHours: 6,
        skills: ['System Design', 'Architecture'],
        order: 1,
      },
      {
        title: 'Database Schema Design',
        description: 'Design database tables, relationships, indexes, and write migrations',
        estimatedHours: 4,
        skills: ['Database Design', 'SQL'],
        order: 2,
      },
      {
        title: 'Backend API Development',
        description: 'Build API endpoints, business logic, validation, and error handling',
        estimatedHours: 16,
        skills: ['Backend Development', 'API Design'],
        order: 3,
      },
      {
        title: 'Frontend UI Implementation',
        description: 'Build responsive UI components, forms, and state management',
        estimatedHours: 16,
        skills: ['Frontend Development', 'React/Vue'],
        order: 4,
      },
      {
        title: 'Integration & Testing',
        description: 'Connect frontend to backend, write unit and integration tests',
        estimatedHours: 10,
        skills: ['Testing', 'Debugging'],
        order: 5,
      },
      {
        title: 'Code Review & Deployment',
        description: 'Submit PR, address feedback, merge, and deploy with monitoring',
        estimatedHours: 6,
        skills: ['Git', 'CI/CD', 'Monitoring'],
        order: 6,
      },
    ],
    deliverables: [
      'Production-ready feature',
      'Comprehensive test suite',
      'Technical documentation',
      'Deployment runbook',
    ],
    aiToolsSuggested: ['GitHub Copilot', 'Cursor AI', 'ChatGPT'],
    tags: ['Full-Stack', 'Feature Development', 'Production'],
  },
];

export const SALES_TEMPLATES: WorkPlanTemplate[] = [
  {
    id: 'sales-outreach-campaign',
    name: 'Cold Outreach Campaign',
    function: 'Sales',
    description: 'Execute a targeted cold outreach campaign to generate qualified leads',
    estimatedDuration: '2 weeks',
    difficulty: 'Intermediate',
    tasks: [
      {
        title: 'Build Target List',
        description: 'Research and compile list of 100 target prospects with contact information',
        estimatedHours: 8,
        skills: ['Lead Research', 'LinkedIn Sales Navigator'],
        order: 1,
      },
      {
        title: 'Craft Outreach Messages',
        description: 'Write personalized email and LinkedIn message templates',
        estimatedHours: 6,
        skills: ['Sales Copywriting', 'Value Proposition'],
        order: 2,
      },
      {
        title: 'Setup Outreach Cadence',
        description: 'Configure multi-touch sequence in outreach tool (email + LinkedIn + phone)',
        estimatedHours: 4,
        skills: ['Sales Tools', 'Outreach.io/Apollo'],
        order: 3,
      },
      {
        title: 'Execute Campaign',
        description: 'Launch campaign, personalize messages, and respond to replies daily',
        estimatedHours: 20,
        skills: ['Sales Execution', 'Relationship Building'],
        order: 4,
      },
      {
        title: 'Qualify & Book Meetings',
        description: 'Qualify interested leads and schedule discovery calls',
        estimatedHours: 6,
        skills: ['Lead Qualification', 'Calendar Management'],
        order: 5,
      },
      {
        title: 'Campaign Report',
        description: 'Analyze metrics (open rate, reply rate, meetings booked) and document learnings',
        estimatedHours: 3,
        skills: ['Analytics', 'Reporting'],
        order: 6,
      },
    ],
    deliverables: [
      '100-prospect target list',
      '10+ qualified meetings booked',
      'Outreach templates',
      'Campaign performance report',
    ],
    aiToolsSuggested: ['ChatGPT for message personalization', 'Clay for lead enrichment'],
    tags: ['Outbound Sales', 'Lead Generation', 'B2B'],
  },
];

export const PRODUCT_TEMPLATES: WorkPlanTemplate[] = [
  {
    id: 'prod-user-research',
    name: 'User Research Study',
    function: 'Product',
    description: 'Conduct user research interviews to gather insights for product decisions',
    estimatedDuration: '2 weeks',
    difficulty: 'Intermediate',
    tasks: [
      {
        title: 'Define Research Goals',
        description: 'Identify research questions, hypotheses, and success metrics',
        estimatedHours: 3,
        skills: ['Product Strategy', 'Research Planning'],
        order: 1,
      },
      {
        title: 'Recruit Participants',
        description: 'Source and schedule 8-10 user interviews from target segments',
        estimatedHours: 6,
        skills: ['User Recruitment', 'Scheduling'],
        order: 2,
      },
      {
        title: 'Create Interview Guide',
        description: 'Write interview script with open-ended questions and follow-ups',
        estimatedHours: 4,
        skills: ['UX Research', 'Interview Design'],
        order: 3,
      },
      {
        title: 'Conduct Interviews',
        description: 'Run 8-10 user interviews, record sessions, and take detailed notes',
        estimatedHours: 16,
        skills: ['User Interviewing', 'Active Listening'],
        order: 4,
      },
      {
        title: 'Analyze & Synthesize',
        description: 'Review recordings, identify patterns, and extract key insights',
        estimatedHours: 10,
        skills: ['Data Analysis', 'Pattern Recognition'],
        order: 5,
      },
      {
        title: 'Present Findings',
        description: 'Create presentation with insights, quotes, and recommendations',
        estimatedHours: 6,
        skills: ['Presentation', 'Storytelling'],
        order: 6,
      },
    ],
    deliverables: [
      '8-10 completed user interviews',
      'Research insights report',
      'Recommendations presentation',
      'Interview recordings & transcripts',
    ],
    aiToolsSuggested: ['Otter.ai for transcription', 'Dovetail for analysis'],
    tags: ['User Research', 'Product Discovery', 'UX'],
  },
];

export const ALL_TEMPLATES: WorkPlanTemplate[] = [
  ...MARKETING_TEMPLATES,
  ...ENGINEERING_TEMPLATES,
  ...SALES_TEMPLATES,
  ...PRODUCT_TEMPLATES,
];

export const getTemplatesByFunction = (func: BusinessFunction): WorkPlanTemplate[] => {
  return ALL_TEMPLATES.filter((t) => t.function === func);
};

export const getTemplateById = (id: string): WorkPlanTemplate | undefined => {
  return ALL_TEMPLATES.find((t) => t.id === id);
};

export const getTemplatesByDifficulty = (difficulty: WorkPlanTemplate['difficulty']): WorkPlanTemplate[] => {
  return ALL_TEMPLATES.filter((t) => t.difficulty === difficulty);
};
