import GlassCard from '../../components/ui/GlassCard';

const crossings = [
  { id: 'RC-001', name: 'Sector 12 Crossing', distance: '0.8 km', status: 'active' },
  { id: 'RC-002', name: 'Industrial Zone Gate', distance: '2.3 km', status: 'active' },
  { id: 'RC-003', name: 'North Junction', distance: '5.1 km', status: 'maintenance' },
];

export default function NearbyCrossings() {
  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl neon-text-cyan">Nearby Railway Crossings</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {crossings.map((c) => (
          <GlassCard key={c.id}>
            <h3 className="font-display text-cyan-400">{c.name}</h3>
            <p className="text-slate-500 text-sm mt-1">{c.id}</p>
            <p className="text-slate-400 mt-2">📍 {c.distance}</p>
            <span className={`inline-block mt-3 text-xs px-2 py-1 rounded ${c.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
              {c.status}
            </span>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
