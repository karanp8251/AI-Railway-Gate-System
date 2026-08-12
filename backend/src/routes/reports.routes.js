const express = require('express');
const { authenticate } = require('../middleware/auth');
const { requireRole, ROLES } = require('../middleware/roleGuard');
const db = require('../services/databaseService');

const router = express.Router();

function toCSV(rows, headers) {
  const lines = [headers.join(',')];
  rows.forEach((row) => {
    lines.push(headers.map((h) => JSON.stringify(row[h] ?? '')).join(','));
  });
  return lines.join('\n');
}

router.get('/csv/:type', authenticate, requireRole(ROLES.AUTHORITY), async (req, res) => {
  const { type } = req.params;
  let data = [];
  let headers = [];

  switch (type) {
    case 'logs':
      data = Object.values((await db.read('logs')) || {});
      headers = ['id', 'action', 'type', 'createdAt'];
      break;
    case 'alerts':
      data = Object.values((await db.read('alerts')) || {});
      headers = ['id', 'type', 'severity', 'message', 'createdAt'];
      break;
    case 'trains':
      data = Object.values((await db.read('trainDetections')) || {});
      headers = ['id', 'detected', 'confidence', 'model', 'createdAt'];
      break;
    default:
      return res.status(400).json({ success: false, message: 'Invalid report type' });
  }

  const csv = toCSV(data, headers);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${type}-report.csv"`);
  res.send(csv);
});

router.get('/summary', authenticate, requireRole(ROLES.AUTHORITY), async (req, res) => {
  const [logs, alerts, detections] = await Promise.all([
    db.read('logs'),
    db.read('alerts'),
    db.read('trainDetections'),
  ]);
  res.json({
    success: true,
    data: {
      logsCount: logs ? Object.keys(logs).length : 0,
      alertsCount: alerts ? Object.keys(alerts).length : 0,
      detectionsCount: detections ? Object.keys(detections).length : 0,
      generatedAt: new Date().toISOString(),
    },
  });
});

module.exports = router;
