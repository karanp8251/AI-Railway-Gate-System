import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROLES, ROLE_ROUTES } from '../../config/constants';
import GlassCard from '../../components/ui/GlassCard';
import NeonButton from '../../components/ui/NeonButton';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: '',
    password: '',
    displayName: '',
    role: ROLES.USER,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const user = await register(form.email, form.password, form.displayName, form.role);
      navigate(ROLE_ROUTES[user.role]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid-bg flex items-center justify-center p-4">
      <GlassCard className="w-full max-w-md">
        <Link to="/" className="text-slate-500 text-sm">← Back</Link>
        <h1 className="font-display text-2xl neon-text-cyan mt-4 mb-6">Register</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            placeholder="Display Name"
            value={form.displayName}
            onChange={(e) => setForm({ ...form, displayName: e.target.value })}
            required
            className="w-full px-4 py-3 rounded-lg bg-slate-900/60 border border-slate-700 outline-none focus:border-cyan-500"
          />
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            className="w-full px-4 py-3 rounded-lg bg-slate-900/60 border border-slate-700 outline-none focus:border-cyan-500"
          />
          <input
            type="password"
            placeholder="Password (min 6)"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            minLength={6}
            className="w-full px-4 py-3 rounded-lg bg-slate-900/60 border border-slate-700 outline-none focus:border-cyan-500"
          />
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="w-full px-4 py-3 rounded-lg bg-slate-900/60 border border-slate-700 outline-none"
          >
            <option value={ROLES.USER}>Public User</option>
            <option value={ROLES.WORKER}>Railway Worker</option>
            <option value={ROLES.AUTHORITY}>Railway Authority</option>
          </select>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <NeonButton type="submit" loading={loading} className="w-full">
            Register
          </NeonButton>
        </form>
      </GlassCard>
    </div>
  );
}
