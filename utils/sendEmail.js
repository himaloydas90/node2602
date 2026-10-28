
const nodemailer = require('nodemailer');

const APP_NAME = process.env.APP_NAME || 'ERP System';
const FROM_NAME = process.env.SMTP_FROM_NAME || APP_NAME;
const REPLY_TO = process.env.SMTP_REPLY_TO || process.env.SMTP_NAME;
const smtpPort = Number(process.env.SMTP_PORT || 587)

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: smtpPort,
  secure: smtpPort === 465,
  auth: {
    user: process.env.SMTP_NAME,
    pass: process.env.SMTP_PASSWORD,
  },
  // Reuse the connection and keep TLS strict; free SMTP servers throttle
  // rapid sequential sends which pushes mail toward the spam folder.
  pool: true,
  maxConnections: 1,
  maxMessages: 50,
  connectionTimeout: 15000,
  greetingTimeout: 10000,
  socketTimeout: 20000,
  tls: {
    minVersion: 'TLSv1.2',
  },
});

// Validate frontend URL
const getClientUrl = (path, token) => {
  if (!process.env.CLIENT_URL) {
    throw new Error('CLIENT_URL is not configured');
  }

  const url = new URL(path, process.env.CLIENT_URL);

  // Prevent accidentally using an invalid or insecure production URL
  if (
    process.env.NODE_ENV === 'production' &&
    url.protocol !== 'https:'
  ) {
    throw new Error('CLIENT_URL must use HTTPS in production');
  }

  url.searchParams.set('token', token);

  return url.toString();
};

// Escape dynamic values before inserting into HTML
const escapeHtml = (value = '') =>
  String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[char]);

/**
 * Send email using Nodemailer.
 */
const sendEmail = async ({ to, subject, html, text }) => {
  if (!process.env.SMTP_NAME || !process.env.SMTP_PASSWORD) {
    throw new Error('SMTP credentials are not configured');
  }

  return transporter.sendMail({
    from: {
      name: FROM_NAME,
      address: process.env.SMTP_NAME,
    },
    // A reachable Reply-To address is a positive trust signal for filters.
    replyTo: {
      name: FROM_NAME,
      address: REPLY_TO,
    },
    to,
    subject,
    // Always send both parts: HTML-only mail is a common spam trigger.
    text,
    html,
    headers: {
      // RFC 3834 — marks this as an automated transactional message so
      // auto-responders stay quiet and filters classify it as transactional.
      'Auto-Submitted': 'auto-generated',
      'X-Auto-Response-Suppress': 'All',
      // Gives recipients (and filters) a legitimate opt-out path.
      'List-Unsubscribe': `<mailto:${REPLY_TO}?subject=unsubscribe>`,
    },
  });
};

