import api from './api';

export const getAdminHostelOverview = () =>
  api.get('/hostel-portal/admin/overview');

export const getWardenHostelOverview = () =>
  api.get('/hostel-portal/warden/overview');

export const getStudentHostelOverview = () =>
  api.get('/hostel-portal/student/overview');

export const getStudentHostelStatus = () =>
  api.get('/hostel-portal/student/status');

export const getParentHostelOverview = (studentId = '') =>
  api.get('/hostel-portal/parent/overview', {
    params: studentId ? { studentId } : {},
  });
