import { apiClient } from './client';
import { LeadInventoryMatchResponse, ProjectMatchingLeadsResponse } from '../types/inventoryMatch';

export const inventoryMatchApi = {
  getMatchedInventoryForLead: async (leadId: number): Promise<LeadInventoryMatchResponse> => {
    const res = await apiClient.get<LeadInventoryMatchResponse>(`/projects/match-lead/${leadId}`);
    return res.data;
  },

  getMatchingLeadsForProject: async (projectId: number): Promise<ProjectMatchingLeadsResponse> => {
    const res = await apiClient.get<ProjectMatchingLeadsResponse>(`/projects/${projectId}/matching-leads`);
    return res.data;
  },
};