// Reusable professional email template
const emailTemplate = ({
  title,
  greeting,
  message,
  buttonText,
  actionUrl,
  note,
  preheader,
  recipientEmail,
}) => {
  const safeTitle = escapeHtml(title);
  const safeGreeting = escapeHtml(greeting);
  const safeMessage = escapeHtml(message);
  const safeButtonText = escapeHtml(buttonText);
  const safeUrl = escapeHtml(actionUrl);
  const safeNote = escapeHtml(note);
  const safeRecipient = escapeHtml(recipientEmail);
  const safeReplyTo = escapeHtml(REPLY_TO);
  const safeAppName = escapeHtml(APP_NAME);
  const safePreheader = escapeHtml(preheader || message);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <title>${safeTitle}</title>
</head>

<body style="margin:0;padding:0;background-color:#f3f6fb;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
  <div style="display:none;font-size:1px;color:#f3f6fb;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
    ${safePreheader}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
    style="background-color:#f3f6fb;">
    <tr>
      <td align="center" style="padding:32px 12px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
          style="max-width:560px;background-color:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">

          <tr>
            <td align="left" style="padding:26px 28px;border-bottom:1px solid #e5e7eb;">
              <h1 style="margin:0;color:#1d4ed8;font-size:19px;">${safeAppName}</h1>
            </td>
          </tr>

          <tr>
            <td align="left" style="padding:30px 28px;">
              <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1f2937;">
                ${safeGreeting}
              </p>

              <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#374151;">
                ${safeMessage}
              </p>

              <!-- প্রফেশনাল ভেরিফিকেশন বাটন -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                <tr>
                  <td align="center" bgcolor="#1d4ed8" style="border-radius:6px;">
                    <a href="${safeUrl}" target="_blank"
                      style="font-size:15px;font-family:Arial, sans-serif;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;border:1px solid #1d4ed8;display:inline-block;font-weight:bold;">
                      ${safeButtonText}
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 6px;font-size:13px;line-height:1.7;color:#6b7280;">
                Or copy this address into your browser:
              </p>

              <p style="margin:0 0 22px;font-size:13px;line-height:1.7;color:#374151;word-break:break-all;">
                ${safeUrl}
              </p>

              <p style="margin:0;font-size:13px;line-height:1.7;color:#6b7280;">
                ${safeNote}
              </p>
            </td>
          </tr>

          <tr>
            <td align="left"
              style="padding:20px 28px;background-color:#f9fafb;border-top:1px solid #e5e7eb;">
              <p style="margin:0 0 8px;font-size:12px;line-height:1.7;color:#6b7280;">
                This email was sent to ${safeRecipient}. Questions? Just reply to this
                message or write to ${safeReplyTo} &mdash; a real person will answer.
              </p>
              <p style="margin:0;font-size:12px;line-height:1.7;color:#9ca3af;">
                &copy; ${new Date().getFullYear()} ${safeAppName}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};
// Email verification
const sendVerificationEmail = async (email, token, username = '') => {
  const verifyUrl = getClientUrl('/backend-api/v1/auth/verify-email', token);

  const greeting = username ? `Hello ${username},` : 'Hello,';

  const message =
    `Thanks for creating an account with ${APP_NAME}. ` +
    'Confirm this email address to activate the account, then you can log in.';

  const note =
    'If you did not create this account, you can safely ignore this email. ' +
    `If this message landed in your spam folder, please move it to your inbox and mark it as "Not spam" so future ${APP_NAME} emails reach you.`;

  return sendEmail({
    to: email,
    subject: `Verify your ${APP_NAME} account email`,

    text: [
      greeting,
      '',
      message,
      '',
      `Verify your email address: ${verifyUrl}`,
      '',
      'This link will expire in 1 hour.',
      '',
      note,
      '',
      `Regards,`,
      `${APP_NAME}`,
      `Reply to this email if you need help.`,
    ].join('\n'),

    html: emailTemplate({
      title: 'Verify Your Email Address',
      greeting,
      message,
      buttonText: 'Verify my email address',
      actionUrl: verifyUrl,
      note,
      recipientEmail: email,
      preheader: `Confirm your email address to activate your ${APP_NAME} account.`,
    }),
  });
};

// Password reset
const sendPasswordResetEmail = async (email, token, username = '') => {
  const resetUrl = getClientUrl('/reset-password', token);

  const greeting = username ? `Hello ${username},` : 'Hello,';

  const message =
    `We received a request to reset the password for your ${APP_NAME} account. ` +
    'Use the link below to choose a new one.';

  const note =
    'If you did not request a password reset, ignore this email. Your password will not change unless you complete the reset process.';

  return sendEmail({
    to: email,
    subject: `Reset your ${APP_NAME} account password`,

    text: [
      greeting,
      '',
      message,
      '',
      `Choose a new password: ${resetUrl}`,
      '',
      'This link will expire in 1 hour.',
      '',
      note,
      '',
      `Regards,`,
      `${APP_NAME}`,
      `Reply to this email if you need help.`,
    ].join('\n'),

    html: emailTemplate({
      title: 'Reset Your Password',
      greeting,
      message,
      buttonText: 'Choose a new password',
      actionUrl: resetUrl,
      note,
      recipientEmail: email,
      preheader: `Set a new password for your ${APP_NAME} account.`,
    }),
  });
};

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
};
