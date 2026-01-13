/**
 * Integration Types and Data
 * Marketplace for third-party integrations
 */

export type IntegrationCategory =
  | 'Communication'
  | 'Development'
  | 'Project Management'
  | 'Design'
  | 'Analytics'
  | 'AI Tools'
  | 'Finance'
  | 'HR';

export type IntegrationStatus = 'available' | 'connected' | 'coming-soon';

export interface Integration {
  id: string;
  name: string;
  description: string;
  category: IntegrationCategory;
  icon: string; // URL or emoji
  color: string;
  status: IntegrationStatus;
  features: string[];
  pricing: 'free' | 'paid' | 'freemium';
  website: string;
  setupInstructions?: string;
  requiredFields?: {
    name: string;
    type: 'text' | 'password' | 'url' | 'select';
    placeholder: string;
    required: boolean;
    options?: string[];
  }[];
}

export interface ConnectedIntegration extends Integration {
  connectedAt: Date;
  config: Record<string, string>;
  lastSyncAt?: Date;
  syncStatus: 'active' | 'error' | 'paused';
}

// Integration Catalog
export const INTEGRATIONS: Integration[] = [
  // Communication
  {
    id: 'slack',
    name: 'Slack',
    description: 'Send notifications and updates to Slack channels when tasks are completed, OKRs are updated, or approvals are needed.',
    category: 'Communication',
    icon: '💬',
    color: '#4A154B',
    status: 'available',
    features: [
      'Task completion notifications',
      'OKR update alerts',
      'Approval requests',
      'Daily digest messages',
      'Custom channel routing',
    ],
    pricing: 'free',
    website: 'https://slack.com',
    requiredFields: [
      {
        name: 'webhook_url',
        type: 'url',
        placeholder: 'https://hooks.slack.com/services/...',
        required: true,
      },
      {
        name: 'default_channel',
        type: 'text',
        placeholder: '#general',
        required: false,
      },
    ],
  },
  {
    id: 'teams',
    name: 'Microsoft Teams',
    description: 'Integrate with Microsoft Teams to send notifications and collaborate with your team.',
    category: 'Communication',
    icon: '🟦',
    color: '#5558AF',
    status: 'available',
    features: [
      'Channel notifications',
      'Task mentions',
      'Meeting scheduling',
      'File sharing',
    ],
    pricing: 'free',
    website: 'https://teams.microsoft.com',
    requiredFields: [
      {
        name: 'webhook_url',
        type: 'url',
        placeholder: 'https://outlook.office.com/webhook/...',
        required: true,
      },
    ],
  },
  // Development
  {
    id: 'github',
    name: 'GitHub',
    description: 'Link work plans to GitHub issues and PRs. Automatically update task status based on commit activity.',
    category: 'Development',
    icon: '🐙',
    color: '#181717',
    status: 'available',
    features: [
      'Link tasks to issues/PRs',
      'Auto-update from commits',
      'PR review notifications',
      'Deployment tracking',
      'Code review metrics',
    ],
    pricing: 'free',
    website: 'https://github.com',
    requiredFields: [
      {
        name: 'access_token',
        type: 'password',
        placeholder: 'ghp_...',
        required: true,
      },
      {
        name: 'organization',
        type: 'text',
        placeholder: 'your-org',
        required: true,
      },
      {
        name: 'repository',
        type: 'text',
        placeholder: 'your-repo',
        required: false,
      },
    ],
  },
  {
    id: 'gitlab',
    name: 'GitLab',
    description: 'Sync work plans with GitLab issues and merge requests for engineering teams.',
    category: 'Development',
    icon: '🦊',
    color: '#FC6D26',
    status: 'available',
    features: [
      'Issue synchronization',
      'MR tracking',
      'Pipeline status updates',
      'Time tracking integration',
    ],
    pricing: 'free',
    website: 'https://gitlab.com',
    requiredFields: [
      {
        name: 'access_token',
        type: 'password',
        placeholder: 'glpat-...',
        required: true,
      },
      {
        name: 'project_id',
        type: 'text',
        placeholder: '12345',
        required: true,
      },
    ],
  },
  // Project Management
  {
    id: 'linear',
    name: 'Linear',
    description: 'Two-way sync between CentaurOS work plans and Linear issues for seamless project tracking.',
    category: 'Project Management',
    icon: '⚡',
    color: '#5E6AD2',
    status: 'available',
    features: [
      'Bi-directional sync',
      'Automatic status updates',
      'Priority mapping',
      'Label synchronization',
    ],
    pricing: 'free',
    website: 'https://linear.app',
    requiredFields: [
      {
        name: 'api_key',
        type: 'password',
        placeholder: 'lin_api_...',
        required: true,
      },
      {
        name: 'team_id',
        type: 'text',
        placeholder: 'TEAM-123',
        required: true,
      },
    ],
  },
  {
    id: 'asana',
    name: 'Asana',
    description: 'Import tasks from Asana projects and keep them synchronized with your work plans.',
    category: 'Project Management',
    icon: '🎯',
    color: '#F06A6A',
    status: 'coming-soon',
    features: [
      'Task import',
      'Status synchronization',
      'Assignee mapping',
      'Due date sync',
    ],
    pricing: 'free',
    website: 'https://asana.com',
  },
  // Design
  {
    id: 'figma',
    name: 'Figma',
    description: 'Link design files to work plans and track design review status directly in CentaurOS.',
    category: 'Design',
    icon: '🎨',
    color: '#F24E1E',
    status: 'available',
    features: [
      'Design file linking',
      'Comment notifications',
      'Version tracking',
      'Review workflows',
    ],
    pricing: 'free',
    website: 'https://figma.com',
    requiredFields: [
      {
        name: 'access_token',
        type: 'password',
        placeholder: 'figd_...',
        required: true,
      },
    ],
  },
  // Analytics
  {
    id: 'google-analytics',
    name: 'Google Analytics',
    description: 'Track product metrics and connect them to your OKRs for data-driven decision making.',
    category: 'Analytics',
    icon: '📊',
    color: '#E37400',
    status: 'coming-soon',
    features: [
      'Metric tracking',
      'OKR data sync',
      'Custom dashboards',
      'Goal tracking',
    ],
    pricing: 'free',
    website: 'https://analytics.google.com',
  },
  {
    id: 'mixpanel',
    name: 'Mixpanel',
    description: 'Connect product analytics to your OKRs and track user behavior metrics.',
    category: 'Analytics',
    icon: '📈',
    color: '#7856FF',
    status: 'coming-soon',
    features: [
      'Event tracking',
      'Funnel analysis',
      'Cohort reports',
      'OKR metric sync',
    ],
    pricing: 'freemium',
    website: 'https://mixpanel.com',
  },
  // AI Tools
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'Use GPT-4 to generate work plan templates, draft OKRs, and get intelligent suggestions.',
    category: 'AI Tools',
    icon: '🤖',
    color: '#10A37F',
    status: 'available',
    features: [
      'Template generation',
      'OKR drafting',
      'Task breakdown',
      'Writing assistance',
    ],
    pricing: 'paid',
    website: 'https://openai.com',
    requiredFields: [
      {
        name: 'api_key',
        type: 'password',
        placeholder: 'sk-...',
        required: true,
      },
      {
        name: 'model',
        type: 'select',
        placeholder: 'gpt-4',
        required: true,
        options: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
      },
    ],
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    description: 'Leverage Claude for in-depth analysis, strategic planning, and document review.',
    category: 'AI Tools',
    icon: '🧠',
    color: '#D97757',
    status: 'available',
    features: [
      'Strategic analysis',
      'Document review',
      'Planning assistance',
      'Context-aware suggestions',
    ],
    pricing: 'paid',
    website: 'https://anthropic.com',
    requiredFields: [
      {
        name: 'api_key',
        type: 'password',
        placeholder: 'sk-ant-...',
        required: true,
      },
    ],
  },
  // Finance
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Track revenue metrics and connect them to your financial OKRs.',
    category: 'Finance',
    icon: '💳',
    color: '#635BFF',
    status: 'coming-soon',
    features: [
      'Revenue tracking',
      'MRR/ARR metrics',
      'Customer analytics',
      'Financial OKR sync',
    ],
    pricing: 'free',
    website: 'https://stripe.com',
  },
  {
    id: 'quickbooks',
    name: 'QuickBooks',
    description: 'Sync financial data and track budget vs. actual spend for each function.',
    category: 'Finance',
    icon: '💰',
    color: '#2CA01C',
    status: 'coming-soon',
    features: [
      'Expense tracking',
      'Budget monitoring',
      'Invoice management',
      'Financial reports',
    ],
    pricing: 'free',
    website: 'https://quickbooks.intuit.com',
  },
  // HR
  {
    id: 'bamboohr',
    name: 'BambooHR',
    description: 'Import employee data and track team capacity for resource planning.',
    category: 'HR',
    icon: '👥',
    color: '#73C41D',
    status: 'coming-soon',
    features: [
      'Employee directory sync',
      'Time-off tracking',
      'Capacity planning',
      'Org chart sync',
    ],
    pricing: 'free',
    website: 'https://bamboohr.com',
  },
];

// Utility functions
export const getIntegrationsByCategory = (category: IntegrationCategory): Integration[] => {
  return INTEGRATIONS.filter((i) => i.category === category);
};

export const getIntegrationById = (id: string): Integration | undefined => {
  return INTEGRATIONS.find((i) => i.id === id);
};

export const getAvailableIntegrations = (): Integration[] => {
  return INTEGRATIONS.filter((i) => i.status === 'available');
};

export const getComingSoonIntegrations = (): Integration[] => {
  return INTEGRATIONS.filter((i) => i.status === 'coming-soon');
};

export const getAllCategories = (): IntegrationCategory[] => {
  const categories = new Set(INTEGRATIONS.map((i) => i.category));
  return Array.from(categories);
};
