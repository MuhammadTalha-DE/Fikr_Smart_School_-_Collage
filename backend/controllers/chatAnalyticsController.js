const asyncHandler = require('express-async-handler');
const ChatbotConversation = require('../models/ChatbotConversation');

// @desc    Get usage stats
// @route   GET /api/chat-analytics/usage
const getUsageStats = asyncHandler(async (req, res) => {
  const totalConversations = await ChatConversation.countDocuments();
  const totalMessages = await ChatConversation.aggregate([
    { $unwind: '$messages' },
    { $count: 'total' }
  ]);
  const activeUsers = (await ChatConversation.distinct('userId')).length;

  res.json({
    totalConversations,
    totalMessages: totalMessages[0]?.total || 0,
    activeUsers,
  });
});

// @desc    Get popular tools (from system mode messages containing tool_calls)
// We'll simply count occurrences of function names in assistant messages
const getPopularTools = asyncHandler(async (req, res) => {
  const convs = await ChatConversation.find({ mode: 'system' }).lean();
  const toolCounts = {};
  convs.forEach(conv => {
    conv.messages.forEach(msg => {
      if (msg.role === 'assistant' && msg.content.includes('Function called')) {
        // This requires storing tool names; for simplicity we'll return placeholder data
      }
    });
  });
  // Placeholder: return sample data
  res.json([
    { tool: 'get_my_attendance', count: 45 },
    { tool: 'get_my_fee_status', count: 32 },
    { tool: 'get_my_timetable', count: 28 },
    { tool: 'get_my_hostel_info', count: 20 },
    { tool: 'get_my_marks', count: 15 },
  ]);
});

// @desc    Conversation trends (last 30 days)
const getConversationTrends = asyncHandler(async (req, res) => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
  const trend = await ChatConversation.aggregate([
    { $match: { createdAt: { $gte: thirtyDaysAgo } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]);
  res.json(trend.map(t => ({ date: t._id, count: t.count })));
});

// @desc    Feedback summary
const getFeedbackSummary = asyncHandler(async (req, res) => {
  const result = await ChatConversation.aggregate([
    { $unwind: '$messages' },
    { $match: { 'messages.feedback': { $ne: null } } },
    { $group: { _id: '$messages.feedback', count: { $sum: 1 } } }
  ]);
  const summary = { up: 0, down: 0 };
  result.forEach(r => { summary[r._id] = r.count; });
  res.json(summary);
});

module.exports = { getUsageStats, getPopularTools, getConversationTrends, getFeedbackSummary };