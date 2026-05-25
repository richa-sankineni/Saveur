const router = require('express').Router();
const { createTable, getTables, updateTable } = require('../controllers/tableController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.post('/', authenticate, authorize('admin'), createTable);
router.get('/', authenticate, getTables);
router.put('/:id', authenticate, authorize('admin', 'waiter'), updateTable);

module.exports = router;
