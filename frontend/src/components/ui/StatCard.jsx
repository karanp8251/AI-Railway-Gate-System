import GlassCard from './GlassCard';

export default function StatCard({ title, value, subtitle, icon, color = 'cyan', delay = 0 }) {
  const colors = {
    cyan: 'text-cyan-400',
    green: 'text-green-400',
    red: 'text-red-400',
    purple: 'text-purple-400',
  };
  return (
    <GlassCard delay={delay}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-slate-400 text-sm uppercase tracking-wider">{title}</p>
          <p className={`text-3xl font-display font-bold mt-1 ${colors[color]}`}>{value}</p>
          {subtitle && <p className="text-slate-500 text-sm mt-1">{subtitle}</p>}
        </div>
        {icon && <span className="text-3xl opacity-60">{icon}</span>}
      </div>
    </GlassCard>
  );
}
