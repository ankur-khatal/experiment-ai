import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GestureEvent, GestureType } from '@experiment-ai/engine';

interface PracticeItem {
  gesture: GestureType;
  emoji: string;
  instruction: string;
}

const PRACTICE_SEQUENCE: PracticeItem[] = [
  { gesture: 'blink',      emoji: '👁️',  instruction: 'Try blinking deliberately for half a second' },
  { gesture: 'nod-up',     emoji: '⬆️',  instruction: 'Nod your head upward slowly' },
  { gesture: 'nod-down',   emoji: '⬇️',  instruction: 'Nod your head downward slowly' },
  { gesture: 'tilt-left',  emoji: '↖️',  instruction: 'Tilt your head to the left' },
  { gesture: 'tilt-right', emoji: '↗️',  instruction: 'Tilt your head to the right' },
  { gesture: 'mouth-open', emoji: '😮',  instruction: 'Open your mouth wide' },
];

interface GesturePracticeProps {
  onComplete: () => void;
  lastGesture: GestureEvent | null;
}

export function GesturePractice({ onComplete, lastGesture }: GesturePracticeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [detected, setDetected] = useState(false);

  const current = PRACTICE_SEQUENCE[currentIndex];

  // Detect matching gesture
  useEffect(() => {
    if (!lastGesture || detected) return;
    if (lastGesture.type === current.gesture) {
      setDetected(true);
    }
  }, [lastGesture, current.gesture, detected]);

  const handleNext = () => {
    if (currentIndex < PRACTICE_SEQUENCE.length - 1) {
      setCurrentIndex((i) => i + 1);
      setDetected(false);
    } else {
      onComplete();
    }
  };

  const isLast = currentIndex === PRACTICE_SEQUENCE.length - 1;

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      {/* Progress dots */}
      <div className="flex gap-2">
        {PRACTICE_SEQUENCE.map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-colors ${
              i < currentIndex
                ? 'bg-green-500'
                : i === currentIndex
                ? 'bg-blue-500'
                : 'bg-zinc-700'
            }`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ type: 'spring', stiffness: 280, damping: 26 }}
          className="flex flex-col items-center gap-5 w-full max-w-sm"
        >
          {/* Gesture icon */}
          <div className="w-24 h-24 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center">
            <span className="text-5xl" role="img" aria-label={current.gesture}>
              {current.emoji}
            </span>
          </div>

          {/* Instruction */}
          <p className="text-base text-zinc-200 text-center leading-snug">
            {current.instruction}
          </p>

          {/* Detection feedback */}
          <AnimatePresence>
            {detected && (
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.6, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/15 border border-green-500/40"
              >
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 18, delay: 0.05 }}
                  className="text-green-400 text-xl"
                >
                  ✓
                </motion.span>
                <span className="text-green-300 text-sm font-medium">Gesture detected!</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>

      {/* Next / Skip button */}
      <div className="flex gap-3 mt-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleNext}
          className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            detected
              ? 'bg-blue-500 text-white hover:bg-blue-400'
              : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
          }`}
        >
          {detected ? (isLast ? 'Finish' : 'Next') : 'Skip'}
        </motion.button>
      </div>
    </div>
  );
}
