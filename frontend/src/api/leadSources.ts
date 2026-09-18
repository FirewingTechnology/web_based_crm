import { apiClient } from './client';

export interface LeadSourceIntegration {
  id: number;
  organization_id?: number;
  source_type: string;
  name: string;
  is_active: boolean;
  credentials_json?: Record<string, any>;
  routing_strategy: string;
  default_assigned_user_id?: number;
  total_leads_ingested: number;
  last_lead_at?: string;
  webhook_secret?: string;
  created_at: string;
}

export interface LeadSourceEvent {
  id: number;
  source_type: string;
  external_event_id?: string;
  lead_id?: number;
  status: string;
  error_message?: string;
  created_at: string;
}

export const leadSourcesApi = {
  getIntegrations: async (): Promise<LeadSourceIntegration[]> => {
    const res = await apiClient.get<LeadSourceIntegration[]>('/lead-sources');
    return res.data;
  },
  createIntegration: async (data: Partial<LeadSourceIntegration>): Promise<LeadSourceIntegration> => {
    const res = await apiClient.post<LeadSourceIntegration>('/lead-sources', data);
    return res.data;
  },
  updateIntegration: async (id: number, data: Partial<LeadSourceIntegration>): Promise<LeadSourceIntegration> => {
    const res = await apiClient.put<LeadSourceIntegration>(`/lead-sources/${id}`, data);
    return res.data;
  },
  deleteIntegration: async (id: number): Promise<{ message: string }> => {
    const res = await apiClient.delete(`/lead-sources/${id}`);
    return res.data;
  },
  getAuditLogs: async (params?: { source_type?: string; limit?: number }): Promise<LeadSourceEvent[]> => {
    const res = await apiClient.get<LeadSourceEvent[]>('/lead-sources/events/logs', { params });
    return res.data;
  }
};
