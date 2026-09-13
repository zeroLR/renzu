import { describe, expect, it } from 'vitest';
import { createMatchState } from '../src/game/match/match-state';
import { createAbilityStates } from '../src/heroes/economies/ability-state';
import { setAbilityResource } from '../src/heroes/economies/ability-economy';
import { resolveAbilityAction, type AbilityActionState } from '../src/game/action/ability-action';

function createState(): AbilityActionState {
  return { match: createMatchState(), abilities: createAbilityStates(), boardEffects: [] };
}

function fillBoardExcept(state: AbilityActionState, empties: readonly { row: number; col: number }[]): void {
  const emptyKeys = new Set(empties.map((at) => `${at.row}:${at.col}`));
  for (let row = 0; row < state.match.board.length; row += 1) {
    for (let col = 0; col < state.match.board[row].length; col += 1) {
      state.match.board[row][col] = emptyKeys.has(`${row}:${col}`) ? 0 : 2;
    }
  }
}

describe('ability action resolution', () => {
  it('requires Vanguard Guard to resolve as part of a placement', () => {
    const state = createState();
    state.match.board[4][4] = 1;

    const result = resolveAbilityAction(state, { heroId: 'vanguard', abilityId: 'guard', actor: 1, target: { row: 4, col: 4 } });

    expect(result).toMatchObject({ ok: false, error: 'requires-placement', consumedTurn: false });
    expect(state.boardEffects).toHaveLength(0);
    expect(state.match.phase).toBe('player');
  });

  it('keeps a newly activated cooldown at its full value while advancing existing cooldowns', () => {
    const state = createState();
    state.match.board[4][4] = 1;
    state.abilities[1].cooldowns.guard = 2;

    const result = resolveAbilityAction(state, {
      heroId: 'vanguard',
      abilityId: 'charge',
      actor: 1,
      source: { row: 4, col: 4 },
      target: { row: 4, col: 5 },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.abilities[1].cooldowns.guard).toBe(1);
    expect(result.state.abilities[1].cooldowns.charge).toBe(4);
  });

  it('resolves Vanguard Charge as an adjacent move', () => {
    const state = createState();
    state.match.board[4][4] = 1;

    const result = resolveAbilityAction(state, {
      heroId: 'vanguard',
      abilityId: 'charge',
      actor: 1,
      source: { row: 4, col: 4 },
      target: { row: 4, col: 5 },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.match.board[4][4]).toBe(0);
    expect(result.state.match.board[4][5]).toBe(1);
    expect(result.state.abilities[1].cooldowns.charge).toBe(4);
    expect(result.state.match.phase).toBe('opponent');
  });

  it('rejects Shade Corrupt without enough Pressure', () => {
    const state = createState();
    state.match.board[4][4] = 1;
    state.match.board[4][5] = 2;

    const result = resolveAbilityAction(state, { heroId: 'shade', abilityId: 'corrupt', actor: 1, target: { row: 4, col: 5 } });
    expect(result).toMatchObject({ ok: false, error: 'activation-unavailable' });
  });

  it('spends Shade Pressure and removes an adjacent enemy with Corrupt', () => {
    let state = createState();
    state = { ...state, abilities: setAbilityResource(state.abilities, 1, 'pressure', 3) };
    state.match.board[4][4] = 1;
    state.match.board[4][5] = 2;

    const result = resolveAbilityAction(state, { heroId: 'shade', abilityId: 'corrupt', actor: 1, target: { row: 4, col: 5 } });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.match.board[4][5]).toBe(0);
    expect(result.state.abilities[1].resources.pressure).toBe(0);
    expect(result.state.boardEffects).toContainEqual({
      kind: 'corruption',
      at: { row: 4, col: 5 },
      owner: 1,
      expiry: { kind: 'opponent-turns', remaining: 1 },
    });
  });

  it('resolves Arcanist Phase with Flame zones and refunds one Mana through Flow', () => {
    let state = createState();
    state = { ...state, abilities: setAbilityResource(state.abilities, 1, 'mana', 4) };

    const result = resolveAbilityAction(state, { heroId: 'arcanist', abilityId: 'phase', actor: 1, target: { row: 4, col: 4 } });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.match.board[4][4]).toBe(1);
    expect(result.state.abilities[1].resources.mana).toBe(2);
    expect(result.passive.triggered).toBe(true);
    expect(result.state.boardEffects.filter((effect) => effect.kind === 'flame')).toHaveLength(4);
    expect(result.state.boardEffects.filter((effect) => effect.kind === 'seal')).toHaveLength(0);
    expect(result.state.match.phase).toBe('opponent');
  });

  it('rejects a long-lived Seal that would create a deterministic future placement hard lock', () => {
    let state = createState();
    state = { ...state, abilities: setAbilityResource(state.abilities, 1, 'mana', 5) };
    fillBoardExcept(state, [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 2 },
    ]);

    const result = resolveAbilityAction(state, {
      heroId: 'arcanist',
      abilityId: 'seal',
      actor: 1,
      target: { row: 0, col: 0 },
    });

    expect(result).toMatchObject({ ok: false, error: 'invalid-target' });
  });

  it('allows Seal when enough placement runway remains for its two-opponent-turn lifetime', () => {
    let state = createState();
    state = { ...state, abilities: setAbilityResource(state.abilities, 1, 'mana', 5) };
    fillBoardExcept(state, [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 2 },
      { row: 0, col: 3 },
    ]);

    const result = resolveAbilityAction(state, {
      heroId: 'arcanist',
      abilityId: 'seal',
      actor: 1,
      target: { row: 0, col: 0 },
    });

    expect(result.ok).toBe(true);
  });
});