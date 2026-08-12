import GlassCard from '../ui/GlassCard';
import { useTranslation } from 'react-i18next';

function Dot({ connected }) {
  return (
    <span
      className={`inline-block w-2.5 h-2.5 rounded-full mr-2 ${
        connected ? 'bg-green-400 shadow-[0_0_8px_#39ff14]' : 'bg-red-400 shadow-[0_0_8px_#ff073a] animate-pulse'
      }`}
    />
  );
}

export default function ConnectionStatus({ mqtt = false, firebase = false, database = false, databaseMode }) {
  const { t } = useTranslation();
  const dbOnline = database || firebase || databaseMode === 'local-sync';

  return (
    <GlassCard delay={0.15}>
      <h3 className="font-display text-sm text-slate-400 uppercase tracking-wider mb-3">Connections</h3>
      <div className="space-y-2 text-sm">
        <p className="flex items-center">
          <Dot connected={mqtt} />
          {mqtt ? t('mqtt.connected') : t('mqtt.disconnected')}
        </p>
        <p className="flex items-center">
          <Dot connected={dbOnline} />
          {firebase
            ? t('firebase.connected')
            : dbOnline
              ? `Database Online (${databaseMode === 'local-sync' ? 'Local Sync' : 'Active'})`
              : 'Database Offline'}
        </p>
      </div>
    </GlassCard>
  );
}
