import api from './api';

export const getAdminOperationsOverview = () =>
  api.get('/admin-operations/overview');

export const getBudgetControlCenter = () =>
  api.get('/admin-operations/budgets');

export const createBudgetLine = (data) =>
  api.post('/admin-operations/budgets', data);

export const updateBudgetLine = (id, data) =>
  api.put(`/admin-operations/budgets/${id}`, data);

export const getApprovalsWorkflow = () =>
  api.get('/admin-operations/approvals');

export const applyApprovalWorkflowAction = (data) =>
  api.post('/admin-operations/approvals/action', data);

export const getComplianceCenter = () =>
  api.get('/admin-operations/compliance');

export const createComplianceRecord = (data) =>
  api.post('/admin-operations/compliance', data);

export const updateComplianceRecord = (id, data) =>
  api.put(`/admin-operations/compliance/${id}`, data);

export const getClinicOperations = () =>
  api.get('/admin-operations/clinic-ops');

export const getSecurityOperations = () =>
  api.get('/admin-operations/security-ops');

export const getStaffSelfServiceOversight = () =>
  api.get('/admin-operations/staff-oversight');

export const getManagementBICenter = () =>
  api.get('/admin-operations/bi-center');

export const getPrincipalCommandCenter = () =>
  api.get('/admin-operations/principal-command');
