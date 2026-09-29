import axios from 'axios';
import {
  Incident, Runbook, Postmortem, AgentAction, ServiceItem,
  AIAnalysisResult, SimilarIncident, TimelineEvent, FeedbackEntry,
  MemoryRecord, AnalyticsData, SettingsData, ToolExecution
} from '../types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const incidentApi = {
  list: async (params?: { status?: string; service?: string; severity?: string }): Promise<Incident[]> => {
    const res = await api.get('/api/incidents', { params });
    return res.data;
  },
  get: async (id: string): Promise<Incident> => {
    const res = await api.get(`/api/incidents/${id}`);
    return res.data;
  },
  create: async (data: Partial<Incident>): Promise<Incident> => {
    const res = await api.post('/api/incidents', data);
    return res.data;
  },
  analyze: async (id: string): Promise<AIAnalysisResult> => {
    const res = await api.post(`/api/incidents/${id}/analyze`);
    return res.data;
  },
  getSimilar: async (id: string, top_k = 4): Promise<SimilarIncident[]> => {
    const res = await api.get(`/api/incidents/${id}/similar`, { params: { top_k } });
    return res.data;
  },
  getTimeline: async (id: string): Promise<TimelineEvent[]> => {
    const res = await api.get(`/api/incidents/${id}/timeline`);
    return res.data;
  },
  submitFeedback: async (feedback: { incident_id: string; rating: string; comments?: string; engineer_name?: string }): Promise<FeedbackEntry> => {
    const res = await api.post('/api/incidents/feedback', feedback);
    return res.data;
  },
};

export const actionApi = {
  list: async (params?: { incident_id?: string; status?: string }): Promise<AgentAction[]> => {
    const res = await api.get('/api/actions', { params });
    return res.data;
  },
  get: async (id: string): Promise<AgentAction> => {
    const res = await api.get(`/api/actions/${id}`);
    return res.data;
  },
  approve: async (id: string, data?: { approved_by?: string; notes?: string }): Promise<any> => {
    const res = await api.post(`/api/actions/${id}/approve`, data || {});
    return res.data;
  },
  reject: async (id: string, reason: string, engineer_name = 'Site Reliability Engineer'): Promise<any> => {
    const res = await api.post(`/api/actions/${id}/reject`, { reason, engineer_name });
    return res.data;
  },
  listToolExecutions: async (incident_id?: string): Promise<ToolExecution[]> => {
    const res = await api.get('/api/actions/tools/executions', { params: { incident_id } });
    return res.data;
  },
  listTools: async (): Promise<any[]> => {
    const res = await api.get('/api/actions/tools/list');
    return res.data;
  },
};

export const runbookApi = {
  list: async (params?: { service?: string; search?: string }): Promise<Runbook[]> => {
    const res = await api.get('/api/runbooks', { params });
    return res.data;
  },
  get: async (id: string): Promise<Runbook> => {
    const res = await api.get(`/api/runbooks/${id}`);
    return res.data;
  },
  create: async (data: Partial<Runbook>): Promise<Runbook> => {
    const res = await api.post('/api/runbooks', data);
    return res.data;
  },
};

export const postmortemApi = {
  list: async (params?: { service?: string; search?: string }): Promise<Postmortem[]> => {
    const res = await api.get('/api/postmortems', { params });
    return res.data;
  },
  get: async (id: string): Promise<Postmortem> => {
    const res = await api.get(`/api/postmortems/${id}`);
    return res.data;
  },
  create: async (data: Partial<Postmortem>): Promise<Postmortem> => {
    const res = await api.post('/api/postmortems', data);
    return res.data;
  },
};

export const simulationApi = {
  listServices: async (): Promise<ServiceItem[]> => {
    const res = await api.get('/api/services');
    return res.data;
  },
  getHealth: async (service: string): Promise<any> => {
    const res = await api.get(`/api/services/${service}/health`);
    return res.data;
  },
  getLogs: async (service: string, lines = 30): Promise<any[]> => {
    const res = await api.get(`/api/services/${service}/logs`, { params: { lines } });
    return res.data;
  },
  getMetrics: async (service: string): Promise<any> => {
    const res = await api.get(`/api/services/${service}/metrics`);
    return res.data;
  },
  restart: async (service: string): Promise<any> => {
    const res = await api.post(`/api/services/${service}/restart`);
    return res.data;
  },
  rollback: async (service: string, target_version?: string): Promise<any> => {
    const res = await api.post(`/api/services/${service}/rollback`, null, { params: { target_version } });
    return res.data;
  },
  injectFailure: async (payload: { service_name: string; failure_type: string; severity?: string; error_rate?: number; latency_ms?: number }): Promise<any> => {
    const res = await api.post('/api/services/simulation/inject-failure', payload);
    return res.data;
  },
};

export const memoryApi = {
  getRecords: async (memory_type?: string): Promise<MemoryRecord[]> => {
    const res = await api.get('/api/memory/records', { params: { memory_type } });
    return res.data;
  },
  search: async (query: string, memory_type?: string, top_k = 5): Promise<MemoryRecord[]> => {
    const res = await api.post('/api/memory/search', { query, memory_type, top_k });
    return res.data;
  },
};

export const analyticsApi = {
  get: async (): Promise<AnalyticsData> => {
    const res = await api.get('/api/analytics');
    return res.data;
  },
};

export const settingsApi = {
  get: async (): Promise<SettingsData> => {
    const res = await api.get('/api/settings');
    return res.data;
  },
  update: async (data: Partial<SettingsData>): Promise<SettingsData> => {
    const res = await api.post('/api/settings', data);
    return res.data;
  },
  resetDb: async (): Promise<{ success: boolean; message: string }> => {
    const res = await api.post('/api/settings/reset-db');
    return res.data;
  },
};
