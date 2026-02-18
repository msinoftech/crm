export interface Lead {
  id: string;
  workspace_id: number;
  name: string;
  company: string | null;
  channel: string | null;
  status: string;
  owner: string | null;
  email: string;
  phone: string;
  whatsapp: string | null;
  subject: string | null;
  message: string | null;
  deal_value: number | null;
  disabled: boolean;
  created_at: string;
}

export type LeadInsert = Omit<Lead, "id" | "created_at"> & {
  id?: string;
  created_at?: string;
};

export type LeadUpdate = Partial<Omit<Lead, "id" | "workspace_id" | "created_at">>;

export interface LeadActivity {
  id: string;
  workspace_id: number;
  lead_id: string;
  type: string;
  description: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  created_by: string | null;
}

export type LeadActivityInsert = Omit<LeadActivity, "id" | "created_at"> & {
  id?: string;
  created_at?: string;
};

export interface LeadNote {
  id: string;
  workspace_id: number;
  lead_id: string;
  message: string;
  created_at: string;
  created_by: string | null;
}

export type LeadNoteInsert = Omit<LeadNote, "id" | "created_at"> & {
  id?: string;
  created_at?: string;
};

export interface WorkspaceApiKey {
  id: string;
  workspace_id: number;
  name: string | null;
  key_hash: string;
  key_prefix: string;
  allowed_origins: string[];
  created_at: string;
}

export type WorkspaceApiKeyInsert = Omit<WorkspaceApiKey, "id" | "created_at"> & {
  id?: string;
  created_at?: string;
};
