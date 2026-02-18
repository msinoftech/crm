import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  transporter = nodemailer.createTransport({
    host,
    port: port ? parseInt(port, 10) : 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: { user, pass },
  });
  return transporter;
}

const DEFAULT_FROM =
  process.env.MAIL_FROM ?? process.env.SMTP_USER ?? "noreply@getsettime.com";

export interface SendMailOptions {
  to: string | string[];
  cc?: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
}

/**
 * Send an email. No-op if SMTP is not configured; logs and does not throw on failure.
 */
export async function sendMail(options: SendMailOptions): Promise<void> {
  const trans = getTransporter();
  if (!trans) return;
  const to = Array.isArray(options.to) ? options.to.join(", ") : options.to;
  const cc = options.cc
    ? (Array.isArray(options.cc) ? options.cc.join(", ") : options.cc)
    : undefined;
  try {
    await trans.sendMail({
      from: options.from ?? DEFAULT_FROM,
      to,
      cc,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });
  } catch (err) {
    console.error("[email] sendMail failed:", err);
  }
}
