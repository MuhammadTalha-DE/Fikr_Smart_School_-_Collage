const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/chat/' });
const { protect } = require('../middleware/authMiddleware');
const {
  handleMessage,
  getConversations,
  getConversation,
  deleteConversation,
  handleVisionMessage,
  updateFeedback,
  handleMessageStream
} = require('../controllers/chatbotController');

router.post('/message', protect, handleMessage);
router.post('/vision', protect, upload.single('image'), handleVisionMessage);
router.get('/conversations', protect, getConversations);
router.post('/message/stream', protect, handleMessageStream);
router.get('/conversations/:id', protect, getConversation);
router.delete('/conversations/:id', protect, deleteConversation);
router.put('/conversations/:convId/messages/:msgId/feedback', protect, updateFeedback);

module.exports = router;