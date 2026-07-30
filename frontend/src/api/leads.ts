import { apiClient } from './client';
import { Lead, LeadCreateInput, LeadNote } from '../types/lead';

export const leadsApi = {
  getLeads: async (params?: {
    status?: string;
    priority?: string;
    source?: string;
    assigned_to_id?: number;
    search?: string;
    my_leads_only?: boolean;
  }): Promise<Lead[]> => {
    const res = await apiClient.get<Lead[]>('/leads', { params });
    return res.data;
  },
  getLead: async (id: number): Promise<Lead> => {
    const res = await apiClient.get<Lead>(`/leads/${id}`);
    return res.data;
  },
  createLead: async (data: LeadCreateInput): Promise<Lead> => {
    const res = await apiClient.post<Lead>('/leads', data);
    return res.data;
  },
  updateLead: async (id: number, data: Partial<LeadCreateInput>): Promise<Lead> => {
    const res = await apiClient.put<Lead>(`/leads/${id}`, data);
    return res.data;
  },
  deleteLead: async (id: number): Promise<void> => {
    await apiClient.delete(`/leads/${id}`);
  },
  addNote: async (leadId: number, noteText: string): Promise<LeadNote> => {
    const res = await apiClient.post<LeadNote>(`/leads/${leadId}/notes`, { note_text: noteText });
    return res.data;
  },
  importCSV: async (file: File): Promise<{ message: string; count: number }> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post<{ message: string; count: number }>('/leads/import-csv', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  exportCSV: async (): Promise<void> => {
    const res = await apiClient.get('/leads/export-csv', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'brokeros_leads_export.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
};
