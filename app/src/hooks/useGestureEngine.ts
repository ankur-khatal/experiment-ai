import { useRef, useState, useCallback, useEffect } from 'react';
import type {
  GestureEvent, TrackingStatus, CalibrationStep, CalibrationData,
  ModeType, GestureType, ActionType, WorkerInMessage, WorkerOutMessage,
  CalibrationPoint,
} from '@experiment-ai/engine';

interface UseGestureEngineReturn {
  isRunning: boolean;
  isReady: boolean;
  error: string | null;
  lastGesture: GestureEvent | null;
  trackingStatus: TrackingStatus | null;
  calibrationStep: CalibrationStep | null;
  start: (canvas: OffscreenCanvas) => void;
  stop: () => void;
  setMode: (mode: ModeType) => void;
  setMapping: (gesture: GestureType, action: ActionType) => void;
  setSensitivity: (gesture: GestureType, level: number) => void;
  setBlinkThreshold: (ms: number) => void;
  startCalibration: (screenWidth: number, screenHeight: number) => void;
  recordCalibrationPoint: (position: CalibrationPoint['position']) => void;
  finishCalibration: () => void;
  loadCalibration: (data: CalibrationData) => void;
  onGesture: React.MutableRefObject<((event: GestureEvent) => void) | null>;
}

export function useGestureEngine(): UseGestureEngineReturn {
  const workerRef = useRef<Worker | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastGesture, setLastGesture] = useState<GestureEvent | null>(null);
  const [trackingStatus, setTrackingStatus] = useState<TrackingStatus | null>(null);
  const [calibrationStep, setCalibrationStep] = useState<CalibrationStep | null>(null);
  const onGesture = useRef<((event: GestureEvent) => void) | null>(null);

  const send = useCallback((msg: WorkerInMessage, transfer?: Transferable[]) => {
    workerRef.current?.postMessage(msg, transfer ?? []);
  }, []);

  const start = useCallback((canvas: OffscreenCanvas) => {
    const worker = new Worker(
      new URL('../../packages/engine/src/worker.ts', import.meta.url),
      { type: 'module' }
    );
    worker.onmessage = (event: MessageEvent<WorkerOutMessage>) => {
      const msg = event.data;
      switch (msg.type) {
        case 'ready': setIsReady(true); break;
        case 'gesture': setLastGesture(msg.event); onGesture.current?.(msg.event); break;
        case 'tracking-status': setTrackingStatus(msg.status); break;
        case 'calibration-step': setCalibrationStep(msg.step); break;
        case 'calibration-complete': setCalibrationStep(null); break;
        case 'error': setError(msg.message); break;
      }
    };
    workerRef.current = worker;
    worker.postMessage({ type: 'start', canvas } as WorkerInMessage, [canvas]);
    setIsRunning(true);
    setError(null);
  }, []);

  const stop = useCallback(() => {
    send({ type: 'stop' });
    workerRef.current?.terminate();
    workerRef.current = null;
    setIsRunning(false);
    setIsReady(false);
  }, [send]);

  useEffect(() => {
    return () => { workerRef.current?.terminate(); };
  }, []);

  return {
    isRunning, isReady, error, lastGesture, trackingStatus, calibrationStep,
    start, stop,
    setMode: (mode) => send({ type: 'set-mode', mode }),
    setMapping: (gesture, action) => send({ type: 'set-mapping', gesture, action }),
    setSensitivity: (gesture, level) => send({ type: 'set-sensitivity', gesture, level }),
    setBlinkThreshold: (ms) => send({ type: 'set-blink-threshold', ms }),
    startCalibration: (w, h) => send({ type: 'start-calibration', screenWidth: w, screenHeight: h }),
    recordCalibrationPoint: (pos) => send({ type: 'record-calibration-point', position: pos }),
    finishCalibration: () => send({ type: 'finish-calibration' }),
    loadCalibration: (data) => send({ type: 'load-calibration', data }),
    onGesture,
  };
}
