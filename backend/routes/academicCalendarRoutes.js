const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');   // ← corrected import
const ctrl = require('../controllers/academicCalendarController');

// All routes protected
router.use(protect);

// Sessions (admin only)
router.post('/sessions', authorize('admin'), ctrl.createSession);
router.get('/sessions', ctrl.getSessions);                         // all authenticated users
router.put('/sessions/:id', authorize('admin'), ctrl.updateSession);
router.delete('/sessions/:id', authorize('admin'), ctrl.deleteSession);

// Events
router.post('/events', authorize('admin'), ctrl.createEvent);
router.get('/events', ctrl.getEvents);
router.put('/events/:id', authorize('admin'), ctrl.updateEvent);
router.delete('/events/:id', authorize('admin'), ctrl.deleteEvent);

// Deadlines
router.post('/deadlines', authorize('admin'), ctrl.createDeadline);
router.get('/deadlines', ctrl.getDeadlines);
router.put('/deadlines/:id', authorize('admin'), ctrl.updateDeadline);
router.delete('/deadlines/:id', authorize('admin'), ctrl.deleteDeadline);

// Combined feed for calendar UI
router.get('/feed', ctrl.getCalendarData);

module.exports = router;