import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ROLES } from '../config/constants';

const panels = [
  { role: ROLES.USER, title: 'Public User', desc: 'View status, alerts & reports', path: '/login/user', color: 'cyan' },
  { role: ROLES.WORKER, title: 'Railway Worker', desc: 'Monitor sensors & control gates', path: '/login/worker', color: 'purple' },
  { role: ROLES.AUTHORITY, title: 'Railway Authority', desc: 'Full system administration', path: '/login/authority', color: 'green' },
];

export default function Home() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen grid-bg flex flex-col items-center justify-center p-6"
    >
      <motion.h1
        initial={{ y: -30 }}
        animate={{ y: 0 }}
        className="font-display text-4xl md:text-6xl neon-text-cyan text-center mb-4"
      >
        AI Railway Gate System
      </motion.h1>
      <p className="text-slate-400 text-center max-w-xl mb-12">
        Enterprise smart railway crossing automation with YOLO AI detection, MQTT sensors, and real-time dashboards.
      </p>
      <div className="grid md:grid-cols-3 gap-6 w-full max-w-5xl">
        {panels.map((p, i) => (
          <motion.div
            key={p.role}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.15 }}
          >
            <Link to={p.path} className="block glass-card p-8 hover:scale-105 transition-transform neon-border">
              <h2 className={`font-display text-xl text-${p.color}-400 mb-2`}>{p.title}</h2>
              <p className="text-slate-400 text-sm mb-4">{p.desc}</p>
              <span className="text-cyan-400 text-sm font-semibold">Login →</span>
            </Link>
          </motion.div>
        ))}
      </div>
      <Link to="/register" className="mt-8 text-slate-500 hover:text-cyan-400 text-sm">
        New user? Register here
      </Link>
    </motion.div>
  );
}
