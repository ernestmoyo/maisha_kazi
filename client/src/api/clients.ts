import api from './axios';

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  totalJobs: number;
  createdAt: string;
}

export interface ClientParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface CSRReport {
  clientId: string;
  clientName: string;
  totalJobsPosted: number;
  totalSpent: number;
  youthEmployed: number;
  jobsByCategory: Array<{ category: string; count: number }>;
  monthlySpending: Array<{ month: string; amount: number }>;
}

export function getClients(params?: ClientParams) {
  return api.get<{ clients: Client[]; total: number }>('/clients', { params });
}

export function getClientById(id: string) {
  return api.get<Client>(`/clients/${id}`);
}

export function getCSRReport(id: string) {
  return api.get<CSRReport>(`/clients/${id}/csr-report`);
}
