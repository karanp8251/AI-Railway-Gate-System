const express = require('express');
const { authenticate } = require('../middleware/auth');
const { requireRole, ROLES } = require('../middleware/roleGuard');
const db = require('../services/databaseService');
const mqtt = require('../services/mqttService');
const { isFirebaseReady } = require('../config/firebase');

const router = express.Router();

router.get('/dashboard', authenticate, async (req, res) => {
  const [gateStatus, alerts, detections, sensorData, systemHealth, devices, espSender, espReceiver] = await Promise.all([
    db.read('gateStatus'),
    db.read('alerts'),
    db.read('trainDetections'),
    db.read('sensorData'),
    db.read('systemHealth'),
    db.read('devices'),
    db.read('espDevices/sender'),
    db.read('espDevices/receiver'),
  ]);

  const alertList = alerts ? Object.values(alerts) : [];
  const detectionList = detections ? Object.values(detections) : [];
  const recentDetections = detectionList.sort((a, b) => b.createdAt - a.createdAt).slice(0, 10);
  const avgConfidence =
    recentDetections.length > 0
      ? recentDetections.reduce((s, d) => s + (d.confidence || 0), 0) / recentDetections.length
      : 0;

  res.json({
    success: true,
    data: {
      gateStatus,
      alertCount: alertList.length,
      recentAlerts: alertList.sort((a, b) => b.createdAt - a.createdAt).slice(0, 5),
      ai: {
        lastDetection: recentDetections[0] || null,
        avgConfidence: Math.round(avgConfidence),
        totalDetections: detectionList.length,
      },
      connections: {
        mqtt: mqtt.isConnectedSync(),
        firebase: isFirebaseReady(),
        database: db.isDatabaseReady(),
        databaseMode: db.getDatabaseMode(),
      },
      systemHealth: {
        ...systemHealth,
        uptime: systemHealth?.uptime ? Date.now() - systemHealth.uptime : 0,
      },
      devices: devices || {},
      esp: { sender: espSender, receiver: espReceiver },
    },
  });
});

router.get('/ai-report', authenticate, requireRole(ROLES.AUTHORITY), async (req, res) => {
  const detections = await db.read('trainDetections');
  const list = detections ? Object.values(detections) : [];
  const report = {
    total: list.length,
    detected: list.filter((d) => d.detected).length,
    avgConfidence:
      list.length > 0 ? list.reduce((s, d) => s + (d.confidence || 0), 0) / list.length : 0,
    timeline: list.sort((a, b) => b.createdAt - a.createdAt).slice(0, 50),
  };
  res.json({ success: true, data: report });
});

router.get('/train-history', authenticate, requireRole(ROLES.AUTHORITY, ROLES.WORKER), async (req, res) => {
  const detections = await db.read('trainDetections');
  const list = detections
    ? Object.values(detections).sort((a, b) => b.createdAt - a.createdAt).slice(0, 100)
    : [];
  res.json({ success: true, data: list });
});

/** Single call for authority dashboard — reduces rate-limit pressure */
router.get('/authority-panel', authenticate, requireRole(ROLES.AUTHORITY), async (req, res) => {
  const [gateStatus, alerts, detections, systemHealth, espSender, espReceiver, messages] =
    await Promise.all([
      db.read('gateStatus'),
      db.read('alerts'),
      db.read('trainDetections'),
      db.read('systemHealth'),
      db.read('espDevices/sender'),
      db.read('espDevices/receiver'),
      db.read('mqttMessages'),
    ]);

  const alertList = alerts ? Object.values(alerts) : [];
  const detectionList = detections ? Object.values(detections) : [];
  const recentDetections = detectionList.sort((a, b) => b.createdAt - a.createdAt).slice(0, 10);
  const avgConfidence =
    recentDetections.length > 0
      ? recentDetections.reduce((s, d) => s + (d.confidence || 0), 0) / recentDetections.length
      : 0;

  const now = Date.now();
  const markOnline = (device) => {
    if (!device) return { online: false, lastSeen: 0 };
    const seen = device.lastSeen || device.updatedAt || 0;
    return { ...device, online: seen > 0 && now - seen < 120000 };
  };

  const msgList = messages
    ? Object.values(messages).sort((a, b) => b.timestamp - a.timestamp).slice(0, 10)
    : [];

  res.json({
    success: true,
    data: {
      gateStatus,
      alertCount: alertList.length,
      recentAlerts: alertList.sort((a, b) => b.createdAt - a.createdAt).slice(0, 5),
      ai: {
        lastDetection: recentDetections[0] || null,
        avgConfidence: Math.round(avgConfidence),
        totalDetections: detectionList.length,
      },
      aiReport: {
        total: detectionList.length,
        detected: detectionList.filter((d) => d.detected).length,
        avgConfidence:
          detectionList.length > 0
            ? detectionList.reduce((s, d) => s + (d.confidence || 0), 0) / detectionList.length
            : 0,
      },
      health: {
        status: 'ok',
        mqtt: mqtt.isConnectedSync(),
        firebase: isFirebaseReady(),
        database: db.isDatabaseReady(),
        databaseMode: db.getDatabaseMode(),
        broker: process.env.MQTT_BROKER_URL,
        uptime: systemHealth?.uptime ? now - systemHealth.uptime : 0,
      },
      esp: {
        sender: markOnline(espSender),
        receiver: markOnline(espReceiver),
        mqttConnected: mqtt.isConnectedSync(),
        broker: process.env.MQTT_BROKER_URL,
        recentMessages: msgList,
      },
    },
  });
});

module.exports = router;
