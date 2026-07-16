import { api } from '@/lib/api';

// Requests the backend's max page size (see customerListQuery in
// admin.validation.ts) so the customers page's client-side search/sort keeps
// working over the full list without a real pagination UI — revisit with
// server-side paging (the response's `total` field) once the real customer
// count exceeds this.
export const getCustomers = () => {
  return api.get('/admin/customers', { params: { limit: 200 } });
};

export const updateCustomer = (
  phone: string,
  fields: { name?: string; nif?: string | null; address?: string | null; email?: string | null },
) => {
  return api.patch(`/admin/customers/${encodeURIComponent(phone)}`, fields);
};

// Soft-deletes the customer (backend sets active = false rather than a hard
// delete — see customer.controller.ts).
export const deleteCustomer = (phone: string) => {
  return api.delete(`/admin/customers/${encodeURIComponent(phone)}`);
};
