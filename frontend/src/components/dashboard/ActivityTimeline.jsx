import GlassCard from '../ui/GlassCard';

export default function ActivityTimeline({ events = [] }) {
  return (
    <GlassCard delay={0.3}>
      <h3 className="font-display text-lg neon-text-cyan mb-4">AI Activity Timeline</h3>
      <div className="relative pl-6 space-y-4 max-h-72 overflow-y-auto">
        <div className="absolute left-2 top-0 bottom-0 w-px bg-cyan-500/30" />
        {events.length === 0 ? (
          <p className="text-slate-500 text-sm">Waiting for detections...</p>
        ) : (
          events.map((e, i) => (
            <div key={i} className="relative">
              <span className="absolute -left-4 w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f5ff]" />
              <p className="text-sm font-medium text-cyan-300">{e.event || e.action}</p>
              <p className="text-xs text-slate-500">
                {new Date(e.ts || e.createdAt).toLocaleString()}
              </p>
              {e.data?.confidence && (
                <p className="text-xs text-green-400">Confidence: {e.data.confidence}%</p>
              )}
            </div>
          ))
        )}
      </div>
    </GlassCard>
  );
}
