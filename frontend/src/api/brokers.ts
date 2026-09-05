import { apiClient } from './client';
import { 
  BrokerProfile, 
  BrokerCreateInput, 
  BrokerTierConfig, 
  ProjectCollateral, 
  CoBrokingDeal, 
  CoBrokingDealCreateInput 
} from '../types/broker';

export const brokersApi = {
  getBrokers: async (search?: string): Promise<BrokerProfile[]> => {
    const res = await apiClient.get<BrokerProfile[]>('/brokers', { params: { search } });
    return res.data;
  },

  getBroker: async (id: number): Promise<BrokerProfile> => {
    const res = await apiClient.get<BrokerProfile>(`/brokers/${id}`);
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

  // CP Collaboration & Revenue Tiers
  getBrokerTiers: async (): Promise<BrokerTierConfig[]> => {
    const res = await apiClient.get<BrokerTierConfig[]>('/brokers/tiers');
    return res.data;
  },

  updateBrokerTier: async (id: number, tier?: string): Promise<BrokerProfile> => {
    const res = await apiClient.patch<BrokerProfile>(`/brokers/${id}/tier`, tier ? { tier } : {});
    return res.data;
  },

  getBrokerCollaterals: async (brokerId: number): Promise<ProjectCollateral[]> => {
    const res = await apiClient.get<ProjectCollateral[]>(`/brokers/${brokerId}/collaterals`);
    return res.data;
  },

  // Co-Broking Deals
  getCoBrokingDeals: async (): Promise<CoBrokingDeal[]> => {
    const res = await apiClient.get<CoBrokingDeal[]>('/brokers/co-broking');
    return res.data;
  },

  createCoBrokingDeal: async (data: CoBrokingDealCreateInput): Promise<CoBrokingDeal> => {
    const res = await apiClient.post<CoBrokingDeal>('/brokers/co-broking', data);
    return res.data;
  }
};
