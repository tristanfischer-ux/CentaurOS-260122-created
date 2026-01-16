/**
 * Task Templates
 * Pre-defined common tasks organized by business function
 * Used in "What" tab when creating new tasks
 */

import type { Function as BusinessFunction } from '@/types';

export interface TaskTemplate {
  id: string;
  title: string;
  description: string;
  function: BusinessFunction;
  estimatedTimeUnits: number;
  tags: string[];
}

// ============================================
// TASK TEMPLATES BY FUNCTION
// ============================================

export const TASK_TEMPLATES: TaskTemplate[] = [
  // MARKETING TASKS
  {
    id: 'mkt-content-calendar',
    title: 'Create Q1 Content Calendar',
    description: 'Plan and schedule content across all channels for next quarter',
    function: 'Marketing',
    estimatedTimeUnits: 8,
    tags: ['content', 'planning', 'quarterly'],
  },
  {
    id: 'mkt-campaign-launch',
    title: 'Launch Product Marketing Campaign',
    description: 'Design and execute multi-channel product launch campaign',
    function: 'Marketing',
    estimatedTimeUnits: 15,
    tags: ['campaign', 'product-launch', 'multi-channel'],
  },
  {
    id: 'mkt-social-media',
    title: 'Social Media Weekly Posts',
    description: 'Create and schedule social media content for the week',
    function: 'Marketing',
    estimatedTimeUnits: 5,
    tags: ['social', 'content', 'weekly'],
  },
  {
    id: 'mkt-email-newsletter',
    title: 'Monthly Email Newsletter',
    description: 'Write, design, and send monthly newsletter to subscribers',
    function: 'Marketing',
    estimatedTimeUnits: 6,
    tags: ['email', 'newsletter', 'monthly'],
  },
  {
    id: 'mkt-analytics-report',
    title: 'Marketing Analytics Report',
    description: 'Analyze campaign performance and generate insights report',
    function: 'Marketing',
    estimatedTimeUnits: 4,
    tags: ['analytics', 'reporting', 'metrics'],
  },

  // SALES TASKS
  {
    id: 'sales-pipeline-review',
    title: 'Weekly Pipeline Review',
    description: 'Review and update sales pipeline, identify bottlenecks',
    function: 'Sales',
    estimatedTimeUnits: 3,
    tags: ['pipeline', 'weekly', 'review'],
  },
  {
    id: 'sales-outreach-campaign',
    title: 'Cold Outreach Campaign',
    description: 'Research prospects and execute personalized outreach campaign',
    function: 'Sales',
    estimatedTimeUnits: 10,
    tags: ['outreach', 'prospecting', 'campaign'],
  },
  {
    id: 'sales-proposal',
    title: 'Create Sales Proposal',
    description: 'Draft comprehensive proposal for enterprise client',
    function: 'Sales',
    estimatedTimeUnits: 8,
    tags: ['proposal', 'enterprise', 'documentation'],
  },
  {
    id: 'sales-crm-cleanup',
    title: 'CRM Data Cleanup',
    description: 'Clean and organize CRM data, remove duplicates, update records',
    function: 'Sales',
    estimatedTimeUnits: 5,
    tags: ['crm', 'data', 'maintenance'],
  },
  {
    id: 'sales-demo-prep',
    title: 'Prepare Product Demo',
    description: 'Customize and rehearse product demo for key prospect',
    function: 'Sales',
    estimatedTimeUnits: 4,
    tags: ['demo', 'presentation', 'prospect'],
  },

  // FINANCE TASKS
  {
    id: 'fin-monthly-close',
    title: 'Monthly Financial Close',
    description: 'Complete month-end closing, reconciliations, and reporting',
    function: 'Finance',
    estimatedTimeUnits: 12,
    tags: ['closing', 'monthly', 'reporting'],
  },
  {
    id: 'fin-budget-review',
    title: 'Quarterly Budget Review',
    description: 'Review budget vs actuals, analyze variances, update forecasts',
    function: 'Finance',
    estimatedTimeUnits: 8,
    tags: ['budget', 'quarterly', 'forecast'],
  },
  {
    id: 'fin-invoice-processing',
    title: 'Process Invoices & Payments',
    description: 'Review, approve, and process invoices and vendor payments',
    function: 'Finance',
    estimatedTimeUnits: 4,
    tags: ['invoices', 'payments', 'ap'],
  },
  {
    id: 'fin-financial-model',
    title: 'Update Financial Model',
    description: 'Refresh financial projections and scenario analysis',
    function: 'Finance',
    estimatedTimeUnits: 10,
    tags: ['modeling', 'projections', 'analysis'],
  },
  {
    id: 'fin-tax-prep',
    title: 'Tax Filing Preparation',
    description: 'Gather documents and prepare for quarterly tax filing',
    function: 'Finance',
    estimatedTimeUnits: 15,
    tags: ['tax', 'compliance', 'quarterly'],
  },

  // ENGINEERING TASKS
  {
    id: 'eng-feature-implementation',
    title: 'Implement New Feature',
    description: 'Design, develop, and test new product feature',
    function: 'Engineering',
    estimatedTimeUnits: 20,
    tags: ['feature', 'development', 'full-stack'],
  },
  {
    id: 'eng-bug-fixes',
    title: 'Fix Critical Bugs',
    description: 'Investigate and resolve high-priority bug reports',
    function: 'Engineering',
    estimatedTimeUnits: 8,
    tags: ['bugs', 'fixes', 'maintenance'],
  },
  {
    id: 'eng-api-integration',
    title: 'API Integration',
    description: 'Integrate third-party API and build connection layer',
    function: 'Engineering',
    estimatedTimeUnits: 12,
    tags: ['api', 'integration', 'backend'],
  },
  {
    id: 'eng-performance-optimization',
    title: 'Performance Optimization',
    description: 'Profile and optimize application performance bottlenecks',
    function: 'Engineering',
    estimatedTimeUnits: 10,
    tags: ['performance', 'optimization', 'technical-debt'],
  },
  {
    id: 'eng-database-migration',
    title: 'Database Migration',
    description: 'Plan and execute database schema migration',
    function: 'Engineering',
    estimatedTimeUnits: 15,
    tags: ['database', 'migration', 'infrastructure'],
  },
  {
    id: 'eng-code-review',
    title: 'Code Review Sprint',
    description: 'Review pending pull requests and provide feedback',
    function: 'Engineering',
    estimatedTimeUnits: 5,
    tags: ['code-review', 'quality', 'collaboration'],
  },

  // OPS TASKS
  {
    id: 'ops-process-documentation',
    title: 'Document Operational Process',
    description: 'Create comprehensive documentation for key workflow',
    function: 'Ops',
    estimatedTimeUnits: 6,
    tags: ['documentation', 'process', 'knowledge'],
  },
  {
    id: 'ops-vendor-evaluation',
    title: 'Vendor Evaluation & Selection',
    description: 'Research, evaluate, and select vendor for operational needs',
    function: 'Ops',
    estimatedTimeUnits: 10,
    tags: ['vendor', 'procurement', 'evaluation'],
  },
  {
    id: 'ops-compliance-audit',
    title: 'Internal Compliance Audit',
    description: 'Conduct compliance check and remediate gaps',
    function: 'Ops',
    estimatedTimeUnits: 12,
    tags: ['compliance', 'audit', 'risk'],
  },
  {
    id: 'ops-inventory-management',
    title: 'Inventory Check & Reorder',
    description: 'Review inventory levels and place reorders',
    function: 'Ops',
    estimatedTimeUnits: 4,
    tags: ['inventory', 'logistics', 'supply-chain'],
  },
  {
    id: 'ops-automation-setup',
    title: 'Set Up Process Automation',
    description: 'Build workflow automation to reduce manual work',
    function: 'Ops',
    estimatedTimeUnits: 8,
    tags: ['automation', 'efficiency', 'tools'],
  },

  // ADMIN TASKS
  {
    id: 'admin-onboarding',
    title: 'New Hire Onboarding',
    description: 'Complete onboarding process for new team member',
    function: 'Admin',
    estimatedTimeUnits: 6,
    tags: ['hr', 'onboarding', 'people'],
  },
  {
    id: 'admin-meeting-coordination',
    title: 'Quarterly Planning Meeting',
    description: 'Schedule and coordinate quarterly planning session',
    function: 'Admin',
    estimatedTimeUnits: 4,
    tags: ['meetings', 'planning', 'coordination'],
  },
  {
    id: 'admin-policy-update',
    title: 'Update Company Policies',
    description: 'Review and update employee handbook and policies',
    function: 'Admin',
    estimatedTimeUnits: 8,
    tags: ['policies', 'hr', 'documentation'],
  },
  {
    id: 'admin-benefits-enrollment',
    title: 'Benefits Enrollment Period',
    description: 'Manage annual benefits enrollment and employee questions',
    function: 'Admin',
    estimatedTimeUnits: 10,
    tags: ['benefits', 'hr', 'annual'],
  },
  {
    id: 'admin-office-setup',
    title: 'Office Setup & Supplies',
    description: 'Organize office space and order necessary supplies',
    function: 'Admin',
    estimatedTimeUnits: 5,
    tags: ['office', 'facilities', 'supplies'],
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get all task templates for a specific function
 */
export function getTemplatesByFunction(func: BusinessFunction): TaskTemplate[] {
  return TASK_TEMPLATES.filter(t => t.function === func);
}

/**
 * Get all task templates (sorted by function)
 */
export function getAllTemplates(): TaskTemplate[] {
  return TASK_TEMPLATES;
}

/**
 * Get a specific template by ID
 */
export function getTemplateById(id: string): TaskTemplate | undefined {
  return TASK_TEMPLATES.find(t => t.id === id);
}

/**
 * Search templates by keyword
 */
export function searchTemplates(query: string): TaskTemplate[] {
  const lowerQuery = query.toLowerCase();
  return TASK_TEMPLATES.filter(t =>
    t.title.toLowerCase().includes(lowerQuery) ||
    t.description.toLowerCase().includes(lowerQuery) ||
    t.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
}
