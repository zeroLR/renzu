import { describe, expect, it } from 'vitest';
import { resolveAbilityAction, type AbilityActionState } from '../src/game/action/ability-action';
import { createBoardEffect } from '../src/game/combat/board-effects';
import { createMatchState } from '../src/game/match/match-state';
import { createAbilityStates } from '../src/heroes/economies/ability-state';

function createState(): AbilityActionState {
  return { match: createMatchState(), abilities: createAbilityStates(), boardEffects: [] };
}

describe('advanced abilities', () => {
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
});
