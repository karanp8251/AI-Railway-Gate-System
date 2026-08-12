const express = require('express');
const { authenticate } = require('../middleware/auth');
const { requireRole, ROLES } = require('../middleware/roleGuard');
const { validate, schemas } = require('../middleware/validate');
const db = require('../services/databaseService');
const { admin, isFirebaseReady } = require('../config/firebase');

const router = express.Router();

router.get('/', authenticate, requireRole(ROLES.AUTHORITY), async (req, res) => {
  const users = await db.read('users');
  const workers = await db.read('workers');
  const authorities = await db.read('authorities');
  res.json({
    success: true,
    data: {
      users: users ? Object.entries(users).map(([uid, u]) => ({ uid, ...u, passwordHash: undefined })) : [],
      workers: workers ? Object.values(workers) : [],
      authorities: authorities ? Object.values(authorities) : [],
    },
  });
});

router.post('/worker', authenticate, requireRole(ROLES.AUTHORITY), async (req, res, next) => {
  try {
    const { email, displayName, password } = req.body;
    if (isFirebaseReady()) {
      const user = await admin.auth().createUser({ email, password, displayName });
      await admin.auth().setCustomUserClaims(user.uid, { role: ROLES.WORKER });
      await db.write(`users/${user.uid}`, { email, displayName, role: ROLES.WORKER });
      await db.write(`workers/${user.uid}`, { email, displayName, active: true });
      return res.status(201).json({ success: true, uid: user.uid });
    }
    const uid = `worker_${Date.now()}`;
    await db.write(`users/${uid}`, { email, displayName, role: ROLES.WORKER });
    await db.write(`workers/${uid}`, { email, displayName, active: true });
    res.status(201).json({ success: true, uid });
  } catch (err) {
    next(err);
  }
});

router.delete('/:uid', authenticate, requireRole(ROLES.AUTHORITY), async (req, res, next) => {
  try {
    const { uid } = req.params;
    if (isFirebaseReady()) await admin.auth().deleteUser(uid);
    await db.write(`users/${uid}`, null);
    res.json({ success: true, message: 'User removed' });
  } catch (err) {
    next(err);
  }
});

router.post('/complaint', authenticate, validate(schemas.complaint), async (req, res, next) => {
  try {
    const record = await db.push('logs', { type: 'complaint', ...req.body, userId: req.user.uid });
    res.status(201).json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
