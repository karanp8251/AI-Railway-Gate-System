import { motion } from 'framer-motion';

export default function GlassCard({ children, className = '', delay = 0, onClick }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={`glass-card p-5 neon-border ${className}`}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}
