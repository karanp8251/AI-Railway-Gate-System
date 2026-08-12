import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';
import GlassCard from '../ui/GlassCard';
import { useTranslation } from 'react-i18next';

export default function AIConfidenceMeter({ confidence = 0, detected = false }) {
  const { t } = useTranslation();
  const data = [{ name: 'AI', value: confidence, fill: detected ? '#39ff14' : '#00f5ff' }];

  return (
    <GlassCard delay={0.1}>
      <h3 className="font-display text-lg neon-text-cyan mb-2">{t('ai.confidence')}</h3>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={data} startAngle={180} endAngle={0}>
            <RadialBar background dataKey="value" cornerRadius={8} />
          </RadialBarChart>
        </ResponsiveContainer>
      </div>
      <p className="text-center font-display text-3xl font-bold text-cyan-400">{confidence}%</p>
      <p className="text-center text-sm text-slate-400 mt-1">
        YOLO {detected ? '● Train Detected' : '○ Monitoring'}
      </p>
    </GlassCard>
  );
}
