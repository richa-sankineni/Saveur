const { body } = require('express-validator');

const createOrderValidator = [
  body('tableId').isInt({ min: 1 }).withMessage('Valid tableId is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.menuItemId')
    .isInt({ min: 1 })
    .withMessage('Each item must have a valid menuItemId'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Each item must have a quantity of at least 1'),
];

const updateStatusValidator = [
  body('status')
    .isIn(['received', 'preparing', 'ready', 'completed'])
    .withMessage('Status must be one of: received, preparing, ready, completed'),
];

module.exports = { createOrderValidator, updateStatusValidator };
