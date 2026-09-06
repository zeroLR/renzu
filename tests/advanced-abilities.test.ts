import { describe, expect, it } from 'vitest';
import { resolveAbilityAction, type AbilityActionState } from '../src/game/action/ability-action';
import { listLegalAbilityActions } from '../src/game/action/legal-action';
import { createBoardEffect } from '../src/game/combat/board-effects';
import { createMatchState } from '../src/game/match/match-state';
import { createAbilityStates } from '../src/heroes/economies/ability-state';

function createState(): AbilityActionState {
  return { match: createMatchState(), abilities: createAbilityStates(), boardEffects: [] };
}

describe('R2.1 advanced abilities', () => {
  it('Bulwark guards its anchor and adjacent friendly group', () => {
    const state = createState();
    state.match.board[4][4] = 1;
    state.match.board[3][3] = 1;
    state.match.board[4][5] = 1;

    const result = resolveAbilityAction(state, {
      heroId: 'vanguard', abilityId: 'bulwark', actor: 1, target: { row: 4, col: 4 },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const guarded = result.state.boardEffects.filter((effect) => effect.kind === 'guard');
    expect(guarded).toHaveLength(3);
    expect(guarded.map((effect) => effect.at)).toEqual(expect.arrayContaining([
      { row: 4, col: 4 },
      { row: 3, col: 3 },
      { row: 4, col: 5 },
    ]));
  });

  it('Rally derives readiness from the live board and moves into two-stone support', () => {
    const state = createState();
    state.match.board[0][0] = 1;
    state.match.board[3][3] = 1;
    state.match.board[3][5] = 1;

    const result = resolveAbilityAction(state, {
      heroId: 'architect', abilityId: 'rally', actor: 1,
      source: { row: 0, col: 0 }, target: { row: 4, col: 4 },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.match.board[0][0]).toBe(0);
    expect(result.state.match.board[4][4]).toBe(1);
    expect(result.state.abilities[1].conditions['rally-ready']).toBe(true);
  });

  it('Lattice derives readiness from a supported anchor and seals eligible cardinal cells', () => {
    const state = createState();
    state.match.board[4][4] = 1;
    state.match.board[3][3] = 1;
    state.match.board[5][5] = 1;

    const result = resolveAbilityAction(state, {
      heroId: 'architect', abilityId: 'lattice', actor: 1, target: { row: 4, col: 4 },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const seals = result.state.boardEffects.filter((effect) => effect.kind === 'seal');
    expect(seals).toHaveLength(4);
    expect(seals.map((effect) => effect.at)).toEqual(expect.arrayContaining([
      { row: 3, col: 4 }, { row: 5, col: 4 }, { row: 4, col: 3 }, { row: 4, col: 5 },
    ]));
    expect(result.state.abilities[1].conditions['lattice-ready']).toBe(true);
  });

  it('rejects Charge from a guarded source', () => {
    const state = createState();
    state.match.board[4][4] = 1;
    state.boardEffects = [createBoardEffect('guard', { row: 4, col: 4 }, 1, { kind: 'owner-turns', remaining: 2 })];

    const result = resolveAbilityAction(state, {
      heroId: 'vanguard', abilityId: 'charge', actor: 1,
      source: { row: 4, col: 4 }, target: { row: 4, col: 5 },
    });

    expect(result).toMatchObject({ ok: false, error: 'invalid-target' });
  });

  it('exposes Rally and Lattice through the shared legal-action surface when formations exist', () => {
    const state = createState();
    state.match.board[0][0] = 1;
    state.match.board[3][3] = 1;
    state.match.board[3][5] = 1;
    state.match.board[2][2] = 1;
    state.match.board[2][3] = 1;

    const ids = new Set(listLegalAbilityActions(state, 'architect', 1).map((action) => action.abilityId));
    expect(ids.has('rally')).toBe(true);
    expect(ids.has('lattice')).toBe(true);
  });
});
