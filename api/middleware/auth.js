const jwt = require('jsonwebtoken');
const { ApiError } = require('./errorHandler');

const requireAdmin = (req, res, next) => {
  const authHeader = req.get('authorization') || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    next(new ApiError(401, 'UNAUTHORIZED', 'Admin bearer token is required.'));
    return;
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    if (payload.role !== 'admin') {
      next(new ApiError(403, 'FORBIDDEN', 'Admin access is required.'));
      return;
    }

    req.admin = payload;
    next();
  } catch (error) {
    next(new ApiError(401, 'INVALID_TOKEN', 'Admin token is invalid or expired.'));
  }
};

module.exports = {
  requireAdmin
};
