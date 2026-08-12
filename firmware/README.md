# ESP32 Firmware — Railway Gate System

## Wiring

| Component | Sender Pin | Receiver Pin |
|-----------|-------------|--------------|
| Piezo | GPIO 34 | — |
| IR Sensor | — | GPIO 4 |
| Servo | — | GPIO 18 |
| LED | GPIO 2 | GPIO 2 |
| Buzzer | — | GPIO 5 |

## Setup

1. Install libraries: **PubSubClient**, **ESP32Servo** (receiver only)
2. Update WiFi: `ssid` / `password` in both `.ino` files
3. Update receiver MAC in sender: `receiverAddress[]`
4. Flash **receiver** first, then **sender**
5. Open Serial Monitor @ 115200

## MQTT Broker (shared with web server)

- **Broker:** `broker.hivemq.com:1883`
- **Topics:** `railway/vibration`, `railway/train`, `railway/status`, `railway/gate`

## Web integration flow

```
ESP32 Sender  ──MQTT──►  broker.hivemq.com  ◄──MQTT──  Node.js Backend  ◄──REST/Socket──►  React Dashboard
ESP32 Receiver ◄─MQTT──┘                              │
       ▲                                              │
       └──────── railway/gate (OPEN/CLOSE) ──────────┘
              Authority / Worker clicks gate control
```

## Authority gate control

Login as **admin@railway.com** → Authority Dashboard → **Open Gate** / **Close Gate**

Commands publish to `railway/gate` → ESP32 receiver moves servo.
