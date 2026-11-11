import api from './api';

export const getAuditOverview = (params = {}) =>
  api.get('/audit/admin/stats', { params });

export const getAuditLogs = (params = {}) =>
  api.get('/audit/admin/logs', { params });

export const getAuditLogById = (id) =>
  api.get(`/audit/admin/logs/${id}`);

export const getAuditFilterOptions = () =>
  api.get('/audit/admin/options');
