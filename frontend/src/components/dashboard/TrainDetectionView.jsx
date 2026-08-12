import { motion } from 'framer-motion';
import GlassCard from '../ui/GlassCard';

export default function TrainDetectionView({ detection }) {
  const bbox = detection?.boundingBox || { x: 80, y: 60, w: 180, h: 120 };
  const detected = detection?.detected;

  return (
    <GlassCard className="col-span-2" delay={0.1}>
      <h3 className="font-display text-lg neon-text-cyan mb-4">YOLO Live Detection</h3>
      <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-900 border border-cyan-500/20">
        <div className="absolute inset-0 grid-bg opacity-50" />
        <div className="absolute inset-0 flex items-center justify-center text-slate-600">
          Camera Feed Simulation
        </div>
        {detected && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute border-2 border-green-400 rounded"
            style={{
              left: `${(bbox.x / 640) * 100}%`,
              top: `${(bbox.y / 480) * 100}%`,
              width: `${(bbox.w / 640) * 100}%`,
              height: `${(bbox.h / 480) * 100}%`,
              boxShadow: '0 0 20px rgba(57,255,20,0.5)',
            }}
          >
            <span className="absolute -top-6 left-0 text-xs bg-green-500/80 text-black px-2 py-0.5 rounded font-bold">
              TRAIN {detection?.confidence}%
            </span>
          </motion.div>
        )}
        <div className="absolute bottom-2 left-2 text-xs font-mono text-cyan-400">
          Model: YOLOv8 · {detected ? 'DETECTING' : 'SCANNING'}
        </div>
      </div>
    </GlassCard>
  );
}
