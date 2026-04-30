import { apiRequest } from './client.js';

export const userApi = {
  getAll: () => apiRequest('/user/all'),
  register: (credentials) => apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(credentials),
  }),
  update: (id, user) => apiRequest(`/user/${id}`, {
    method: 'PUT',
    body: JSON.stringify(user),
  }),
  setAdmin: (id) => apiRequest(`/user/${id}/admin`, {
    method: 'PUT',
  }),
};
