import { useEffect, useState, useCallback } from 'react';
import { api } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import StatCard from '../../components/ui/StatCard';
import SystemHealthCard from '../../components/dashboard/SystemHealthCard';
import GateStatusCard from '../../components/dashboard/GateStatusCard';
import AIConfidenceMeter from '../../components/dashboard/AIConfidenceMeter';
import AlertsPanel from '../../components/dashboard/AlertsPanel';
import TrainDetectionView from '../../components/dashboard/TrainDetectionView';
import ESPMonitor from '../../components/dashboard/ESPMonitor';
import AuthorityGateControl from '../../components/dashboard/AuthorityGateControl';
import NeonButton from '../../components/ui/NeonButton';
import { downloadCSV } from '../../services/api';

export default function AuthorityDashboard() {
  const [data, setData] = useState(null);
  const [gateLive, setGateLive] = useState(null);
  const { events } = useSocket();

  const load = useCallback(async () => {
    try {
      const res = await api.get('/analytics/authority-panel');
      if (res && res.data) {
        setData(res.data);
        setGateLive(res.data.gateStatus);
      }
    } catch (err) {
      console.error('Dashboard load failed:', err.message);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 8000);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    const gateEvent = events.find((e) => e.event === 'gate:status');
    if (gateEvent?.data) {
      setGateLive((prev) => ({ ...prev, ...gateEvent.data }));
    }
    if (events.length > 0) {
      load();
    }
  }, [events, load]);

  const handleGateChange = (gateData) => {
    setGateLive(gateData);
    setData((prev) => prev ? {
      ...prev,
      gateStatus: gateData,
      esp: {
        ...prev.esp,
        receiver: { ...prev.esp?.receiver, gate: gateData.status, buzzer: gateData.buzzer, online: true, lastSeen: Date.now() },
      },
    } : prev);
  };

  const lockdown = async () => {
    if (!confirm('Activate emergency lockdown?')) return;
    await api.post('/gate/lockdown');
    load();
  };

  const simulate = async (type) => {
    await api.post('/system/simulate', { type });
    load();
  };

  const gate = gateLive || data?.gateStatus;
  const aiReport = data?.aiReport;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h2 className="font-display text-2xl text-green-400">Authority Control Center</h2>
        <div className="flex flex-wrap gap-2">
          <NeonButton variant="danger" onClick={lockdown}>Emergency Lockdown</NeonButton>
          <NeonButton onClick={() => simulate('vibration')}>Sim Vibration</NeonButton>
          <NeonButton onClick={() => simulate('train')}>Sim YOLO</NeonButton>
          <NeonButton onClick={() => simulate('ir_pass')}>Sim IR Pass</NeonButton>
          <NeonButton variant="purple" onClick={() => downloadCSV('logs')}>Export Logs CSV</NeonButton>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Detections" value={aiReport?.total || 0} icon="🚂" />
        <StatCard title="Detected Trains" value={aiReport?.detected || 0} color="green" icon="✓" />
        <StatCard title="Avg Confidence" value={`${Math.round(aiReport?.avgConfidence || 0)}%`} color="cyan" icon="🤖" />
        <StatCard title="Alerts" value={data?.alertCount || 0} color="red" icon="🔔" />
      </div>
      <ESPMonitor espData={data?.esp} />
      <div className="grid lg:grid-cols-4 gap-4">
        <GateStatusCard status={gate?.status} buzzer={gate?.buzzer} />
        <AuthorityGateControl onUpdate={load} onGateChange={handleGateChange} />
        <AIConfidenceMeter confidence={Math.round(aiReport?.avgConfidence || 0)} detected />
        <SystemHealthCard health={data?.health} />
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <AlertsPanel alerts={data?.recentAlerts || []} />
        <TrainDetectionView detection={data?.ai?.lastDetection} />
      </div>
    </div>
  );
}
