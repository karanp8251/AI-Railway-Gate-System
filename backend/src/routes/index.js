const express = require('express');
const authRoutes = require('./auth.routes');
const gateRoutes = require('./gate.routes');
const sensorRoutes = require('./sensors.routes');
const alertRoutes = require('./alerts.routes');
const userRoutes = require('./users.routes');
const analyticsRoutes = require('./analytics.routes');
const reportRoutes = require('./reports.routes');
const systemRoutes = require('./system.routes');
const espRoutes = require('./esp.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/gate', gateRoutes);
router.use('/sensors', sensorRoutes);
router.use('/alerts', alertRoutes);
router.use('/users', userRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/reports', reportRoutes);
router.use('/system', systemRoutes);
router.use('/esp', espRoutes);

module.exports = router;
