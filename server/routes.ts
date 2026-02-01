import type { Express } from "express";
import { createServer, type Server } from "http";
import mqtt from "mqtt";
import { mqttMessageSchema } from "@shared/schema";

// MQTT Configuration
const MQTT_BROKER = "wss://yce1c101.ala.eu-central-1.emqxsl.com:8084/mqtt";
const MQTT_USERNAME = "bladehalo88888";
const MQTT_PASSWORD = "Blade2026!!88!!";

let mqttClient: mqtt.MqttClient | null = null;
let connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error' = 'disconnected';
let lastError: string = '';

function connectMqtt(): void {
  if (mqttClient) {
    mqttClient.end(true);
    mqttClient = null;
  }

  if (!MQTT_USERNAME || !MQTT_PASSWORD) {
    console.error('MQTT credentials not configured');
    lastError = 'MQTT credentials not configured';
    connectionStatus = 'error';
    return;
  }

  console.log(`Connecting to MQTT broker as user: ${MQTT_USERNAME}`);
  connectionStatus = 'connecting';
  lastError = '';

  mqttClient = mqtt.connect(MQTT_BROKER, {
    username: MQTT_USERNAME,
    password: MQTT_PASSWORD,
    protocol: 'wss',
    rejectUnauthorized: true,
    reconnectPeriod: 0, // Don't auto-reconnect, let user retry manually
    connectTimeout: 30000,
  });

  mqttClient.on('connect', () => {
    console.log('Connected to MQTT broker successfully');
    connectionStatus = 'connected';
    lastError = '';
  });

  mqttClient.on('error', (error) => {
    console.error('MQTT connection error:', error.message);
    lastError = error.message;
    connectionStatus = 'error';
  });

  mqttClient.on('close', () => {
    console.log('MQTT connection closed');
    if (connectionStatus !== 'error') {
      connectionStatus = 'disconnected';
    }
  });

  mqttClient.on('offline', () => {
    console.log('MQTT client offline');
    if (connectionStatus !== 'error') {
      connectionStatus = 'disconnected';
    }
  });
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Get MQTT connection status
  app.get('/api/mqtt/status', (req, res) => {
    const username = MQTT_USERNAME ? `${MQTT_USERNAME.substring(0, 4)}***` : 'Not set';
    res.json({ 
      status: connectionStatus,
      broker: MQTT_BROKER.replace(/wss:\/\//, '').replace(/:\d+.*/, ''),
      username,
      error: lastError || undefined
    });
  });

  // Connect to MQTT broker
  app.post('/api/mqtt/connect', (req, res) => {
    try {
      connectMqtt();
      // Wait a moment for connection to establish
      setTimeout(() => {
        res.json({ 
          success: connectionStatus !== 'error', 
          status: connectionStatus,
          error: lastError || undefined
        });
      }, 2000);
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Disconnect from MQTT broker
  app.post('/api/mqtt/disconnect', (req, res) => {
    try {
      if (mqttClient) {
        mqttClient.end(true);
        mqttClient = null;
      }
      connectionStatus = 'disconnected';
      lastError = '';
      res.json({ success: true, status: 'disconnected' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Send MQTT message
  app.post('/api/mqtt/send', (req, res) => {
    try {
      const result = mqttMessageSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ 
          success: false, 
          error: result.error.errors[0].message 
        });
      }

      const { topic, message } = result.data;

      if (!mqttClient || !mqttClient.connected) {
        return res.status(503).json({ 
          success: false, 
          error: 'MQTT client not connected' 
        });
      }

      mqttClient.publish(topic, message, { qos: 1 }, (error) => {
        if (error) {
          return res.status(500).json({ 
            success: false, 
            error: error.message 
          });
        }
        res.json({ 
          success: true, 
          topic, 
          message,
          timestamp: new Date().toISOString()
        });
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  return httpServer;
}
