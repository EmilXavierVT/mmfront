import { apiRequest } from './client.js';

export const cleaningInvoiceApi = {
  preview: (request) => apiRequest('/cleaning-invoice/preview', {
    method: 'POST',
    body: JSON.stringify(request),
  }),
  create: (request) => apiRequest('/cleaning-invoice/create', {
    method: 'POST',
    body: JSON.stringify(request),
  }),
};

export const youthIslandInvoiceApi = {
  preview: (request) => apiRequest('/youth-island-invoice/preview', {
    method: 'POST',
    body: JSON.stringify(request),
  }),
  create: (request) => apiRequest('/youth-island-invoice/create', {
    method: 'POST',
    body: JSON.stringify(request),
  }),
};
