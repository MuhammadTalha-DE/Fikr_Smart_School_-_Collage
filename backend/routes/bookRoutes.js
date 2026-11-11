const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const ctrl = require('../controllers/bookController');

router.use(protect);
router.use(authorize('admin', 'librarian'));   // only admin and librarian

router.get('/', ctrl.getBooks);
router.post('/', ctrl.createBook);
router.get('/:id', ctrl.getBookById);
router.put('/:id', ctrl.updateBook);
router.delete('/:id', ctrl.deleteBook);

module.exports = router;