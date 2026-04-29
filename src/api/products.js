import { apiRequest } from './client.js';

export const productApi = {
  getAll: () => apiRequest('/product/all'),
  getById: (id) => apiRequest(`/product/${id}`),
  create: (product) => apiRequest('/product/', {
    method: 'POST',
    body: JSON.stringify(product),
  }),
  update: (id, product) => apiRequest(`/product/${id}`, {
    method: 'PUT',
    body: JSON.stringify(product),
  }),
  delete: (id) => apiRequest(`/product/${id}`, {
    method: 'DELETE',
  }),
};
