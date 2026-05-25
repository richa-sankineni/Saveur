const { error } = require('../utils/responseHandler');

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return error(res, 'Not authenticated.', 401);
    }

    if (!roles.includes(req.user.role)) {
      return error(
        res,
        `Access denied. Required role(s): ${roles.join(', ')}. Your role: ${req.user.role}`,
        403
      );
    }

    next();
  };
};

module.exports = { authorize };
