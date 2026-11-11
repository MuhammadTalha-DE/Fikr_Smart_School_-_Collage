const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
  content: { type: String, required: true },
}, { timestamps: true });

const chatConversationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, default: 'New Chat' },        // auto‑generated from first message
  messages: [messageSchema],
  isActive: { type: Boolean, default: true },
   lastReadAt: { type: Date, default: null },  
}, { timestamps: true });

module.exports = mongoose.model('ChatConversation', chatConversationSchema);