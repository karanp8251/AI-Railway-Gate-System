import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { ROLE_ROUTES } from '../../config/constants';
import GlassCard from '../../components/ui/GlassCard';
import NeonButton from '../../components/ui/NeonButton';

export default function LoginPanel({ role, titleKey, accent = 'cyan' }) {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password, role);
      navigate(ROLE_ROUTES[role]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const accentColors = {
    cyan: 'neon-text-cyan border-cyan-500/30',
    purple: 'text-purple-400 border-purple-500/30',
    green: 'text-green-400 border-green-500/30',
  };

  return (
    <div className="min-h-screen grid-bg flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-md">
        <GlassCard className={accentColors[accent]}>
          <Link to="/" className="text-slate-500 text-sm hover:text-cyan-400">← Back</Link>
          <h1 className={`font-display text-2xl mt-4 mb-6 ${accentColors[accent].split(' ')[0]}`}>
            {t(titleKey)}
          </h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg bg-slate-900/60 border border-slate-700 focus:border-cyan-500 outline-none"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg bg-slate-900/60 border border-slate-700 focus:border-cyan-500 outline-none"
            />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <NeonButton type="submit" loading={loading} className="w-full">
              Sign In
            </NeonButton>
          </form>
          <p className="text-center text-slate-500 text-sm mt-4">
            <Link to="/register" className="text-cyan-400 hover:underline">Create account</Link>
          </p>
        </GlassCard>
      </motion.div>
    </div>
  );
}
