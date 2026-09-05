export interface PaymentMilestone {
  milestone_name: string;
  percentage: number;
  amount: number;
  due_condition: string;
}

export interface CostSheetBreakdown {
  base_selling_price: number;
  floor_rise_charges: number;
  plc_charges: number;
  car_parking_charges: number;
  discount_amount: number;
  total_agreement_value: number;

  clubhouse_charges: number;
  possession_charges: number;
  total_additional_charges: number;

  gst_amount: number;
  stamp_duty_amount: number;
  registration_fee: number;
  total_statutory_charges: number;

  grand_total: number;
  token_booking_amount: number;
}

export interface CostSheetResponse {
  project_id: number;
  project_name: string;
  builder_name: string;
  location: string;
  unit_number: string;
  configuration: string;
  super_builtup_area_sqft: number;
  base_rate_per_sqft: number;
  breakdown: CostSheetBreakdown;
  payment_schedule: PaymentMilestone[];
  whatsapp_summary: string;
}

export interface CostSheetCalculateRequest {
  lead_id?: number | null;
  project_id: number;
  unit_number: string;
  configuration: string;
  super_builtup_area_sqft: number;
  base_rate_per_sqft: number;
  floor_number?: number;
  floor_rise_rate_per_sqft?: number;
  plc_rate_per_sqft?: number;
  car_parking_slots?: number;
  car_parking_rate?: number;
  clubhouse_charges?: number;
  possession_charges?: number;
  gst_rate_pct?: number;
  stamp_duty_rate_pct?: number;
  registration_fee?: number;
  discount_amount?: number;
}

export interface QuickBookFromCostSheetRequest extends CostSheetCalculateRequest {
  lead_id: number;
  broker_id?: number | null;
  assigned_executive_id?: number | null;
  token_amount_paid?: number | null;
  notes?: string | null;
}
