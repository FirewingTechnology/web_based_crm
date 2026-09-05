export type DocumentType = 
  | 'PAN_CARD'
  | 'AADHAAR_CARD'
  | 'PASSPORT'
  | 'ALLOTMENT_LETTER'
  | 'COST_SHEET'
  | 'PAYMENT_RECEIPT'
  | 'BBA_AGREEMENT'
  | 'SALE_DEED'
  | 'OTHER';

export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface BuyerDocument {
  id: number;
  organization_id?: number;
  lead_id?: number;
  booking_id?: number;
  uploaded_by_id: number;
  uploaded_by_name?: string;

  document_type: DocumentType;
  title: string;
  file_name: string;
  file_url: string;
  file_size_bytes?: number;
  mime_type: string;
  document_number?: string;

  verification_status: VerificationStatus;
  verified_by_id?: number;
  verified_by_name?: string;
  verified_at?: string;
  rejection_reason?: string;
  created_at: string;
}

export interface BuyerKYCSummary {
  lead_id: number;
  lead_name: string;
  pan_verified: boolean;
  aadhaar_verified: boolean;
  cost_sheet_present: boolean;
  payment_proof_present: boolean;
  allotment_letter_present: boolean;
  bba_present: boolean;

  kyc_compliance_pct: number;
  compliance_status: 'FULLY_COMPLIANT' | 'PARTIALLY_COMPLIANT' | 'PENDING';
  documents: BuyerDocument[];
}

export interface BuyerDocumentCreateInput {
  lead_id?: number;
  booking_id?: number;
  document_type: DocumentType;
  title: string;
  file_name: string;
  file_url: string;
  file_size_bytes?: number;
  mime_type?: string;
  document_number?: string;
}

export interface BuyerDocumentVerifyInput {
  verification_status: VerificationStatus;
  rejection_reason?: string;
}
