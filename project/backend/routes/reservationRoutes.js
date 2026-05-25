const router = require('express').Router();
const { createReservation, getReservations, updateReservationStatus } = require('../controllers/reservationController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { reservationValidator } = require('../validators/reservationValidator');

router.post('/', authenticate, authorize('customer', 'admin', 'waiter'), reservationValidator, validate, createReservation);
router.get('/', authenticate, getReservations);
router.put('/:id/status', authenticate, authorize('admin', 'waiter'), updateReservationStatus);

module.exports = router;
