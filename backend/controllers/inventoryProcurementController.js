const InventoryItem = require('../models/InventoryItem');
const InventoryVendor = require('../models/InventoryVendor');
const PurchaseRequest = require('../models/PurchaseRequest');
const PurchaseOrder = require('../models/PurchaseOrder');
const InventoryTransaction = require('../models/InventoryTransaction');
const AssetMaintenanceLog = require('../models/AssetMaintenanceLog');
const inventoryProcurementService = require('../services/inventoryProcurementService');
const auditService = require('../services/auditService');

const buildSearchFilter = (search, fields) => {
  if (!search) return {};
  return {
    $or: fields.map((field) => ({ [field]: { $regex: search, $options: 'i' } })),
  };
};

const normalizeTotal = (items = [], key = 'estimatedUnitCost') =>
  items.reduce((sum, item) => sum + (Number(item.quantity || 0) * Number(item[key] || 0)), 0);

exports.getAdminOverview = async (req, res) => {
  try {
    const data = await inventoryProcurementService.getAdminOverview();
    res.json({ success: true, data });
  } catch (error) {
    throw error;
  }
};

exports.listItems = async (req, res) => {
  try {
    const filter = buildSearchFilter(req.query.search, ['name', 'sku', 'notes']);
    const items = await InventoryItem.find(filter)
      .populate('vendor', 'name email phone')
      .sort({ updatedAt: -1 })
      .lean();
    res.json({ success: true, data: items });
  } catch (error) {
    throw error;
  }
};

