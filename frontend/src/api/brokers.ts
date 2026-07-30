import { apiClient } from './client';
import { BrokerProfile, BrokerCreateInput } from '../types/broker';

export const brokersApi = {
  getBrokers: async (search?: string): Promise<BrokerProfile[]> => {
    const res = await apiClient.get<BrokerProfile[]>('/brokers', { params: { search } });
    return res.data;
  },
  createBroker: async (data: BrokerCreateInput): Promise<BrokerProfile> => {
    const res = await apiClient.post<BrokerProfile>('/brokers', data);
    return res.data;
  },
  updateBroker: async (id: number, data: Partial<BrokerCreateInput>): Promise<BrokerProfile> => {
    const res = await apiClient.put<BrokerProfile>(`/brokers/${id}`, data);
    return res.data;
  },
  deleteBroker: async (id: number): Promise<void> => {
    await apiClient.delete(`/brokers/${id}`);
  },
};
