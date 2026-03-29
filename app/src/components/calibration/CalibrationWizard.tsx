import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GestureEvent, TrackingStatus, CalibrationStep, CalibrationPoint } from '@experiment-ai/engine';
import { CalibrationDot } from './CalibrationDot';
import { GesturePractice } from './GesturePractice';

// ── Types ────────────────────────────────────────────────────────────────────

interface CalibrationWizardProps {
  onComplete: () => void;
  trackingStatus: TrackingStatus | null;
  calibrationStep: CalibrationStep | null;
  lastGesture: GestureEvent | null;
  startCalibration: (screenWidth: number, screenHeight: number) => void;
  recordCalibrationPoint: (position: CalibrationPoint['position']) => void;
  finishCalibration: () => void;
}

// ── Constants ────────────────────────────────────────────────────────────────

const TOTAL_STEPS = 4;

const STEP_LABELS = ['Setup Check', 'Range Mapping', 'Gesture Practice', 'Complete'];

const DOT_POSITIONS: CalibrationPoint['position'][] = [
  'center', 'top', 'bottom', 'left', 'right',
];

// ── Slide variants ────────────────────────────────────────────────────────────

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

const slideTransition = { type: 'spring', stiffness: 300, damping: 28 };

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span
      className={`inline-block w-2.5 h-2.5 rounded-full ${ok ? 'bg-green-500' : 'bg-red-500'}`}
    />
  );
}

// ── Step 1: Setup Check ───────────────────────────────────────────────────────

interface SetupCheckProps {
  trackingStatus: TrackingStatus | null;
  onContinue: () => void;
}

function SetupCheck({ trackingStatus, onContinue }: SetupCheckProps) {
  const faceDetected = trackingStatus?.faceDetected ?? false;
  const lighting = trackingStatus?.lightingQuality ?? 'poor';
  const lightingOk = lighting === 'good' || lighting === 'fair';

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-lg font-semibold text-zinc-100 mb-1">Setup Check</h3>
        <p className="text-sm text-zinc-400">
          Make sure your camera is active and your face is clearly visible before continuing.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 divide-y divide-zinc-800">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm text-zinc-300">Camera preview</span>
          <StatusDot ok={trackingStatus !== null} />
        </div>
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm text-zinc-300">Face detected</span>
          <StatusDot ok={faceDetected} />
        </div>
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm text-zinc-300">Lighting quality</span>
          <div className="flex items-center gap-2">
            <StatusDot ok={lightingOk} />
            <span className={`text-xs capitalize font-mono ${
              lighting === 'good' ? 'text-green-400' :
              lighting === 'fair' ? 'text-amber-400' : 'text-red-400'
            }`}>
              {trackingStatus ? lighting : '—'}
            </span>
          </div>
        </div>
      </div>

      {!trackingStatus && (
        <p className="text-xs text-amber-400">
          Start the camera from the Home screen first, then return here.
        </p>
      )}

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={onContinue}
        disabled={!faceDetected}
        className="w-full py-2.5 rounded-lg bg-blue-500 text-white text-sm font-medium
                   hover:bg-blue-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Continue
      </motion.button>
    </div>
  );
}

// ── Step 2: Range Mapping ─────────────────────────────────────────────────────

interface RangeMappingProps {
  calibrationStep: CalibrationStep | null;
  recordedPositions: Set<CalibrationPoint['position']>;
  onStart: () => void;
  onRecord: () => void;
}

