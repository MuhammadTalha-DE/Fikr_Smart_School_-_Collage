import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Boxes, PackagePlus, Search, Truck } from 'lucide-react';
import Layout from '../../components/common/Layout';
import {
  DashboardCard,
  DashboardSectionHeader,
  DashboardStatCard,
} from '../../components/common/RoleDashboardUI';
import {
  createInventoryItem,
  getInventoryItems,
  getInventoryVendors,
  updateInventoryItem,
} from '../../services/inventoryProcurementService';

const initialItemForm = {
  name: '',
  sku: '',
  category: 'general',
  location: 'main_store',
  unit: 'pcs',
  currentStock: 0,
  reorderLevel: 0,
  unitCost: 0,
  vendor: '',
  status: 'active',
  notes: '',
};

const InventoryItemsPage = () => {
  const [search, setSearch] = useState('');
  const [items, setItems] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [itemForm, setItemForm] = useState(initialItemForm);
  const [editingId, setEditingId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async (query = '') => {
    const [itemsRes, vendorsRes] = await Promise.all([
      getInventoryItems(query ? { search: query } : {}),
      getInventoryVendors(),
    ]);
    setItems(itemsRes.data?.data || []);
    setVendors(vendorsRes.data?.data || []);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData(search);
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const lowStockCount = useMemo(
    () => items.filter((item) => Number(item.currentStock || 0) <= Number(item.reorderLevel || 0)).length,
    [items]
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        const response = await updateInventoryItem(editingId, itemForm);
        toast.success(response.data?.message || 'Inventory item updated successfully.');
      } else {
        const response = await createInventoryItem(itemForm);
        toast.success(response.data?.message || 'Inventory item created successfully.');
      }
      setItemForm(initialItemForm);
      setEditingId('');
      await loadData(search);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to save the inventory item right now.');
    } finally {
      setSubmitting(false);
    }
  };

  const editItem = (item) => {
    setEditingId(item._id);
    setItemForm({
      name: item.name || '',
      sku: item.sku || '',
      category: item.category || 'general',
      location: item.location || 'main_store',
      unit: item.unit || 'pcs',
      currentStock: item.currentStock || 0,
      reorderLevel: item.reorderLevel || 0,
      unitCost: item.unitCost || 0,
      vendor: item.vendor?._id || '',
      status: item.status || 'active',
      notes: item.notes || '',
    });
  };

  return (
    <Layout role="admin">
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <DashboardStatCard icon={Boxes} label="Tracked Items" value={items.length} helper="Stock records available in the system" tone="blue" />
          <DashboardStatCard icon={PackagePlus} label="Low Stock" value={lowStockCount} helper="Items at or below reorder level" tone="amber" />
          <DashboardStatCard icon={Truck} label="Vendors" value={vendors.length} helper="Suppliers linked to stock planning" tone="indigo" />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <DashboardCard className="p-5 md:p-6">
            <DashboardSectionHeader icon={PackagePlus} title={editingId ? 'Edit Stock Item' : 'Create Stock Item'} subtitle="Add or update inventory records for store, lab, hostel, library, and campus assets" tone="blue" />
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <input value={itemForm.name} onChange={(event) => setItemForm((current) => ({ ...current, name: event.target.value }))} placeholder="Item name" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" required />
                <input value={itemForm.sku} onChange={(event) => setItemForm((current) => ({ ...current, sku: event.target.value }))} placeholder="SKU" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" required />
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <select value={itemForm.category} onChange={(event) => setItemForm((current) => ({ ...current, category: event.target.value }))} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm">
                  {['general', 'lab', 'hostel', 'library_consumable', 'asset', 'maintenance_supply'].map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
                <select value={itemForm.location} onChange={(event) => setItemForm((current) => ({ ...current, location: event.target.value }))} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm">
                  {['main_store', 'lab', 'hostel', 'library', 'admin'].map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
                <input value={itemForm.unit} onChange={(event) => setItemForm((current) => ({ ...current, unit: event.target.value }))} placeholder="Unit" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <input type="number" value={itemForm.currentStock} onChange={(event) => setItemForm((current) => ({ ...current, currentStock: Number(event.target.value) }))} placeholder="Current stock" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
                <input type="number" value={itemForm.reorderLevel} onChange={(event) => setItemForm((current) => ({ ...current, reorderLevel: Number(event.target.value) }))} placeholder="Reorder level" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
                <input type="number" value={itemForm.unitCost} onChange={(event) => setItemForm((current) => ({ ...current, unitCost: Number(event.target.value) }))} placeholder="Unit cost" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <select value={itemForm.vendor} onChange={(event) => setItemForm((current) => ({ ...current, vendor: event.target.value }))} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm">
                  <option value="">No vendor linked</option>
                  {vendors.map((vendor) => <option key={vendor._id} value={vendor._id}>{vendor.name}</option>)}
                </select>
                <select value={itemForm.status} onChange={(event) => setItemForm((current) => ({ ...current, status: event.target.value }))} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm">
                  {['active', 'inactive', 'maintenance'].map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>
              <textarea value={itemForm.notes} onChange={(event) => setItemForm((current) => ({ ...current, notes: event.target.value }))} rows={4} placeholder="Notes, specifications, or asset details" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
              <div className="flex flex-wrap gap-3">
                <button type="submit" disabled={submitting} className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
                  {submitting ? 'Saving...' : editingId ? 'Update item' : 'Create item'}
                </button>
                {editingId ? (
                  <button type="button" onClick={() => { setEditingId(''); setItemForm(initialItemForm); }} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600">
                    Cancel edit
                  </button>
                ) : null}
              </div>
            </form>
          </DashboardCard>

          <DashboardCard className="p-5 md:p-6">
            <DashboardSectionHeader icon={Search} title="Stock Register" subtitle="Search and review inventory records with quick edit access" tone="indigo" />
            <div className="mb-4">
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name, SKU, or notes" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
            </div>
            <div className="space-y-3">
              {items.map((item) => (
                <button key={item._id} onClick={() => editItem(item)} className="w-full rounded-3xl border border-slate-200 bg-slate-50/80 p-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-sm font-black text-slate-950">{item.name}</p>
                      <p className="mt-1 text-xs text-slate-500">{item.sku} | {item.category} | {item.location}</p>
                      <p className="mt-1 text-xs text-slate-400">{item.vendor?.name || 'No vendor linked'} | PKR {(item.unitCost || 0).toLocaleString()} per {item.unit}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase ${Number(item.currentStock || 0) <= Number(item.reorderLevel || 0) ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        Stock {item.currentStock}
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold uppercase text-slate-600">{item.status}</span>
                    </div>
                  </div>
                </button>
              ))}
              {!items.length ? <div className="py-10 text-center text-sm text-slate-500">No stock items found for the current search.</div> : null}
            </div>
          </DashboardCard>
        </div>
      </div>
    </Layout>
  );
};

export default InventoryItemsPage;
