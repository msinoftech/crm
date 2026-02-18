"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@crm/shared/hooks";
import { Button } from "@crm/shared/ui";
import type { Lead, LeadUpdate } from "@/lib/types";
import { validateEmail, validatePhone, validateWhatsApp } from "@/lib/leadValidation";
import { LEAD_STATUS_OPTIONS } from "@/lib/constants";

const CHANNEL_OPTIONS = [
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "website", label: "Website" },
] as const;

type FormData = {
  name: string;
  company: string;
  channel: string;
  status: string;
  owner: string;
  email: string;
  phone: string;
  whatsapp: string;
  subject: string;
  message: string;
  deal_value: string | number;
};

function leadToFormData(lead: Lead): FormData {
  return {
    name: lead.name,
    company: lead.company ?? "",
    channel: lead.channel ?? "",
    status: lead.status,
    owner: lead.owner ?? "",
    email: lead.email,
    phone: lead.phone,
    whatsapp: lead.whatsapp ?? "",
    subject: lead.subject ?? "",
    message: lead.message ?? "",
    deal_value: lead.deal_value ?? "",
  };
}

export interface EditLeadDrawerProps {
  open: boolean;
  lead: Lead | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export function EditLeadDrawer({
  open,
  lead,
  onClose,
  onSuccess,
}: EditLeadDrawerProps) {
  const { client, user, workspace_id } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    name: "",
    company: "",
    channel: "",
    status: "new",
    owner: "",
    email: "",
    phone: "",
    whatsapp: "",
    subject: "",
    message: "",
    deal_value: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && lead) setFormData(leadToFormData(lead));
  }, [open, lead]);

  const handleClose = () => {
    setError(null);
    onClose();
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!client || !lead || workspace_id == null) {
      setError("Not authorized or lead not set.");
      return;
    }
    const { name, email, phone, whatsapp } = formData;
    if (!name?.trim()) {
      setError("Name is required.");
      return;
    }
    const emailErr = validateEmail(email ?? "");
    if (emailErr) {
      setError(emailErr);
      return;
    }
    const phoneErr = validatePhone(phone ?? "");
    if (phoneErr) {
      setError(phoneErr);
      return;
    }
    const whatsappErr = validateWhatsApp(whatsapp ?? "");
    if (whatsappErr) {
      setError(whatsappErr);
      return;
    }
    setSubmitting(true);
    setError(null);
    const update: LeadUpdate = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      company: formData.company?.trim() || null,
      channel: formData.channel?.trim() || null,
      status: formData.status || "new",
      owner: formData.owner?.trim() || null,
      whatsapp: formData.whatsapp?.trim() || null,
      subject: formData.subject?.trim() || null,
      message: formData.message?.trim() || null,
      deal_value:
        formData.deal_value === ""
          ? null
          : Number(formData.deal_value),
    };
    const { error: updateError } = await client
      .from("leads")
      .update(update)
      .eq("id", lead.id)
      .eq("workspace_id", workspace_id);
    if (updateError) {
      setError(updateError.message);
      setSubmitting(false);
      return;
    }
    const descParts: string[] = ["Lead updated"];
    if (update.status && update.status !== lead.status)
      descParts.push(`status to ${update.status}`);
    if (update.name && update.name !== lead.name) descParts.push("name");
    await client.from("lead_activities").insert({
      workspace_id: lead.workspace_id,
      lead_id: lead.id,
      type: "updated",
      description: descParts.join("; "),
      metadata: update as Record<string, unknown>,
      created_by: user?.id ?? null,
    });
    handleClose();
    onSuccess?.();
    setSubmitting(false);
  }

  if (!open || !lead) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex justify-end transition-opacity duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-lead-drawer-title"
    >
      <div
        className="absolute inset-0 bg-black/40 transition-opacity duration-300"
        aria-hidden="true"
        onClick={handleClose}
      />
      <section
        className="relative h-full w-full max-w-xl bg-white shadow-2xl flex flex-col transform transition-transform duration-300 translate-x-0 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-gray-200 px-6 py-4 shrink-0">
          <h2 id="edit-lead-drawer-title" className="text-xl font-bold text-slate-900">
            Edit Lead
          </h2>
          <button
            type="button"
            className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 cursor-pointer"
            aria-label="Close"
            onClick={handleClose}
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-6">
          <form
            onSubmit={handleSubmit}
            className="grid gap-4 p-5 rounded-xl border border-slate-200 bg-gray-50/70"
          >
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Lead name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Company
              </label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, company: e.target.value }))
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Company name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Channel
              </label>
              <select
                value={formData.channel}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, channel: e.target.value }))
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select channel</option>
                {CHANNEL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, status: e.target.value }))
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {LEAD_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Owner
              </label>
              <input
                type="text"
                value={formData.owner}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, owner: e.target.value }))
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Owner name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="email@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, phone: e.target.value }))
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Phone number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                WhatsApp Number
              </label>
              <input
                type="text"
                value={formData.whatsapp}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, whatsapp: e.target.value }))
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="WhatsApp number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Subject
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, subject: e.target.value }))
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Subject"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Message
              </label>
              <textarea
                value={formData.message}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, message: e.target.value }))
                }
                rows={3}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Message or notes"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Deal Value
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.deal_value === "" ? "" : formData.deal_value}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    deal_value: e.target.value === "" ? "" : e.target.value,
                  }))
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="0.00"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={submitting}
                className="cursor-pointer disabled:opacity-50"
              >
                {submitting ? "Saving…" : "Save"}
              </Button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
