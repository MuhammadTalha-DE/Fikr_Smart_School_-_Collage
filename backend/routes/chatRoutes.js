const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const upload = require('../middleware/uploadMiddleware');
const { protect } = require('../middleware/authMiddleware');
const ctrl = require('../controllers/chatController');

router.use(protect);

router.post('/send', ctrl.sendMessage);
router.post('/stream', ctrl.streamMessage);

router.get('/conversations', ctrl.getConversations);
router.post('/upload', protect, upload.single('file'), ctrl.uploadFile);
router.get('/conversations/:id', ctrl.getConversation);
router.put('/conversations/:id', ctrl.updateConversation);         // ← new
router.delete('/conversations/:id', ctrl.deleteConversation);
router.put('/conversations/:id/read', ctrl.markAsRead);            // ← new

module.exports = router;