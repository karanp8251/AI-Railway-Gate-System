import { useEffect, useState, useCallback } from 'react';
import { useSocket } from '../../context/SocketContext';
import { api } from '../../services/api';
import GlassCard from '../ui/GlassCard';
import StatusBadge from '../ui/StatusBadge';

const ONLINE_MS = 120000;

function DeviceCard({ title, device, icon }) {
  const online = device?.online || (device?.lastSeen && Date.now() - device.lastSeen < ONLINE_MS);
  return (
    <GlassCard>
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-display text-cyan-400">{icon} {title}</h3>
        <StatusBadge status={online ? 'online' : 'offline'} />
      </div>
      {title.includes('Sender') && (
        <>
          <p className="text-sm text-slate-400">Piezo Value</p>
          <p className="text-2xl font-display text-purple-400">{device?.piezo ?? '—'}</p>
          <p className="text-xs text-slate-500 mt-2">
            Detected: {device?.detected ? 'Yes' : 'No'} · Threshold: {device?.threshold ?? 150}
          </p>
          {!online && <p className="text-xs text-yellow-500 mt-1">Flash sender firmware & check WiFi</p>}
        </>
      )}
      {title.includes('Receiver') && (
        <>
          <p className="text-sm text-slate-400">Gate Position</p>
          <p className="text-2xl font-display text-green-400 uppercase">{device?.gate ?? '—'}</p>
          <p className="text-xs text-slate-500 mt-2">
            Buzzer: {device?.buzzer ? 'ON' : 'OFF'} · IR: {device?.irTriggered ? 'Triggered' : 'Idle'}
          </p>
          {device?.reason && <p className="text-xs text-cyan-500 mt-1">Reason: {device.reason}</p>}
        </>
      )}
      {device?.lastSeen > 0 && (
        <p className="text-xs text-slate-600 mt-3">
          Last seen: {new Date(device.lastSeen).toLocaleTimeString()}
        </p>
      )}
    </GlassCard>
  );
}

export default function ESPMonitor({ showMqtt = true, espData = null, pollInterval = 8000 }) {
  const [esp, setEsp] = useState(espData);
  const { events } = useSocket();

  const load = useCallback(() => {
    if (espData) {
      setEsp(espData);
      return;
    }
    api.get('/esp/devices').then((r) => setEsp(r.data)).catch(() => {
      setEsp((prev) => ({ ...prev, mqttConnected: false }));
    });
  }, [espData]);

  useEffect(() => {
    setEsp(espData);
  }, [espData]);

  useEffect(() => {
    if (espData) return;
    load();
    const id = setInterval(load, pollInterval);
    return () => clearInterval(id);
  }, [load, espData, pollInterval]);

  useEffect(() => {
    const relevant = events.some((e) =>
      ['gate:status', 'esp:sender', 'esp:receiver', 'sensor:update'].includes(e.event)
    );
    if (relevant && !espData) load();
  }, [events, load, espData]);

  const mqttOk = esp?.mqttConnected ?? espData?.mqttConnected;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-display text-lg neon-text-cyan">ESP32 Live Devices</h3>
        {showMqtt && (
          <span className={`text-xs px-2 py-1 rounded ${mqttOk ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            MQTT {mqttOk ? 'Connected' : 'Offline — start backend: node src/index.js'}
            {(esp?.broker || espData?.broker) ? ` · ${(esp?.broker || espData?.broker).replace('mqtt://', '')}` : ''}
          </span>
        )}
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <DeviceCard title="ESP32 Sender" device={esp?.sender} icon="📡" />
        <DeviceCard title="ESP32 Receiver" device={esp?.receiver} icon="🚧" />
      </div>
    </div>
  );
}
