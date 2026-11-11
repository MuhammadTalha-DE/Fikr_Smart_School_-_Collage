import { useEffect, useState } from 'react';
import { BookOpenText, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../../components/common/Layout';
import { DashboardCard, DashboardSectionHeader } from '../../components/common/RoleDashboardUI';
import { createLedgerAccount, getLedgerAccounts, updateLedgerAccount } from '../../services/generalLedgerService';

const emptyForm = {
  code: '',
  name: '',
  type: 'income',
  category: '',
  openingBalance: 0,
  bookType: 'general',
  notes: '',
  isActive: true,
};

const LedgerAccountsPage = () => {
  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState('');

  const loadAccounts = async () => {
    const response = await getLedgerAccounts();
    setAccounts(response.data?.data || []);
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    try {
      if (editingId) {
        await updateLedgerAccount(editingId, form);
        toast.success('Ledger account updated');
      } else {
        await createLedgerAccount(form);
        toast.success('Ledger account created');
      }
      setForm(emptyForm);
      setEditingId('');
      await loadAccounts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not save ledger account');
    }
  };

  return (
    <Layout role="admin">
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        <DashboardCard className="p-5 md:p-6">
          <DashboardSectionHeader icon={BookOpenText} title="Chart of Accounts" subtitle="Manage income, expense, asset, liability, and equity accounts" tone="blue" />
          <form onSubmit={submit} className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="Account code" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" />
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Account name" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" />
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none">
              {['asset', 'liability', 'equity', 'income', 'expense'].map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Category" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" />
            <input type="number" value={form.openingBalance} onChange={(e) => setForm({ ...form, openingBalance: Number(e.target.value || 0) })} placeholder="Opening balance" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" />
            <select value={form.bookType} onChange={(e) => setForm({ ...form, bookType: e.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none">
              {['cash', 'bank', 'general', 'internal'].map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notes" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none md:col-span-2" />
            <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700">
              <Plus className="h-4 w-4" />
              {editingId ? 'Update Account' : 'Create Account'}
            </button>
          </form>
        </DashboardCard>

        <DashboardCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {['Code', 'Name', 'Type', 'Category', 'Book', 'Opening', 'Current', 'Action'].map((label) => (
                    <th key={label} className="px-4 py-3 text-left font-semibold text-slate-700">{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {accounts.map((account) => (
                  <tr key={account._id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3">{account.code}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{account.name}</td>
                    <td className="px-4 py-3 capitalize">{account.type}</td>
                    <td className="px-4 py-3">{account.category || '—'}</td>
                    <td className="px-4 py-3 capitalize">{account.bookType}</td>
                    <td className="px-4 py-3">{Number(account.openingBalance || 0).toLocaleString()}</td>
                    <td className="px-4 py-3">{Number(account.currentBalance || 0).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(account._id);
                          setForm({
                            code: account.code,
                            name: account.name,
                            type: account.type,
                            category: account.category || '',
                            openingBalance: account.openingBalance || 0,
                            bookType: account.bookType || 'general',
                            notes: account.notes || '',
                            isActive: account.isActive,
                          });
                        }}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DashboardCard>
      </div>
    </Layout>
  );
};

export default LedgerAccountsPage;
