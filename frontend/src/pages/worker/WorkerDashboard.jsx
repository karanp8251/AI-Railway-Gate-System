import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import GateStatusCard from '../../components/dashboard/GateStatusCard';
import AIConfidenceMeter from '../../components/dashboard/AIConfidenceMeter';
import SensorChart from '../../components/dashboard/SensorChart';
import AlertsPanel from '../../components/dashboard/AlertsPanel';
import WorkerControls from '../../components/dashboard/WorkerControls';
import TrainDetectionView from '../../components/dashboard/TrainDetectionView';
import ActivityTimeline from '../../components/dashboard/ActivityTimeline';
import LiveEventFeed from '../../components/dashboard/LiveEventFeed';
import ConnectionStatus from '../../components/dashboard/ConnectionStatus';
import ESPMonitor from '../../components/dashboard/ESPMonitor';

export default function WorkerDashboard() {
  const [data, setData] = useState(null);
  const { events } = useSocket();

  const load = async () => {
    const [dash, sensors] = await Promise.all([
      api.get('/analytics/dashboard'),
      api.get('/sensors'),
    ]);
    if (dash && dash.data && sensors) {
      setData({ ...dash.data, sensors: sensors.data });
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 4000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (events.length > 0) {
      load();
    }
  }, [events]);

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl text-purple-400">Worker Operations</h2>
      <ESPMonitor />
      <div className="grid lg:grid-cols-4 gap-4">
        <div className="lg:col-span-1 space-y-4">
          <GateStatusCard status={data?.gateStatus?.status} buzzer={data?.gateStatus?.buzzer} />
          <WorkerControls onUpdate={load} />
          <ConnectionStatus mqtt={data?.connections?.mqtt} firebase={data?.connections?.firebase} />
        </div>
        <div className="lg:col-span-2 space-y-4">
          <TrainDetectionView detection={data?.ai?.lastDetection} />
          <SensorChart data={(data?.sensors || []).slice(0, 20).map((s, i) => ({
            time: i,
            piezo: s.value || (s.type === 'piezo' ? 50 : 0),
            ir: s.type === 'ir' && s.passed ? 1 : 0,
          }))} />
        </div>
        <div className="lg:col-span-1 space-y-4">
          <AIConfidenceMeter
            confidence={data?.ai?.lastDetection?.confidence || 0}
            detected={data?.ai?.lastDetection?.detected}
          />
          <AlertsPanel alerts={data?.recentAlerts || []} />
        </div>
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <ActivityTimeline events={events} />
        <LiveEventFeed />
      </div>
    </div>
  );
}
