const router = require('express').Router();
const {
  createMenuItem, getMenuItems, getMenuItem, updateMenuItem, deleteMenuItem
} = require('../controllers/menuController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { menuValidator } = require('../validators/menuValidator');


router.get('/', getMenuItems);
router.get('/:id', getMenuItem);


router.post('/', authenticate, authorize('admin'), menuValidator, validate, createMenuItem);
router.put('/:id', authenticate, authorize('admin'), updateMenuItem);
router.delete('/:id', authenticate, authorize('admin'), deleteMenuItem);

module.exports = router;
