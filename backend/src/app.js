const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const env = require('./config/env');
const routes = require('./routes');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');

const app = express();

const allowedOrigins = env.clientUrl
  ? env.clientUrl.split(',').map((u) => u.trim())
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin) || process.env.VERCEL || process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});
app.use(morgan(env.nodeEnv === 'development' ? 'dev' : 'combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Relaxed rate limit — GET requests skipped in development
app.use(apiLimiter);

app.get('/', (req, res) => {
  res.json({
    name: 'AI Railway Gate Automation API',
    version: '1.0.0',
    status: 'running',
  });
});

app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
