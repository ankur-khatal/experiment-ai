import { FaceLandmarker, FilesetResolver, type FaceLandmarkerResult } from '@mediapipe/tasks-vision';

export interface FaceDetectionResult {
  blendshapes: Record<string, number>;
  landmarks: { x: number; y: number; z: number }[];
  noseTip: { x: number; y: number; z: number };
  faceCenter: { x: number; y: number; z: number };
  faceWidth: number;
  faceHeight: number;
  confidence: number;
}

export class FaceDetector {
  private landmarker: FaceLandmarker | null = null;
  private lastTimestamp = 0;

  async initialize(): Promise<void> {
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
    );
    this.landmarker = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      numFaces: 1,
      outputFaceBlendshapes: true,
      outputFacialTransformationMatrixes: false,
    });
  }

  detect(videoFrame: OffscreenCanvas, timestamp: number): FaceDetectionResult | null {
    if (!this.landmarker) return null;
    if (timestamp <= this.lastTimestamp) {
      timestamp = this.lastTimestamp + 1;
    }
    this.lastTimestamp = timestamp;
    const result = this.landmarker.detectForVideo(videoFrame, timestamp);
    return this.extractResult(result);
  }

  private extractResult(result: FaceLandmarkerResult): FaceDetectionResult | null {
    if (!result.faceLandmarks || result.faceLandmarks.length === 0) return null;
    const landmarks = result.faceLandmarks[0];
    const blendshapes: Record<string, number> = {};
    if (result.faceBlendshapes && result.faceBlendshapes.length > 0) {
      for (const category of result.faceBlendshapes[0].categories) {
        blendshapes[category.categoryName] = category.score;
      }
    }
    const noseTip = landmarks[1];
    const faceCenter = landmarks[6];
    const xs = landmarks.map((l) => l.x);
    const ys = landmarks.map((l) => l.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    return {
      blendshapes,
      landmarks: landmarks.map((l) => ({ x: l.x, y: l.y, z: l.z })),
      noseTip: { x: noseTip.x, y: noseTip.y, z: noseTip.z },
      faceCenter: { x: faceCenter.x, y: faceCenter.y, z: faceCenter.z },
      faceWidth: maxX - minX,
      faceHeight: maxY - minY,
      confidence: blendshapes['_neutral'] ?? 0.8,
    };
  }

  destroy(): void {
    this.landmarker?.close();
    this.landmarker = null;
  }
}
