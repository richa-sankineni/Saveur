const router = require('express').Router();
const { getBill, payBill, getAllBills } = require('../controllers/billController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/', authenticate, authorize('admin', 'waiter'), getAllBills);
router.get('/:orderId', authenticate, getBill);
router.put('/:orderId/pay', authenticate, authorize('admin', 'waiter'), payBill);

module.exports = router;
