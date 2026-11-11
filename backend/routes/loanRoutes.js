const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const ctrl = require('../controllers/loanController');

router.use(protect);
router.use(authorize('admin', 'librarian'));

router.get('/loans', ctrl.getLoans);
router.post('/issue', ctrl.issueBook);
router.post('/return', ctrl.returnBook);

module.exports = router;