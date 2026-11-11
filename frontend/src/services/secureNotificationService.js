import api from './api';

export const createSecureNotification = (data) =>
  api.post('/notifications/admin/secure', data);

export const sendSecureNotification = (id) =>
  api.post(`/notifications/admin/secure/${id}/send`);

export const getDecryptedNotification = (id) =>
  api.get(`/notifications/secure/${id}`);

export const broadcastToRole = (role, data) =>
  api.post(`/notifications/admin/broadcast/${role}`, data);

export const getRoleBasedStats = () =>
  api.get('/notifications/admin/stats/roles');