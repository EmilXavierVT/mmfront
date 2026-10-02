import { apiRequest } from './client.js';

export const economicCustomerApi = {
  getAll: () => apiRequest('/economic/customer/all'),
};
