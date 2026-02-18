export const LEAD_STATUSES = [
  { value: "new", label: "New", pillClass: "bg-blue-50 border-blue-200 text-blue-700" },
  { value: "contacted", label: "Contacted", pillClass: "bg-purple-50 border-purple-200 text-purple-700" },
  { value: "qualified", label: "Qualified", pillClass: "bg-amber-50 border-amber-200 text-amber-700" },
  { value: "proposal", label: "Proposal", pillClass: "bg-slate-100 border-slate-200 text-slate-700" },
  { value: "won", label: "Won", pillClass: "bg-green-50 border-green-200 text-green-700" },
  { value: "unqualified", label: "Un-Qualified", pillClass: "bg-red-50 border-amber-200 text-amber-700" },
  { value: "lost", label: "Lost", pillClass: "bg-red-50 border-red-200 text-red-700" },
] as const;

export const LEAD_STATUS_OPTIONS = LEAD_STATUSES.map(({ value, label }) => ({ value, label }));

export const LEAD_STATUS_VALUES = LEAD_STATUSES.map(s => s.value);

export type LeadStatus = typeof LEAD_STATUS_VALUES[number];

export const isValidLeadStatus = (status: string): status is LeadStatus =>
  LEAD_STATUS_VALUES.includes(status as LeadStatus);

export const getLeadStatusConfig = (status: LeadStatus) =>
  LEAD_STATUSES.find(s => s.value === status);

export const LEAD_STATUS_MAP = Object.fromEntries(
  LEAD_STATUSES.map(s => [s.value, s])
) as Record<LeadStatus, typeof LEAD_STATUSES[number]>;