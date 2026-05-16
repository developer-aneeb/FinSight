import nodemailer from "nodemailer";
import env from "@config/env";

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: false,
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass,
    },
  });

  await transporter.sendMail({
    from: env.emailFrom,
    to,
    subject,
    html,
  });
}
