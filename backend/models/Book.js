const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    author: { type: String, required: true },
    isbn: { type: String, unique: true },
    category: String,
    totalQuantity: { type: Number, default: 1 },
    availableQuantity: { type: Number, default: 1 },
    rackNo: String,
    coverImage: String,   // URL
  },
  { timestamps: true }
);

module.exports = mongoose.model('Book', bookSchema);