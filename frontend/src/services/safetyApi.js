import api from './api';

// =====================================================
// EMERGENCY ALERTS
// =====================================================
export const getAlerts = (params) => api.get('/safety/alerts', { params });
export const getAlertById = (id) => api.get(`/safety/alerts/${id}`);
export const createAlert = (data) => api.post('/safety/alerts', data);
export const updateAlert = (id, data) => api.put(`/safety/alerts/${id}`, data);
export const deleteAlert = (id) => api.delete(`/safety/alerts/${id}`);
export const acknowledgeAlert = (id) => api.post(`/safety/alerts/${id}/acknowledge`);

// =====================================================
// INCIDENT REPORTS
// =====================================================
export const getIncidents = (params) => api.get('/safety/incidents', { params });
export const getIncidentById = (id) => api.get(`/safety/incidents/${id}`);
export const createIncident = (data) => api.post('/safety/incidents', data);
export const updateIncident = (id, data) => api.put(`/safety/incidents/${id}`, data);
export const deleteIncident = (id) => api.delete(`/safety/incidents/${id}`);

// =====================================================
// EMERGENCY CONTACTS
// =====================================================
export const getContacts = (params) => api.get('/safety/contacts', { params });
export const createContact = (data) => api.post('/safety/contacts', data);
export const updateContact = (id, data) => api.put(`/safety/contacts/${id}`, data);
export const deleteContact = (id) => api.delete(`/safety/contacts/${id}`);

// =====================================================
// DASHBOARD STATS
// =====================================================
export const getSafetyStats = () => api.get('/safety/stats');
