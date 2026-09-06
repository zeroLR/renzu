import { describe, expect, it } from 'vitest';
import { createMatchState } from '../src/game/match/match-state';
import { createAbilityStates } from '../src/heroes/economies/ability-state';
import { setAbilityCharge } from '../src/heroes/economies/ability-economy';
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

  it('rejects blocked placement even when session resolver is called directly', () => {
    const state = createState();
    state.boardEffects = [createBoardEffect('flame', { row: 4, col: 4 }, 2, { kind: 'opponent-turns', remaining: 1 })];

    const result = resolveSessionAction(state, { kind: 'place', actor: 1, at: { row: 4, col: 4 } }, 'vanguard');

    expect(result).toMatchObject({ ok: false, error: 'blocked-target' });
    expect(state.match.board[4][4]).toBe(0);
  });

  it('does not expose Architect abilities when the live board has no legal formation opportunity', () => {
    const actions = listLegalActions(createState(), 'architect', 1);
    const abilityIds = actions
      .filter((action) => action.kind === 'ability')
      .map((action) => action.kind === 'ability' ? action.abilityId : null);

    expect(abilityIds).not.toContain('rally');
    expect(abilityIds).not.toContain('lattice');
  });

  it('exposes precommit placement as follow-up after Swordmaster Step', () => {
    let state = createState();
    state = { ...state, abilities: setAbilityCharge(state.abilities, 1, 'step', 1) };
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

  it('resolves a precommit placement follow-up, consumes Step charge, and hands off the turn', () => {
    let state = createState();
    state = { ...state, abilities: setAbilityCharge(state.abilities, 1, 'step', 1) };
    const armed = resolveAbilityAction(state, {
      heroId: 'swordmaster',
      abilityId: 'step',
      actor: 1,
      target: { row: 0, col: 0 },
    });
    expect(armed.ok).toBe(true);
    if (!armed.ok) return;
    expect(armed.state.abilities[1].charges.step).toBe(1);

    const action = listLegalActions(armed.state, 'swordmaster', 1)[0];
    const result = resolveSessionAction(armed.state, action, 'swordmaster');

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.match.board[0][0]).toBe(1);
    expect(result.state.abilities[1].charges.step).toBe(0);
    expect(result.state.match.actionHistory.at(-1)).toMatchObject({ kind: 'ability', abilityId: 'step', at: { row: 0, col: 0 } });
    expect(result.state.match.phase).toBe('opponent');
    expect(result.state.timing?.pendingFollowUp).toBeNull();
  });
});
