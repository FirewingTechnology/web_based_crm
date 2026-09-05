import { apiClient } from './client';
import { RevenueAnalyticsResponse } from '../types/revenueAnalytics';

export const revenueAnalyticsApi = {
  getRevenueFunnel: async (timePeriod?: string): Promise<RevenueAnalyticsResponse> => {
    const res = await apiClient.get<RevenueAnalyticsResponse>('/reports/revenue-funnel', {
      params: { time_period: timePeriod },
    });
    return res.data;
  },
};
