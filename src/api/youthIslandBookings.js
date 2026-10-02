import { apiRequest } from './client.js';

export const youthIslandBookingApi = {
  getAll: () => apiRequest('/youth-island-booking/all'),
  getById: (id) => apiRequest(`/youth-island-booking/${id}`),
  create: (booking) => apiRequest('/youth-island-booking/', {
    method: 'POST',
    body: JSON.stringify(booking),
  }),
  update: (id, booking) => apiRequest(`/youth-island-booking/${id}`, {
    method: 'PUT',
    body: JSON.stringify(booking),
  }),
};
