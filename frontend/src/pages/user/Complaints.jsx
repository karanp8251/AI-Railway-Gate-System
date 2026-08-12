import { useState } from 'react';
import { api } from '../../services/api';
import GlassCard from '../../components/ui/GlassCard';
import NeonButton from '../../components/ui/NeonButton';

export default function Complaints() {
  const [form, setForm] = useState({ subject: '', message: '', crossingId: '' });
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    await api.post('/users/complaint', form);
    setSent(true);
    setForm({ subject: '', message: '', crossingId: '' });
  };

  return (
    <div className="space-y-6 max-w-xl">
      <h2 className="font-display text-2xl neon-text-cyan">Submit Complaint</h2>
      <GlassCard>
        {sent && <p className="text-green-400 mb-4">Complaint submitted successfully.</p>}
        <form onSubmit={submit} className="space-y-4">
          <input placeholder="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required className="w-full px-4 py-2 rounded-lg bg-slate-900/60 border border-slate-700" />
          <input placeholder="Crossing ID (optional)" value={form.crossingId} onChange={(e) => setForm({ ...form, crossingId: e.target.value })} className="w-full px-4 py-2 rounded-lg bg-slate-900/60 border border-slate-700" />
          <textarea placeholder="Describe your complaint..." value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required className="w-full h-32 px-4 py-2 rounded-lg bg-slate-900/60 border border-slate-700" />
          <NeonButton type="submit">Submit Complaint</NeonButton>
        </form>
      </GlassCard>
    </div>
  );
}
