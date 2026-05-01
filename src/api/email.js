import { apiRequest } from './client.js';

export const emailApi = {
  send: (email, authToken) => apiRequest('/email/send', {
    method: 'POST',
    authToken,
    body: JSON.stringify(email),
  }),
};