function RangeMapping({ calibrationStep, recordedPositions, onStart, onRecord }: RangeMappingProps) {
  const started = calibrationStep !== null;
  const currentPos = calibrationStep?.position ?? 'center';

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-lg font-semibold text-zinc-100 mb-1">Range Mapping</h3>
        <p className="text-sm text-zinc-400">
          {started
            ? calibrationStep!.instruction
            : "Look at each dot as it appears. We'll map your comfortable head range."}
        </p>
      </div>

      {/* Dot arena */}
      <div className="relative w-full aspect-video rounded-xl border border-zinc-700 bg-zinc-900 overflow-hidden">
        {started ? (
          <CalibrationDot
            position={currentPos}
            isRecorded={recordedPositions.has(currentPos)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-xs text-zinc-500">Dots will appear here</p>
          </div>
        )}

        {/* Step counter */}
        {started && (
          <div className="absolute bottom-3 right-3 text-xs text-zinc-500 font-mono">
            {calibrationStep!.currentStep} / {calibrationStep!.totalSteps}
          </div>
        )}
      </div>

      {/* Recorded positions summary */}
      <div className="flex gap-2 flex-wrap">
        {DOT_POSITIONS.map((pos) => (
          <span
            key={pos}
            className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize border transition-colors ${
              recordedPositions.has(pos)
                ? 'bg-green-500/15 border-green-500/40 text-green-300'
                : 'bg-zinc-800 border-zinc-700 text-zinc-500'
            }`}
          >
            {pos}
          </span>
        ))}
      </div>

      {!started ? (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={onStart}
          className="w-full py-2.5 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-400 transition-colors"
        >
          Start Mapping
        </motion.button>
      ) : (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={onRecord}
          disabled={recordedPositions.has(currentPos)}
          className="w-full py-2.5 rounded-lg bg-blue-500 text-white text-sm font-medium
                     hover:bg-blue-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {recordedPositions.has(currentPos) ? 'Recorded ✓' : `I'm looking at the dot`}
        </motion.button>
      )}
    </div>
  );
}

// ── Step 4: Complete ──────────────────────────────────────────────────────────

function CompleteStep({ onComplete }: { onComplete: () => void }) {
  return (
    <div className="flex flex-col items-center gap-6 py-4 text-center">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="w-20 h-20 rounded-full bg-green-500/15 border border-green-500/40 flex items-center justify-center"
      >
        <span className="text-4xl">✓</span>
      </motion.div>

      <div>
        <h3 className="text-lg font-semibold text-zinc-100 mb-1">Calibration Complete</h3>
        <p className="text-sm text-zinc-400 max-w-xs mx-auto">
          Your head range and gestures have been mapped. The engine will adapt as you use it.
        </p>
      </div>

      <div className="w-full rounded-xl border border-zinc-800 bg-zinc-900 divide-y divide-zinc-800">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm text-zinc-300">Range points recorded</span>
          <span className="text-sm font-mono text-green-400">5 / 5</span>
        </div>
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm text-zinc-300">Gestures practiced</span>
          <span className="text-sm font-mono text-green-400">6 / 6</span>
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={onComplete}
        className="w-full max-w-xs py-2.5 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-400 transition-colors"
      >
        Start Using
      </motion.button>
    </div>
  );
}

// ── Wizard ────────────────────────────────────────────────────────────────────

export function CalibrationWizard({
  onComplete,
  trackingStatus,
  calibrationStep,
  lastGesture,
  startCalibration,
  recordCalibrationPoint,
  finishCalibration,
}: CalibrationWizardProps) {
  const [step, setStep] = useState(0); // 0-indexed
  const [direction, setDirection] = useState(1);
  const [recordedPositions, setRecordedPositions] = useState<Set<CalibrationPoint['position']>>(
    new Set()
  );

  // Track recorded calibration points from engine step changes
  useEffect(() => {
    if (!calibrationStep) return;
    // When the step advances, the previous position was accepted — mark it recorded
    setRecordedPositions((prev) => {
      const next = new Set(prev);
      // Mark all positions up to but not including the current step as recorded
      const prevPositionIndex = calibrationStep.currentStep - 2;
      if (prevPositionIndex >= 0 && prevPositionIndex < DOT_POSITIONS.length) {
        next.add(DOT_POSITIONS[prevPositionIndex]);
      }
      return next;
    });
  }, [calibrationStep]);

  // Auto-advance from Range Mapping once all 5 points are recorded
  useEffect(() => {
    if (step === 1 && recordedPositions.size === DOT_POSITIONS.length) {
      finishCalibration();
      goTo(2);
    }
  }, [recordedPositions, step]); // eslint-disable-line react-hooks/exhaustive-deps

  const goTo = (next: number) => {
    setDirection(next > step ? 1 : -1);
    setStep(next);
  };

  const handleBack = () => {
    if (step > 0) goTo(step - 1);
  };

  const handleSkip = () => {
    if (step < TOTAL_STEPS - 1) goTo(step + 1);
  };

  const handleStartMapping = () => {
    startCalibration(window.screen.width, window.screen.height);
  };

  const handleRecordPoint = () => {
    if (!calibrationStep) return;
    const pos = calibrationStep.position;
    recordCalibrationPoint(pos);
    setRecordedPositions((prev) => new Set(prev).add(pos));
  };

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col gap-6">
      {/* Progress bar */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-zinc-500 font-medium">
            Step {step + 1} of {TOTAL_STEPS}
          </span>
          <span className="text-xs text-zinc-500">{STEP_LABELS[step]}</span>
        </div>
        <div className="h-1 w-full rounded-full bg-zinc-800 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-blue-500"
            animate={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
            transition={{ type: 'spring', stiffness: 200, damping: 24 }}
          />
        </div>
        {/* Step dots */}
        <div className="flex justify-between mt-2">
          {STEP_LABELS.map((label, i) => (
            <div key={label} className="flex flex-col items-center gap-1" style={{ width: '25%' }}>
              <div
                className={`w-2 h-2 rounded-full transition-colors ${
                  i < step ? 'bg-blue-500' : i === step ? 'bg-blue-400' : 'bg-zinc-700'
                }`}
              />
              <span className="text-[10px] text-zinc-600 text-center leading-tight">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 p-6 min-h-[340px]">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={slideTransition}
          >
            {step === 0 && (
              <SetupCheck
                trackingStatus={trackingStatus}
                onContinue={() => goTo(1)}
              />
            )}
            {step === 1 && (
              <RangeMapping
                calibrationStep={calibrationStep}
                recordedPositions={recordedPositions}
                onStart={handleStartMapping}
                onRecord={handleRecordPoint}
              />
            )}
            {step === 2 && (
              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-zinc-100 mb-1">Gesture Practice</h3>
                  <p className="text-sm text-zinc-400">
                    Practice each gesture so the engine learns your style.
                  </p>
                </div>
                <GesturePractice
                  onComplete={() => goTo(3)}
                  lastGesture={lastGesture}
                />
              </div>
            )}
            {step === 3 && (
              <CompleteStep onComplete={onComplete} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      {step < TOTAL_STEPS - 1 && (
        <div className="flex justify-between">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleBack}
            disabled={step === 0}
            className="px-4 py-2 rounded-lg text-sm text-zinc-400 hover:text-zinc-200
                       hover:bg-zinc-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Back
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleSkip}
            className="px-4 py-2 rounded-lg text-sm text-zinc-500 hover:text-zinc-300
                       hover:bg-zinc-800 transition-colors"
          >
            Skip
          </motion.button>
        </div>
      )}
    </div>
  );
}
