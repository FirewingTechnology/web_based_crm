export interface Builder {
  id: number;
  name: string;
  company: string;
  contact_person: string;
  phone: string;
  email: string;
  address?: string;
  commission_rate: number;
  notes?: string;
  projects_count: number;
  created_at: string;
  updated_at: string;
}

export interface BuilderCreateInput {
  name: string;
  company: string;
  contact_person: string;
  phone: string;
  email: string;
  address?: string;
  commission_rate: number;
  notes?: string;
}