exports.createItem = async (req, res) => {
  try {
    const item = await InventoryItem.create(req.body);
    auditService.log({
      action: 'CREATE',
      entity: 'InventoryItem',
      entityId: item._id,
      module: 'inventory',
      description: `Inventory item ${item.name} created`,
      performedBy: { userId: req.user._id, role: req.user.role, name: req.user.name },
      req,
    });
    const populated = await InventoryItem.findById(item._id).populate('vendor', 'name email phone').lean();
    res.status(201).json({ success: true, data: populated, message: 'Inventory item created successfully.' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateItem = async (req, res) => {
  try {
    const item = await InventoryItem.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('vendor', 'name email phone')
      .lean();
    if (!item) return res.status(404).json({ success: false, message: 'Inventory item not found.' });
    auditService.log({
      action: 'UPDATE',
      entity: 'InventoryItem',
      entityId: item._id,
      module: 'inventory',
      description: `Inventory item ${item.name} updated`,
      performedBy: { userId: req.user._id, role: req.user.role, name: req.user.name },
      req,
    });
    res.json({ success: true, data: item, message: 'Inventory item updated successfully.' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.listVendors = async (req, res) => {
  try {
    const filter = buildSearchFilter(req.query.search, ['name', 'email', 'phone', 'category']);
    const vendors = await InventoryVendor.find(filter).sort({ name: 1 }).lean();
    res.json({ success: true, data: vendors });
  } catch (error) {
    throw error;
  }
};

exports.createVendor = async (req, res) => {
  try {
    const vendor = await InventoryVendor.create(req.body);
    auditService.log({
      action: 'CREATE',
      entity: 'InventoryVendor',
      entityId: vendor._id,
      module: 'inventory',
      description: `Vendor ${vendor.name} created`,
      performedBy: { userId: req.user._id, role: req.user.role, name: req.user.name },
      req,
    });
    res.status(201).json({ success: true, data: vendor, message: 'Vendor created successfully.' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateVendor = async (req, res) => {
  try {
    const vendor = await InventoryVendor.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).lean();
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found.' });
    auditService.log({
      action: 'UPDATE',
      entity: 'InventoryVendor',
      entityId: vendor._id,
      module: 'inventory',
      description: `Vendor ${vendor.name} updated`,
      performedBy: { userId: req.user._id, role: req.user.role, name: req.user.name },
      req,
    });
    res.json({ success: true, data: vendor, message: 'Vendor updated successfully.' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.listPurchaseRequests = async (req, res) => {
  try {
    const requests = await PurchaseRequest.find()
      .populate('vendor', 'name')
      .populate('requestedBy', 'name role')
      .populate('items.inventoryItem', 'name sku')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, data: requests });
  } catch (error) {
    throw error;
  }
};

exports.createPurchaseRequest = async (req, res) => {
  try {
    const payload = {
      ...req.body,
      requestedBy: req.user._id,
      totalEstimatedCost: normalizeTotal(req.body.items || []),
    };
    const created = await PurchaseRequest.create(payload);
    auditService.log({
      action: 'CREATE',
      entity: 'PurchaseRequest',
      entityId: created._id,
      module: 'inventory',
      description: `Purchase request ${created.title} created`,
      performedBy: { userId: req.user._id, role: req.user.role, name: req.user.name },
      req,
    });
    const populated = await PurchaseRequest.findById(created._id)
      .populate('vendor', 'name')
      .populate('requestedBy', 'name role')
      .populate('items.inventoryItem', 'name sku')
      .lean();
    res.status(201).json({ success: true, data: populated, message: 'Purchase request created successfully.' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.updatePurchaseRequest = async (req, res) => {
  try {
    const payload = {
      ...req.body,
      totalEstimatedCost: normalizeTotal(req.body.items || []),
    };
    const requestDoc = await PurchaseRequest.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true })
      .populate('vendor', 'name')
      .populate('requestedBy', 'name role')
      .populate('items.inventoryItem', 'name sku')
      .lean();
    if (!requestDoc) return res.status(404).json({ success: false, message: 'Purchase request not found.' });
    auditService.log({
      action: 'UPDATE',
      entity: 'PurchaseRequest',
      entityId: requestDoc._id,
      module: 'inventory',
      description: `Purchase request ${requestDoc.title} updated`,
      performedBy: { userId: req.user._id, role: req.user.role, name: req.user.name },
      req,
    });
    res.json({ success: true, data: requestDoc, message: 'Purchase request updated successfully.' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.listPurchaseOrders = async (req, res) => {
  try {
    const orders = await PurchaseOrder.find()
      .populate('vendor', 'name')
      .populate('request', 'title status')
      .populate('items.inventoryItem', 'name sku')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, data: orders });
  } catch (error) {
    throw error;
  }
};

exports.createPurchaseOrder = async (req, res) => {
  try {
    const payload = {
      ...req.body,
      createdBy: req.user._id,
      totalAmount: normalizeTotal(req.body.items || [], 'unitCost'),
    };
    const created = await PurchaseOrder.create(payload);
    if (created.request) {
      await PurchaseRequest.findByIdAndUpdate(created.request, { status: 'ordered' });
    }
    auditService.log({
      action: 'CREATE',
      entity: 'PurchaseOrder',
      entityId: created._id,
      module: 'inventory',
      description: `Purchase order ${created.poNumber} created`,
      performedBy: { userId: req.user._id, role: req.user.role, name: req.user.name },
      req,
    });
    const populated = await PurchaseOrder.findById(created._id)
      .populate('vendor', 'name')
      .populate('request', 'title status')
      .populate('items.inventoryItem', 'name sku')
      .lean();
    res.status(201).json({ success: true, data: populated, message: 'Purchase order created successfully.' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.updatePurchaseOrder = async (req, res) => {
  try {
    const payload = {
      ...req.body,
      totalAmount: normalizeTotal(req.body.items || [], 'unitCost'),
    };
    const order = await PurchaseOrder.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true })
      .populate('vendor', 'name')
      .populate('request', 'title status')
      .populate('items.inventoryItem', 'name sku')
      .lean();
    if (!order) return res.status(404).json({ success: false, message: 'Purchase order not found.' });
    auditService.log({
      action: 'UPDATE',
      entity: 'PurchaseOrder',
      entityId: order._id,
      module: 'inventory',
      description: `Purchase order ${order.poNumber} updated`,
      performedBy: { userId: req.user._id, role: req.user.role, name: req.user.name },
      req,
    });
    res.json({ success: true, data: order, message: 'Purchase order updated successfully.' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.listTransactions = async (req, res) => {
  try {
    const transactions = await InventoryTransaction.find()
      .populate('item', 'name sku location')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, data: transactions });
  } catch (error) {
    throw error;
  }
};

exports.createTransaction = async (req, res) => {
  try {
    const item = await InventoryItem.findById(req.body.item);
    if (!item) return res.status(404).json({ success: false, message: 'Inventory item not found.' });

    const transaction = await InventoryTransaction.create({
      ...req.body,
      createdBy: req.user._id,
    });

    const quantity = Number(req.body.quantity || 0);
    if (['issue', 'consume', 'maintenance'].includes(req.body.type)) {
      item.currentStock = Math.max(0, Number(item.currentStock || 0) - quantity);
    } else {
      item.currentStock = Number(item.currentStock || 0) + quantity;
      item.lastRestockedAt = new Date();
    }
    await item.save();

    auditService.log({
      action: 'CREATE',
      entity: 'InventoryTransaction',
      entityId: transaction._id,
      module: 'inventory',
      description: `Inventory transaction ${req.body.type} recorded for ${item.name}`,
      performedBy: { userId: req.user._id, role: req.user.role, name: req.user.name },
      req,
    });

    const populated = await InventoryTransaction.findById(transaction._id)
      .populate('item', 'name sku location')
      .lean();
    res.status(201).json({ success: true, data: populated, message: 'Store transaction recorded successfully.' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.listMaintenanceLogs = async (req, res) => {
  try {
    const logs = await AssetMaintenanceLog.find()
      .populate('item', 'name sku location')
      .populate('reportedBy', 'name role')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, data: logs });
  } catch (error) {
    throw error;
  }
};

exports.createMaintenanceLog = async (req, res) => {
  try {
    const log = await AssetMaintenanceLog.create({
      ...req.body,
      reportedBy: req.user._id,
    });
    await InventoryItem.findByIdAndUpdate(req.body.item, { maintenanceRequired: true, status: 'maintenance' });
    auditService.log({
      action: 'CREATE',
      entity: 'AssetMaintenanceLog',
      entityId: log._id,
      module: 'inventory',
      description: `Maintenance log created for asset ${req.body.item}`,
      performedBy: { userId: req.user._id, role: req.user.role, name: req.user.name },
      req,
    });
    const populated = await AssetMaintenanceLog.findById(log._id)
      .populate('item', 'name sku location')
      .populate('reportedBy', 'name role')
      .lean();
    res.status(201).json({ success: true, data: populated, message: 'Maintenance log created successfully.' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateMaintenanceLog = async (req, res) => {
  try {
    const payload = { ...req.body };
    if (payload.status === 'resolved' && !payload.resolvedAt) {
      payload.resolvedAt = new Date();
    }
    const log = await AssetMaintenanceLog.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true })
      .populate('item', 'name sku location')
      .populate('reportedBy', 'name role')
      .lean();
    if (!log) return res.status(404).json({ success: false, message: 'Maintenance log not found.' });
    if (log.item?._id) {
      await InventoryItem.findByIdAndUpdate(log.item._id, {
        maintenanceRequired: log.status !== 'resolved',
        status: log.status === 'resolved' ? 'active' : 'maintenance',
      });
    }
    auditService.log({
      action: 'UPDATE',
      entity: 'AssetMaintenanceLog',
      entityId: log._id,
      module: 'inventory',
      description: `Maintenance log ${log._id} updated`,
      performedBy: { userId: req.user._id, role: req.user.role, name: req.user.name },
      req,
    });
    res.json({ success: true, data: log, message: 'Maintenance log updated successfully.' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

