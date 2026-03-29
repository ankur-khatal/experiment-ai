// --- Gesture Types ---

export type GestureType =
  | 'blink'
  | 'double-blink'
  | 'nod-up'
  | 'nod-down'
  | 'tilt-left'
  | 'tilt-right'
  | 'turn-left'
  | 'turn-right'
  | 'mouth-open'
  | 'mouth-close';

export type ActionType =
  | 'click'
  | 'right-click'
  | 'scroll-up'
  | 'scroll-down'
  | 'scroll-left'
  | 'scroll-right'
  | 'back'
  | 'forward'
  | 'tab-next'
  | 'tab-prev'
  | 'zoom-in'
  | 'zoom-out'
  | 'cursor-move'
  | 'none';

export type ModeType = 'browsing' | 'reading' | 'presentation';

export interface GestureEvent {
  type: GestureType;
  confidence: number;
  action: ActionType;
  timestamp: number;
  rawData: Record<string, number>;
}

export interface TrackingStatus {
  faceDetected: boolean;
  confidence: number;
  fps: number;
  lightingQuality: 'good' | 'fair' | 'poor';
  headPosition: { x: number; y: number; z: number };
}

export interface CalibrationPoint {
  position: 'center' | 'top' | 'bottom' | 'left' | 'right';
  landmarks: { noseX: number; noseY: number; faceWidth: number; faceHeight: number };
}

export interface CalibrationData {
  points: CalibrationPoint[];
  screenWidth: number;
  screenHeight: number;
  timestamp: number;
}

export interface CalibrationStep {
  currentStep: number;
  totalSteps: number;
  instruction: string;
  position: CalibrationPoint['position'];
}

export type GestureMapping = Record<GestureType, ActionType>;

export interface EngineConfig {
  mode: ModeType;
  sensitivity: Partial<Record<GestureType, number>>;
  blinkThresholdMs: number;
  customMappings: Partial<GestureMapping>;
}

// --- Worker Message Protocol ---

export type WorkerInMessage =
  | { type: 'start'; canvas: OffscreenCanvas }
  | { type: 'stop' }
  | { type: 'set-mode'; mode: ModeType }
  | { type: 'set-mapping'; gesture: GestureType; action: ActionType }
  | { type: 'set-sensitivity'; gesture: GestureType; level: number }
  | { type: 'set-blink-threshold'; ms: number }
  | { type: 'start-calibration'; screenWidth: number; screenHeight: number }
  | { type: 'record-calibration-point'; position: CalibrationPoint['position'] }
  | { type: 'finish-calibration' }
  | { type: 'load-calibration'; data: CalibrationData };

export type WorkerOutMessage =
  | { type: 'gesture'; event: GestureEvent }
  | { type: 'tracking-status'; status: TrackingStatus }
  | { type: 'calibration-step'; step: CalibrationStep }
  | { type: 'calibration-complete'; data: CalibrationData }
  | { type: 'error'; message: string }
  | { type: 'ready' };
