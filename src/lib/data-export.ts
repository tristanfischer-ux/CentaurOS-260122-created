/**
 * Data Export Utility
 *
 * Provides comprehensive data export and template generation for Google Sheets integration
 */

import { useWorkPlanStore } from './state/work-plan-store';
import { useOKRStore } from './state/okr-store';
import { useOrganizationStore } from './state/organization-store';
import { useCapacityStore } from './state/capacity-store';
import { useResourceOwnershipStore } from './state/resource-ownership-store';
import { useMessagesStore } from './state/messages-store';
import { useCalendarStore } from './state/calendar-store';

// ============================================================================
// CSV TEMPLATE DEFINITIONS
// ============================================================================

export const CSV_TEMPLATES = {
  Tasks: {
    name: 'Tasks Template',
    description: 'Import your tasks and work items',
    headers: [
      'ID',
      'Title',
      'Description',
      'Function',
      'Status',
      'Progress',
      'Priority',
      'Assigned By',
      'Assigned To',
      'Due Date',
      'Estimated Squares (□)',
      'Linked OKR',
      'Needs Submission',
      'Submitted By',
      'Approved By',
      'Workspace ID',
    ],
    exampleRow: [
      'task-001',
      'Complete Q1 Marketing Report',
      'Compile all marketing metrics and create comprehensive quarterly report',
      'Marketing',
      'in-progress',
      '45',
      'high',
      'founder-1',
      'exec-1',
      '2026-01-31',
      '8',
      'Increase Brand Awareness',
      'true',
      '',
      '',
      'workspace-1',
    ],
  },

  OKRs: {
    name: 'OKRs Template',
    description: 'Import objectives and key results',
    headers: [
      'ID',
      'Quarter',
      'Title',
      'Description',
      'Owner',
      'Function',
      'Status',
      'Overall Progress',
      'Objective ID',
      'Objective Title',
      'Key Result Target',
      'Key Result Current',
      'Key Result Progress',
      'Key Result Status',
      'Workspace ID',
    ],
    exampleRow: [
      'okr-001',
      'Q1 2026',
      'Increase Revenue',
      'Drive top-line growth through new customer acquisition and expansion',
      'founder-1',
      'Sales',
      'on-track',
      '65',
      'obj-001',
      'Acquire 100 new customers',
      '100',
      '65',
      '65',
      'on-track',
      'workspace-1',
    ],
  },

  Team: {
    name: 'Team Members Template',
    description: 'Import team member information',
    headers: [
      'ID',
      'Name',
      'Email',
      'Role',
      'Function',
      'Status',
      'Start Date',
      'Capacity (□/week)',
      'Rate (GBP/hour)',
      'Rate Type',
      'Location',
      'Timezone',
      'Skills',
      'Bio',
      'Workspace ID',
    ],
    exampleRow: [
      'member-001',
      'Alex Thompson',
      'alex@example.com',
      'FractionalExec',
      'Marketing',
      'active',
      '2025-11-01',
      '40',
      '125',
      'hourly',
      'London, UK',
      'GMT',
      'Digital Marketing, SEO, Content Strategy',
      'Growth marketing leader with 10+ years experience',
      'workspace-1',
    ],
  },

  Suppliers: {
    name: 'Suppliers Template',
    description: 'Import supplier engagement data',
    headers: [
      'ID',
      'Supplier Name',
      'Project Name',
      'Description',
      'Status',
      'Total Cost (GBP)',
      'Paid to Date (GBP)',
      'Start Date',
      'Delivery Date',
      'Contact Person',
      'Contact Email',
      'Contact Phone',
      'Quality Score',
      'On-Time Delivery %',
      'Notes',
      'Workspace ID',
    ],
    exampleRow: [
      'supplier-001',
      'TechFlow Solutions',
      'Cloud Infrastructure Setup',
      'AWS cloud infrastructure deployment and configuration',
      'active',
      '45000',
      '22500',
      '2025-12-01',
      '2026-03-31',
      'John Smith',
      'john@techflow.com',
      '+44 20 1234 5678',
      '94',
      '87',
      'Reliable partner for infrastructure',
      'workspace-1',
    ],
  },

  'AI Agents': {
    name: 'AI Agents Template',
    description: 'Import AI tool subscriptions and agents',
    headers: [
      'ID',
      'Name',
      'Provider',
      'Model',
      'Purpose',
      'Cost Per Month (GBP)',
      'Status',
      'Function',
      'Used By (User IDs)',
      'Capabilities',
      'Integrations',
      'Website',
      'Added Date',
      'Last Used',
      'Workspace ID',
    ],
    exampleRow: [
      'ai-001',
      'ChatGPT Plus',
      'OpenAI',
      'GPT-4',
      'General-purpose AI assistant for content creation and research',
      '20',
      'active',
      'Marketing',
      'exec-1,apprentice-1',
      'Content generation, Research, Code assistance',
      'Slack, API',
      'https://chat.openai.com',
      '2025-11-15',
      '2026-01-13',
      'workspace-1',
    ],
  },

  Finance: {
    name: 'Financial Data Template',
    description: 'Import financial metrics and forecasts',
    headers: [
      'Month',
      'Revenue (GBP)',
      'Expenses (GBP)',
      'Gross Profit (GBP)',
      'Operating Expenses (GBP)',
      'EBITDA (GBP)',
      'Cash Balance (GBP)',
      'Burn Rate (GBP/month)',
      'Runway (months)',
      'Customer Count',
      'ARR (GBP)',
      'MRR (GBP)',
      'Churn Rate (%)',
      'CAC (GBP)',
      'LTV (GBP)',
      'Workspace ID',
    ],
    exampleRow: [
      '2026-01',
      '125000',
      '89000',
      '36000',
      '67000',
      '11000',
      '450000',
      '15000',
      '30',
      '234',
      '1500000',
      '125000',
      '2.3',
      '450',
      '12500',
      'workspace-1',
    ],
  },

  Capacity: {
    name: 'Team Capacity Template',
    description: 'Import team capacity and allocation data',
    headers: [
      'Member ID',
      'Member Name',
      'Total Capacity (□)',
      'Allocated (□)',
      'Available (□)',
      'Utilization %',
      'AI Boost Multiplier',
      'Effective Capacity (□)',
      'Week Starting',
      'Workspace ID',
    ],
    exampleRow: [
      'member-001',
      'Alex Thompson',
      '40',
      '35',
      '5',
      '87.5',
      '1.2',
      '48',
      '2026-01-13',
      'workspace-1',
    ],
  },

  Messages: {
    name: 'Messages Template',
    description: 'Import conversation and message data',
    headers: [
      'Conversation ID',
      'Conversation Name',
      'Participants (User IDs)',
      'Message ID',
      'Sender ID',
      'Content',
      'Timestamp',
      'Is Read',
      'Type',
      'Workspace ID',
    ],
    exampleRow: [
      'conv-001',
      'Q1 Planning Discussion',
      'founder-1,exec-1,exec-2',
      'msg-001',
      'founder-1',
      'Let\'s review the Q1 objectives and ensure everyone is aligned.',
      '2026-01-13T10:00:00Z',
      'true',
      'text',
      'workspace-1',
    ],
  },

  Calendar: {
    name: 'Calendar Events Template',
    description: 'Import calendar events and meetings',
    headers: [
      'ID',
      'Title',
      'Description',
      'Start Date',
      'End Date',
      'All Day',
      'Location',
      'Attendees (User IDs)',
      'Type',
      'Color',
      'Reminder (minutes)',
      'Recurring',
      'Workspace ID',
    ],
    exampleRow: [
      'event-001',
      'Weekly Team Standup',
      'Monday morning team sync to review progress and blockers',
      '2026-01-13T09:00:00Z',
      '2026-01-13T09:30:00Z',
      'false',
      'Zoom',
      'founder-1,exec-1,exec-2,apprentice-1',
      'meeting',
      '#3b82f6',
      '15',
      'weekly',
      'workspace-1',
    ],
  },
};

