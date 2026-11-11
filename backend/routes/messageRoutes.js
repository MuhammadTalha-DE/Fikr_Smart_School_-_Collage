const express = require('express');
const  asyncHandler = require('express-async-handler')
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();
const ctrl = require('../controllers/messageController');
const chatUpload = require('../middleware/chatUploadMiddleware');


router.get('/conversations', protect, ctrl.getConversations);
router.post('/conversations', protect, ctrl.getOrCreateConversation);
router.get('/conversations/:conversationId', protect, ctrl.getMessages);
router.post('/conversations/:conversationId', protect, ctrl.sendMessage);
router.post('/:messageId/reaction', protect, ctrl.toggleReaction);
router.put('/conversations/:conversationId/read', protect, ctrl.markAsRead);
router.get('/search-users', protect, ctrl.searchUsers);
router.post('/upload', protect, chatUpload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) throw new Error('No file uploaded');
  const url = `/uploads/chat/${req.file.filename}`;
  res.json({ url, fileType: req.file.mimetype });
}));






module.exports = router;