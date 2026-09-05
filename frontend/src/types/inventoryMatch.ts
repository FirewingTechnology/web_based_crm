export interface CriteriaMatchDetail {
  criterion: string;
  status: 'MATCHED' | 'PARTIAL' | 'MISMATCHED' | 'UNSPECIFIED';
  score_percentage: number;
  detail: string;
}

export interface LeadInventoryMatch {
  project_id: number;
  project_name: string;
  builder_name: string;
  location: string;
  configuration: string;
  min_price: number;
  max_price: number;
  possession_date?: string | null;
  status: string;
  brochure_url?: string | null;
  rera_id?: string | null;
  match_score: number; // 0 to 100
  match_tier: 'EXCELLENT_MATCH' | 'GOOD_MATCH' | 'PARTIAL_MATCH' | 'LOW_MATCH';
  criteria_breakdown: CriteriaMatchDetail[];
  match_reasons: string[];
  gap_reasons: string[];
  whatsapp_pitch: string;
  recommended_action: string;
}

export interface LeadInventoryMatchResponse {
  lead_id: number;
  lead_name: string;
  buyer_budget: string;
  buyer_location?: string | null;
  buyer_configuration?: string | null;
  total_projects_evaluated: number;
  matches: LeadInventoryMatch[];
}

export interface MatchedLeadItem {
  lead_id: number;
  lead_name: string;
  phone: string;
  email?: string | null;
  status: string;
  assigned_to_name?: string | null;
  budget_range: string;
  preferred_location?: string | null;
  preferred_configuration?: string | null;
  match_score: number;
  match_tier: 'EXCELLENT_MATCH' | 'GOOD_MATCH' | 'PARTIAL_MATCH';
  match_reasons: string[];
  gap_reasons: string[];
  whatsapp_pitch: string;
}

export interface ProjectMatchingLeadsResponse {
  project_id: number;
  project_name: string;
  builder_name: string;
  total_leads_evaluated: number;
  matched_leads: MatchedLeadItem[];
}
