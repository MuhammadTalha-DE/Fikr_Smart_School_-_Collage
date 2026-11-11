import api from './api';

export const getSecurityGateOverview = () =>
  api.get('/security-gate/admin/overview');

export const getCampusVisitors = () =>
  api.get('/security-gate/visitors');

export const createCampusVisitor = (data) =>
  api.post('/security-gate/visitors', data);

export const updateCampusVisitor = (id, data) =>
  api.put(`/security-gate/visitors/${id}`, data);

export const getStudentGatePasses = () =>
  api.get('/security-gate/student-passes');

export const createStudentGatePass = (data) =>
  api.post('/security-gate/student-passes', data);

export const updateStudentGatePass = (id, data) =>
  api.put(`/security-gate/student-passes/${id}`, data);

export const getStaffGatePasses = () =>
  api.get('/security-gate/staff-passes');

export const createStaffGatePass = (data) =>
  api.post('/security-gate/staff-passes', data);

export const updateStaffGatePass = (id, data) =>
  api.put(`/security-gate/staff-passes/${id}`, data);

export const getVehicleGateLogs = () =>
  api.get('/security-gate/vehicle-logs');

export const createVehicleGateLog = (data) =>
  api.post('/security-gate/vehicle-logs', data);

export const getSecurityNotices = () =>
  api.get('/security-gate/notices');

export const createSecurityNotice = (data) =>
  api.post('/security-gate/notices', data);

export const updateSecurityNotice = (id, data) =>
  api.put(`/security-gate/notices/${id}`, data);
