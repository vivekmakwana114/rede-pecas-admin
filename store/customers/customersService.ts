import { api } from '@/lib/api';

export const getCustomers = () => {
  return api.get('/admin/customers');
};
