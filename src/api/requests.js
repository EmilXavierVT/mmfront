import { apiRequest } from './client.js';

export const quoteRequestApi = {
  getAll: () => apiRequest('/request/all'),
  create: (quoteRequest, authToken) => apiRequest('/request/', {
    method: 'POST',
    authToken,
    body: JSON.stringify(quoteRequest),
  }),
  update: (id, quoteRequest) => apiRequest(`/request/${id}`, {
    method: 'PUT',
    body: JSON.stringify(quoteRequest),
  }),
  getByUserId: (userId) => apiRequest(`/request/user/${userId}`),
};

export const productInRequestApi = {
  create: (productInRequest, authToken) => apiRequest('/product-in-requests/', {
    method: 'POST',
    authToken,
    body: JSON.stringify(productInRequest),
  }),
  getById: (id) => apiRequest(`/product-in-requests/${id}`),
};
