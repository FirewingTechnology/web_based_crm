export interface PriorityItem {
  id: string;
  type: 'overdue_followup' | 'today_site_visit' | 'today_followup' | 'post_visit' | 'hot_lead' | 'closing_opportunity' | 'lead_at_risk';
  priority_rank: number;
  badge_label: string;
  title: string;
  lead_id: number;
  lead_name: string;
  lead_phone: string;
  deal_value: number;
  status: string;
  scheduled_at?: string | null;
  due_label: string;
  reason: string;
  recommended_action: string;
  health_score: number;
  health_category: string;
  assigned_to_name?: string | null;
}

export interface TodayPrioritiesResponse {
  total_priorities: number;
  overdue_count: number;
  today_actions_count: number;
  post_visit_count: number;
  hot_leads_count: number;
  closing_count: number;
  risk_count: number;
  items: PriorityItem[];
}
