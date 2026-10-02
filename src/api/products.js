import { apiRequest } from './client.js';

export const productApi = {
  getAll: () => apiRequest('/product/all'),
  getById: (id) => apiRequest(`/product/${encodeURIComponent(id)}`),
  update: (productNumber, product) => apiRequest(`/product/${encodeURIComponent(productNumber)}`, {
    method: 'PUT',
    body: JSON.stringify(product),
  }),
};
