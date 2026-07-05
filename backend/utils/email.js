const nodemailer = require('nodemailer');

/**
 * Sends an email containing the verification code.
 * Falls back to console log if SMTP settings are missing in Render environment variables.
 * 
 * @param {Object} options - Email options
 * @param {string} options.email - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.message - Text/HTML body content
 */
const sendEmail = async (options) => {
  const isSmtpConfigured = 
    process.env.SMTP_HOST && 
    process.env.SMTP_USER && 
    process.env.SMTP_PASS;

  if (isSmtpConfigured) {
    try {
      console.log(`[SMTP] Attempting to dispatch email to: ${options.email}...`);
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const mailOptions = {
        from: process.env.FROM_EMAIL || '"Project EARTH" <no-reply@projectearth.com>',
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: `<div style="font-family: sans-serif; max-width: 500px; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #6366f1;">Project EARTH Verification</h2>
          <p>${options.message.replace(/\n/g, '<br>')}</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <small style="color: #888;">This is an automated security message from Project EARTH. Please do not reply.</small>
        </div>`,
      };

      await transporter.sendMail(mailOptions);
      console.log(`[SMTP] Email successfully dispatched to: ${options.email}`);
      return true;
    } catch (error) {
      console.error(`[SMTP ERROR] Mail delivery failed: ${error.message}. Falling back to console logging.`);
    }
  }

  // --- Fallback Console Log Mode ---
  console.log('\n======================================================');
  console.log(`[MAIL SYSTEM - SECURE DISPATCH]`);
  console.log(`To:      ${options.email}`);
  console.log(`Subject: ${options.subject}`);
  console.log(`Body:    ${options.message}`);
  console.log('======================================================\n');
  return true;
};

module.exports = sendEmail;
