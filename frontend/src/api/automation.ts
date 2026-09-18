import { apiClient } from './client';

export interface AutomationRule {
  id: number;
  organization_id?: number;
  name: string;
  description?: string;
  trigger_event: string;
  conditions_json: Array<{
    field: string;
    operator: string;
    value: any;
  }>;
  actions_json: Array<{
    action_type: string;
    target_field?: string;
    value: any;
  }>;
  is_active: boolean;
  execution_count: number;
  last_triggered_at?: string;
  created_at: string;
}

export const automationApi = {
  getRules: async (): Promise<AutomationRule[]> => {
    const res = await apiClient.get<AutomationRule[]>('/automation/rules');
    return res.data;
  },
  createRule: async (data: Partial<AutomationRule>): Promise<AutomationRule> => {
    const res = await apiClient.post<AutomationRule>('/automation/rules', data);
    return res.data;
  },
  updateRule: async (id: number, data: Partial<AutomationRule>): Promise<AutomationRule> => {
    const res = await apiClient.put<AutomationRule>(`/automation/rules/${id}`, data);
    return res.data;
  },
  deleteRule: async (id: number): Promise<{ message: string }> => {
    const res = await apiClient.delete(`/automation/rules/${id}`);
    return res.data;
  },
  triggerSlaCheck: async (): Promise<{ message: string; evaluated_leads: number }> => {
    const res = await apiClient.post('/automation/sla/trigger-check');
    return res.data;
  }
};
