export type LeadStatus = "New" | "Contacted" | "Qualified" | "Site Visit Scheduled" | "Negotiation" | "Booked" | "Lost";
export type LeadPriority = "Low" | "Medium" | "High" | "Urgent";

export interface LeadNote {
  id: number;
  lead_id: number;
  created_by_id: number;
  author_name?: string;
  note_text: string;
  created_at: string;
}

export interface LeadStatusHistory {
  id: number;
  lead_id: number;
  changed_by_id: number;
  changed_by_name?: string;
  old_status?: string;
  new_status: string;
  remarks?: string;
  created_at: string;
}

export interface Lead {
  id: number;
  name: string;
  phone: string;
  email?: string;
  source: string;
  status: LeadStatus;
  priority: LeadPriority;
  budget_min?: number;
  budget_max?: number;
  preferred_location?: string;
  preferred_configuration?: string;
  preferred_project_id?: number | null;
  preferred_project_name?: string | null;
  assigned_to_id?: number;
  created_by_id?: number;
  assigned_to_name?: string;
  created_by_name?: string;
  tags?: string;
  created_at: string;
  updated_at: string;
  notes_list: LeadNote[];
  history_list: LeadStatusHistory[];
}

export interface LeadCreateInput {
  name: string;
  phone: string;
  email?: string;
  source?: string;
  status?: LeadStatus;
  priority?: LeadPriority;
  budget_min?: number;
  budget_max?: number;
  preferred_location?: string;
  preferred_configuration?: string;
  preferred_project_id?: number | null;
  assigned_to_id?: number;
  tags?: string;
  initial_note?: string;
}
