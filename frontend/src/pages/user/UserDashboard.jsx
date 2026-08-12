import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import StatCard from '../../components/ui/StatCard';
import GateStatusCard from '../../components/dashboard/GateStatusCard';
import AIConfidenceMeter from '../../components/dashboard/AIConfidenceMeter';
import ConnectionStatus from '../../components/dashboard/ConnectionStatus';
import AlertsPanel from '../../components/dashboard/AlertsPanel';
import TrainDetectionView from '../../components/dashboard/TrainDetectionView';
import LiveEventFeed from '../../components/dashboard/LiveEventFeed';
import ESPMonitor from '../../components/dashboard/ESPMonitor';
import NeonButton from '../../components/ui/NeonButton';

export default function UserDashboard() {
  const [data, setData] = useState(null);
  const [emergencyMsg, setEmergencyMsg] = useState('');
  const { events } = useSocket();

  const load = async () => {
    const res = await api.get('/analytics/dashboard');
    if (res && res.data) {
      setData(res.data);
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (events.length > 0) {
      load();
    }
  }, [events]);

  const reportEmergency = async () => {
    await api.post('/alerts/emergency', { message: emergencyMsg || 'Emergency at crossing' });
    setEmergencyMsg('');
    alert('Emergency report sent');
    load();
  };

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl neon-text-cyan">Public Dashboard</h2>
      <ESPMonitor showMqtt={false} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Gate" value={data?.gateStatus?.status?.toUpperCase() || '—'} icon="🚧" delay={0} />
        <StatCard title="AI Confidence" value={`${data?.ai?.avgConfidence || 0}%`} color="green" icon="🤖" delay={0.05} />
        <StatCard title="Alerts" value={data?.alertCount || 0} color="red" icon="🔔" delay={0.1} />
        <StatCard title="Detections" value={data?.ai?.totalDetections || 0} color="purple" icon="🚂" delay={0.15} />
      </div>
      <div className="grid lg:grid-cols-3 gap-4">
        <GateStatusCard status={data?.gateStatus?.status} buzzer={data?.gateStatus?.buzzer} />
        <AIConfidenceMeter confidence={data?.ai?.lastDetection?.confidence || data?.ai?.avgConfidence || 0} detected={data?.ai?.lastDetection?.detected} />
        <ConnectionStatus mqtt={data?.connections?.mqtt} firebase={data?.connections?.firebase} />
      </div>
      <TrainDetectionView detection={data?.ai?.lastDetection} />
      <div className="grid lg:grid-cols-2 gap-4">
        <AlertsPanel alerts={data?.recentAlerts || []} />
        <LiveEventFeed />
      </div>
      <GlassCardEmergency emergencyMsg={emergencyMsg} setEmergencyMsg={setEmergencyMsg} onReport={reportEmergency} />
    </div>
  );
}

function GlassCardEmergency({ emergencyMsg, setEmergencyMsg, onReport }) {
  return (
    <div className="glass-card p-5 border-red-500/30">
      <h3 className="font-display text-red-400 mb-3">Emergency Report</h3>
      <textarea
        value={emergencyMsg}
        onChange={(e) => setEmergencyMsg(e.target.value)}
        placeholder="Describe the emergency..."
        className="w-full h-24 px-4 py-2 rounded-lg bg-slate-900/60 border border-red-500/30 outline-none mb-3"
      />
      <NeonButton variant="danger" onClick={onReport}>Send Emergency Report</NeonButton>
    </div>
  );
}
