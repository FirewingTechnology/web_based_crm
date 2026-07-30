import { apiClient } from './client';
import { User, UserCreateInput } from '../types/user';

export const usersApi = {
  getUsers: async (role?: string): Promise<User[]> => {
    const res = await apiClient.get<User[]>('/users', { params: { role } });
    return res.data;
  },
  createUser: async (data: UserCreateInput): Promise<User> => {
    const res = await apiClient.post<User>('/users', data);
    return res.data;
  },
  updateUser: async (id: number, data: Partial<UserCreateInput> & { is_active?: boolean }): Promise<User> => {
    const res = await apiClient.put<User>(`/users/${id}`, data);
    return res.data;
  },
  deleteUser: async (id: number): Promise<void> => {
    await apiClient.delete(`/users/${id}`);
  },
};
