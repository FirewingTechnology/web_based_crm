import { apiClient } from './client';
import { Project, ProjectCreateInput } from '../types/project';

export const projectsApi = {
  getProjects: async (params?: { builder_id?: number; status?: string; search?: string }): Promise<Project[]> => {
    const res = await apiClient.get<Project[]>('/projects', { params });
    return res.data;
  },
  getProject: async (id: number): Promise<Project> => {
    const res = await apiClient.get<Project>(`/projects/${id}`);
    return res.data;
  },
  createProject: async (data: ProjectCreateInput): Promise<Project> => {
    const res = await apiClient.post<Project>('/projects', data);
    return res.data;
  },
  updateProject: async (id: number, data: Partial<ProjectCreateInput>): Promise<Project> => {
    const res = await apiClient.put<Project>(`/projects/${id}`, data);
    return res.data;
  },
  deleteProject: async (id: number): Promise<void> => {
    await apiClient.delete(`/projects/${id}`);
  },
};
