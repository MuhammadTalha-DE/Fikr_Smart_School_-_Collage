const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant', 'system', 'tool'],
    required: true,
  },
  content: { type: String, required: true },
  feedback: { type: String, enum: ['up', 'down', null], default: null },
  imageUrl: { type: String, default: null },
}, { timestamps: true });

const chatbotConversationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: { type: String, default: 'New Chat' },
  mode: { type: String, enum: ['general', 'system'], default: 'general' },
  messages: [messageSchema],
}, { timestamps: true });

chatbotConversationSchema.index({ userId: 1, updatedAt: -1 });

module.exports = mongoose.model('ChatbotConversation', chatbotConversationSchema);