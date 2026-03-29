import { describe, it, expect, beforeEach } from 'vitest';
import { ActionDispatcher } from '../../src/actions/dispatcher.js';

describe('ActionDispatcher', () => {
  let dispatcher: ActionDispatcher;

  beforeEach(() => {
    dispatcher = new ActionDispatcher('browsing');
  });

  it('maps blink to click in browsing mode', () => {
    expect(dispatcher.dispatch('blink')).toBe('click');
  });

  it('maps nod-down to scroll-down in browsing mode', () => {
    expect(dispatcher.dispatch('nod-down')).toBe('scroll-down');
  });

  it('switches mode and changes mappings', () => {
    dispatcher.setMode('reading');
    expect(dispatcher.dispatch('blink')).toBe('none');
    expect(dispatcher.dispatch('nod-down')).toBe('scroll-down');
  });

  it('applies custom overrides on top of preset', () => {
    dispatcher.setOverride('blink', 'zoom-in');
    expect(dispatcher.dispatch('blink')).toBe('zoom-in');
    expect(dispatcher.dispatch('nod-down')).toBe('scroll-down');
  });

  it('clears overrides when mode changes', () => {
    dispatcher.setOverride('blink', 'zoom-in');
    dispatcher.setMode('reading');
    expect(dispatcher.dispatch('blink')).toBe('none');
  });

  it('returns none for unmapped gestures', () => {
    expect(dispatcher.dispatch('turn-left')).toBe('none');
  });
});
