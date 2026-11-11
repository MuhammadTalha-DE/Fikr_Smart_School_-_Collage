const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const {
  getAdminOverview,
  listNotifications,
  createNotification,
  updateNotification,
  sendNotification,
  deleteNotification,
  bulkDeleteNotifications,
  getNotificationById,
  getNotificationReceipts,
  getInbox,
  markAsRead,
  markAllAsRead,
  getPreferences,
  updatePreferences,
  getNotificationFilterOptions,
} = require('../controllers/notificationController');

router.use(protect);

router.get('/inbox', getInbox);
router.patch('/read-all', markAllAsRead);
router.patch('/receipts/:receiptId/read', markAsRead);
router.get('/preferences', getPreferences);
router.put('/preferences', updatePreferences);

router.get('/admin/overview', authorize('admin'), getAdminOverview);
router.get('/admin/options', authorize('admin'), getNotificationFilterOptions);
router.get('/admin', authorize('admin'), listNotifications);
router.post('/admin', authorize('admin'), createNotification);
router.delete('/admin/bulk', authorize('admin'), bulkDeleteNotifications);
router.get('/admin/:id', authorize('admin'), getNotificationById);
router.put('/admin/:id', authorize('admin'), updateNotification);
router.patch('/admin/:id', authorize('admin'), updateNotification);
router.delete('/admin/:id', authorize('admin'), deleteNotification);
router.post('/admin/:id/send', authorize('admin'), sendNotification);
router.get('/admin/:id/receipts', authorize('admin'), getNotificationReceipts);

module.exports = router;
