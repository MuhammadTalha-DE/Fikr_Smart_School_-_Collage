const Book = require('../models/Book');
const asyncHandler = require('express-async-handler');

// GET /api/books?search=&category=&available=
const getBooks = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.search) {
    const term = req.query.search;
    filter.$or = [
      { title: { $regex: term, $options: 'i' } },
      { author: { $regex: term, $options: 'i' } },
      { isbn: { $regex: term, $options: 'i' } },
    ];
  }
  if (req.query.category) filter.category = req.query.category;
  if (req.query.available === 'true') filter.availableQuantity = { $gt: 0 };

  const books = await Book.find(filter).sort({ title: 1 });
  res.json({ success: true, books });
});

// GET /api/books/:id
const getBookById = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id);
  if (!book) {
    res.status(404);
    throw new Error('Book not found');
  }
  res.json({ success: true, book });
});

// POST /api/books
const createBook = asyncHandler(async (req, res) => {
  const book = await Book.create(req.body);
  res.status(201).json({ success: true, book });
});

// PUT /api/books/:id
const updateBook = asyncHandler(async (req, res) => {
  const book = await Book.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!book) {
    res.status(404);
    throw new Error('Book not found');
  }
  res.json({ success: true, book });
});

// DELETE /api/books/:id
const deleteBook = asyncHandler(async (req, res) => {
  const book = await Book.findByIdAndDelete(req.params.id);
  if (!book) {
    res.status(404);
    throw new Error('Book not found');
  }
  res.json({ success: true, message: 'Book deleted' });
});

module.exports = { getBooks, getBookById, createBook, updateBook, deleteBook };