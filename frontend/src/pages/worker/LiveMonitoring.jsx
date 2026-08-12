import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import TrainDetectionView from '../../components/dashboard/TrainDetectionView';
import GlassCard from '../../components/ui/GlassCard';
import SensorChart from '../../components/dashboard/SensorChart';

export default function LiveMonitoring() {
  const [mqttMessages, setMqttMessages] = useState([]);
  const [detection, setDetection] = useState(null);

  useEffect(() => {
    const load = async () => {
      const [mqtt, dash] = await Promise.all([
        api.get('/system/mqtt-messages'),
        api.get('/analytics/dashboard'),
      ]);
      setMqttMessages(mqtt.data);
      setDetection(dash.data?.ai?.lastDetection);
    };
    load();
    const id = setInterval(load, 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl text-purple-400">Live Monitoring</h2>
      <TrainDetectionView detection={detection} />
      <SensorChart />
      <GlassCard>
        <h3 className="font-display neon-text-cyan mb-4">MQTT Message Stream</h3>
        <div className="font-mono text-xs space-y-2 max-h-96 overflow-y-auto">
          {mqttMessages.map((m) => (
            <div key={m.id} className="p-2 rounded bg-slate-900/50 border border-slate-800">
              <span className="text-cyan-400">{m.topic}</span>
              <pre className="text-slate-400 mt-1">{JSON.stringify(m.payload, null, 2)}</pre>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
