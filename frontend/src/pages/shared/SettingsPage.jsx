import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import GlassCard from '../../components/ui/GlassCard';

export default function SettingsPage({ authority = false }) {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="font-display text-2xl neon-text-cyan">{t('nav.settings')}</h2>
      <GlassCard>
        <h3 className="font-display mb-4">Appearance</h3>
        <button onClick={toggleTheme} className="px-4 py-2 rounded-lg border border-cyan-500/30 text-cyan-300">
          {theme === 'dark' ? t('theme.light') : t('theme.dark')}
        </button>
      </GlassCard>
      <GlassCard>
        <h3 className="font-display mb-4">Language</h3>
        <select
          value={i18n.language}
          onChange={(e) => { i18n.changeLanguage(e.target.value); localStorage.setItem('lang', e.target.value); }}
          className="px-4 py-2 rounded-lg bg-slate-900/60 border border-slate-700"
        >
          <option value="en">English</option>
          <option value="hi">हिंदी</option>
        </select>
      </GlassCard>
      {authority && (
        <GlassCard>
          <h3 className="font-display mb-4 text-green-400">System Configuration</h3>
          <p className="text-slate-400 text-sm">Configure MQTT topics, sensor thresholds, and AI settings via Firebase Realtime Database path: <code className="text-cyan-400">systemConfig</code></p>
        </GlassCard>
      )}
    </div>
  );
}
