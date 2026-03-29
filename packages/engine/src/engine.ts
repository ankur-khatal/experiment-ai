import { FaceDetector, type FaceDetectionResult } from './detectors/face.js';
import { BlinkDetector } from './gestures/blink.js';
import { HeadPoseDetector } from './gestures/head-pose.js';
import { MouthDetector } from './gestures/mouth.js';
import { ActionDispatcher } from './actions/dispatcher.js';
import { Calibrator } from './calibration/calibrator.js';
import { AdaptiveLearner } from './calibration/adaptive.js';
import type {
  GestureEvent,
  TrackingStatus,
  ModeType,
  GestureType,
  ActionType,
  CalibrationData,
  CalibrationPoint,
  EngineConfig,
  WorkerOutMessage,
} from './types.js';

export class GestureEngine {
  private faceDetector: FaceDetector;
  private blinkDetector: BlinkDetector;
  private headPoseDetector: HeadPoseDetector;
  private mouthDetector: MouthDetector;
  private dispatcher: ActionDispatcher;
  private calibrator: Calibrator | null = null;
  private adaptiveLearner: AdaptiveLearner;
  private canvas: OffscreenCanvas | null = null;
  private running = false;
  private frameCount = 0;
  private fpsTimestamp = 0;
  private currentFps = 0;
  private lastFaceTime = 0;
  private emit: (message: WorkerOutMessage) => void;

  constructor(emit: (message: WorkerOutMessage) => void, config?: Partial<EngineConfig>) {
    this.emit = emit;
    this.faceDetector = new FaceDetector();
    this.blinkDetector = new BlinkDetector({ thresholdMs: config?.blinkThresholdMs ?? 400, cooldownMs: 300 });
    this.headPoseDetector = new HeadPoseDetector({ deadZone: 0.05, velocityExponent: 2 });
    this.mouthDetector = new MouthDetector({ openThreshold: 0.5, debounceMs: 200 });
    this.dispatcher = new ActionDispatcher(config?.mode ?? 'browsing');
    this.adaptiveLearner = new AdaptiveLearner({ adjustmentRate: 0.1, adjustmentIntervalMs: 300_000, decayTimeoutMs: 30_000 });
  }

  async start(canvas: OffscreenCanvas): Promise<void> {
    this.canvas = canvas;
    await this.faceDetector.initialize();
    this.running = true;
    this.fpsTimestamp = performance.now();
    this.emit({ type: 'ready' });
    this.loop();
  }

  stop(): void {
    this.running = false;
    this.faceDetector.destroy();
  }

  private loop(): void {
    if (!this.running || !this.canvas) return;
    const now = performance.now();
    const result = this.faceDetector.detect(this.canvas, now);
    this.frameCount++;
    if (now - this.fpsTimestamp >= 1000) {
      this.currentFps = this.frameCount;
      this.frameCount = 0;
      this.fpsTimestamp = now;
    }
    if (result) {
      this.lastFaceTime = now;
      this.processFrame(result, now);
    } else {
      this.adaptiveLearner.reportNoFace(now);
      this.emitTrackingStatus(false, 0, now);
    }
    this.adaptiveLearner.maybeAdjust(now);
    setTimeout(() => this.loop(), 33);
  }

  private processFrame(face: FaceDetectionResult, now: number): void {
    const blinkResult = this.blinkDetector.update(
      { eyeBlinkLeft: face.blendshapes['eyeBlinkLeft'] ?? 0, eyeBlinkRight: face.blendshapes['eyeBlinkRight'] ?? 0 },
      now
    );
    if (blinkResult) this.emitGesture(blinkResult.type, blinkResult.confidence, now, face.blendshapes);

    const headResult = this.headPoseDetector.update({
      noseTip: face.noseTip, faceCenter: face.faceCenter, faceWidth: face.faceWidth, faceHeight: face.faceHeight,
    });
    if (headResult) this.emitGesture(headResult.type, headResult.confidence, now, face.blendshapes);

    const mouthResult = this.mouthDetector.update(face.blendshapes['jawOpen'] ?? 0, now);
    if (mouthResult) this.emitGesture(mouthResult.type, mouthResult.confidence, now, face.blendshapes);

    this.emitTrackingStatus(true, face.confidence, now);
  }

  private emitGesture(type: GestureType, confidence: number, timestamp: number, rawData: Record<string, number>): void {
    const action = this.dispatcher.dispatch(type);
    this.emit({ type: 'gesture', event: { type, confidence, action, timestamp, rawData } });
  }

  private emitTrackingStatus(faceDetected: boolean, confidence: number, now: number): void {
    const headPos = this.headPoseDetector.getHeadPosition();
    const lightingQuality = confidence > 0.7 ? 'good' : confidence > 0.4 ? 'fair' : 'poor';
    this.emit({ type: 'tracking-status', status: { faceDetected, confidence, fps: this.currentFps, lightingQuality, headPosition: headPos } });
  }

  setMode(mode: ModeType): void { this.dispatcher.setMode(mode); }
  setGestureMapping(gesture: GestureType, action: ActionType): void { this.dispatcher.setOverride(gesture, action); }
  setSensitivity(_gesture: GestureType, _level: number): void { /* maps level to detector thresholds */ }
  setBlinkThreshold(ms: number): void { this.blinkDetector.setThreshold(ms); }

  startCalibration(screenWidth: number, screenHeight: number): void {
    this.calibrator = new Calibrator(screenWidth, screenHeight);
    this.emit({ type: 'calibration-step', step: { currentStep: 0, totalSteps: 5, instruction: 'Look at the center dot', position: 'center' } });
  }

  recordCalibrationPoint(position: CalibrationPoint['position']): void {
    if (!this.calibrator) return;
    const headPos = this.headPoseDetector.getHeadPosition();
    this.calibrator.recordPoint(position, { noseX: headPos.x, noseY: headPos.y, faceWidth: 0.3, faceHeight: 0.4 });
    const positions: CalibrationPoint['position'][] = ['center', 'top', 'bottom', 'left', 'right'];
    const recorded = this.calibrator.getRecordedPositions();
    const nextIndex = recorded.length;
    if (nextIndex < positions.length) {
      const instructions = ['Look at the center dot', 'Look at the top dot', 'Look at the bottom dot', 'Look at the left dot', 'Look at the right dot'];
      this.emit({ type: 'calibration-step', step: { currentStep: nextIndex, totalSteps: 5, instruction: instructions[nextIndex], position: positions[nextIndex] } });
    }
  }

  finishCalibration(): void {
    if (!this.calibrator || !this.calibrator.isComplete()) return;
    const data = this.calibrator.finalize();
    this.emit({ type: 'calibration-complete', data });
  }

  loadCalibration(data: CalibrationData): void {
    this.calibrator = new Calibrator(data.screenWidth, data.screenHeight);
    this.calibrator.loadData(data);
  }
}
