const express = require('express');
const { authenticate } = require('../middleware/auth');
const { requireRole, ROLES } = require('../middleware/roleGuard');
const db = require('../services/databaseService');
const mqtt = require('../services/mqttService');
const automation = require('../services/automationService');
const { isFirebaseReady } = require('../config/firebase');

const router = express.Router();

router.get('/health', async (req, res) => {
  const health = await db.read('systemHealth');
  const mqttLive = mqtt.isConnectedSync();
  res.json({
    success: true,
    data: {
      status: 'ok',
      mqtt: mqttLive,
      firebase: isFirebaseReady(),
      database: db.isDatabaseReady(),
      databaseMode: db.getDatabaseMode(),
      gate: automation.getState(),
      uptime: health?.uptime ? Date.now() - health.uptime : 0,
      timestamp: Date.now(),
      broker: process.env.MQTT_BROKER_URL,
    },
  });
});

router.get('/mqtt-messages', authenticate, requireRole(ROLES.WORKER, ROLES.AUTHORITY), async (req, res) => {
  const messages = await db.read('mqttMessages');
  const list = messages
    ? Object.values(messages).sort((a, b) => b.timestamp - a.timestamp).slice(0, 50)
    : [];
  res.json({ success: true, data: list });
});

router.get('/devices', authenticate, requireRole(ROLES.AUTHORITY), async (req, res) => {
  const devices = await db.read('devices');
  res.json({ success: true, data: devices || {} });
});

router.put('/config', authenticate, requireRole(ROLES.AUTHORITY), async (req, res, next) => {
  try {
    await db.update('systemConfig', req.body);
    res.json({ success: true, message: 'Configuration updated' });
  } catch (err) {
    next(err);
  }
});

router.get('/logs', authenticate, async (req, res) => {
  const role = req.user.role;
  const logs = await db.read('logs');
  let list = logs ? Object.values(logs) : [];
  if (role === ROLES.USER) {
    list = list.filter((l) => l.type === 'announcement' || l.type === 'complaint');
  }
  list = list.sort((a, b) => b.createdAt - a.createdAt).slice(0, 100);
  res.json({ success: true, data: list });
});

// Simulate MQTT messages for demo/testing
router.post('/simulate', authenticate, requireRole(ROLES.AUTHORITY), async (req, res, next) => {
  try {
    const { type } = req.body;
    const { getIO } = require('../services/socketService');
    const io = getIO();
    
    // Ensure devices are registered as online and send telemetry
    if (type === 'vibration') {
      await db.update('espDevices/sender', {
        piezo: 185,
        detected: true,
        threshold: 150,
        online: true,
        lastSeen: Date.now(),
      });
      io?.emit('esp:sender', { source: 'esp32_sender', value: 185, detected: true, threshold: 150, online: true });
    }

    if (type === 'ir_pass') {
      await db.update('espDevices/receiver', {
        gate: 'open',
        buzzer: false,
        online: true,
        lastSeen: Date.now(),
        reason: 'train_passed',
        source: 'esp32_receiver',
      });
      io?.emit('esp:receiver', { source: 'esp32_receiver', gate: 'open', buzzer: false, reason: 'train_passed', online: true });
    }

    if (type === 'train') {
      // Receiver will close the gate in response to train detection
      await db.update('espDevices/receiver', {
        gate: 'closed',
        buzzer: true,
        online: true,
        lastSeen: Date.now(),
        reason: 'auto_train_detected',
        source: 'esp32_receiver',
      });
      io?.emit('esp:receiver', { source: 'esp32_receiver', gate: 'closed', buzzer: true, reason: 'auto_train_detected', online: true });
    }

    const payloads = {
      vibration: { topic: mqtt.TOPICS.VIBRATION, payload: { source: 'esp32_sender', detected: true, value: 185, threshold: 150 } },
      train: { topic: mqtt.TOPICS.TRAIN, payload: { source: 'yolo_camera', detected: true, confidence: 95, boundingBox: { x: 120, y: 80, w: 200, h: 150 } } },
      ir_pass: { topic: mqtt.TOPICS.STATUS, payload: { source: 'esp32_receiver', sensor: 'ir', ir: true, trainPassed: true } },
    };
    
    const sim = payloads[type];
    if (!sim) return res.status(400).json({ success: false, message: 'Invalid simulation type' });
    const automationSvc = require('../services/automationService');
    await automationSvc.handleMqttMessage(sim.topic, sim.payload, io);
    res.json({ success: true, message: `Simulated ${type}` });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
