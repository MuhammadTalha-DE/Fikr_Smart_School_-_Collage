const LedgerAccount = require('../models/LedgerAccount');
const LedgerVoucher = require('../models/LedgerVoucher');

const accountNormalSign = {
  asset: 1,
  expense: 1,
  liability: -1,
  equity: -1,
  income: -1,
};

const normalizeVoucher = (payload = {}) => {
  const lines = (payload.lines || []).map((line) => ({
    accountId: line.accountId,
    description: line.description || '',
    debit: Number(line.debit || 0),
    credit: Number(line.credit || 0),
  }));

  const totalDebit = lines.reduce((sum, line) => sum + Number(line.debit || 0), 0);
  const totalCredit = lines.reduce((sum, line) => sum + Number(line.credit || 0), 0);

  return { lines, totalDebit, totalCredit };
};

exports.syncAccountBalances = async () => {
  const [accounts, vouchers] = await Promise.all([
    LedgerAccount.find().lean(),
    LedgerVoucher.find({ status: 'posted' }).lean(),
  ]);

  const movementMap = new Map();

  vouchers.forEach((voucher) => {
    (voucher.lines || []).forEach((line) => {
      const current = movementMap.get(String(line.accountId)) || { debit: 0, credit: 0 };
      current.debit += Number(line.debit || 0);
      current.credit += Number(line.credit || 0);
      movementMap.set(String(line.accountId), current);
    });
  });

  await Promise.all(
    accounts.map((account) => {
      const movement = movementMap.get(String(account._id)) || { debit: 0, credit: 0 };
      const sign = accountNormalSign[account.type] || 1;
      const delta = sign === 1
        ? movement.debit - movement.credit
        : movement.credit - movement.debit;
      return LedgerAccount.findByIdAndUpdate(account._id, {
        currentBalance: Number(account.openingBalance || 0) + delta,
      });
    })
  );
};

exports.getAdminOverview = async () => {
  const [accounts, vouchers] = await Promise.all([
    LedgerAccount.find().sort({ code: 1 }).lean(),
    LedgerVoucher.find()
      .populate('createdBy', 'name')
      .populate('lines.accountId', 'code name type bookType category')
      .sort({ entryDate: -1, createdAt: -1 })
      .limit(20)
      .lean(),
  ]);

  const incomeAccounts = accounts.filter((account) => account.type === 'income');
  const expenseAccounts = accounts.filter((account) => account.type === 'expense');
  const bankAccounts = accounts.filter((account) => account.bookType === 'bank');
  const cashAccounts = accounts.filter((account) => account.bookType === 'cash');

  const summary = {
    totalAccounts: accounts.length,
    postedVouchers: vouchers.filter((voucher) => voucher.status === 'posted').length,
    totalIncome: incomeAccounts.reduce((sum, account) => sum + Number(account.currentBalance || 0), 0),
    totalExpense: expenseAccounts.reduce((sum, account) => sum + Number(account.currentBalance || 0), 0),
    cashBalance: cashAccounts.reduce((sum, account) => sum + Number(account.currentBalance || 0), 0),
    bankBalance: bankAccounts.reduce((sum, account) => sum + Number(account.currentBalance || 0), 0),
    hostelIncome: incomeAccounts
      .filter((account) => /hostel/i.test(`${account.name} ${account.category}`))
      .reduce((sum, account) => sum + Number(account.currentBalance || 0), 0),
    transportIncome: incomeAccounts
      .filter((account) => /transport/i.test(`${account.name} ${account.category}`))
      .reduce((sum, account) => sum + Number(account.currentBalance || 0), 0),
    salaryExpense: expenseAccounts
      .filter((account) => /salary|payroll/i.test(`${account.name} ${account.category}`))
      .reduce((sum, account) => sum + Number(account.currentBalance || 0), 0),
  };

  return {
    summary,
    accounts,
    recentVouchers: vouchers.slice(0, 8),
    cashBook: cashAccounts,
    bankBook: bankAccounts,
    statements: {
      netPosition: summary.totalIncome - summary.totalExpense,
      incomeAccounts,
      expenseAccounts,
    },
  };
};

exports.listAccounts = () =>
  LedgerAccount.find().sort({ code: 1 }).lean();

exports.createAccount = async (payload) => {
  const account = await LedgerAccount.create({
    ...payload,
    openingBalance: Number(payload.openingBalance || 0),
    currentBalance: Number(payload.openingBalance || 0),
  });
  return LedgerAccount.findById(account._id).lean();
};

exports.updateAccount = async (id, payload) => {
  const account = await LedgerAccount.findByIdAndUpdate(
    id,
    {
      ...payload,
      openingBalance: Number(payload.openingBalance || 0),
    },
    { new: true, runValidators: true }
  ).lean();

  await exports.syncAccountBalances();
  return LedgerAccount.findById(id).lean();
};

exports.listVouchers = () =>
  LedgerVoucher.find()
    .populate('createdBy', 'name')
    .populate('lines.accountId', 'code name type')
    .sort({ entryDate: -1, createdAt: -1 })
    .lean();

exports.createVoucher = async (payload, userId) => {
  const { lines, totalDebit, totalCredit } = normalizeVoucher(payload);

  if (!lines.length || totalDebit <= 0 || totalDebit !== totalCredit) {
    throw new Error('Voucher debit and credit totals must match and be greater than zero');
  }

  const voucher = await LedgerVoucher.create({
    ...payload,
    entryDate: payload.entryDate || new Date(),
    lines,
    totalDebit,
    totalCredit,
    createdBy: userId,
  });

  await exports.syncAccountBalances();

  return LedgerVoucher.findById(voucher._id)
    .populate('createdBy', 'name')
    .populate('lines.accountId', 'code name type')
    .lean();
};

exports.updateVoucher = async (id, payload) => {
  const { lines, totalDebit, totalCredit } = normalizeVoucher(payload);

  if (!lines.length || totalDebit <= 0 || totalDebit !== totalCredit) {
    throw new Error('Voucher debit and credit totals must match and be greater than zero');
  }

  const voucher = await LedgerVoucher.findByIdAndUpdate(
    id,
    {
      ...payload,
      entryDate: payload.entryDate || new Date(),
      lines,
      totalDebit,
      totalCredit,
    },
    { new: true, runValidators: true }
  );

  await exports.syncAccountBalances();

  return LedgerVoucher.findById(voucher._id)
    .populate('createdBy', 'name')
    .populate('lines.accountId', 'code name type')
    .lean();
};
