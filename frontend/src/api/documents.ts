import { apiClient } from './client';
import { 
  BuyerDocument, 
  BuyerKYCSummary, 
  BuyerDocumentCreateInput, 
  BuyerDocumentVerifyInput 
} from '../types/document';

export const documentsApi = {
  getLeadKYCSummary: async (leadId: number): Promise<BuyerKYCSummary> => {
    const res = await apiClient.get<BuyerKYCSummary>(`/documents/lead/${leadId}`);
    return res.data;
  },

  uploadDocument: async (payload: BuyerDocumentCreateInput): Promise<BuyerDocument> => {
    const res = await apiClient.post<BuyerDocument>('/documents', payload);
    return res.data;
  },

  verifyDocument: async (documentId: number, payload: BuyerDocumentVerifyInput): Promise<BuyerDocument> => {
    const res = await apiClient.patch<BuyerDocument>(`/documents/${documentId}/verify`, payload);
    return res.data;
  },

  deleteDocument: async (documentId: number): Promise<{ message: string }> => {
    const res = await apiClient.delete<{ message: string }>(`/documents/${documentId}`);
    return res.data;
  },
};
