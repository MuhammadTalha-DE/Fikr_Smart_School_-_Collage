const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const {
  createAlert,
  getAlerts,
  getAlertById,
  updateAlert,
  acknowledgeAlert,
  deleteAlert,
  createIncident,
  getIncidents,
  getIncidentById,
  updateIncident,
  deleteIncident,
  createContact,
  getContacts,
  updateContact,
  deleteContact,
  getSafetyStats,
} = require('../controllers/safetyController');

// =====================================================
// All routes require authentication
// =====================================================
router.use(protect);

// =====================================================
// Safety Dashboard Stats
// =====================================================
router.get('/stats', getSafetyStats);

// =====================================================
// Emergency Alerts
// =====================================================
router
  .route('/alerts')
  .post(authorize('admin', 'teacher', 'warden'), createAlert)
  .get(getAlerts);

router
  .route('/alerts/:id')
  .get(getAlertById)
  .put(authorize('admin', 'teacher', 'warden'), updateAlert)
  .delete(authorize('admin'), deleteAlert);

router.post('/alerts/:id/acknowledge', acknowledgeAlert);

// =====================================================
// Incident Reports
// =====================================================
router
  .route('/incidents')
  .post(createIncident)
  .get(getIncidents);

router
  .route('/incidents/:id')
  .get(getIncidentById)
  .put(authorize('admin', 'teacher', 'warden'), updateIncident)
  .delete(authorize('admin'), deleteIncident);

// =====================================================
// Emergency Contacts
// =====================================================
router
  .route('/contacts')
  .post(authorize('admin'), createContact)
  .get(getContacts);

router
  .route('/contacts/:id')
  .put(authorize('admin'), updateContact)
  .delete(authorize('admin'), deleteContact);

module.exports = router;
