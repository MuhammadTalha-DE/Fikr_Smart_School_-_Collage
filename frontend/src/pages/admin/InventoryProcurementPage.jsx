import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ClipboardList, ShoppingCart, Store, Truck } from 'lucide-react';
import Layout from '../../components/common/Layout';
import {
  DashboardCard,
  DashboardSectionHeader,
  DashboardStatCard,
} from '../../components/common/RoleDashboardUI';
import {
  createInventoryVendor,
  createPurchaseOrder,
  createPurchaseRequest,
  getInventoryItems,
  getInventoryVendors,
  getPurchaseOrders,
  getPurchaseRequests,
  updatePurchaseOrder,
  updatePurchaseRequest,
  updateInventoryVendor,
} from '../../services/inventoryProcurementService';

const initialVendorForm = {
  name: '',
  email: '',
  phone: '',
  category: 'general',
  status: 'active',
  leadTimeDays: 0,
  rating: 0,
  address: '',
  notes: '',
};

const initialRequestForm = {
  title: '',
  department: 'general',
  priority: 'medium',
  status: 'pending',
  itemId: '',
  quantity: 1,
  estimatedUnitCost: 0,
  justification: '',
  vendor: '',
};

const initialOrderForm = {
  poNumber: '',
  vendor: '',
  request: '',
  status: 'issued',
  itemId: '',
  quantity: 1,
  unitCost: 0,
  expectedDelivery: '',
  notes: '',
};

