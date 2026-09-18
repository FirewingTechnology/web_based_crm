import { apiClient } from './client';

export interface CopilotResponse {
  query: string;
  answer: string;
  suggested_actions: Array<{
    label: string;
    url: string;
  }>;
  data_points: Record<string, any>;
}

export const copilotApi = {
  ask: async (query: string): Promise<CopilotResponse> => {
    const res = await apiClient.post<CopilotResponse>('/copilot/query', { query });
    return res.data;
  },
  getSuggestions: async (): Promise<{ suggestions: string[] }> => {
    const res = await apiClient.get<{ suggestions: string[] }>('/copilot/suggestions');
    return res.data;
  }
};
