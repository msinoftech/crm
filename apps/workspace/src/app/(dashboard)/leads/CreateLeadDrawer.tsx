"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@crm/shared/hooks";
import { Button } from "@crm/shared/ui";
import type { LeadInsert } from "@/lib/types";
import { validateEmail, validatePhone, validateWhatsApp } from "@/lib/leadValidation";
import { LEAD_STATUS_OPTIONS } from "@/lib/constants";

const CHANNEL_OPTIONS = [
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "website", label: "Website" },
] as const;

type ErrorField = "name" | "email" | "phone" | "whatsapp" | null;

export interface CreateLeadDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const emptyForm = {
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
  deal_value: "" as string | number,
};

export function CreateLeadDrawer({
  open,
  onClose,
  onSuccess,
}: CreateLeadDrawerProps) {
  const { client, workspace_id, user } = useAuth();
  const [formData, setFormData] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [errorField, setErrorField] = useState<ErrorField>(null);
  const [submitting, setSubmitting] = useState(false);
  const refName = useRef<HTMLInputElement>(null);
  const refEmail = useRef<HTMLInputElement>(null);
  const refPhone = useRef<HTMLInputElement>(null);
  const refWhatsapp = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!error || !errorField) return;
    const ref =
      errorField === "name"
        ? refName
        : errorField === "email"
          ? refEmail
          : errorField === "phone"
            ? refPhone
            : refWhatsapp;
    ref.current?.focus();
  }, [error, errorField]);

  const resetForm = () => {
    setFormData(emptyForm);
    setError(null);
    setErrorField(null);
  };

  const inputClass = (field: ErrorField) =>
    `w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
      errorField === field
        ? "border-red-500 focus:ring-red-500 focus:border-red-500"
        : "border-slate-300"
    }`;

  const handleClose = () => {
    resetForm();
    onClose();
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!client || workspace_id == null) {
      setError("Not authorized or workspace not set.");
      setErrorField(null);
      return;
    }
    const { name, email, phone, whatsapp } = formData;
    if (!name?.trim()) {
      setError("Name is required.");
      setErrorField("name");
      return;
    }
    const emailErr = validateEmail(email ?? "");
    if (emailErr) {
      setError(emailErr);
      setErrorField("email");
      return;
    }
    const phoneErr = validatePhone(phone ?? "");
    if (phoneErr) {
      setError(phoneErr);
      setErrorField("phone");
      return;
    }
    const whatsappErr = validateWhatsApp(whatsapp ?? "");
    if (whatsappErr) {
      setError(whatsappErr);
      setErrorField("whatsapp");
      return;
    }
    setSubmitting(true);
    setError(null);
    setErrorField(null);
    const row: LeadInsert = {
      workspace_id,
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
      disabled: false,
    };
    const { data: inserted, error: insertError } = await client
      .from("leads")
      .insert(row)
      .select("id")
      .single();
    if (insertError) {
      setError(insertError.message);
      setErrorField(null);
      setSubmitting(false);
      return;
    }
    if (inserted?.id && workspace_id != null) {
      await client.from("lead_activities").insert({
        workspace_id,
        lead_id: inserted.id,
        type: "created",
        description: "Lead created",
        metadata: null,
        created_by: user?.id ?? null,
      });
    }
    handleClose();
    onSuccess?.();
    setSubmitting(false);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex justify-end transition-opacity duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lead-drawer-title"
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
          <h2 id="lead-drawer-title" className="text-xl font-bold text-slate-900">
            Create New Lead
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
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                ref={refName}
                type="text"
                value={formData.name}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, name: e.target.value }));
                  if (errorField === "name") {
                  setError(null);
                  setErrorField(null);
                }
                }}
                className={inputClass("name")}
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
                ref={refEmail}
                type="email"
                value={formData.email}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, email: e.target.value }));
                  if (errorField === "email") {
                  setError(null);
                  setErrorField(null);
                }
                }}
                className={inputClass("email")}
                placeholder="email@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Phone <span className="text-red-500">*</span>
              </label>
              <input
                ref={refPhone}
                type="text"
                value={formData.phone}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, phone: e.target.value }));
                  if (errorField === "phone") {
                  setError(null);
                  setErrorField(null);
                }
                }}
                className={inputClass("phone")}
                placeholder="Phone number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                WhatsApp Number
              </label>
              <input
                ref={refWhatsapp}
                type="text"
                value={formData.whatsapp}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, whatsapp: e.target.value }));
                  if (errorField === "whatsapp") {
                  setError(null);
                  setErrorField(null);
                }
                }}
                className={inputClass("whatsapp")}
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

            <div className="flex flex-wrap items-center justify-end gap-3 pt-4">
              {error && (
                <span className="text-red-600 text-sm flex-1 min-w-0">
                  {error}
                </span>
              )}
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
                {submitting ? "Creating…" : "Create"}
              </Button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
