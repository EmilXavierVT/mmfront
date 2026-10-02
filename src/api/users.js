import { apiRequest } from './client.js';

export const userApi = {
  getAll: () => apiRequest('/user/all'),
  getById: (id) => apiRequest(`/user/${id}`),
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
  setEmployee: (id, user) => apiRequest(`/user/${id}`, {
    method: 'PUT',
    body: JSON.stringify(user),
  }),
  setCleaningClient: (id) => apiRequest(`/user/${id}/cleaning-client`, {
    method: 'PUT',
  }),
  setCleaningStaff: (id) => apiRequest(`/user/${id}/cleaning-staff`, {
    method: 'PUT',
  }),
  setYouthIsland: (id) => apiRequest(`/user/${id}/youth-island`, {
    method: 'PUT',
  }),
};
