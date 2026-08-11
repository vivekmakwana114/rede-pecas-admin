import { api } from '@/lib/api';

/**
 * Fetches up to 200 customers from the admin API.
 */
export const getCustomers = () => {
  return api.get('/admin/customers', { params: { limit: 200 } });
};

/**
 * Updates the given customer's editable fields (name, NIF, address, email) by phone number.
 */
export const updateCustomer = (
  phone: string,
  fields: { name?: string; nif?: string | null; address?: string | null; email?: string | null },
) => {
  return api.patch(`/admin/customers/${encodeURIComponent(phone)}`, fields);
};

/**
 * Deletes the customer identified by phone number.
 */
export const deleteCustomer = (phone: string) => {
  return api.delete(`/admin/customers/${encodeURIComponent(phone)}`);
};

/**
 * Toggles a customer's active status.
 */
export const toggleCustomerStatus = (phone: string, active: boolean) => {
  return api.patch(`/admin/customers/${encodeURIComponent(phone)}/status`, { active });
};
