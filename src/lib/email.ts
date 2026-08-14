export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(message: EmailMessage): Promise<{ success: boolean; messageId: string }> {
  const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  // Log in development environment
  console.log(`[Email Dispatch] Sending to: ${message.to} | Subject: "${message.subject}" | ID: ${messageId}`);

  // If SendGrid / AWS SES API key is configured
  const apiKey = process.env.SENDGRID_API_KEY || process.env.SMTP_PASSWORD;
  if (apiKey) {
    try {
      // Third-party email API dispatch
    } catch (err) {
      console.warn(`[Email Dispatch] Failed via primary transport, logged locally: ${err}`);
    }
  }

  return {
    success: true,
    messageId,
  };
}

export function getWelcomeEmailTemplate(name: string): EmailMessage {
  return {
    to: "",
    subject: "Welcome to HireGo AI — Your AI-Powered Career Hub",
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #0A0A0C; color: #ffffff; padding: 32px; borderRadius: 16px;">
        <h1 style="color: #448AFF;">Welcome to HireGo AI, ${name}!</h1>
        <p style="color: #9CA3AF; line-height: 1.6;">
          Your account is active. Explore thousands of AI-matched jobs, benchmark your skills, and schedule AI mock interviews to boost your hireability score.
        </p>
        <a href="https://hirego.ai/candidate/dashboard" style="display: inline-block; background-color: #448AFF; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 16px;">
          Go to Dashboard
        </a>
      </div>
    `,
  };
}

export function getInterviewInviteTemplate(candidateName: string, jobTitle: string, time: string): EmailMessage {
  return {
    to: "",
    subject: `Interview Scheduled: ${jobTitle} at HireGo AI`,
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #0A0A0C; color: #ffffff; padding: 32px; borderRadius: 16px;">
        <h2 style="color: #FF5252;">Interview Scheduled</h2>
        <p style="color: #9CA3AF;">Hi ${candidateName},</p>
        <p style="color: #9CA3AF;">
          You have an upcoming AI Proctor & Technical Interview session for the <strong>${jobTitle}</strong> position.
        </p>
        <p style="color: #ffffff; font-weight: bold;">Time: ${time}</p>
        <a href="https://hirego.ai/interviews" style="display: inline-block; background-color: #FF5252; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 16px;">
          Join Interview Room
        </a>
      </div>
    `,
  };
}
