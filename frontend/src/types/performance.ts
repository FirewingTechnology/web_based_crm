export interface PerformanceBadge {
  code: string;
  title: string;
  icon: string;
  description: string;
  color: 'amber' | 'blue' | 'emerald' | 'indigo' | 'cyan' | string;
}

export interface ExecutiveScorecard {
  user_id: number;
  name: string;
  email: string;
  role: string;
  rank: number;

  target_amount: number;
  achieved_amount: number;
  achievement_percentage: number;

  target_bookings: number;
  achieved_bookings: number;

  site_visits_conducted: number;
  leads_assigned: number;
  conversion_rate: number;
  followup_adherence_rate: number;
  pending_followups: number;
  overdue_followups: number;

  projected_run_rate: number;
  pace_status: 'EXCEEDING' | 'ON_TRACK' | 'BEHIND_PACE' | 'AT_RISK';

  badges: PerformanceBadge[];
}

export interface LeaderboardSummary {
  month_year: string;
  days_elapsed: number;
  total_days: number;

  total_org_target: number;
  total_org_achieved: number;
  org_achievement_percentage: number;
  projected_org_run_rate: number;
  org_pace_status: 'EXCEEDING' | 'ON_TRACK' | 'BEHIND_PACE' | 'AT_RISK';

  podium: ExecutiveScorecard[];
  rankings: ExecutiveScorecard[];
}
