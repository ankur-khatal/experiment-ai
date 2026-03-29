import type { GestureType } from '../types.js';

interface BlinkScores {
  eyeBlinkLeft: number;
  eyeBlinkRight: number;
}

interface BlinkResult {
  type: GestureType;
  confidence: number;
  timestamp: number;
}

interface BlinkConfig {
  thresholdMs: number;
  cooldownMs: number;
  closedScoreThreshold?: number;
  doubleBinkWindowMs?: number;
}

export class BlinkDetector {
  private thresholdMs: number;
  private cooldownMs: number;
  private closedScoreThreshold: number;
  private doubleBlinkWindowMs: number;

  private eyesClosedSince: number | null = null;
  private lastBlinkTime: number | null = null;
  private lastBlinkScore: number = 0;
  private pendingDoubleBlinkStart: number | null = null;

  constructor(config: BlinkConfig) {
    this.thresholdMs = config.thresholdMs;
    this.cooldownMs = config.cooldownMs;
    this.closedScoreThreshold = config.closedScoreThreshold ?? 0.6;
    this.doubleBlinkWindowMs = config.doubleBinkWindowMs ?? 500;
  }

  update(scores: BlinkScores, timestamp: number): BlinkResult | null {
    const bothClosed =
      scores.eyeBlinkLeft > this.closedScoreThreshold &&
      scores.eyeBlinkRight > this.closedScoreThreshold;

    if (bothClosed) {
      if (this.eyesClosedSince === null) {
        this.eyesClosedSince = timestamp;
      }
      this.lastBlinkScore = Math.max(this.lastBlinkScore, (scores.eyeBlinkLeft + scores.eyeBlinkRight) / 2);
      return null;
    }

    if (this.eyesClosedSince !== null) {
      const closedSince = this.eyesClosedSince;
      const closedDuration = timestamp - closedSince;
      const score = this.lastBlinkScore;
      this.eyesClosedSince = null;
      this.lastBlinkScore = 0;

      if (closedDuration < this.thresholdMs) {
        return null;
      }

      // Check cooldown: based on when this blink started (eyes closed), not when it ended
      const timeSinceLastBlink = this.lastBlinkTime !== null ? closedSince - this.lastBlinkTime : Infinity;

      if (timeSinceLastBlink < this.cooldownMs) {
        return null;
      }

      // Check double-blink: the second blink started within the window after the first ended
      const isDoubleBlink =
        this.pendingDoubleBlinkStart !== null &&
        (closedSince - this.pendingDoubleBlinkStart) <= this.doubleBlinkWindowMs;

      this.lastBlinkTime = timestamp;
      this.pendingDoubleBlinkStart = timestamp;

      if (isDoubleBlink) {
        this.pendingDoubleBlinkStart = null;
        return { type: 'double-blink', confidence: score, timestamp };
      }

      return { type: 'blink', confidence: score, timestamp };
    }

    return null;
  }

  setThreshold(ms: number): void {
    this.thresholdMs = ms;
  }

  reset(): void {
    this.eyesClosedSince = null;
    this.lastBlinkTime = null;
    this.lastBlinkScore = 0;
    this.pendingDoubleBlinkStart = null;
  }
}
