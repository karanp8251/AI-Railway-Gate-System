// =====================================================
// SMART RAILWAY GATE - RECEIVER ESP32 (Web + MQTT)
// Subscribes: railway/train, railway/vibration, railway/gate
// Publishes: railway/status, railway/gate (state to web server)
// =====================================================

#include <WiFi.h>
#include <esp_now.h>
#include <PubSubClient.h>
#include <ESP32Servo.h>

const char* ssid = "Karan";
const char* password = "12345678";
const char* mqtt_server = "broker.hivemq.com";

WiFiClient espClient;
PubSubClient client(espClient);
Servo gateServo;

int servoPin = 18;
int irSensorPin = 4;
int ledPin = 2;
int buzzerPin = 5;

// Change to true if your IR sensor outputs HIGH when blocked, or false if it outputs LOW when blocked.
const bool IR_ACTIVE_HIGH = false; 

bool gateClosed = false;
bool trainDetected = false;
bool irTriggered = false;

unsigned long lastMqttRetry = 0;
unsigned long lastWiFiRetry = 0;
bool initialPublishDone = false;

void publishGateState(const char* status, const char* reason) {
  if (WiFi.status() == WL_CONNECTED && client.connected()) {
    char payload[200];
    snprintf(payload, sizeof(payload),
      "{\"source\":\"esp32_receiver\",\"status\":\"%s\",\"gate\":\"%s\",\"buzzer\":%s,\"reason\":\"%s\",\"irTriggered\":%s}",
      status, status, digitalRead(buzzerPin) == HIGH ? "true" : "false",
      reason, irTriggered ? "true" : "false");
    client.publish("railway/gate", payload);
    client.publish("railway/status", payload);
    Serial.printf("MQTT Published: %s\n", payload);
  } else {
    Serial.printf("State changed to %s (%s), but WiFi/MQTT not connected.\n", status, reason);
  }
}

