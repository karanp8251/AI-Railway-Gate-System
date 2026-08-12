const db = require('./databaseService');
const mqtt = require('./mqttService');
const { sendAlertEmail } = require('./emailService');

const state = {
  piezoDetected: false,
  piezoValue: 0,
  yoloDetected: false,
  irTrainPassed: false,
  gateStatus: 'open',
  buzzer: false,
  lastTrainConfidence: 0,
  espSender: { online: false, lastSeen: 0 },
  espReceiver: { online: false, gate: 'open', lastSeen: 0 },
};

function isVibrationPayload(payload) {
  return (
    payload.detected === true ||
    payload.raw === 'VIBRATION' ||
    payload.message === 'VIBRATION' ||
    (payload.sensor === 'piezo' && payload.status === 'detected')
  );
}

function isTrainPayload(payload) {
  return (
    payload.detected === true ||
    payload.raw === 'TRAIN' ||
    payload.message === 'TRAIN'
  );
}

function isTrainPassedPayload(payload) {
  return payload.trainPassed === true;
}

async function updateEspDevice(source, data) {
  const key = source === 'esp32_sender' ? 'espSender' : 'espReceiver';
  const node = source === 'esp32_sender' ? 'sender' : 'receiver';
  state[key] = { ...state[key], ...data, online: true, lastSeen: Date.now() };
  await db.update(`espDevices/${node}`, state[key]);
}

async function handleMqttMessage(topic, payload, io) {
  const emit = (event, data) => io?.emit(event, data);
  
  // Infer source if missing (for legacy/un-updated ESP32 codes)
  if (!payload.source) {
    if (topic === mqtt.TOPICS.VIBRATION || payload.sensor === 'piezo' || payload.value !== undefined) {
      payload.source = 'esp32_sender';
    } else if (topic === mqtt.TOPICS.GATE || payload.sensor === 'ir' || payload.gate !== undefined || payload.status !== undefined) {
      payload.source = 'esp32_receiver';
    }
  }

  const source = payload.source || 'unknown';

  // ESP device telemetry
  if (payload.source === 'esp32_sender') {
    await updateEspDevice('esp32_sender', {
      piezo: payload.value ?? state.piezoValue,
      detected: payload.detected || false,
      threshold: payload.threshold ?? 150,
    });
    emit('esp:sender', payload);
  }
  if (payload.source === 'esp32_receiver') {
    await updateEspDevice('esp32_receiver', {
      gate: payload.gate || payload.status || state.gateStatus,
      buzzer: payload.buzzer === true || payload.buzzer === 'true',
      reason: payload.reason || 'status_report',
      irTriggered: payload.irTriggered === true || payload.irTriggered === 'true',
    });
    emit('esp:receiver', payload);
  }

  switch (topic) {
    case mqtt.TOPICS.VIBRATION:
      if (isVibrationPayload(payload)) {
        state.piezoDetected = true;
        state.piezoValue = payload.value || state.piezoValue;
        await db.push('sensorData', {
          type: 'piezo',
          value: payload.value,
          detected: true,
          source,
        });
        emit('sensor:update', { piezo: payload });
      }
      break;

    case mqtt.TOPICS.TRAIN:
      if (isTrainPayload(payload)) {
        state.yoloDetected = true;
        state.lastTrainConfidence = payload.confidence || 92;
        await db.push('trainDetections', {
          detected: true,
          confidence: state.lastTrainConfidence,
          boundingBox: payload.boundingBox,
          model: 'YOLO',
          source,
        });
        emit('ai:detection', payload);
      }
      break;

    case mqtt.TOPICS.STATUS:
      if (payload.sensor === 'piezo' || payload.value !== undefined) {
        state.piezoValue = payload.value ?? state.piezoValue;
        if (payload.detected) state.piezoDetected = true;
        await db.push('sensorData', { type: 'piezo', ...payload });
        emit('sensor:update', { piezo: payload });
      }
      if (payload.sensor === 'ir' || payload.ir !== undefined) {
        if (payload.trainAtGate) {
          await db.push('sensorData', { type: 'ir', atGate: true, source });
          emit('sensor:update', { ir: payload });
        }
        if (isTrainPassedPayload(payload)) {
          state.irTrainPassed = true;
          await db.push('sensorData', { type: 'ir', passed: true, source });
          emit('sensor:update', { ir: payload });
        }
      }
      if (payload.devices) await db.update('devices', payload.devices);
      break;

    case mqtt.TOPICS.GATE:
      // Ignore echoes of our own web commands
      if (payload.source === 'web_server') break;

      // State report from ESP32 receiver
      if (payload.source === 'esp32_receiver' && (payload.status || payload.gate)) {
        const status = payload.status || payload.gate;
        state.gateStatus = status;
        state.buzzer = payload.buzzer === true || payload.buzzer === 'true';
        await db.update('gateStatus', {
          status,
          buzzer: state.buzzer,
          reason: payload.reason,
          source: 'esp32_receiver',
          lastUpdated: Date.now(),
        });
        emit('gate:status', { status, buzzer: state.buzzer, source: 'esp32' });
        await db.push('logs', { action: `ESP_GATE_${status.toUpperCase()}`, reason: payload.reason });
      }
      break;

    default:
      break;
  }

  await evaluateAutomation(io);
}

