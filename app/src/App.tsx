import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCamera } from './hooks/useCamera';
import { useGestureEngine } from './hooks/useGestureEngine';
import { useSettings } from './hooks/useSettings';
import { StatusBar } from './components/layout/StatusBar';
import { GestureToast } from './components/layout/GestureToast';
import { CameraFeed } from './components/camera/CameraFeed';
import { CalibrationWizard } from './components/calibration/CalibrationWizard';
import { Dashboard } from './components/dashboard/Dashboard';
import { Settings } from './components/settings/Settings';
import { VirtualCursor } from './components/cursor/VirtualCursor';

type Screen = 'welcome' | 'home' | 'calibration' | 'dashboard' | 'settings';

const NAV_ITEMS: { key: Exclude<Screen, 'welcome'>; label: string; icon: string }[] = [
  { key: 'home', label: 'Home', icon: '◉' },
  { key: 'calibration', label: 'Calibration', icon: '◎' },
  { key: 'dashboard', label: 'Dashboard', icon: '▦' },
  { key: 'settings', label: 'Settings', icon: '⚙' },
];

// Screens that should show the persistent camera feed at the top
const CAMERA_SCREENS: Screen[] = ['home', 'calibration'];

export function App() {
  const isOnboarded = localStorage.getItem('experiment-ai-onboarded') === 'true';
  const [screen, setScreen] = useState<Screen>(isOnboarded ? 'home' : 'welcome');
  const [isEnabled, setIsEnabled] = useState(true);
  const [isDark, setIsDark] = useState(true);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [isClicking, setIsClicking] = useState(false);

  const camera = useCamera();
  const engine = useGestureEngine();
  const { settings, setMode, setOverride, setSensitivity, setBlinkThreshold, resetToDefaults, getCurrentMapping } = useSettings();

  // Sync settings to engine
  useEffect(() => {
    engine.setMode(settings.mode);
  }, [settings.mode]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    engine.setBlinkThreshold(settings.blinkThresholdMs);
  }, [settings.blinkThresholdMs]); // eslint-disable-line react-hooks/exhaustive-deps

  // Track cursor position from head pose
  useEffect(() => {
    if (engine.trackingStatus?.headPosition) {
      const { x, y } = engine.trackingStatus.headPosition;
      setCursorPos({
        x: x * window.innerWidth,
        y: y * window.innerHeight,
      });
    }
  }, [engine.trackingStatus]);

  // Execute gesture actions
  useEffect(() => {
    if (!engine.lastGesture || engine.lastGesture.action === 'none') return;
    const { action } = engine.lastGesture;
    switch (action) {
      case 'click':
      case 'right-click':
        setIsClicking(true);
        setTimeout(() => setIsClicking(false), 300);
        break;
      case 'scroll-up':
        window.scrollBy({ top: -100, behavior: 'smooth' });
        break;
      case 'scroll-down':
        window.scrollBy({ top: 100, behavior: 'smooth' });
        break;
      case 'back':
        history.back();
        break;
      case 'forward':
        history.forward();
        break;
    }
  }, [engine.lastGesture]);

  const handleStartCamera = useCallback(async () => {
    await camera.start();
    const canvas = camera.getOffscreenCanvas();
    if (canvas) engine.start(canvas);
  }, [camera, engine]);

  const handleToggle = useCallback(() => {
    if (isEnabled) {
      engine.stop();
      camera.stop();
    }
    setIsEnabled((prev) => !prev);
  }, [isEnabled, engine, camera]);

  const handleCalibrationComplete = useCallback(() => {
    localStorage.setItem('experiment-ai-onboarded', 'true');
    setScreen('home');
  }, []);

  // Dark mode toggle
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  const showCamera = CAMERA_SCREENS.includes(screen);

  // Welcome screen
  if (screen === 'welcome') {
    return (
      <div className="flex items-center justify-center h-screen bg-zinc-950">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="text-center max-w-md"
        >
          <motion.div
            className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <span className="text-4xl">👁</span>
          </motion.div>
          <h1 className="text-3xl font-bold text-zinc-100 mb-2">Experiment AI</h1>
          <p className="text-zinc-400 mb-8">
            Control your browser with face gestures. Blink to click, move your head to scroll — completely hands-free.
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setScreen('calibration')}
            className="px-6 py-3 rounded-lg bg-blue-500 text-white font-medium hover:bg-blue-400 transition-colors"
          >
            Get Started
          </motion.button>
          <button
            onClick={() => {
              localStorage.setItem('experiment-ai-onboarded', 'true');
              setScreen('home');
            }}
            className="block mx-auto mt-3 text-sm text-zinc-500 hover:text-zinc-300"
          >
            Skip setup
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-zinc-950">
      {/* Sidebar */}
      <nav className="w-56 border-r border-zinc-800 flex flex-col">
        <div className="p-4 pb-6">
          <h1 className="text-base font-semibold text-zinc-100 tracking-tight">Experiment AI</h1>
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
        <div className="p-4 border-t border-zinc-800 flex items-center justify-between">
          <p className="text-xs text-zinc-600">v0.1.0</p>
          <button
            onClick={() => setIsDark((d) => !d)}
            className="text-xs text-zinc-500 hover:text-zinc-300"
          >
            {isDark ? '☀' : '🌙'}
          </button>
        </div>
      </nav>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <StatusBar
          trackingStatus={engine.trackingStatus}
          mode={settings.mode}
          isEnabled={isEnabled}
          onToggle={handleToggle}
        />
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-3xl mx-auto space-y-6">
            {/*
              Persistent camera feed — always rendered, never unmounted.
              Visible on Home and Calibration screens.
              Uses CSS visibility to keep the stream alive when on other tabs.
            */}
            <div className={showCamera ? 'block' : 'hidden'}>
              <CameraFeed
                videoRef={camera.videoRef}
                canvasRef={camera.canvasRef}
                isActive={camera.isActive}
                onStart={handleStartCamera}
                error={camera.error}
              />

              {/* Quick stats below camera on Home */}
              {screen === 'home' && engine.isReady && engine.trackingStatus && (
                <div className="grid grid-cols-3 gap-3 mt-4">
                  {[
                    { label: 'Confidence', value: `${((engine.trackingStatus.confidence ?? 0) * 100).toFixed(0)}%` },
                    { label: 'FPS', value: String(engine.trackingStatus.fps) },
                    { label: 'Lighting', value: engine.trackingStatus.lightingQuality },
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
                      <p className="text-xs text-zinc-500 mb-1">{label}</p>
                      <p className="font-mono text-lg text-zinc-200 capitalize">{value}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Screen-specific content below the camera */}
            <AnimatePresence mode="wait">
              {screen === 'home' && (
                <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div>
                    <h2 className="text-xl font-semibold text-zinc-100 mb-1">Live View</h2>
                    <p className="text-sm text-zinc-500">
                      {engine.isReady
                        ? 'Face tracking active — try blinking or moving your head'
                        : 'Start the camera to begin face gesture tracking'}
                    </p>
                  </div>
                </motion.div>
              )}

              {screen === 'calibration' && (
                <motion.div key="calibration" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {!camera.isActive && (
                    <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 mb-4">
                      <p className="text-sm text-amber-400">
                        Start the camera above to begin calibration.
                      </p>
                    </div>
                  )}
                  <CalibrationWizard
                    onComplete={handleCalibrationComplete}
                    trackingStatus={engine.trackingStatus}
                    calibrationStep={engine.calibrationStep}
                    lastGesture={engine.lastGesture}
                    startCalibration={engine.startCalibration}
                    recordCalibrationPoint={engine.recordCalibrationPoint}
                    finishCalibration={engine.finishCalibration}
                  />
                </motion.div>
              )}

              {screen === 'dashboard' && (
                <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <Dashboard
                    trackingStatus={engine.trackingStatus}
                    lastGesture={engine.lastGesture}
                  />
                </motion.div>
              )}

              {screen === 'settings' && (
                <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <Settings
                    mode={settings.mode}
                    mapping={getCurrentMapping()}
                    sensitivity={settings.sensitivity}
                    blinkThresholdMs={settings.blinkThresholdMs}
                    onModeChange={setMode}
                    onActionChange={setOverride}
                    onSensitivityChange={setSensitivity}
                    onBlinkThresholdChange={setBlinkThreshold}
                    onReset={resetToDefaults}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Overlays */}
      <GestureToast lastGesture={engine.lastGesture} />
      <VirtualCursor
        x={cursorPos.x}
        y={cursorPos.y}
        isClicking={isClicking}
        visible={screen === 'home' && engine.isReady}
      />
    </div>
  );
}
