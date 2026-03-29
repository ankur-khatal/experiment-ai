import { motion } from 'framer-motion';
import type { TrackingStatus } from '@experiment-ai/engine';

interface StatusBarProps {
  trackingStatus: TrackingStatus | null;
  mode: string;
  isEnabled: boolean;
  onToggle: () => void;
}

export function StatusBar({ trackingStatus, mode, isEnabled, onToggle }: StatusBarProps) {
  const faceDetected = trackingStatus?.faceDetected ?? false;
  const fps = trackingStatus?.fps ?? 0;
  const lighting = trackingStatus?.lightingQuality ?? 'poor';

  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm">
      <div className="flex items-center gap-4">
        {/* Face detection indicator */}
        <div className="flex items-center gap-2">
          <motion.div
            className={`w-2.5 h-2.5 rounded-full ${faceDetected ? 'bg-green-500' : 'bg-red-500'}`}
            animate={{
              scale: faceDetected ? [1, 1.3, 1] : 1,
              opacity: faceDetected ? 1 : 0.6,
            }}
            transition={{
              scale: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
            }}
          />
          <span className="text-xs text-zinc-400">
            {faceDetected ? 'Face detected' : 'No face'}
          </span>
        </div>

        {/* FPS */}
        <span className="font-mono text-xs text-zinc-500">
          {fps} FPS
        </span>

        {/* Lighting */}
        <span className={`text-xs ${
          lighting === 'good' ? 'text-green-400' :
          lighting === 'fair' ? 'text-amber-400' : 'text-red-400'
        }`}>
          {lighting}
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* Mode badge */}
        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/15 text-blue-400 border border-blue-500/20 capitalize">
          {mode}
        </span>

        {/* Toggle */}
        <button
          onClick={onToggle}
          className={`relative w-10 h-5 rounded-full transition-colors ${
            isEnabled ? 'bg-blue-500' : 'bg-zinc-700'
          }`}
        >
          <motion.div
            className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm"
            animate={{ left: isEnabled ? '22px' : '2px' }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        </button>
      </div>
    </div>
  );
}
