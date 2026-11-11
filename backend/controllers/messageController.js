const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const mongoose = require('mongoose');
const asyncHandler = require('express-async-handler');
const { getIO } = require('../socket/socketServer');

const USER_SELECT = 'name username email avatar role';
const ALLOWED_SEARCH_ROLES = ['admin', 'teacher', 'student', 'parent', 'librarian', 'warden', 'transport'];

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const isParticipant = (conversation, userId) => (
  conversation?.participants?.some((participantId) => participantId.toString() === userId.toString())
);

const getParticipantKey = (participants) => participants
  .map((participantId) => participantId.toString())
  .sort()
  .join(':');

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const emitToUsers = (userIds, event, payload) => {
  try {
    const io = getIO();
    userIds.forEach((userId) => {
      const room = userId.toString();
      io.to(room).to(`user:${room}`).emit(event, payload);
    });
  } catch (error) {
    console.warn(`Socket emit skipped for ${event}:`, error.message);
  }
};

const getLastMessageText = ({ content = '', fileUrl = '', fileType = '', voiceUrl = '' }) => {
  const trimmedContent = content.trim();
  if (trimmedContent) return trimmedContent;
  if (voiceUrl) return 'Voice message';
  if (fileUrl) return fileType.startsWith('image/') ? 'Image' : 'File';
  return 'Message';
};

const getConversations = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const conversations = await Conversation.find({ participants: userId })
    .populate('participants', USER_SELECT)
    .sort({ 'lastMessage.createdAt': -1, updatedAt: -1 })
    .lean();

  const conversationIds = conversations.map((conversation) => conversation._id);
  const unreadCounts = await Message.aggregate([
    {
      $match: {
        conversationId: { $in: conversationIds },
        sender: { $ne: userId },
        read: false,
      },
    },
    { $group: { _id: '$conversationId', unread: { $sum: 1 } } },
  ]);

  const unreadByConversation = new Map(
    unreadCounts.map((item) => [item._id.toString(), item.unread])
  );

  res.json(conversations.map((conversation) => ({
    ...conversation,
    unread: unreadByConversation.get(conversation._id.toString()) || 0,
  })));
});

const getOrCreateConversation = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { recipientId } = req.body;

  if (!recipientId || !isValidObjectId(recipientId) || recipientId === userId.toString()) {
    res.status(400);
    throw new Error('Invalid recipient');
  }

  const recipient = await User.findById(recipientId).select('_id role');
  if (!recipient) {
    res.status(404);
    throw new Error('Recipient not found');
  }

  if (req.user.role === 'student' && recipient.role !== 'teacher') {
    res.status(403);
    throw new Error('Students can only start conversations with teachers');
  }

  const participantKey = getParticipantKey([userId, recipientId]);
  let conversation = await Conversation.findOne({ participantKey })
    .populate('participants', USER_SELECT);

  if (!conversation) {
    try {
      conversation = await Conversation.create({
        participants: [userId, recipientId],
        participantKey,
      });
    } catch (error) {
      if (error.code !== 11000) throw error;
      conversation = await Conversation.findOne({ participantKey });
    }

    conversation = await Conversation.findById(conversation._id)
      .populate('participants', USER_SELECT);
  }

  res.json(conversation);
});

const getMessages = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 30, 1), 100);

  if (!isValidObjectId(conversationId)) {
    res.status(400);
    throw new Error('Invalid conversation');
  }

  const conversation = await Conversation.findById(conversationId);
  if (!conversation || !isParticipant(conversation, req.user._id)) {
    res.status(403);
    throw new Error('Access denied');
  }

  const messages = await Message.find({ conversationId })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('sender', 'name avatar role')
    .lean();

  res.json(messages.reverse());
});

const sendMessage = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const {
    content = '',
    fileUrl = '',
    fileType = '',
    voiceUrl = '',
    voiceDuration = '',
  } = req.body;

  if (!isValidObjectId(conversationId)) {
    res.status(400);
    throw new Error('Invalid conversation');
  }

  const trimmedContent = content.trim();
  if (!trimmedContent && !fileUrl && !voiceUrl) {
    res.status(400);
    throw new Error('Message must have text, a file, or a voice note');
  }

  const conversation = await Conversation.findById(conversationId);
  if (!conversation || !isParticipant(conversation, req.user._id)) {
    res.status(403);
    throw new Error('Access denied');
  }

  const createdMsg = await Message.create({
    conversationId,
    sender: req.user._id,
    content: trimmedContent,
    fileUrl,
    fileType,
    voiceUrl,
    voiceDuration,
    deliveredAt: new Date(),
  });

  conversation.lastMessage = {
    text: getLastMessageText({ content: trimmedContent, fileUrl, fileType, voiceUrl }),
    sender: req.user._id,
    createdAt: createdMsg.createdAt,
  };
  await conversation.save();

  const populatedMsg = await Message.findById(createdMsg._id)
    .populate('sender', 'name avatar role')
    .populate('reactions.userId', 'name');

  const recipientIds = conversation.participants.filter(
    (participantId) => participantId.toString() !== req.user._id.toString()
  );
  emitToUsers(recipientIds, 'new-message', {
    conversationId,
    message: populatedMsg,
  });

  res.status(201).json(populatedMsg);
});

