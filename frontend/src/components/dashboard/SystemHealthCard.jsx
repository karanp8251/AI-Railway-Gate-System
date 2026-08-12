import GlassCard from '../ui/GlassCard';

function formatUptime(ms) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h}h ${m}m`;
}

export default function SystemHealthCard({ health = {} }) {
  const uptime = health.uptime || 0;
  const dbOnline = health.database || health.firebase || health.databaseMode === 'local-sync';

  return (
    <GlassCard delay={0.4}>
      <h3 className="font-display text-lg neon-text-cyan mb-4">System Health</h3>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="p-3 rounded-lg bg-slate-800/40">
          <p className="text-slate-500">Uptime</p>
          <p className="font-display text-cyan-400 text-lg">{formatUptime(uptime)}</p>
        </div>
        <div className="p-3 rounded-lg bg-slate-800/40">
          <p className="text-slate-500">API Status</p>
          <p className="font-display text-green-400 text-lg">{health.status || 'OK'}</p>
        </div>
        <div className="p-3 rounded-lg bg-slate-800/40">
          <p className="text-slate-500">MQTT</p>
          <p className={health.mqtt ? 'text-green-400 font-semibold' : 'text-red-400 font-semibold'}>
            {health.mqtt ? 'Online' : 'Offline'}
          </p>
          {health.broker && <p className="text-xs text-slate-600 mt-1 truncate">{health.broker.replace('mqtt://', '')}</p>}
        </div>
        <div className="p-3 rounded-lg bg-slate-800/40">
          <p className="text-slate-500">Database</p>
          <p className={dbOnline ? 'text-green-400 font-semibold' : 'text-red-400 font-semibold'}>
            {health.firebase ? 'Firebase Online' : dbOnline ? 'Local Sync Online' : 'Offline'}
          </p>
        </div>
      </div>
    </GlassCard>
  );
}
