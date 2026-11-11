import express from 'express';
import request from 'supertest';
import { createRequire } from 'module';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const require = createRequire(import.meta.url);
const controller = require('../controllers/inventoryProcurementController');
const service = require('../services/inventoryProcurementService');
const InventoryItem = require('../models/InventoryItem');
const auditService = require('../services/auditService');

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
  app.get('/api/inventory-procurement/admin/overview', withAdmin, controller.getAdminOverview);
  app.post('/api/inventory-procurement/items', withAdmin, controller.createItem);
  return app;
};

describe('Inventory & procurement API', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the inventory overview payload', async () => {
    vi.spyOn(service, 'getAdminOverview').mockResolvedValue({
      summary: { totalItems: 14, lowStockItems: 2, vendors: 4, pendingRequests: 3, activeOrders: 2, openMaintenance: 1, monthlySpend: 120000 },
      lowStockItems: [],
      recentRequests: [],
      recentOrders: [],
      recentTransactions: [],
      maintenance: [],
    });

    const response = await request(createApp()).get('/api/inventory-procurement/admin/overview');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.summary.totalItems).toBe(14);
  });

  it('creates an inventory item with a success message', async () => {
    vi.spyOn(InventoryItem, 'create').mockResolvedValue({
      _id: 'item-1',
      name: 'Science Kit',
    });
    vi.spyOn(InventoryItem, 'findById').mockReturnValue({
      populate: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue({
        _id: 'item-1',
        name: 'Science Kit',
        sku: 'SCI-001',
      }),
    });
    vi.spyOn(auditService, 'log').mockResolvedValue();

    const response = await request(createApp())
      .post('/api/inventory-procurement/items')
      .send({
        name: 'Science Kit',
        sku: 'SCI-001',
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toContain('created successfully');
  });
});
