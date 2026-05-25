const { body } = require('express-validator');

const menuValidator = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('price')
    .isFloat({ min: 0.01 })
    .withMessage('Price must be a positive number'),
  body('availability')
    .optional()
    .isBoolean()
    .withMessage('Availability must be true or false'),
  body('description').optional().trim(),
  body('image').optional().trim().isURL().withMessage('Image must be a valid URL'),
];

module.exports = { menuValidator };
