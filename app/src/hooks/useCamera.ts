import { useRef, useState, useCallback, useEffect } from 'react';

interface UseCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  isActive: boolean;
  error: string | null;
  start: () => Promise<void>;
  stop: () => void;
  getOffscreenCanvas: () => OffscreenCanvas | null;
}

export function useCamera(): UseCameraReturn {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const offscreenCanvasRef = useRef<OffscreenCanvas | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;

      // Video element is always in DOM now, so ref should be available
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Only transfer to offscreen canvas once
      if (canvasRef.current && !offscreenCanvasRef.current) {
        canvasRef.current.width = 320;
        canvasRef.current.height = 240;
        offscreenCanvasRef.current = canvasRef.current.transferControlToOffscreen();
      }

      setIsActive(true);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Camera access denied');
    }
  }, []);

  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsActive(false);
  }, []);

  const getOffscreenCanvas = useCallback(() => offscreenCanvasRef.current, []);

  useEffect(() => {
    return () => { stop(); };
  }, [stop]);

  return { videoRef, canvasRef, isActive, error, start, stop, getOffscreenCanvas };
}
