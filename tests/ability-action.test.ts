import { describe, expect, it } from 'vitest';
import { createMatchState } from '../src/game/match/match-state';
import { createAbilityStates } from '../src/heroes/economies/ability-state';
import { setAbilityCondition, setAbilityResource } from '../src/heroes/economies/ability-economy';
import { resolveAbilityAction, type AbilityActionState } from '../src/game/action/ability-action';

function createState(): AbilityActionState {
  return { match: createMatchState(), abilities: createAbilityStates(), boardEffects: [] };
}

describe('ability action resolution', () => {
  it('resolves Vanguard Guard through cooldown activation and records the ability action', () => {
    const state = createState();
    state.match.board[4][4] = 1;

    const result = resolveAbilityAction(state, { heroId: 'vanguard', abilityId: 'guard', actor: 1, target: { row: 4, col: 4 } });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.boardEffects).toEqual([
      { kind: 'guard', at: { row: 4, col: 4 }, owner: 1, expiry: { kind: 'owner-turns', remaining: 1 } },
    ]);
    expect(result.state.abilities[1].cooldowns.guard).toBe(3);
    expect(result.state.match.actionHistory.at(-1)?.abilityId).toBe('guard');
    expect(result.state.match.phase).toBe('opponent');
  });

  it('keeps a newly activated cooldown at its full value', () => {
    const state = createState();
    state.match.board[4][4] = 1;
    state.abilities[1].cooldowns.blink = 2;

    const result = resolveAbilityAction(state, { heroId: 'vanguard', abilityId: 'guard', actor: 1, target: { row: 4, col: 4 } });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.abilities[1].cooldowns.blink).toBe(1);
    expect(result.state.abilities[1].cooldowns.guard).toBe(3);
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
  });

  it('arms Swordmaster Step as a precommit follow-up without consuming the turn', () => {
    let state = createState();
    state = { ...state, abilities: setAbilityCondition(state.abilities, 1, 'momentum-present', true) };

    const result = resolveAbilityAction(state, { heroId: 'swordmaster', abilityId: 'step', actor: 1, target: { row: 0, col: 0 } });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.consumedTurn).toBe(false);
    expect(result.timing).toBe('precommit-follow-up');
    expect(result.state.timing?.pendingFollowUp).toEqual({ actor: 1, abilityId: 'step', kind: 'precommit' });
    expect(result.state.match.phase).toBe('player');
    expect(result.state.match.turn).toBe(1);
  });
});
