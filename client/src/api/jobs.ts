import api from './axios';

export interface Job {
  id: string;
  title: string;
  description: string;
  serviceType: string;
  status: string;
  location: string;
  locationLat?: number;
  locationLng?: number;
  fee: number;
  maishaCut?: number;
  youthEarning?: number;
  clientId: string;
  youthId?: string;
  coordinatorId?: string;
  scheduledAt?: string;
  completedAt?: string;
  proofPhotoUrl?: string;
  proofUploadedAt?: string;
  clientConfirmed?: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  client?: { id: string; name: string; email: string };
  youth?: { id: string; name: string; email: string };
  coordinator?: { id: string; name: string; email: string };
}

export interface JobsResponse {
  jobs: Job[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateJobData {
  title: string;
  description: string;
  serviceType: string;
  location: string;
  fee: number;
  scheduledAt?: string;
  notes?: string;
  clientId?: string;
}

export interface JobParams {
  page?: number;
  limit?: number;
  status?: string;
  serviceType?: string;
  search?: string;
}

export function getJobs(params?: JobParams) {
  return api.get<JobsResponse>('/jobs', { params });
}

export function getJob(id: string) {
  return api.get<Job>(`/jobs/${id}`);
}

export function createJob(data: CreateJobData) {
  return api.post<Job>('/jobs', data);
}

export function assignJob(id: string, youthId: string) {
  return api.patch<Job>(`/jobs/${id}/assign`, { youthId });
}

export function updateJobStatus(id: string, status: string) {
  return api.patch<Job>(`/jobs/${id}/status`, { status });
}

export function confirmJob(id: string) {
  return api.patch<Job>(`/jobs/${id}/confirm`);
}

export function uploadProof(id: string, file: File) {
  const formData = new FormData();
  formData.append('proof', file);
  return api.post<{ url: string }>(`/jobs/${id}/proof`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}
