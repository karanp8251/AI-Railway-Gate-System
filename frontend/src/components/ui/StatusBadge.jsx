export default function StatusBadge({ status, size = 'sm' }) {
  const map = {
    open: 'bg-green-500/20 text-green-400 border-green-500/40',
    closed: 'bg-red-500/20 text-red-400 border-red-500/40',
    online: 'bg-green-500/20 text-green-400 border-green-500/40',
    offline: 'bg-slate-500/20 text-slate-400 border-slate-500/40',
    high: 'bg-red-500/20 text-red-400 border-red-500/40',
    critical: 'bg-red-600/30 text-red-300 border-red-500/50 animate-pulse',
    info: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40',
    maintenance: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
  };
  const sizeClass = size === 'lg' ? 'px-4 py-1.5 text-sm' : 'px-2 py-0.5 text-xs';
  return (
    <span className={`inline-flex rounded-full border font-semibold uppercase tracking-wider ${map[status] || map.info} ${sizeClass}`}>
      {status}
    </span>
  );
}
