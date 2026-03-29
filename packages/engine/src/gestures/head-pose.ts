import type { GestureType } from '../types.js';

interface Point3D {
  x: number;
  y: number;
  z: number;
}

interface HeadPoseInput {
  noseTip: Point3D;
  faceCenter: Point3D;
  faceWidth: number;
  faceHeight: number;
}

interface HeadPoseResult {
  type: GestureType;
  confidence: number;
  velocity: number;
}

interface HeadPoseConfig {
  deadZone: number;
  velocityExponent: number;
  mirrored?: boolean;
}

export class HeadPoseDetector {
  private deadZone: number;
  private velocityExponent: number;
  private mirrored: boolean;
  private headPosition: Point3D = { x: 0.5, y: 0.5, z: 0 };

  constructor(config: HeadPoseConfig) {
    this.deadZone = config.deadZone;
    this.velocityExponent = config.velocityExponent;
    this.mirrored = config.mirrored ?? false;
  }

  update(input: HeadPoseInput): HeadPoseResult | null {
    // Mirror X for selfie-view: when user looks left, nose moves right in frame
    const mirroredX = this.mirrored ? (1 - input.noseTip.x) : input.noseTip.x;
    this.headPosition = { x: mirroredX, y: input.noseTip.y, z: input.noseTip.z };

    const noseX = this.mirrored ? (1 - input.noseTip.x) : input.noseTip.x;
    const centerX = this.mirrored ? (1 - input.faceCenter.x) : input.faceCenter.x;
    const dx = (noseX - centerX) / input.faceWidth;
    const dy = (input.noseTip.y - input.faceCenter.y) / input.faceHeight;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (absDx < this.deadZone && absDy < this.deadZone) {
      return null;
    }

    const isVertical = absDy > absDx;

    if (isVertical) {
      const velocity = Math.pow(absDy - this.deadZone, this.velocityExponent);
      const confidence = Math.min(absDy * 2, 1);
      const type: GestureType = dy > 0 ? 'nod-down' : 'nod-up';
      return { type, confidence, velocity };
    }

    const velocity = Math.pow(absDx - this.deadZone, this.velocityExponent);
    const confidence = Math.min(absDx * 2, 1);
    const type: GestureType = dx < 0 ? 'tilt-left' : 'tilt-right';
    return { type, confidence, velocity };
  }

  getHeadPosition(): Point3D {
    return { ...this.headPosition };
  }

  reset(): void {
    this.headPosition = { x: 0.5, y: 0.5, z: 0 };
  }
}
