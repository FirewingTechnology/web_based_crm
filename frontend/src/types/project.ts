export type ProjectStatus = "Under Construction" | "Ready to Move" | "New Launch" | "Sold Out";

export interface Project {
  id: number;
  name: string;
  builder_id: number;
  builder_name?: string;
  location: string;
  configuration: string;
  min_price: number;
  max_price: number;
  possession_date?: string;
  rera_id?: string;
  status: ProjectStatus;
  amenities?: string;
  brochure_url?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectCreateInput {
  name: string;
  builder_id?: number;
  new_builder_name?: string;
  location: string;
  configuration: string;
  min_price: number;
  max_price: number;
  possession_date?: string;
  rera_id?: string;
  status?: ProjectStatus;
  amenities?: string;
  brochure_url?: string;
  description?: string;
}
