# AI Powered Smart Railway Gate Automation System

Enterprise-grade railway crossing automation with YOLO AI train detection, MQTT sensors, Firebase, and role-based dashboards.

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React 19, Vite, Tailwind CSS 4, Framer Motion, Recharts, Socket.io-client, i18next |
| Backend | Node.js, Express, MQTT.js, Socket.io, Firebase Admin, JWT |
| Database | Firebase Realtime Database, Firebase Auth, Firebase Storage |
| IoT | MQTT topics: `railway/train`, `railway/vibration`, `railway/status`, `railway/gate` |

## Project Structure

```
├── frontend/          # React + Vite dashboard
├── backend/           # Express API + MQTT + Socket.io
├── firebase/          # Security rules
└── README.md
```

## Roles

1. **Public User** — View status, alerts, analytics; submit complaints & emergency reports
2. **Railway Worker** — Manual gate control, sensor monitoring, buzzer, MQTT stream
3. **Railway Authority** — Full admin, user management, lockdown, CSV export, AI reports

## Automation Logic

```
IF piezo vibration AND YOLO train detected:
  → Close gate, buzzer ON, Firebase alert, log event

IF IR sensor confirms train passed:
  → Open gate, buzzer OFF, update Firebase, log event
```

## Quick Start

### 1. Firebase Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Authentication** (Email/Password)
3. Create **Realtime Database**
4. Deploy rules: `firebase deploy --only database`
5. Download service account JSON → `backend/serviceAccountKey.json`

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env with Firebase + MQTT credentials
npm install
npm run dev
```

Server runs at `http://localhost:5000`

### 3. Frontend

```bash
cd frontend
cp .env.example .env
# Add Firebase web config + VITE_API_URL
npm install
npm run dev
```

App runs at `http://localhost:5173`

### 4. MQTT Broker (optional for local IoT)

```bash
# Using Mosquitto
mosquitto -v

# Publish test train detection
mosquitto_pub -t railway/train -m '{"detected":true,"confidence":95}'
```

## API Endpoints

| Method | Endpoint | Role |
|--------|----------|------|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| POST | `/api/auth/firebase-token` | Authenticated |
| GET | `/api/analytics/dashboard` | All |
| POST | `/api/gate/control` | Worker, Authority |
| POST | `/api/gate/lockdown` | Authority |
| GET | `/api/system/health` | Public |
| POST | `/api/system/simulate` | Authority (demo) |

## Deployment

### Frontend (Vercel)

```bash
cd frontend
npm run build
# Deploy dist/ to Vercel, set env vars from .env.example
```

### Backend (Render / Railway)

- Set environment variables from `backend/.env.example`
- Upload `serviceAccountKey.json` as secret or use env-based credentials
- Start command: `npm start`

## Demo Without Firebase

The backend runs in **memory mode** when Firebase credentials are missing. Register/login via API still works for local development.

## Security

- JWT + Firebase ID token authentication
- Role-based route guards (frontend & backend)
- Rate limiting (100 req / 15 min)
- Firebase Realtime Database rules per role
- Helmet security headers

## License

MIT
