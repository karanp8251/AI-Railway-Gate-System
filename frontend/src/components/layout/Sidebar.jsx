import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../config/constants';

const navByRole = {
  [ROLES.USER]: [
    { to: '/user/dashboard', label: 'nav.dashboard', icon: '🏠' },
    { to: '/user/crossings', label: 'Crossings', icon: '📍' },
    { to: '/user/complaints', label: 'Complaints', icon: '📝' },
    { to: '/alerts', label: 'nav.alerts', icon: '🔔' },
    { to: '/analytics', label: 'nav.analytics', icon: '📊' },
    { to: '/settings', label: 'nav.settings', icon: '⚙️' },
  ],
  [ROLES.WORKER]: [
    { to: '/worker/dashboard', label: 'nav.dashboard', icon: '🏠' },
    { to: '/worker/monitoring', label: 'nav.monitoring', icon: '📹' },
    { to: '/worker/logs', label: 'nav.logs', icon: '📋' },
    { to: '/alerts', label: 'nav.alerts', icon: '🔔' },
    { to: '/analytics', label: 'nav.analytics', icon: '📊' },
    { to: '/settings', label: 'nav.settings', icon: '⚙️' },
  ],
  [ROLES.AUTHORITY]: [
    { to: '/authority/dashboard', label: 'nav.dashboard', icon: '🏠' },
    { to: '/authority/users', label: 'nav.users', icon: '👥' },
    { to: '/worker/monitoring', label: 'nav.monitoring', icon: '📹' },
    { to: '/alerts', label: 'nav.alerts', icon: '🔔' },
    { to: '/analytics', label: 'nav.analytics', icon: '📊' },
    { to: '/logs', label: 'nav.logs', icon: '📋' },
    { to: '/authority/settings', label: 'nav.settings', icon: '⚙️' },
  ],
};

export default function Sidebar() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const items = navByRole[user?.role] || [];

  return (
    <aside className="w-64 min-h-screen glass-card rounded-none border-l-0 border-t-0 border-b-0 p-4 hidden lg:block">
      <h1 className="font-display text-lg neon-text-cyan mb-8 px-2">{t('app.title')}</h1>
      <nav className="space-y-1">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-800/50'
              }`
            }
          >
            <span>{item.icon}</span>
            <span>{item.label.startsWith('nav.') ? t(item.label) : item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
