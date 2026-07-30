export interface BrokerProfile {
  id: number;
  user_id: number;
  firm_name: string;
  contact_person: string;
  phone: string;
  email: string;
  address?: string;
  commission_rate: number;
  total_deals: number;
  total_revenue_generated: number;
  performance_score: number;
  created_at: string;
}

export interface BrokerCreateInput {
  firm_name: string;
  contact_person: string;
  phone: string;
  email: string;
  password?: string;
  address?: string;
  commission_rate: number;
}
