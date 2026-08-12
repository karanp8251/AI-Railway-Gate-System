const express = require('express');
const { authenticate } = require('../middleware/auth');
const { requireRole, ROLES } = require('../middleware/roleGuard');
const { validate, schemas } = require('../middleware/validate');
const db = require('../services/databaseService');

const router = express.Router();

router.get('/', authenticate, requireRole(ROLES.WORKER, ROLES.AUTHORITY), async (req, res) => {
  const data = await db.read('sensorData');
  const list = data ? Object.values(data).sort((a, b) => b.createdAt - a.createdAt).slice(0, 100) : [];
  res.json({ success: true, data: list });
});

router.get('/latest', authenticate, async (req, res) => {
  const data = await db.read('sensorData');
  const list = data ? Object.values(data).sort((a, b) => b.createdAt - a.createdAt) : [];
  const piezo = list.find((s) => s.type === 'piezo');
  const ir = list.find((s) => s.type === 'ir');
  res.json({ success: true, data: { piezo, ir } });
});

router.post(
  '/update',
  authenticate,
  requireRole(ROLES.WORKER, ROLES.AUTHORITY),
  validate(schemas.sensorUpdate),
  async (req, res, next) => {
    try {
      const record = await db.push('sensorData', { ...req.body, manual: true, by: req.user.uid });
      res.json({ success: true, data: record });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
