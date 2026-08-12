const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { admin, isFirebaseReady } = require('../config/firebase');

/**
 * Verify JWT from Authorization header OR Firebase ID token
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];

    // Try JWT first
    try {
      const decoded = jwt.verify(token, env.jwt.secret);
      req.user = decoded;
      return next();
    } catch {
      // Fall through to Firebase token
    }

    if (isFirebaseReady()) {
      const decoded = await admin.auth().verifyIdToken(token);
      req.user = {
        uid: decoded.uid,
        email: decoded.email,
        role: decoded.role || req.headers['x-user-role'],
      };
      return next();
    }

    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Authentication failed' });
  }
}

function signToken(payload) {
  return jwt.sign(payload, env.jwt.secret, { expiresIn: env.jwt.expiresIn });
}

module.exports = { authenticate, signToken };
