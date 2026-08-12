export const ROLES = {
  USER: 'user',
  WORKER: 'worker',
  AUTHORITY: 'authority',
};

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const MQTT_TOPICS = {
  TRAIN: 'railway/train',
  VIBRATION: 'railway/vibration',
  STATUS: 'railway/status',
  GATE: 'railway/gate',
};

export const ROLE_ROUTES = {
  [ROLES.USER]: '/user/dashboard',
  [ROLES.WORKER]: '/worker/dashboard',
  [ROLES.AUTHORITY]: '/authority/dashboard',
};

export const ROLE_LOGIN_ROUTES = {
  [ROLES.USER]: '/login/user',
  [ROLES.WORKER]: '/login/worker',
  [ROLES.AUTHORITY]: '/login/authority',
};
