const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const ctrl = require('../controllers/admissionController');

// All routes are admin‑only
router.use(protect);
router.use(authorize('admin'));

// ── Static routes first ────────────────────────────────
router.get('/', ctrl.getAdmissions);
router.post('/', ctrl.createAdmission);

// ── Parameterized routes ───────────────────────────────
router.get('/:id', ctrl.getAdmissionById);
router.put('/:id', ctrl.updateAdmission);              // edit application
router.delete('/:id', ctrl.deleteAdmission);           // delete application
router.put('/:id/accept', ctrl.acceptAdmission);       // accept & enroll
router.put('/:id/reject', ctrl.rejectAdmission);       // reject application

module.exports = router;