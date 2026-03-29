import { motion } from 'framer-motion';

type DotPosition = 'center' | 'top' | 'bottom' | 'left' | 'right';

interface CalibrationDotProps {
  position: DotPosition;
  isRecorded: boolean;
}

const POSITION_MAP: Record<DotPosition, { top: string; left: string }> = {
  center: { top: '50%', left: '50%' },
  top:    { top: '10%', left: '50%' },
  bottom: { top: '90%', left: '50%' },
  left:   { top: '50%', left: '10%' },
  right:  { top: '50%', left: '90%' },
};

export function CalibrationDot({ position, isRecorded }: CalibrationDotProps) {
  const pos = POSITION_MAP[position];

  return (
    <motion.div
      animate={{ top: pos.top, left: pos.left }}
      transition={{ type: 'spring', stiffness: 200, damping: 22 }}
      style={{ position: 'absolute', transform: 'translate(-50%, -50%)' }}
    >
      {/* Pulsing ring — hidden once recorded */}
      {!isRecorded && (
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-blue-400"
          style={{ margin: '-8px' }}
          animate={{ scale: [1, 1.8, 1], opacity: [0.8, 0, 0.8] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {/* Main dot */}
      <motion.div
        className="w-6 h-6 rounded-full"
        animate={{
          backgroundColor: isRecorded ? '#22c55e' : '#3b82f6',
          scale: isRecorded ? [1, 1.4, 1] : 1,
        }}
        transition={
          isRecorded
            ? { duration: 0.35, ease: 'easeOut' }
            : { duration: 0.2 }
        }
      />
    </motion.div>
  );
}
