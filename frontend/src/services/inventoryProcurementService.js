import api from './api';

export const getInventoryOverview = () =>
  api.get('/inventory-procurement/admin/overview');

export const getInventoryItems = (params = {}) =>
  api.get('/inventory-procurement/items', { params });

export const createInventoryItem = (data) =>
  api.post('/inventory-procurement/items', data);

export const updateInventoryItem = (id, data) =>
  api.put(`/inventory-procurement/items/${id}`, data);

export const getInventoryVendors = (params = {}) =>
  api.get('/inventory-procurement/vendors', { params });

export const createInventoryVendor = (data) =>
  api.post('/inventory-procurement/vendors', data);

export const updateInventoryVendor = (id, data) =>
  api.put(`/inventory-procurement/vendors/${id}`, data);

export const getPurchaseRequests = () =>
  api.get('/inventory-procurement/purchase-requests');

export const createPurchaseRequest = (data) =>
  api.post('/inventory-procurement/purchase-requests', data);

export const updatePurchaseRequest = (id, data) =>
  api.put(`/inventory-procurement/purchase-requests/${id}`, data);

export const getPurchaseOrders = () =>
  api.get('/inventory-procurement/purchase-orders');

export const createPurchaseOrder = (data) =>
  api.post('/inventory-procurement/purchase-orders', data);

export const updatePurchaseOrder = (id, data) =>
  api.put(`/inventory-procurement/purchase-orders/${id}`, data);

export const getInventoryTransactions = () =>
  api.get('/inventory-procurement/transactions');

export const createInventoryTransaction = (data) =>
  api.post('/inventory-procurement/transactions', data);

export const getMaintenanceLogs = () =>
  api.get('/inventory-procurement/maintenance');

export const createMaintenanceLog = (data) =>
  api.post('/inventory-procurement/maintenance', data);

export const updateMaintenanceLog = (id, data) =>
  api.put(`/inventory-procurement/maintenance/${id}`, data);
