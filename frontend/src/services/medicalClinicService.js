import api from './api';

export const getMedicalClinicOverview = () =>
  api.get('/medical-clinic/admin/overview');

export const getMedicalProfiles = () =>
  api.get('/medical-clinic/profiles');

export const saveMedicalProfile = (data) =>
  api.post('/medical-clinic/profiles', data);

export const getClinicVisits = () =>
  api.get('/medical-clinic/visits');

export const createClinicVisit = (data) =>
  api.post('/medical-clinic/visits', data);

export const getMedicineLogs = () =>
  api.get('/medical-clinic/medicines');

export const createMedicineLog = (data) =>
  api.post('/medical-clinic/medicines', data);

export const getHealthIncidents = () =>
  api.get('/medical-clinic/incidents');

export const createHealthIncident = (data) =>
  api.post('/medical-clinic/incidents', data);
