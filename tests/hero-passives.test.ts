import { describe, expect, it } from 'vitest';
import { createBoard } from '../src/game/board/board';
import { evaluatePlacementPattern } from '../src/game/rules/placement-pattern';
import { createAbilityStates } from '../src/heroes/economies/ability-state';
import { getAbilityResource, setAbilityResource } from '../src/heroes/economies/ability-economy';
import { heroes, isLegalLoadout } from '../src/heroes/domain/hero-definition';
import { applyAfterAbilityPassive, applyAfterPlacePassive } from '../src/heroes/domain/passive-engine';

describe('hero definitions', () => {
  it('maps each active hero to its distinct economy engine', () => {
    expect(heroes.vanguard.economy.kind).toBe('cooldown');
    expect(heroes.arcanist.economy.resourceId).toBe('mana');
    expect(heroes.shade.economy.resourceId).toBe('pressure');
  });

  it('keeps one- or two-slot loadouts within the hero skill pool', () => {
    expect(isLegalLoadout('vanguard', ['guard', 'charge'])).toBe(true);
    expect(isLegalLoadout('shade', ['corrupt'])).toBe(true);
    expect(isLegalLoadout('vanguard', ['corrupt', 'charge'])).toBe(false);
    expect(isLegalLoadout('vanguard', [])).toBe(false);
  });
});

describe('hero passive engine', () => {
  it('gives Shade pressure from the shared adjacency outcome', () => {
    const board = createBoard();
    board[4][4] = 1;
    board[4][5] = 2;
    const result = applyAfterPlacePassive(createAbilityStates(), 'shade', {
      pattern: evaluatePlacementPattern(board, { row: 4, col: 4 }, 1),
    });
    expect(result.triggered).toBe(true);
    expect(getAbilityResource(result.states, 1, 'pressure')).toBe(1);
  });

  it('gives Arcanist Mana from a qualifying placement pattern', () => {
    const board = createBoard();
    board[4][2] = 1;
    board[4][3] = 1;
    board[4][4] = 1;
    const result = applyAfterPlacePassive(createAbilityStates(), 'arcanist', {
      pattern: evaluatePlacementPattern(board, { row: 4, col: 4 }, 1),
    });
    expect(result.triggered).toBe(true);
    expect(getAbilityResource(result.states, 1, 'mana')).toBe(1);
  });

  it('refunds one Mana for Arcanist after an ability', () => {
    const states = setAbilityResource(createAbilityStates(), 1, 'mana', 3);
    const result = applyAfterAbilityPassive(states, 'arcanist', 1);
    expect(getAbilityResource(result.states, 1, 'mana')).toBe(4);
  });

  it('emits Vanguard guard from a qualifying placement pattern', () => {
    const board = createBoard();
    board[2][0] = 1;
    board[2][1] = 1;
    board[2][2] = 1;
    const result = applyAfterPlacePassive(createAbilityStates(), 'vanguard', {
      pattern: evaluatePlacementPattern(board, { row: 2, col: 2 }, 1),
    });
    expect(result.boardEffect).toBe('guard');
  });
});
