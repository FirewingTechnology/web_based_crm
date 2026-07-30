export type FollowupType = "Call" | "WhatsApp" | "Meeting" | "Site Visit" | "Task" | "Reminder";
export type FollowupStatus = "Pending" | "Completed" | "Overdue" | "Cancelled";

export interface Followup {
  id: number;
  lead_id: number;
  assigned_to_id: number;
  type: FollowupType;
  status: FollowupStatus;
  title: string;
  scheduled_at: string;
  completed_at?: string;
  notes?: string;
  outcome?: string;
  lead_name?: string;
  lead_phone?: string;
  assigned_to_name?: string;
  created_at: string;
  updated_at: string;
}

export interface FollowupCreateInput {
  lead_id: number;
  assigned_to_id: number;
  type: FollowupType;
  title: string;
  scheduled_at: string;
  notes?: string;
}
