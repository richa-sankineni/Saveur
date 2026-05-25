const { body } = require('express-validator');

const reservationValidator = [
  body('tableId').isInt({ min: 1 }).withMessage('Valid tableId is required'),
  body('reservationTime')
    .notEmpty()
    .withMessage('Reservation time is required')
    .isISO8601()
    .withMessage('Reservation time must be a valid ISO date'),
  body('guestsCount')
    .isInt({ min: 1 })
    .withMessage('Guests count must be at least 1'),
];

module.exports = { reservationValidator };
