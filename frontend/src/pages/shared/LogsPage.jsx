import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import GlassCard from '../../components/ui/GlassCard';

export default function LogsPage() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    api.get('/system/logs').then((res) => setLogs(res.data));
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl neon-text-cyan">System Logs</h2>
      <GlassCard>
        <div className="space-y-2 max-h-[70vh] overflow-y-auto font-mono text-sm">
          {logs.map((log) => (
            <div key={log.id} className="p-3 rounded bg-slate-900/40 border border-slate-800 flex justify-between gap-4">
              <span className="text-cyan-400">{log.action || log.type}</span>
              <span className="text-slate-500 shrink-0">{new Date(log.createdAt).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
