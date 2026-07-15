import { api } from '@/lib/api';

export const login = (credentials: { email: string; password: string }) => {
  return api.post('/admin/login', credentials);
};

export const refresh = (refreshToken: string) => {
  return api.post('/admin/refresh', { refreshToken });
};

export const getProfile = () => {
  return api.get('/admin/profile');
};

export const forgotPassword = (phone: string) => {
  return api.post('/admin/forgot/password', { phone });
};

export const resetPassword = (data: { phone: string; code: string; newPassword: string }) => {
  return api.post('/admin/reset/password', data);
};

export const changePassword = (data: { currentPassword: string; newPassword: string }) => {
  return api.post('/admin/change/password', data);
};
