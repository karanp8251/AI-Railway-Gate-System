const http = require('http');
const app = require('./app');
const env = require('./config/env');
const { initFirebase, isFirebaseReady } = require('./config/firebase');
const { initSocket, getIO } = require('./services/socketService');
const mqttService = require('./services/mqttService');
const automation = require('./services/automationService');
const db = require('./services/databaseService');

const server = http.createServer(app);
initSocket(server);

initFirebase();
db.update('systemHealth', {
  uptime: Date.now(),
  firebase: isFirebaseReady(),
  database: db.isDatabaseReady(),
  databaseMode: db.getDatabaseMode(),
});

// Auto-seed demo accounts in development when Firebase is offline (only if no users)
if (env.nodeEnv === 'development' && !isFirebaseReady()) {
  db.read('users').then((users) => {
    if (!users || Object.keys(users).length === 0) {
      const { seed } = require('./scripts/seed');
      seed().catch(console.error);
    }
  });
}

mqttService.connectMqtt((topic, payload) => {
  automation.handleMqttMessage(topic, payload, getIO());
});

server.listen(env.port, () => {
  console.log(`[Server] Running on port ${env.port} (${env.nodeEnv})`);
  console.log(`[Server] CORS origin: ${env.clientUrl}`);
});

process.on('SIGTERM', () => {
  console.log('[Server] Shutting down...');
  server.close();
});
