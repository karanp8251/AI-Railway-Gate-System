import WorkerControls from './WorkerControls';
import GlassCard from '../ui/GlassCard';

export default function AuthorityGateControl({ onUpdate, onGateChange }) {
  return (
    <GlassCard className="border-green-500/30">
      <h3 className="font-display text-lg text-green-400 mb-2">Authority Gate Control</h3>
      <p className="text-xs text-slate-500 mb-4">
        Sends MQTT command to <code className="text-cyan-500">railway/gate</code> → ESP32 Receiver
      </p>
      <WorkerControls embedded onUpdate={onUpdate} onGateChange={onGateChange} />
    </GlassCard>
  );
}
