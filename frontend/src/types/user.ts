export type UserRole = "Super Admin" | "Admin" | "Manager" | "Sales Executive" | "Broker";


export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  firm_name?: string;
  organization_id?: number | null;
  is_active: boolean;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  trial_expires_at?: string;
  is_trial_expired?: boolean;
  trial_seconds_remaining?: number;
  is_trial?: boolean;
  subscription_status?: string;
  plan_code?: string;
}

export const isSuperAdminRole = (role?: string | null): boolean => {
  if (!role) return false;
  const clean = role.toLowerCase().replace(/[\s_-]/g, '');
  return clean === 'superadmin';
};

export const isSuperAdminUser = (user?: { role?: string; email?: string } | null, role?: string | null): boolean => {
  if (!user && !role) return false;
  if (role && isSuperAdminRole(role)) return true;
  if (user?.role && isSuperAdminRole(user.role)) return true;
  const email = (user?.email || '').toLowerCase().trim();
  return email === 'superadmin@realvion.com' || email === 'amol12@gmail.com' || email === 'amolbrand@gmail.com';
};

export interface UserCreateInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
  firm_name?: string;
}