void setup_wifi() {
  Serial.print("Connecting WiFi to: ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  // Non-blocking: We do not loop-wait here, loop() will monitor connection status.
}

void reconnectMQTT() {
  if (millis() - lastMqttRetry > 5000) {
    lastMqttRetry = millis();
    Serial.print("MQTT connecting to broker...");
    String clientId = "ESP32Receiver-" + String((uint32_t)ESP.getEfuseMac(), HEX);
    if (client.connect(clientId.c_str())) {
      client.subscribe("railway/train");
      client.subscribe("railway/vibration");
      client.subscribe("railway/gate");
      Serial.println(" OK (Subscribed)");
      
      // Publish initial state once connected
      if (!initialPublishDone) {
        publishGateState("open", "boot");
        initialPublishDone = true;
      }
    } else {
      Serial.print(" failed, state=");
      Serial.println(client.state());
    }
  }
}

void closeGate(const char* reason) {
  if (gateClosed) return;
  Serial.println("Closing Gate...");
  gateClosed = true;
  trainDetected = true;

  for (int pos = 0; pos <= 90; pos += 5) {
    gateServo.write(pos);
    delay(30);
  }
  digitalWrite(ledPin, HIGH);
  digitalWrite(buzzerPin, HIGH);
  publishGateState("closed", reason);
}

void openGate(const char* reason) {
  Serial.println("Opening Gate...");
  for (int pos = 90; pos >= 0; pos -= 5) {
    gateServo.write(pos);
    delay(30);
  }
  digitalWrite(ledPin, LOW);
  digitalWrite(buzzerPin, LOW);
  gateClosed = false;
  trainDetected = false;
  irTriggered = false;
  publishGateState("open", reason);
}

void handleGateCommand(String msg) {
  String upper = msg;
  upper.toUpperCase();

  if (upper.indexOf("OPEN") >= 0) {
    openGate("web_command");
    return;
  }
  if (upper.indexOf("LOCKDOWN") >= 0 || upper.indexOf("EMERGENCY") >= 0) {
    closeGate("web_command");
    digitalWrite(buzzerPin, HIGH);
    return;
  }
  if (upper.indexOf("CLOSE") >= 0) {
    closeGate("web_command");
  }
}

void callback(char* topic, byte* message, unsigned int length) {
  String msg;
  for (unsigned int i = 0; i < length; i++) msg += (char)message[i];

  Serial.printf("MQTT [%s]: %s\n", topic, msg.c_str());

  // Ignore our own state echoes
  if (msg.indexOf("esp32_receiver") >= 0 && String(topic) == "railway/gate") return;

  if (String(topic) == "railway/gate") {
    handleGateCommand(msg);
    return;
  }

  if (String(topic) == "railway/train") {
    if (msg == "TRAIN" || msg.indexOf("\"detected\":true") >= 0) {
      closeGate("yolo_ai");
    }
  }

  if (String(topic) == "railway/vibration") {
    if (msg == "VIBRATION" || msg.indexOf("\"detected\":true") >= 0) {
      closeGate("piezo_vibration");
    }
  }
}

void onDataRecv(const esp_now_recv_info *info, const uint8_t *incomingData, int len) {
  char msg[50];
  memcpy(msg, incomingData, len);
  msg[len] = '\0';
  Serial.printf("ESP-NOW: %s\n", msg);
  if (strcmp(msg, "TRAIN") == 0) closeGate("espnow_train");
}

void setup() {
  Serial.begin(115200);
  pinMode(irSensorPin, INPUT_PULLUP);
  pinMode(ledPin, OUTPUT);
  pinMode(buzzerPin, OUTPUT);
  digitalWrite(ledPin, LOW);
  digitalWrite(buzzerPin, LOW);

  gateServo.attach(servoPin);
  gateServo.write(0);

  // Initialize WiFi mode to STA first
  WiFi.mode(WIFI_STA);

  // Initialize ESP-NOW immediately so gate control is always active
  if (esp_now_init() != ESP_OK) {
    Serial.println("ESP-NOW init failed");
  } else {
    esp_now_register_recv_cb(onDataRecv);
    Serial.println("ESP-NOW Initialized successfully");
  }

  // Initiate WiFi connection asynchronously
  setup_wifi();

  client.setServer(mqtt_server, 1883);
  client.setCallback(callback);

  Serial.println("SMART RECEIVER READY");
}

void loop() {
  // Check and manage WiFi connection status (Non-blocking)
  if (WiFi.status() == WL_CONNECTED) {
    if (!client.connected()) {
      reconnectMQTT();
    } else {
      client.loop();
    }
  } else {
    // If WiFi is disconnected, attempt reconnect periodically
    if (millis() - lastWiFiRetry > 10000) {
      lastWiFiRetry = millis();
      Serial.println("WiFi disconnected! Retrying connection (non-blocking)...");
      WiFi.disconnect();
      WiFi.begin(ssid, password);
    }
  }

  // Physical IR Sensor and train status checks (runs continuously)
  int irState = digitalRead(irSensorPin);
  bool isBlocked = (IR_ACTIVE_HIGH) ? (irState == HIGH) : (irState == LOW);

  if (trainDetected && !irTriggered && isBlocked) {
    Serial.println("Train at IR");
    digitalWrite(buzzerPin, LOW);
    irTriggered = true;
    if (WiFi.status() == WL_CONNECTED && client.connected()) {
      char irJson[120];
      snprintf(irJson, sizeof(irJson),
        "{\"source\":\"esp32_receiver\",\"sensor\":\"ir\",\"ir\":true,\"trainAtGate\":true}");
      client.publish("railway/status", irJson);
    }
  }

  if (trainDetected && irTriggered && !isBlocked && gateClosed) {
    Serial.println("Train passed");
    delay(2000);
    openGate("ir_passed");
    if (WiFi.status() == WL_CONNECTED && client.connected()) {
      char passJson[120];
      snprintf(passJson, sizeof(passJson),
        "{\"source\":\"esp32_receiver\",\"sensor\":\"ir\",\"ir\":true,\"trainPassed\":true}");
      client.publish("railway/status", passJson);
    }
  }

  delay(200);
}
