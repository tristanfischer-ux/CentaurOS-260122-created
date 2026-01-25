/**
 * Email Templates
 *
 * Pre-formatted email content for various notification types.
 * Used with Expo Mail Composer for device-native email sending.
 */

export interface TaskAssignmentEmailParams {
  recipientName: string;
  taskTitle: string;
  taskDescription?: string;
  dueDate: string;
  assignedBy: string;
  tuPerWeek?: number;
}

export interface InvitationEmailParams {
  recipientName: string;
  companyName: string;
  position: string;
  proposedRate: number;
  rateType: 'hourly' | 'daily' | 'monthly';
  senderName: string;
  invitationLink: string;
  personalMessage?: string;
  expiresInDays: number;
}

export interface ReminderEmailParams {
  recipientName: string;
  taskTitle: string;
  daysUntilDue: number;
  progress: number;
}

/**
 * Format a date for display in emails
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Get email content for task assignment notification
 */
export function getTaskAssignmentEmail(params: TaskAssignmentEmailParams): {
  subject: string;
  body: string;
} {
  const {
    recipientName,
    taskTitle,
    taskDescription,
    dueDate,
    assignedBy,
    tuPerWeek,
  } = params;

  const formattedDueDate = formatDate(dueDate);

  const subject = `Task Assigned: ${taskTitle}`;

  const body = `Hi ${recipientName},

${assignedBy} has assigned you to a new task in CentaurOS.

TASK DETAILS
------------
Title: ${taskTitle}
${taskDescription ? `Description: ${taskDescription}\n` : ''}Due Date: ${formattedDueDate}
${tuPerWeek ? `Allocated: ${tuPerWeek} TU/week\n` : ''}

Please open the CentaurOS app to view the full details and get started.

If you have questions about this task, please reach out to ${assignedBy}.

Best regards,
The CentaurOS Team`;

  return { subject, body };
}

/**
 * Get email content for team invitation
 */
export function getInvitationEmail(params: InvitationEmailParams): {
  subject: string;
  body: string;
} {
  const {
    recipientName,
    companyName,
    position,
    proposedRate,
    rateType,
    senderName,
    invitationLink,
    personalMessage,
    expiresInDays,
  } = params;

  const rateLabel = rateType === 'hourly' ? '/hour' : rateType === 'daily' ? '/day' : '/month';

  const subject = `Invitation to Join ${companyName}`;

  const body = `Hi ${recipientName},

${senderName} from ${companyName} would like to invite you to join their team.

POSITION DETAILS
----------------
Position: ${position}
Proposed Rate: £${proposedRate}${rateLabel}
${personalMessage ? `\nMESSAGE FROM ${senderName.toUpperCase()}\n----------------\n${personalMessage}\n` : ''}
To respond to this invitation and join the team, please click the link below:
${invitationLink}

This link will expire in ${expiresInDays} days.

Best regards,
The CentaurOS Team`;

  return { subject, body };
}

/**
 * Get email content for deadline reminder
 */
export function getDeadlineReminderEmail(params: ReminderEmailParams): {
  subject: string;
  body: string;
} {
  const {
    recipientName,
    taskTitle,
    daysUntilDue,
    progress,
  } = params;

  const urgency = daysUntilDue <= 1 ? 'URGENT: ' : daysUntilDue <= 3 ? 'Reminder: ' : '';
  const subject = `${urgency}${taskTitle} due ${daysUntilDue === 0 ? 'today' : daysUntilDue === 1 ? 'tomorrow' : `in ${daysUntilDue} days`}`;

  const body = `Hi ${recipientName},

This is a reminder that your task "${taskTitle}" is due ${daysUntilDue === 0 ? 'today' : daysUntilDue === 1 ? 'tomorrow' : `in ${daysUntilDue} days`}.

TASK STATUS
-----------
Progress: ${progress}%
${progress < 50 ? '\nThis task appears to be behind schedule. Please prioritize completion or reach out if you need help.' : progress < 90 ? '\nYou\'re making good progress! Keep it up.' : '\nAlmost there! Just a final push needed.'}

Please open the CentaurOS app to update your progress.

Best regards,
The CentaurOS Team`;

  return { subject, body };
}

/**
 * Get email content for task completion notification
 */
export function getTaskCompletedEmail(params: {
  recipientName: string;
  taskTitle: string;
  completedBy: string;
}): {
  subject: string;
  body: string;
} {
  const { recipientName, taskTitle, completedBy } = params;

  const subject = `Task Completed: ${taskTitle}`;

  const body = `Hi ${recipientName},

Great news! ${completedBy} has completed the task "${taskTitle}".

Please open the CentaurOS app to review the work and provide any feedback.

Best regards,
The CentaurOS Team`;

  return { subject, body };
}
