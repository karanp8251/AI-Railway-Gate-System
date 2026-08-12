import { useSocket } from '../../context/SocketContext';
import GlassCard from '../ui/GlassCard';

export default function LiveEventFeed() {
  const { events } = useSocket();

  return (
    <GlassCard delay={0.35}>
      <h3 className="font-display text-lg neon-text-cyan mb-4">Live Event Feed</h3>
      <div className="space-y-1 max-h-48 overflow-y-auto font-mono text-xs">
        {events.length === 0 ? (
          <p className="text-slate-500">Listening for real-time events...</p>
        ) : (
          events.map((e, i) => (
            <div key={i} className="flex gap-2 text-cyan-300/80 border-b border-slate-800 py-1">
              <span className="text-slate-600 shrink-0">
                {new Date(e.ts).toLocaleTimeString()}
              </span>
              <span className="text-purple-400">{e.event}</span>
              <span className="truncate text-slate-400">
                {JSON.stringify(e.data).slice(0, 60)}
              </span>
            </div>
          ))
        )}
      </div>
    </GlassCard>
  );
}
