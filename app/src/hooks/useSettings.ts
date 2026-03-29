import { useState, useCallback, useEffect } from 'react';
import type { ModeType, GestureType, ActionType, GestureMapping } from '@experiment-ai/engine';
import { PRESETS } from '@experiment-ai/engine';

interface Settings {
  mode: ModeType;
  overrides: Partial<Record<ModeType, Partial<GestureMapping>>>;
  sensitivity: Partial<Record<GestureType, number>>;
  blinkThresholdMs: number;
}

const STORAGE_KEY = 'experiment-ai-settings';

const DEFAULT_SETTINGS: Settings = {
  mode: 'browsing',
  overrides: {},
  sensitivity: {},
  blinkThresholdMs: 400,
};

function loadSettings(): Settings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
  } catch {}
  return DEFAULT_SETTINGS;
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(loadSettings);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const setMode = useCallback((mode: ModeType) => {
    setSettings((s) => ({ ...s, mode }));
  }, []);

  const setOverride = useCallback((gesture: GestureType, action: ActionType) => {
    setSettings((s) => ({
      ...s,
      overrides: {
        ...s.overrides,
        [s.mode]: { ...s.overrides[s.mode], [gesture]: action },
      },
    }));
  }, []);

  const setSensitivity = useCallback((gesture: GestureType, level: number) => {
    setSettings((s) => ({
      ...s,
      sensitivity: { ...s.sensitivity, [gesture]: level },
    }));
  }, []);

  const setBlinkThreshold = useCallback((ms: number) => {
    setSettings((s) => ({ ...s, blinkThresholdMs: ms }));
  }, []);

  const resetToDefaults = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, []);

  const getCurrentMapping = useCallback((): GestureMapping => {
    const base = PRESETS[settings.mode];
    const modeOverrides = settings.overrides[settings.mode] ?? {};
    return { ...base, ...modeOverrides } as GestureMapping;
  }, [settings]);

  return {
    settings,
    setMode,
    setOverride,
    setSensitivity,
    setBlinkThreshold,
    resetToDefaults,
    getCurrentMapping,
  };
}