async function evaluateAutomation(io) {
  const emit = (event, data) => io?.emit(event, data);

  if (state.piezoDetected && state.yoloDetected && state.gateStatus !== 'closed') {
    state.gateStatus = 'closed';
    state.buzzer = true;
    state.piezoDetected = false;

    await db.update('gateStatus', {
      status: 'closed',
      buzzer: true,
      reason: 'auto_train_detected',
      confidence: state.lastTrainConfidence,
    });

    await db.update('espDevices/receiver', {
      gate: 'closed',
      buzzer: true,
      online: true,
      lastSeen: Date.now(),
      reason: 'auto_train_detected',
      source: 'esp32_receiver',
    });

    state.espReceiver = {
      gate: 'closed',
      buzzer: true,
      online: true,
      lastSeen: Date.now(),
    };

    const alert = await db.push('alerts', {
      type: 'gate_close',
      severity: 'high',
      message: `Gate auto-closed. YOLO confidence: ${state.lastTrainConfidence}%`,
    });

    mqtt.publishGateCommand('close', { buzzer: true });
    await sendAlertEmail('Gate Auto-Closed', `<p>Train detected. Confidence: ${state.lastTrainConfidence}%</p>`);

    emit('gate:status', { status: 'closed', buzzer: true });
    emit('esp:receiver', { source: 'esp32_receiver', gate: 'closed', buzzer: true, reason: 'auto_train_detected', online: true });
    emit('alert:new', alert);
    await db.push('logs', { action: 'AUTO_CLOSE', details: alert });
  }

  if (state.irTrainPassed) {
    const wasClosed = state.gateStatus === 'closed';
    state.gateStatus = 'open';
    state.buzzer = false;
    state.yoloDetected = false;
    state.irTrainPassed = false;

    if (wasClosed) {
      await db.update('gateStatus', { status: 'open', buzzer: false, reason: 'train_passed' });

      await db.update('espDevices/receiver', {
        gate: 'open',
        buzzer: false,
        online: true,
        lastSeen: Date.now(),
        reason: 'train_passed',
        source: 'esp32_receiver',
      });

      state.espReceiver = {
        gate: 'open',
        buzzer: false,
        online: true,
        lastSeen: Date.now(),
      };

      mqtt.publishGateCommand('open');

      const alert = await db.push('alerts', {
        type: 'gate_open',
        severity: 'info',
        message: 'Train passed — gate opened',
      });

      emit('gate:status', { status: 'open', buzzer: false });
      emit('esp:receiver', { source: 'esp32_receiver', gate: 'open', buzzer: false, reason: 'train_passed', online: true });
      emit('alert:new', alert);
      await db.push('logs', { action: 'AUTO_OPEN', details: alert });
    }
  }
}

async function manualGateControl(action, userId, role) {
  const updates = { lastUpdated: Date.now(), manualBy: userId, manualRole: role };

  switch (action) {
    case 'open':
      state.gateStatus = 'open';
      state.buzzer = false;
      Object.assign(updates, { status: 'open', buzzer: false, reason: 'manual_open' });
      mqtt.publishGateCommand('open');
      break;
    case 'close':
      state.gateStatus = 'closed';
      Object.assign(updates, { status: 'closed', reason: 'manual_close' });
      mqtt.publishGateCommand('close');
      break;
    case 'emergency_stop':
      state.gateStatus = 'closed';
      state.buzzer = true;
      Object.assign(updates, { status: 'closed', buzzer: true, emergency: true });
      mqtt.publishGateCommand('emergency_stop', { buzzer: true });
      mqtt.publishRaw(mqtt.TOPICS.GATE, 'CLOSE');
      break;
    case 'lockdown':
      state.gateStatus = 'closed';
      state.buzzer = true;
      Object.assign(updates, { status: 'closed', buzzer: true, lockdown: true });
      mqtt.publishGateCommand('lockdown', { buzzer: true });
      mqtt.publishRaw(mqtt.TOPICS.GATE, 'LOCKDOWN');
      await sendAlertEmail('EMERGENCY LOCKDOWN', '<p>System lockdown activated by authority.</p>');
      break;
    default:
      throw new Error('Invalid gate action');
  }

  await db.update('gateStatus', updates);
  await db.update('espDevices/receiver', {
    gate: updates.status,
    buzzer: updates.buzzer || false,
    online: true,
    lastSeen: Date.now(),
    reason: updates.reason,
    source: 'web_manual',
  });
  state.espReceiver = {
    ...state.espReceiver,
    gate: updates.status,
    buzzer: updates.buzzer || false,
    online: true,
    lastSeen: Date.now(),
  };

  await db.push('logs', { action: `MANUAL_${action.toUpperCase()}`, userId, role });
  return { ...updates, status: updates.status, buzzer: updates.buzzer || false };
}

function setBuzzer(on) {
  state.buzzer = on;
  mqtt.publish(mqtt.TOPICS.GATE, { action: 'buzzer', buzzer: on, source: 'web_server' });
  if (on) mqtt.publishRaw(mqtt.TOPICS.GATE, 'CLOSE');
  return db.update('gateStatus', { buzzer: on });
}

function getState() {
  return { ...state };
}

module.exports = {
  handleMqttMessage,
  evaluateAutomation,
  manualGateControl,
  setBuzzer,
  getState,
};
