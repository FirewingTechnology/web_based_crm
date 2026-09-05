import { apiClient } from './client';
import { Commission } from '../types/booking';
import { 
  CommissionCommandCenterResponse, 
  CommissionItem, 
  CommissionStageUpdatePayload 
} from '../types/commissionLedger';

export const commissionsApi = {
  getCommissions: async (payoutStatus?: string): Promise<any[]> => {
    const res = await apiClient.get<any[]>('/commissions', { params: { payout_status: payoutStatus } });
    return res.data;
  },

  updateStatus: async (id: number, payoutStatus: string, remarks?: string): Promise<Commission> => {
    const res = await apiClient.put<Commission>(`/commissions/${id}`, { payout_status: payoutStatus, remarks });
    return res.data;
  },

  // Commission Command Center & Aging Ledger
  getCommandCenter: async (): Promise<CommissionCommandCenterResponse> => {
    const res = await apiClient.get<CommissionCommandCenterResponse>('/commissions/aging-summary');
    return res.data;
  },

  updateStage: async (id: number, payload: CommissionStageUpdatePayload): Promise<CommissionItem> => {
    const res = await apiClient.patch<CommissionItem>(`/commissions/${id}/stage`, payload);
    return res.data;
  },
};
