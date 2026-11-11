import api from './api';

export const getTeacherWorkspaceOverview = () =>
  api.get('/teacher-workspace/overview');

export const getTeacherWorkspaceContext = () =>
  api.get('/teacher-workspace/context');

export const getTeacherSelfServiceCenter = () =>
  api.get('/teacher-workspace/self-service');

export const createTeacherLeaveRequest = (data) =>
  api.post('/teacher-workspace/leave-requests', data);

export const createTeacherGatePass = (data) =>
  api.post('/teacher-workspace/gate-passes', data);

export const getTeacherLessonDeliveryTracker = () =>
  api.get('/teacher-workspace/lesson-delivery');

export const recordTeacherLessonDelivery = (data) =>
  api.post('/teacher-workspace/lesson-delivery', data);

export const getTeacherInterventions = () =>
  api.get('/teacher-workspace/interventions');

export const createTeacherIntervention = (data) =>
  api.post('/teacher-workspace/interventions', data);

export const updateTeacherIntervention = (id, data) =>
  api.put(`/teacher-workspace/interventions/${id}`, data);

export const getTeacherPTMCenter = () =>
  api.get('/teacher-workspace/ptm');

export const createTeacherPTMMeeting = (data) =>
  api.post('/teacher-workspace/ptm', data);

export const updateTeacherPTMMeeting = (id, data) =>
  api.put(`/teacher-workspace/ptm/${id}`, data);

export const getTeacherSubstitutionCenter = () =>
  api.get('/teacher-workspace/substitutions');

export const getTeacherLearningContinuityWorkspace = () =>
  api.get('/teacher-workspace/continuity');
