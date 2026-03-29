import { useRef, useState, useCallback, useEffect } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import type {
  GestureEvent, TrackingStatus, CalibrationStep, CalibrationData,
  ModeType, GestureType, ActionType, CalibrationPoint,
} from '@experiment-ai/engine';
import { BlinkDetector, HeadPoseDetector, MouthDetector, ActionDispatcher, Calibrator } from '@experiment-ai/engine';

interface UseGestureEngineReturn {
  isRunning: boolean;
  isReady: boolean;
  error: string | null;
  lastGesture: GestureEvent | null;
  trackingStatus: TrackingStatus | null;
  calibrationStep: CalibrationStep | null;
  start: (videoElement: HTMLVideoElement) => Promise<void>;
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
  const landmarkerRef = useRef<FaceLandmarker | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const rafRef = useRef<number>(0);

  const blinkRef = useRef(new BlinkDetector({ thresholdMs: 400, cooldownMs: 300 }));
  const headPoseRef = useRef(new HeadPoseDetector({ deadZone: 0.05, velocityExponent: 2 }));
  const mouthRef = useRef(new MouthDetector({ openThreshold: 0.5, debounceMs: 200 }));
  const dispatcherRef = useRef(new ActionDispatcher('browsing'));
  const calibratorRef = useRef<Calibrator | null>(null);

