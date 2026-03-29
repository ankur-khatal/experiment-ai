import { motion } from 'framer-motion';

interface ConfidenceMeterProps {
  label: string;
  score: number;
}

export function ConfidenceMeter({ label, score }: ConfidenceMeterProps) {
  const color = score > 0.6 ? 'bg-green-500' : score > 0.1 ? 'bg-blue-500' : 'bg-zinc-700';
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-zinc-400 w-32 truncate">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-zinc-800 overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          animate={{ width: `${Math.max(score * 100, 0)}%` }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      </div>
      <span className="font-mono text-xs text-zinc-500 w-10 text-right">
        {(score * 100).toFixed(0)}%
      </span>
    </div>
  );
}
