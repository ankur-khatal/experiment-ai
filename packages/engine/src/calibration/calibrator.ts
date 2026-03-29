import type { CalibrationData, CalibrationPoint } from '../types.js';

interface LandmarkData {
  noseX: number;
  noseY: number;
  faceWidth: number;
  faceHeight: number;
}

export class Calibrator {
  private screenWidth: number;
  private screenHeight: number;
  private points: Map<CalibrationPoint['position'], LandmarkData> = new Map();
  private minNoseX = 0;
  private maxNoseX = 1;
  private minNoseY = 0;
  private maxNoseY = 1;
  private finalized = false;

  constructor(screenWidth: number, screenHeight: number) {
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
  }

  recordPoint(position: CalibrationPoint['position'], landmarks: LandmarkData): void {
    this.points.set(position, landmarks);
    this.finalized = false;
  }

  getRecordedPositions(): CalibrationPoint['position'][] {
    return Array.from(this.points.keys());
  }

  isComplete(): boolean {
    const required: CalibrationPoint['position'][] = ['center', 'top', 'bottom', 'left', 'right'];
    return required.every((pos) => this.points.has(pos));
  }

  finalize(): CalibrationData {
    if (!this.isComplete()) throw new Error('Calibration incomplete');
    const left = this.points.get('left')!;
    const right = this.points.get('right')!;
    const top = this.points.get('top')!;
    const bottom = this.points.get('bottom')!;
    this.minNoseX = left.noseX;
    this.maxNoseX = right.noseX;
    this.minNoseY = top.noseY;
    this.maxNoseY = bottom.noseY;
    this.finalized = true;
    const calibrationPoints: CalibrationPoint[] = Array.from(this.points.entries()).map(
      ([position, landmarks]) => ({ position, landmarks })
    );
    return { points: calibrationPoints, screenWidth: this.screenWidth, screenHeight: this.screenHeight, timestamp: Date.now() };
  }

  loadData(data: CalibrationData): void {
    this.screenWidth = data.screenWidth;
    this.screenHeight = data.screenHeight;
    this.points.clear();
    for (const point of data.points) {
      this.points.set(point.position, point.landmarks);
    }
    if (this.isComplete()) this.finalize();
  }

  mapToScreen(noseX: number, noseY: number): { x: number; y: number } {
    if (!this.finalized) return { x: this.screenWidth / 2, y: this.screenHeight / 2 };
    const rangeX = this.maxNoseX - this.minNoseX;
    const rangeY = this.maxNoseY - this.minNoseY;
    const normalizedX = rangeX > 0 ? (noseX - this.minNoseX) / rangeX : 0.5;
    const normalizedY = rangeY > 0 ? (noseY - this.minNoseY) / rangeY : 0.5;
    const clampedX = Math.max(0, Math.min(1, normalizedX));
    const clampedY = Math.max(0, Math.min(1, normalizedY));
    return { x: clampedX * this.screenWidth, y: clampedY * this.screenHeight };
  }

  reset(): void {
    this.points.clear();
    this.finalized = false;
    this.minNoseX = 0; this.maxNoseX = 1;
    this.minNoseY = 0; this.maxNoseY = 1;
  }
}
