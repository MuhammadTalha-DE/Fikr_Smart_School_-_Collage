import api from './api';

export const getNotificationAdminOverview = () =>
  api.get('/notifications/admin/overview');

export const getNotificationAdminOptions = () =>
  api.get('/notifications/admin/options');

export const getNotificationCampaigns = (params = {}) =>
  api.get('/notifications/admin', { params });

export const createNotificationCampaign = (data) =>
  api.post('/notifications/admin', data);

export const updateNotificationCampaign = (id, data) =>
  api.put(`/notifications/admin/${id}`, data);

export const sendNotificationCampaign = (id) =>
  api.post(`/notifications/admin/${id}/send`);

export const deleteNotificationCampaign = (id) =>
  api.delete(`/notifications/admin/${id}`);

export const bulkDeleteNotificationCampaigns = (data) =>
  api.delete('/notifications/admin/bulk', { data });

export const getNotificationCampaignById = (id) =>
  api.get(`/notifications/admin/${id}`);

export const getNotificationReceipts = (id, params = {}) =>
  api.get(`/notifications/admin/${id}/receipts`, { params });

export const getMyNotifications = (params = {}) =>
  api.get('/notifications/inbox', { params });

export const markNotificationRead = (receiptId) =>
  api.patch(`/notifications/receipts/${receiptId}/read`);

export const markAllNotificationsRead = () =>
  api.patch('/notifications/read-all');

export const getNotificationPreferences = () =>
  api.get('/notifications/preferences');

export const updateNotificationPreferences = (data) =>
  api.put('/notifications/preferences', data);
