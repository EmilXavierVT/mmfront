import { apiRequest } from './client.js';

export const subscriptionDealApi = {
  getAll: () => apiRequest('/subscription-deal/all'),
  getById: (id) => apiRequest(`/subscription-deal/${id}`),
  create: (deal) => apiRequest('/subscription-deal/', {
    method: 'POST',
    body: JSON.stringify(deal),
  }),
  update: (id, deal) => apiRequest(`/subscription-deal/${id}`, {
    method: 'PUT',
    body: JSON.stringify(deal),
  }),
  delete: (id) => apiRequest(`/subscription-deal/${id}`, {
    method: 'DELETE',
  }),
};
