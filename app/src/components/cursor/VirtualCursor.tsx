import { motion } from 'framer-motion';

interface VirtualCursorProps {
  x: number;
  y: number;
  isClicking: boolean;
  visible: boolean;
}

export function VirtualCursor({ x, y, isClicking, visible }: VirtualCursorProps) {
  if (!visible) return null;

  return (
    <motion.div
      className="fixed pointer-events-none z-[100]"
      animate={{ x: x - 16, y: y - 16 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
    >
      {/* Outer ring */}
      <motion.div
        className="w-8 h-8 rounded-full border-2 border-blue-400/60"
        animate={{
          scale: isClicking ? 0.6 : 1,
          borderColor: isClicking ? 'rgb(34 197 94 / 0.8)' : 'rgb(96 165 250 / 0.6)',
        }}
        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
      />
      {/* Center dot */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-blue-400"
        animate={{
          scale: isClicking ? 2 : 1,
          backgroundColor: isClicking ? 'rgb(34 197 94)' : 'rgb(96 165 250)',
        }}
        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
      />
      {/* Click pulse */}
      {isClicking && (
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border border-green-400"
          initial={{ scale: 1, opacity: 0.8 }}
          animate={{ scale: 2.5, opacity: 0 }}
          transition={{ duration: 0.4 }}
        />
      )}
    </motion.div>
  );
}
