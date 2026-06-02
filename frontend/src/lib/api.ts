import axios, { AxiosError } from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

// Inject JWT token on every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('taskflow_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-redirect on 401
api.interceptors.response.use(
  (res) => res,
  (err: AxiosError) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('taskflow_token');
      localStorage.removeItem('taskflow_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

// ─── Typed API helpers ────────────────────────────────────────────────────────

export interface RegisterData { name: string; email: string; password: string; role?: string; }
export interface LoginData { email: string; password: string; }
export interface TaskData {
  title: string; description?: string;
  status?: 'pending' | 'in-progress' | 'completed';
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string | null;
}

export const authApi = {
  register: (data: RegisterData) => api.post('/auth/register', data),
  login: (data: LoginData) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

export const tasksApi = {
  list: (params?: Record<string, unknown>) => api.get('/tasks', { params }),
  get: (id: string) => api.get(`/tasks/${id}`),
  create: (data: TaskData) => api.post('/tasks', data),
  update: (id: string, data: Partial<TaskData>) => api.put(`/tasks/${id}`, data),
  delete: (id: string) => api.delete(`/tasks/${id}`),
};

export const adminApi = {
  users: (params?: Record<string, unknown>) => api.get('/admin/users', { params }),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),
  stats: () => api.get('/admin/stats'),
};

export const getErrorMessage = (err: unknown): string => {
  if (err instanceof AxiosError) {
    return (
      (err.response?.data as { message?: string })?.message ||
      err.message ||
      'An unexpected error occurred'
    );
  }
  return 'An unexpected error occurred';
};
