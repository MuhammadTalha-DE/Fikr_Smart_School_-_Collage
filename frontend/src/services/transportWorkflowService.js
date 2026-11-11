import api from './api';

export const getTransportWorkflowOverview = () =>
  api.get('/transport-workflows/overview');

export const getTransportIncidentCenter = () =>
  api.get('/transport-workflows/incidents');

export const createTransportIncident = (data) =>
  api.post('/transport-workflows/incidents', data);

export const addTransportWorkflowNote = (data) =>
  api.post('/transport-workflows/notes', data);
