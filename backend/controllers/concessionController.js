const Concession = require('../models/Concession');
const StudentFeeAccount = require('../models/StudentFeeAccount');
const asyncHandler = require('express-async-handler');

// POST /api/fee-accounts/:accountId/concessions
exports.applyConcession = asyncHandler(async (req, res) => {
  const { accountId } = req.params;
  const { amount, reason } = req.body;

  if (!amount || amount <= 0) {
    res.status(400);
    throw new Error('Valid concession amount is required');
  }

  const account = await StudentFeeAccount.findById(accountId);
  if (!account) {
    res.status(404);
    throw new Error('Fee account not found');
  }

  // Create concession record
  const concession = await Concession.create({
    studentFeeAccount: accountId,
    amount,
    reason,
    appliedBy: req.user._id,
  });

  // Reduce totalAmount and dueAmount
  account.totalAmount -= amount;
  account.dueAmount = account.totalAmount - account.paidAmount;
  account.status = account.dueAmount <= 0 ? 'paid' : 'unpaid';
  await account.save();

  res.status(201).json({ success: true, concession, account });
});