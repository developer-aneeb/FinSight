/**
 * FinSight — Email Service
 */
import { getMailTransporter } from "../config/email";
import config from "../config";
import logger from "../utils/logger";
import { formatCurrency } from "../utils/formatCurrency";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

/** Send a generic email */
export async function sendEmail(options: EmailOptions): Promise<void> {
  const transporter = getMailTransporter();

  await transporter.sendMail({
    from: `"FinSight" <${config.email.user}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
  });

  logger.info("Email sent", { to: options.to, subject: options.subject });
}

/** Send a budget alert email */
export async function sendBudgetAlertEmail(
  to: string,
  budgetName: string,
  spent: number,
  limit: number,
  percentage: number
): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="margin: 0;">⚠️ Budget Alert</h1>
      </div>
      <div style="background: #fef2f2; padding: 20px; border: 1px solid #fecaca; border-radius: 0 0 8px 8px;">
        <p>Your budget <strong>${budgetName}</strong> has reached <strong>${percentage.toFixed(0)}%</strong> of its limit.</p>
        <table style="width: 100%; margin: 16px 0; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #fecaca;"><strong>Spent</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #fecaca; text-align: right; color: #dc2626;">${formatCurrency(spent)}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #fecaca;"><strong>Budget Limit</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #fecaca; text-align: right;">${formatCurrency(limit)}</td>
          </tr>
          <tr>
            <td style="padding: 8px;"><strong>Remaining</strong></td>
            <td style="padding: 8px; text-align: right; color: ${limit - spent > 0 ? "#16a34a" : "#dc2626"};">${formatCurrency(Math.max(0, limit - spent))}</td>
          </tr>
        </table>
        <p style="color: #6b7280; font-size: 14px;">Review your spending to stay within your budget.</p>
      </div>
      <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 20px;">
        FinSight — AI-Powered Personal Finance Manager
      </p>
    </body>
    </html>
  `;

  await sendEmail({ to, subject: `Budget Alert: ${budgetName} at ${percentage.toFixed(0)}%`, html });
}

/** Send a weekly summary email */
export async function sendWeeklySummaryEmail(
  to: string,
  summary: {
    totalIncome: number;
    totalExpenses: number;
    topCategories: { name: string; amount: number }[];
    transactionCount: number;
    startDate: string;
    endDate: string;
  }
): Promise<void> {
  const savings = summary.totalIncome - summary.totalExpenses;
  const topCategoriesHtml = summary.topCategories
    .map(
      (cat) =>
        `<tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${cat.name}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrency(cat.amount)}</td>
        </tr>`
    )
    .join("");

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #059669; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="margin: 0;">📊 Weekly Summary</h1>
        <p style="margin: 8px 0 0;">${summary.startDate} — ${summary.endDate}</p>
      </div>
      <div style="background: #f0fdf4; padding: 20px; border: 1px solid #bbf7d0; border-radius: 0 0 8px 8px;">
        <table style="width: 100%; margin-bottom: 16px; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #bbf7d0;"><strong>Total Income</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #bbf7d0; text-align: right; color: #16a34a;">${formatCurrency(summary.totalIncome)}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #bbf7d0;"><strong>Total Expenses</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #bbf7d0; text-align: right; color: #dc2626;">${formatCurrency(summary.totalExpenses)}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #bbf7d0;"><strong>Net Savings</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #bbf7d0; text-align: right; color: ${savings >= 0 ? "#16a34a" : "#dc2626"};">${formatCurrency(savings)}</td>
          </tr>
          <tr>
            <td style="padding: 8px;"><strong>Transactions</strong></td>
            <td style="padding: 8px; text-align: right;">${summary.transactionCount}</td>
          </tr>
        </table>
        ${
          summary.topCategories.length > 0
            ? `<h3 style="margin: 16px 0 8px;">Top Spending Categories</h3>
               <table style="width: 100%; border-collapse: collapse;">
                 ${topCategoriesHtml}
               </table>`
            : ""
        }
      </div>
      <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 20px;">
        FinSight — AI-Powered Personal Finance Manager
      </p>
    </body>
    </html>
  `;

  await sendEmail({ to, subject: `FinSight Weekly Summary (${summary.startDate} – ${summary.endDate})`, html });
}
