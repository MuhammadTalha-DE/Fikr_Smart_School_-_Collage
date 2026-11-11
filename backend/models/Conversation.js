const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  participantKey: { type: String, unique: true, sparse: true },
  lastMessage: {
    text: String,
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: Date,
  },
}, { timestamps: true });

conversationSchema.pre('validate', function (next) {
  if (Array.isArray(this.participants) && this.participants.length) {
    this.participantKey = this.participants
      .map((participantId) => participantId.toString())
      .sort()
      .join(':');
  }
  next();
});

conversationSchema.index({ participants: 1, updatedAt: -1 });
conversationSchema.index({ 'lastMessage.createdAt': -1 });

module.exports = mongoose.model('Conversation', conversationSchema);
