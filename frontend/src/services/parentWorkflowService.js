import api from './api';

export const getParentWorkflowOverview = (studentId = '') =>
  api.get('/parent-workflows/overview', { params: studentId ? { studentId } : {} });

export const getParentPTMCenter = (studentId = '') =>
  api.get('/parent-workflows/ptm', { params: studentId ? { studentId } : {} });

export const respondToParentPTMMeeting = (id, data) =>
  api.put(`/parent-workflows/ptm/${id}/respond`, data);

export const getParentInterventions = (studentId = '') =>
  api.get('/parent-workflows/interventions', { params: studentId ? { studentId } : {} });

export const getParentClinicAlerts = (studentId = '') =>
  api.get('/parent-workflows/clinic-alerts', { params: studentId ? { studentId } : {} });

export const getParentSecurityCenter = (studentId = '') =>
  api.get('/parent-workflows/security', { params: studentId ? { studentId } : {} });

export const respondToParentGatePass = (id, data) =>
  api.put(`/parent-workflows/security/gate-passes/${id}/respond`, data);

export const addParentWorkflowNote = (data) =>
  api.post('/parent-workflows/notes', data);
