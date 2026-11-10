import { config } from '../config.js';

/**
 * Brevo (formerly Sendinblue) Transactional Email Service.
 * Sends OTP codes and vacancy alerts via Brevo's v3 SMTP email API.
 */

const BREVO_API_ENDPOINT = 'https://api.brevo.com/v3/smtp/email';

/**
 * Helper to execute Brevo transactional email request.
 */
async function sendBrevoEmail({ to, subject, htmlContent, textContent }) {
  const apiKey = config.brevoApiKey;

  // Use mock mode if API key is not set or in test environment
  if (!apiKey || apiKey === 'mock-key' || config.nodeEnv === 'test') {
    console.log(`[EmailService:Brevo] (MOCK) Sent email "${subject}" to ${to}`);
    return { success: true, mock: true, messageId: `mock-${Date.now()}` };
  }

  try {
    const response = await fetch(BREVO_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: {
          name: config.emailFromName || 'Rommie',
          email: config.emailFrom || 'alerts@rommie.co.ke'
        },
        to: [{ email: to }],
        subject,
        htmlContent,
        textContent
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[EmailService:Brevo] API Error (${response.status}):`, errorText);
      return { success: false, error: errorText };
    }

    const data = await response.json();
    console.log(`[EmailService:Brevo] Dispatched email to ${to} (MessageId: ${data.messageId})`);
    return { success: true, messageId: data.messageId };
  } catch (err) {
    console.error(`[EmailService:Brevo] Network error dispatching to ${to}:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Send 6-digit email OTP verification code via Brevo.
 */
export async function sendOtpEmail(email, code) {
  const subject = `Your Rommie Verification Code: ${code}`;
  const textContent = `Your Rommie verification code is: ${code}. It expires in 5 minutes. If you did not request this, please ignore this email.`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f9fa; margin: 0; padding: 24px; }
          .card { max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid #e1e8ed; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
          .logo { font-size: 24px; font-weight: 800; color: #1e3a8a; margin-bottom: 24px; letter-spacing: -0.5px; }
          .heading { font-size: 20px; font-weight: 700; color: #111827; margin-bottom: 12px; }
          .description { font-size: 15px; color: #4b5563; line-height: 1.5; margin-bottom: 24px; }
          .code-box { background: #eff6ff; border: 2px dashed #3b82f6; border-radius: 8px; padding: 18px; text-align: center; font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #1d4ed8; margin-bottom: 24px; }
          .footer { font-size: 13px; color: #9ca3af; line-height: 1.4; border-top: 1px solid #f3f4f6; pt: 16px; margin-top: 24px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="logo">Rommie</div>
          <div class="heading">Verify Your Email Address</div>
          <div class="description">Use the 6-digit verification code below to complete your registration or sign in to Rommie.</div>
          <div class="code-box">${code}</div>
          <div class="description" style="font-size: 13px; color: #6b7280;">
            This code expires in <strong>5 minutes</strong>. For security, never share this code with anyone.
          </div>
          <div class="footer">
            If you did not request this verification code, you can safely ignore this email.
          </div>
        </div>
      </body>
    </html>
  `;

  console.log(`[EmailService:Brevo] Sending OTP code ${code} to ${email}`);
  const result = await sendBrevoEmail({ to: email, subject, htmlContent, textContent });
  return { ...result, code };
}

/**
 * Send Vacancy Alert notification email via Brevo.
 */
export async function sendVacancyAlertEmail(email, listing) {
  const title = listing?.title || 'New Accommodation Listing';
  const area = listing?.area || 'Near Campus';
  const rent = listing?.rentKes ? `KES ${listing.rentKes.toLocaleString()}` : '';
  const subject = `New Vacant Room in ${area}: ${title}`;
  const textContent = `A new vacant listing matching your alert criteria has been posted: ${title} in ${area} for ${rent}/month. View details on Rommie.`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f9fa; margin: 0; padding: 24px; }
          .card { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid #e1e8ed; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
          .logo { font-size: 24px; font-weight: 800; color: #1e3a8a; margin-bottom: 24px; }
          .badge { display: inline-block; background: #dcfce7; color: #15803d; font-size: 12px; font-weight: 700; padding: 4px 8px; border-radius: 4px; text-transform: uppercase; margin-bottom: 12px; }
          .title { font-size: 20px; font-weight: 700; color: #111827; margin-bottom: 8px; }
          .price { font-size: 18px; font-weight: 800; color: #2563eb; margin-bottom: 16px; }
          .btn { display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; font-weight: 600; padding: 12px 24px; border-radius: 8px; margin-top: 16px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="logo">Rommie</div>
          <div class="badge">Vacancy Alert Match</div>
          <div class="title">${title}</div>
          <div class="price">${rent}/month &bull; ${area}</div>
          <p style="color: #4b5563; font-size: 14px; line-height: 1.5;">${listing?.description || ''}</p>
          <a href="https://rommie.co.ke/rooms/${listing?.id || ''}" class="btn">View Room on Rommie</a>
        </div>
      </body>
    </html>
  `;

  console.log(`[EmailService:Brevo] Sending vacancy alert for listing "${title}" to ${email}`);
  return sendBrevoEmail({ to: email, subject, htmlContent, textContent });
}

export const emailService = {
  sendOtpEmail,
  sendVacancyAlertEmail
};

export default emailService;
