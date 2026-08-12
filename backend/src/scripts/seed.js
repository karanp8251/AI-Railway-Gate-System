/**
 * Seed demo users for local development (memory mode)
 * Run: node src/scripts/seed.js
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { initFirebase, isFirebaseReady } = require('../config/firebase');
const db = require('../services/databaseService');

async function seed() {
  initFirebase();
  const users = [
    { email: 'user@railway.com', password: 'user123', displayName: 'Public User', role: 'user' },
    { email: 'worker@railway.com', password: 'worker123', displayName: 'Rail Worker', role: 'worker' },
    { email: 'admin@railway.com', password: 'admin123', displayName: 'Authority Admin', role: 'authority' },
  ];

  for (const u of users) {
    const hash = await bcrypt.hash(u.password, 12);
    const uid = `${u.role}_demo`;
    await db.write(`users/${uid}`, {
      email: u.email,
      displayName: u.displayName,
      role: u.role,
      passwordHash: hash,
      createdAt: Date.now(),
    });
    console.log(`[Seed] ${u.email} / ${u.password} (${u.role})`);
  }

  await db.update('gateStatus', { status: 'open', buzzer: false });
  await db.update('systemHealth', { uptime: Date.now(), mqtt: false, firebase: isFirebaseReady() });
}

if (require.main === module) {
  seed()
    .then(() => {
      console.log('Seed complete.');
      process.exit(0);
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}

module.exports = { seed };
