import { useState, useCallback } from 'react';
import { useCamera } from './hooks/useCamera';
import { useGestureEngine } from './hooks/useGestureEngine';
import { StatusBar } from './components/layout/StatusBar';
import { GestureToast } from './components/layout/GestureToast';
import { CameraFeed } from './components/camera/CameraFeed';

type Screen = 'home' | 'calibration' | 'dashboard' | 'settings';

const NAV_ITEMS: { key: Screen; label: string; icon: string }[] = [
  { key: 'home', label: 'Home', icon: '◉' },
  { key: 'calibration', label: 'Calibration', icon: '◎' },
  { key: 'dashboard', label: 'Dashboard', icon: '▦' },
  { key: 'settings', label: 'Settings', icon: '⚙' },
];

export function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [isEnabled, setIsEnabled] = useState(true);
  const [mode] = useState<'browsing' | 'reading' | 'presentation'>('browsing');

  const camera = useCamera();
  const engine = useGestureEngine();

  const handleStartCamera = useCallback(async () => {
    await camera.start();
    const canvas = camera.getOffscreenCanvas();
    if (canvas) {
      engine.start(canvas);
    }
  }, [camera, engine]);

  const handleToggle = useCallback(() => {
    if (isEnabled) {
      engine.stop();
      camera.stop();
    }
    setIsEnabled(!isEnabled);
  }, [isEnabled, engine, camera]);

  return (
    <div className="flex h-screen bg-zinc-950">
      {/* Sidebar */}
      <nav className="w-56 border-r border-zinc-800 flex flex-col">
        <div className="p-4 pb-6">
          <h1 className="text-base font-semibold text-zinc-100 tracking-tight">
            Experiment AI
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">Face Gesture Control</p>
        </div>

        <div className="flex-1 px-2 flex flex-col gap-0.5">
          {NAV_ITEMS.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setScreen(key)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                screen === key
                  ? 'bg-zinc-800 text-zinc-50'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <span className="text-xs opacity-60">{icon}</span>
              {label}
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-zinc-800">
          <p className="text-xs text-zinc-600">v0.1.0 · Phase 1</p>
        </div>
      </nav>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Status bar */}
        <StatusBar
          trackingStatus={engine.trackingStatus}
          mode={mode}
          isEnabled={isEnabled}
          onToggle={handleToggle}
        />

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto">
          {screen === 'home' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-zinc-100 mb-1">Live View</h2>
                <p className="text-sm text-zinc-500">
                  {engine.isReady
                    ? 'Face tracking active — try blinking or moving your head'
                    : 'Start the camera to begin face gesture tracking'}
                </p>
              </div>

              <CameraFeed
                videoRef={camera.videoRef}
                canvasRef={camera.canvasRef}
                isActive={camera.isActive}
                onStart={handleStartCamera}
                error={camera.error}
              />

              {engine.isReady && engine.trackingStatus && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
                    <p className="text-xs text-zinc-500 mb-1">Confidence</p>
                    <p className="font-mono text-lg text-zinc-200">
                      {((engine.trackingStatus.confidence ?? 0) * 100).toFixed(0)}%
                    </p>
                  </div>
                  <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
                    <p className="text-xs text-zinc-500 mb-1">FPS</p>
                    <p className="font-mono text-lg text-zinc-200">
                      {engine.trackingStatus.fps}
                    </p>
                  </div>
                  <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
                    <p className="text-xs text-zinc-500 mb-1">Lighting</p>
                    <p className={`font-mono text-lg capitalize ${
                      engine.trackingStatus.lightingQuality === 'good' ? 'text-green-400' :
                      engine.trackingStatus.lightingQuality === 'fair' ? 'text-amber-400' : 'text-red-400'
                    }`}>
                      {engine.trackingStatus.lightingQuality}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {screen !== 'home' && (
            <div className="flex items-center justify-center h-full">
              <p className="text-zinc-500 text-sm capitalize">{screen} — coming soon</p>
            </div>
          )}
        </main>
      </div>

      {/* Gesture toasts */}
      <GestureToast lastGesture={engine.lastGesture} />
    </div>
  );
}
