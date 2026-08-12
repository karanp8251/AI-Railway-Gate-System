const express = require('express');
const bcrypt = require('bcryptjs');
const { authenticate, signToken } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');
const db = require('../services/databaseService');
const { admin, isFirebaseReady } = require('../config/firebase');

const router = express.Router();

// Register user with role
router.post('/register', authLimiter, validate(schemas.register), async (req, res, next) => {
  try {
    const { email, password, displayName, role } = req.body;
    const hashed = await bcrypt.hash(password, 12);
    const uid = `local_${Date.now()}`;

    if (isFirebaseReady()) {
      const userRecord = await admin.auth().createUser({ email, password, displayName });
      await admin.auth().setCustomUserClaims(userRecord.uid, { role });
      await db.write(`users/${userRecord.uid}`, { email, displayName, role, createdAt: Date.now() });
      const token = signToken({ uid: userRecord.uid, email, role });
      return res.status(201).json({ success: true, token, user: { uid: userRecord.uid, email, displayName, role } });
    }

    await db.write(`users/${uid}`, { email, displayName, role, passwordHash: hashed });
    const token = signToken({ uid, email, role });
    res.status(201).json({ success: true, token, user: { uid, email, displayName, role } });
  } catch (err) {
    next(err);
  }
});

// Login — validates role matches panel
router.post('/login', authLimiter, validate(schemas.login), async (req, res, next) => {
  try {
    const { email, password, role } = req.body;

    if (isFirebaseReady()) {
      // Client uses Firebase Auth; this endpoint issues JWT after role check
      const users = await db.read('users');
      const entry = Object.entries(users || {}).find(([, u]) => u.email === email && u.role === role);
      if (!entry) {
        return res.status(401).json({ success: false, message: 'Invalid credentials or role mismatch' });
      }
      const [uid, user] = entry;
      const token = signToken({ uid, email: user.email, role: user.role, displayName: user.displayName });
      return res.json({ success: true, token, user: { uid, email: user.email, displayName: user.displayName, role: user.role } });
    }

    const users = await db.read('users');
    const entry = Object.entries(users || {}).find(([, u]) => u.email === email && u.role === role);
    if (!entry) {
      return res.status(401).json({ success: false, message: 'Invalid credentials or role mismatch' });
    }
    const [uid, user] = entry;
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    const token = signToken({ uid, email: user.email, role: user.role, displayName: user.displayName });
    res.json({ success: true, token, user: { uid, email: user.email, displayName: user.displayName, role: user.role } });
  } catch (err) {
    next(err);
  }
});

// Exchange Firebase ID token for backend JWT
router.post('/firebase-token', async (req, res, next) => {
  try {
    const { idToken, role } = req.body;
    if (!isFirebaseReady()) {
      return res.status(503).json({ success: false, message: 'Firebase not configured' });
    }
    const decoded = await admin.auth().verifyIdToken(idToken);
    const userData = await db.read(`users/${decoded.uid}`);
    if (userData?.role !== role) {
      return res.status(403).json({ success: false, message: 'Role mismatch for this panel' });
    }
    const token = signToken({
      uid: decoded.uid,
      email: decoded.email,
      role: userData.role,
      displayName: userData.displayName,
    });
    res.json({ success: true, token, user: { uid: decoded.uid, ...userData } });
  } catch (err) {
    next(err);
  }
});

router.get('/me', authenticate, async (req, res) => {
  const user = await db.read(`users/${req.user.uid}`);
  res.json({ success: true, user: { uid: req.user.uid, ...user, ...req.user } });
});

module.exports = router;
