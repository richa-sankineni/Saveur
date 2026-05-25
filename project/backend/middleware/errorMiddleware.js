const { error } = require('../utils/responseHandler');

const errorHandler = (err, req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    console.error(`[ERROR] ${err.message}`);
  }

  if (err.name === 'ValidationError') {
    return error(res, err.message, 422);
  }

  if (err.message && err.message.includes('UNIQUE constraint failed')) {
    const field = err.message.split('.')[1] || 'field';
    return error(res, `Duplicate value: ${field} already exists.`, 409);
  }

  if (err.message && err.message.includes('FOREIGN KEY constraint failed')) {
    return error(res, 'Referenced record does not exist.', 400);
  }

  return error(res, err.message || 'Internal server error', err.statusCode || 500);
};

const notFound = (req, res) => {
  return error(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
};

module.exports = { errorHandler, notFound };
