export interface BrokerProfile {
  id: number;
  user_id: number;
  firm_name: string;
  contact_person: string;
  phone: string;
  email: string;
  address?: string;
  rera_number?: string;
  tier: 'Silver' | 'Gold' | 'Platinum' | string;
  commission_rate: number;
  total_deals: number;
  total_revenue_generated: number;
  performance_score: number;
  parent_broker_id?: number;
  parent_firm_name?: string;
  sub_broker_count?: number;
  created_at: string;
}

export interface BrokerCreateInput {
  firm_name: string;
  contact_person: string;
  phone: string;
  email: string;
  password?: string;
  address?: string;
  rera_number?: string;
  tier?: string;
  parent_broker_id?: number;
  commission_rate: number;
}

export interface BrokerTierConfig {
  tier: string;
  min_revenue_lakhs: number;
  base_commission_pct: number;
  volume_kicker_pct: number;
  effective_commission_pct: number;
  perks: string[];
}

export interface ProjectCollateral {
  project_id: number;
  project_name: string;
  location: string;
  configuration: string;
  price_range: string;
  brochure_url?: string;
  amenities: string[];
  co_branded_share_text: string;
  co_branded_whatsapp_link: string;
}

export interface CoBrokingDeal {
  id: number;
  primary_broker_id: number;
  primary_broker_name?: string;
  secondary_broker_id?: number;
  secondary_broker_name?: string;
  lead_id?: number;
  project_id?: number;
  project_name?: string;
  client_name: string;
  client_phone: string;
  primary_split_pct: number;
  secondary_split_pct: number;
  expected_deal_value?: number;
  status: 'ACTIVE' | 'CLOSED' | 'EXPIRED' | 'CANCELLED' | string;
  notes?: string;
  created_at: string;
}

export interface CoBrokingDealCreateInput {
  primary_broker_id: number;
  secondary_broker_id?: number;
  lead_id?: number;
  project_id?: number;
  client_name: string;
  client_phone: string;
  primary_split_pct: number;
  secondary_split_pct: number;
  expected_deal_value?: number;
  notes?: string;
}
