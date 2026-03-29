import { describe, it, expect, beforeEach } from 'vitest';
import { MouthDetector } from '../../src/gestures/mouth.js';

describe('MouthDetector', () => {
  let detector: MouthDetector;

  beforeEach(() => {
    detector = new MouthDetector({ openThreshold: 0.5, debounceMs: 200 });
  });

  it('detects mouth-open on transition from closed to open', () => {
    const now = 1000;
    detector.update(0.1, now);
    detector.update(0.1, now + 100);
    const result = detector.update(0.7, now + 300);
    expect(result).not.toBeNull();
    expect(result!.type).toBe('mouth-open');
  });

  it('does not fire while mouth stays open', () => {
    const now = 1000;
    detector.update(0.1, now);
    detector.update(0.7, now + 300);
    const result = detector.update(0.8, now + 500);
    expect(result).toBeNull();
  });

  it('detects mouth-close on transition from open to closed', () => {
    const now = 1000;
    detector.update(0.1, now);
    detector.update(0.7, now + 300);
    detector.update(0.7, now + 600);
    const result = detector.update(0.1, now + 900);
    expect(result).not.toBeNull();
    expect(result!.type).toBe('mouth-close');
  });

  it('debounces rapid open/close within debounce window', () => {
    const now = 1000;
    detector.update(0.1, now);
    detector.update(0.7, now + 300);
    const close = detector.update(0.1, now + 400);
    expect(close).toBeNull();
  });

  it('fires after debounce period', () => {
    const now = 1000;
    detector.update(0.1, now);
    detector.update(0.7, now + 300);
    const result = detector.update(0.1, now + 600);
    expect(result).not.toBeNull();
    expect(result!.type).toBe('mouth-close');
  });
});
