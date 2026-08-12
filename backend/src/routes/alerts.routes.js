const express = require('express');
const { authenticate } = require('../middleware/auth');
const { requireRole, ROLES } = require('../middleware/roleGuard');
const db = require('../services/databaseService');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  const alerts = await db.read('alerts');
  const list = alerts
    ? Object.values(alerts).sort((a, b) => b.createdAt - a.createdAt).slice(0, 50)
    : [];
  res.json({ success: true, data: list });
});

router.post('/emergency', authenticate, async (req, res, next) => {
  try {
    const { message, location } = req.body;
    const alert = await db.push('alerts', {
      type: 'emergency_report',
      severity: 'critical',
      message: message || 'Emergency reported by user',
      location,
      reportedBy: req.user.uid,
      role: req.user.role,
    });
    res.status(201).json({ success: true, data: alert });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/announcement',
  authenticate,
  requireRole(ROLES.AUTHORITY),
  async (req, res, next) => {
    try {
      const { message, title } = req.body;
      const alert = await db.push('alerts', {
        type: 'announcement',
        severity: 'info',
        title,
        message,
        by: req.user.uid,
      });
      res.status(201).json({ success: true, data: alert });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
