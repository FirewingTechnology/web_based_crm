export type BookingStatus = "Pending" | "Confirmed" | "Cancelled" | "Completed";
export type PayoutStatus = "Pending" | "Partial" | "Paid";

export interface Commission {
  id: number;
  booking_id: number;
  builder_commission_rate: number;
  builder_commission_amount: number;
  executive_commission_rate: number;
  executive_commission_amount: number;
  broker_commission_rate: number;
  broker_commission_amount: number;
  company_margin_amount: number;
  payout_status: PayoutStatus;
  remarks?: string;
}

export interface Booking {
  id: number;
  booking_number: string;
  lead_id: number;
  project_id: number;
  builder_id: number;
  assigned_executive_id: number;
  broker_id?: number;
  builder_name?: string;
  project_name?: string;
  lead_name?: string;
  executive_name?: string;
  broker_name?: string;
  unit_number: string;
  booking_amount: number;
  total_deal_value: number;
  booking_date: string;
  status: BookingStatus;
  notes?: string;
  created_at: string;
  commission?: Commission;
}

export interface BookingCreateInput {
  lead_id: number;
  project_id: number;
  assigned_executive_id: number;
  broker_id?: number;
  unit_number: string;
  booking_amount: number;
  total_deal_value: number;
  notes?: string;
}
