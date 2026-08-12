const rateLimit = require('express-rate-limit');
const env = require('../config/env');

const isDev = env.nodeEnv === 'development';

/** Strict limit for login/register only */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 100 : 20,
  message: { success: false, message: 'Too many login attempts. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/** Gate control — always allow repeated open/close */
const gateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isDev ? 500 : 60,
  message: { success: false, message: 'Too many gate commands. Wait a moment.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/** General API — relaxed in dev, GET reads skipped in dev */
const apiLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: isDev ? 10000 : env.rateLimit.max,
  message: { success: false, message: 'Too many requests' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => isDev && req.method === 'GET',
});

module.exports = { authLimiter, gateLimiter, apiLimiter };
