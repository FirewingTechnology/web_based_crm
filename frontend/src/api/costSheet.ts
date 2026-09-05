import { apiClient } from './client';
import { 
  CostSheetCalculateRequest, 
  CostSheetResponse, 
  QuickBookFromCostSheetRequest 
} from '../types/costSheet';
import { Booking } from '../types/booking';

export const costSheetApi = {
  getProjectDefaults: async (projectId: number): Promise<any> => {
    const res = await apiClient.get(`/bookings/cost-sheet/defaults/${projectId}`);
    return res.data;
  },

  calculateCostSheet: async (payload: CostSheetCalculateRequest): Promise<CostSheetResponse> => {
    const res = await apiClient.post<CostSheetResponse>('/bookings/cost-sheet/calculate', payload);
    return res.data;
  },

  quickBookFromCostSheet: async (payload: QuickBookFromCostSheetRequest): Promise<Booking> => {
    const res = await apiClient.post<Booking>('/bookings/cost-sheet/quick-book', payload);
    return res.data;
  },
};
