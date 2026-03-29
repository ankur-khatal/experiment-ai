import type { GestureType } from '../types.js';

interface MouthResult {
  type: GestureType;
  confidence: number;
  timestamp: number;
}

interface MouthConfig {
  openThreshold: number;
  debounceMs: number;
}

export class MouthDetector {
  private openThreshold: number;
  private debounceMs: number;
  private isOpen: boolean = false;
  private lastTransitionTime: number = 0;

  constructor(config: MouthConfig) {
    this.openThreshold = config.openThreshold;
    this.debounceMs = config.debounceMs;
  }

  update(jawOpenScore: number, timestamp: number): MouthResult | null {
    const currentlyOpen = jawOpenScore > this.openThreshold;

    if (currentlyOpen === this.isOpen) {
      return null;
    }

    if (timestamp - this.lastTransitionTime < this.debounceMs) {
      return null;
    }

    this.isOpen = currentlyOpen;
    this.lastTransitionTime = timestamp;

    return {
      type: currentlyOpen ? 'mouth-open' : 'mouth-close',
      confidence: currentlyOpen ? jawOpenScore : 1 - jawOpenScore,
      timestamp,
    };
  }

  reset(): void {
    this.isOpen = false;
    this.lastTransitionTime = 0;
  }
}
