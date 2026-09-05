export type CommissionStage =
  | "EXPECTED"
  | "SUBMITTED"
  | "APPROVED"
  | "PAYABLE"
  | "PAID"
  | "DISPUTED";

export interface CommissionItem {
  id: number;
  organization_id?: number | null;
  booking_id: number;
  booking_number: string;
  unit_number: string;
  lead_name: string;
  builder_name: string;
  project_name: string;
  executive_name: string;
  broker_name?: string | null;
  total_deal_value: number;

  builder_commission_rate: number;
  builder_commission_amount: number;
  gst_rate: number;
  gst_amount: number;
  tds_rate: number;
  tds_amount: number;
  net_receivable: number;

  executive_commission_rate: number;
  executive_commission_amount: number;
  company_margin_amount: number;

  stage: string;
  payout_status: string;
  invoice_number?: string | null;
  invoice_date?: string | null;
  due_date?: string | null;
  paid_date?: string | null;
  payment_reference?: string | null;

  aging_bucket: string;
  days_overdue: number;
  remarks?: string | null;
  created_at: string;
}

export interface CommissionAgingBucketSummary {
  bucket: string;
  count: number;
  total_amount: number;
}

export interface CommissionCommandCenterResponse {
  total_receivable: number;
  total_overdue: number;
  total_collected: number;
  total_expected_unbilled: number;
  aging_buckets: CommissionAgingBucketSummary[];
  stage_breakdown: Record<string, { count: number; amount: number }>;
  commissions: CommissionItem[];
}

export interface CommissionStageUpdatePayload {
  stage: CommissionStage;
  invoice_number?: string;
  invoice_date?: string;
  due_date?: string;
  paid_date?: string;
  payment_reference?: string;
  remarks?: string;
}
