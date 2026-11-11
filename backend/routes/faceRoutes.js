const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const {
  faceVerifyLimiter,
  faceEnrollLimiter,
  faceGeneralLimiter,
} = require('../middleware/rateLimiter');
const {
  enrollFace,
  verifyFace,
  getFaceLogs,
  getFaceStatus,
  deleteFaceProfile,
  checkLiveness,
  getFaceAnalytics,
  getFaceTrends,
  getFaceByRole,
  getEnrolledUsers,
  requestRecovery,
  verifyRecovery,
  identifyFace,
} = require('../controllers/faceController');

const router = express.Router();

router.post('/verify', faceVerifyLimiter, verifyFace);
router.post('/identify', faceVerifyLimiter, identifyFace);
router.post('/recovery', faceVerifyLimiter, requestRecovery);
router.post('/recovery/verify', faceVerifyLimiter, verifyRecovery);

router.post('/enroll', protect, faceEnrollLimiter, enrollFace);
router.get('/status', protect, faceGeneralLimiter, getFaceStatus);
router.delete('/profile', protect, faceGeneralLimiter, deleteFaceProfile);
router.post('/liveness', protect, faceVerifyLimiter, checkLiveness);

router.get('/logs', protect, authorize('admin'), faceGeneralLimiter, getFaceLogs);
router.get('/analytics', protect, authorize('admin'), faceGeneralLimiter, getFaceAnalytics);
router.get('/trends', protect, authorize('admin'), faceGeneralLimiter, getFaceTrends);
router.get('/by-role', protect, authorize('admin'), faceGeneralLimiter, getFaceByRole);
router.get('/enrolled-users', protect, authorize('admin'), faceGeneralLimiter, getEnrolledUsers);

module.exports = router;
