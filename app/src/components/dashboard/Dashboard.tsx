import { useState, useEffect } from 'react';
import type { TrackingStatus, GestureEvent } from '@experiment-ai/engine';
import { ConfidenceMeter } from './ConfidenceMeter';
import { SessionStats } from './SessionStats';

interface DashboardProps {
  trackingStatus: TrackingStatus | null;
  lastGesture: GestureEvent | null;
}

const BLENDSHAPE_KEYS = [
  'eyeBlinkLeft', 'eyeBlinkRight', 'jawOpen',
  'eyeLookUpLeft', 'eyeLookDownLeft', 'eyeLookInLeft', 'eyeLookOutLeft',
  'mouthSmileLeft', 'mouthSmileRight', 'browDownLeft', 'browDownRight',
];

export function Dashboard({ trackingStatus, lastGesture }: DashboardProps) {
  const [gestureCount, setGestureCount] = useState(0);
  const [clickCount, setClickCount] = useState(0);
  const [scrollDistance, setScrollDistance] = useState(0);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    if (!lastGesture) return;
    setGestureCount((c) => c + 1);
    if (lastGesture.action === 'click' || lastGesture.action === 'right-click') {
      setClickCount((c) => c + 1);
    }
    if (lastGesture.action === 'scroll-up' || lastGesture.action === 'scroll-down') {
      setScrollDistance((d) => d + 1);
    }
  }, [lastGesture]);

  const rawData = lastGesture?.rawData ?? {};

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-zinc-100 mb-1">Dashboard</h2>
        <p className="text-sm text-zinc-500">Real-time gesture detection metrics</p>
      </div>

      {/* Top stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-xs text-zinc-500 mb-1">FPS</p>
          <p className="font-mono text-3xl text-zinc-200">{trackingStatus?.fps ?? 0}</p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-xs text-zinc-500 mb-1">Confidence</p>
          <p className="font-mono text-3xl text-zinc-200">
            {((trackingStatus?.confidence ?? 0) * 100).toFixed(0)}%
          </p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-xs text-zinc-500 mb-1">Lighting</p>
          <p className={`font-mono text-3xl capitalize ${
            trackingStatus?.lightingQuality === 'good' ? 'text-green-400' :
            trackingStatus?.lightingQuality === 'fair' ? 'text-amber-400' : 'text-red-400'
          }`}>
            {trackingStatus?.lightingQuality ?? '—'}
          </p>
        </div>
      </div>

      {/* Blendshape monitor */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
        <h3 className="text-sm font-medium text-zinc-300 mb-4">Blendshape Monitor</h3>
        <div className="space-y-2">
          {BLENDSHAPE_KEYS.map((key) => (
            <ConfidenceMeter key={key} label={key} score={rawData[key] ?? 0} />
          ))}
        </div>
      </div>

      {/* Session stats */}
      <SessionStats
        gestureCount={gestureCount}
        clickCount={clickCount}
        scrollDistance={scrollDistance}
        startTime={startTime}
      />
    </div>
  );
}
