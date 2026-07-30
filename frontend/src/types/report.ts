export interface DashboardStats {
  total_leads: number;
  new_leads_today: number;
  total_bookings: number;
  total_pipeline_value: number;
  total_revenue_generated: number;
  total_commission_earned: number;
  pending_followups_count: number;
  overdue_followups_count: number;
}

export interface MonthlySalesChart {
  month: string;
  revenue: number;
  bookings_count: number;
}

export interface LeadSourceDistribution {
  source: string;
  count: number;
}

export interface LeadStatusDistribution {
  status: string;
  count: number;
}

export interface NotificationItem {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export interface ActivityLogItem {
  id: number;
  user_name: string;
  action: string;
  module: string;
  details: string;
  created_at: string;
}