const InventoryProcurementPage = () => {
  const [vendors, setVendors] = useState([]);
  const [items, setItems] = useState([]);
  const [requests, setRequests] = useState([]);
  const [orders, setOrders] = useState([]);
  const [vendorForm, setVendorForm] = useState(initialVendorForm);
  const [requestForm, setRequestForm] = useState(initialRequestForm);
  const [orderForm, setOrderForm] = useState(initialOrderForm);
  const [editingVendorId, setEditingVendorId] = useState('');

  const loadData = async () => {
    const [vendorRes, itemRes, requestRes, orderRes] = await Promise.all([
      getInventoryVendors(),
      getInventoryItems(),
      getPurchaseRequests(),
      getPurchaseOrders(),
    ]);
    setVendors(vendorRes.data?.data || []);
    setItems(itemRes.data?.data || []);
    setRequests(requestRes.data?.data || []);
    setOrders(orderRes.data?.data || []);
  };

  useEffect(() => {
    loadData();
  }, []);

  const submitVendor = async (event) => {
    event.preventDefault();
    try {
      if (editingVendorId) {
        const response = await updateInventoryVendor(editingVendorId, vendorForm);
        toast.success(response.data?.message || 'Vendor updated successfully.');
      } else {
        const response = await createInventoryVendor(vendorForm);
        toast.success(response.data?.message || 'Vendor created successfully.');
      }
      setVendorForm(initialVendorForm);
      setEditingVendorId('');
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to save the vendor right now.');
    }
  };

  const submitRequest = async (event) => {
    event.preventDefault();
    try {
      const selectedItem = items.find((item) => item._id === requestForm.itemId);
      const payload = {
        title: requestForm.title,
        department: requestForm.department,
        priority: requestForm.priority,
        status: requestForm.status,
        justification: requestForm.justification,
        vendor: requestForm.vendor || null,
        items: [
          {
            inventoryItem: requestForm.itemId || null,
            itemName: selectedItem?.name || requestForm.title,
            quantity: Number(requestForm.quantity || 1),
            estimatedUnitCost: Number(requestForm.estimatedUnitCost || 0),
          },
        ],
      };
      const response = await createPurchaseRequest(payload);
      toast.success(response.data?.message || 'Purchase request created successfully.');
      setRequestForm(initialRequestForm);
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to create the purchase request right now.');
    }
  };

  const submitOrder = async (event) => {
    event.preventDefault();
    try {
      const selectedItem = items.find((item) => item._id === orderForm.itemId);
      const payload = {
        poNumber: orderForm.poNumber,
        vendor: orderForm.vendor,
        request: orderForm.request || null,
        status: orderForm.status,
        expectedDelivery: orderForm.expectedDelivery || null,
        notes: orderForm.notes,
        items: [
          {
            inventoryItem: orderForm.itemId || null,
            description: selectedItem?.name || orderForm.poNumber,
            quantity: Number(orderForm.quantity || 1),
            unitCost: Number(orderForm.unitCost || 0),
          },
        ],
      };
      const response = await createPurchaseOrder(payload);
      toast.success(response.data?.message || 'Purchase order created successfully.');
      setOrderForm(initialOrderForm);
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to create the purchase order right now.');
    }
  };

  const toRequestPayload = (request, status) => ({
    title: request.title,
    department: request.department,
    priority: request.priority,
    status,
    justification: request.justification || '',
    neededBy: request.neededBy || null,
    vendor: request.vendor?._id || request.vendor || null,
    items: (request.items || []).map((item) => ({
      inventoryItem: item.inventoryItem?._id || item.inventoryItem || null,
      itemName: item.itemName,
      quantity: Number(item.quantity || 0),
      estimatedUnitCost: Number(item.estimatedUnitCost || 0),
    })),
  });

  const toOrderPayload = (order, status) => ({
    poNumber: order.poNumber,
    vendor: order.vendor?._id || order.vendor,
    request: order.request?._id || order.request || null,
    status,
    orderedAt: order.orderedAt || null,
    expectedDelivery: order.expectedDelivery || null,
    notes: order.notes || '',
    items: (order.items || []).map((item) => ({
      inventoryItem: item.inventoryItem?._id || item.inventoryItem || null,
      description: item.description,
      quantity: Number(item.quantity || 0),
      receivedQuantity: Number(item.receivedQuantity || 0),
      unitCost: Number(item.unitCost || 0),
    })),
  });

  const updateRequestStatus = async (requestId, status) => {
    try {
      const request = requests.find((item) => item._id === requestId);
      const response = await updatePurchaseRequest(requestId, toRequestPayload(request, status));
      toast.success(response.data?.message || 'Purchase request updated successfully.');
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to update the purchase request status.');
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      const order = orders.find((item) => item._id === orderId);
      const response = await updatePurchaseOrder(orderId, toOrderPayload(order, status));
      toast.success(response.data?.message || 'Purchase order updated successfully.');
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to update the purchase order status.');
    }
  };

  return (
    <Layout role="admin">
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <DashboardStatCard icon={Truck} label="Vendors" value={vendors.length} helper="Registered procurement partners" tone="blue" />
          <DashboardStatCard icon={ClipboardList} label="Requests" value={requests.length} helper="Purchase requests across departments" tone="violet" />
          <DashboardStatCard icon={ShoppingCart} label="Orders" value={orders.length} helper="Purchase orders created in the system" tone="emerald" />
          <DashboardStatCard icon={Store} label="Supply Base" value={items.length} helper="Inventory items ready for procurement linkage" tone="indigo" />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.92fr_1.08fr]">
          <DashboardCard className="p-5 md:p-6">
            <DashboardSectionHeader icon={Truck} title={editingVendorId ? 'Edit Vendor' : 'Add Vendor'} subtitle="Build and maintain your supplier directory" tone="blue" />
            <form onSubmit={submitVendor} className="space-y-3">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <input value={vendorForm.name} onChange={(event) => setVendorForm((current) => ({ ...current, name: event.target.value }))} placeholder="Vendor name" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" required />
                <input value={vendorForm.category} onChange={(event) => setVendorForm((current) => ({ ...current, category: event.target.value }))} placeholder="Category" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <input value={vendorForm.email} onChange={(event) => setVendorForm((current) => ({ ...current, email: event.target.value }))} placeholder="Email" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
                <input value={vendorForm.phone} onChange={(event) => setVendorForm((current) => ({ ...current, phone: event.target.value }))} placeholder="Phone" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <select value={vendorForm.status} onChange={(event) => setVendorForm((current) => ({ ...current, status: event.target.value }))} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm">
                  {['active', 'inactive'].map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
                <input type="number" value={vendorForm.leadTimeDays} onChange={(event) => setVendorForm((current) => ({ ...current, leadTimeDays: Number(event.target.value) }))} placeholder="Lead time days" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
                <input type="number" value={vendorForm.rating} onChange={(event) => setVendorForm((current) => ({ ...current, rating: Number(event.target.value) }))} placeholder="Rating" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
              </div>
              <input value={vendorForm.address} onChange={(event) => setVendorForm((current) => ({ ...current, address: event.target.value }))} placeholder="Address" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
              <textarea value={vendorForm.notes} onChange={(event) => setVendorForm((current) => ({ ...current, notes: event.target.value }))} rows={3} placeholder="Notes" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
              <div className="flex flex-wrap gap-3">
                <button type="submit" className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">{editingVendorId ? 'Update vendor' : 'Create vendor'}</button>
                {editingVendorId ? <button type="button" onClick={() => { setEditingVendorId(''); setVendorForm(initialVendorForm); }} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600">Cancel edit</button> : null}
              </div>
            </form>
          </DashboardCard>

          <DashboardCard className="p-5 md:p-6">
            <DashboardSectionHeader icon={Store} title="Vendor Registry" subtitle="Active and inactive vendor relationships with quick edit access" tone="indigo" />
            <div className="space-y-3">
              {vendors.map((vendor) => (
                <button key={vendor._id} onClick={() => { setEditingVendorId(vendor._id); setVendorForm({ ...initialVendorForm, ...vendor }); }} className="w-full rounded-3xl border border-slate-200 bg-slate-50/80 p-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-slate-950">{vendor.name}</p>
                      <p className="mt-1 text-xs text-slate-500">{vendor.category} | {vendor.email || 'No email'} | {vendor.phone || 'No phone'}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold uppercase text-slate-600">{vendor.status}</span>
                  </div>
                </button>
              ))}
            </div>
          </DashboardCard>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1fr]">
          <DashboardCard className="p-5 md:p-6">
            <DashboardSectionHeader icon={ClipboardList} title="Create Purchase Request" subtitle="Request materials for daily operations, labs, hostel, and library" tone="violet" />
            <form onSubmit={submitRequest} className="space-y-3">
              <input value={requestForm.title} onChange={(event) => setRequestForm((current) => ({ ...current, title: event.target.value }))} placeholder="Request title" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" required />
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <input value={requestForm.department} onChange={(event) => setRequestForm((current) => ({ ...current, department: event.target.value }))} placeholder="Department" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
                <select value={requestForm.priority} onChange={(event) => setRequestForm((current) => ({ ...current, priority: event.target.value }))} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm">
                  {['low', 'medium', 'high', 'critical'].map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
                <select value={requestForm.status} onChange={(event) => setRequestForm((current) => ({ ...current, status: event.target.value }))} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm">
                  {['pending', 'approved', 'rejected', 'ordered'].map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <select value={requestForm.itemId} onChange={(event) => setRequestForm((current) => ({ ...current, itemId: event.target.value }))} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm">
                  <option value="">Choose inventory item</option>
                  {items.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
                </select>
                <input type="number" value={requestForm.quantity} onChange={(event) => setRequestForm((current) => ({ ...current, quantity: Number(event.target.value) }))} placeholder="Quantity" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
                <input type="number" value={requestForm.estimatedUnitCost} onChange={(event) => setRequestForm((current) => ({ ...current, estimatedUnitCost: Number(event.target.value) }))} placeholder="Estimated unit cost" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
              </div>
              <select value={requestForm.vendor} onChange={(event) => setRequestForm((current) => ({ ...current, vendor: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm">
                <option value="">Preferred vendor (optional)</option>
                {vendors.map((vendor) => <option key={vendor._id} value={vendor._id}>{vendor.name}</option>)}
              </select>
              <textarea value={requestForm.justification} onChange={(event) => setRequestForm((current) => ({ ...current, justification: event.target.value }))} rows={3} placeholder="Why this item is needed" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
              <button type="submit" className="rounded-2xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white">Create purchase request</button>
            </form>
          </DashboardCard>

          <DashboardCard className="p-5 md:p-6">
            <DashboardSectionHeader icon={ShoppingCart} title="Create Purchase Order" subtitle="Convert approved needs into real vendor orders" tone="emerald" />
            <form onSubmit={submitOrder} className="space-y-3">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <input value={orderForm.poNumber} onChange={(event) => setOrderForm((current) => ({ ...current, poNumber: event.target.value }))} placeholder="PO number" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" required />
                <select value={orderForm.vendor} onChange={(event) => setOrderForm((current) => ({ ...current, vendor: event.target.value }))} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" required>
                  <option value="">Select vendor</option>
                  {vendors.map((vendor) => <option key={vendor._id} value={vendor._id}>{vendor.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <select value={orderForm.request} onChange={(event) => setOrderForm((current) => ({ ...current, request: event.target.value }))} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm">
                  <option value="">Link request (optional)</option>
                  {requests.map((request) => <option key={request._id} value={request._id}>{request.title}</option>)}
                </select>
                <select value={orderForm.itemId} onChange={(event) => setOrderForm((current) => ({ ...current, itemId: event.target.value }))} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm">
                  <option value="">Select item</option>
                  {items.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
                </select>
                <select value={orderForm.status} onChange={(event) => setOrderForm((current) => ({ ...current, status: event.target.value }))} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm">
                  {['issued', 'partially_received', 'completed', 'cancelled', 'draft'].map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <input type="number" value={orderForm.quantity} onChange={(event) => setOrderForm((current) => ({ ...current, quantity: Number(event.target.value) }))} placeholder="Quantity" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
                <input type="number" value={orderForm.unitCost} onChange={(event) => setOrderForm((current) => ({ ...current, unitCost: Number(event.target.value) }))} placeholder="Unit cost" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
                <input type="date" value={orderForm.expectedDelivery} onChange={(event) => setOrderForm((current) => ({ ...current, expectedDelivery: event.target.value }))} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
              </div>
              <textarea value={orderForm.notes} onChange={(event) => setOrderForm((current) => ({ ...current, notes: event.target.value }))} rows={3} placeholder="Delivery or procurement notes" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
              <button type="submit" className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white">Create purchase order</button>
            </form>
          </DashboardCard>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1fr]">
          <DashboardCard className="p-5 md:p-6">
            <DashboardSectionHeader icon={ClipboardList} title="Request Queue" subtitle="Update purchase request status in place" tone="violet" />
            <div className="space-y-3">
              {requests.map((request) => (
                <div key={request._id} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-sm font-black text-slate-950">{request.title}</p>
                      <p className="mt-1 text-xs text-slate-500">{request.department} | PKR {(request.totalEstimatedCost || 0).toLocaleString()}</p>
                    </div>
                    <select value={request.status} onChange={(event) => updateRequestStatus(request._id, event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm">
                      {['draft', 'pending', 'approved', 'rejected', 'ordered'].map((item) => <option key={item} value={item}>{item}</option>)}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </DashboardCard>

          <DashboardCard className="p-5 md:p-6">
            <DashboardSectionHeader icon={ShoppingCart} title="Order Queue" subtitle="Track active vendor orders and update status clearly" tone="emerald" />
            <div className="space-y-3">
              {orders.map((order) => (
                <div key={order._id} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-sm font-black text-slate-950">{order.poNumber}</p>
                      <p className="mt-1 text-xs text-slate-500">{order.vendor?.name || 'Vendor'} | PKR {(order.totalAmount || 0).toLocaleString()}</p>
                    </div>
                    <select value={order.status} onChange={(event) => updateOrderStatus(order._id, event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm">
                      {['draft', 'issued', 'partially_received', 'completed', 'cancelled'].map((item) => <option key={item} value={item}>{item}</option>)}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </DashboardCard>
        </div>
      </div>
    </Layout>
  );
};

export default InventoryProcurementPage;
