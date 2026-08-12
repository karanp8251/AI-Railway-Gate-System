const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { getDb, isFirebaseReady } = require('../config/firebase');

const DB_FILE = path.join(__dirname, '../../../.data/local-db.json');

const defaultStore = () => ({
  users: {},
  alerts: {},
  logs: {},
  trainDetections: {},
  sensorData: {},
  gateStatus: { status: 'open', buzzer: false, lastUpdated: Date.now() },
  analytics: {},
  mqttMessages: {},
  devices: {},
  espDevices: { sender: {}, receiver: {} },
  systemHealth: { uptime: Date.now(), mqtt: false, firebase: false, database: true },
});

let memoryStore = defaultStore();
let saveTimer = null;

function loadPersisted() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      memoryStore = { ...defaultStore(), ...JSON.parse(raw) };
      console.log('[Database] Loaded local persistence from', DB_FILE);
    }
  } catch (err) {
    console.warn('[Database] Could not load local file:', err.message);
    memoryStore = defaultStore();
  }
}

function scheduleSave() {
  if (isFirebaseReady()) return;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
      fs.writeFileSync(DB_FILE, JSON.stringify(memoryStore, null, 2));
    } catch (err) {
      console.warn('[Database] Save failed:', err.message);
    }
  }, 300);
}

loadPersisted();

function isDatabaseReady() {
  return isFirebaseReady() || true;
}

function getDatabaseMode() {
  return isFirebaseReady() ? 'firebase' : 'local-sync';
}

function setNested(pathStr, value) {
  const keys = pathStr.split('/').filter(Boolean);
  let node = memoryStore;
  for (let i = 0; i < keys.length - 1; i++) {
    node[keys[i]] = node[keys[i]] || {};
    node = node[keys[i]];
  }
  node[keys[keys.length - 1]] = value;
}

function getNested(pathStr) {
  const keys = pathStr.split('/').filter(Boolean);
  let node = memoryStore;
  for (const key of keys) {
    if (node == null || node[key] == null) return null;
    node = node[key];
  }
  return node;
}

async function write(pathStr, data) {
  const payload = data == null ? null : { ...data, updatedAt: Date.now() };
  if (isFirebaseReady()) {
    if (payload === null) await getDb().ref(pathStr).remove();
    else await getDb().ref(pathStr).set(payload);
  } else {
    setNested(pathStr, payload);
    scheduleSave();
  }
  return payload;
}

async function push(pathStr, data) {
  const id = uuidv4();
  const payload = { id, ...data, createdAt: Date.now() };
  if (isFirebaseReady()) {
    await getDb().ref(pathStr).child(id).set(payload);
  } else {
    const keys = pathStr.split('/').filter(Boolean);
    let node = memoryStore;
    for (const key of keys) {
      node[key] = node[key] || {};
      node = node[key];
    }
    node[id] = payload;
    // Keep mqtt messages list bounded
    if (pathStr === 'mqttMessages') {
      const entries = Object.entries(node);
      if (entries.length > 200) {
        entries.sort((a, b) => (b[1].timestamp || 0) - (a[1].timestamp || 0));
        node = {};
        entries.slice(0, 200).forEach(([k, v]) => { node[k] = v; });
        setNested(pathStr, node);
      }
    }
    scheduleSave();
  }
  return payload;
}

async function read(pathStr) {
  if (isFirebaseReady()) {
    const snap = await getDb().ref(pathStr).once('value');
    return snap.val();
  }
  return getNested(pathStr);
}

async function update(pathStr, data) {
  const payload = { ...data, updatedAt: Date.now() };
  if (isFirebaseReady()) {
    await getDb().ref(pathStr).update(payload);
  } else {
    const existing = (await read(pathStr)) || {};
    setNested(pathStr, { ...existing, ...payload });
    scheduleSave();
  }
  return payload;
}

function getMemoryStore() {
  return memoryStore;
}

module.exports = {
  write,
  push,
  update,
  read,
  getMemoryStore,
  isDatabaseReady,
  getDatabaseMode,
  loadPersisted,
};
