import { apiClient } from './client';
import { NotificationItem, ActivityLogItem } from '../types/report';

export const notificationsApi = {
  getNotifications: async (): Promise<NotificationItem[]> => {
    const res = await apiClient.get<NotificationItem[]>('/notifications');
    return res.data;
  },
  markRead: async (id: number): Promise<NotificationItem> => {
    const res = await apiClient.put<NotificationItem>(`/notifications/${id}/read`);
    return res.data;
  },
  markAllRead: async (): Promise<void> => {
    await apiClient.put('/notifications/read-all');
  },
  getActivityLogs: async (module?: string): Promise<ActivityLogItem[]> => {
    const res = await apiClient.get<ActivityLogItem[]>('/activity-logs', { params: { module } });
    return res.data;
  },
};
