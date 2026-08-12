const env = require('../config/env');

function errorHandler(err, req, res, next) {
  console.error('[Error]', err.message);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(env.nodeEnv === 'development' && { stack: err.stack }),
  });
}

function notFound(req, res) {
  res.status(404).json({ success: false, message: 'Route not found' });
}

module.exports = { errorHandler, notFound };
