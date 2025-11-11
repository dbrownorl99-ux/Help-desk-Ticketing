import nodemailer from "nodemailer";

// simple ticket id generator you already use
export function genTicketId(): string {
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `HDK-${random}`;
}

interface SendEmailOptions {
  to: string;
  from: string;
  subject: string;
  html: string;
}

export async function sendAlertEmail({ to, from, subject, html }: SendEmailOptions) {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.error("SMTP environment variables are missing, cannot send email.");
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for 587/25
    auth: {
      user,
      pass
    }
  });

  await transporter.sendMail({
    from,
    to,
    subject,
    html
  });
}
