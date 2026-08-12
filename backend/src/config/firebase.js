const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const env = require('./env');

let db = null;
let initialized = false;

function initFirebase() {
  if (initialized) return admin;

  try {
    if (env.firebase.clientEmail && env.firebase.privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: env.firebase.projectId,
          clientEmail: env.firebase.clientEmail,
          privateKey: env.firebase.privateKey,
        }),
        databaseURL: env.firebase.databaseURL,
      });
    } else if (servicePath && fs.existsSync(path.resolve(servicePath))) {
      const serviceAccount = require(path.resolve(servicePath));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: env.firebase.databaseURL,
      });
    } else if (env.firebase.projectId && env.firebase.projectId !== 'your-project-id' && env.firebase.databaseURL && !env.firebase.databaseURL.includes('your-project-id')) {
      // Application Default Credentials (e.g. Render/Railway with env vars)
      admin.initializeApp({
        projectId: env.firebase.projectId,
        databaseURL: env.firebase.databaseURL,
      });
    } else {
      console.warn('[Firebase] No credentials — running in mock/offline mode');
      return null;
    }
    db = admin.database();
    initialized = true;
    console.log('[Firebase] Admin SDK initialized');
  } catch (err) {
    console.warn('[Firebase] Init failed:', err.message);
  }
  return admin;
}

function getDb() {
  if (!initialized) initFirebase();
  return db;
}

function isFirebaseReady() {
  return initialized && db !== null;
}

module.exports = { admin, initFirebase, getDb, isFirebaseReady };
