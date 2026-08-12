const mqtt = require('mqtt');
const env = require('../config/env');
const db = require('./databaseService');

const TOPICS = {
  TRAIN: 'railway/train',
  VIBRATION: 'railway/vibration',
  STATUS: 'railway/status',
  GATE: 'railway/gate',
};

let client = null;
let connected = false;
let messageHandler = null;
let lastConnectedAt = 0;

function parsePayload(buffer) {
  const raw = buffer.toString().trim();
  if (!raw) return { raw: '' };
  try {
    const json = JSON.parse(raw);
    return { ...json, raw };
  } catch {
    return { raw, message: raw };
  }
}

function connectMqtt(onMessage) {
  messageHandler = onMessage;

  if (client) {
    try { client.end(true); } catch { /* ignore */ }
  }

  const options = {
    clientId: `${env.mqtt.clientId}-${Math.random().toString(16).slice(2, 8)}`,
    clean: true,
    reconnectPeriod: 3000,
    connectTimeout: 20000,
    keepalive: 30,
    protocolVersion: 4,
  };
  if (env.mqtt.username) {
    options.username = env.mqtt.username;
    options.password = env.mqtt.password;
  }

  client = mqtt.connect(env.mqtt.brokerUrl, options);

  client.on('connect', () => {
    connected = true;
    lastConnectedAt = Date.now();
    console.log('[MQTT] Connected to', env.mqtt.brokerUrl);
    Object.values(TOPICS).forEach((topic) => client.subscribe(topic, { qos: 0 }));
    db.update('systemHealth', {
      mqtt: true,
      mqttConnectedAt: lastConnectedAt,
      broker: env.mqtt.brokerUrl,
    });
  });

  client.on('message', async (topic, buffer) => {
    const payload = parsePayload(buffer);
    console.log(`[MQTT] Message received | Topic: ${topic} | Payload:`, JSON.stringify(payload));
    const record = await db.push('mqttMessages', { topic, payload, timestamp: Date.now() });
    if (messageHandler) messageHandler(topic, payload, record);
  });

  client.on('error', (err) => {
    console.error('[MQTT] Error:', err.message);
    connected = false;
  });

  client.on('offline', () => {
    connected = false;
    db.update('systemHealth', { mqtt: false });
  });

  client.on('close', () => {
    connected = false;
    db.update('systemHealth', { mqtt: false });
  });

  client.on('reconnect', () => console.log('[MQTT] Reconnecting...'));

  return client;
}

function publish(topic, data) {
  if (!client) return false;
  const message = typeof data === 'string' ? data : JSON.stringify(data);
  if (!connected) {
    console.warn('[MQTT] Queuing publish (reconnecting):', topic);
  }
  client.publish(topic, message, { qos: 0, retain: false });
  return true;
}

function publishRaw(topic, message) {
  return publish(topic, message);
}

function publishGateCommand(action, extra = {}) {
  const normalized = String(action).toLowerCase();
  const map = { open: 'OPEN', close: 'CLOSE', emergency_stop: 'CLOSE', lockdown: 'LOCKDOWN' };
  const plain = map[normalized] || normalized.toUpperCase();

  publishRaw(TOPICS.GATE, plain);
  publish(TOPICS.GATE, {
    action: normalized,
    command: plain,
    source: 'web_server',
    ...extra,
    timestamp: Date.now(),
  });
  console.log('[MQTT] Gate command sent:', plain);
  return true;
}

async function isConnected() {
  if (connected) return true;
  const health = await db.read('systemHealth');
  return health?.mqtt === true;
}

function isConnectedSync() {
  return connected;
}

function getClient() {
  return client;
}

module.exports = {
  connectMqtt,
  publish,
  publishRaw,
  publishGateCommand,
  parsePayload,
  isConnected,
  isConnectedSync,
  getClient,
  TOPICS,
};
