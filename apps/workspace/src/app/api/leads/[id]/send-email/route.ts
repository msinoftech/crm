import { NextResponse } from "next/server";
import { sendMail } from "@/lib/email";

export interface SendEmailBody {
  to: string;
  cc?: string;
  subject: string;
  message: string;
}

function parseEmails(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: leadId } = await params;
    if (!leadId) {
      return NextResponse.json(
        { error: "Lead ID is required" },
        { status: 400 }
      );
    }
    const body = (await request.json()) as SendEmailBody;
    const { to, cc, subject, message } = body;
    if (!to || !subject || !message) {
      return NextResponse.json(
        { error: "To, subject, and message are required" },
        { status: 400 }
      );
    }
    const toList = parseEmails(to);
    const ccList = cc ? parseEmails(cc) : undefined;
    if (toList.length === 0) {
      return NextResponse.json(
        { error: "At least one To address is required" },
        { status: 400 }
      );
    }
    await sendMail({
      to: toList,
      cc: ccList,
      subject: subject.trim(),
      html: message,
      text: message.replace(/<[^>]*>/g, ""),
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[send-email]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to send email" },
      { status: 500 }
    );
  }
}
