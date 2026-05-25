const router = require('express').Router();
const {
  createOrder, getOrders, getOrder, updateOrderStatus, deleteOrder, assignWaiter
} = require('../controllers/orderController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { createOrderValidator, updateStatusValidator } = require('../validators/orderValidator');

router.post('/', authenticate, authorize('customer', 'waiter', 'admin'), createOrderValidator, validate, createOrder);
router.get('/', authenticate, getOrders);
router.get('/:id', authenticate, getOrder);
router.put('/:id/status', authenticate, authorize('chef', 'waiter', 'admin'), updateStatusValidator, validate, updateOrderStatus);
router.put('/:id/assign-waiter', authenticate, authorize('admin', 'waiter'), assignWaiter);
router.delete('/:id', authenticate, authorize('admin'), deleteOrder);

module.exports = router;
