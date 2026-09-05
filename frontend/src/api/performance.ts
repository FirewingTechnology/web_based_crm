import { apiClient } from './client';
import { LeaderboardSummary, ExecutiveScorecard } from '../types/performance';

export const performanceApi = {
  getLeaderboard: async (monthYear?: string): Promise<LeaderboardSummary> => {
    const res = await apiClient.get<LeaderboardSummary>('/sales/leaderboard', {
      params: { month_year: monthYear },
    });
    return res.data;
  },

  getScorecard: async (userId: number, monthYear?: string): Promise<ExecutiveScorecard> => {
    const res = await apiClient.get<ExecutiveScorecard>(`/sales/scorecard/${userId}`, {
      params: { month_year: monthYear },
    });
    return res.data;
  },
};
