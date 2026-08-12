const app = require('../src/app');
const { initFirebase } = require('../src/config/firebase');
const db = require('../src/services/databaseService');
const { seed } = require('../src/scripts/seed');

initFirebase();

// Auto-seed demo accounts in serverless mode if empty
db.read('users')
  .then((users) => {
    if (!users || Object.keys(users).length === 0) {
      seed().catch(() => {});
    }
  })
  .catch(() => {});

module.exports = app;
