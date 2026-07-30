import { apiClient } from './client';
import { DashboardStats, MonthlySalesChart, LeadSourceDistribution, LeadStatusDistribution } from '../types/report';

export const reportsApi = {
  getDashboardStats: async (): Promise<DashboardStats> => {
    const res = await apiClient.get<DashboardStats>('/reports/dashboard-stats');
    return res.data;
  },
  getMonthlySales: async (): Promise<MonthlySalesChart[]> => {
    const res = await apiClient.get<MonthlySalesChart[]>('/reports/monthly-sales');
    return res.data;
  },
  getLeadSources: async (): Promise<LeadSourceDistribution[]> => {
    const res = await apiClient.get<LeadSourceDistribution[]>('/reports/lead-sources');
    return res.data;
  },
  getLeadStatuses: async (): Promise<LeadStatusDistribution[]> => {
    const res = await apiClient.get<LeadStatusDistribution[]>('/reports/lead-statuses');
    return res.data;
  },
  exportReportCSV: async (reportType: string): Promise<void> => {
    const res = await apiClient.get(`/reports/export/${reportType}`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${reportType}_report.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
};
