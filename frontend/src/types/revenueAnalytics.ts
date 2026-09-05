export interface FunnelStageMetric {
  stage_key: string;
  stage_label: string;
  count: number;
  value_inr: number;
  conversion_from_prev_pct: number;
  dropoff_count: number;
  dropoff_pct: number;
}

export interface ChannelAttributionMetric {
  source: string;
  inquiries: number;
  qualified: number;
  site_visits: number;
  bookings: number;
  deal_value_inr: number;
  commission_inr: number;
  conversion_rate: number;
  quality_score: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | string;
}

export interface RevenueAnalyticsResponse {
  time_period: string;
  total_inquiries: number;
  total_visits: number;
  total_bookings: number;
  total_closed_revenue: number;
  total_commission: number;
  overall_conversion_rate: number;
  avg_cycle_days: number;
  bottleneck_stage: string;
  bottleneck_insight: string;
  funnel_stages: FunnelStageMetric[];
  channels: ChannelAttributionMetric[];
}