// ============================================================================
// DATA EXPORT FUNCTIONS
// ============================================================================

export const exportData = {
  /**
   * Export Tasks to CSV format
   */
  tasks: (workspaceId: string): string[][] => {
    const store = useWorkPlanStore.getState();
    const workPlans = store.workPlans.filter(wp => wp.workspaceId === workspaceId);

    const data = workPlans.map(task => [
      task.id,
      task.title,
      task.description || '',
      task.function,
      task.status,
      task.progress.toString(),
      'medium', // Default priority if not stored
      task.assignedBy || '',
      task.assignedMemberIds?.join(',') || '', // Assigned to members
      task.dueDate || '',
      task.estimatedTimeUnits.toString(),
      task.linkedOKRTitle || '',
      task.needsSubmission.toString(),
      task.lastSubmittedAt || '', // Last submission time
      task.feedback || '', // Approval/feedback
      task.workspaceId,
    ]);

    return [CSV_TEMPLATES.Tasks.headers, ...data];
  },

  /**
   * Export OKRs to CSV format
   */
  okrs: (workspaceId: string): string[][] => {
    const store = useOKRStore.getState();
    const okrs = store.okrs.filter(okr => okr.workspaceId === workspaceId);

    const data: string[][] = [];
    okrs.forEach(okr => {
      // Calculate quarter from dates
      const startDate = new Date(okr.startDate);
      const quarter = `Q${Math.ceil((startDate.getMonth() + 1) / 3)} ${startDate.getFullYear()}`;

      // Calculate overall progress from objectives
      const overallProgress = okr.objectives.length > 0
        ? Math.round(okr.objectives.reduce((sum, obj) => sum + obj.progress, 0) / okr.objectives.length)
        : 0;

      okr.objectives.forEach(obj => {
        data.push([
          okr.id,
          quarter,
          okr.title,
          okr.description || '',
          okr.owner || '',
          okr.function || '',
          okr.status,
          overallProgress.toString(),
          obj.id,
          obj.title,
          obj.target,
          obj.current,
          obj.progress.toString(),
          obj.status,
          okr.workspaceId,
        ]);
      });
    });

    return [CSV_TEMPLATES.OKRs.headers, ...data];
  },

  /**
   * Export Team Members to CSV format
   */
  team: (workspaceId?: string): string[][] => {
    const store = useOrganizationStore.getState();
    const members = store.members.filter(m => m.status === 'active');

    const data = members.map(member => [
      member.id,
      member.name,
      member.email || '',
      member.role,
      member.function,
      member.status,
      member.startDate || '',
      (member.daysPerWeek || 5).toString(), // Default to 5 days per week
      (member.costPerDay || 0).toString(),
      member.daysPerWeek ? 'daily' : '',
      '', // Location
      '', // Timezone
      '', // Skills - not in current type
      member.bio || '',
      workspaceId || 'workspace-1',
    ]);

    return [CSV_TEMPLATES.Team.headers, ...data];
  },

  /**
   * Export Suppliers to CSV format
   */
  suppliers: (workspaceId?: string): string[][] => {
    const store = useOrganizationStore.getState();
    const suppliers = store.supplierEngagements;

    const data = suppliers.map(supplier => [
      supplier.id,
      supplier.supplierName,
      supplier.projectName,
      supplier.description,
      supplier.status,
      supplier.totalCost.toString(),
      supplier.paidToDate.toString(),
      supplier.startDate,
      supplier.deliveryDate,
      supplier.contactPerson,
      supplier.contactEmail,
      supplier.contactPhone,
      '', // Quality score
      '', // On-time delivery
      supplier.notes || '',
      workspaceId || 'workspace-1',
    ]);

    return [CSV_TEMPLATES.Suppliers.headers, ...data];
  },

  /**
   * Export AI Agents to CSV format
   */
  aiAgents: (workspaceId?: string): string[][] => {
    const store = useOrganizationStore.getState();
    const agents = store.aiAgents;

    const data = agents.map(agent => [
      agent.id,
      agent.name,
      agent.provider,
      agent.model,
      agent.purpose,
      agent.costPerMonth.toString(),
      agent.status,
      agent.functions?.join(',') || '',
      agent.usedBy?.join(',') || '',
      agent.capabilities?.join(', ') || '',
      agent.integrations?.join(', ') || '',
      agent.website || '',
      agent.addedDate,
      agent.lastUsed || '',
      workspaceId || 'workspace-1',
    ]);

    return [CSV_TEMPLATES['AI Agents'].headers, ...data];
  },

  /**
   * Export Capacity data to CSV format
   */
  capacity: (workspaceId: string): string[][] => {
    const capStore = useCapacityStore.getState();
    const orgStore = useOrganizationStore.getState();

    // Use memberCapacities directly from store
    const capacities = capStore.memberCapacities.filter(cap => {
      const member = orgStore.members.find(m => m.id === cap.memberId);
      return member?.workspaceId === workspaceId;
    });

    const data = capacities.map(cap => {
      const member = orgStore.members.find(m => m.id === cap.memberId);
      return [
        cap.memberId,
        member?.name || '',
        cap.baseTimeUnitsPerWeek.toString(),
        cap.allocatedTimeUnits.toString(),
        cap.availableTimeUnits.toString(),
        cap.utilizationPct.toFixed(1),
        cap.aiMultiplier.toString(),
        cap.effectiveCapacity.toString(),
        new Date().toISOString().split('T')[0],
        workspaceId,
      ];
    });

    return [CSV_TEMPLATES.Capacity.headers, ...data];
  },
};

