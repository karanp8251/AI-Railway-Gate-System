import { useState } from 'react';
import { api } from '../../services/api';
import GlassCard from '../ui/GlassCard';
import NeonButton from '../ui/NeonButton';

export default function WorkerControls({ onUpdate, embedded = false, onGateChange }) {
  const [loading, setLoading] = useState('');
  const [message, setMessage] = useState('');

  const control = async (action) => {
    setLoading(action);
    setMessage('');
    try {
      const res = await api.post('/gate/control', { action });
      const status = res.data?.status || action;
      setMessage(`Gate ${status.toUpperCase()} — command sent to ESP32`);
      onGateChange?.(res.data);
      onUpdate?.(res.data);
    } catch (err) {
      setMessage(`Error: ${err.message}`);
      alert(err.message);
    } finally {
      setLoading('');
    }
  };

  const buzzer = async (on) => {
    setLoading(on ? 'buzzer_on' : 'buzzer_off');
    try {
      await api.post('/gate/buzzer', { on });
      setMessage(`Buzzer ${on ? 'ON' : 'OFF'}`);
      onUpdate?.();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading('');
    }
  };

  const content = (
    <>
      {!embedded && <h3 className="font-display text-lg text-purple-400 mb-4">Gate Controls</h3>}
      <div className="grid grid-cols-2 gap-2">
        <NeonButton type="button" variant="success" loading={loading === 'open'} onClick={() => control('open')}>
          Open Gate
        </NeonButton>
        <NeonButton type="button" variant="danger" loading={loading === 'close'} onClick={() => control('close')}>
          Close Gate
        </NeonButton>
        <NeonButton type="button" variant="danger" loading={loading === 'emergency_stop'} onClick={() => control('emergency_stop')}>
          Emergency Stop
        </NeonButton>
        <NeonButton type="button" loading={loading === 'buzzer_on'} onClick={() => buzzer(true)}>
          Buzzer ON
        </NeonButton>
        <NeonButton type="button" className="col-span-2" loading={loading === 'buzzer_off'} onClick={() => buzzer(false)}>
          Buzzer OFF
        </NeonButton>
      </div>
      {message && (
        <p className={`text-xs mt-3 ${message.startsWith('Error') ? 'text-red-400' : 'text-green-400'}`}>
          {message}
        </p>
      )}
    </>
  );

  if (embedded) return content;
  return <GlassCard>{content}</GlassCard>;
}
