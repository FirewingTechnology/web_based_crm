export interface SalesTarget {
  id: number;
  user_id: number;
  user_name?: string;
  month_year: string;
  target_amount: number;
  achieved_amount: number;
  target_bookings: number;
  achieved_bookings: number;
  achievement_percentage: number;
  created_at: string;
}

export interface SalesTargetCreateInput {
  user_id: number;
  month_year: string;
  target_amount: number;
  target_bookings: number;
}