// ============================================================================
// CSV CONVERSION UTILITIES
// ============================================================================

/**
 * Convert 2D array to CSV string
 */
export function arrayToCSV(data: string[][]): string {
  return data
    .map(row =>
      row.map(cell => {
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        const escaped = cell.replace(/"/g, '""');
        return /[",\n]/.test(escaped) ? `"${escaped}"` : escaped;
      })
      .join(',')
    )
    .join('\n');
}

/**
 * Generate CSV template file
 */
export function generateTemplate(templateName: keyof typeof CSV_TEMPLATES): string {
  const template = CSV_TEMPLATES[templateName];
  const data = [template.headers, template.exampleRow];
  return arrayToCSV(data);
}

/**
 * Generate Google Sheets URL with pre-filled template
 */
export function generateGoogleSheetsURL(templateName: keyof typeof CSV_TEMPLATES): string {
  const template = CSV_TEMPLATES[templateName];

  // Create a new Google Sheet with the template name
  // Note: This creates a new sheet, user would need to manually copy data
  // For full integration, would need Google Sheets API
  const sheetName = encodeURIComponent(template.name);

  return `https://docs.google.com/spreadsheets/create?title=${sheetName}`;
}

/**
 * Get all data for Google Sheets sync
 */
export function getAllDataForSync(workspaceId: string) {
  return {
    tasks: exportData.tasks(workspaceId),
    okrs: exportData.okrs(workspaceId),
    team: exportData.team(workspaceId),
    suppliers: exportData.suppliers(workspaceId),
    aiAgents: exportData.aiAgents(workspaceId),
    capacity: exportData.capacity(workspaceId),
  };
}

/**
 * Generate comprehensive Google Sheets template with all tabs
 */
export function generateComprehensiveGoogleSheetsURL(workspaceId: string): string {
  // This would ideally use Google Sheets API to create a multi-tab sheet
  // For now, we'll provide a template URL
  return 'https://docs.google.com/spreadsheets/d/1234567890/edit#gid=0';
}
