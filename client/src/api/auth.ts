import api from './axios';

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: string;
  phone?: string;
}

export function login(email: string, password: string) {
  return api.post<LoginResponse>('/auth/login', { email, password });
}

export function register(data: RegisterData) {
  return api.post<LoginResponse>('/auth/register', data);
}

export function refreshToken(token: string) {
  return api.post<{ token: string; refreshToken: string }>('/auth/refresh', {
    refreshToken: token,
  });
}

export function getMe() {
  return api.get<User>('/auth/me');
}
