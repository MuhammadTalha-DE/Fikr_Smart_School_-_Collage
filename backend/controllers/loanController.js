const LibraryTransaction = require('../models/LibraryTransaction');
const Book = require('../models/Book');
const User = require('../models/User');
const { calculateFine } = require('../services/fineService');
const { addLibraryFineToStudent } = require('../services/libraryFinanceService');
const Student = require('../models/Student');   // needed to get studentId from user
const asyncHandler = require('express-async-handler');

// POST /api/library/issue
const issueBook = asyncHandler(async (req, res) => {
  const { bookId, userId, issueDate, dueDate } = req.body;

  // 1. Validate book and user exist
  const book = await Book.findById(bookId);
  if (!book) {
    res.status(404);
    throw new Error('Book not found');
  }
  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // 2. Check availability
  if (book.availableQuantity <= 0) {
    res.status(400);
    throw new Error('Book is not available');
  }

  // 3. Check if user already has this book issued (optional, but good practice)
  const existingLoan = await LibraryTransaction.findOne({
    book: bookId,
    user: userId,
    status: 'issued',
  });
  if (existingLoan) {
    res.status(400);
    throw new Error('This user already has this book issued');
  }

  // 4. Create transaction
  const transaction = await LibraryTransaction.create({
    book: bookId,
    user: userId,
    issueDate: issueDate || new Date(),
    dueDate: dueDate,
    status: 'issued',
  });

  // 5. Decrease available quantity
  book.availableQuantity -= 1;
  await book.save();

  res.status(201).json({ success: true, transaction });
});

// POST /api/library/return
const returnBook = asyncHandler(async (req, res) => {
  const { transactionId, returnDate } = req.body;

  const transaction = await LibraryTransaction.findById(transactionId);
  if (!transaction || transaction.status !== 'issued') {
    res.status(400);
    throw new Error('Valid issued transaction not found');
  }

  // 1. Mark as returned
  const now = returnDate ? new Date(returnDate) : new Date();
  transaction.returnDate = now;
  transaction.status = 'returned';

  // 2. Calculate fine if overdue
    const fine = calculateFine(transaction.dueDate, now);
  transaction.fine = fine;
  await transaction.save();

  // 3. Increase available quantity of the book
  const book = await Book.findById(transaction.book);
  if (book) {
    book.availableQuantity += 1;
    await book.save();
  }

    // If fine > 0, add to student fee account
  if (fine > 0) {
    // The transaction.user is a User _id. We need the Student _id.
    const student = await Student.findOne({ userId: transaction.user });
    if (student) {
      try {
        await addLibraryFineToStudent(student._id, fine);
      } catch (err) {
        console.error('Failed to add library fine to fee account:', err);
        // non‑blocking – the transaction is already marked as returned
      }
    }
  }


  res.json({ success: true, transaction });
});

// GET /api/library/loans?status=issued&search=...
const getLoans = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.search) {
    const search = req.query.search;
    // search by user name or book title
    const users = await User.find({ name: { $regex: search, $options: 'i' } }).select('_id');
    const books = await Book.find({ title: { $regex: search, $options: 'i' } }).select('_id');
    filter.$or = [
      { user: { $in: users.map(u => u._id) } },
      { book: { $in: books.map(b => b._id) } },
    ];
  }

  const loans = await LibraryTransaction.find(filter)
    .populate('book', 'title author coverImage')
    .populate('user', 'name role email avatar')
    .sort({ issueDate: -1 });

  res.json({ success: true, loans });
});

module.exports = { issueBook, returnBook, getLoans };