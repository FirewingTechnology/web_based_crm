export interface SiteVisit {
  id: number;
  lead_id: number;
  lead_name?: string;
  lead_phone?: string;
  project_id: number;
  project_name?: string;
  sales_executive_id: number;
  sales_executive_name?: string;
  scheduled_at: string;
  completed_at?: string;
  pickup_location?: string;
  pickup_time?: string;
  driver_name?: string;
  driver_phone?: string;
  cab_vehicle_number?: string;
  otp_code: string;
  is_otp_verified: boolean;
  status: 'Scheduled' | 'In Transit' | 'Completed' | 'Cancelled' | 'No Show';
  feedback_rating?: number;
  buyer_interest_level?: 'Hot' | 'Warm' | 'Cold' | 'Ready to Book';
  preferred_unit?: string;
  discussion_notes?: string;
  created_at: string;
}

export interface SiteVisitCreateInput {
  lead_id: number;
  project_id: number;
  scheduled_at: string;
  sales_executive_id?: number;
  pickup_location?: string;
  pickup_time?: string;
  driver_name?: string;
  driver_phone?: string;
  cab_vehicle_number?: string;
}

export interface SiteVisitStatusUpdateInput {
  status: 'Scheduled' | 'In Transit' | 'Completed' | 'Cancelled' | 'No Show';
  feedback_rating?: number;
  buyer_interest_level?: 'Hot' | 'Warm' | 'Cold' | 'Ready to Book';
  preferred_unit?: string;
  discussion_notes?: string;
  auto_advance_lead?: boolean;
}
