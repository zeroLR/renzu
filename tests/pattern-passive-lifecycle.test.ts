import { describe, expect, it } from 'vitest';
import { resolveSessionAction } from '../src/game/action/action-session';
import type { AbilityActionState } from '../src/game/action/ability-action';
import { createMatchState } from '../src/game/match/match-state';
import { createAbilityStates } from '../src/heroes/economies/ability-state';
import { getAbilityResource } from '../src/heroes/economies/ability-economy';

function createState(): AbilityActionState {
  return { match: createMatchState(), abilities: createAbilityStates(), boardEffects: [] };
}

function horizontalTwo(): AbilityActionState {
  const state = createState();
  state.match.board[4][2] = 1;
  state.match.board[4][3] = 1;
  return state;
}

describe('pattern/passive session lifecycle', () => {
  it('gives Arcanist Mana when placement creates a three', () => {
    const result = resolveSessionAction(horizontalTwo(), { kind: 'place', actor: 1, at: { row: 4, col: 4 } }, 'arcanist');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(getAbilityResource(result.state.abilities, 1, 'mana')).toBe(1);
    expect(result.state.match.phase).toBe('opponent');
  });

  it('materializes Vanguard Fortified as a short-lived guard on the pattern stone', () => {
    const result = resolveSessionAction(horizontalTwo(), { kind: 'place', actor: 1, at: { row: 4, col: 4 } }, 'vanguard');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.boardEffects).toContainEqual({
      kind: 'guard', at: { row: 4, col: 4 }, owner: 1, expiry: { kind: 'opponent-turns', remaining: 1 },
    });
  });

  it('gives Shade Pressure when the placement is adjacent to an enemy', () => {
    const state = createState();
    state.match.board[4][5] = 2;
    const result = resolveSessionAction(state, { kind: 'place', actor: 1, at: { row: 4, col: 4 } }, 'shade');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(getAbilityResource(result.state.abilities, 1, 'pressure')).toBe(1);
    expect(result.state.match.phase).toBe('opponent');
  });

  it('does not grant Arcanist pattern Mana when the placement wins with five', () => {
    const state = createState();
    for (let col = 0; col < 4; col += 1) state.match.board[4][col] = 1;
    const result = resolveSessionAction(state, { kind: 'place', actor: 1, at: { row: 4, col: 4 } }, 'arcanist');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.match.status).toBe('victory');
    expect(getAbilityResource(result.state.abilities, 1, 'mana')).toBe(0);
  });
});
