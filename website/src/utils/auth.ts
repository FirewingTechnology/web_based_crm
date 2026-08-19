export interface RegisteredUser {
  fullName?: string;
  email?: string;
  phone?: string;
  companyName?: string;
  companyType?: string;
  registeredAt?: string;
}

export const isUserRegistered = (): boolean => {
  if (typeof window === 'undefined') return false;
  return Boolean(
    localStorage.getItem('brokeros_registered') === 'true' ||
    localStorage.getItem('brokeros_registered_for_demo') === 'true' ||
    localStorage.getItem('brokeros_user') ||
    localStorage.getItem('brokeros_access_token')
  );
};

export const getRegisteredUser = (): RegisteredUser | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('brokeros_user');
    if (raw) return JSON.parse(raw);
    const email = localStorage.getItem('brokeros_demo_email');
    if (email) return { email };
  } catch (_) {}
  return null;
};

export const setRegisteredUser = (
  userData: RegisteredUser,
  token?: string,
  refreshToken?: string
) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('brokeros_registered', 'true');
  localStorage.setItem('brokeros_registered_for_demo', 'true');
  localStorage.setItem('brokeros_user', JSON.stringify(userData));
  if (token) localStorage.setItem('brokeros_access_token', token);
  if (refreshToken) localStorage.setItem('brokeros_refresh_token', refreshToken);
  
  // Dispatch storage event so other components update their registration state instantly
  window.dispatchEvent(new Event('brokeros_auth_changed'));
};

export const clearRegisteredUser = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('brokeros_registered');
  localStorage.removeItem('brokeros_registered_for_demo');
  localStorage.removeItem('brokeros_user');
  localStorage.removeItem('brokeros_access_token');
  localStorage.removeItem('brokeros_refresh_token');
  localStorage.removeItem('brokeros_is_demo');
  window.dispatchEvent(new Event('brokeros_auth_changed'));
};
