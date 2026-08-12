import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import GlassCard from '../ui/GlassCard';

export default function SensorChart({ data = [] }) {
  const chartData = data.length
    ? data
    : Array.from({ length: 12 }, (_, i) => ({
        time: `${i * 5}s`,
        piezo: Math.floor(Math.random() * 40 + 10),
        ir: Math.random() > 0.8 ? 1 : 0,
      }));

  return (
    <GlassCard delay={0.2} className="col-span-2">
      <h3 className="font-display text-lg neon-text-cyan mb-4">Sensor Monitoring</h3>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,245,255,0.1)" />
            <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
            <YAxis stroke="#64748b" fontSize={11} />
            <Tooltip
              contentStyle={{
                background: 'rgba(15,23,42,0.9)',
                border: '1px solid rgba(0,245,255,0.3)',
                borderRadius: 8,
              }}
            />
            <Line type="monotone" dataKey="piezo" stroke="#00f5ff" strokeWidth={2} dot={false} name="Piezo" />
            <Line type="monotone" dataKey="ir" stroke="#b026ff" strokeWidth={2} dot={false} name="IR" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}
