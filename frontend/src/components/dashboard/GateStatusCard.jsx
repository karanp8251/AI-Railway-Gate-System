import { useTranslation } from 'react-i18next';
import GlassCard from '../ui/GlassCard';
import StatusBadge from '../ui/StatusBadge';

export default function GateStatusCard({ status = 'open', buzzer = false }) {
  const { t } = useTranslation();
  const isClosed = status === 'closed';

  return (
    <GlassCard>
      <h3 className="font-display text-lg neon-text-cyan mb-4">{t('gate.status')}</h3>
      <div className="flex items-center justify-center py-6">
        <div
          className={`w-32 h-32 rounded-full border-4 flex items-center justify-center font-display text-2xl font-bold transition-all duration-500 ${
            isClosed
              ? 'border-red-500 text-red-400 shadow-[0_0_40px_rgba(255,7,58,0.4)]'
              : 'border-green-500 text-green-400 shadow-[0_0_40px_rgba(57,255,20,0.3)]'
          }`}
        >
          {isClosed ? '⛔' : '✓'}
        </div>
      </div>
      <div className="flex justify-center gap-3">
        <StatusBadge status={status} size="lg" />
        {buzzer && <StatusBadge status="critical" size="lg" />}
      </div>
      <p className="text-center text-slate-400 mt-3 text-sm">
        {isClosed ? t('gate.closed') : t('gate.open')}
        {buzzer && ' · Buzzer Active'}
      </p>
    </GlassCard>
  );
}
