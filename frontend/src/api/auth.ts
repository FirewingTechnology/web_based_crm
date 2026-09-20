import { apiClient } from './client';
import { TokenResponse } from '../types/auth';
import { User } from '../types/user';

export const authApi = {
  login: async (email: string, password: string): Promise<TokenResponse> => {
    const res = await apiClient.post<TokenResponse>('/auth/login', { email, password });
    return res.data;
  },
  getMe: async (tokenOverride?: string): Promise<User> => {
    const headers = tokenOverride ? { Authorization: `Bearer ${tokenOverride}` } : undefined;
    const res = await apiClient.get<User>('/auth/me', { headers });
    return res.data;
  },
};
