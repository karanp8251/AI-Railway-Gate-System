const express = require('express');
const { authenticate } = require('../middleware/auth');
const db = require('../services/databaseService');
const automation = require('../services/automationService');
const mqtt = require('../services/mqttService');

const router = express.Router();

router.get('/devices', authenticate, async (req, res) => {
  const [sender, receiver, gateStatus, messages] = await Promise.all([
    db.read('espDevices/sender'),
    db.read('espDevices/receiver'),
    db.read('gateStatus'),
    db.read('mqttMessages'),
  ]);

  const msgList = messages
    ? Object.values(messages).sort((a, b) => b.timestamp - a.timestamp).slice(0, 20)
    : [];

  res.json({
    success: true,
    data: {
      sender: sender || automation.getState().espSender,
      receiver: receiver || automation.getState().espReceiver,
      gateStatus,
      mqttConnected: mqtt.isConnectedSync(),
      broker: process.env.MQTT_BROKER_URL,
      recentMessages: msgList,
      automationState: automation.getState(),
    },
  });
});

module.exports = router;
