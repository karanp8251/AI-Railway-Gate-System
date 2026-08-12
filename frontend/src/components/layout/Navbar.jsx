import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import LiveClock from '../ui/LiveClock';
import NeonButton from '../ui/NeonButton';

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const { toggleTheme, isDark } = useTheme();

  const switchLang = () => {
    const next = i18n.language === 'en' ? 'hi' : 'en';
    i18n.changeLanguage(next);
    localStorage.setItem('lang', next);
  };

  return (
    <header className="glass-card rounded-none border-x-0 border-t-0 px-6 py-3 flex items-center justify-between">
      <div>
        <p className="text-xs text-slate-500 uppercase tracking-widest">Logged in as</p>
        <p className="font-display text-cyan-400">
          {user?.displayName || user?.email} · <span className="text-purple-400">{user?.role}</span>
        </p>
      </div>
      <div className="flex items-center gap-4">
        <LiveClock />
        <button onClick={switchLang} className="text-sm text-slate-400 hover:text-cyan-400">
          {i18n.language === 'en' ? 'हिं' : 'EN'}
        </button>
        <button onClick={toggleTheme} className="text-sm text-slate-400 hover:text-cyan-400">
          {isDark ? '☀️' : '🌙'}
        </button>
        <NeonButton variant="danger" onClick={logout} className="text-sm py-1.5">
          {t('logout')}
        </NeonButton>
      </div>
    </header>
  );
}
