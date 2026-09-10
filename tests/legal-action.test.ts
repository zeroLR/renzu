import { describe, expect, it } from 'vitest';
import { createMatchState } from '../src/game/match/match-state';
import { createAbilityStates } from '../src/heroes/economies/ability-state';
import { setAbilityResource } from '../src/heroes/economies/ability-economy';
import { createBoardEffect } from '../src/game/combat/board-effects';
import type { AbilityActionState } from '../src/game/action/ability-action';
import { listLegalActions, listLegalPlaceActions } from '../src/game/action/legal-action';
import { listLegalPlacementSupportTargets } from '../src/game/action/placement-support';
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

  it('keeps Guard off the standalone turn-action surface while exposing support targets', () => {
    const state = createState();
    state.match.board[4][4] = 1;
    const actions = listLegalActions(state, 'vanguard', 1);
    expect(actions.some((action) => action.kind === 'ability' && action.abilityId === 'guard')).toBe(false);
    expect(listLegalPlacementSupportTargets(state, 'vanguard', 1, 'guard')).toEqual([{ row: 4, col: 4 }]);
  });

  it('exposes source-target Vanguard actions through the shared legal surface', () => {
    const state = createState();
    state.match.board[4][4] = 1;
    const actions = listLegalActions(state, 'vanguard', 1);
    expect(actions.some((action) => action.kind === 'ability' && action.abilityId === 'charge' && action.source?.row === 4 && action.source.col === 4)).toBe(true);
  });

  it('exposes funded Arcanist direct-target abilities without a follow-up phase', () => {
    const state = createState();
    state.abilities = setAbilityResource(state.abilities, 1, 'mana', 3);
    const actions = listLegalActions(state, 'arcanist', 1);
    expect(actions.some((action) => action.kind === 'ability' && action.abilityId === 'phase')).toBe(true);
    expect(actions.every((action) => action.kind === 'place' || action.kind === 'ability')).toBe(true);
  });

  it('exposes Shade Corrupt only when pressure and board support make it legal', () => {
    const state = createState();
    state.match.board[4][4] = 1;
    state.match.board[4][5] = 2;
    expect(listLegalActions(state, 'shade', 1).some((action) => action.kind === 'ability' && action.abilityId === 'corrupt')).toBe(false);
    state.abilities = setAbilityResource(state.abilities, 1, 'pressure', 3);
    expect(listLegalActions(state, 'shade', 1).some((action) => action.kind === 'ability' && action.abilityId === 'corrupt')).toBe(true);
  });
});
