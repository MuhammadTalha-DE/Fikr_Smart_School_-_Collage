import { useEffect, useState } from 'react';
import { Plus, ReceiptText } from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../../components/common/Layout';
import { DashboardCard, DashboardSectionHeader } from '../../components/common/RoleDashboardUI';
import { createLedgerVoucher, getLedgerAccounts, getLedgerVouchers } from '../../services/generalLedgerService';

const emptyVoucher = {
  voucherNumber: '',
  voucherType: 'journal',
  entryDate: new Date().toISOString().slice(0, 10),
  reference: '',
  narration: '',
  moduleSource: 'manual',
  book: 'journal',
  bankName: '',
  status: 'posted',
  lines: [
    { accountId: '', debit: 0, credit: 0, description: '' },
    { accountId: '', debit: 0, credit: 0, description: '' },
  ],
};

const LedgerVouchersPage = () => {
  const [accounts, setAccounts] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [form, setForm] = useState(emptyVoucher);

  const load = async () => {
    const [accountsRes, vouchersRes] = await Promise.all([getLedgerAccounts(), getLedgerVouchers()]);
    setAccounts(accountsRes.data?.data || []);
    setVouchers(vouchersRes.data?.data || []);
  };

  useEffect(() => {
    load();
  }, []);

  const setLine = (index, key, value) => {
    const lines = [...form.lines];
    lines[index] = { ...lines[index], [key]: value };
    setForm({ ...form, lines });
  };

  const submit = async (event) => {
    event.preventDefault();
    try {
      await createLedgerVoucher(form);
      toast.success('Voucher created');
      setForm(emptyVoucher);
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not create voucher');
    }
  };

  return (
    <Layout role="admin">
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        <DashboardCard className="p-5 md:p-6">
          <DashboardSectionHeader icon={ReceiptText} title="Voucher Center" subtitle="Post balanced receipts, payments, journals, and contra entries" tone="emerald" />
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <input value={form.voucherNumber} onChange={(e) => setForm({ ...form, voucherNumber: e.target.value })} placeholder="Voucher no." className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" />
              <select value={form.voucherType} onChange={(e) => setForm({ ...form, voucherType: e.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none">
                {['receipt', 'payment', 'journal', 'contra'].map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
              <input type="date" value={form.entryDate} onChange={(e) => setForm({ ...form, entryDate: e.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" />
              <select value={form.moduleSource} onChange={(e) => setForm({ ...form, moduleSource: e.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none">
                {['manual', 'fees', 'transport', 'hostel', 'payroll', 'other'].map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="Reference" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" />
              <input value={form.narration} onChange={(e) => setForm({ ...form, narration: e.target.value })} placeholder="Narration" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {form.lines.map((line, index) => (
                <div key={index} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4 space-y-3">
                  <select value={line.accountId} onChange={(e) => setLine(index, 'accountId', e.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none">
                    <option value="">Select account</option>
                    {accounts.map((account) => <option key={account._id} value={account._id}>{account.code} - {account.name}</option>)}
                  </select>
                  <input value={line.description} onChange={(e) => setLine(index, 'description', e.target.value)} placeholder="Line description" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" />
                  <div className="grid grid-cols-2 gap-3">
                    <input type="number" value={line.debit} onChange={(e) => setLine(index, 'debit', Number(e.target.value || 0))} placeholder="Debit" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" />
                    <input type="number" value={line.credit} onChange={(e) => setLine(index, 'credit', Number(e.target.value || 0))} placeholder="Credit" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" />
                  </div>
                </div>
              ))}
            </div>
            <button type="submit" className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700">
              <Plus className="h-4 w-4" />
              Create Voucher
            </button>
          </form>
        </DashboardCard>

        <DashboardCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {['Voucher', 'Type', 'Date', 'Source', 'Status', 'Amount'].map((label) => (
                    <th key={label} className="px-4 py-3 text-left font-semibold text-slate-700">{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vouchers.map((voucher) => (
                  <tr key={voucher._id}>
                    <td className="px-4 py-3 font-semibold text-slate-900">{voucher.voucherNumber}</td>
                    <td className="px-4 py-3 capitalize">{voucher.voucherType}</td>
                    <td className="px-4 py-3">{new Date(voucher.entryDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3 capitalize">{voucher.moduleSource}</td>
                    <td className="px-4 py-3"><span className="rounded-full bg-blue-100 px-3 py-1 text-[11px] font-bold uppercase text-blue-700">{voucher.status}</span></td>
                    <td className="px-4 py-3">{Number(voucher.totalDebit || 0).toLocaleString()}</td>
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

export default LedgerVouchersPage;
