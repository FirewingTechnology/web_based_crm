import { apiClient } from './client';

export interface CallRecord {
  id: number;
  lead_id: number;
  executive_id: number;
  executive_name: string;
  phone_number: string;
  direction: string;
  call_status: string;
  outcome: string;
  duration_seconds: number;
  has_recording: boolean;
  recording_consent_obtained: boolean;
  ai_summary?: string;
  ai_next_action?: string;
  notes?: string;
  started_at: string;
  signed_playback_url?: string;
}

export interface CallLogPayload {
  lead_id: number;
  phone_number?: string;
  direction?: string;
  call_status?: string;
  outcome?: string;
  duration_seconds?: number;
  recording_url?: string;
  notes?: string;
  transcript_text?: string;
  ai_summary?: string;
  ai_next_action?: string;
  schedule_followup?: boolean;
  followup_hours?: number;
}

export const callsApi = {
  listCalls: async (leadId?: number): Promise<CallRecord[]> => {
    const res = await apiClient.get<CallRecord[]>('/calls', {
      params: leadId ? { lead_id: leadId } : {}
    });
    return res.data;
  },
  logCall: async (payload: CallLogPayload): Promise<CallRecord> => {
    const res = await apiClient.post<CallRecord>('/calls/log', payload);
    return res.data;
  }
};
