/**
 * Email Service using Resend
 *
 * Handles sending transactional emails for invitations, notifications, etc.
 */

import { Resend } from 'resend';

// Initialize Resend with API key from environment
const resend = new Resend(process.env.RESEND_API_KEY);

// Email configuration
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'invites@fractionalfoundry.com';
const FROM_NAME = process.env.RESEND_FROM_NAME || 'Fractional Foundry';

export interface SendInvitationEmailParams {
  to: string;
  candidateName: string;
  inviterName: string;
  companyName: string;
  invitationLink: string;
  personalMessage?: string;
  expiresInDays: number;
}

/**
 * Send invitation email to a candidate
 */
export async function sendInvitationEmail(
  params: SendInvitationEmailParams
): Promise<{ success: true; messageId: string } | { success: false; error: string }> {
  try {
    const {
      to,
      candidateName,
      inviterName,
      companyName,
      invitationLink,
      personalMessage,
      expiresInDays,
    } = params;

    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to,
      subject: `${inviterName} invited you to join ${companyName}`,
      html: generateInvitationEmailHtml(params),
      text: generateInvitationEmailText(params),
    });

    if (error) {
      console.error('[EmailService] Resend error:', error);
      return { success: false, error: error.message || 'Failed to send email' };
    }

    console.log(`[EmailService] Invitation email sent to ${to}, message ID: ${data?.id}`);
    return { success: true, messageId: data?.id || 'unknown' };
  } catch (error) {
    console.error('[EmailService] Unexpected error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Generate HTML email template for invitation
 */
function generateInvitationEmailHtml(params: SendInvitationEmailParams): string {
  const {
    candidateName,
    inviterName,
    companyName,
    invitationLink,
    personalMessage,
    expiresInDays,
  } = params;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're Invited to Join ${companyName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); padding: 40px 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                You're Invited! 🎉
              </h1>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 24px; color: #374151;">
                Hi ${candidateName},
              </p>

              <p style="margin: 0 0 20px; font-size: 16px; line-height: 24px; color: #374151;">
                <strong>${inviterName}</strong> from <strong>${companyName}</strong> has invited you to join their team on Fractional Foundry.
              </p>

              ${personalMessage ? `
              <div style="background-color: #f9fafb; border-left: 4px solid #8b5cf6; padding: 16px 20px; margin: 20px 0; border-radius: 6px;">
                <p style="margin: 0; font-size: 14px; line-height: 20px; color: #6b7280; font-style: italic;">
                  "${personalMessage}"
                </p>
              </div>
              ` : ''}

              <p style="margin: 20px 0; font-size: 16px; line-height: 24px; color: #374151;">
                Click the button below to accept this invitation and get started:
              </p>

              <!-- CTA Button -->
              <table role="presentation" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${invitationLink}" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px; box-shadow: 0 4px 6px rgba(139, 92, 246, 0.3);">
                      Accept Invitation
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 20px 0 10px; font-size: 14px; line-height: 20px; color: #6b7280;">
                Or copy and paste this link into your browser:
              </p>
              <p style="margin: 0; font-size: 12px; line-height: 18px; color: #9ca3af; word-break: break-all;">
                ${invitationLink}
              </p>

              <!-- Security Notice -->
              <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; padding: 16px; margin: 30px 0; border-radius: 8px;">
                <p style="margin: 0 0 8px; font-size: 13px; font-weight: 600; color: #1e40af;">
                  🔒 Secure Invitation
                </p>
                <p style="margin: 0; font-size: 12px; line-height: 18px; color: #1e3a8a;">
                  This invitation link is unique to you and expires in ${expiresInDays} days. It can only be used once for security.
                </p>
              </div>

              <p style="margin: 20px 0 0; font-size: 14px; line-height: 20px; color: #6b7280;">
                Looking forward to having you on the team!
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px; font-size: 12px; line-height: 18px; color: #9ca3af;">
                Sent by ${inviterName} via Fractional Foundry
              </p>
              <p style="margin: 0; font-size: 12px; line-height: 18px; color: #9ca3af;">
                If you didn't expect this invitation, you can safely ignore this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Generate plain text email template for invitation
 */
function generateInvitationEmailText(params: SendInvitationEmailParams): string {
  const {
    candidateName,
    inviterName,
    companyName,
    invitationLink,
    personalMessage,
    expiresInDays,
  } = params;

  return `
Hi ${candidateName},

${inviterName} from ${companyName} has invited you to join their team on Fractional Foundry.

${personalMessage ? `Personal message:\n"${personalMessage}"\n\n` : ''}

Accept this invitation by clicking the link below:

${invitationLink}

SECURITY NOTICE:
This invitation link is unique to you and expires in ${expiresInDays} days. It can only be used once for security.

Looking forward to having you on the team!

---
Sent by ${inviterName} via Fractional Foundry

If you didn't expect this invitation, you can safely ignore this email.
  `.trim();
}

/**
 * Check if Resend is properly configured
 */
export function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

/**
 * Get email configuration status for debugging
 */
export function getEmailConfig() {
  return {
    configured: isEmailConfigured(),
    fromEmail: FROM_EMAIL,
    fromName: FROM_NAME,
    hasApiKey: !!process.env.RESEND_API_KEY,
  };
}
