import express from 'express';
import request from 'supertest';
import { createRequire } from 'module';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const require = createRequire(import.meta.url);
const controller = require('../controllers/generalLedgerController');
const service = require('../services/generalLedgerService');

const withAdmin = (req, res, next) => {
  req.user = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Admin User',
    role: 'admin',
  };
  next();
};

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.get('/api/general-ledger/admin/overview', withAdmin, controller.getAdminOverview);
  app.post('/api/general-ledger/vouchers', withAdmin, controller.createVoucher);
  return app;
};

describe('General ledger API', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the general ledger overview payload', async () => {
    vi.spyOn(service, 'getAdminOverview').mockResolvedValue({
      summary: { totalAccounts: 14, postedVouchers: 6, totalIncome: 250000, totalExpense: 175000 },
      recentVouchers: [],
      statements: { netPosition: 75000, incomeAccounts: [], expenseAccounts: [] },
    });

    const response = await request(createApp()).get('/api/general-ledger/admin/overview');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.summary.totalAccounts).toBe(14);
  });

  it('creates a voucher with a success message', async () => {
    vi.spyOn(service, 'createVoucher').mockResolvedValue({
      _id: 'voucher-1',
      voucherNumber: 'JV-1001',
      status: 'draft',
    });

    const payload = {
      voucherType: 'journal',
      book: 'general',
      moduleSource: 'manual',
      narration: 'Opening journal',
      entries: [
        { accountCode: 'CASH', debit: 1000, credit: 0 },
        { accountCode: 'FEE', debit: 0, credit: 1000 },
      ],
    };

    const response = await request(createApp())
      .post('/api/general-ledger/vouchers')
      .send(payload);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toContain('created successfully');
    expect(service.createVoucher).toHaveBeenCalledWith(payload, '507f1f77bcf86cd799439011');
  });
});
