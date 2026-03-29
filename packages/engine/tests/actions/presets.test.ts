import { describe, it, expect } from 'vitest';
import { PRESETS } from '../../src/actions/presets.js';

describe('Presets', () => {
  it('defines browsing mode with all gestures mapped', () => {
    expect(PRESETS.browsing).toBeDefined();
    expect(PRESETS.browsing['blink']).toBe('click');
    expect(PRESETS.browsing['double-blink']).toBe('right-click');
    expect(PRESETS.browsing['nod-up']).toBe('scroll-up');
    expect(PRESETS.browsing['nod-down']).toBe('scroll-down');
    expect(PRESETS.browsing['tilt-left']).toBe('back');
    expect(PRESETS.browsing['tilt-right']).toBe('forward');
    expect(PRESETS.browsing['mouth-open']).toBe('click');
  });

  it('defines reading mode', () => {
    expect(PRESETS.reading).toBeDefined();
    expect(PRESETS.reading['blink']).toBe('none');
    expect(PRESETS.reading['nod-up']).toBe('scroll-up');
    expect(PRESETS.reading['nod-down']).toBe('scroll-down');
  });

  it('defines presentation mode', () => {
    expect(PRESETS.presentation).toBeDefined();
    expect(PRESETS.presentation['blink']).toBe('forward');
    expect(PRESETS.presentation['double-blink']).toBe('back');
  });
});
