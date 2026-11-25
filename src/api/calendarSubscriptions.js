import { API_BASE_URL, apiRequest } from './client.js';

export const calendarSubscriptionApi = {
  async getLink(feed) {
    const { path } = await apiRequest(`/calendar-subscriptions/${feed}`, { method: 'POST' });
    const apiBase = API_BASE_URL.replace(/\/+$/, '');
    return new URL(`${apiBase}${path}`, window.location.origin).href;
  },

  revoke(feed) {
    return apiRequest(`/calendar-subscriptions/${feed}`, { method: 'DELETE' });
  },
};
