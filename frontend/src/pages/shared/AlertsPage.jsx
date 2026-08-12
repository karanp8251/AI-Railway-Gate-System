import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import AlertsPanel from '../../components/dashboard/AlertsPanel';
import GlassCard from '../../components/ui/GlassCard';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../config/constants';
import NeonButton from '../../components/ui/NeonButton';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [announcement, setAnnouncement] = useState({ title: '', message: '' });
  const { user } = useAuth();

  const load = () => api.get('/alerts').then((res) => setAlerts(res.data));

  useEffect(() => { load(); }, []);

  const postAnnouncement = async () => {
    await api.post('/alerts/announcement', announcement);
    setAnnouncement({ title: '', message: '' });
    load();
  };

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl neon-text-cyan">Alerts</h2>
      {user?.role === ROLES.AUTHORITY && (
        <GlassCard>
          <h3 className="mb-3">Post Announcement</h3>
          <input placeholder="Title" value={announcement.title} onChange={(e) => setAnnouncement({ ...announcement, title: e.target.value })} className="w-full mb-2 px-4 py-2 rounded-lg bg-slate-900/60 border border-slate-700" />
          <textarea placeholder="Message" value={announcement.message} onChange={(e) => setAnnouncement({ ...announcement, message: e.target.value })} className="w-full mb-2 px-4 py-2 rounded-lg bg-slate-900/60 border border-slate-700 h-20" />
          <NeonButton onClick={postAnnouncement}>Publish</NeonButton>
        </GlassCard>
      )}
      <AlertsPanel alerts={alerts} />
    </div>
  );
}
