import api from './api';

export const getHRPayrollOverview = () =>
  api.get('/hr-payroll/admin/overview');

export const getHRStaffDirectory = (params = {}) =>
  api.get('/hr-payroll/admin/staff', { params });

export const getHRAttendanceCenter = () =>
  api.get('/hr-payroll/admin/attendance');

export const getHRPayrollCenter = () =>
  api.get('/hr-payroll/admin/payroll');
