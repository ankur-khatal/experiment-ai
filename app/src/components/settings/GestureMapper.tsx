import type { GestureType, ActionType } from '@experiment-ai/engine';

const ACTION_OPTIONS: ActionType[] = [
  'click', 'right-click', 'scroll-up', 'scroll-down',
  'back', 'forward', 'tab-next', 'tab-prev',
  'zoom-in', 'zoom-out', 'cursor-move', 'none',
];

const GESTURE_LABELS: Record<GestureType, string> = {
  'blink': 'Deliberate Blink',
  'double-blink': 'Double Blink',
  'nod-up': 'Head Nod Up',
  'nod-down': 'Head Nod Down',
  'tilt-left': 'Head Tilt Left',
  'tilt-right': 'Head Tilt Right',
  'turn-left': 'Head Turn Left',
  'turn-right': 'Head Turn Right',
  'mouth-open': 'Mouth Open',
  'mouth-close': 'Mouth Close',
};

interface GestureMapperProps {
  gesture: GestureType;
  currentAction: ActionType;
  sensitivity: number;
  onActionChange: (action: ActionType) => void;
  onSensitivityChange: (level: number) => void;
}

export function GestureMapper({
  gesture, currentAction, sensitivity, onActionChange, onSensitivityChange,
}: GestureMapperProps) {
  return (
    <div className="flex items-center gap-4 py-2.5 border-b border-zinc-800 last:border-0">
      <span className="text-sm text-zinc-300 w-40">{GESTURE_LABELS[gesture]}</span>
      <select
        value={currentAction}
        onChange={(e) => onActionChange(e.target.value as ActionType)}
        className="flex-1 h-8 rounded-md border border-zinc-700 bg-zinc-800 px-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        {ACTION_OPTIONS.map((action) => (
          <option key={action} value={action}>{action}</option>
        ))}
      </select>
      <div className="flex items-center gap-2 w-36">
        <input
          type="range"
          min="0"
          max="100"
          value={sensitivity * 100}
          onChange={(e) => onSensitivityChange(Number(e.target.value) / 100)}
          className="flex-1 h-1.5 rounded-full appearance-none bg-zinc-700 accent-blue-500"
        />
        <span className="font-mono text-xs text-zinc-500 w-8">{(sensitivity * 100).toFixed(0)}%</span>
      </div>
    </div>
  );
}
