import { describe, it, expect, beforeEach } from 'vitest';
import { BlinkDetector } from '../../src/gestures/blink.js';

describe('BlinkDetector', () => {
  let detector: BlinkDetector;

  beforeEach(() => {
    detector = new BlinkDetector({ thresholdMs: 400, cooldownMs: 300 });
  });

  it('ignores natural blinks shorter than threshold', () => {
    const now = 1000;
    detector.update({ eyeBlinkLeft: 0.8, eyeBlinkRight: 0.8 }, now);
    const result = detector.update({ eyeBlinkLeft: 0.1, eyeBlinkRight: 0.1 }, now + 200);
    expect(result).toBeNull();
  });

  it('detects deliberate blink longer than threshold', () => {
    const now = 1000;
    detector.update({ eyeBlinkLeft: 0.8, eyeBlinkRight: 0.8 }, now);
    detector.update({ eyeBlinkLeft: 0.8, eyeBlinkRight: 0.8 }, now + 400);
    const result = detector.update({ eyeBlinkLeft: 0.1, eyeBlinkRight: 0.1 }, now + 450);
    expect(result).not.toBeNull();
    expect(result!.type).toBe('blink');
    expect(result!.confidence).toBeGreaterThan(0.5);
  });

  it('requires both eyes closed above 0.6 threshold', () => {
    const now = 1000;
    detector.update({ eyeBlinkLeft: 0.8, eyeBlinkRight: 0.3 }, now);
    detector.update({ eyeBlinkLeft: 0.8, eyeBlinkRight: 0.3 }, now + 500);
    const result = detector.update({ eyeBlinkLeft: 0.1, eyeBlinkRight: 0.1 }, now + 550);
    expect(result).toBeNull();
  });

  it('enforces cooldown between blinks', () => {
    const now = 1000;
    detector.update({ eyeBlinkLeft: 0.8, eyeBlinkRight: 0.8 }, now);
    detector.update({ eyeBlinkLeft: 0.8, eyeBlinkRight: 0.8 }, now + 400);
    detector.update({ eyeBlinkLeft: 0.1, eyeBlinkRight: 0.1 }, now + 450);
    detector.update({ eyeBlinkLeft: 0.8, eyeBlinkRight: 0.8 }, now + 500);
    detector.update({ eyeBlinkLeft: 0.8, eyeBlinkRight: 0.8 }, now + 900);
    const result = detector.update({ eyeBlinkLeft: 0.1, eyeBlinkRight: 0.1 }, now + 950);
    expect(result).toBeNull();
  });

  it('detects double blink within 500ms window', () => {
    const now = 1000;
    detector.update({ eyeBlinkLeft: 0.8, eyeBlinkRight: 0.8 }, now);
    detector.update({ eyeBlinkLeft: 0.8, eyeBlinkRight: 0.8 }, now + 400);
    const first = detector.update({ eyeBlinkLeft: 0.1, eyeBlinkRight: 0.1 }, now + 450);
    expect(first!.type).toBe('blink');
    detector.update({ eyeBlinkLeft: 0.8, eyeBlinkRight: 0.8 }, now + 800);
    detector.update({ eyeBlinkLeft: 0.8, eyeBlinkRight: 0.8 }, now + 1200);
    const second = detector.update({ eyeBlinkLeft: 0.1, eyeBlinkRight: 0.1 }, now + 1250);
    expect(second).not.toBeNull();
    expect(second!.type).toBe('double-blink');
  });

  it('allows updating blink threshold at runtime', () => {
    detector.setThreshold(200);
    const now = 1000;
    detector.update({ eyeBlinkLeft: 0.8, eyeBlinkRight: 0.8 }, now);
    detector.update({ eyeBlinkLeft: 0.8, eyeBlinkRight: 0.8 }, now + 200);
    const result = detector.update({ eyeBlinkLeft: 0.1, eyeBlinkRight: 0.1 }, now + 250);
    expect(result).not.toBeNull();
  });

  it('resets all internal state', () => {
    const now = 1000;
    // Build up some state — detect a blink
    detector.update({ eyeBlinkLeft: 0.8, eyeBlinkRight: 0.8 }, now);
    detector.update({ eyeBlinkLeft: 0.8, eyeBlinkRight: 0.8 }, now + 400);
    detector.update({ eyeBlinkLeft: 0.1, eyeBlinkRight: 0.1 }, now + 450);

    // Reset clears everything
    detector.reset();

    // After reset, a new blink should work as if fresh (no cooldown, no double-blink)
    detector.update({ eyeBlinkLeft: 0.8, eyeBlinkRight: 0.8 }, now + 500);
    detector.update({ eyeBlinkLeft: 0.8, eyeBlinkRight: 0.8 }, now + 900);
    const result = detector.update({ eyeBlinkLeft: 0.1, eyeBlinkRight: 0.1 }, now + 950);
    expect(result).not.toBeNull();
    expect(result!.type).toBe('blink'); // Not double-blink, because reset cleared history
  });
});
