interface AdaptiveConfig {
  adjustmentRate: number;
  adjustmentIntervalMs: number;
  decayTimeoutMs: number;
}

interface Thresholds {
  blinkThresholdMs: number;
  mouthOpenThreshold: number;
  headDeadZone: number;
}

interface AdaptiveProfile {
  thresholds: Thresholds;
  blinkDurations: number[];
  lastAdjustment: number;
}

const DEFAULTS: Thresholds = {
  blinkThresholdMs: 400,
  mouthOpenThreshold: 0.5,
  headDeadZone: 0.05,
};

export class AdaptiveLearner {
  private adjustmentRate: number;
  private adjustmentIntervalMs: number;
  private decayTimeoutMs: number;
  private thresholds: Thresholds = { ...DEFAULTS };
  private blinkDurations: number[] = [];
  private lastAdjustmentTime: number = 0;
  private lastFaceSeenTime: number = 0;

  constructor(config: AdaptiveConfig) {
    this.adjustmentRate = config.adjustmentRate;
    this.adjustmentIntervalMs = config.adjustmentIntervalMs;
    this.decayTimeoutMs = config.decayTimeoutMs;
  }

  recordBlinkDuration(durationMs: number, timestamp: number): void {
    this.blinkDurations.push(durationMs);
    this.lastFaceSeenTime = timestamp;
    if (this.blinkDurations.length > 100) this.blinkDurations.shift();
  }

  maybeAdjust(timestamp: number): void {
    if (timestamp - this.lastAdjustmentTime < this.adjustmentIntervalMs) return;
    if (this.blinkDurations.length < 10) return;
    this.lastAdjustmentTime = timestamp;
    const avgBlink = this.blinkDurations.reduce((a, b) => a + b, 0) / this.blinkDurations.length;
    const targetBlink = avgBlink;
    const maxAdjustment = DEFAULTS.blinkThresholdMs * this.adjustmentRate;
    const diff = targetBlink - this.thresholds.blinkThresholdMs;
    const clampedDiff = Math.max(-maxAdjustment, Math.min(maxAdjustment, diff));
    this.thresholds.blinkThresholdMs += clampedDiff;
  }

  reportNoFace(timestamp: number): void {
    if (timestamp - this.lastFaceSeenTime > this.decayTimeoutMs) {
      this.thresholds.blinkThresholdMs += (DEFAULTS.blinkThresholdMs - this.thresholds.blinkThresholdMs) * 0.5;
      this.thresholds.mouthOpenThreshold += (DEFAULTS.mouthOpenThreshold - this.thresholds.mouthOpenThreshold) * 0.5;
      this.thresholds.headDeadZone += (DEFAULTS.headDeadZone - this.thresholds.headDeadZone) * 0.5;
    }
  }

  getThresholds(): Thresholds { return { ...this.thresholds }; }

  exportProfile(): AdaptiveProfile {
    return { thresholds: { ...this.thresholds }, blinkDurations: [...this.blinkDurations], lastAdjustment: this.lastAdjustmentTime };
  }

  importProfile(profile: AdaptiveProfile): void {
    this.thresholds = { ...profile.thresholds };
    this.blinkDurations = [...profile.blinkDurations];
    this.lastAdjustmentTime = profile.lastAdjustment;
  }

  reset(): void {
    this.thresholds = { ...DEFAULTS };
    this.blinkDurations = [];
    this.lastAdjustmentTime = 0;
  }
}
