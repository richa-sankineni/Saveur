const router = require('express').Router();
const { getDashboardSummary } = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/summary', authenticate, authorize('admin', 'waiter', 'chef'), getDashboardSummary);

module.exports = router;
