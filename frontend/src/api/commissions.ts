import { apiClient } from './client';
import { Commission } from '../types/booking';

export const commissionsApi = {
  getCommissions: async (payoutStatus?: string): Promise<any[]> => {
    const res = await apiClient.get<any[]>('/commissions', { params: { payout_status: payoutStatus } });
    return res.data;
  },
  updateStatus: async (id: number, payoutStatus: string, remarks?: string): Promise<Commission> => {
    const res = await apiClient.put<Commission>(`/commissions/${id}`, { payout_status: payoutStatus, remarks });
    return res.data;
  },
};
