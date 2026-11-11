const User = require('../models/User');
const Book = require('../models/Book');

const LibraryTransaction = require('../models/LibraryTransaction');
const asyncHandler = require('express-async-handler');

// GET /api/library/users
const getEligibleUsers = asyncHandler(async (req, res) => {
  const users = await User.find({ role: { $in: ['student', 'teacher', 'parent'] } })
    .select('name role email avatar ')
    .sort('name');
  res.json({ success: true, users });
});

// GET /api/library/stats
const getLibraryStats = asyncHandler(async (req, res) => {
  const totalBooks = await Book.countDocuments();
  const totalIssued = await LibraryTransaction.countDocuments({ status: 'issued' });
  const overdue = await LibraryTransaction.countDocuments({
    status: 'issued',
    dueDate: { $lt: new Date() }
  });

  res.json({
    totalBooks,
    totalIssued,
    overdue,
  });
});

// GET /api/library/dashboard-stats
  const getDashboardStats = asyncHandler(async (req, res) => {
  const totalBooks = await Book.countDocuments();
  const totalIssued = await LibraryTransaction.countDocuments({ status: 'issued' });
  const overdue = await LibraryTransaction.countDocuments({
    status: 'issued',
    dueDate: { $lt: new Date() },
  });

  const recentLoans = await LibraryTransaction.find()
    .populate('book', 'title')
    .populate('user', 'name role avatar')   // ← must be exactly this
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  res.json({
    totalBooks,
    totalIssued,
    overdue,
    recentLoans,
  });
});
   const  getMyLoans = asyncHandler(async (req, res) => {
  // req.user._id is the logged-in user ID
  const loans = await LibraryTransaction.find({ user: req.user._id })
    .populate('book', 'title author coverImage rackNo')
    .populate('user', 'name role avatar')   
    .sort({ issueDate: -1 })
    .lean();

  res.json({ success: true, loans });
});

// POST /api/library/renew/:transactionId
         const renewBook = asyncHandler(async (req, res) => {
  const { transactionId } = req.params;
  const { days = 7 } = req.body;   // default renewal extension 7 days

  const loan = await LibraryTransaction.findById(transactionId);
  if (!loan || loan.status !== 'issued') {
    res.status(400);
    throw new Error('Loan is not active');
  }

  // Optional: check if already renewed (if you add a renewalCount field)
  // if (loan.renewalCount >= 2) throw new Error('Maximum renewals reached');

  // Ensure no outstanding fine on this loan
  if (loan.fine > 0) {
    res.status(400);
    throw new Error('Please clear outstanding fine before renewing');
  }

  // Extend due date
  const currentDue = new Date(loan.dueDate);
  currentDue.setDate(currentDue.getDate() + days);
  loan.dueDate = currentDue;
  // loan.renewalCount = (loan.renewalCount || 0) + 1;   // if you add the field
  await loan.save();

  res.json({ success: true, loan });
});


module.exports = { getEligibleUsers, getLibraryStats, getDashboardStats,getMyLoans,renewBook};