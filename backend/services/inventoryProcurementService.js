const InventoryItem = require('../models/InventoryItem');
const InventoryVendor = require('../models/InventoryVendor');
const PurchaseRequest = require('../models/PurchaseRequest');
const PurchaseOrder = require('../models/PurchaseOrder');
const InventoryTransaction = require('../models/InventoryTransaction');
const AssetMaintenanceLog = require('../models/AssetMaintenanceLog');

exports.getAdminOverview = async () => {
  const [
    items,
    vendors,
    requests,
    orders,
    transactions,
    maintenance,
  ] = await Promise.all([
    InventoryItem.find().populate('vendor', 'name').sort({ updatedAt: -1 }).lean(),
    InventoryVendor.find().sort({ name: 1 }).lean(),
    PurchaseRequest.find()
      .populate('vendor', 'name')
      .populate('requestedBy', 'name role')
      .sort({ createdAt: -1 })
      .limit(8)
      .lean(),
    PurchaseOrder.find()
      .populate('vendor', 'name')
      .populate('request', 'title status')
      .sort({ createdAt: -1 })
      .limit(8)
      .lean(),
    InventoryTransaction.find()
      .populate('item', 'name sku location')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),
    AssetMaintenanceLog.find()
      .populate('item', 'name sku location')
      .sort({ createdAt: -1 })
      .limit(8)
      .lean(),
  ]);

  const lowStockItems = items.filter((item) => item.currentStock <= item.reorderLevel);
  const openMaintenance = maintenance.filter((log) => log.status !== 'resolved');
  const pendingRequests = requests.filter((request) => ['pending', 'approved'].includes(request.status));
  const activeOrders = orders.filter((order) => ['issued', 'partially_received'].includes(order.status));

  const inventoryByLocation = items.reduce((acc, item) => {
    acc[item.location] = (acc[item.location] || 0) + item.currentStock;
    return acc;
  }, {});

  const inventoryByCategory = items.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + item.currentStock;
    return acc;
  }, {});

  const monthlySpend = orders
    .filter((order) => {
      const current = new Date();
      const created = new Date(order.createdAt);
      return created.getFullYear() === current.getFullYear() && created.getMonth() === current.getMonth();
    })
    .reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);

  return {
    summary: {
      totalItems: items.length,
      lowStockItems: lowStockItems.length,
      vendors: vendors.length,
      pendingRequests: pendingRequests.length,
      activeOrders: activeOrders.length,
      openMaintenance: openMaintenance.length,
      monthlySpend,
    },
    inventoryByLocation: Object.entries(inventoryByLocation).map(([location, quantity]) => ({ location, quantity })),
    inventoryByCategory: Object.entries(inventoryByCategory).map(([category, quantity]) => ({ category, quantity })),
    areaHighlights: {
      lab: items.filter((item) => item.location === 'lab').length,
      hostel: items.filter((item) => item.location === 'hostel').length,
      libraryConsumables: items.filter((item) => item.category === 'library_consumable').length,
      mainStore: items.filter((item) => item.location === 'main_store').length,
    },
    lowStockItems: lowStockItems.slice(0, 8),
    recentRequests: requests,
    recentOrders: orders,
    recentTransactions: transactions,
    maintenance,
  };
};
