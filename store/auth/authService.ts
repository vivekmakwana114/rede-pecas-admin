import { api } from '@/lib/api';

/**
 * Authenticates an admin with email and password against the login endpoint.
 */
export const login = (credentials: { email: string; password: string }) => {
  return api.post('/admin/login', credentials);
};

/**
 * Exchanges a refresh token for a new access token.
 */
export const refresh = (refreshToken: string) => {
  return api.post('/admin/refresh', { refreshToken });
};

/**
 * Invalidates the given refresh token on the server, logging the admin out.
 */
export const logout = (refreshToken?: string) => {
  return api.post('/admin/logout', { refreshToken });
};

/**
 * Fetches the currently authenticated admin's profile.
 */
export const getProfile = () => {
  return api.get('/admin/profile');
};

/**
 * Updates the currently authenticated admin's name and/or email.
 */
export const updateProfile = (fields: { name?: string; email?: string }) => {
  return api.patch('/admin/profile', fields);
};

/**
 * Requests a password-reset code be sent to the given admin phone number.
 */
export const forgotPassword = (phone: string) => {
  return api.post('/admin/forgot/password', { phone });
};

/**
 * Resets an admin's password using the phone number, verification code, and new password.
 */
export const resetPassword = (data: { phone: string; code: string; newPassword: string }) => {
  return api.post('/admin/reset/password', data);
};

/**
 * Changes the current admin's password given their current and new password.
 */
export const changePassword = (data: { currentPassword: string; newPassword: string }) => {
  return api.post('/admin/change/password', data);
};
