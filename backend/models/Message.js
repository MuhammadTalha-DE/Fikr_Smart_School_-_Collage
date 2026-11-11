const mongoose = require('mongoose');

const reactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  emoji: String,
}, { _id: false });

const messageSchema = new mongoose.Schema({
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, default: '' },
  fileUrl: { type: String, default: '' },
  fileType: { type: String, default: '' },   // e.g. "image/png", "application/pdf"
  voiceUrl: { type: String, default: '' },
  voiceDuration: { type: String, default: '' },
  reactions: [reactionSchema],
  read: { type: Boolean, default: false },
  deliveredAt: Date,
  readAt: Date,
}, { timestamps: true });

messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ conversationId: 1, sender: 1, read: 1 });

module.exports = mongoose.model('Message', messageSchema);
