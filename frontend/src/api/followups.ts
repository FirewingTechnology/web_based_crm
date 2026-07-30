import { apiClient } from './client';
import { Followup, FollowupCreateInput } from '../types/followup';

export const followupsApi = {
  getFollowups: async (params?: {
    status?: string;
    type?: string;
    filter_period?: string;
    my_followups_only?: boolean;
  }): Promise<Followup[]> => {
    const res = await apiClient.get<Followup[]>('/followups', { params });
    return res.data;
  },
  createFollowup: async (data: FollowupCreateInput): Promise<Followup> => {
    const res = await apiClient.post<Followup>('/followups', data);
    return res.data;
  },
  updateFollowup: async (id: number, data: Partial<FollowupCreateInput> & { status?: string; outcome?: string }): Promise<Followup> => {
    const res = await apiClient.put<Followup>(`/followups/${id}`, data);
    return res.data;
  },
  deleteFollowup: async (id: number): Promise<void> => {
    await apiClient.delete(`/followups/${id}`);
  },
};
