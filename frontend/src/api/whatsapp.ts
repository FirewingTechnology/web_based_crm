import { apiClient } from './client';
import { WhatsAppTemplate, WhatsAppMessage, WhatsAppSendMessagePayload } from '../types/whatsapp';

export const whatsappApi = {
  getTemplates: async (leadId?: number): Promise<WhatsAppTemplate[]> => {
    const res = await apiClient.get<WhatsAppTemplate[]>('/whatsapp/templates', {
      params: leadId ? { lead_id: leadId } : {}
    });
    return res.data;
  },

  sendMessage: async (payload: WhatsAppSendMessagePayload): Promise<WhatsAppMessage> => {
    const res = await apiClient.post<WhatsAppMessage>('/whatsapp/send', payload);
    return res.data;
  },

  getLeadMessages: async (leadId: number): Promise<WhatsAppMessage[]> => {
    const res = await apiClient.get<WhatsAppMessage[]>(`/whatsapp/lead/${leadId}/messages`);
    return res.data;
  },

  updateMessageStatus: async (messageId: number, status: 'SENT' | 'DELIVERED' | 'READ' | 'REPLIED'): Promise<WhatsAppMessage> => {
    const res = await apiClient.patch<WhatsAppMessage>(`/whatsapp/messages/${messageId}/status`, { status });
    return res.data;
  }
};
