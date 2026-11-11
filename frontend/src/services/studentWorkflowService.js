import api from './api';

export const getStudentWorkflowOverview = () =>
  api.get('/student-workflows/overview');

export const getStudentPTMCenter = () =>
  api.get('/student-workflows/ptm');

export const acknowledgeStudentPTMMeeting = (id, data = {}) =>
  api.put(`/student-workflows/ptm/${id}/acknowledge`, data);

export const requestStudentPTMReminder = (id, data = {}) =>
  api.put(`/student-workflows/ptm/${id}/reminder`, data);

export const getStudentGatePassCenter = () =>
  api.get('/student-workflows/gate-passes');

export const addStudentWorkflowNote = (data) =>
  api.post('/student-workflows/notes', data);
