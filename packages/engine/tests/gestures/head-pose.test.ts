import { describe, it, expect, beforeEach } from 'vitest';
import { HeadPoseDetector } from '../../src/gestures/head-pose.js';

describe('HeadPoseDetector', () => {
  let detector: HeadPoseDetector;

  beforeEach(() => {
    detector = new HeadPoseDetector({ deadZone: 0.05, velocityExponent: 2 });
  });

  it('returns null when head is in dead zone (centered)', () => {
    const result = detector.update({
      noseTip: { x: 0.50, y: 0.50, z: 0 },
      faceCenter: { x: 0.50, y: 0.50, z: 0 },
      faceWidth: 0.3,
      faceHeight: 0.4,
    });
    expect(result).toBeNull();
  });

  it('detects nod-down when head tilts down', () => {
    const result = detector.update({
      noseTip: { x: 0.50, y: 0.65, z: 0 },
      faceCenter: { x: 0.50, y: 0.50, z: 0 },
      faceWidth: 0.3,
      faceHeight: 0.4,
    });
    expect(result).not.toBeNull();
    expect(result!.type).toBe('nod-down');
  });

  it('detects nod-up when head tilts up', () => {
    const result = detector.update({
      noseTip: { x: 0.50, y: 0.35, z: 0 },
      faceCenter: { x: 0.50, y: 0.50, z: 0 },
      faceWidth: 0.3,
      faceHeight: 0.4,
    });
    expect(result).not.toBeNull();
    expect(result!.type).toBe('nod-up');
  });

  it('detects tilt-left when head tilts left', () => {
    const result = detector.update({
      noseTip: { x: 0.35, y: 0.50, z: 0 },
      faceCenter: { x: 0.50, y: 0.50, z: 0 },
      faceWidth: 0.3,
      faceHeight: 0.4,
    });
    expect(result).not.toBeNull();
    expect(result!.type).toBe('tilt-left');
  });

  it('detects tilt-right when head tilts right', () => {
    const result = detector.update({
      noseTip: { x: 0.65, y: 0.50, z: 0 },
      faceCenter: { x: 0.50, y: 0.50, z: 0 },
      faceWidth: 0.3,
      faceHeight: 0.4,
    });
    expect(result).not.toBeNull();
    expect(result!.type).toBe('tilt-right');
  });

  it('normalizes displacement by face size', () => {
    const smallFace = detector.update({
      noseTip: { x: 0.55, y: 0.50, z: 0 },
      faceCenter: { x: 0.50, y: 0.50, z: 0 },
      faceWidth: 0.15,
      faceHeight: 0.2,
    });
    const largeFace = detector.update({
      noseTip: { x: 0.55, y: 0.50, z: 0 },
      faceCenter: { x: 0.50, y: 0.50, z: 0 },
      faceWidth: 0.5,
      faceHeight: 0.6,
    });
    if (smallFace && largeFace) {
      expect(smallFace.confidence).toBeGreaterThan(largeFace.confidence);
    }
  });

  it('returns head position for cursor mapping', () => {
    detector.update({
      noseTip: { x: 0.60, y: 0.40, z: -0.1 },
      faceCenter: { x: 0.50, y: 0.50, z: 0 },
      faceWidth: 0.3,
      faceHeight: 0.4,
    });
    const position = detector.getHeadPosition();
    expect(position.x).toBeCloseTo(0.60, 1);
    expect(position.y).toBeCloseTo(0.40, 1);
    expect(position.z).toBeCloseTo(-0.1, 1);
  });

  it('resets head position to center', () => {
    detector.update({
      noseTip: { x: 0.80, y: 0.30, z: -0.2 },
      faceCenter: { x: 0.50, y: 0.50, z: 0 },
      faceWidth: 0.3,
      faceHeight: 0.4,
    });

    detector.reset();

    const position = detector.getHeadPosition();
    expect(position.x).toBeCloseTo(0.5, 1);
    expect(position.y).toBeCloseTo(0.5, 1);
    expect(position.z).toBeCloseTo(0, 1);
  });
});
