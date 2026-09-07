import axios from 'axios';
import {
  User,
  Project,
  EstimationResult,
  TestCase,
  TestCaseStats,
  TeamMember,
  ReportItem,
  EstimationHistoryItem,
  NotificationItem,
  SystemSettings,
} from '../types';

const API_BASE = '/api';

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('qa_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const authApi = {
  login: async (email: string, password: string) => {
    const res = await api.post<{ token: string; user: User }>('/auth/login', { email, password });
    return res.data;
  },
  register: async (payload: { name: string; email: string; password: string; role: string; phone?: string; organization?: string }) => {
    const res = await api.post<{ token: string; user: User }>('/auth/register', payload);
    return res.data;
  },
  demoLogin: async () => {
    const res = await api.post<{ token: string; user: User }>('/auth/demo-login');
    return res.data;
  },
  me: async () => {
    const res = await api.get<{ user: User }>('/auth/me');
    return res.data.user;
  },
  updateProfile: async (payload: Partial<User>) => {
    const res = await api.put<{ user: User; message: string }>('/auth/profile', payload);
    return res.data;
  },
  changePassword: async (currentPassword: string, newPassword: string) => {
    const res = await api.put<{ message: string }>('/auth/change-password', { currentPassword, newPassword });
    return res.data;
  },
};

// Projects
export const projectsApi = {
  list: async (params?: { search?: string; type?: string; complexity?: string; status?: string }) => {
    const res = await api.get<{ projects: Project[] }>('/projects', { params });
    return res.data.projects;
  },
  get: async (id: string) => {
    const res = await api.get<{ project: Project & { testCaseItems: TestCase[]; reports: ReportItem[]; history: EstimationHistoryItem[] }; metrics: EstimationResult }>(`/projects/${id}`);
    return res.data;
  },
  create: async (data: Partial<Project>) => {
    const res = await api.post<{ project: Project; metrics: EstimationResult }>('/projects', data);
    return res.data;
  },
  update: async (id: string, data: Partial<Project>) => {
    const res = await api.put<{ project: Project; metrics: EstimationResult }>(`/projects/${id}`, data);
    return res.data;
  },
  duplicate: async (id: string) => {
    const res = await api.post<{ project: Project }>(`/projects/${id}/duplicate`);
    return res.data.project;
  },
  delete: async (id: string) => {
    const res = await api.delete(`/projects/${id}`);
    return res.data;
  },
};

// Estimations
export const estimationsApi = {
  calculate: async (payload: any): Promise<EstimationResult> => {
    const res = await api.post<EstimationResult>('/estimations/calculate', payload);
    return res.data;
  },
  save: async (payload: any) => {
    const res = await api.post('/estimations/save', payload);
    return res.data;
  },
  history: async (params?: { search?: string; complexity?: string }) => {
    const res = await api.get<{ history: EstimationHistoryItem[] }>('/estimations/history', { params });
    return res.data.history;
  },
  deleteHistory: async (id: string) => {
    const res = await api.delete(`/estimations/history/${id}`);
    return res.data;
  },
};

// Test Cases
export const testCasesApi = {
  list: async (params?: { projectId?: string; status?: string; priority?: string; type?: string; module?: string; search?: string }) => {
    const res = await api.get<{ testCases: TestCase[] }>('/test-cases', { params });
    return res.data.testCases;
  },
  stats: async (projectId?: string): Promise<TestCaseStats> => {
    const res = await api.get<TestCaseStats>('/test-cases/stats', { params: { projectId } });
    return res.data;
  },
  create: async (data: Partial<TestCase>) => {
    const res = await api.post<{ testCase: TestCase }>('/test-cases', data);
    return res.data.testCase;
  },
  update: async (id: string, data: Partial<TestCase>) => {
    const res = await api.put<{ testCase: TestCase }>(`/test-cases/${id}`, data);
    return res.data.testCase;
  },
  delete: async (id: string) => {
    const res = await api.delete(`/test-cases/${id}`);
    return res.data;
  },
  batchImport: async (projectId: string, items: Partial<TestCase>[]) => {
    const res = await api.post('/test-cases/batch-import', { projectId, items });
    return res.data;
  },
};

// Team
export const teamApi = {
  list: async () => {
    const res = await api.get<{ members: TeamMember[]; stats: { totalMembers: number; avgCapacity: number; availableCount: number; busyCount: number } }>('/team');
    return res.data;
  },
  create: async (data: Partial<TeamMember>) => {
    const res = await api.post<{ member: TeamMember }>('/team', data);
    return res.data.member;
  },
  update: async (id: string, data: Partial<TeamMember>) => {
    const res = await api.put<{ member: TeamMember }>(`/team/${id}`, data);
    return res.data.member;
  },
  delete: async (id: string) => {
    const res = await api.delete(`/team/${id}`);
    return res.data;
  },
};

// Reports
export const reportsApi = {
  list: async (params?: { projectId?: string; reportType?: string }) => {
    const res = await api.get<{ reports: ReportItem[] }>('/reports', { params });
    return res.data.reports;
  },
  generate: async (payload: { projectId: string; reportType: string; title?: string; notes?: string }) => {
    const res = await api.post<{ report: ReportItem }>('/reports/generate', payload);
    return res.data.report;
  },
  get: async (id: string) => {
    const res = await api.get<{ report: ReportItem }>(`/reports/${id}`);
    return res.data.report;
  },
  delete: async (id: string) => {
    const res = await api.delete(`/reports/${id}`);
    return res.data;
  },
};

// Settings
export const settingsApi = {
  get: async () => {
    const res = await api.get<{ settings: SystemSettings }>('/settings');
    return res.data.settings;
  },
  update: async (data: Partial<SystemSettings>) => {
    const res = await api.put<{ settings: SystemSettings; message: string }>('/settings', data);
    return res.data;
  },
};

// Notifications
export const notificationsApi = {
  list: async () => {
    const res = await api.get<{ notifications: NotificationItem[]; unreadCount: number }>('/notifications');
    return res.data;
  },
  markRead: async (id: string) => {
    const res = await api.put(`/notifications/${id}/read`);
    return res.data;
  },
  markAllRead: async () => {
    const res = await api.put('/notifications/read-all');
    return res.data;
  },
};
