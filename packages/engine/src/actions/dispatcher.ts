import type { GestureType, ActionType, ModeType, GestureMapping } from '../types.js';
import { PRESETS } from './presets.js';

export class ActionDispatcher {
  private mode: ModeType;
  private overrides: Partial<GestureMapping> = {};

  constructor(mode: ModeType) {
    this.mode = mode;
  }

  dispatch(gesture: GestureType): ActionType {
    if (this.overrides[gesture] !== undefined) {
      return this.overrides[gesture];
    }
    return PRESETS[this.mode][gesture] ?? 'none';
  }

  setMode(mode: ModeType): void {
    this.mode = mode;
    this.overrides = {};
  }

  getMode(): ModeType {
    return this.mode;
  }

  setOverride(gesture: GestureType, action: ActionType): void {
    this.overrides[gesture] = action;
  }

  clearOverrides(): void {
    this.overrides = {};
  }

  getCurrentMapping(): GestureMapping {
    return { ...PRESETS[this.mode], ...this.overrides } as GestureMapping;
  }
}
