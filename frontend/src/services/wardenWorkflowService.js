import api from './api';

export const getWardenWorkflowOverview = () =>
  api.get('/warden-workflows/overview');

export const getWardenPTMCenter = () =>
  api.get('/warden-workflows/ptm');

export const getWardenInterventions = () =>
  api.get('/warden-workflows/interventions');

export const getWardenClinicAlerts = () =>
  api.get('/warden-workflows/clinic-alerts');

export const getWardenSecurityCenter = () =>
  api.get('/warden-workflows/security');

export const addWardenWorkflowNote = (data) =>
  api.post('/warden-workflows/notes', data);