const markAsRead = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const userId = req.user._id;

  if (!isValidObjectId(conversationId)) {
    res.status(400);
    throw new Error('Invalid conversation');
  }

  const conversation = await Conversation.findById(conversationId);
  if (!conversation || !isParticipant(conversation, userId)) {
    res.status(403);
    throw new Error('Access denied');
  }

  const unreadMessages = await Message.find({
    conversationId,
    sender: { $ne: userId },
    read: false,
  }).select('sender');

  if (unreadMessages.length === 0) {
    return res.json({ message: 'Marked as read', modifiedCount: 0 });
  }

  await Message.updateMany(
    { _id: { $in: unreadMessages.map((message) => message._id) } },
    { read: true, readAt: new Date() }
  );

  const senders = [...new Set(unreadMessages.map((message) => message.sender.toString()))];
  emitToUsers(senders, 'messages-read', { conversationId, readBy: userId, at: new Date() });

  res.json({ message: 'Marked as read', modifiedCount: unreadMessages.length });
});

const searchUsers = asyncHandler(async (req, res) => {
  const q = String(req.query.q || '').trim().slice(0, 80);
  const filterRole = String(req.query.role || '').trim().toLowerCase();
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 25);

  if (q.length < 2) return res.json([]);

  if (filterRole && !ALLOWED_SEARCH_ROLES.includes(filterRole)) {
    res.status(400);
    throw new Error('Invalid role filter');
  }

  const forcedRole = req.user.role === 'student' ? 'teacher' : filterRole;
  if (req.user.role === 'student' && filterRole && filterRole !== 'teacher') {
    return res.json([]);
  }

  const terms = q
    .split(/\s+/)
    .map(escapeRegex)
    .filter(Boolean)
    .slice(0, 5);

  const query = {
    _id: { $ne: req.user._id },
    ...(forcedRole ? { role: forcedRole } : {}),
    $and: terms.map((term) => {
      const regex = new RegExp(term, 'i');
      return {
        $or: [
          { name: regex },
          { username: regex },
          { email: regex },
          { role: regex },
        ],
      };
    }),
  };

  const users = await User.find(query)
    .select(USER_SELECT)
    .limit(limit * 3)
    .lean();

  const normalizedQuery = q.toLowerCase();
  const rankedUsers = users
    .map((user) => {
      const name = (user.name || '').toLowerCase();
      const username = (user.username || '').toLowerCase();
      const email = (user.email || '').toLowerCase();
      const rank =
        (name === normalizedQuery ? 100 : 0) +
        (username === normalizedQuery ? 90 : 0) +
        (email === normalizedQuery ? 80 : 0) +
        (name.startsWith(normalizedQuery) ? 40 : 0) +
        (username.startsWith(normalizedQuery) ? 35 : 0) +
        (email.startsWith(normalizedQuery) ? 25 : 0);
      return { ...user, rank };
    })
    .sort((a, b) => b.rank - a.rank || a.name.localeCompare(b.name))
    .slice(0, limit)
    .map(({ rank, ...user }) => user);

  res.json(rankedUsers);
});

const toggleReaction = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { emoji } = req.body;
  const userId = req.user._id;

  if (!isValidObjectId(messageId)) {
    res.status(400);
    throw new Error('Invalid message');
  }

  if (!emoji || String(emoji).length > 16) {
    res.status(400);
    throw new Error('Invalid reaction');
  }

  const message = await Message.findById(messageId);
  if (!message) {
    res.status(404);
    throw new Error('Message not found');
  }

  const conversation = await Conversation.findById(message.conversationId);
  if (!conversation || !isParticipant(conversation, userId)) {
    res.status(403);
    throw new Error('Access denied');
  }

  const existingIdx = message.reactions.findIndex(
    (reaction) => reaction.userId.toString() === userId.toString()
  );

  if (existingIdx > -1) {
    if (message.reactions[existingIdx].emoji === emoji) {
      message.reactions.splice(existingIdx, 1);
    } else {
      message.reactions[existingIdx].emoji = emoji;
    }
  } else {
    message.reactions.push({ userId, emoji });
  }

  await message.save();
  const updated = await Message.findById(message._id).populate('reactions.userId', 'name');

  emitToUsers(conversation.participants, 'message-reaction', {
    messageId,
    reactions: updated.reactions,
  });

  res.json(updated.reactions);
});

module.exports = {
  getConversations,
  getOrCreateConversation,
  getMessages,
  sendMessage,
  markAsRead,
  searchUsers,
  toggleReaction,
};
