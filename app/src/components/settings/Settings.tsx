import type { GestureType, ModeType } from '@experiment-ai/engine';
import { GestureMapper } from './GestureMapper';

interface SettingsProps {
  mode: ModeType;
  mapping: Record<string, string>;
  sensitivity: Partial<Record<GestureType, number>>;
  blinkThresholdMs: number;
  onModeChange: (mode: ModeType) => void;
  onActionChange: (gesture: GestureType, action: any) => void;
  onSensitivityChange: (gesture: GestureType, level: number) => void;
  onBlinkThresholdChange: (ms: number) => void;
  onReset: () => void;
}

const MODES: ModeType[] = ['browsing', 'reading', 'presentation'];
const GESTURES: GestureType[] = [
  'blink', 'double-blink', 'nod-up', 'nod-down',
  'tilt-left', 'tilt-right', 'mouth-open', 'mouth-close',
];

export function Settings({
  mode, mapping, sensitivity, blinkThresholdMs,
  onModeChange, onActionChange, onSensitivityChange, onBlinkThresholdChange, onReset,
}: SettingsProps) {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-zinc-100 mb-1">Settings</h2>
        <p className="text-sm text-zinc-500">Configure gesture mappings and sensitivity</p>
      </div>

      {/* Mode selector */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
        <h3 className="text-sm font-medium text-zinc-300 mb-3">Mode</h3>
        <div className="flex gap-2">
          {MODES.map((m) => (
            <button
              key={m}
              onClick={() => onModeChange(m)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                mode === m
                  ? 'bg-blue-500 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Gesture mappings */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
        <h3 className="text-sm font-medium text-zinc-300 mb-3">Gesture Mappings</h3>
        {GESTURES.map((gesture) => (
          <GestureMapper
            key={gesture}
            gesture={gesture}
            currentAction={(mapping[gesture] as any) ?? 'none'}
            sensitivity={sensitivity[gesture] ?? 0.5}
            onActionChange={(action) => onActionChange(gesture, action)}
            onSensitivityChange={(level) => onSensitivityChange(gesture, level)}
          />
        ))}
      </div>

      {/* Blink threshold */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
        <h3 className="text-sm font-medium text-zinc-300 mb-3">Blink Threshold</h3>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="200"
            max="800"
            step="50"
            value={blinkThresholdMs}
            onChange={(e) => onBlinkThresholdChange(Number(e.target.value))}
            className="flex-1 h-1.5 rounded-full appearance-none bg-zinc-700 accent-blue-500"
          />
          <span className="font-mono text-sm text-zinc-300 w-16">{blinkThresholdMs}ms</span>
        </div>
        <p className="text-xs text-zinc-500 mt-2">
          Higher = fewer false clicks, but requires longer deliberate blinks
        </p>
      </div>

      {/* Reset */}
      <button
        onClick={onReset}
        className="px-4 py-2 rounded-lg text-sm bg-zinc-800 text-zinc-400 hover:text-red-400 hover:bg-zinc-800/80 transition-colors"
      >
        Reset to Defaults
      </button>
    </div>
  );
}
