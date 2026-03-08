import api from './axios';

export interface Youth {
  id: string;
  name: string;
  email: string;
  phone: string;
  bio: string;
  location: string;
  skills: string[];
  isVetted: boolean;
  rating: number;
  completedJobs: number;
  createdAt: string;
}

export interface UpdateYouthProfileData {
  bio?: string;
  location?: string;
  phone?: string;
  skills?: string[];
}

export interface YouthParams {
  page?: number;
  limit?: number;
  isVetted?: boolean;
  search?: string;
}

export interface YouthEarnings {
  totalEarnings: number;
  pendingEarnings: number;
  completedJobs: number;
  earnings: Array<{
    jobId: string;
    jobTitle: string;
    amount: number;
    date: string;
    status: string;
  }>;
}

export function getYouth(params?: YouthParams) {
  return api.get<{ youth: Youth[]; total: number }>('/youth', { params });
}

export function getYouthById(id: string) {
  return api.get<Youth>(`/youth/${id}`);
}

export function vetYouth(id: string) {
  return api.patch<Youth>(`/youth/${id}/vet`);
}

export function getYouthEarnings(id: string) {
  return api.get<YouthEarnings>(`/youth/${id}/earnings`);
}

export function updateYouthProfile(id: string, data: UpdateYouthProfileData) {
  return api.patch<Youth>(`/youth/${id}/profile`, data);
}

export function uploadProfilePhoto(file: File) {
  const formData = new FormData();
  formData.append('photo', file);
  return api.post<{ profilePhotoUrl: string }>('/uploads/profile-photo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export function uploadIdDocument(file: File) {
  const formData = new FormData();
  formData.append('document', file);
  return api.post<{ idDocumentUrl: string }>('/uploads/id-document', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}
