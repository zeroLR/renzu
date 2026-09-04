import { describe, expect, it } from 'vitest';
import { createMatchState } from '../src/game/match/match-state';
import { createAbilityStates } from '../src/heroes/economies/ability-state';
import { setAbilityCondition } from '../src/heroes/economies/ability-economy';
import { createBoardEffect } from '../src/game/combat/board-effects';
import { resolveAbilityAction, type AbilityActionState } from '../src/game/action/ability-action';
import { listLegalActions, listLegalPlaceActions } from '../src/game/action/legal-action';
import { resolveSessionAction } from '../src/game/action/action-session';

function createState(): AbilityActionState {
  return { match: createMatchState(), abilities: createAbilityStates(), boardEffects: [] };
}

describe('legal action model', () => {
  it('excludes blocked cells from legal placement actions', () => {
    const state = createState();
    const effects = [createBoardEffect('seal', { row: 4, col: 4 }, 2, { kind: 'opponent-turns', remaining: 1 })];

    const actions = listLegalPlaceActions(state.match, 1, effects);

    expect(actions).not.toContainEqual({ kind: 'place', actor: 1, at: { row: 4, col: 4 } });
    expect(actions).toHaveLength(80);
  });

  it('exposes precommit placement as follow-up after Swordmaster Step', () => {
    let state = createState();
    state = { ...state, abilities: setAbilityCondition(state.abilities, 1, 'momentum-present', true) };
    const armed = resolveAbilityAction(state, {
      heroId: 'swordmaster',
      abilityId: 'step',
      actor: 1,
      target: { row: 0, col: 0 },
    });
    expect(armed.ok).toBe(true);
    if (!armed.ok) return;

    const actions = listLegalActions(armed.state, 'swordmaster', 1);

    expect(actions).toHaveLength(81);
    expect(actions.every((action) => action.kind === 'follow-up')).toBe(true);
    expect(actions[0]).toMatchObject({ kind: 'follow-up', actor: 1, sourceAbilityId: 'step' });
  });

  it('resolves a precommit placement follow-up, clears timing, and hands off the turn', () => {
    let state = createState();
    state = { ...state, abilities: setAbilityCondition(state.abilities, 1, 'momentum-present', true) };
    const armed = resolveAbilityAction(state, {
      heroId: 'swordmaster',
      abilityId: 'step',
      actor: 1,
      target: { row: 0, col: 0 },
    });
    expect(armed.ok).toBe(true);
    if (!armed.ok) return;

    const action = listLegalActions(armed.state, 'swordmaster', 1)[0];
    const result = resolveSessionAction(armed.state, action);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.match.board[0][0]).toBe(1);
    expect(result.state.match.phase).toBe('opponent');
    expect(result.state.timing?.pendingFollowUp).toBeNull();
  });
});
