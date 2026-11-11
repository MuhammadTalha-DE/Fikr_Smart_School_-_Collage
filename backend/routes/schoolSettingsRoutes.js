const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const upload = require('../middleware/logoUploadMiddleware');
const officialAssetUpload = require('../middleware/officialAssetUploadMiddleware');

const ctrl = require('../controllers/schoolSettingsController');


// ═══════════════════════════════════════
// Academic Year
// ═══════════════════════════════════════
router.post(
  '/academic-year/clone',
  protect,
  authorize('admin'),
  ctrl.cloneAcademicYear
);


// ═══════════════════════════════════════
// School Settings
// ═══════════════════════════════════════
router.get(
  '/',
  protect,
  authorize('admin'),
  ctrl.getSettings
);

router.put(
  '/',
  protect,
  authorize('admin'),
  ctrl.updateSettings
);


// ═══════════════════════════════════════
// School Logo
// ═══════════════════════════════════════
router.post(
  '/logo',
  protect,
  authorize('admin'),
  upload.single('logo'),
  ctrl.uploadLogo
);

router.delete(
  '/logo',
  protect,
  authorize('admin'),
  ctrl.deleteLogo
);


// ═══════════════════════════════════════
// Principal Signature
// ═══════════════════════════════════════
router.put(
  '/principal-signature',
  protect,
  authorize('admin'),
  officialAssetUpload.single('signature'),
  ctrl.uploadPrincipalSignature
);


// ═══════════════════════════════════════
// School Stamp
// ═══════════════════════════════════════
router.put(
  '/school-stamp',
  protect,
  authorize('admin'),
  officialAssetUpload.single('stamp'),
  ctrl.uploadSchoolStamp
);


module.exports = router;