  const [isRunning, setIsRunning] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastGesture, setLastGesture] = useState<GestureEvent | null>(null);
  const [trackingStatus, setTrackingStatus] = useState<TrackingStatus | null>(null);
  const [calibrationStep, setCalibrationStep] = useState<CalibrationStep | null>(null);
  const onGesture = useRef<((event: GestureEvent) => void) | null>(null);

  const fpsCounterRef = useRef({ count: 0, lastTime: 0, fps: 0 });
  const lastTimestampRef = useRef(0);

  const emitGesture = useCallback((type: GestureType, confidence: number, timestamp: number, rawData: Record<string, number>) => {
    const action = dispatcherRef.current.dispatch(type);
    const event: GestureEvent = { type, confidence, action, timestamp, rawData };
    setLastGesture(event);
    onGesture.current?.(event);
  }, []);

  const processFrame = useCallback(() => {
    if (!landmarkerRef.current || !videoRef.current || !videoRef.current.readyState || videoRef.current.readyState < 2) {
      rafRef.current = requestAnimationFrame(processFrame);
      return;
    }

    const now = performance.now();

    // Ensure monotonic timestamps
    let timestamp = now;
    if (timestamp <= lastTimestampRef.current) {
      timestamp = lastTimestampRef.current + 1;
    }
    lastTimestampRef.current = timestamp;

    // FPS counter
    const fpsCounter = fpsCounterRef.current;
    fpsCounter.count++;
    if (now - fpsCounter.lastTime >= 1000) {
      fpsCounter.fps = fpsCounter.count;
      fpsCounter.count = 0;
      fpsCounter.lastTime = now;
    }

    try {
      const result = landmarkerRef.current.detectForVideo(videoRef.current, timestamp);

      if (result.faceLandmarks && result.faceLandmarks.length > 0) {
        const landmarks = result.faceLandmarks[0];

        // Extract blendshapes
        const blendshapes: Record<string, number> = {};
        if (result.faceBlendshapes && result.faceBlendshapes.length > 0) {
          for (const cat of result.faceBlendshapes[0].categories) {
            blendshapes[cat.categoryName] = cat.score;
          }
        }

        // Face geometry
        const noseTip = landmarks[1];
        const faceCenter = landmarks[6];
        const xs = landmarks.map(l => l.x);
        const ys = landmarks.map(l => l.y);
        const faceWidth = Math.max(...xs) - Math.min(...xs);
        const faceHeight = Math.max(...ys) - Math.min(...ys);

        // Blink detection
        const blinkResult = blinkRef.current.update(
          { eyeBlinkLeft: blendshapes['eyeBlinkLeft'] ?? 0, eyeBlinkRight: blendshapes['eyeBlinkRight'] ?? 0 },
          now
        );
        if (blinkResult) emitGesture(blinkResult.type, blinkResult.confidence, now, blendshapes);

        // Head pose detection
        const headResult = headPoseRef.current.update({
          noseTip: { x: noseTip.x, y: noseTip.y, z: noseTip.z },
          faceCenter: { x: faceCenter.x, y: faceCenter.y, z: faceCenter.z },
          faceWidth,
          faceHeight,
        });
        if (headResult) emitGesture(headResult.type, headResult.confidence, now, blendshapes);

        // Mouth detection
        const mouthResult = mouthRef.current.update(blendshapes['jawOpen'] ?? 0, now);
        if (mouthResult) emitGesture(mouthResult.type, mouthResult.confidence, now, blendshapes);

        // Tracking status
        const headPos = headPoseRef.current.getHeadPosition();
        const confidence = blendshapes['_neutral'] ?? 0.8;
        setTrackingStatus({
          faceDetected: true,
          confidence,
          fps: fpsCounter.fps,
          lightingQuality: confidence > 0.7 ? 'good' : confidence > 0.4 ? 'fair' : 'poor',
          headPosition: headPos,
        });
      } else {
        setTrackingStatus({
          faceDetected: false,
          confidence: 0,
          fps: fpsCounter.fps,
          lightingQuality: 'poor',
          headPosition: { x: 0.5, y: 0.5, z: 0 },
        });
      }
    } catch {
      // MediaPipe may throw on initial frames
    }

    rafRef.current = requestAnimationFrame(processFrame);
  }, [emitGesture]);

  const start = useCallback(async (videoElement: HTMLVideoElement) => {
    try {
      videoRef.current = videoElement;

      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );

      const landmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numFaces: 1,
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: false,
      });

      landmarkerRef.current = landmarker;
      fpsCounterRef.current = { count: 0, lastTime: performance.now(), fps: 0 };
      lastTimestampRef.current = 0;
      setIsReady(true);
      setIsRunning(true);
      setError(null);

      rafRef.current = requestAnimationFrame(processFrame);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize face detection');
    }
  }, [processFrame]);

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    landmarkerRef.current?.close();
    landmarkerRef.current = null;
    videoRef.current = null;
    setIsRunning(false);
    setIsReady(false);
  }, []);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      landmarkerRef.current?.close();
    };
  }, []);

  return {
    isRunning, isReady, error, lastGesture, trackingStatus, calibrationStep,
    start, stop,
    setMode: (mode) => dispatcherRef.current.setMode(mode),
    setMapping: (gesture, action) => dispatcherRef.current.setOverride(gesture, action),
    setSensitivity: () => {},
    setBlinkThreshold: (ms) => blinkRef.current.setThreshold(ms),
    startCalibration: (w, h) => {
      calibratorRef.current = new Calibrator(w, h);
      setCalibrationStep({ currentStep: 0, totalSteps: 5, instruction: 'Look at the center dot', position: 'center' });
    },
    recordCalibrationPoint: (pos) => {
      if (!calibratorRef.current) return;
      const headPos = headPoseRef.current.getHeadPosition();
      calibratorRef.current.recordPoint(pos, { noseX: headPos.x, noseY: headPos.y, faceWidth: 0.3, faceHeight: 0.4 });
      const positions: CalibrationPoint['position'][] = ['center', 'top', 'bottom', 'left', 'right'];
      const recorded = calibratorRef.current.getRecordedPositions();
      const nextIdx = recorded.length;
      if (nextIdx < positions.length) {
        const instr = ['Look at the center dot', 'Look at the top dot', 'Look at the bottom dot', 'Look at the left dot', 'Look at the right dot'];
        setCalibrationStep({ currentStep: nextIdx, totalSteps: 5, instruction: instr[nextIdx], position: positions[nextIdx] });
      }
    },
    finishCalibration: () => {
      if (calibratorRef.current?.isComplete()) {
        calibratorRef.current.finalize();
        setCalibrationStep(null);
      }
    },
    loadCalibration: (data) => {
      calibratorRef.current = new Calibrator(data.screenWidth, data.screenHeight);
      calibratorRef.current.loadData(data);
    },
    onGesture,
  };
}
