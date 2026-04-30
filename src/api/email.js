import { apiRequest } from './client.js';

export const emailApi = {
  send: (email) => apiRequest('/email/send', {
    method: 'POST',
    body: JSON.stringify(email),
  }),
};
