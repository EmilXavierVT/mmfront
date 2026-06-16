import { apiRequest } from './client.js';

export const cleaningAppointmentApi = {
  getAll: () => apiRequest('/cleaning-appointment/all'),
  getById: (id) => apiRequest(`/cleaning-appointment/${id}`),
  create: (appointment) => apiRequest('/cleaning-appointment/', {
    method: 'POST',
    body: JSON.stringify(appointment),
  }),
  update: (id, appointment) => apiRequest(`/cleaning-appointment/${id}`, {
    method: 'PUT',
    body: JSON.stringify(appointment),
  }),
  delete: (id) => apiRequest(`/cleaning-appointment/${id}`, {
    method: 'DELETE',
  }),
};
