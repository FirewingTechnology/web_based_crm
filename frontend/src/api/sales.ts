import { apiClient } from './client';
import { SalesTarget, SalesTargetCreateInput } from '../types/sales';

export const salesApi = {
  getSalesTargets: async (monthYear?: string, userId?: number): Promise<SalesTarget[]> => {
    const res = await apiClient.get<SalesTarget[]>('/sales/targets', { params: { month_year: monthYear, user_id: userId } });
    return res.data;
  },
  createSalesTarget: async (data: SalesTargetCreateInput): Promise<SalesTarget> => {
    const res = await apiClient.post<SalesTarget>('/sales/targets', data);
    return res.data;
  },
  updateSalesTarget: async (id: number, data: Partial<SalesTargetCreateInput>): Promise<SalesTarget> => {
    const res = await apiClient.put<SalesTarget>(`/sales/targets/${id}`, data);
    return res.data;
  },
};
