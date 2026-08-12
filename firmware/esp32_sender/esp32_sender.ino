// =====================================================
// SMART RAILWAY GATE - HYBRID SENDER ESP32
// MQTT Broker: broker.hivemq.com (same as web server)
// Topics: railway/vibration, railway/status
// =====================================================

#include <WiFi.h>
#include <esp_now.h>
#include <PubSubClient.h>

const char* ssid = "Karan";
const char* password = "12345678";
const char* mqtt_server = "broker.hivemq.com";

WiFiClient espClient;
PubSubClient client(espClient);

const int piezoPin = 34;
const int ledPin = 2;

int threshold = 150;
unsigned long lastSend = 0;
unsigned long lastTelemetry = 0;

uint8_t receiverAddress[] = { 0x14, 0x08, 0x08, 0xA6, 0x2C, 0xB4 };

void publishStatus(int value, bool detected) {
  char payload[160];
  snprintf(payload, sizeof(payload),
    "{\"source\":\"esp32_sender\",\"sensor\":\"piezo\",\"value\":%d,\"detected\":%s,\"threshold\":%d}",
    value, detected ? "true" : "false", threshold);
  client.publish("railway/status", payload);
}

void setup_wifi() {
  Serial.println();
  Serial.print("Connecting WiFi");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Connected");
  Serial.println(WiFi.localIP());
}

void reconnectMQTT() {
  while (!client.connected()) {
    Serial.print("MQTT...");
    String clientId = "ESP32Sender-" + String((uint32_t)ESP.getEfuseMac(), HEX);
    if (client.connect(clientId.c_str())) {
      Serial.println(" OK");
    } else {
      Serial.print(" failed, state=");
      Serial.print(client.state());
      Serial.println(" retry in 2s");
      delay(2000);
    }
  }
}

void onDataSent(const wifi_tx_info_t *info, esp_now_send_status_t status) {
  Serial.println(status == ESP_NOW_SEND_SUCCESS ? "ESP-NOW OK" : "ESP-NOW FAIL");
}

void setup() {
  Serial.begin(115200);
  pinMode(piezoPin, INPUT);
  pinMode(ledPin, OUTPUT);
  digitalWrite(ledPin, LOW);

  WiFi.mode(WIFI_STA);
  setup_wifi();

  client.setServer(mqtt_server, 1883);

  if (esp_now_init() != ESP_OK) {
    Serial.println("ESP-NOW init failed");
    return;
  }
  esp_now_register_send_cb(onDataSent);

  esp_now_peer_info_t peerInfo = {};
  memcpy(peerInfo.peer_addr, receiverAddress, 6);
  peerInfo.channel = 0;
  peerInfo.encrypt = false;
  esp_now_add_peer(&peerInfo);

  Serial.println("SMART SENDER READY");
}

void loop() {
  // Check and heal WiFi connection if dropped
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected! Reconnecting...");
    WiFi.disconnect();
    WiFi.begin(ssid, password);
    unsigned long startAttempt = millis();
    while (WiFi.status() != WL_CONNECTED && millis() - startAttempt < 10000) {
      delay(500);
      Serial.print(".");
    }
    if (WiFi.status() == WL_CONNECTED) {
      Serial.println("\nWiFi Reconnected");
    } else {
      Serial.println("\nWiFi Reconnect failed, retrying next loop");
      delay(1000);
      return;
    }
  }

  if (!client.connected()) reconnectMQTT();
  client.loop();

  int sensorValue = analogRead(piezoPin);
  Serial.printf("Piezo: %d\n", sensorValue);

  // Telemetry every 2s for web dashboard
  if (millis() - lastTelemetry > 2000) {
    publishStatus(sensorValue, sensorValue > threshold);
    lastTelemetry = millis();
  }

  if (sensorValue > threshold && millis() - lastSend > 5000) {
    digitalWrite(ledPin, HIGH);
    Serial.println("VIBRATION DETECTED");

    char vibJson[120];
    snprintf(vibJson, sizeof(vibJson),
      "{\"source\":\"esp32_sender\",\"detected\":true,\"value\":%d}", sensorValue);
    client.publish("railway/vibration", vibJson);
    client.publish("railway/vibration", "VIBRATION"); // legacy plain text

    publishStatus(sensorValue, true);

    const char* message = "TRAIN";
    esp_now_send(receiverAddress, (uint8_t*)message, strlen(message));

    lastSend = millis();
  } else {
    digitalWrite(ledPin, LOW);
  }

  delay(200);
}
