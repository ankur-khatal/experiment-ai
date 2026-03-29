import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GestureEvent } from '@experiment-ai/engine';

interface ToastItem {
  id: number;
  gesture: GestureEvent;
}

let toastId = 0;

interface GestureToastProps {
  lastGesture: GestureEvent | null;
}

export function GestureToast({ lastGesture }: GestureToastProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((gesture: GestureEvent) => {
    const id = ++toastId;
    setToasts((prev) => [...prev.slice(-2), { id, gesture }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 1500);
  }, []);

  useEffect(() => {
    if (lastGesture && lastGesture.action !== 'none') {
      addToast(lastGesture);
    }
  }, [lastGesture, addToast]);

  const gestureLabel = (type: string) =>
    type.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="fixed top-16 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map(({ id, gesture }) => (
          <motion.div
            key={id}
            initial={{ opacity: 0, x: 40, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 shadow-lg shadow-black/20"
          >
            <motion.div
              className="w-2 h-2 rounded-full bg-blue-500"
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 0.3 }}
            />
            <div>
              <p className="text-sm font-medium text-zinc-200">
                {gestureLabel(gesture.type)}
              </p>
              <p className="text-xs text-zinc-500">
                → {gesture.action}
                <span className="ml-2 font-mono text-zinc-600">
                  {(gesture.confidence * 100).toFixed(0)}%
                </span>
              </p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
