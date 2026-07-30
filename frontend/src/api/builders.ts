import { apiClient } from './client';
import { Builder, BuilderCreateInput } from '../types/builder';

export const buildersApi = {
  getBuilders: async (search?: string): Promise<Builder[]> => {
    const res = await apiClient.get<Builder[]>('/builders', { params: { search } });
    return res.data;
  },
  getBuilder: async (id: number): Promise<Builder> => {
    const res = await apiClient.get<Builder>(`/builders/${id}`);
    return res.data;
  },
  createBuilder: async (data: BuilderCreateInput): Promise<Builder> => {
    const res = await apiClient.post<Builder>('/builders', data);
    return res.data;
  },
  updateBuilder: async (id: number, data: Partial<BuilderCreateInput>): Promise<Builder> => {
    const res = await apiClient.put<Builder>(`/builders/${id}`, data);
    return res.data;
  },
  deleteBuilder: async (id: number): Promise<void> => {
    await apiClient.delete(`/builders/${id}`);
  },
};
