import { motion } from 'framer-motion';

const variants = {
  primary: 'bg-cyan-500/20 border-cyan-400 text-cyan-300 hover:bg-cyan-500/30',
  danger: 'bg-red-500/20 border-red-400 text-red-300 hover:bg-red-500/30',
  success: 'bg-green-500/20 border-green-400 text-green-300 hover:bg-green-500/30',
  purple: 'bg-purple-500/20 border-purple-400 text-purple-300 hover:bg-purple-500/30',
};

export default function NeonButton({
  children,
  variant = 'primary',
  className = '',
  loading = false,
  ...props
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`px-4 py-2 rounded-lg border font-semibold tracking-wide transition-all disabled:opacity-50 ${variants[variant]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? 'Processing...' : children}
    </motion.button>
  );
}
