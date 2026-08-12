import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../ui/GlassCard';
import StatusBadge from '../ui/StatusBadge';

export default function AlertsPanel({ alerts = [] }) {
  return (
    <GlassCard delay={0.25}>
      <h3 className="font-display text-lg neon-text-cyan mb-4">Live Alerts</h3>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        <AnimatePresence>
          {alerts.length === 0 ? (
            <p className="text-slate-500 text-sm">No active alerts</p>
          ) : (
            alerts.map((alert) => (
              <motion.div
                key={alert.id || alert.createdAt}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50"
              >
                <div className="flex justify-between items-start gap-2 mb-1">
                  <StatusBadge status={alert.severity || 'info'} />
                  <span className="text-xs text-slate-500">
                    {new Date(alert.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm text-slate-300">{alert.message || alert.title}</p>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </GlassCard>
  );
}
