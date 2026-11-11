import api from './api';

export const getGeneralLedgerOverview = () =>
  api.get('/general-ledger/admin/overview');

export const getLedgerAccounts = () =>
  api.get('/general-ledger/accounts');

export const createLedgerAccount = (data) =>
  api.post('/general-ledger/accounts', data);

export const updateLedgerAccount = (id, data) =>
  api.put(`/general-ledger/accounts/${id}`, data);

export const getLedgerVouchers = () =>
  api.get('/general-ledger/vouchers');

export const createLedgerVoucher = (data) =>
  api.post('/general-ledger/vouchers', data);

export const updateLedgerVoucher = (id, data) =>
  api.put(`/general-ledger/vouchers/${id}`, data);
