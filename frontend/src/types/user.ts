export type UserRole = "Admin" | "Manager" | "Sales Executive" | "Broker";

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  firm_name?: string;
  is_active: boolean;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface UserCreateInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
  firm_name?: string;
}
