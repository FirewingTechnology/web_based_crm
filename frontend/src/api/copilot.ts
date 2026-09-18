import { apiClient } from './client';

export interface CopilotResponse {
  query: string;
  answer: string;
  suggested_actions: Array<{
    label: string;
    url: string;
  }>;
  data_points: Record<string, any>;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface SupportTicket {
  id: number;
  subject: string;
  status: 'OPEN' | 'ASSIGNED' | 'RESOLVED' | 'CLOSED';
  requester_name: string;
  requester_email: string;
  requester_role: string;
  organization_id: number;
  assigned_agent_name: string | null;
  assigned_agent_id: number | null;
  created_at: string;
  resolved_at: string | null;
  message_count: number;
}

export interface SupportMessage {
  id: number;
  sender_role: 'AI' | 'EXECUTIVE' | 'AGENT';
  sender_name: string;
  message: string;
  created_at: string;
}

export interface TicketThread {
  ticket_id: number;
  status: string;
  subject: string;
  assigned_agent: string | null;
  messages: SupportMessage[];
}

export interface SupportAgent {
  id: number;
  name: string;
  email: string;
  role: string;
}

export const copilotApi = {
  // ── AI Copilot ────────────────────────────────────────────────────────────
  ask: async (query: string, history: ChatMessage[] = []): Promise<CopilotResponse> => {
    const res = await apiClient.post<CopilotResponse>('/copilot/query', { query, history });
    return res.data;
  },

  // ── Support Tickets ───────────────────────────────────────────────────────
  requestSupport: async (subject?: string): Promise<{ ticket_id: number; status: string; message: string; assigned_agent: string | null }> => {
    const res = await apiClient.post('/copilot/support/request', { subject: subject || 'I need help from a human agent' });
    return res.data;
  },

  getMyTicket: async (): Promise<{ ticket: (TicketThread & { id: number; assigned_agent_id: number | null; created_at: string }) | null }> => {
    const res = await apiClient.get('/copilot/support/my-ticket');
    return res.data;
  },

  getTickets: async (statusFilter?: string): Promise<{ tickets: SupportTicket[]; total: number }> => {
    const params = statusFilter ? { status_filter: statusFilter } : {};
    const res = await apiClient.get('/copilot/support/tickets', { params });
    return res.data;
  },

  assignTicket: async (ticketId: number, agentId: number): Promise<{ message: string; agent_name: string }> => {
    const res = await apiClient.post(`/copilot/support/tickets/${ticketId}/assign`, { agent_id: agentId });
    return res.data;
  },

  sendSupportMessage: async (ticketId: number, message: string): Promise<SupportMessage> => {
    const res = await apiClient.post(`/copilot/support/tickets/${ticketId}/message`, { message });
    return res.data;
  },

  getTicketMessages: async (ticketId: number): Promise<TicketThread> => {
    const res = await apiClient.get(`/copilot/support/tickets/${ticketId}/messages`);
    return res.data;
  },

  resolveTicket: async (ticketId: number): Promise<{ message: string }> => {
    const res = await apiClient.post(`/copilot/support/tickets/${ticketId}/resolve`);
    return res.data;
  },

  getAgents: async (): Promise<{ agents: SupportAgent[] }> => {
    const res = await apiClient.get('/copilot/support/agents');
    return res.data;
  },
};
