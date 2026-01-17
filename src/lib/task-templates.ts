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
  {
    id: 'mkt-brand-guidelines',
    title: 'Create Brand Guidelines',
    description: 'Design comprehensive brand style guide and visual identity',
    function: 'Marketing',
    estimatedTimeUnits: 12,
    tags: ['branding', 'design', 'guidelines'],
  },
  {
    id: 'mkt-website-copy',
    title: 'Write Website Copy',
    description: 'Create compelling website copy and product messaging',
    function: 'Marketing',
    estimatedTimeUnits: 8,
    tags: ['copywriting', 'website', 'content'],
  },
  {
    id: 'mkt-pr-outreach',
    title: 'PR & Media Outreach',
    description: 'Pitch company story to journalists and media outlets',
    function: 'Marketing',
    estimatedTimeUnits: 10,
    tags: ['pr', 'media', 'outreach'],
  },
  {
    id: 'mkt-competitor-analysis',
    title: 'Competitive Analysis Report',
    description: 'Research competitors and create positioning strategy',
    function: 'Marketing',
    estimatedTimeUnits: 6,
    tags: ['research', 'competitive', 'strategy'],
  },
  {
    id: 'mkt-seo-optimization',
    title: 'SEO & Content Optimization',
    description: 'Optimize website content for search engines and keywords',
    function: 'Marketing',
    estimatedTimeUnits: 7,
    tags: ['seo', 'optimization', 'content'],
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
  {
    id: 'sales-crm-setup',
    title: 'Set Up CRM System',
    description: 'Configure and customize CRM for team workflows',
    function: 'Sales',
    estimatedTimeUnits: 8,
    tags: ['crm', 'setup', 'tools'],
  },
  {
    id: 'sales-playbook',
    title: 'Create Sales Playbook',
    description: 'Document sales process, scripts, and best practices',
    function: 'Sales',
    estimatedTimeUnits: 12,
    tags: ['playbook', 'documentation', 'process'],
  },
  {
    id: 'sales-territory-planning',
    title: 'Territory & Account Planning',
    description: 'Segment market and assign account territories',
    function: 'Sales',
    estimatedTimeUnits: 6,
    tags: ['planning', 'territory', 'strategy'],
  },
  {
    id: 'sales-pricing-strategy',
    title: 'Develop Pricing Strategy',
    description: 'Research market rates and create competitive pricing model',
    function: 'Sales',
    estimatedTimeUnits: 10,
    tags: ['pricing', 'strategy', 'competitive'],
  },
  {
    id: 'sales-contract-negotiation',
    title: 'Contract Negotiation',
    description: 'Negotiate terms and close enterprise deal',
    function: 'Sales',
    estimatedTimeUnits: 8,
    tags: ['negotiation', 'contracts', 'enterprise'],
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
  {
    id: 'fin-fundraising-deck',
    title: 'Create Investor Financial Pack',
    description: 'Build financial model and metrics deck for fundraising',
    function: 'Finance',
    estimatedTimeUnits: 20,
    tags: ['fundraising', 'investors', 'deck'],
  },
  {
    id: 'fin-cash-flow-forecast',
    title: 'Cash Flow Forecasting',
    description: 'Project cash flows and runway analysis for next 12 months',
    function: 'Finance',
    estimatedTimeUnits: 8,
    tags: ['cash-flow', 'forecasting', 'runway'],
  },
  {
    id: 'fin-expense-tracking',
    title: 'Set Up Expense Tracking',
    description: 'Implement expense management system and policies',
    function: 'Finance',
    estimatedTimeUnits: 6,
    tags: ['expenses', 'tracking', 'setup'],
  },
  {
    id: 'fin-banking-setup',
    title: 'Set Up Business Banking',
    description: 'Open business bank accounts and payment systems',
    function: 'Finance',
    estimatedTimeUnits: 10,
    tags: ['banking', 'setup', 'payments'],
  },
  {
    id: 'fin-unit-economics',
    title: 'Calculate Unit Economics',
    description: 'Analyze CAC, LTV, gross margin, and profitability metrics',
    function: 'Finance',
    estimatedTimeUnits: 12,
    tags: ['metrics', 'economics', 'analysis'],
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
  {
    id: 'eng-ci-cd-setup',
    title: 'Set Up CI/CD Pipeline',
    description: 'Configure automated testing and deployment pipeline',
    function: 'Engineering',
    estimatedTimeUnits: 12,
    tags: ['devops', 'ci-cd', 'automation'],
  },
  {
    id: 'eng-tech-stack-selection',
    title: 'Evaluate Tech Stack',
    description: 'Research and select technology stack for product',
    function: 'Engineering',
    estimatedTimeUnits: 10,
    tags: ['architecture', 'planning', 'research'],
  },
  {
    id: 'eng-security-audit',
    title: 'Security Audit & Fixes',
    description: 'Conduct security review and patch vulnerabilities',
    function: 'Engineering',
    estimatedTimeUnits: 15,
    tags: ['security', 'audit', 'compliance'],
  },
  {
    id: 'eng-testing-framework',
    title: 'Implement Testing Framework',
    description: 'Set up automated unit, integration, and e2e testing',
    function: 'Engineering',
    estimatedTimeUnits: 12,
    tags: ['testing', 'quality', 'automation'],
  },
  {
    id: 'eng-documentation',
    title: 'Write Technical Documentation',
    description: 'Create API docs, architecture guides, and README files',
    function: 'Engineering',
    estimatedTimeUnits: 8,
    tags: ['documentation', 'knowledge', 'onboarding'],
  },
  {
    id: 'eng-mobile-app-setup',
    title: 'Initialize Mobile App',
    description: 'Set up React Native/Flutter project and dev environment',
    function: 'Engineering',
    estimatedTimeUnits: 10,
    tags: ['mobile', 'setup', 'initialization'],
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
  {
    id: 'ops-supply-chain-setup',
    title: 'Establish Supply Chain',
    description: 'Source suppliers and set up logistics for manufacturing',
    function: 'Ops',
    estimatedTimeUnits: 15,
    tags: ['supply-chain', 'manufacturing', 'logistics'],
  },
  {
    id: 'ops-quality-control',
    title: 'Implement QC Process',
    description: 'Design quality control procedures and testing protocols',
    function: 'Ops',
    estimatedTimeUnits: 10,
    tags: ['quality', 'testing', 'process'],
  },
  {
    id: 'ops-legal-contracts',
    title: 'Review Legal Contracts',
    description: 'Review and negotiate vendor and partnership agreements',
    function: 'Ops',
    estimatedTimeUnits: 8,
    tags: ['legal', 'contracts', 'compliance'],
  },
  {
    id: 'ops-insurance-setup',
    title: 'Secure Business Insurance',
    description: 'Research and purchase necessary business insurance policies',
    function: 'Ops',
    estimatedTimeUnits: 6,
    tags: ['insurance', 'risk', 'compliance'],
  },
  {
    id: 'ops-facility-planning',
    title: 'Office/Facility Setup',
    description: 'Plan and execute office or production facility setup',
    function: 'Ops',
    estimatedTimeUnits: 20,
    tags: ['facilities', 'planning', 'setup'],
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
  {
    id: 'admin-incorporation',
    title: 'Company Incorporation',
    description: 'File incorporation documents and register business',
    function: 'Admin',
    estimatedTimeUnits: 12,
    tags: ['legal', 'incorporation', 'setup'],
  },
  {
    id: 'admin-email-domain-setup',
    title: 'Set Up Email & Domain',
    description: 'Register domain and configure professional email accounts',
    function: 'Admin',
    estimatedTimeUnits: 4,
    tags: ['setup', 'email', 'domain'],
  },
  {
    id: 'admin-employee-handbook',
    title: 'Create Employee Handbook',
    description: 'Draft comprehensive employee handbook and policies',
    function: 'Admin',
    estimatedTimeUnits: 15,
    tags: ['hr', 'policies', 'handbook'],
  },
  {
    id: 'admin-team-retreat',
    title: 'Organize Team Retreat',
    description: 'Plan and coordinate team offsite or retreat',
    function: 'Admin',
    estimatedTimeUnits: 10,
    tags: ['team', 'culture', 'events'],
  },
  {
    id: 'admin-trademark-filing',
    title: 'File Trademark Application',
    description: 'Research and file trademark for company name/logo',
    function: 'Admin',
    estimatedTimeUnits: 8,
    tags: ['legal', 'trademark', 'ip'],
  },
  {
    id: 'admin-payroll-setup',
    title: 'Set Up Payroll System',
    description: 'Configure payroll system and employee payment processes',
    function: 'Admin',
    estimatedTimeUnits: 8,
    tags: ['payroll', 'hr', 'finance'],
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
