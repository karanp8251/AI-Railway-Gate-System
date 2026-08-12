import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { api } from '../../services/api';
import GlassCard from '../../components/ui/GlassCard';

export default function Analytics() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/analytics/dashboard').then((res) => setData(res.data));
  }, []);

  const chartData = [
    { name: 'Detections', value: data?.ai?.totalDetections || 0 },
    { name: 'Alerts', value: data?.alertCount || 0 },
    { name: 'Confidence', value: data?.ai?.avgConfidence || 0 },
  ];

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl neon-text-cyan">Analytics</h2>
      <div className="grid lg:grid-cols-2 gap-4">
        <GlassCard>
          <h3 className="font-display mb-4">System Metrics</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #00f5ff33' }} />
                <Bar dataKey="value" fill="#00f5ff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
        <GlassCard>
          <h3 className="font-display mb-4">AI Confidence Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#39ff14" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
