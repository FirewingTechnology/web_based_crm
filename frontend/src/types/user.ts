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
  max_users?: number;
  seats_used?: number;
}

export const isSuperAdminRole = (role?: string | null): boolean => {
  if (!role) return false;
  const clean = role.toLowerCase().replace(/[\s_-]/g, '');
  return clean === 'superadmin';
};

export const isSuperAdminUser = (user?: { role?: string; email?: string } | null, role?: string | null): boolean => {
  if (!user && !role) return false;
  const email = (user?.email || '').toLowerCase().trim();
  const effectiveRole = role || user?.role;
  // Super Admin is ALWAYS AND ONLY ONE: superadmin@realvion.com
  return email === 'superadmin@realvion.com' && isSuperAdminRole(effectiveRole);
};

export interface UserCreateInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
  firm_name?: string;
}

