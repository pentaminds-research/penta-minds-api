const crypto = require('crypto');
const express = require('express');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { ApiError, asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'LOGIN_RATE_LIMITED',
      message: 'Too many login attempts. Please try again later.'
    }
  }
});

const hashPassword = (password) => crypto
  .createHash('sha256')
  .update(password, 'utf8')
  .digest('hex');

const timingSafeHexCompare = (actual, expected) => {
  if (!/^[a-f0-9]{64}$/i.test(actual) || !/^[a-f0-9]{64}$/i.test(expected)) {
    return false;
  }

  const actualBuffer = Buffer.from(actual, 'hex');
  const expectedBuffer = Buffer.from(expected, 'hex');
  return crypto.timingSafeEqual(actualBuffer, expectedBuffer);
};

router.post('/login', loginLimiter, asyncHandler(async (req, res) => {
  const { password } = req.body || {};

  if (typeof password !== 'string' || password.length === 0) {
    throw new ApiError(400, 'PASSWORD_REQUIRED', 'Password is required.');
  }

  const passwordHash = hashPassword(password);
  const isValidPassword = timingSafeHexCompare(passwordHash, process.env.ADMIN_PASSWORD_HASH || '');

  if (!isValidPassword) {
    throw new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid admin credentials.');
  }

  const token = jwt.sign({
    role: 'admin'
  }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    issuer: 'penta-minds-api',
    audience: 'penta-minds-admin'
  });

  res.status(200).json({
    success: true,
    data: {
      token,
      token_type: 'Bearer',
      expires_in: process.env.JWT_EXPIRES_IN || '24h'
    }
  });
}));

module.exports = router;
