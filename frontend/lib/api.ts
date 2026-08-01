import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth
export const login = (username: string, password: string) =>
  api.post<{ token: string }>('/auth/login', { username, password });

// Documents
export const uploadDocument = (file: File, documentType: string) => {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('documentType', documentType);
  return api.post('/documents/upload', fd);
};
export const getDocument = (id: string) => api.get(`/documents/${id}`);
export const listDocuments = (params?: { type?: string; poNumber?: string }) =>
  api.get('/documents', { params });

// Match
export const getMatch = (poNumber: string) => api.get(`/match/${poNumber}`);
export const getSummary = (poNumber: string) => api.get(`/summary/${poNumber}`);

// SKU Master
export const listSkus = (params?: { q?: string; page?: number; limit?: number }) =>
  api.get('/masters/sku', { params });
export const getSku = (id: string) => api.get(`/masters/sku/${id}`);
export const createSku = (data: Record<string, unknown>) => api.post('/masters/sku', data);
export const updateSku = (id: string, data: Record<string, unknown>) =>
  api.patch(`/masters/sku/${id}`, data);
export const deleteSku = (id: string) => api.delete(`/masters/sku/${id}`);
