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

/**
 * Send "New workspace created" email to the workspace admin.
 * No-op if SMTP is not configured; does not throw.
 */
export async function sendWorkspaceCreatedEmail(
  to: string,
  workspaceName: string
): Promise<void> {
  const trans = getTransporter();
  if (!trans) return;
  const subject = `Your workspace "${workspaceName}" is ready`;
  const text = `Your new workspace "${workspaceName}" has been created. You can now log in to the workspace app with the credentials you received.`;
  const html = `
    <p>Your new workspace <strong>${escapeHtml(workspaceName)}</strong> has been created.</p>
    <p>You can now log in to the workspace app with the credentials you used during setup.</p>
    <p>If you have any questions, please contact your administrator.</p>
  `.trim();
  try {
    await trans.sendMail({
      from: DEFAULT_FROM,
      to,
      subject,
      text,
      html,
    });
  } catch (err) {
    console.error("[email] sendWorkspaceCreatedEmail failed:", err);
  }
}

/**
 * Send "Workspace disabled" email to the workspace admin.
 * No-op if SMTP is not configured; does not throw.
 */
export async function sendWorkspaceDisabledEmail(
  to: string,
  workspaceName: string
): Promise<void> {
  const trans = getTransporter();
  if (!trans) return;
  const subject = `Your workspace "${workspaceName}" has been disabled`;
  const text = `Your workspace "${workspaceName}" has been disabled by an administrator. You will not be able to log in to the workspace app until it is enabled again. Please contact your administrator if you have questions.`;
  const html = `
    <p>Your workspace <strong>${escapeHtml(workspaceName)}</strong> has been disabled by an administrator.</p>
    <p>You will not be able to log in to the workspace app until it is enabled again.</p>
    <p>Please contact your administrator if you have questions.</p>
  `.trim();
  try {
    await trans.sendMail({
      from: DEFAULT_FROM,
      to,
      subject,
      text,
      html,
    });
  } catch (err) {
    console.error("[email] sendWorkspaceDisabledEmail failed:", err);
  }
}

/**
 * Send "Workspace enabled" email to the workspace admin.
 * No-op if SMTP is not configured; does not throw.
 */
export async function sendWorkspaceEnabledEmail(
  to: string,
  workspaceName: string
): Promise<void> {
  const trans = getTransporter();
  if (!trans) return;
  const subject = `Your workspace "${workspaceName}" has been enabled`;
  const text = `Your workspace "${workspaceName}" has been enabled. You can now log in to the workspace app again.`;
  const html = `
    <p>Your workspace <strong>${escapeHtml(workspaceName)}</strong> has been enabled.</p>
    <p>You can now log in to the workspace app again.</p>
  `.trim();
  try {
    await trans.sendMail({
      from: DEFAULT_FROM,
      to,
      subject,
      text,
      html,
    });
  } catch (err) {
    console.error("[email] sendWorkspaceEnabledEmail failed:", err);
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
