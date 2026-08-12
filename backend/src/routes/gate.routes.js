const express = require('express');
const { authenticate } = require('../middleware/auth');
const { requireRole, ROLES } = require('../middleware/roleGuard');
const { validate, schemas } = require('../middleware/validate');
const { gateLimiter } = require('../middleware/rateLimiter');
const automation = require('../services/automationService');
const db = require('../services/databaseService');
const { getIO } = require('../services/socketService');

const router = express.Router();

router.get('/status', authenticate, async (req, res) => {
  const status = await db.read('gateStatus');
  res.json({ success: true, data: { ...status, ...automation.getState() } });
});

router.post(
  '/control',
  gateLimiter,
  authenticate,
  requireRole(ROLES.WORKER, ROLES.AUTHORITY),
  validate(schemas.gateControl),
  async (req, res, next) => {
    try {
      const result = await automation.manualGateControl(req.body.action, req.user.uid, req.user.role);
      getIO()?.emit('gate:status', result);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/buzzer',
  gateLimiter,
  authenticate,
  requireRole(ROLES.WORKER, ROLES.AUTHORITY),
  async (req, res, next) => {
    try {
      const { on } = req.body;
      await automation.setBuzzer(!!on);
      res.json({ success: true, buzzer: !!on });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/lockdown',
  gateLimiter,
  authenticate,
  requireRole(ROLES.AUTHORITY),
  async (req, res, next) => {
    try {
      const result = await automation.manualGateControl('lockdown', req.user.uid, req.user.role);
      getIO()?.emit('system:lockdown', result);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
