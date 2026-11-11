const Payment = require('../models/Payment');
const FeeInstallment = require('../models/FeeInstallment');
const asyncHandler = require('express-async-handler');

exports.monthlyCollection = asyncHandler(async (req, res) => {
  const start = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const end = new Date();
  const result = await Payment.aggregate([
    { $match: { paymentDate: { $gte: start, $lte: end } } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  res.json({ total: result[0]?.total || 0 });
});

exports.collectionSummary = asyncHandler(async (req, res) => {
  const daily = await Payment.aggregate([
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$paymentDate' } }, total: { $sum: '$amount' } } },
    { $sort: { _id: -1 } }
  ]);
  const monthly = await Payment.aggregate([
    { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$paymentDate' } }, total: { $sum: '$amount' } } },
    { $sort: { _id: -1 } }
  ]);
  res.json({ daily, monthly });
});

exports.defaultersList = asyncHandler(async (req, res) => {
  const filter = { status: 'unpaid', dueDate: { $lt: new Date() } };
  // If class filter provided, we need to join with StudentFeeAccount and Student.
  // Simplified: get instalments and populate account -> student
  const instalments = await FeeInstallment.find(filter)
    .populate({
      path: 'studentFeeAccount',
      populate: { path: 'studentId', populate: { path: 'userId classId' } }
    })
    .lean();

  const data = instalments.map(inst => ({
    _id: inst._id,
    studentName: inst.studentFeeAccount?.studentId?.userId?.name || 'N/A',
    className: inst.studentFeeAccount?.studentId?.classId?.name || 'N/A',
    instalmentNumber: inst.instalmentNumber,
    dueDate: inst.dueDate,
    amount: inst.amount
  }));

  // Optional additional filtering by class
  if (req.query.class) {
    const filtered = data.filter(d => d.className && d.className._id?.toString() === req.query.class);
    return res.json(filtered);
  }
  res.json(data);
});