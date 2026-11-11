const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { uploadLimiter, writeLimiter } = require('../middleware/rateLimiter');
const {
  createUser,
  getUsers,
  deleteUser,
  getUserProfile,
  bulkDeleteUsers,
  adminUpdateCredentials,
  adminUpdatePermissions,
  getWardens,
} = require('../controllers/userController');
const {
  bulkImportUsers,
  downloadTemplate,
  upload,
} = require('../controllers/bulkImportController');

const router = express.Router();

router.route('/')
  .post(protect, authorize('admin'), writeLimiter, createUser)
  .get(protect, authorize('admin'), getUsers);

router.get('/profile', protect, getUserProfile);
router.get('/wardens', protect, authorize('admin'), getWardens);

router.post('/bulk-import', protect, authorize('admin'), uploadLimiter, upload.single('file'), bulkImportUsers);
router.get('/bulk-import/template', protect, authorize('admin'), downloadTemplate);
router.post('/bulk-delete', protect, authorize('admin'), writeLimiter, bulkDeleteUsers);

router.put('/:id/credentials', protect, authorize('admin'), writeLimiter, adminUpdateCredentials);
router.put('/:id/permissions', protect, authorize('admin'), writeLimiter, adminUpdatePermissions);
router.delete('/:id', protect, authorize('admin'), writeLimiter, deleteUser);

module.exports = router;
