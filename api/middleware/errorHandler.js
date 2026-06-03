class ApiError extends Error {
  constructor(statusCode, code, message, details) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

const asyncHandler = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

const notFoundHandler = (req, res, next) => {
  next(new ApiError(404, 'NOT_FOUND', `Route not found: ${req.method} ${req.originalUrl}`));
};

const errorHandler = (error, req, res, next) => {
  const statusCode = error.statusCode || 500;
  const code = error.code || 'INTERNAL_ERROR';
  const message = statusCode >= 500 ? 'Internal server error.' : error.message;

  const payload = {
    success: false,
    error: {
      code,
      message
    }
  };

  if (error.details) {
    payload.error.details = error.details;
  }

  const logPayload = {
    code,
    message: error.message,
    method: req.method,
    path: req.originalUrl,
    statusCode
  };

  if (statusCode >= 500) {
    console.error('API error:', logPayload);
  } else {
    console.warn('API validation/client error:', logPayload);
  }

  res.status(statusCode).json(payload);
};

module.exports = {
  ApiError,
  asyncHandler,
  notFoundHandler,
  errorHandler
};
