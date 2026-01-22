/**
 * Email Service
 *
 * Wrapper around Expo Mail Composer for sending emails via the device's mail app.
 * Note: This opens the native mail app - it does NOT send emails automatically.
 * The user must press "Send" in their mail app.
 */

import * as MailComposer from 'expo-mail-composer';
import {
  getTaskAssignmentEmail,
  getInvitationEmail,
  getDeadlineReminderEmail,
  getTaskCompletedEmail,
  type TaskAssignmentEmailParams,
  type InvitationEmailParams,
  type ReminderEmailParams,
} from './email-templates';

export type EmailSendResult = {
  sent: boolean;
  status: 'sent' | 'saved' | 'cancelled' | 'unavailable' | 'error';
  error?: string;
};

/**
 * Check if email composition is available on this device
 */
export async function isEmailAvailable(): Promise<boolean> {
  try {
    return await MailComposer.isAvailableAsync();
  } catch {
    return false;
  }
}

/**
 * Map MailComposer status to our result type
 */
function mapStatus(status: MailComposer.MailComposerStatus): EmailSendResult['status'] {
  switch (status) {
    case MailComposer.MailComposerStatus.SENT:
      return 'sent';
    case MailComposer.MailComposerStatus.SAVED:
      return 'saved';
    case MailComposer.MailComposerStatus.CANCELLED:
      return 'cancelled';
    default:
      return 'error';
  }
}

/**
 * Open mail composer with task assignment email
 */
export async function composeTaskAssignmentEmail(
  recipientEmail: string,
  params: TaskAssignmentEmailParams
): Promise<EmailSendResult> {
  const available = await isEmailAvailable();
  if (!available) {
    return { sent: false, status: 'unavailable', error: 'Email not available on this device' };
  }

  try {
    const { subject, body } = getTaskAssignmentEmail(params);
    const result = await MailComposer.composeAsync({
      recipients: [recipientEmail],
      subject,
      body,
      isHtml: false,
    });

    const status = mapStatus(result.status);
    return {
      sent: status === 'sent',
      status,
    };
  } catch (error) {
    return {
      sent: false,
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Open mail composer with invitation email
 */
export async function composeInvitationEmail(
  recipientEmail: string,
  params: InvitationEmailParams
): Promise<EmailSendResult> {
  const available = await isEmailAvailable();
  if (!available) {
    return { sent: false, status: 'unavailable', error: 'Email not available on this device' };
  }

  try {
    const { subject, body } = getInvitationEmail(params);
    const result = await MailComposer.composeAsync({
      recipients: [recipientEmail],
      subject,
      body,
      isHtml: false,
    });

    const status = mapStatus(result.status);
    return {
      sent: status === 'sent',
      status,
    };
  } catch (error) {
    return {
      sent: false,
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Open mail composer with deadline reminder email
 */
export async function composeDeadlineReminderEmail(
  recipientEmail: string,
  params: ReminderEmailParams
): Promise<EmailSendResult> {
  const available = await isEmailAvailable();
  if (!available) {
    return { sent: false, status: 'unavailable', error: 'Email not available on this device' };
  }

  try {
    const { subject, body } = getDeadlineReminderEmail(params);
    const result = await MailComposer.composeAsync({
      recipients: [recipientEmail],
      subject,
      body,
      isHtml: false,
    });

    const status = mapStatus(result.status);
    return {
      sent: status === 'sent',
      status,
    };
  } catch (error) {
    return {
      sent: false,
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Open mail composer with task completed email
 */
export async function composeTaskCompletedEmail(
  recipientEmail: string,
  params: {
    recipientName: string;
    taskTitle: string;
    completedBy: string;
  }
): Promise<EmailSendResult> {
  const available = await isEmailAvailable();
  if (!available) {
    return { sent: false, status: 'unavailable', error: 'Email not available on this device' };
  }

  try {
    const { subject, body } = getTaskCompletedEmail(params);
    const result = await MailComposer.composeAsync({
      recipients: [recipientEmail],
      subject,
      body,
      isHtml: false,
    });

    const status = mapStatus(result.status);
    return {
      sent: status === 'sent',
      status,
    };
  } catch (error) {
    return {
      sent: false,
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Open mail composer with custom email
 */
export async function composeCustomEmail(params: {
  recipients: string[];
  subject: string;
  body: string;
  isHtml?: boolean;
  ccRecipients?: string[];
  bccRecipients?: string[];
}): Promise<EmailSendResult> {
  const available = await isEmailAvailable();
  if (!available) {
    return { sent: false, status: 'unavailable', error: 'Email not available on this device' };
  }

  try {
    const result = await MailComposer.composeAsync({
      recipients: params.recipients,
      subject: params.subject,
      body: params.body,
      isHtml: params.isHtml ?? false,
      ccRecipients: params.ccRecipients,
      bccRecipients: params.bccRecipients,
    });

    const status = mapStatus(result.status);
    return {
      sent: status === 'sent',
      status,
    };
  } catch (error) {
    return {
      sent: false,
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Batch compose emails for multiple recipients
 * Opens mail composer for each recipient sequentially
 */
export async function composeMultipleTaskAssignmentEmails(
  assignments: Array<{
    recipientEmail: string;
    params: TaskAssignmentEmailParams;
  }>
): Promise<Array<{ email: string; result: EmailSendResult }>> {
  const results: Array<{ email: string; result: EmailSendResult }> = [];

  for (const assignment of assignments) {
    const result = await composeTaskAssignmentEmail(
      assignment.recipientEmail,
      assignment.params
    );
    results.push({ email: assignment.recipientEmail, result });

    // If user cancelled, stop sending more
    if (result.status === 'cancelled') {
      break;
    }
  }

  return results;
}
