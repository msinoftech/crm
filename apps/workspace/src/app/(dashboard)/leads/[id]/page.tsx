"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@crm/shared/hooks";
import { useEffect, useState } from "react";
import { Button } from "@crm/shared/ui";
import type { Lead, LeadActivity, LeadNote } from "@/lib/types";
import { EditLeadDrawer } from "../EditLeadDrawer";
import { RichTextEditor } from "@/components/RichTextEditor";

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function LeadDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const { client, workspace_id, user } = useAuth();
  const [lead, setLead] = useState<Lead | null>(null);
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [emailCc, setEmailCc] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [notes, setNotes] = useState<LeadNote[]>([]);
  const [noteMessage, setNoteMessage] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);
  const [popupNote, setPopupNote] = useState<LeadNote | null>(null);

  const isNoteLong = (message: string) => {
    const lines = message.split("\n").length;
    return lines > 3 || message.length > 180;
  };

  const fetchLead = async () => {
    if (!client || !id || workspace_id == null) return;
    const { data, error: e } = await client
      .from("leads")
      .select("*")
      .eq("id", id)
      .eq("workspace_id", workspace_id)
      .single();
    if (e) {
      setError(e.message);
      setLead(null);
      return;
    }
    setLead(data as Lead);
  };

  const fetchActivities = async () => {
    if (!client || !id || workspace_id == null) return;
    const { data, error: e } = await client
      .from("lead_activities")
      .select("*")
      .eq("lead_id", id)
      .eq("workspace_id", workspace_id)
      .order("created_at", { ascending: false });
    if (e) {
      setActivities([]);
      return;
    }
    setActivities((data ?? []) as LeadActivity[]);
  };

  const fetchNotes = async () => {
    if (!client || !id || workspace_id == null) return;
    const { data, error: e } = await client
      .from("lead_notes")
      .select("*")
      .eq("lead_id", id)
      .eq("workspace_id", workspace_id)
      .order("created_at", { ascending: false });
    if (e) {
      setNotes([]);
      return;
    }
    setNotes((data ?? []) as LeadNote[]);
  };

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setError("Invalid lead ID");
      return;
    }
    if (!client || workspace_id == null) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    Promise.all([fetchLead(), fetchActivities(), fetchNotes()]).finally(() =>
      setLoading(false)
    );
  }, [id, client, workspace_id]);

  const handleEditSuccess = () => {
    fetchLead();
    fetchActivities();
    setEditOpen(false);
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const toTrimmed = emailTo.trim();
    if (!toTrimmed) {
      setEmailError("To is required.");
      return;
    }
    if (!emailSubject.trim()) {
      setEmailError("Subject is required.");
      return;
    }
    if (!lead || !client || workspace_id == null) return;
    setSending(true);
    setEmailError(null);
    try {
      const res = await fetch(`/api/leads/${id}/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: emailTo,
          cc: emailCc || undefined,
          subject: emailSubject,
          message: emailMessage,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setEmailError(data.error ?? "Failed to send email.");
        setSending(false);
        return;
      }
      const { error: insertErr } = await client.from("lead_activities").insert({
        workspace_id,
        lead_id: id,
        type: "email_sent",
        description: `Email sent to ${toTrimmed.split(",").map((s) => s.trim()).filter(Boolean).join(", ")}`,
        metadata: {
          to: emailTo,
          cc: emailCc || null,
          subject: emailSubject,
        },
        created_by: user?.id ?? null,
      });
      if (insertErr) {
        setEmailError(insertErr.message);
      } else {
        setEmailTo("");
        setEmailCc("");
        setEmailSubject("");
        setEmailMessage("");
        fetchActivities();
      }
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : "Failed to send email.");
    } finally {
      setSending(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = noteMessage.trim();
    if (!trimmed || !client || !lead || workspace_id == null) return;
    setNoteSaving(true);
    setNoteError(null);
    const { error: noteErr } = await client.from("lead_notes").insert({
      workspace_id,
      lead_id: id,
      message: trimmed,
      created_by: user?.id ?? null,
    });
    if (noteErr) {
      setNoteError(noteErr.message);
      setNoteSaving(false);
      return;
    }
    const { error: activityErr } = await client.from("lead_activities").insert({
      workspace_id,
      lead_id: id,
      type: "note_added",
      description: "Note added",
      metadata: { message: trimmed.slice(0, 200) },
      created_by: user?.id ?? null,
    });
    if (activityErr) {
      setNoteError(activityErr.message);
    } else {
      setNoteMessage("");
      fetchNotes();
      fetchActivities();
    }
    setNoteSaving(false);
  };

  if (loading) {
    return (
      <div className="text-gray-500 py-8">Loading lead…</div>
    );
  }

  if (error || !lead) {
    return (
      <div className="space-y-4">
        <Link href="/leads" className="text-indigo-600 hover:underline text-sm">
          ← Back to leads
        </Link>
        <p className="text-red-600">{error ?? "Lead not found."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/leads" className="text-indigo-600 hover:underline text-sm">
          ← Back to leads
        </Link>
        <Button
          type="button"
          variant="primary"
          onClick={() => setEditOpen(true)}
          className="cursor-pointer"
        >
          Edit lead
        </Button>
      </div>

      {/* Lead details */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Lead details</h2>
        <dl className="grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium text-slate-500">Name</dt>
            <dd className="text-sm font-medium text-slate-900">{lead.name}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500">Company</dt>
            <dd className="text-sm text-slate-700">{lead.company ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500">Channel</dt>
            <dd className="text-sm text-slate-700 capitalize">{lead.channel ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500">Status</dt>
            <dd className="text-sm text-slate-700 capitalize">{lead.status}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500">Owner</dt>
            <dd className="text-sm text-slate-700">{lead.owner ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500">Email</dt>
            <dd className="text-sm text-slate-700">{lead.email}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500">Phone</dt>
            <dd className="text-sm text-slate-700">{lead.phone}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500">WhatsApp</dt>
            <dd className="text-sm text-slate-700">{lead.whatsapp ?? "—"}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium text-slate-500">Subject</dt>
            <dd className="text-sm text-slate-700">{lead.subject ?? "—"}</dd>
          </div>
          {lead.message && (
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium text-slate-500">Message</dt>
              <dd className="text-sm text-slate-700 whitespace-pre-wrap">{lead.message}</dd>
            </div>
          )}
          <div>
            <dt className="text-xs font-medium text-slate-500">Deal value</dt>
            <dd className="text-sm text-slate-700">
              {lead.deal_value != null ? String(lead.deal_value) : "—"}
            </dd>
          </div>
        </dl>
      </section>

      {/* Send email */}
      <section className="rounded-xl border border-slate-200 bg-gray-50/70 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Send email</h2>
        <form onSubmit={handleSendEmail} className="space-y-4">
          {emailError && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-800">
              {emailError}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              To <span className="text-red-500">*</span> (multiple with comma)
            </label>
            <input
              type="text"
              value={emailTo}
              onChange={(e) => setEmailTo(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="email1@example.com, email2@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              CC (multiple with comma)
            </label>
            <input
              type="text"
              value={emailCc}
              onChange={(e) => setEmailCc(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="cc@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Subject <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Email subject"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Message
            </label>
            <RichTextEditor
              value={emailMessage}
              onChange={setEmailMessage}
              placeholder="Compose your message…"
              className="min-h-[200px]"
            />
          </div>
          <div className="flex justify-end">
            <Button
              type="submit"
              variant="primary"
              disabled={sending}
              className="cursor-pointer disabled:opacity-50"
            >
              {sending ? "Sending…" : "Send email"}
            </Button>
          </div>
        </form>
      </section>

      {/* Notes */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Notes</h2>
        <form onSubmit={handleAddNote} className="space-y-4">
          {noteError && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-800">
              {noteError}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Message
            </label>
            <textarea
              value={noteMessage}
              onChange={(e) => setNoteMessage(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Add a note…"
            />
          </div>
          <div className="flex justify-end">
            <Button
              type="submit"
              variant="primary"
              disabled={noteSaving || !noteMessage.trim()}
              className="cursor-pointer disabled:opacity-50"
            >
              {noteSaving ? "Saving…" : "Save note"}
            </Button>
          </div>
        </form>
        {notes.length > 0 && (
          <ul className="mt-6 space-y-3 border-t border-slate-200 pt-4">
            {notes.map((note) => {
              const long = isNoteLong(note.message);
              return (
                <li
                  key={note.id}
                  className="flex flex-col gap-1 border-b border-slate-100 pb-3 last:border-0"
                >
                  <p
                    className={`text-sm text-slate-700 whitespace-pre-wrap ${long ? "line-clamp-3 overflow-hidden" : ""}`}
                  >
                    {note.message}
                  </p>
                  {long && (
                    <button
                      type="button"
                      onClick={() => setPopupNote(note)}
                      className="text-sm text-indigo-600 hover:underline text-left"
                    >
                      Read more
                    </button>
                  )}
                  <span className="text-xs text-slate-400">
                    {formatDate(note.created_at)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Activity log */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Activity</h2>
        {activities.length === 0 ? (
          <p className="text-sm text-slate-500">No activity yet.</p>
        ) : (
          <ul className="space-y-3">
            {activities.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-baseline gap-2 border-b border-slate-100 pb-3 last:border-0"
              >
                <span className="text-xs font-medium text-slate-500 uppercase">
                  {a.type}
                </span>
                <span className="text-sm text-slate-700">{a.description ?? "—"}</span>
                <span className="text-xs text-slate-400 ml-auto">
                  {formatDate(a.created_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <EditLeadDrawer
        open={editOpen}
        lead={lead}
        onClose={() => setEditOpen(false)}
        onSuccess={handleEditSuccess}
      />

      {/* Note full message popup */}
      {popupNote && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="note-popup-title"
          onClick={() => setPopupNote(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3 shrink-0">
              <h3 id="note-popup-title" className="text-sm font-semibold text-slate-900">
                Note
              </h3>
              <button
                type="button"
                onClick={() => setPopupNote(null)}
                className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </header>
            <div className="px-4 py-3 overflow-y-auto flex-1">
              <p className="text-sm text-slate-700 whitespace-pre-wrap">
                {popupNote.message}
              </p>
              <p className="text-xs text-slate-400 mt-2">
                {formatDate(popupNote.created_at)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
