import { describe, expect, it } from 'vitest';
import { resolveSessionAction } from '../src/game/action/action-session';
import type { AbilityActionState } from '../src/game/action/ability-action';
import { createMatchState } from '../src/game/match/match-state';
import { createAbilityStates } from '../src/heroes/economies/ability-state';
import { setAbilityResource } from '../src/heroes/economies/ability-economy';

function createState(): AbilityActionState {
  return { match: createMatchState(), abilities: createAbilityStates(), boardEffects: [] };
}

describe('R3.1.2 action-cost rework', () => {
  it('resolves Guard and a normal placement as one logical turn', () => {
    const state = createState();
    state.match.board[4][4] = 1;

    const result = resolveSessionAction(state, {
      kind: 'place',
      actor: 1,
      at: { row: 4, col: 5 },
      support: { abilityId: 'guard', target: { row: 4, col: 4 } },
    }, 'vanguard');

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.match.board[4][4]).toBe(1);
    expect(result.state.match.board[4][5]).toBe(1);
    expect(result.state.match.phase).toBe('opponent');
    expect(result.state.match.actionHistory).toHaveLength(1);
    expect(result.state.match.actionHistory[0]).toMatchObject({ kind: 'place', actor: 1, at: { row: 4, col: 5 } });
    expect(result.state.abilities[1].cooldowns.guard).toBe(3);
    expect(result.state.boardEffects).toContainEqual({
      kind: 'guard',
      at: { row: 4, col: 4 },
      owner: 1,
      expiry: { kind: 'owner-turns', remaining: 1 },
    });
  });

  it('rejects an invalid Guard target before mutating the placement', () => {
    const state = createState();

    const result = resolveSessionAction(state, {
      kind: 'place',
      actor: 1,
      at: { row: 4, col: 5 },
      support: { abilityId: 'guard', target: { row: 4, col: 4 } },
    }, 'vanguard');

    expect(result).toMatchObject({ ok: false, error: 'invalid-target' });
    expect(state.match.board[4][5]).toBe(0);
    expect(state.match.phase).toBe('player');
  });

  it('keeps Seal active through two complete opponent turns', () => {
    let state = createState();
    state = { ...state, abilities: setAbilityResource(state.abilities, 1, 'mana', 3) };

    const sealed = resolveSessionAction(state, {
      kind: 'ability',
      heroId: 'arcanist',
      abilityId: 'seal',
      actor: 1,
      target: { row: 4, col: 4 },
    }, 'arcanist');
    expect(sealed.ok).toBe(true);
    if (!sealed.ok) return;
    state = sealed.state;
    expect(state.boardEffects).toContainEqual({
      kind: 'seal',
      at: { row: 4, col: 4 },
      owner: 1,
      expiry: { kind: 'opponent-turns', remaining: 2 },
    });

    const opponentOne = resolveSessionAction(state, { kind: 'place', actor: 2, at: { row: 0, col: 0 } }, 'vanguard');
    expect(opponentOne.ok).toBe(true);
    if (!opponentOne.ok) return;
    state = opponentOne.state;
    expect(state.boardEffects[0]?.expiry).toEqual({ kind: 'opponent-turns', remaining: 1 });

    const ownerTurn = resolveSessionAction(state, { kind: 'place', actor: 1, at: { row: 0, col: 1 } }, 'arcanist');
    expect(ownerTurn.ok).toBe(true);
    if (!ownerTurn.ok) return;
    state = ownerTurn.state;
    expect(state.boardEffects[0]?.expiry).toEqual({ kind: 'opponent-turns', remaining: 1 });

    const opponentTwo = resolveSessionAction(state, { kind: 'place', actor: 2, at: { row: 0, col: 2 } }, 'vanguard');
    expect(opponentTwo.ok).toBe(true);
    if (!opponentTwo.ok) return;
    expect(opponentTwo.state.boardEffects.some((effect) => effect.kind === 'seal')).toBe(false);
  });
});
