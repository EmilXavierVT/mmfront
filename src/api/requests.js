import { apiRequest } from './client.js';

export const quoteRequestApi = {
  create: (quoteRequest) => apiRequest('/request/', {
    method: 'POST',
    body: JSON.stringify(quoteRequest),
  }),
  getByUserId: (userId) => apiRequest(`/request/user/${userId}`),
};

export const productInRequestApi = {
  create: (productInRequest) => apiRequest('/product-in-requests/', {
    method: 'POST',
    body: JSON.stringify(productInRequest),
  }),
  getById: (id) => apiRequest(`/product-in-requests/${id}`),
};
