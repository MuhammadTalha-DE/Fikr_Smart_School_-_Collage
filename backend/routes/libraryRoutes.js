const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const ctrl = require('../controllers/libraryController');
const loanCtrl = require('../controllers/loanController');   // ← for issue/return

// ── All routes require a valid token ──
router.use(protect);

// ─── SELF‑SERVICE (any logged‑in user) ─────────────────
router.get('/my-loans', ctrl.getMyLoans);
router.post('/renew/:transactionId', ctrl.renewBook);

// ─── ADMIN & LIBRARIAN only ───────────────────────────
router.get('/users', authorize('admin', 'librarian'), ctrl.getEligibleUsers);
router.get('/stats', authorize('admin', 'librarian'), ctrl.getLibraryStats);
router.get('/dashboard-stats', authorize('admin', 'librarian'), ctrl.getDashboardStats);

// Issue / Return (from old loanRoutes)
router.post('/issue', authorize('admin', 'librarian'), loanCtrl.issueBook);
router.post('/return', authorize('admin', 'librarian'), loanCtrl.returnBook);
router.get('/loans', authorize('admin', 'librarian'), loanCtrl.getLoans);

module.exports = router;