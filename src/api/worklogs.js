import { apiRequest } from './client.js';

export const workLogApi = {
  getAll: () => apiRequest('/worklog/all'),
  getById: (id) => apiRequest(`/worklog/${id}`),
  getByUserId: (userId) => apiRequest(`/worklog/user/${userId}`),
  create: (workLog) => apiRequest('/worklog/', {
    method: 'POST',
    body: JSON.stringify(workLog),
  }),
  update: (id, workLog) => apiRequest(`/worklog/${id}`, {
    method: 'PUT',
    body: JSON.stringify(workLog),
  }),
  delete: (id) => apiRequest(`/worklog/${id}`, {
    method: 'DELETE',
  }),
};
