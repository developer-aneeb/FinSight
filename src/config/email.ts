/**
 * FinSight — Email (Nodemailer) Configuration
 */
import nodemailer, { Transporter } from "nodemailer";
import config from "./index";

let transporter: Transporter | null = null;

export function getMailTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: false,
      auth: {
        user: config.email.user,
        pass: config.email.pass,
      },
    });
  }
  return transporter;
}
