import { apiRequest } from './client.js';

function customerPath(key) {
  const [type, id] = key.split(':');
  return `/cleaning-list/${encodeURIComponent(type)}/${encodeURIComponent(id)}`;
}

export const cleaningListApi = {
  getCustomers: () => apiRequest('/cleaning-list/customers'),
  getTemplates: () => apiRequest('/cleaning-list/templates'),
  get: (key) => apiRequest(customerPath(key)),
  getVisits: (key) => apiRequest(`${customerPath(key)}/visits`),
  getChecklist: (key, visitId) => apiRequest(`${customerPath(key)}/visits/${visitId}`),
  startChecklist: (key, visitId) => apiRequest(`${customerPath(key)}/visits/${visitId}/start`, { method: 'POST' }),
  completeTask: (key, visitId, taskId, completed) => apiRequest(`${customerPath(key)}/visits/${visitId}/tasks/${taskId}`, {
    method: 'PATCH',
    body: JSON.stringify({ completed }),
  }),
  save: (key, list) => apiRequest(customerPath(key), {
    method: 'PUT',
    body: JSON.stringify(list),
  }),
};
