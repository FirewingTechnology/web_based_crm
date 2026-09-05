import { apiClient } from './client';
import { SiteVisit, SiteVisitCreateInput, SiteVisitStatusUpdateInput } from '../types/siteVisit';

export const siteVisitsApi = {
  getSiteVisits: async (params?: {
    lead_id?: number;
    sales_executive_id?: number;
    status?: string;
  }): Promise<SiteVisit[]> => {
    const res = await apiClient.get<SiteVisit[]>('/site-visits', { params });
    return res.data;
  },

  getSiteVisit: async (id: number): Promise<SiteVisit> => {
    const res = await apiClient.get<SiteVisit>(`/site-visits/${id}`);
    return res.data;
  },

  createSiteVisit: async (data: SiteVisitCreateInput): Promise<SiteVisit> => {
    const res = await apiClient.post<SiteVisit>('/site-visits', data);
    return res.data;
  },

  updateSiteVisitStatus: async (id: number, data: SiteVisitStatusUpdateInput): Promise<SiteVisit> => {
    const res = await apiClient.patch<SiteVisit>(`/site-visits/${id}/status`, data);
    return res.data;
  },

  verifyOtp: async (id: number, otpCode: string): Promise<{ verified: boolean; message: string; status: string }> => {
    const res = await apiClient.post<{ verified: boolean; message: string; status: string }>(
      `/site-visits/${id}/verify-otp`,
      { otp_code: otpCode }
    );
    return res.data;
  }
};
