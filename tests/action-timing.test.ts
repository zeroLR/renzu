import { describe, expect, it } from 'vitest';
import {
  abilityConsumesTurn,
  beginAbilityTiming,
  canResolveFollowUp,
  clearFollowUp,
  createActionTimingState,
} from '../src/game/action/action-timing';

describe('advanced action timing', () => {
  it('models precommit follow-up without consuming the turn immediately', () => {
    const state = beginAbilityTiming(createActionTimingState(), 1, 'step', 'precommit-follow-up');

    expect(state.pendingFollowUp).toEqual({ actor: 1, abilityId: 'step', kind: 'precommit' });
    expect(abilityConsumesTurn('precommit-follow-up')).toBe(false);
    expect(canResolveFollowUp(state, 1)).toBe(true);
  });

  it('models triggered follow-up as a turn-consuming resolution', () => {
    const state = beginAbilityTiming(createActionTimingState(), 1, 'sever', 'triggered-follow-up');

    expect(state.pendingFollowUp?.kind).toBe('triggered');
    expect(abilityConsumesTurn('triggered-follow-up')).toBe(true);
  });

  it('keeps free actions non-consuming and clears follow-ups explicitly', () => {
    const pending = beginAbilityTiming(createActionTimingState(), 2, 'step', 'precommit-follow-up');

    expect(abilityConsumesTurn('free')).toBe(false);
    expect(clearFollowUp(pending)).toEqual(createActionTimingState());
  });
});
